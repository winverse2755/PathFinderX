"use client";

import { useMiniApp } from "@/contexts/miniapp-context";
import { useAccount } from "wagmi";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useBrowseHunts } from "@/hooks/use-treasure-hunt";
import { formatCUSD } from "@/lib/treasure-hunt-utils";

export default function Home() {
  const { isMiniAppReady } = useMiniApp();
  const { hunts } = useBrowseHunts();

  if (!isMiniAppReady) {
    return (
      <main className="flex-1 bg-game-bg bg-grid-pattern min-h-screen">
        <section className="flex items-center justify-center min-h-screen px-4">
          <div className="w-full max-w-md mx-auto p-6 sm:p-8 text-center bg-game-surface border border-game-primary/30 rounded-lg shadow-card">
            <div className="animate-spin h-10 w-10 sm:h-12 sm:w-12 border-4 border-game-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="font-game text-base sm:text-lg text-game-text-muted">Loading...</p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="flex-1 bg-game-bg min-h-screen relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-grid-pattern opacity-50"></div>
      <div className="absolute inset-0 bg-gradient-radial"></div>
      
      <div className="container relative mx-auto px-4 sm:px-6 py-6 sm:py-8 md:py-12 max-w-7xl">
        {/* Hero Section */}
        <div className="mb-8 sm:mb-12 md:mb-16 bg-game-surface border border-game-primary/30 rounded-lg p-5 sm:p-8 md:p-12 animate-fade-in shadow-card hover:shadow-glow-primary transition-all duration-500">
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-game-accent animate-pulse"></div>
            <span className="font-game text-xs sm:text-sm text-game-accent tracking-widest uppercase">Live on Celo</span>
          </div>
          <h1 className="font-game text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-wider mb-3 sm:mb-4 leading-tight">
            <span className="gradient-text">Treasure</span>{" "}
            <span className="text-white">Hunt</span>
          </h1>
          <p className="font-game text-sm sm:text-lg md:text-xl text-game-text-muted max-w-2xl leading-relaxed">
            Discover clues, solve puzzles, and earn <span className="text-game-secondary">cUSD</span> rewards on the blockchain.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="mb-8 sm:mb-12 flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 animate-slide-in">
          <Link href="/create" className="w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto hover-lift">
              Create Hunt
            </Button>
          </Link>
          <Link href="/leaderboard" className="w-full sm:w-auto">
            <Button variant="outline" size="lg" className="w-full sm:w-auto hover-lift">
              Leaderboard
            </Button>
          </Link>
          <Link href="/search" className="w-full sm:w-auto">
            <Button variant="accent" size="lg" className="w-full sm:w-auto hover-lift">
              Search
            </Button>
          </Link>
        </div>

        {/* Hunts Grid */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {hunts.length === 0 ? (
            <div className="col-span-full bg-game-surface border border-game-primary/30 rounded-lg p-8 sm:p-12 text-center animate-fade-in">
              <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-full bg-game-primary/20 flex items-center justify-center">
                <span className="text-2xl sm:text-3xl">🗺️</span>
              </div>
              <p className="font-game text-lg sm:text-xl text-white mb-2">No hunts available yet.</p>
              <p className="font-game text-sm sm:text-base text-game-text-muted">Be the first to create one!</p>
            </div>
          ) : (
            [...hunts].sort((a, b) => b.id - a.id).map((hunt, index) => (
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

  return (
    <Card className="hover:border-game-primary/60 hover:shadow-glow-primary transition-all duration-300 group h-full">
      <CardHeader className="p-4 sm:p-6">
        <div className="flex items-center justify-between mb-2">
          <span className="token-rare px-2 py-1 text-xs font-game font-semibold">
            #{hunt.id}
          </span>
          <span className="flex items-center gap-1 text-game-accent text-xs sm:text-sm font-game">
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-game-success animate-pulse"></span>
            Active
          </span>
        </div>
        <CardTitle className="line-clamp-2 group-hover:text-game-primary transition-colors text-base sm:text-lg">{hunt.title}</CardTitle>
        <CardDescription className="line-clamp-2 mt-2 text-xs sm:text-sm">{hunt.description}</CardDescription>
      </CardHeader>
      <CardContent className="pt-2 sm:pt-4 p-4 sm:p-6">
        <div className="space-y-2 sm:space-y-3">
          <div className="flex justify-between items-center bg-game-bg/50 border border-game-primary/20 rounded-md p-2 sm:p-3 transition-all group-hover:border-game-primary/40">
            <span className="font-game text-xs sm:text-sm text-game-text-muted">Clues</span>
            <span className="font-game text-base sm:text-lg text-white font-bold">{hunt.clueCount}</span>
          </div>
          <div className="flex justify-between items-center bg-game-secondary/10 border border-game-secondary/30 rounded-md p-2 sm:p-3 transition-all group-hover:border-game-secondary/50">
            <span className="font-game text-xs sm:text-sm text-game-text-muted">Reward</span>
            <span className="font-game text-base sm:text-lg text-game-secondary font-bold">{totalReward} cUSD</span>
          </div>
          <div className="flex justify-between items-center bg-game-bg/50 border border-game-primary/20 rounded-md p-2 sm:p-3 transition-all group-hover:border-game-primary/40">
            <span className="font-game text-xs sm:text-sm text-game-text-muted">Players</span>
            <span className="font-game text-base sm:text-lg text-white font-bold">{hunt.participants}</span>
          </div>
          <Link href={`/hunt/${hunt.id}`} className="block">
            <Button className="w-full hover-lift" size="lg">
              Start Hunt
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
