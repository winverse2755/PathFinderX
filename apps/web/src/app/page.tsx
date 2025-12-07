"use client";

import { useMiniApp } from "@/contexts/miniapp-context";
import { useAccount } from "wagmi";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useBrowseHunts } from "@/hooks/use-treasure-hunt";
import { formatCUSD } from "@/lib/treasure-hunt-utils";

export default function Home() {
  const { context, isMiniAppReady } = useMiniApp();
  const { address, isConnected } = useAccount();
  const { hunts } = useBrowseHunts();

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
    <main className="flex-1 bg-celo-tan-light min-h-screen">
      <div className="container mx-auto px-6 py-12 max-w-7xl">
        {/* Hero Section */}
        <div className="mb-16 border-4 border-celo-purple bg-celo-yellow p-8 md:p-12 animate-fade-in shadow-lg hover-lift">
          <h1 className="text-display text-5xl md:text-7xl font-display font-light italic text-celo-purple mb-4 leading-tight">
            Treasure <span className="not-italic">Hunt</span>
          </h1>
          <p className="text-body-bold text-xl md:text-2xl text-celo-purple max-w-2xl">
            Discover clues, solve puzzles, and earn cUSD rewards on Celo.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="mb-12 flex flex-wrap gap-4 animate-slide-in">
          <Link href="/create">
            <Button size="lg" className="border-4 transition-premium hover-lift">
              Create Hunt
            </Button>
          </Link>
          <Link href="/leaderboard">
            <Button variant="outline" size="lg" className="border-4 transition-premium hover-lift">
              Leaderboard
            </Button>
          </Link>
        </div>

        {/* Hunts Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {hunts.length === 0 ? (
            <div className="col-span-full border-4 border-celo-purple bg-white p-12 text-center animate-fade-in">
              <p className="text-body-bold text-2xl text-celo-purple mb-2">No hunts available yet.</p>
              <p className="text-body-bold text-lg text-celo-brown">Be the first to create one!</p>
            </div>
          ) : (
            hunts.map((hunt, index) => (
              <div key={hunt.id} className="animate-scale-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <HuntCard hunt={hunt} />
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}

function HuntCard({ hunt }: { hunt: { id: number; title: string; description: string; reward: bigint; clueCount: number; participants: number } }) {
  const totalReward = formatCUSD(hunt.reward);
  const isActive = true; // All hunts from browseHunts are active

  return (
    <Card className="hover:border-celo-yellow transition-premium hover-lift group">
      <CardHeader className="border-b-4 border-celo-purple">
        <CardTitle className="line-clamp-2 group-hover:text-celo-green transition-colors">{hunt.title}</CardTitle>
        <CardDescription className="line-clamp-2 mt-2">{hunt.description}</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex justify-between items-center border-2 border-celo-purple bg-celo-tan-light p-4 transition-premium group-hover:border-celo-yellow group-hover:bg-celo-yellow/20">
            <span className="text-body-bold text-celo-purple">Clues:</span>
            <span className="text-body-bold text-lg text-celo-purple font-bold">{hunt.clueCount}</span>
          </div>
          <div className="flex justify-between items-center border-2 border-celo-green bg-celo-green/10 p-4 transition-premium group-hover:border-celo-green group-hover:bg-celo-green/20">
            <span className="text-body-bold text-celo-purple">Reward:</span>
            <span className="text-body-bold text-lg text-celo-green font-bold">{totalReward} cUSD</span>
          </div>
          <div className="flex justify-between items-center border-2 border-celo-purple bg-celo-tan-dark p-4 transition-premium group-hover:border-celo-purple group-hover:bg-celo-purple/10">
            <span className="text-body-bold text-celo-purple">Participants:</span>
            <span className="text-body-bold text-lg text-celo-purple font-bold">{hunt.participants}</span>
          </div>
          <Link href={`/hunt/${hunt.id}`} className="block">
            <Button className="w-full border-4 transition-premium hover-lift" size="lg">
              Start Hunt
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
