"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useBrowseHunts, useSelectHunt, useGetDetailedProgress } from "@/hooks/use-treasure-hunt";
import { useAccount } from "wagmi";
import { formatCUSD } from "@/lib/treasure-hunt-utils";
import { useEffect, useState } from "react";

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
        <Card>
          <CardHeader>
            <CardTitle>Global Leaderboard</CardTitle>
            <CardDescription>
              Rankings across all hunts (coming soon - requires event indexing)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500 text-center py-8">
              Global leaderboard requires indexing hunt completion events.
              <br />
              For now, check individual hunt leaderboards.
            </p>
          </CardContent>
        </Card>
      ) : (
        <HuntLeaderboard huntId={selectedHuntId} />
      )}
    </div>
  );
}

function HuntOption({ hunt }: { hunt: { id: number; title: string } }) {
  return <option value={hunt.id}>{hunt.title}</option>;
}

function HuntLeaderboard({ huntId }: { huntId: number }) {
  const { hunt } = useSelectHunt(huntId);
  const { address } = useAccount();

  if (!hunt) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-gray-500">Hunt not found</p>
        </CardContent>
      </Card>
    );
  }

  // Note: In a production app, you'd index events to get all players
  // For now, we'll just show a placeholder
  return (
    <Card>
      <CardHeader>
        <CardTitle>Leaderboard: {hunt.title}</CardTitle>
        <CardDescription>
          {hunt.clueCount} clues • {formatCUSD(hunt.totalReward)} cUSD total rewards
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-gray-500 text-center py-8">
          Hunt-specific leaderboard requires event indexing to track all players.
          <br />
          <br />
          In production, this would show:
          <br />
          • All players who started the hunt
          <br />
          • Clues completed by each player
          <br />
          • Total time taken
          <br />
          • Rank based on completion time
        </p>
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
    return <p className="text-gray-500">You haven't started this hunt yet.</p>;
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

