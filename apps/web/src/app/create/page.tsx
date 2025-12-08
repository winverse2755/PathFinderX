"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  useIsCreator,
  useRegisterCreator,
  useCreateHunt,
  useAddClueWithGeneratedQr,
  useFundHunt,
  usePublishHunt,
  useSelectHunt,
  useCUSDBalance,
  useCUSDAllowance,
  useApproveCUSD,
  useFetchQRCodes,
} from "@/hooks/use-treasure-hunt";
import { formatCUSD, parseCUSD, validateReward } from "@/lib/treasure-hunt-utils";
import { TREASURE_HUNT_CREATOR_ADDRESS, CUSD_ADDRESS } from "@/lib/contract-abis";
import QRCode from "qrcode";

type ClueData = {
  clueText: string;
  answer: string;
  reward: string;
  location: string;
};

export default function CreateHuntPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { isCreator } = useIsCreator();
  const { registerCreator, isPending: isRegistering, isConfirmed: isRegistered } =
    useRegisterCreator();
  const { createHunt, isPending: isCreating, isConfirmed: huntCreated, hash: createHash } =
    useCreateHunt();
  const { addClueWithGeneratedQr, isPending: isAddingClue, isConfirmed: clueAdded } = useAddClueWithGeneratedQr();
  const { fundHunt, isPending: isFunding, isConfirmed: huntFunded, error: fundErrorHook } = useFundHunt();
  const { publishHunt, isPending: isPublishing, isConfirmed: huntPublished, error: publishError } = usePublishHunt();
  const { approveCUSD, isPending: isApproving, isConfirmed: cUSDApproved, error: approveErrorHook } = useApproveCUSD();
  const { balance } = useCUSDBalance();

  const [step, setStep] = useState<"register" | "create" | "clues" | "fund" | "publish" | "qr">(
    "register"
  );
  const [huntId, setHuntId] = useState<number | null>(null);
  const [huntTitle, setHuntTitle] = useState("");
  const [huntDescription, setHuntDescription] = useState("");
  const [clues, setClues] = useState<ClueData[]>([]);
  const [currentClue, setCurrentClue] = useState<ClueData>({
    clueText: "",
    answer: "",
    reward: "0.5",
    location: "",
  });
  const [qrCodes, setQrCodes] = useState<string[]>([]);

  const { hunt } = useSelectHunt(huntId);
  const { qrStrings, isLoading: isLoadingQRs, error: qrError, fetchQRCodes } = useFetchQRCodes(huntId);
  // Use the contract's totalReward instead of calculating locally
  const contractTotalReward = hunt?.totalReward ?? BigInt(0);
  const localTotalRewards = clues.reduce(
    (sum, clue) => sum + parseCUSD(clue.reward),
    BigInt(0)
  );
  // Use contract's totalReward if available, otherwise fall back to local calculation
  const totalRewards = contractTotalReward > BigInt(0) ? contractTotalReward : localTotalRewards;
  const { allowance } = useCUSDAllowance(TREASURE_HUNT_CREATOR_ADDRESS);
  
  // Error state for displaying transaction errors
  const [fundError, setFundError] = useState<string | null>(null);
  const [approveError, setApproveError] = useState<string | null>(null);

  // Auto-advance steps
  if (!isCreator && step === "register" && isRegistered) {
    setStep("create");
  }
  if (step === "create" && huntCreated && huntId === null) {
    // Extract hunt ID from transaction (we'll need to listen to events or use a different approach)
    // For now, we'll use a state update
  }
  if (step === "fund" && huntFunded) {
    setStep("publish");
  }
  if (step === "publish" && huntPublished) {
    setStep("qr");
  }

  const handleRegister = () => {
    if (!isConnected) {
      alert("Please connect your wallet");
      return;
    }
    registerCreator();
  };

  const handleCreateHunt = () => {
    if (!huntTitle.trim()) {
      alert("Please enter a title");
      return;
    }
    if (huntDescription.length > 500) {
      alert("Description too long (max 500 characters)");
      return;
    }
    // Note: New contract only takes title and description
    createHunt(huntTitle, huntDescription);
    // Note: In production, you'd listen to the HuntCreated event to get the huntId
    // For now, we'll use a workaround - you'll need to manually enter the hunt ID
    // or implement event listening
  };

  const handleAddClue = () => {
    const validation = validateReward(currentClue.reward);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }
    if (!currentClue.clueText.trim()) {
      alert("Please enter clue text");
      return;
    }
    if (!currentClue.location.trim()) {
      alert("Please enter a location");
      return;
    }

    if (huntId === null) {
      alert("Please create the hunt first");
      return;
    }

    // Note: addClueWithGeneratedQr returns a QR string, but we can't capture it from the hook
    // The contract generates the QR internally and stores it
    addClueWithGeneratedQr(huntId, currentClue.clueText, currentClue.reward, currentClue.location);
    
    // Add to local state
    setClues([...clues, { ...currentClue }]);
    setCurrentClue({
      clueText: "",
      answer: "",
      reward: "0.5",
      location: "",
    });
  };

  const handleFundHunt = async () => {
    if (huntId === null) {
      setFundError("Please create the hunt first");
      return;
    }

    // Clear previous errors
    setFundError(null);
    setApproveError(null);

    // Check if approval is needed
    if (allowance < totalRewards) {
      try {
        // First approve - approve more than needed to avoid multiple approvals
        approveCUSD(
          TREASURE_HUNT_CREATOR_ADDRESS,
          totalRewards * BigInt(2) // Approve 2x to be safe
        );
      } catch (err: any) {
        setApproveError(err.message || "Failed to approve cUSD");
      }
      return;
    }

    // Then fund - use the contract's totalReward to ensure it matches
    // The contract requires: _amount >= hunt.totalReward
    // So we must fund with at least the contract's totalReward
    let fundingAmount = totalRewards;
    
    if (contractTotalReward > BigInt(0)) {
      // Use contract's totalReward, but ensure we're funding with at least that amount
      fundingAmount = contractTotalReward > totalRewards ? contractTotalReward : totalRewards;
    }
    
    // Ensure we have enough balance
    if (balance < fundingAmount) {
      setFundError(`Insufficient balance. You need ${formatCUSD(fundingAmount)} cUSD but only have ${formatCUSD(balance)} cUSD.`);
      return;
    }
    
    try {
      fundHunt(huntId, formatCUSD(fundingAmount));
    } catch (err: any) {
      setFundError(err.message || "Failed to fund hunt");
    }
  };

  // Display errors from hooks
  useEffect(() => {
    if (fundErrorHook) {
      const errorMessage = fundErrorHook.message || fundErrorHook.toString() || "Transaction failed";
      setFundError(errorMessage);
    }
  }, [fundErrorHook]);

  useEffect(() => {
    if (approveErrorHook) {
      const errorMessage = approveErrorHook.message || approveErrorHook.toString() || "Approval failed";
      setApproveError(errorMessage);
    }
  }, [approveErrorHook]);

  const handlePublish = () => {
    if (huntId === null) {
      alert("Please create the hunt first");
      return;
    }
    publishHunt(huntId);
  };

  const generateQRCodes = async () => {
    if (huntId === null) return;

    // Fetch QR strings from events
    await fetchQRCodes();

    // Wait a bit for state to update
    await new Promise(resolve => setTimeout(resolve, 100));

    // Check if we have QR strings (need to access from the hook's state)
    // Since we can't directly access qrStrings here, we'll generate images after fetch
  };

  // Generate QR code images when qrStrings are available
  useEffect(() => {
    if (qrStrings.length > 0 && qrCodes.length === 0) {
      const generateImages = async () => {
        try {
          const qrImages = await Promise.all(
            qrStrings.map((qrString) => QRCode.toDataURL(qrString, { width: 300, margin: 2 }))
          );
          setQrCodes(qrImages);
        } catch (err: any) {
          console.error("Error generating QR code images:", err);
          alert("Failed to generate QR code images: " + (err.message || "Unknown error"));
        }
      };
      generateImages();
    }
  }, [qrStrings, qrCodes.length]);

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-500">Please connect your wallet</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Button variant="ghost" onClick={() => router.push("/")} className="mb-4">
        ← Back
      </Button>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Create Treasure Hunt</CardTitle>
          <CardDescription>
            Step {step === "register" ? 1 : step === "create" ? 2 : step === "clues" ? 3 : step === "fund" ? 4 : step === "publish" ? 5 : 6} of 6
          </CardDescription>
        </CardHeader>
      </Card>

      {step === "register" && (
        <Card>
          <CardHeader>
            <CardTitle>Register as Creator</CardTitle>
            <CardDescription>
              One-time registration to create hunts (small gas fee)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isCreator ? (
              <div>
                <p className="text-green-600 mb-4">✓ You're already registered!</p>
                <Button onClick={() => setStep("create")}>Continue</Button>
              </div>
            ) : (
              <Button onClick={handleRegister} disabled={isRegistering}>
                {isRegistering ? "Registering..." : "Register as Creator"}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {step === "create" && (
        <Card>
          <CardHeader>
            <CardTitle>Create Hunt</CardTitle>
            <CardDescription>Enter basic hunt information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title (max 100 chars)</label>
              <input
                type="text"
                value={huntTitle}
                onChange={(e) => setHuntTitle(e.target.value)}
                maxLength={100}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="Downtown Adventure"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Description (max 500 chars)
              </label>
              <textarea
                value={huntDescription}
                onChange={(e) => setHuntDescription(e.target.value)}
                maxLength={500}
                rows={4}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="Explore 5 local landmarks..."
              />
              <p className="text-xs text-gray-500 mt-1">
                {huntDescription.length} / 500
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreateHunt} disabled={isCreating || !huntTitle.trim()}>
                {isCreating ? "Creating..." : "Create Hunt"}
              </Button>
              {huntCreated && (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Enter Hunt ID"
                    onChange={(e) => {
                      const id = parseInt(e.target.value, 10);
                      if (!isNaN(id)) setHuntId(id);
                    }}
                    className="px-4 py-2 border rounded-lg"
                  />
                  <Button onClick={() => setStep("clues")} disabled={huntId === null}>
                    Continue
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {step === "clues" && (
        <Card>
          <CardHeader>
            <CardTitle>Add Clues</CardTitle>
            <CardDescription>
              Add clues one by one. You've added {clues.length} clue(s).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Clue Text (max 500 chars)</label>
              <textarea
                value={currentClue.clueText}
                onChange={(e) =>
                  setCurrentClue({ ...currentClue, clueText: e.target.value })
                }
                maxLength={500}
                rows={3}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="Find the statue in the square"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Answer</label>
              <input
                type="text"
                value={currentClue.answer}
                onChange={(e) =>
                  setCurrentClue({ ...currentClue, answer: e.target.value })
                }
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="LIBERTY"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Reward (0.01 - 10.00 cUSD)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max="10"
                value={currentClue.reward}
                onChange={(e) =>
                  setCurrentClue({ ...currentClue, reward: e.target.value })
                }
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Location (optional, max 100 chars)
              </label>
              <input
                type="text"
                value={currentClue.location}
                onChange={(e) =>
                  setCurrentClue({ ...currentClue, location: e.target.value })
                }
                maxLength={100}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="Town Square"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddClue} disabled={isAddingClue}>
                {isAddingClue ? "Adding..." : "Add Clue"}
              </Button>
              {clues.length > 0 && (
                <Button variant="outline" onClick={() => setStep("fund")}>
                  Continue to Funding ({clues.length} clues)
                </Button>
              )}
            </div>

            {clues.length > 0 && (
              <div className="mt-6 space-y-2">
                <h3 className="font-medium">Added Clues:</h3>
                {clues.map((clue, idx) => (
                  <div key={idx} className="p-3 bg-gray-50 rounded">
                    <p className="font-medium">Clue {idx + 1}</p>
                    <p className="text-sm text-gray-600">{clue.clueText}</p>
                    <p className="text-xs text-gray-500">Reward: {clue.reward} cUSD</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {step === "fund" && (
        <Card>
          <CardHeader>
            <CardTitle>Fund Hunt</CardTitle>
            <CardDescription>
              Deposit cUSD to fund all clue rewards. Your balance: {formatCUSD(balance)} cUSD
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 border-4 border-celo-purple bg-celo-tan-light">
              <div className="flex justify-between mb-2">
                <span className="text-body-bold text-celo-purple">Total Rewards Needed:</span>
                <span className="text-body-bold text-lg text-celo-purple font-bold">{formatCUSD(totalRewards)} cUSD</span>
              </div>
              {contractTotalReward > BigInt(0) && contractTotalReward !== localTotalRewards && (
                <p className="text-body-bold text-sm text-celo-brown mt-2">
                  Note: Contract shows {formatCUSD(contractTotalReward)} cUSD (using contract value)
                </p>
              )}
              {balance < totalRewards && (
                <p className="text-body-bold text-sm text-celo-orange mt-2">
                  Insufficient balance. You need {formatCUSD(totalRewards - balance)} more cUSD.
                </p>
              )}
            </div>

            {allowance < totalRewards ? (
              <>
                <Button
                  onClick={handleFundHunt}
                  disabled={isApproving || balance < totalRewards}
                >
                  {isApproving ? "Approving..." : "Approve cUSD"}
                </Button>
                {approveError && (
                  <div className="mt-4 p-4 border-4 border-celo-orange bg-celo-orange/20">
                    <p className="text-body-bold text-celo-purple">Error: {approveError}</p>
                  </div>
                )}
              </>
            ) : (
              <>
                <Button
                  onClick={handleFundHunt}
                  disabled={isFunding || balance < totalRewards}
                >
                  {isFunding ? "Funding..." : "Fund Hunt"}
                </Button>
                {fundError && (
                  <div className="mt-4 p-4 border-4 border-celo-orange bg-celo-orange/20">
                    <p className="text-body-bold text-celo-purple">Error: {fundError}</p>
                    <p className="text-sm text-celo-brown mt-2">
                      Make sure you have approved enough cUSD and that the funding amount matches the contract's total reward.
                    </p>
                  </div>
                )}
              </>
            )}

            {huntFunded && (
              <div className="mt-4">
                <p className="text-green-600 mb-2">✓ Hunt funded successfully!</p>
                <Button onClick={() => setStep("publish")}>Continue to Publish</Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {step === "publish" && (
        <Card>
          <CardHeader>
            <CardTitle>Publish Hunt</CardTitle>
            <CardDescription>Make your hunt visible to players</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handlePublish} disabled={isPublishing}>
              {isPublishing ? "Publishing..." : "Publish Hunt"}
            </Button>
            {huntPublished && (
              <div className="mt-4">
                <p className="text-green-600 mb-2">✓ Hunt published!</p>
                <Button onClick={() => setStep("qr")}>Generate QR Codes</Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {step === "qr" && (
        <Card>
          <CardHeader>
            <CardTitle>QR Codes</CardTitle>
            <CardDescription>Download QR codes for your clues</CardDescription>
          </CardHeader>
          <CardContent>
            {qrCodes.length === 0 ? (
              <div className="space-y-4">
                <Button onClick={generateQRCodes} disabled={isLoadingQRs || huntId === null}>
                  {isLoadingQRs ? "Loading QR Codes..." : "Generate QR Codes"}
                </Button>
                {qrError && (
                  <p className="text-red-600 text-sm">
                    Error: {qrError.message || "Failed to fetch QR codes"}
                  </p>
                )}
                {qrStrings.length > 0 && qrCodes.length === 0 && (
                  <p className="text-yellow-600 text-sm">
                    Found {qrStrings.length} QR code(s), generating images...
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {qrCodes.map((qr, idx) => (
                    <div key={idx} className="text-center border-2 border-celo-purple p-4 rounded">
                      <p className="text-body-bold text-celo-purple mb-2">Clue {idx + 1}</p>
                      <img src={qr} alt={`QR Code ${idx + 1}`} className="mx-auto border-2 border-celo-yellow" />
                      <div className="mt-3 space-y-2">
                        <a
                          href={qr}
                          download={`hunt-${huntId}-clue-${idx + 1}.png`}
                          className="block"
                        >
                          <Button variant="outline" className="w-full border-2">
                            Download QR Code
                          </Button>
                        </a>
                        <p className="text-xs text-celo-brown break-all">{qrStrings[idx]}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Button onClick={generateQRCodes} variant="outline" className="w-full">
                  Refresh QR Codes
                </Button>
              </div>
            )}
            <div className="mt-6">
              <Button onClick={() => router.push("/")} className="w-full">
                Done - View All Hunts
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

