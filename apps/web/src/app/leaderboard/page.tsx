"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useBrowseHunts, useSelectHunt, useGetDetailedProgress, useHuntLeaderboard, useGlobalLeaderboard } from "@/hooks/use-treasure-hunt";
import { useAccount } from "wagmi";
import { Address } from "viem";
import { formatCUSD } from "@/lib/treasure-hunt-utils";
import { useState } from "react";

export default function LeaderboardPage() {
  const router = useRouter();
  const { address } = useAccount();
  const { hunts } = useBrowseHunts();
  const [selectedHuntId, setSelectedHuntId] = useState<number | null>(null);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <Button variant="ghost" onClick={() => router.push("/")} className="mb-4">
        ← Back
      </Button>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Leaderboard</CardTitle>
          <CardDescription>
            Top players and hunt-specific rankings
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Select Hunt (optional)</label>
        <select
          value={selectedHuntId ?? ""}
          onChange={(e) =>
            setSelectedHuntId(e.target.value ? parseInt(e.target.value, 10) : null)
          }
          className="w-full md:w-64 px-4 py-2 border rounded-lg"
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Global Leaderboard</CardTitle>
        <CardDescription>
          Rankings across all hunts based on completion events
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Loading global leaderboard...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-500">Error loading leaderboard: {error.message}</p>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No players have completed any hunts yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-celo-purple">
                  <th className="text-left p-3 text-celo-purple font-bold">Rank</th>
                  <th className="text-left p-3 text-celo-purple font-bold">Player</th>
                  <th className="text-left p-3 text-celo-purple font-bold">Hunts</th>
                  <th className="text-left p-3 text-celo-purple font-bold">Clues Solved</th>
                  <th className="text-left p-3 text-celo-purple font-bold">Total Rewards</th>
                  <th className="text-left p-3 text-celo-purple font-bold">Best Time</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry) => {
                  const isCurrentPlayer = address?.toLowerCase() === entry.player.toLowerCase();
                  return (
                    <tr
                      key={entry.player}
                      className={`border-b transition-premium ${
                        isCurrentPlayer ? "bg-celo-yellow/20 font-medium" : "hover:bg-gray-50"
                      }`}
                    >
                      <td className="p-3">
                        <span className="text-celo-purple font-bold">#{entry.rank}</span>
                      </td>
                      <td className="p-3">
                        <span className={isCurrentPlayer ? "text-celo-purple" : ""}>
                          {truncateAddress(entry.player)}
                          {isCurrentPlayer && " (You)"}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="text-celo-brown font-medium">{entry.huntsCompleted}</span>
                      </td>
                      <td className="p-3">
                        <span className="text-celo-brown">{entry.totalCluesSolved}</span>
                      </td>
                      <td className="p-3">
                        <span className="text-celo-green font-medium">
                          {formatCUSD(entry.totalRewards)} cUSD
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="text-celo-brown">{formatTime(entry.bestCompletionTime)}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
          <p className="text-center text-gray-500">Hunt not found</p>
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Leaderboard: {hunt.title}</CardTitle>
        <CardDescription>
          {hunt.clueCount} clues • {formatCUSD(hunt.totalReward)} cUSD total rewards
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Loading leaderboard...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-500">Error loading leaderboard: {error.message}</p>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No players have started this hunt yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-celo-purple">
                  <th className="text-left p-3 text-celo-purple font-bold">Rank</th>
                  <th className="text-left p-3 text-celo-purple font-bold">Player</th>
                  <th className="text-left p-3 text-celo-purple font-bold">Clues</th>
                  <th className="text-left p-3 text-celo-purple font-bold">Time</th>
                  <th className="text-left p-3 text-celo-purple font-bold">Status</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry) => {
                  const isCurrentPlayer = address?.toLowerCase() === entry.player.toLowerCase();
                  return (
                    <tr
                      key={entry.player}
                      className={`border-b transition-premium ${
                        isCurrentPlayer ? "bg-celo-yellow/20 font-medium" : "hover:bg-gray-50"
                      }`}
                    >
                      <td className="p-3">
                        <span className="text-celo-purple font-bold">#{entry.rank}</span>
                      </td>
                      <td className="p-3">
                        <span className={isCurrentPlayer ? "text-celo-purple" : ""}>
                          {truncateAddress(entry.player)}
                          {isCurrentPlayer && " (You)"}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="text-celo-brown">
                          {entry.cluesCompleted} / {hunt.clueCount}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="text-celo-brown">{formatTime(entry.totalTime)}</span>
                      </td>
                      <td className="p-3">
                        {entry.isCompleted ? (
                          <span className="px-2 py-1 bg-celo-green text-white rounded text-sm font-medium">
                            ✓ Completed
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-celo-orange text-white rounded text-sm font-medium">
                            In Progress
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {address && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="font-medium mb-2">Your Progress</p>
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
    return <p className="text-gray-500">You haven&apos;t started this hunt yet.</p>;
  }

  const isCompleted = progress.hasCompleted;

  return (
    <div className="space-y-2">
      <div className="flex justify-between">
        <span>Clues Completed:</span>
        <span className="font-medium">
          {progress.currentClue} / {hunt?.clueCount ?? 0}
        </span>
      </div>
      {isCompleted && (
        <div className="mt-2 p-2 bg-green-50 rounded text-green-700 text-sm">
          ✓ Hunt Completed!
        </div>
      )}
    </div>
  );
}

