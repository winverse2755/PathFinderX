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
      
      <div className="container relative mx-auto px-4 sm:px-6 py-6 sm:py-8 md:py-12 max-w-7xl">
        {/* Search Header */}
        <div className="mb-8 sm:mb-12 bg-game-surface border border-game-primary/30 rounded-lg p-5 sm:p-8 md:p-12 animate-fade-in shadow-card">
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <Search className="w-5 h-5 sm:w-6 sm:h-6 text-game-accent" />
            <span className="font-game text-xs sm:text-sm text-game-accent tracking-widest uppercase">Discovery</span>
          </div>
          <h1 className="font-game text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-wider mb-4 sm:mb-6 leading-tight">
            <span className="gradient-text">Search</span>{" "}
            <span className="text-white">Hunts</span>
          </h1>
          <div className="relative w-full max-w-2xl">
            <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-game-text-muted" />
            <Input
              type="text"
              placeholder="Search by title or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 sm:pl-12 h-12 sm:h-14 text-sm sm:text-lg"
            />
          </div>
          {searchQuery && (
            <p className="font-game text-xs sm:text-sm text-game-text-muted mt-3 sm:mt-4">
              Found <span className="text-game-accent font-bold">{filteredHunts.length}</span> hunt(s) matching &quot;{searchQuery}&quot;
            </p>
          )}
        </div>

        {/* Results */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {filteredHunts.length === 0 ? (
            <div className="col-span-full bg-game-surface border border-game-primary/30 rounded-lg p-8 sm:p-12 text-center animate-fade-in">
              <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-full bg-game-primary/20 flex items-center justify-center">
                <Search className="w-6 h-6 sm:w-8 sm:h-8 text-game-primary" />
              </div>
              <p className="font-game text-lg sm:text-xl text-white mb-2">
                {searchQuery ? "No hunts found." : "No hunts available yet."}
              </p>
              <p className="font-game text-sm sm:text-base text-game-text-muted">
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
