"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useBrowseHunts, useSelectHunt, useGetDetailedProgress, useHuntLeaderboard, useGlobalLeaderboard } from "@/hooks/use-treasure-hunt";
import { useAccount } from "wagmi";
import { Address } from "viem";
import { formatCUSD } from "@/lib/treasure-hunt-utils";
import { useState } from "react";
import { Trophy, Medal, Award } from "lucide-react";

export default function LeaderboardPage() {
  const router = useRouter();
  const { hunts } = useBrowseHunts();
  const [selectedHuntId, setSelectedHuntId] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-game-bg bg-grid-pattern relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-radial"></div>
      
      <div className="container relative mx-auto px-4 py-8 max-w-6xl">
        <Button variant="ghost" onClick={() => router.push("/")} className="mb-6">
          ← Back
        </Button>

        {/* Header */}
        <Card className="mb-8 animate-fade-in">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <Trophy className="w-6 h-6 text-game-secondary" />
              <span className="font-game text-sm text-game-secondary tracking-widest uppercase">Rankings</span>
            </div>
            <CardTitle className="text-3xl">
              <span className="gradient-text-gold">Leaderboard</span>
            </CardTitle>
            <CardDescription>
              Top players and hunt-specific rankings
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Hunt Selector */}
        <div className="mb-8">
          <label className="block font-game text-sm text-game-text-muted mb-3">Select Hunt (optional)</label>
          <select
            value={selectedHuntId ?? ""}
            onChange={(e) =>
              setSelectedHuntId(e.target.value ? parseInt(e.target.value, 10) : null)
            }
            className="w-full md:w-80 h-12 bg-game-surface border border-game-primary/30 rounded-md px-4 font-game text-white focus:outline-none focus:ring-2 focus:ring-game-primary transition-all cursor-pointer"
          >
            <option value="">All Hunts (Global)</option>
            {hunts.map((hunt) => (
              <HuntOption key={hunt.id} hunt={hunt} />
            ))}
          </select>
        </div>

        {selectedHuntId === null ? (
          <GlobalLeaderboard />
        ) : (
          <HuntLeaderboard huntId={selectedHuntId} />
        )}
      </div>
    </div>
  );
}

function HuntOption({ hunt }: { hunt: { id: number; title: string } }) {
  return <option value={hunt.id}>{hunt.title}</option>;
}

function GlobalLeaderboard() {
  const { address } = useAccount();
  const { leaderboard, isLoading, error } = useGlobalLeaderboard();

  const formatTime = (seconds: number | null): string => {
    if (seconds === null) return "N/A";
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}h ${minutes}m ${secs}s`;
  };

  const truncateAddress = (addr: Address): string => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-token-legendary" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-token-common" />;
    if (rank === 3) return <Award className="w-5 h-5 text-game-secondary" />;
    return <span className="font-game text-game-text-muted">#{rank}</span>;
  };

  const getRankStyle = (rank: number) => {
    if (rank === 1) return "bg-token-legendary/10 border-token-legendary/50";
    if (rank === 2) return "bg-token-common/10 border-token-common/50";
    if (rank === 3) return "bg-game-secondary/10 border-game-secondary/50";
    return "bg-game-bg/50 border-game-primary/20";
  };

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <Trophy className="w-6 h-6 text-game-secondary" />
          Global Leaderboard
        </CardTitle>
        <CardDescription>
          Rankings across all hunts based on completion events
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin h-10 w-10 border-4 border-game-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="font-game text-game-text-muted">Loading global leaderboard...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="font-game text-game-error">Error loading leaderboard: {error.message}</p>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-game-primary/20 flex items-center justify-center">
              <Trophy className="w-8 h-8 text-game-primary" />
            </div>
            <p className="font-game text-game-text-muted">No players have completed any hunts yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Table Header */}
            <div className="hidden md:grid grid-cols-6 gap-4 px-4 py-3 font-game text-sm text-game-text-muted border-b border-game-primary/20">
              <span>Rank</span>
              <span>Player</span>
              <span>Hunts</span>
              <span>Clues</span>
              <span>Rewards</span>
              <span>Best Time</span>
            </div>
            
            {/* Table Rows */}
            {leaderboard.map((entry) => {
              const isCurrentPlayer = address?.toLowerCase() === entry.player.toLowerCase();
              return (
                <div
                  key={entry.player}
                  className={`
                    grid grid-cols-2 md:grid-cols-6 gap-4 px-4 py-4 rounded-md border transition-all duration-300
                    ${getRankStyle(entry.rank)}
                    ${isCurrentPlayer ? "ring-2 ring-game-primary shadow-glow-primary" : "hover:border-game-primary/40"}
                  `}
                >
                  <div className="flex items-center gap-2">
                    {getRankIcon(entry.rank)}
                  </div>
                  <div className="flex items-center">
                    <span className={`font-game text-sm ${isCurrentPlayer ? "text-game-primary" : "text-white"}`}>
                      {truncateAddress(entry.player)}
                      {isCurrentPlayer && <span className="ml-2 text-game-accent">(You)</span>}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-game text-sm text-game-text-muted md:hidden mr-2">Hunts:</span>
                    <span className="font-game text-white font-bold">{entry.huntsCompleted}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-game text-sm text-game-text-muted md:hidden mr-2">Clues:</span>
                    <span className="font-game text-white">{entry.totalCluesSolved}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-game text-sm text-game-text-muted md:hidden mr-2">Rewards:</span>
                    <span className="font-game text-game-secondary font-bold">
                      {formatCUSD(entry.totalRewards)} cUSD
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-game text-sm text-game-text-muted md:hidden mr-2">Best:</span>
                    <span className="font-game text-game-accent">{formatTime(entry.bestCompletionTime)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function HuntLeaderboard({ huntId }: { huntId: number }) {
  const { hunt } = useSelectHunt(huntId);
  const { address } = useAccount();
  const { leaderboard, isLoading, error } = useHuntLeaderboard(huntId);

  if (!hunt) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center font-game text-game-text-muted">Hunt not found</p>
        </CardContent>
      </Card>
    );
  }

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}h ${minutes}m ${secs}s`;
  };

  const truncateAddress = (addr: Address): string => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-token-legendary" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-token-common" />;
    if (rank === 3) return <Award className="w-5 h-5 text-game-secondary" />;
    return <span className="font-game text-game-text-muted">#{rank}</span>;
  };

  const getRankStyle = (rank: number) => {
    if (rank === 1) return "bg-token-legendary/10 border-token-legendary/50";
    if (rank === 2) return "bg-token-common/10 border-token-common/50";
    if (rank === 3) return "bg-game-secondary/10 border-game-secondary/50";
    return "bg-game-bg/50 border-game-primary/20";
  };

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <Trophy className="w-6 h-6 text-game-secondary" />
          {hunt.title}
        </CardTitle>
        <CardDescription className="flex items-center gap-4">
          <span>{hunt.clueCount} clues</span>
          <span className="text-game-secondary">{formatCUSD(hunt.totalReward)} cUSD total</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin h-10 w-10 border-4 border-game-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="font-game text-game-text-muted">Loading leaderboard...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="font-game text-game-error">Error loading leaderboard: {error.message}</p>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-game-primary/20 flex items-center justify-center">
              <Trophy className="w-8 h-8 text-game-primary" />
            </div>
            <p className="font-game text-game-text-muted">No players have started this hunt yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Table Header */}
            <div className="hidden md:grid grid-cols-5 gap-4 px-4 py-3 font-game text-sm text-game-text-muted border-b border-game-primary/20">
              <span>Rank</span>
              <span>Player</span>
              <span>Clues</span>
              <span>Time</span>
              <span>Status</span>
            </div>
            
            {/* Table Rows */}
            {leaderboard.map((entry) => {
              const isCurrentPlayer = address?.toLowerCase() === entry.player.toLowerCase();
              return (
                <div
                  key={entry.player}
                  className={`
                    grid grid-cols-2 md:grid-cols-5 gap-4 px-4 py-4 rounded-md border transition-all duration-300
                    ${getRankStyle(entry.rank)}
                    ${isCurrentPlayer ? "ring-2 ring-game-primary shadow-glow-primary" : "hover:border-game-primary/40"}
                  `}
                >
                  <div className="flex items-center gap-2">
                    {getRankIcon(entry.rank)}
                  </div>
                  <div className="flex items-center">
                    <span className={`font-game text-sm ${isCurrentPlayer ? "text-game-primary" : "text-white"}`}>
                      {truncateAddress(entry.player)}
                      {isCurrentPlayer && <span className="ml-2 text-game-accent">(You)</span>}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-game text-sm text-game-text-muted md:hidden mr-2">Clues:</span>
                    <span className="font-game text-white">
                      {entry.cluesCompleted} / {hunt.clueCount}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-game text-sm text-game-text-muted md:hidden mr-2">Time:</span>
                    <span className="font-game text-game-accent">{formatTime(entry.totalTime)}</span>
                  </div>
                  <div className="flex items-center">
                    {entry.isCompleted ? (
                      <span className="px-3 py-1 bg-game-success/20 text-game-success border border-game-success/50 rounded-md font-game text-sm font-semibold">
                        ✓ Completed
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-game-warning/20 text-game-warning border border-game-warning/50 rounded-md font-game text-sm font-semibold">
                        In Progress
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {address && (
          <div className="mt-8 p-4 bg-game-bg/50 border border-game-primary/20 rounded-md">
            <p className="font-game text-white font-bold mb-3">Your Progress</p>
            <PlayerProgressDisplay huntId={huntId} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PlayerProgressDisplay({ huntId }: { huntId: number }) {
  const { progress } = useGetDetailedProgress(huntId);
  const { hunt } = useSelectHunt(huntId);

  if (!progress || !progress.hasStarted) {
    return <p className="font-game text-game-text-muted">You haven&apos;t started this hunt yet.</p>;
  }

  const isCompleted = progress.hasCompleted;
  const progressPercent = hunt ? (progress.currentClue / hunt.clueCount) * 100 : 0;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <span className="font-game text-game-text-muted">Clues Completed:</span>
        <span className="font-game text-white font-bold">
          {progress.currentClue} / {hunt?.clueCount ?? 0}
        </span>
      </div>
      <div className="w-full bg-game-bg border border-game-primary/30 rounded-full h-3 overflow-hidden">
        <div
          className="bg-gradient-to-r from-game-primary to-game-accent h-full rounded-full transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      {isCompleted && (
        <div className="flex items-center gap-2 p-3 bg-game-success/20 border border-game-success/50 rounded-md">
          <span className="text-game-success">✓</span>
          <span className="font-game text-game-success font-bold">Hunt Completed!</span>
        </div>
      )}
    </div>
  );
}
