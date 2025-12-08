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
        <section className="flex items-center justify-center min-h-screen">
          <div className="w-full max-w-md mx-auto p-8 text-center bg-game-surface border border-game-primary/30 rounded-lg shadow-card">
            <div className="animate-spin h-12 w-12 border-4 border-game-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="font-game text-lg text-game-text-muted">Loading...</p>
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
      
      <div className="container relative mx-auto px-6 py-12 max-w-7xl">
        {/* Hero Section */}
        <div className="mb-16 bg-game-surface border border-game-primary/30 rounded-lg p-8 md:p-12 animate-fade-in shadow-card hover:shadow-glow-primary transition-all duration-500">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-3 h-3 rounded-full bg-game-accent animate-pulse"></div>
            <span className="font-game text-sm text-game-accent tracking-widest uppercase">Live on Celo</span>
          </div>
          <h1 className="font-game text-4xl md:text-6xl font-bold tracking-wider mb-4 leading-tight">
            <span className="gradient-text">Treasure</span>{" "}
            <span className="text-white">Hunt</span>
          </h1>
          <p className="font-game text-lg md:text-xl text-game-text-muted max-w-2xl leading-relaxed">
            Discover clues, solve puzzles, and earn <span className="text-game-secondary">cUSD</span> rewards on the blockchain.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="mb-12 flex flex-wrap gap-4 animate-slide-in">
          <Link href="/create">
            <Button size="lg" className="hover-lift">
              Create Hunt
            </Button>
          </Link>
          <Link href="/leaderboard">
            <Button variant="outline" size="lg" className="hover-lift">
              Leaderboard
            </Button>
          </Link>
          <Link href="/search">
            <Button variant="accent" size="lg" className="hover-lift">
              Search
            </Button>
          </Link>
        </div>

        {/* Hunts Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {hunts.length === 0 ? (
            <div className="col-span-full bg-game-surface border border-game-primary/30 rounded-lg p-12 text-center animate-fade-in">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-game-primary/20 flex items-center justify-center">
                <span className="text-3xl">🗺️</span>
              </div>
              <p className="font-game text-xl text-white mb-2">No hunts available yet.</p>
              <p className="font-game text-game-text-muted">Be the first to create one!</p>
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
    <Card className="hover:border-game-primary/60 hover:shadow-glow-primary transition-all duration-300 group">
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <span className="token-rare px-2 py-1 text-xs font-game font-semibold">
            #{hunt.id}
          </span>
          <span className="flex items-center gap-1 text-game-accent text-sm font-game">
            <span className="w-2 h-2 rounded-full bg-game-success animate-pulse"></span>
            Active
          </span>
        </div>
        <CardTitle className="line-clamp-2 group-hover:text-game-primary transition-colors">{hunt.title}</CardTitle>
        <CardDescription className="line-clamp-2 mt-2">{hunt.description}</CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-3">
          <div className="flex justify-between items-center bg-game-bg/50 border border-game-primary/20 rounded-md p-3 transition-all group-hover:border-game-primary/40">
            <span className="font-game text-sm text-game-text-muted">Clues</span>
            <span className="font-game text-lg text-white font-bold">{hunt.clueCount}</span>
          </div>
          <div className="flex justify-between items-center bg-game-secondary/10 border border-game-secondary/30 rounded-md p-3 transition-all group-hover:border-game-secondary/50">
            <span className="font-game text-sm text-game-text-muted">Reward</span>
            <span className="font-game text-lg text-game-secondary font-bold">{totalReward} cUSD</span>
          </div>
          <div className="flex justify-between items-center bg-game-bg/50 border border-game-primary/20 rounded-md p-3 transition-all group-hover:border-game-primary/40">
            <span className="font-game text-sm text-game-text-muted">Players</span>
            <span className="font-game text-lg text-white font-bold">{hunt.participants}</span>
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
