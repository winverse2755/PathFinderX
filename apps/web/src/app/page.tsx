"use client";

import { useMiniApp } from "@/contexts/miniapp-context";
import { useAccount } from "wagmi";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTotalHunts, useHunt } from "@/hooks/use-treasure-hunt";
import { formatCUSD } from "@/lib/treasure-hunt-utils";

export default function Home() {
  const { context, isMiniAppReady } = useMiniApp();
  const { address, isConnected } = useAccount();
  const { totalHunts } = useTotalHunts();
  const [huntIds, setHuntIds] = useState<number[]>([]);

  // Fetch all hunt IDs
  useEffect(() => {
    if (totalHunts > 0) {
      const ids = Array.from({ length: totalHunts }, (_, i) => i);
      setHuntIds(ids);
    }
  }, [totalHunts]);

  if (!isMiniAppReady) {
    return (
      <main className="flex-1">
        <section className="flex items-center justify-center min-h-screen bg-celo-tan-light">
          <div className="w-full max-w-md mx-auto p-8 text-center border-4 border-celo-purple bg-white">
            <div className="animate-spin h-12 w-12 border-4 border-celo-purple border-t-celo-yellow mx-auto mb-4"></div>
            <p className="text-body-bold text-celo-purple">Loading...</p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="flex-1 bg-celo-tan-light">
      <div className="container mx-auto px-6 py-12 max-w-7xl">
        {/* Hero Section */}
        <div className="mb-16 border-4 border-celo-purple bg-celo-yellow p-8 md:p-12">
          <h1 className="text-display text-5xl md:text-7xl font-display font-light italic text-celo-purple mb-4 leading-tight">
            Treasure <span className="not-italic">Hunt</span>
          </h1>
          <p className="text-body-bold text-xl md:text-2xl text-celo-purple max-w-2xl">
            Discover clues, solve puzzles, and earn cUSD rewards on Celo.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="mb-12 flex flex-wrap gap-4">
          <Link href="/create">
            <Button size="lg" className="border-4">
              Create Hunt
            </Button>
          </Link>
          <Link href="/leaderboard">
            <Button variant="outline" size="lg" className="border-4">
              Leaderboard
            </Button>
          </Link>
        </div>

        {/* Hunts Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {huntIds.length === 0 ? (
            <div className="col-span-full border-4 border-celo-purple bg-white p-12 text-center">
              <p className="text-body-bold text-2xl text-celo-purple mb-2">No hunts available yet.</p>
              <p className="text-body-bold text-lg text-celo-brown">Be the first to create one!</p>
            </div>
          ) : (
            huntIds.map((huntId) => (
              <HuntCard key={huntId} huntId={huntId} />
            ))
          )}
        </div>
      </div>
    </main>
  );
}

function HuntCard({ huntId }: { huntId: number }) {
  const { hunt } = useHunt(huntId);

  if (!hunt || !hunt.exists) {
    return null;
  }

  if (!hunt.published) {
    return null; // Don't show unpublished hunts
  }

  const totalReward = formatCUSD(hunt.totalRewards);
  const isActive =
    hunt.startTime <= BigInt(Math.floor(Date.now() / 1000)) &&
    (hunt.endTime === BigInt(0) || hunt.endTime >= BigInt(Math.floor(Date.now() / 1000)));

  return (
    <Card className="hover:border-celo-yellow transition-all">
      <CardHeader>
        <CardTitle className="line-clamp-2">{hunt.title}</CardTitle>
        <CardDescription className="line-clamp-2">{hunt.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center border-2 border-celo-purple bg-celo-tan-light p-3">
            <span className="text-body-bold text-celo-purple">Clues:</span>
            <span className="text-body-bold text-lg text-celo-purple">{Number(hunt.clueCount)}</span>
          </div>
          <div className="flex justify-between items-center border-2 border-celo-green bg-celo-green/10 p-3">
            <span className="text-body-bold text-celo-purple">Reward:</span>
            <span className="text-body-bold text-lg text-celo-green">{totalReward} cUSD</span>
          </div>
          <div className="flex justify-between items-center border-2 border-celo-purple bg-celo-tan-medium p-3">
            <span className="text-body-bold text-celo-purple">Status:</span>
            <span
              className={`text-body-bold text-lg ${
                isActive ? "text-celo-green" : "text-celo-brown"
              }`}
            >
              {isActive ? "ACTIVE" : "ENDED"}
            </span>
          </div>
          <Link href={`/hunt/${huntId}`} className="block">
            <Button className="w-full border-4" size="lg">
              {isActive ? "Start Hunt" : "View Details"}
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
