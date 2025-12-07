"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QRScanner } from "@/components/qr-scanner";
import { useSelectHunt, useViewCurrentClue, useGetDetailedProgress, useSubmitAnswer, useStartHunt, useIsHuntCreator } from "@/hooks/use-treasure-hunt";
import { formatCUSD } from "@/lib/treasure-hunt-utils";
import { parseQRCodeURL } from "@/lib/constants";

export default function HuntPage() {
  const params = useParams();
  const router = useRouter();
  const huntId = parseInt(params.id as string, 10);
  const { address, isConnected } = useAccount();
  const { hunt } = useSelectHunt(huntId);
  const { progress } = useGetDetailedProgress(huntId);
  const { isCreator } = useIsHuntCreator(huntId);
  const hasStarted = progress?.hasStarted ?? false;
  const { clue } = useViewCurrentClue(huntId, hasStarted);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [manualAnswer, setManualAnswer] = useState("");
  const [showManualInput, setShowManualInput] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  const { submitAnswer, hash, isPending, isConfirming, isConfirmed, error } = useSubmitAnswer();
  const { startHunt, hash: startHash, isPending: isStartPending, isConfirming: isStartConfirming, isConfirmed: isStartConfirmed } = useStartHunt();

  const handleQRScan = (result: string) => {
    setShowQRScanner(false);
    const parsed = parseQRCodeURL(result);
    const currentClueIdx = progress?.currentClue ?? 0;
    if (parsed && parsed.huntId === huntId && parsed.clueIndex === currentClueIdx) {
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

  const handleStartHunt = async () => {
    if (!isConnected || !address) {
      setSubmissionStatus({
        type: "error",
        message: "Please connect your wallet",
      });
      return;
    }

    try {
      startHunt(huntId);
    } catch (err: any) {
      setSubmissionStatus({
        type: "error",
        message: err.message || "Failed to start hunt",
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
      // Note: submitAnswer now takes plain string (contract hashes it internally)
      submitAnswer(huntId, answer);
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
  }, [isConfirmed]);

  useEffect(() => {
    if (error) {
      const errorMessage = error.message || error.toString() || "Transaction failed";
      setSubmissionStatus({
        type: "error",
        message: errorMessage,
      });
    }
  }, [error]);

  useEffect(() => {
    if (isStartConfirmed) {
      setSubmissionStatus({
        type: "success",
        message: "Hunt started successfully!",
      });
    }
  }, [isStartConfirmed]);

  if (!hunt) {
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

  const isCompleted = progress?.hasCompleted ?? false;
  const currentClueIndex = progress?.currentClue ?? 0;

  return (
    <div className="container mx-auto px-6 py-12 max-w-4xl bg-celo-tan-light min-h-screen animate-fade-in">
      <Button 
        variant="ghost" 
        onClick={() => router.push("/")} 
        className="mb-6 border-2 transition-premium hover-lift"
      >
        ← Back
      </Button>

      <Card className="mb-6 animate-scale-in hover-lift">
        <CardHeader className="border-b-4 border-celo-purple">
          <CardTitle className="group-hover:text-celo-green transition-colors">{hunt.title}</CardTitle>
          <CardDescription className="mt-2">{hunt.description}</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="border-2 border-celo-purple bg-celo-tan-light p-4 transition-premium hover:border-celo-yellow hover:bg-celo-yellow/20">
              <div className="text-body-bold text-sm text-celo-brown mb-1">Total Clues</div>
              <div className="text-body-bold text-2xl text-celo-purple font-bold">{hunt.clueCount}</div>
            </div>
            <div className="border-2 border-celo-green bg-celo-green/10 p-4 transition-premium hover:border-celo-green hover:bg-celo-green/20">
              <div className="text-body-bold text-sm text-celo-brown mb-1">Total Reward</div>
              <div className="text-body-bold text-2xl text-celo-green font-bold">
                {formatCUSD(hunt.totalReward)} cUSD
              </div>
            </div>
            {hasStarted && (
              <div className="col-span-2 border-2 border-celo-purple bg-celo-yellow p-4 transition-premium hover:shadow-lg">
                <div className="text-body-bold text-sm text-celo-purple mb-2">
                  Progress: {currentClueIndex} / {hunt.clueCount}
                </div>
                <div className="w-full bg-celo-purple h-6 border-2 border-celo-purple overflow-hidden">
                  <div
                    className="bg-celo-yellow h-full transition-all duration-500 ease-out"
                    style={{
                      width: `${(currentClueIndex / hunt.clueCount) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}
            {!hasStarted && (
              <div className="col-span-2">
                {isCreator ? (
                  <div className="w-full border-4 border-celo-orange bg-celo-orange/20 p-4 text-center">
                    <p className="text-body-bold text-celo-purple">
                      You cannot participate in your own hunt
                    </p>
                  </div>
                ) : (
                  <Button
                    onClick={handleStartHunt}
                    disabled={isStartPending || isStartConfirming}
                    className="w-full border-4 transition-premium hover-lift"
                    size="lg"
                  >
                    {isStartPending || isStartConfirming ? "Starting..." : "Start Hunt"}
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {isCompleted ? (
        <Card className="border-4 border-celo-green bg-celo-green animate-scale-in hover-lift">
          <CardHeader>
            <CardTitle className="text-celo-yellow text-4xl animate-fade-in">🎉 Hunt Completed!</CardTitle>
            <CardDescription className="text-celo-yellow text-xl mt-2">
              Congratulations on completing the hunt!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => router.push("/")} 
              className="w-full border-4 border-celo-purple bg-celo-yellow text-celo-purple hover:bg-celo-purple hover:text-celo-yellow transition-premium hover-lift" 
              size="lg"
            >
              Browse More Hunts
            </Button>
          </CardContent>
        </Card>
      ) : !hasStarted ? (
        <Card className="animate-fade-in">
          <CardContent className="pt-6">
            <p className="text-center text-body-bold text-celo-purple text-xl mb-4">Click "Start Hunt" to begin!</p>
          </CardContent>
        </Card>
      ) : clue ? (
        <Card className="animate-scale-in hover-lift">
          <CardHeader className="border-b-4 border-celo-purple">
            <CardTitle className="group-hover:text-celo-green transition-colors">
              Clue {clue.clueIndex + 1} of {hunt.clueCount}
            </CardTitle>
            {clue.location && (
              <CardDescription className="text-body-bold mt-2">📍 Location: {clue.location}</CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="border-4 border-celo-purple bg-celo-yellow p-6 transition-premium hover:shadow-lg">
              <p className="text-body-bold text-xl text-celo-purple leading-relaxed">{clue.clueText}</p>
            </div>

            <div className="flex items-center justify-between border-2 border-celo-green bg-celo-green/10 p-4 transition-premium hover:border-celo-green hover:bg-celo-green/20">
              <span className="text-body-bold text-celo-purple">Reward:</span>
              <span className="text-body-bold text-2xl text-celo-green font-bold">
                {formatCUSD(clue.reward)} cUSD
              </span>
            </div>

            {submissionStatus.type && (
              <div
                className={`p-4 border-4 animate-fade-in transition-premium ${
                  submissionStatus.type === "success"
                    ? "border-celo-green bg-celo-green text-celo-yellow"
                    : "border-celo-orange bg-celo-orange text-celo-purple"
                }`}
              >
                <p className="text-body-bold text-lg">{submissionStatus.message}</p>
              </div>
            )}

            {showManualInput ? (
              <div className="space-y-4 animate-fade-in">
                <Input
                  type="text"
                  value={manualAnswer}
                  onChange={(e) => setManualAnswer(e.target.value)}
                  placeholder="Enter your answer"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSubmitAnswer(manualAnswer);
                    }
                  }}
                  className="text-lg"
                />
                <div className="flex gap-4">
                  <Button
                    onClick={() => handleSubmitAnswer(manualAnswer)}
                    disabled={isPending || isConfirming || !manualAnswer.trim()}
                    className="flex-1 border-4 transition-premium hover-lift"
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
                    className="border-4 transition-premium hover-lift"
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
                  className="flex-1 border-4 transition-premium hover-lift"
                  disabled={isPending || isConfirming}
                  size="lg"
                >
                  Scan QR Code
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowManualInput(true)}
                  disabled={isPending || isConfirming}
                  className="flex-1 border-4 transition-premium hover-lift"
                  size="lg"
                >
                  Enter Manually
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="animate-pulse">
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

