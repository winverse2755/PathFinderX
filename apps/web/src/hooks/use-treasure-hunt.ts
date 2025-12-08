"use client";

import { useState } from "react";
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
  const writeContractOnCelo = (params: any) => {
    // If not on Celo mainnet, switch first
    if (chainId !== CELO_MAINNET_CHAIN_ID) {
      // Trigger chain switch - this will prompt the user
      switchChain({ chainId: CELO_MAINNET_CHAIN_ID });
      throw new Error("Please switch to Celo Mainnet to continue. The wallet will prompt you to switch.");
    }
    // Write contract - chain is determined by the connected chain
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

export function useAddClueWithGeneratedQr() {
  const { writeContract, hash, isPending, isConfirming, isConfirmed, error } =
    useTreasureHuntContract();

  const addClueWithGeneratedQr = (
    huntId: number,
    clueText: string,
    reward: string,
    location: string
  ) => {
    const rewardAmount = parseCUSD(reward);
    writeContract({
      address: TREASURE_HUNT_CREATOR_ADDRESS,
      abi: TREASURE_HUNT_CREATOR_ABI,
      functionName: "addClueWithGeneratedQr",
      args: [BigInt(huntId), clueText, rewardAmount, location],
    });
  };

  return {
    addClueWithGeneratedQr,
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

export function useSubmitAnswer() {
  const { writeContract, hash, isPending, isConfirming, isConfirmed, error } =
    useTreasureHuntContract();

  const submitAnswer = (huntId: number, answer: string) => {
    // Note: The contract hashes the answer internally, so we pass the plain string
    writeContract({
      address: TREASURE_HUNT_PLAYER_ADDRESS,
      abi: TREASURE_HUNT_PLAYER_ABI,
      functionName: "submitAnswer",
      args: [BigInt(huntId), answer],
    });
  };

  return {
    submitAnswer,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
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

// Hook to fetch QR codes from ClueAddedWithQR events
export function useFetchQRCodes(huntId: number | null) {
  const publicClient = usePublicClient({ chainId: CELO_MAINNET_CHAIN_ID });
  const [qrStrings, setQrStrings] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchQRCodes = async () => {
    if (!huntId || !publicClient) return;

    setIsLoading(true);
    setError(null);

    try {
      // Fetch ClueAddedWithQR events for this hunt
      const logs = await publicClient.getLogs({
        address: TREASURE_HUNT_CREATOR_ADDRESS,
        event: {
          type: "event",
          name: "ClueAddedWithQR",
          inputs: [
            { name: "huntId", type: "uint256", indexed: true },
            { name: "clueIndex", type: "uint256", indexed: false },
            { name: "qr", type: "string", indexed: false },
          ],
        } as const,
        args: {
          huntId: BigInt(huntId),
        },
        fromBlock: 0n, // Search from genesis
      });

      // Extract QR strings and sort by clueIndex
      const qrData = logs
        .map((log: any) => ({
          clueIndex: Number(log.args.clueIndex),
          qr: log.args.qr as string,
        }))
        .sort((a, b) => a.clueIndex - b.clueIndex)
        .map((item) => item.qr);

      setQrStrings(qrData);
    } catch (err: any) {
      setError(err);
      console.error("Error fetching QR codes:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    qrStrings,
    isLoading,
    error,
    fetchQRCodes,
  };
}
