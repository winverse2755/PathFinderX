"use client";

import { useState } from "react";
import { useBrowseHunts } from "@/hooks/use-treasure-hunt";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatCUSD } from "@/lib/treasure-hunt-utils";
import Link from "next/link";
import { Search } from "lucide-react";

export default function SearchPage() {
  const { hunts } = useBrowseHunts();
  const [searchQuery, setSearchQuery] = useState("");
  
  const sortedHunts = [...hunts].sort((a, b) => b.id - a.id);
  
  const filteredHunts = sortedHunts.filter((hunt) => {
    const query = searchQuery.toLowerCase();
    return (
      hunt.title.toLowerCase().includes(query) ||
      hunt.description.toLowerCase().includes(query)
    );
  });

  return (
    <main className="flex-1 bg-game-bg min-h-screen relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-grid-pattern opacity-50"></div>
      <div className="absolute inset-0 bg-gradient-radial"></div>
      
      <div className="container relative mx-auto px-6 py-12 max-w-7xl">
        {/* Search Header */}
        <div className="mb-12 bg-game-surface border border-game-primary/30 rounded-lg p-8 md:p-12 animate-fade-in shadow-card">
          <div className="flex items-center gap-3 mb-4">
            <Search className="w-6 h-6 text-game-accent" />
            <span className="font-game text-sm text-game-accent tracking-widest uppercase">Discovery</span>
          </div>
          <h1 className="font-game text-4xl md:text-6xl font-bold tracking-wider mb-6 leading-tight">
            <span className="gradient-text">Search</span>{" "}
            <span className="text-white">Hunts</span>
          </h1>
          <div className="relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-game-text-muted" />
            <Input
              type="text"
              placeholder="Search by title or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-14 text-lg"
            />
          </div>
          {searchQuery && (
            <p className="font-game text-sm text-game-text-muted mt-4">
              Found <span className="text-game-accent font-bold">{filteredHunts.length}</span> hunt(s) matching &quot;{searchQuery}&quot;
            </p>
          )}
        </div>

        {/* Results */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredHunts.length === 0 ? (
            <div className="col-span-full bg-game-surface border border-game-primary/30 rounded-lg p-12 text-center animate-fade-in">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-game-primary/20 flex items-center justify-center">
                <Search className="w-8 h-8 text-game-primary" />
              </div>
              <p className="font-game text-xl text-white mb-2">
                {searchQuery ? "No hunts found." : "No hunts available yet."}
              </p>
              <p className="font-game text-game-text-muted">
                {searchQuery ? "Try a different search term." : "Be the first to create one!"}
              </p>
            </div>
          ) : (
            filteredHunts.map((hunt, index) => (
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
