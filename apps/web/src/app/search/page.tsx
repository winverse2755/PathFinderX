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
  
  // Sort hunts by newest first
  const sortedHunts = [...hunts].sort((a, b) => b.id - a.id);
  
  const filteredHunts = sortedHunts.filter((hunt) => {
    const query = searchQuery.toLowerCase();
    return (
      hunt.title.toLowerCase().includes(query) ||
      hunt.description.toLowerCase().includes(query)
    );
  });

  return (
    <main className="flex-1 bg-celo-tan-light min-h-screen">
      <div className="container mx-auto px-6 py-12 max-w-7xl">
        {/* Search Header */}
        <div className="mb-12 border-4 border-celo-purple bg-celo-yellow p-8 md:p-12 animate-fade-in shadow-lg hover-lift">
          <h1 className="text-display text-5xl md:text-7xl font-display font-light italic text-celo-purple mb-6 leading-tight">
            Search <span className="not-italic">Hunts</span>
          </h1>
          <div className="relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-celo-brown" />
            <Input
              type="text"
              placeholder="Search by title or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-14 text-lg border-4 border-celo-purple bg-white text-celo-purple"
            />
          </div>
        </div>

        {/* Results */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredHunts.length === 0 ? (
            <div className="col-span-full border-4 border-celo-purple bg-white p-12 text-center animate-fade-in">
              <p className="text-body-bold text-2xl text-celo-purple mb-2">
                {searchQuery ? "No hunts found." : "No hunts available yet."}
              </p>
              <p className="text-body-bold text-lg text-celo-brown">
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

