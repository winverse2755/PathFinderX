"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QRScanner } from "@/components/qr-scanner";
import { useHunt, useClue, usePlayerProgress, useSubmitAnswer } from "@/hooks/use-treasure-hunt";
import { formatCUSD, hashAnswer, normalizeAnswer } from "@/lib/treasure-hunt-utils";
import { parseQRCodeURL } from "@/lib/constants";
import { useSendTransaction, useWaitForTransactionReceipt } from "wagmi";
import { CUSD_ADDRESS, ERC20_ABI } from "@/lib/constants";
import { parseUnits } from "viem";

export default function HuntPage() {
  const params = useParams();
  const router = useRouter();
  const huntId = parseInt(params.id as string, 10);
  const { address, isConnected } = useAccount();
  const { hunt } = useHunt(huntId);
  const { progress } = usePlayerProgress(huntId);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [manualAnswer, setManualAnswer] = useState("");
  const [showManualInput, setShowManualInput] = useState(false);
  const [currentClueIndex, setCurrentClueIndex] = useState(0);
  const [submissionStatus, setSubmissionStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  const { submitAnswer, hash, isPending, isConfirming, isConfirmed, error } = useSubmitAnswer();

  // Determine current clue index
  useEffect(() => {
    if (progress) {
      if (progress.hasStarted) {
        setCurrentClueIndex(Number(progress.currentClueIndex));
      } else {
        setCurrentClueIndex(0);
      }
    }
  }, [progress]);

  const { clue } = useClue(huntId, currentClueIndex);

  const handleQRScan = (result: string) => {
    setShowQRScanner(false);
    const parsed = parseQRCodeURL(result);
    if (parsed && parsed.huntId === huntId && parsed.clueIndex === currentClueIndex) {
      // Extract answer from QR (we'll need to store it when generating QR)
      // For now, we'll use manual input
      setShowManualInput(true);
    } else {
      setSubmissionStatus({
        type: "error",
        message: "Invalid QR code for this clue",
      });
    }
  };

  const handleSubmitAnswer = async (answer: string) => {
    if (!isConnected || !address) {
      setSubmissionStatus({
        type: "error",
        message: "Please connect your wallet",
      });
      return;
    }

    if (!answer.trim()) {
      setSubmissionStatus({
        type: "error",
        message: "Please enter an answer",
      });
      return;
    }

    try {
      submitAnswer(huntId, currentClueIndex, answer);
      setSubmissionStatus({ type: null, message: "" });
    } catch (err: any) {
      setSubmissionStatus({
        type: "error",
        message: err.message || "Failed to submit answer",
      });
    }
  };

  useEffect(() => {
    if (isConfirmed) {
      setSubmissionStatus({
        type: "success",
        message: "Answer submitted! Checking...",
      });
      // Reset after a delay
      setTimeout(() => {
        setSubmissionStatus({ type: null, message: "" });
        setManualAnswer("");
        setShowManualInput(false);
      }, 3000);
    }
    if (error) {
      setSubmissionStatus({
        type: "error",
        message: error.message || "Transaction failed",
      });
    }
  }, [isConfirmed, error]);

  if (!hunt || !hunt.exists) {
    return (
      <div className="container mx-auto px-6 py-12 max-w-4xl bg-celo-tan-light min-h-screen">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-body-bold text-celo-purple text-xl">Hunt not found</p>
            <Button onClick={() => router.push("/")} className="mt-6 w-full border-4" size="lg">
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!hunt.published) {
    return (
      <div className="container mx-auto px-6 py-12 max-w-4xl bg-celo-tan-light min-h-screen">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-body-bold text-celo-purple text-xl">This hunt is not yet published</p>
            <Button onClick={() => router.push("/")} className="mt-6 w-full border-4" size="lg">
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isCompleted = progress && progress.currentClueIndex >= Number(hunt.clueCount);
  const hasStarted = progress?.hasStarted ?? false;

  return (
    <div className="container mx-auto px-6 py-12 max-w-4xl bg-celo-tan-light min-h-screen">
      <Button variant="ghost" onClick={() => router.push("/")} className="mb-6 border-2">
        ← Back
      </Button>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{hunt.title}</CardTitle>
          <CardDescription>{hunt.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="border-2 border-celo-purple bg-celo-tan-light p-4">
              <div className="text-body-bold text-sm text-celo-brown mb-1">Total Clues</div>
              <div className="text-body-bold text-2xl text-celo-purple">{Number(hunt.clueCount)}</div>
            </div>
            <div className="border-2 border-celo-green bg-celo-green/10 p-4">
              <div className="text-body-bold text-sm text-celo-brown mb-1">Total Reward</div>
              <div className="text-body-bold text-2xl text-celo-green">
                {formatCUSD(hunt.totalRewards)} cUSD
              </div>
            </div>
            {hasStarted && (
              <div className="col-span-2 border-2 border-celo-purple bg-celo-yellow p-4">
                <div className="text-body-bold text-sm text-celo-purple mb-2">
                  Progress: {Number(progress?.currentClueIndex ?? 0)} / {Number(hunt.clueCount)}
                </div>
                <div className="w-full bg-celo-purple h-4 border-2 border-celo-purple">
                  <div
                    className="bg-celo-yellow h-full transition-all"
                    style={{
                      width: `${
                        (Number(progress?.currentClueIndex ?? 0) / Number(hunt.clueCount)) * 100
                      }%`,
                    }}
                  />
                </div>
              </div>
            )}
            {hasStarted && (
              <div className="col-span-2 border-2 border-celo-green bg-celo-green p-4">
                <div className="text-body-bold text-sm text-celo-yellow mb-1">Earned</div>
                <div className="text-body-bold text-3xl text-celo-yellow">
                  {formatCUSD(progress?.totalEarned ?? BigInt(0))} cUSD
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {isCompleted ? (
        <Card className="border-4 border-celo-green bg-celo-green">
          <CardHeader>
            <CardTitle className="text-celo-yellow text-4xl">🎉 Hunt Completed!</CardTitle>
            <CardDescription className="text-celo-yellow text-xl">
              You've earned {formatCUSD(progress?.totalEarned ?? BigInt(0))} cUSD
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/")} className="w-full border-4 border-celo-purple bg-celo-yellow text-celo-purple hover:bg-celo-purple hover:text-celo-yellow" size="lg">
              Browse More Hunts
            </Button>
          </CardContent>
        </Card>
      ) : clue && clue.exists ? (
        <Card>
          <CardHeader>
            <CardTitle>
              Clue {currentClueIndex + 1} of {Number(hunt.clueCount)}
            </CardTitle>
            {clue.location && (
              <CardDescription className="text-body-bold">Location: {clue.location}</CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="border-4 border-celo-purple bg-celo-yellow p-6">
              <p className="text-body-bold text-xl text-celo-purple leading-relaxed">{clue.clueText}</p>
            </div>

            <div className="flex items-center justify-between border-2 border-celo-green bg-celo-green/10 p-4">
              <span className="text-body-bold text-celo-purple">Reward:</span>
              <span className="text-body-bold text-2xl text-celo-green">
                {formatCUSD(clue.reward)} cUSD
              </span>
            </div>

            {submissionStatus.type && (
              <div
                className={`p-4 border-4 ${
                  submissionStatus.type === "success"
                    ? "border-celo-green bg-celo-green text-celo-yellow"
                    : "border-celo-orange bg-celo-orange text-celo-purple"
                }`}
              >
                <p className="text-body-bold text-lg">{submissionStatus.message}</p>
              </div>
            )}

            {showManualInput ? (
              <div className="space-y-4">
                <input
                  type="text"
                  value={manualAnswer}
                  onChange={(e) => setManualAnswer(e.target.value)}
                  placeholder="Enter your answer"
                  className="w-full px-6 py-4 border-4 border-celo-purple bg-white text-body-bold text-lg text-celo-purple focus:outline-none focus:border-celo-yellow"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handleSubmitAnswer(manualAnswer);
                    }
                  }}
                />
                <div className="flex gap-4">
                  <Button
                    onClick={() => handleSubmitAnswer(manualAnswer)}
                    disabled={isPending || isConfirming || !manualAnswer.trim()}
                    className="flex-1 border-4"
                    size="lg"
                  >
                    {isPending || isConfirming ? "Submitting..." : "Submit Answer"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowManualInput(false);
                      setManualAnswer("");
                    }}
                    className="border-4"
                    size="lg"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex gap-4">
                <Button
                  onClick={() => setShowQRScanner(true)}
                  className="flex-1 border-4"
                  disabled={isPending || isConfirming}
                  size="lg"
                >
                  Scan QR Code
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowManualInput(true)}
                  disabled={isPending || isConfirming}
                  className="flex-1 border-4"
                  size="lg"
                >
                  Enter Manually
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-body-bold text-celo-purple text-xl">Loading clue...</p>
          </CardContent>
        </Card>
      )}

      {showQRScanner && (
        <QRScanner
          onScan={handleQRScan}
          onClose={() => setShowQRScanner(false)}
        />
      )}
    </div>
  );
}

