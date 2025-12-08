"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSelectHunt, useViewCurrentClue, useGetDetailedProgress, useSubmitAnswer, useStartHunt, useIsHuntCreator } from "@/hooks/use-treasure-hunt";
import { formatCUSD } from "@/lib/treasure-hunt-utils";
import { MapPin, Sparkles, Target, Trophy, Coins } from "lucide-react";

export default function HuntPage() {
  const params = useParams();
  const router = useRouter();
  const huntId = parseInt(params.id as string, 10);
  const { address, isConnected } = useAccount();
  const { hunt } = useSelectHunt(huntId);
  const { progress, refetch: refetchProgress } = useGetDetailedProgress(huntId);
  const { isCreator } = useIsHuntCreator(huntId);
  const hasStarted = progress?.hasStarted ?? false;
  const { clue, isLoading: isLoadingClue, error: clueError, refetch: refetchClue } = useViewCurrentClue(huntId, hasStarted);
  const [answer, setAnswer] = useState("");
  const [submissionStatus, setSubmissionStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  const { submitAnswer, isPending, isConfirming, isConfirmed, error } = useSubmitAnswer();
  const { startHunt, isPending: isStartPending, isConfirming: isStartConfirming, isConfirmed: isStartConfirmed } = useStartHunt();


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
      setTimeout(() => {
        refetchProgress();
        refetchClue();
      }, 1000);
      setTimeout(() => {
        setSubmissionStatus({ type: null, message: "" });
        setAnswer("");
      }, 3000);
    }
  }, [isConfirmed, refetchProgress, refetchClue]);

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
    if (clueError) {
      const errorMessage = clueError.message || clueError.toString() || "Failed to load clue";
      const debugInfo = address ? ` (Address: ${address.slice(0, 6)}...${address.slice(-4)})` : " (No address)";
      const progressInfo = progress ? ` | Progress: hasStarted=${progress.hasStarted}, startTime=${progress.startTime}` : " | No progress data";
      setSubmissionStatus({
        type: "error",
        message: `${errorMessage}${debugInfo}${progressInfo}`,
      });
      console.error("Clue error details:", {
        error: clueError,
        address,
        progress,
        huntId,
      });
    }
  }, [clueError, address, progress, huntId]);

  useEffect(() => {
    if (isStartConfirmed) {
      setSubmissionStatus({
        type: "success",
        message: "Hunt started successfully!",
      });
      const checkAndRefetch = async () => {
        await refetchProgress();
        await new Promise(resolve => setTimeout(resolve, 2000));
        await refetchProgress();
        await new Promise(resolve => setTimeout(resolve, 1000));
        await refetchProgress();
        setTimeout(() => {
          refetchClue();
        }, 1000);
      };

      checkAndRefetch();
    }
  }, [isStartConfirmed, refetchProgress, refetchClue]);

  if (!hunt) {
    return (
      <div className="min-h-screen bg-game-bg bg-grid-pattern relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-radial"></div>
        <div className="container relative mx-auto px-6 py-12 max-w-4xl">
          <Card>
            <CardContent className="pt-8 pb-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-game-error/20 flex items-center justify-center">
                <span className="text-3xl">❌</span>
              </div>
              <p className="font-game text-xl text-white mb-4">Hunt not found</p>
              <Button onClick={() => router.push("/")} className="w-full max-w-xs">
                Back to Home
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const isCompleted = progress?.hasCompleted ?? false;
  const currentClueIndex = progress?.currentClue ?? 0;
  const progressPercent = (currentClueIndex / hunt.clueCount) * 100;

  return (
    <div className="min-h-screen bg-game-bg bg-grid-pattern relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-radial"></div>
      
      <div className="container relative mx-auto px-6 py-12 max-w-4xl animate-fade-in">
        <Button
          variant="ghost"
          onClick={() => router.push("/")}
          className="mb-6"
        >
          ← Back
        </Button>

        {/* Hunt Info Card */}
        <Card className="mb-6 hover:shadow-glow-primary transition-all duration-300">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <Target className="w-5 h-5 text-game-primary" />
              <span className="font-game text-sm text-game-primary tracking-widest uppercase">Active Hunt</span>
            </div>
            <CardTitle className="text-2xl md:text-3xl">{hunt.title}</CardTitle>
            <CardDescription className="text-base">{hunt.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-game-bg/50 border border-game-primary/20 rounded-md p-4 transition-all hover:border-game-primary/40">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-4 h-4 text-game-text-muted" />
                  <span className="font-game text-sm text-game-text-muted">Total Clues</span>
                </div>
                <span className="font-game text-2xl text-white font-bold">{hunt.clueCount}</span>
              </div>
              <div className="bg-game-secondary/10 border border-game-secondary/30 rounded-md p-4 transition-all hover:border-game-secondary/50">
                <div className="flex items-center gap-2 mb-1">
                  <Coins className="w-4 h-4 text-game-secondary" />
                  <span className="font-game text-sm text-game-text-muted">Total Reward</span>
                </div>
                <span className="font-game text-2xl text-game-secondary font-bold">
                  {formatCUSD(hunt.totalReward)} cUSD
                </span>
              </div>
            </div>

            {hasStarted && (
              <div className="bg-game-bg/50 border border-game-accent/30 rounded-md p-4 mb-6">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-game text-sm text-game-text-muted">Progress</span>
                  <span className="font-game text-game-accent font-bold">
                    {currentClueIndex} / {hunt.clueCount}
                  </span>
                </div>
                <div className="w-full bg-game-bg border border-game-primary/30 rounded-full h-4 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-game-primary to-game-accent h-full rounded-full transition-all duration-500 ease-out relative"
                    style={{ width: `${progressPercent}%` }}
                  >
                    <div className="absolute inset-0 bg-white/20 animate-shimmer"></div>
                  </div>
                </div>
              </div>
            )}

            {!hasStarted && (
              <div className="w-full">
                {isCreator ? (
                  <div className="p-4 bg-game-warning/20 border border-game-warning/50 rounded-md text-center">
                    <p className="font-game text-game-warning">
                      You cannot participate in your own hunt
                    </p>
                  </div>
                ) : (
                  <Button
                    onClick={handleStartHunt}
                    disabled={isStartPending || isStartConfirming}
                    className="w-full hover-lift"
                    size="lg"
                  >
                    {isStartPending || isStartConfirming ? "Starting..." : "🚀 Start Hunt"}
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Completion Card */}
        {isCompleted ? (
          <Card className="bg-gradient-to-br from-game-success/20 to-game-accent/10 border-game-success/50 animate-scale-in">
            <CardHeader className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-game-success/20 border-2 border-game-success flex items-center justify-center animate-pulse-glow">
                <Trophy className="w-10 h-10 text-game-success" />
              </div>
              <CardTitle className="text-3xl text-game-success">🎉 Hunt Completed!</CardTitle>
              <CardDescription className="text-lg text-game-text-muted">
                Congratulations on completing the hunt!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => router.push("/")}
                variant="secondary"
                className="w-full hover-lift"
                size="lg"
              >
                Browse More Hunts
              </Button>
            </CardContent>
          </Card>
        ) : !hasStarted ? (
          <Card className="animate-fade-in">
            <CardContent className="pt-8 pb-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-game-primary/20 flex items-center justify-center animate-float">
                <Target className="w-8 h-8 text-game-primary" />
              </div>
              <p className="font-game text-xl text-white mb-2">Ready to begin?</p>
              <p className="font-game text-game-text-muted">Click &quot;Start Hunt&quot; to reveal your first clue!</p>
            </CardContent>
          </Card>
        ) : clue ? (
          <Card className="animate-scale-in hover:shadow-glow-primary transition-all duration-300">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="token-epic px-3 py-1 font-game text-sm font-semibold">
                    Clue {clue.clueIndex + 1} of {hunt.clueCount}
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-game-secondary/20 border border-game-secondary/50 rounded-md px-3 py-1">
                  <Coins className="w-4 h-4 text-game-secondary" />
                  <span className="font-game text-game-secondary font-bold">
                    {formatCUSD(clue.reward)} cUSD
                  </span>
                </div>
              </div>
              {clue.location && (
                <div className="flex items-center gap-2 mt-4 text-game-accent">
                  <MapPin className="w-4 h-4" />
                  <span className="font-game text-sm">{clue.location}</span>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Clue Text */}
              <div className="bg-gradient-to-br from-game-primary/10 to-game-accent/5 border border-game-primary/30 rounded-lg p-6 animate-pulse-glow">
                <p className="font-game text-lg text-white leading-relaxed">{clue.clueText}</p>
              </div>

              {/* Status Messages */}
              {submissionStatus.type && (
                <div
                  className={`p-4 rounded-md animate-fade-in ${
                    submissionStatus.type === "success"
                      ? "bg-game-success/20 border border-game-success/50 text-game-success"
                      : "bg-game-error/20 border border-game-error/50 text-game-error"
                  }`}
                >
                  <p className="font-game">{submissionStatus.message}</p>
                </div>
              )}

              {/* Answer Input */}
              <div className="space-y-4">
                <Input
                  type="text"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Enter your answer..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSubmitAnswer(answer);
                    }
                  }}
                  className="text-lg h-14"
                />
                <Button
                  onClick={() => handleSubmitAnswer(answer)}
                  disabled={isPending || isConfirming || !answer.trim()}
                  className="w-full hover-lift"
                  size="lg"
                >
                  {isPending || isConfirming ? "Submitting..." : "Submit Answer"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="animate-pulse">
            <CardContent className="pt-8 pb-8 text-center">
              {isLoadingClue ? (
                <>
                  <div className="animate-spin h-10 w-10 border-4 border-game-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="font-game text-game-text-muted">Loading clue...</p>
                </>
              ) : clueError ? (
                <div className="space-y-4">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-game-error/20 flex items-center justify-center">
                    <span className="text-3xl">⚠️</span>
                  </div>
                  <p className="font-game text-game-error">
                    Error loading clue: {clueError.message || "Unknown error"}
                  </p>
                  <Button onClick={() => refetchClue()} className="hover-lift">
                    Retry
                  </Button>
                </div>
              ) : (
                <>
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-game-primary/20 flex items-center justify-center">
                    <span className="text-3xl">🔍</span>
                  </div>
                  <p className="font-game text-game-text-muted">No clue available</p>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
