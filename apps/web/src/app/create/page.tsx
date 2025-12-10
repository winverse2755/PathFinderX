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
  useAddClue,
  useFundHunt,
  usePublishHunt,
  useSelectHunt,
  useCUSDBalance,
  useCUSDAllowance,
  useApproveCUSD,
} from "@/hooks/use-treasure-hunt";
import { formatCUSD, parseCUSD, validateReward } from "@/lib/treasure-hunt-utils";
import { TREASURE_HUNT_CREATOR_ADDRESS } from "@/lib/contract-abis";

type ClueData = {
  clueText: string;
  answer: string;
  reward: string;
  location: string;
};

const steps = [
  { id: "register", label: "Register", number: 1 },
  { id: "create", label: "Create", number: 2 },
  { id: "clues", label: "Add Clues", number: 3 },
  { id: "fund", label: "Fund", number: 4 },
  { id: "publish", label: "Publish", number: 5 },
];

export default function CreateHuntPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { isCreator } = useIsCreator();
  const { registerCreator, isPending: isRegistering, isConfirmed: isRegistered } =
    useRegisterCreator();
  const { createHunt, isPending: isCreating, isConfirmed: huntCreated } =
    useCreateHunt();
  const { addClue, isPending: isAddingClue, isConfirmed: clueAdded, error: addClueError } = useAddClue();
  const { fundHunt, isPending: isFunding, isConfirmed: huntFunded, error: fundErrorHook } = useFundHunt();
  const { publishHunt, isPending: isPublishing, isConfirmed: huntPublished } = usePublishHunt();
  const { approveCUSD, isPending: isApproving, error: approveErrorHook } = useApproveCUSD();
  const { balance } = useCUSDBalance();

  const [step, setStep] = useState<"register" | "create" | "clues" | "fund" | "publish">(
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
  const { hunt } = useSelectHunt(huntId);
  const contractTotalReward = hunt?.totalReward ?? BigInt(0);
  const localTotalRewards = clues.reduce(
    (sum, clue) => sum + parseCUSD(clue.reward),
    BigInt(0)
  );
  const totalRewards = contractTotalReward > BigInt(0) ? contractTotalReward : localTotalRewards;
  const { allowance } = useCUSDAllowance(TREASURE_HUNT_CREATOR_ADDRESS);
  
  const [fundError, setFundError] = useState<string | null>(null);
  const [approveError, setApproveError] = useState<string | null>(null);
  const [addClueErrorState, setAddClueErrorState] = useState<string | null>(null);

  if (!isCreator && step === "register" && isRegistered) {
    setStep("create");
  }
  if (step === "fund" && huntFunded) {
    setStep("publish");
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
    createHunt(huntTitle, huntDescription);
  };

  const handleAddClue = async () => {
    const validation = validateReward(currentClue.reward);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }
    if (!currentClue.clueText.trim()) {
      alert("Please enter clue text");
      return;
    }
    if (!currentClue.answer.trim()) {
      alert("Please enter an answer");
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

    setAddClueErrorState(null);

    try {
      await addClue(huntId, currentClue.clueText, currentClue.answer, currentClue.reward, currentClue.location);
    } catch (err: any) {
      const errorMessage = err.message || err.toString() || "Failed to add clue";
      setAddClueErrorState(errorMessage);
      console.error("Error adding clue:", err);
    }
  };

  useEffect(() => {
    if (clueAdded) {
      setClues(prevClues => [...prevClues, { ...currentClue }]);
      setCurrentClue({
        clueText: "",
        answer: "",
        reward: "0.5",
        location: "",
      });
      setAddClueErrorState(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clueAdded]);

  useEffect(() => {
    if (addClueError) {
      const errorMessage = addClueError.message || addClueError.toString() || "Failed to add clue";
      setAddClueErrorState(errorMessage);
    }
  }, [addClueError]);

  const handleFundHunt = async () => {
    if (huntId === null) {
      setFundError("Please create the hunt first");
      return;
    }

    setFundError(null);
    setApproveError(null);

    if (allowance < totalRewards) {
      try {
        approveCUSD(
          TREASURE_HUNT_CREATOR_ADDRESS,
          totalRewards * BigInt(2)
        );
      } catch (err: any) {
        setApproveError(err.message || "Failed to approve cUSD");
      }
      return;
    }

    let fundingAmount = totalRewards;
    
    if (contractTotalReward > BigInt(0)) {
      fundingAmount = contractTotalReward > totalRewards ? contractTotalReward : totalRewards;
    }
    
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

  const getCurrentStepIndex = () => {
    return steps.findIndex(s => s.id === step);
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-game-bg bg-grid-pattern">
        <div className="absolute inset-0 bg-gradient-radial"></div>
        <div className="container relative mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-4xl">
          <Card className="text-center">
            <CardContent className="pt-6 sm:pt-8 pb-6 sm:pb-8">
              <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-full bg-game-primary/20 flex items-center justify-center">
                <span className="text-2xl sm:text-3xl">🔗</span>
              </div>
              <p className="font-game text-lg sm:text-xl text-game-text-muted">Please connect your wallet</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-game-bg bg-grid-pattern relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-radial"></div>
      
      <div className="container relative mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-4xl">
        <Button variant="ghost" onClick={() => router.push("/")} className="mb-4 sm:mb-6 text-sm sm:text-base">
          ← Back
        </Button>

        {/* Step Progress */}
        <Card className="mb-6 sm:mb-8">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="gradient-text text-xl sm:text-2xl">Create Treasure Hunt</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Step {getCurrentStepIndex() + 1} of {steps.length}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="flex items-center justify-between">
              {steps.map((s, index) => (
                <div key={s.id} className="flex items-center">
                  <div className={`
                    w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-game font-bold text-xs sm:text-sm
                    transition-all duration-300
                    ${index <= getCurrentStepIndex() 
                      ? 'bg-game-primary text-white shadow-glow-primary' 
                      : 'bg-game-surface border border-game-primary/30 text-game-text-muted'}
                  `}>
                    {s.number}
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`
                      w-4 sm:w-8 md:w-16 h-0.5 sm:h-1 mx-0.5 sm:mx-1 md:mx-2 rounded-full transition-all duration-300
                      ${index < getCurrentStepIndex() ? 'bg-game-primary' : 'bg-game-surface'}
                    `} />
                  )}
                </div>
              ))}
            </div>
            <div className="hidden sm:flex justify-between mt-2">
              {steps.map((s) => (
                <span key={s.id} className="font-game text-xs text-game-text-muted">
                  {s.label}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        {step === "register" && (
          <Card className="animate-fade-in">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl">Register as Creator</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                One-time registration to create hunts (small gas fee)
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              {isCreator ? (
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-game-success/20 border border-game-success/50 rounded-md">
                    <span className="text-game-success text-lg sm:text-xl">✓</span>
                    <span className="font-game text-sm sm:text-base text-game-success">You&apos;re already registered!</span>
                  </div>
                  <Button onClick={() => setStep("create")} className="w-full">
                    Continue
                  </Button>
                </div>
              ) : (
                <Button onClick={handleRegister} disabled={isRegistering} className="w-full">
                  {isRegistering ? "Registering..." : "Register as Creator"}
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {step === "create" && (
          <Card className="animate-fade-in">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl">Create Hunt</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Enter basic hunt information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6 pt-0">
              <div>
                <label className="block font-game text-xs sm:text-sm text-game-text-muted mb-2">
                  Title (max 100 chars)
                </label>
                <input
                  type="text"
                  value={huntTitle}
                  onChange={(e) => setHuntTitle(e.target.value)}
                  maxLength={100}
                  className="w-full h-10 sm:h-12 bg-game-surface border border-game-primary/30 rounded-md px-3 sm:px-4 font-game text-sm sm:text-base text-white placeholder:text-game-text-muted/60 focus:outline-none focus:ring-2 focus:ring-game-primary transition-all"
                  placeholder="Downtown Adventure"
                />
              </div>
              <div>
                <label className="block font-game text-xs sm:text-sm text-game-text-muted mb-2">
                  Description (max 500 chars)
                </label>
                <textarea
                  value={huntDescription}
                  onChange={(e) => setHuntDescription(e.target.value)}
                  maxLength={500}
                  rows={4}
                  className="w-full bg-game-surface border border-game-primary/30 rounded-md px-3 sm:px-4 py-2 sm:py-3 font-game text-sm sm:text-base text-white placeholder:text-game-text-muted/60 focus:outline-none focus:ring-2 focus:ring-game-primary transition-all resize-none"
                  placeholder="Explore 5 local landmarks..."
                />
                <p className="font-game text-xs text-game-text-muted mt-1 sm:mt-2">
                  {huntDescription.length} / 500
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={handleCreateHunt} disabled={isCreating || !huntTitle.trim()} className="w-full sm:w-auto">
                  {isCreating ? "Creating..." : "Create Hunt"}
                </Button>
                {huntCreated && (
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 flex-1">
                    <input
                      type="number"
                      placeholder="Enter Hunt ID"
                      onChange={(e) => {
                        const id = parseInt(e.target.value, 10);
                        if (!isNaN(id)) setHuntId(id);
                      }}
                      className="flex-1 h-10 sm:h-12 bg-game-surface border border-game-primary/30 rounded-md px-3 sm:px-4 font-game text-sm sm:text-base text-white placeholder:text-game-text-muted/60 focus:outline-none focus:ring-2 focus:ring-game-primary transition-all"
                    />
                    <Button onClick={() => setStep("clues")} disabled={huntId === null} variant="secondary" className="w-full sm:w-auto">
                      Continue
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {step === "clues" && (
          <Card className="animate-fade-in">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl">Add Clues</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Add clues one by one. You&apos;ve added <span className="text-game-accent font-bold">{clues.length}</span> clue(s).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6 pt-0">
              <div>
                <label className="block font-game text-xs sm:text-sm text-game-text-muted mb-2">
                  Clue Text (max 500 chars)
                </label>
                <textarea
                  value={currentClue.clueText}
                  onChange={(e) =>
                    setCurrentClue({ ...currentClue, clueText: e.target.value })
                  }
                  maxLength={500}
                  rows={3}
                  className="w-full bg-game-surface border border-game-primary/30 rounded-md px-3 sm:px-4 py-2 sm:py-3 font-game text-sm sm:text-base text-white placeholder:text-game-text-muted/60 focus:outline-none focus:ring-2 focus:ring-game-primary transition-all resize-none"
                  placeholder="Find the statue in the square"
                />
              </div>
              <div>
                <label className="block font-game text-xs sm:text-sm text-game-text-muted mb-2">Answer</label>
                <input
                  type="text"
                  value={currentClue.answer}
                  onChange={(e) =>
                    setCurrentClue({ ...currentClue, answer: e.target.value })
                  }
                  className="w-full h-10 sm:h-12 bg-game-surface border border-game-primary/30 rounded-md px-3 sm:px-4 font-game text-sm sm:text-base text-white placeholder:text-game-text-muted/60 focus:outline-none focus:ring-2 focus:ring-game-primary transition-all"
                  placeholder="LIBERTY"
                />
              </div>
              <div>
                <label className="block font-game text-xs sm:text-sm text-game-text-muted mb-2">
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
                  className="w-full h-10 sm:h-12 bg-game-surface border border-game-primary/30 rounded-md px-3 sm:px-4 font-game text-sm sm:text-base text-white placeholder:text-game-text-muted/60 focus:outline-none focus:ring-2 focus:ring-game-primary transition-all"
                />
              </div>
              <div>
                <label className="block font-game text-xs sm:text-sm text-game-text-muted mb-2">
                  Location (max 100 chars)
                </label>
                <input
                  type="text"
                  value={currentClue.location}
                  onChange={(e) =>
                    setCurrentClue({ ...currentClue, location: e.target.value })
                  }
                  maxLength={100}
                  className="w-full h-10 sm:h-12 bg-game-surface border border-game-primary/30 rounded-md px-3 sm:px-4 font-game text-sm sm:text-base text-white placeholder:text-game-text-muted/60 focus:outline-none focus:ring-2 focus:ring-game-primary transition-all"
                  placeholder="Town Square"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={handleAddClue} disabled={isAddingClue} className="w-full sm:w-auto">
                  {isAddingClue ? "Adding..." : "Add Clue"}
                </Button>
                {clues.length > 0 && (
                  <Button variant="secondary" onClick={() => setStep("fund")} className="w-full sm:w-auto">
                    Continue to Funding ({clues.length} clues)
                  </Button>
                )}
              </div>
              {addClueErrorState && (
                <div className="p-3 sm:p-4 bg-game-error/20 border border-game-error/50 rounded-md animate-fade-in">
                  <p className="font-game text-xs sm:text-sm text-game-error break-words">Error: {addClueErrorState}</p>
                </div>
              )}

              {clues.length > 0 && (
                <div className="mt-4 sm:mt-6 space-y-2 sm:space-y-3">
                  <h3 className="font-game text-base sm:text-lg text-white">Added Clues:</h3>
                  {clues.map((clue, idx) => (
                    <div key={idx} className="p-3 sm:p-4 bg-game-bg/50 border border-game-primary/20 rounded-md">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="token-rare px-2 py-0.5 sm:py-1 text-xs font-game font-semibold">
                          Clue {idx + 1}
                        </span>
                        <span className="font-game text-xs sm:text-sm text-game-secondary">
                          {clue.reward} cUSD
                        </span>
                      </div>
                      <p className="font-game text-xs sm:text-sm text-game-text-muted line-clamp-2">{clue.clueText}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {step === "fund" && (
          <Card className="animate-fade-in">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl">Fund Hunt</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Deposit cUSD to fund all clue rewards
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6 pt-0">
              <div className="p-3 sm:p-4 bg-game-bg/50 border border-game-primary/30 rounded-md space-y-2 sm:space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-game text-xs sm:text-sm text-game-text-muted">Your Balance:</span>
                  <span className="font-game text-sm sm:text-lg text-white font-bold">{formatCUSD(balance)} cUSD</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-game text-xs sm:text-sm text-game-text-muted">Total Rewards Needed:</span>
                  <span className="font-game text-sm sm:text-lg text-game-secondary font-bold">{formatCUSD(totalRewards)} cUSD</span>
                </div>
                {contractTotalReward > BigInt(0) && contractTotalReward !== localTotalRewards && (
                  <p className="font-game text-xs sm:text-sm text-game-warning">
                    Note: Contract shows {formatCUSD(contractTotalReward)} cUSD (using contract value)
                  </p>
                )}
                {balance < totalRewards && (
                  <p className="font-game text-xs sm:text-sm text-game-error">
                    Insufficient balance. You need {formatCUSD(totalRewards - balance)} more cUSD.
                  </p>
                )}
              </div>

              {allowance < totalRewards ? (
                <>
                  <Button
                    onClick={handleFundHunt}
                    disabled={isApproving || balance < totalRewards}
                    className="w-full"
                  >
                    {isApproving ? "Approving..." : "Approve cUSD"}
                  </Button>
                  {approveError && (
                    <div className="p-3 sm:p-4 bg-game-error/20 border border-game-error/50 rounded-md">
                      <p className="font-game text-xs sm:text-sm text-game-error break-words">Error: {approveError}</p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <Button
                    onClick={handleFundHunt}
                    disabled={isFunding || balance < totalRewards}
                    className="w-full"
                  >
                    {isFunding ? "Funding..." : "Fund Hunt"}
                  </Button>
                  {fundError && (
                    <div className="p-3 sm:p-4 bg-game-error/20 border border-game-error/50 rounded-md">
                      <p className="font-game text-xs sm:text-sm text-game-error break-words">Error: {fundError}</p>
                      <p className="font-game text-xs text-game-text-muted mt-2">
                        Make sure you have approved enough cUSD and that the funding amount matches the contract&apos;s total reward.
                      </p>
                    </div>
                  )}
                </>
              )}

              {huntFunded && (
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-game-success/20 border border-game-success/50 rounded-md">
                    <span className="text-game-success text-lg sm:text-xl">✓</span>
                    <span className="font-game text-sm sm:text-base text-game-success">Hunt funded successfully!</span>
                  </div>
                  <Button onClick={() => setStep("publish")} className="w-full">
                    Continue to Publish
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {step === "publish" && (
          <Card className="animate-fade-in">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl">Publish Hunt</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Make your hunt visible to players</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6 pt-0">
              <Button onClick={handlePublish} disabled={isPublishing} className="w-full">
                {isPublishing ? "Publishing..." : "Publish Hunt"}
              </Button>
              {huntPublished && (
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-game-success/20 border border-game-success/50 rounded-md">
                    <span className="text-game-success text-lg sm:text-xl">✓</span>
                    <span className="font-game text-sm sm:text-base text-game-success">Hunt published!</span>
                  </div>
                  <Button onClick={() => router.push("/")} className="w-full" variant="secondary">
                    Done - View All Hunts
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
