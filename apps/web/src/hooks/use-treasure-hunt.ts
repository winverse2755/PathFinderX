"use client";

import { useState, useEffect } from "react";
import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useChainId, useSwitchChain, usePublicClient } from "wagmi";
import { useAccount } from "wagmi";
import { Address } from "viem";
import {
  TREASURE_HUNT_CREATOR_ADDRESS,
  TREASURE_HUNT_PLAYER_ADDRESS,
  TREASURE_HUNT_CREATOR_ABI,
  TREASURE_HUNT_PLAYER_ABI,
  CUSD_ADDRESS,
  ERC20_ABI,
  CELO_MAINNET_CHAIN_ID,
} from "@/lib/contract-abis";
import { parseCUSD } from "@/lib/treasure-hunt-utils";
import { celo } from "wagmi/chains";

// Base hook for contract interactions
export function useTreasureHuntContract() {
  const { address } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  // Helper to ensure we're on Celo mainnet before writing
  const writeContractOnCelo = async (params: any) => {
    // If not on Celo mainnet, switch first
    if (chainId !== CELO_MAINNET_CHAIN_ID) {
      try {
        // Trigger chain switch - this will prompt the user
        await switchChain({ chainId: CELO_MAINNET_CHAIN_ID });
        // Wait a bit for chain switch to complete
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (err: any) {
        throw new Error("Please switch to Celo Mainnet to continue. The wallet will prompt you to switch.");
      }
    }
    // Write contract - this is synchronous and will trigger the wallet prompt
    // The transaction hash will be available via the hook's hash state
    // Errors will be available via the hook's error state
    return writeContract(params);
  };

  return {
    writeContract: writeContractOnCelo,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
    address,
    chainId,
    isOnCeloMainnet: chainId === CELO_MAINNET_CHAIN_ID,
  };
}

// Creator hooks
export function useIsCreator() {
  const { address } = useAccount();
  const { data: isCreator } = useReadContract({
    address: TREASURE_HUNT_CREATOR_ADDRESS,
    abi: TREASURE_HUNT_CREATOR_ABI,
    functionName: "registeredCreator",
    args: address ? [address] : undefined,
    chainId: CELO_MAINNET_CHAIN_ID,
    query: { enabled: !!address },
  });

  return { isCreator: isCreator ?? false };
}

export function useRegisterCreator() {
  const { writeContract, hash, isPending, isConfirming, isConfirmed, error } =
    useTreasureHuntContract();

  const registerCreator = () => {
    writeContract({
      address: TREASURE_HUNT_CREATOR_ADDRESS,
      abi: TREASURE_HUNT_CREATOR_ABI,
      functionName: "registerCreator",
    });
  };

  return {
    registerCreator,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  };
}

export function useCreateHunt() {
  const { writeContract, hash, isPending, isConfirming, isConfirmed, error } =
    useTreasureHuntContract();

  const createHunt = (title: string, description: string) => {
    writeContract({
      address: TREASURE_HUNT_CREATOR_ADDRESS,
      abi: TREASURE_HUNT_CREATOR_ABI,
      functionName: "createHunt",
      args: [title, description],
    });
  };

  return {
    createHunt,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  };
}

export function useAddClue() {
  const { writeContract, hash, isPending, isConfirming, isConfirmed, error } =
    useTreasureHuntContract();

  const addClue = async (
    huntId: number,
    clueText: string,
    answer: string,
    reward: string,
    location: string
  ) => {
    try {
      const rewardAmount = parseCUSD(reward);
      // writeContractOnCelo handles chain switching and calls writeContract
      // writeContract is synchronous and will trigger wallet prompt
      // Errors will be available via the hook's error state
      await writeContract({
        address: TREASURE_HUNT_CREATOR_ADDRESS,
        abi: TREASURE_HUNT_CREATOR_ABI,
        functionName: "addClue",
        args: [BigInt(huntId), clueText, answer, rewardAmount, location],
      });
    } catch (err: any) {
      // Re-throw to let caller handle it
      throw err;
    }
  };

  return {
    addClue,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  };
}

export function useFundHunt() {
  const { writeContract, hash, isPending, isConfirming, isConfirmed, error } =
    useTreasureHuntContract();

  const fundHunt = (huntId: number, amount: string) => {
    const amountBigInt = parseCUSD(amount);
    writeContract({
      address: TREASURE_HUNT_CREATOR_ADDRESS,
      abi: TREASURE_HUNT_CREATOR_ABI,
      functionName: "fundHunt",
      args: [BigInt(huntId), amountBigInt],
    });
  };

  return {
    fundHunt,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  };
}

export function usePublishHunt() {
  const { writeContract, hash, isPending, isConfirming, isConfirmed, error } =
    useTreasureHuntContract();

  const publishHunt = (huntId: number) => {
    writeContract({
      address: TREASURE_HUNT_CREATOR_ADDRESS,
      abi: TREASURE_HUNT_CREATOR_ABI,
      functionName: "publishHunt",
      args: [BigInt(huntId)],
    });
  };

  return {
    publishHunt,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  };
}

// Player hooks
export function useBrowseHunts() {
  const { data: huntsData } = useReadContract({
    address: TREASURE_HUNT_PLAYER_ADDRESS,
    abi: TREASURE_HUNT_PLAYER_ABI,
    functionName: "browseHunts",
    chainId: CELO_MAINNET_CHAIN_ID,
  });

  if (!huntsData) {
    return { hunts: [] };
  }

  const [huntIds, titles, descriptions, rewards, clueCounts, participants] = huntsData as [
    bigint[],
    string[],
    string[],
    bigint[],
    bigint[],
    bigint[],
  ];

  const hunts = huntIds.map((id, index) => ({
    id: Number(id),
    title: titles[index],
    description: descriptions[index],
    reward: rewards[index],
    clueCount: Number(clueCounts[index]),
    participants: Number(participants[index]),
  }));

  return { hunts };
}

export function useSelectHunt(huntId: number | null) {
  const { data: huntData } = useReadContract({
    address: TREASURE_HUNT_PLAYER_ADDRESS,
    abi: TREASURE_HUNT_PLAYER_ABI,
    functionName: "selectHunt",
    args: huntId !== null ? [BigInt(huntId)] : undefined,
    chainId: CELO_MAINNET_CHAIN_ID,
    query: { enabled: huntId !== null },
  });

  if (!huntData) {
    return { hunt: null };
  }

  // Type assertion to handle the readonly tuple from wagmi
  // The contract returns: title, description, totalReward, clueCount, playerProgress, isCompleted, startTime
  const huntTuple = huntData as readonly [string, string, bigint, bigint, bigint, boolean, bigint];
  const [title, description, totalReward, clueCount, playerProgress, isCompleted] = huntTuple;

  return {
    hunt: {
      title,
      description,
      totalReward,
      clueCount: Number(clueCount),
      playerProgress: Number(playerProgress),
      isCompleted,
    },
  };
}

export function useStartHunt() {
  const { writeContract, hash, isPending, isConfirming, isConfirmed, error } =
    useTreasureHuntContract();

  const startHunt = (huntId: number) => {
    writeContract({
      address: TREASURE_HUNT_PLAYER_ADDRESS,
      abi: TREASURE_HUNT_PLAYER_ABI,
      functionName: "startHunt",
      args: [BigInt(huntId)],
    });
  };

  return {
    startHunt,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  };
}

// Check if user is the creator of a hunt
export function useIsHuntCreator(huntId: number | null) {
  const { address } = useAccount();
  const { data: huntOwner } = useReadContract({
    address: TREASURE_HUNT_CREATOR_ADDRESS,
    abi: TREASURE_HUNT_CREATOR_ABI,
    functionName: "huntOwner",
    args: huntId !== null ? [BigInt(huntId)] : undefined,
    chainId: CELO_MAINNET_CHAIN_ID,
    query: { enabled: huntId !== null && !!address },
  });

  return { isCreator: huntOwner && address ? huntOwner.toLowerCase() === address.toLowerCase() : false };
}

export function useViewCurrentClue(huntId: number | null, enabled: boolean = true) {
  const { address } = useAccount();
  const { data: clueData, isLoading, error, refetch } = useReadContract({
    address: TREASURE_HUNT_PLAYER_ADDRESS,
    abi: TREASURE_HUNT_PLAYER_ABI,
    functionName: "viewCurrentClue",
    args: huntId !== null ? [BigInt(huntId)] : undefined,
    account: address, // Explicitly set account so msg.sender is the connected wallet
    chainId: CELO_MAINNET_CHAIN_ID,
    query: { enabled: huntId !== null && enabled && !!address },
  });

  if (!clueData) {
    return { clue: null, isLoading, error, refetch };
  }

  const [clueText, reward, clueIndex, location] = clueData as [
    string,
    bigint,
    bigint,
    string,
  ];

  return {
    clue: {
      clueText,
      reward,
      clueIndex: Number(clueIndex),
      location,
    },
    isLoading,
    error,
    refetch,
  };
}

// Helper to parse submitAnswer errors into user-friendly messages
function parseSubmitAnswerError(error: Error | null): string | null {
  if (!error) return null;
  
  const message = error.message || error.toString();
  
  // Check for "Incorrect answer" revert from contract
  if (message.toLowerCase().includes('incorrect answer')) {
    return 'Wrong Answer';
  }
  
  // Check for user rejection
  if (
    message.toLowerCase().includes('user rejected') ||
    message.toLowerCase().includes('user denied') ||
    message.toLowerCase().includes('rejected the request')
  ) {
    return null; // Don't show error for user cancellation
  }
  
  // Check for other common contract reverts
  if (message.includes('Hunt not started')) {
    return 'Please start the hunt first';
  }
  if (message.includes('Hunt already completed')) {
    return 'You have already completed this hunt';
  }
  if (message.includes('No more clues')) {
    return 'No more clues available';
  }
  
  // Fallback - return cleaned message without stack trace
  const cleanMessage = message.split('\n')[0].replace(/^Error:\s*/i, '');
  return cleanMessage.length > 100 ? cleanMessage.substring(0, 100) + '...' : cleanMessage;
}

export function useSubmitAnswer() {
  const { writeContract, hash, isPending, isConfirming, isConfirmed, error } =
    useTreasureHuntContract();

  const submitAnswer = (huntId: number, answer: string) => {
    // Note: The contract hashes the answer internally, so we pass the plain string
    // Manual gas limit bypasses wagmi's simulation which would fail on wrong answers
    // (contract reverts with "Incorrect answer" causing simulation to fail before wallet prompt)
    writeContract({
      address: TREASURE_HUNT_PLAYER_ADDRESS,
      abi: TREASURE_HUNT_PLAYER_ABI,
      functionName: "submitAnswer",
      args: [BigInt(huntId), answer],
      gas: BigInt(300000),
    });
  };

  // Parse error to show user-friendly message for wrong answers
  const parsedError = parseSubmitAnswerError(error);

  return {
    submitAnswer,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
    parsedError,
  };
}

export function useGetDetailedProgress(huntId: number | null) {
  const { address } = useAccount();
  const { data: progressData, refetch } = useReadContract({
    address: TREASURE_HUNT_PLAYER_ADDRESS,
    abi: TREASURE_HUNT_PLAYER_ABI,
    functionName: "getDetailedProgress",
    args: huntId !== null && address ? [BigInt(huntId), address] : undefined,
    chainId: CELO_MAINNET_CHAIN_ID,
    query: { enabled: huntId !== null && !!address },
  });

  if (!progressData) {
    return { progress: null, refetch };
  }

  const [currentClue, totalClues, hasStarted, hasCompleted, startTime] = progressData as [
    bigint,
    bigint,
    boolean,
    boolean,
    bigint,
  ];

  return {
    progress: {
      currentClue: Number(currentClue),
      totalClues: Number(totalClues),
      hasStarted,
      hasCompleted,
      startTime: Number(startTime),
    },
    refetch,
  };
}


// cUSD hooks
export function useCUSDBalance() {
  const { address } = useAccount();
  const { data: balance } = useReadContract({
    address: CUSD_ADDRESS,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: CELO_MAINNET_CHAIN_ID,
    query: { enabled: !!address },
  });

  return { balance: balance ?? BigInt(0) };
}

export function useCUSDAllowance(spender: Address | undefined) {
  const { address } = useAccount();
  const { data: allowance } = useReadContract({
    address: CUSD_ADDRESS,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: address && spender ? [address, spender] : undefined,
    chainId: CELO_MAINNET_CHAIN_ID,
    query: { enabled: !!address && !!spender },
  });

  return { allowance: allowance ?? BigInt(0) };
}

export function useApproveCUSD() {
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const approveCUSD = (spender: Address, amount: bigint) => {
    // If not on Celo mainnet, switch first
    if (chainId !== CELO_MAINNET_CHAIN_ID) {
      switchChain({ chainId: CELO_MAINNET_CHAIN_ID });
      throw new Error("Please switch to Celo Mainnet to continue. The wallet will prompt you to switch.");
    }
    // Write contract - chain is determined by the connected chain
    writeContract({
      address: CUSD_ADDRESS,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [spender, amount],
    });
  };

  return {
    approveCUSD,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  };
}

// Leaderboard entry type
export type LeaderboardEntry = {
  player: Address;
  cluesCompleted: number;
  totalTime: number; // in seconds
  isCompleted: boolean;
  rank: number;
  startTime: number;
  completionTime: number | null;
};

// Hook to fetch and build leaderboard from events
export function useHuntLeaderboard(huntId: number | null) {
  const publicClient = usePublicClient({ chainId: CELO_MAINNET_CHAIN_ID });
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      if (!huntId || !publicClient) {
        setLeaderboard([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Get current block number to limit search range
        const currentBlock = await publicClient.getBlockNumber();
        const fromBlock = currentBlock > 200000n ? currentBlock - 200000n : 0n;

        // Fetch HuntStarted events
        const startedLogs = await publicClient.getLogs({
          address: TREASURE_HUNT_PLAYER_ADDRESS,
          event: {
            type: "event",
            name: "HuntStarted",
            inputs: [
              { name: "huntId", type: "uint256", indexed: true },
              { name: "player", type: "address", indexed: true },
              { name: "timestamp", type: "uint256", indexed: false },
            ],
          } as const,
          args: {
            huntId: BigInt(huntId),
          },
          fromBlock,
          toBlock: currentBlock,
        });

        // Fetch AnswerSubmitted events (only correct answers)
        const answerLogs = await publicClient.getLogs({
          address: TREASURE_HUNT_PLAYER_ADDRESS,
          event: {
            type: "event",
            name: "AnswerSubmitted",
            inputs: [
              { name: "huntId", type: "uint256", indexed: true },
              { name: "player", type: "address", indexed: true },
              { name: "clueIndex", type: "uint256", indexed: false },
              { name: "correct", type: "bool", indexed: false },
              { name: "timestamp", type: "uint256", indexed: false },
            ],
          } as const,
          args: {
            huntId: BigInt(huntId),
          },
          fromBlock,
          toBlock: currentBlock,
        });

        // Fetch HuntCompleted events
        const completedLogs = await publicClient.getLogs({
          address: TREASURE_HUNT_PLAYER_ADDRESS,
          event: {
            type: "event",
            name: "HuntCompleted",
            inputs: [
              { name: "huntId", type: "uint256", indexed: true },
              { name: "player", type: "address", indexed: true },
              { name: "completionTime", type: "uint256", indexed: false },
              { name: "totalReward", type: "uint256", indexed: false },
              { name: "leaderboardPosition", type: "uint256", indexed: false },
            ],
          } as const,
          args: {
            huntId: BigInt(huntId),
          },
          fromBlock,
          toBlock: currentBlock,
        });

        // Build player data map
        const playerData = new Map<Address, {
          startTime: number;
          cluesCompleted: Set<number>;
          completionTime: number | null;
        }>();

        // Process HuntStarted events
        startedLogs.forEach((log: any) => {
          const player = log.args.player as Address;
          const timestamp = Number(log.args.timestamp);
          if (!playerData.has(player)) {
            playerData.set(player, {
              startTime: timestamp,
              cluesCompleted: new Set(),
              completionTime: null,
            });
          } else {
            // Update start time if earlier
            const data = playerData.get(player)!;
            if (timestamp < data.startTime) {
              data.startTime = timestamp;
            }
          }
        });

        // Process AnswerSubmitted events (only correct answers)
        answerLogs.forEach((log: any) => {
          const player = log.args.player as Address;
          const isCorrect = log.args.correct as boolean;
          const clueIndex = Number(log.args.clueIndex);

          if (isCorrect && playerData.has(player)) {
            playerData.get(player)!.cluesCompleted.add(clueIndex);
          }
        });

        // Process HuntCompleted events
        completedLogs.forEach((log: any) => {
          const player = log.args.player as Address;
          const completionTime = Number(log.args.completionTime);
          const data = playerData.get(player);
          if (data) {
            data.completionTime = completionTime;
          }
        });

        // Convert to leaderboard entries
        const entries: LeaderboardEntry[] = Array.from(playerData.entries()).map(([player, data]) => {
          const isCompleted = data.completionTime !== null;
          const totalTime = isCompleted && data.completionTime !== null
            ? data.completionTime - data.startTime
            : Math.floor(Date.now() / 1000) - data.startTime;

          return {
            player,
            cluesCompleted: data.cluesCompleted.size,
            totalTime,
            isCompleted,
            rank: 0, // Will be set after sorting
            startTime: data.startTime,
            completionTime: data.completionTime,
          };
        });

        // Sort: Completed players by time (fastest first), then in-progress by clues completed (most first)
        entries.sort((a, b) => {
          if (a.isCompleted && b.isCompleted) {
            return a.totalTime - b.totalTime; // Faster completion = better rank
          }
          if (a.isCompleted && !b.isCompleted) {
            return -1; // Completed players rank higher
          }
          if (!a.isCompleted && b.isCompleted) {
            return 1;
          }
          // Both in progress: sort by clues completed (descending)
          return b.cluesCompleted - a.cluesCompleted;
        });

        // Assign ranks
        entries.forEach((entry, index) => {
          entry.rank = index + 1;
        });

        setLeaderboard(entries);
      } catch (err: any) {
        setError(err);
        console.error("Error fetching leaderboard:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
  }, [huntId, publicClient]);

  return {
    leaderboard,
    isLoading,
    error,
  };
}

// Global leaderboard entry type
export type GlobalLeaderboardEntry = {
  player: Address;
  huntsCompleted: number;
  totalRewards: bigint;
  totalCluesSolved: number;
  bestCompletionTime: number | null; // in seconds
  rank: number;
};

// Hook to fetch and build global leaderboard from events across all hunts
export function useGlobalLeaderboard() {
  const publicClient = usePublicClient({ chainId: CELO_MAINNET_CHAIN_ID });
  const [leaderboard, setLeaderboard] = useState<GlobalLeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchGlobalLeaderboard = async () => {
      if (!publicClient) {
        setLeaderboard([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Get current block number to limit search range
        const currentBlock = await publicClient.getBlockNumber();
        const fromBlock = currentBlock > 200000n ? currentBlock - 200000n : 0n;

        // Fetch HuntCompleted events across all hunts
        const completedLogs = await publicClient.getLogs({
          address: TREASURE_HUNT_PLAYER_ADDRESS,
          event: {
            type: "event",
            name: "HuntCompleted",
            inputs: [
              { name: "huntId", type: "uint256", indexed: true },
              { name: "player", type: "address", indexed: true },
              { name: "completionTime", type: "uint256", indexed: false },
              { name: "totalReward", type: "uint256", indexed: false },
              { name: "leaderboardPosition", type: "uint256", indexed: false },
            ],
          } as const,
          fromBlock,
          toBlock: currentBlock,
        });

        // Fetch AnswerSubmitted events (only correct answers) across all hunts
        const answerLogs = await publicClient.getLogs({
          address: TREASURE_HUNT_PLAYER_ADDRESS,
          event: {
            type: "event",
            name: "AnswerSubmitted",
            inputs: [
              { name: "huntId", type: "uint256", indexed: true },
              { name: "player", type: "address", indexed: true },
              { name: "clueIndex", type: "uint256", indexed: false },
              { name: "correct", type: "bool", indexed: false },
              { name: "timestamp", type: "uint256", indexed: false },
            ],
          } as const,
          fromBlock,
          toBlock: currentBlock,
        });

        // Build player data map
        const playerData = new Map<Address, {
          huntsCompleted: number;
          totalRewards: bigint;
          totalCluesSolved: number;
          bestCompletionTime: number | null;
        }>();

        // Process HuntCompleted events
        completedLogs.forEach((log: any) => {
          const player = log.args.player as Address;
          const totalReward = log.args.totalReward as bigint;
          const completionTime = Number(log.args.completionTime);

          if (!playerData.has(player)) {
            playerData.set(player, {
              huntsCompleted: 1,
              totalRewards: totalReward,
              totalCluesSolved: 0,
              bestCompletionTime: completionTime,
            });
          } else {
            const data = playerData.get(player)!;
            data.huntsCompleted++;
            data.totalRewards += totalReward;
            // Update best time if this is faster
            if (data.bestCompletionTime === null || completionTime < data.bestCompletionTime) {
              data.bestCompletionTime = completionTime;
            }
          }
        });

        // Process AnswerSubmitted events (only correct answers)
        // Count unique (huntId, clueIndex) pairs per player to get total clues solved
        const playerClueSet = new Map<Address, Set<string>>();
        answerLogs.forEach((log: any) => {
          const player = log.args.player as Address;
          const isCorrect = log.args.correct as boolean;
          const huntId = log.args.huntId as bigint;
          const clueIndex = Number(log.args.clueIndex);

          if (isCorrect) {
            if (!playerClueSet.has(player)) {
              playerClueSet.set(player, new Set());
            }
            // Use huntId:clueIndex as unique identifier
            const clueKey = `${huntId.toString()}:${clueIndex}`;
            playerClueSet.get(player)!.add(clueKey);
          }
        });

        // Update total clues solved for each player
        playerClueSet.forEach((clueSet, player) => {
          if (!playerData.has(player)) {
            playerData.set(player, {
              huntsCompleted: 0,
              totalRewards: 0n,
              totalCluesSolved: clueSet.size,
              bestCompletionTime: null,
            });
          } else {
            playerData.get(player)!.totalCluesSolved = clueSet.size;
          }
        });

        // Convert to leaderboard entries
        const entries: GlobalLeaderboardEntry[] = Array.from(playerData.entries()).map(([player, data]) => ({
          player,
          huntsCompleted: data.huntsCompleted,
          totalRewards: data.totalRewards,
          totalCluesSolved: data.totalCluesSolved,
          bestCompletionTime: data.bestCompletionTime,
          rank: 0, // Will be set after sorting
        }));

        // Sort: Primary by hunts completed (descending), then by total rewards (descending), then by best time (ascending)
        entries.sort((a, b) => {
          // First sort by hunts completed
          if (a.huntsCompleted !== b.huntsCompleted) {
            return b.huntsCompleted - a.huntsCompleted;
          }
          // Then by total rewards
          if (a.totalRewards !== b.totalRewards) {
            return a.totalRewards > b.totalRewards ? -1 : 1;
          }
          // Then by best completion time (faster is better)
          if (a.bestCompletionTime !== null && b.bestCompletionTime !== null) {
            return a.bestCompletionTime - b.bestCompletionTime;
          }
          if (a.bestCompletionTime !== null && b.bestCompletionTime === null) {
            return -1;
          }
          if (a.bestCompletionTime === null && b.bestCompletionTime !== null) {
            return 1;
          }
          return 0;
        });

        // Assign ranks
        entries.forEach((entry, index) => {
          entry.rank = index + 1;
        });

        setLeaderboard(entries);
      } catch (err: any) {
        setError(err);
        console.error("Error fetching global leaderboard:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGlobalLeaderboard();
  }, [publicClient]);

  return {
    leaderboard,
    isLoading,
    error,
  };
}

