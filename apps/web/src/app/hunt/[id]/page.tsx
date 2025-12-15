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

  const { submitAnswer, isPending, isConfirming, isConfirmed, parsedError } = useSubmitAnswer();
  const { startHunt, isPending: isStartPending, isConfirming: isStartConfirming, isConfirmed: isStartConfirmed, error: startError } = useStartHunt();


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
      await submitAnswer(huntId, answer);
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

  // Prompt user to confirm in wallet when transaction is initiated
  useEffect(() => {
    if (isPending) {
      setSubmissionStatus((prev) =>
        prev.type === "error"
          ? prev
          : {
              type: "success",
              message: "Check your wallet to confirm",
            }
      );
    }
  }, [isPending]);

  // Show a neutral state while transaction is broadcasting
  useEffect(() => {
    if (isConfirming) {
      setSubmissionStatus((prev) =>
        prev.type === "error"
          ? prev
          : {
              type: "success",
              message: "Submitting transaction...",
            }
      );
    }
  }, [isConfirming]);

  // Handle submit answer errors (parsedError is already a user-friendly string or null)
  useEffect(() => {
    if (parsedError) {
      setSubmissionStatus({
        type: "error",
        message: parsedError,
      });
    }
  }, [parsedError]);

  // Handle start hunt errors
  useEffect(() => {
    if (startError) {
      const message = startError.message || "Failed to start hunt";
      // Check for user rejection - don't show as error
      if (
        message.toLowerCase().includes('user rejected') ||
        message.toLowerCase().includes('user denied')
      ) {
        return;
      }
      setSubmissionStatus({
        type: "error",
        message: message.split('\n')[0].replace(/^Error:\s*/i, ''),
      });
    }
  }, [startError]);

  useEffect(() => {
    if (clueError) {
      const message = clueError.message || "Failed to load clue";
      // Check for user rejection - don't show as error
      if (
        message.toLowerCase().includes('user rejected') ||
        message.toLowerCase().includes('user denied')
      ) {
        return;
      }
      setSubmissionStatus({
        type: "error",
        message: message.split('\n')[0].replace(/^Error:\s*/i, ''),
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
        <div className="container relative mx-auto px-4 sm:px-6 py-8 sm:py-12 max-w-4xl">
          <Card>
            <CardContent className="pt-6 sm:pt-8 pb-6 sm:pb-8 text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-full bg-game-error/20 flex items-center justify-center">
                <span className="text-2xl sm:text-3xl">❌</span>
              </div>
              <p className="font-game text-lg sm:text-xl text-white mb-4">Hunt not found</p>
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
      
      <div className="container relative mx-auto px-4 sm:px-6 py-6 sm:py-8 md:py-12 max-w-4xl animate-fade-in">
        <Button
          variant="ghost"
          onClick={() => router.push("/")}
          className="mb-4 sm:mb-6 text-sm sm:text-base"
        >
          ← Back
        </Button>

        {/* Hunt Info Card */}
        <Card className="mb-4 sm:mb-6 hover:shadow-glow-primary transition-all duration-300">
          <CardHeader className="p-4 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <Target className="w-4 h-4 sm:w-5 sm:h-5 text-game-primary" />
              <span className="font-game text-xs sm:text-sm text-game-primary tracking-widest uppercase">Active Hunt</span>
            </div>
            <CardTitle className="text-xl sm:text-2xl md:text-3xl">{hunt.title}</CardTitle>
            <CardDescription className="text-sm sm:text-base">{hunt.description}</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
            <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="bg-game-bg/50 border border-game-primary/20 rounded-md p-3 sm:p-4 transition-all hover:border-game-primary/40">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                  <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-game-text-muted" />
                  <span className="font-game text-xs sm:text-sm text-game-text-muted">Total Clues</span>
                </div>
                <span className="font-game text-xl sm:text-2xl text-white font-bold">{hunt.clueCount}</span>
              </div>
              <div className="bg-game-secondary/10 border border-game-secondary/30 rounded-md p-3 sm:p-4 transition-all hover:border-game-secondary/50">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                  <Coins className="w-3 h-3 sm:w-4 sm:h-4 text-game-secondary" />
                  <span className="font-game text-xs sm:text-sm text-game-text-muted">Total Reward</span>
                </div>
                <span className="font-game text-xl sm:text-2xl text-game-secondary font-bold">
                  {formatCUSD(hunt.totalReward)} cUSD
                </span>
              </div>
            </div>

            {hasStarted && (
              <div className="bg-game-bg/50 border border-game-accent/30 rounded-md p-3 sm:p-4 mb-4 sm:mb-6">
                <div className="flex justify-between items-center mb-2 sm:mb-3">
                  <span className="font-game text-xs sm:text-sm text-game-text-muted">Progress</span>
                  <span className="font-game text-sm sm:text-base text-game-accent font-bold">
                    {currentClueIndex} / {hunt.clueCount}
                  </span>
                </div>
                <div className="w-full bg-game-bg border border-game-primary/30 rounded-full h-3 sm:h-4 overflow-hidden">
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
                  <div className="p-3 sm:p-4 bg-game-warning/20 border border-game-warning/50 rounded-md text-center">
                    <p className="font-game text-xs sm:text-sm text-game-warning">
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
            <CardHeader className="text-center p-4 sm:p-6">
              <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-3 sm:mb-4 rounded-full bg-game-success/20 border-2 border-game-success flex items-center justify-center animate-pulse-glow">
                <Trophy className="w-8 h-8 sm:w-10 sm:h-10 text-game-success" />
              </div>
              <CardTitle className="text-2xl sm:text-3xl text-game-success">🎉 Hunt Completed!</CardTitle>
              <CardDescription className="text-sm sm:text-lg text-game-text-muted">
                Congratulations on completing the hunt!
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
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
            <CardContent className="pt-6 sm:pt-8 pb-6 sm:pb-8 text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-full bg-game-primary/20 flex items-center justify-center animate-float">
                <Target className="w-6 h-6 sm:w-8 sm:h-8 text-game-primary" />
              </div>
              <p className="font-game text-lg sm:text-xl text-white mb-2">Ready to begin?</p>
              <p className="font-game text-sm sm:text-base text-game-text-muted">Click &quot;Start Hunt&quot; to reveal your first clue!</p>
            </CardContent>
          </Card>
        ) : clue ? (
          <Card className="animate-scale-in hover:shadow-glow-primary transition-all duration-300">
            <CardHeader className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="token-epic px-2 sm:px-3 py-1 font-game text-xs sm:text-sm font-semibold">
                    Clue {clue.clueIndex + 1} of {hunt.clueCount}
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-game-secondary/20 border border-game-secondary/50 rounded-md px-2 sm:px-3 py-1 w-fit">
                  <Coins className="w-3 h-3 sm:w-4 sm:h-4 text-game-secondary" />
                  <span className="font-game text-xs sm:text-sm text-game-secondary font-bold">
                    {formatCUSD(clue.reward)} cUSD
                  </span>
                </div>
              </div>
              {clue.location && (
                <div className="flex items-center gap-2 mt-3 sm:mt-4 text-game-accent">
                  <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="font-game text-xs sm:text-sm">{clue.location}</span>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6 pt-0">
              {/* Clue Text */}
              <div className="bg-gradient-to-br from-game-primary/10 to-game-accent/5 border border-game-primary/30 rounded-lg p-4 sm:p-6 animate-pulse-glow">
                <p className="font-game text-sm sm:text-base md:text-lg text-white leading-relaxed">{clue.clueText}</p>
              </div>

              {/* Status Messages */}
              {submissionStatus.type && (
                <div
                  className={`p-3 sm:p-4 rounded-md animate-fade-in ${
                    submissionStatus.type === "success"
                      ? "bg-game-success/20 border border-game-success/50 text-game-success"
                      : "bg-game-error/20 border border-game-error/50 text-game-error"
                  }`}
                >
                  <p className="font-game text-xs sm:text-sm break-words">{submissionStatus.message}</p>
                </div>
              )}

              {/* Answer Input */}
              <div className="space-y-3 sm:space-y-4">
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
                  className="text-sm sm:text-lg h-12 sm:h-14"
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
            <CardContent className="pt-6 sm:pt-8 pb-6 sm:pb-8 text-center">
              {isLoadingClue ? (
                <>
                  <div className="animate-spin h-8 w-8 sm:h-10 sm:w-10 border-4 border-game-primary border-t-transparent rounded-full mx-auto mb-3 sm:mb-4"></div>
                  <p className="font-game text-sm sm:text-base text-game-text-muted">Loading clue...</p>
                </>
              ) : clueError ? (
                <div className="space-y-3 sm:space-y-4">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-full bg-game-error/20 flex items-center justify-center">
                    <span className="text-2xl sm:text-3xl">⚠️</span>
                  </div>
                  <p className="font-game text-xs sm:text-sm text-game-error break-words">
                    Error loading clue: {clueError.message?.split('\n')[0] || "Unknown error"}
                  </p>
                  <Button onClick={() => refetchClue()} className="hover-lift">
                    Retry
                  </Button>
                </div>
              ) : (
                <>
                  <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-full bg-game-primary/20 flex items-center justify-center">
                    <span className="text-2xl sm:text-3xl">🔍</span>
                  </div>
                  <p className="font-game text-sm sm:text-base text-game-text-muted">No clue available</p>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
