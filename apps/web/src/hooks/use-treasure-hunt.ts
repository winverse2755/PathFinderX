"use client";

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useAccount } from "wagmi";
import { Address } from "viem";
import { TREASURE_HUNT_ABI, CUSD_ADDRESS, ERC20_ABI } from "@/lib/constants";
import { hashAnswer, parseCUSD } from "@/lib/treasure-hunt-utils";

import { TREASURE_HUNT_CONTRACT } from "@/lib/constants";

export function useTreasureHuntContract() {
  const { address } = useAccount();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  return {
    writeContract,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
    address,
  };
}

export function useIsCreator() {
  const { address } = useAccount();
  const { data: isCreator } = useReadContract({
    address: TREASURE_HUNT_CONTRACT,
    abi: TREASURE_HUNT_ABI,
    functionName: "isCreator",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  return { isCreator: isCreator ?? false };
}

export function useTotalHunts() {
  const { data: totalHunts } = useReadContract({
    address: TREASURE_HUNT_CONTRACT,
    abi: TREASURE_HUNT_ABI,
    functionName: "totalHunts",
  });

  return { totalHunts: totalHunts ? Number(totalHunts) : 0 };
}

export function useHunt(huntId: number | null) {
  const { data: hunt } = useReadContract({
    address: TREASURE_HUNT_CONTRACT,
    abi: TREASURE_HUNT_ABI,
    functionName: "getHunt",
    args: huntId !== null ? [BigInt(huntId)] : undefined,
    query: { enabled: huntId !== null },
  });

  return { hunt };
}

export function useClue(huntId: number | null, clueIndex: number | null) {
  const { data: clue } = useReadContract({
    address: TREASURE_HUNT_CONTRACT,
    abi: TREASURE_HUNT_ABI,
    functionName: "getClue",
    args:
      huntId !== null && clueIndex !== null
        ? [BigInt(huntId), BigInt(clueIndex)]
        : undefined,
    query: { enabled: huntId !== null && clueIndex !== null },
  });

  return { clue };
}

export function usePlayerProgress(huntId: number | null) {
  const { address } = useAccount();
  const { data: progress } = useReadContract({
    address: TREASURE_HUNT_CONTRACT,
    abi: TREASURE_HUNT_ABI,
    functionName: "getPlayerProgress",
    args: huntId !== null && address ? [BigInt(huntId), address] : undefined,
    query: { enabled: huntId !== null && !!address },
  });

  return { progress };
}

export function useCUSDBalance() {
  const { address } = useAccount();
  const { data: balance } = useReadContract({
    address: CUSD_ADDRESS,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
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
    query: { enabled: !!address && !!spender },
  });

  return { allowance: allowance ?? BigInt(0) };
}

// Action hooks
export function useRegisterCreator() {
  const { writeContract, hash, isPending, isConfirming, isConfirmed, error } =
    useTreasureHuntContract();

  const registerCreator = () => {
    if (!TREASURE_HUNT_CONTRACT) {
      throw new Error("Contract address not set");
    }
    writeContract({
      address: TREASURE_HUNT_CONTRACT,
      abi: TREASURE_HUNT_ABI,
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

  const createHunt = (title: string, description: string, startTime: bigint, endTime: bigint) => {
    if (!TREASURE_HUNT_CONTRACT) {
      throw new Error("Contract address not set");
    }
    writeContract({
      address: TREASURE_HUNT_CONTRACT,
      abi: TREASURE_HUNT_ABI,
      functionName: "createHunt",
      args: [title, description, startTime, endTime],
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

  const addClue = (
    huntId: number,
    clueText: string,
    answer: string,
    reward: string,
    location: string
  ) => {
    if (!TREASURE_HUNT_CONTRACT) {
      throw new Error("Contract address not set");
    }
    const answerHash = hashAnswer(answer);
    const rewardAmount = parseCUSD(reward);
    writeContract({
      address: TREASURE_HUNT_CONTRACT,
      abi: TREASURE_HUNT_ABI,
      functionName: "addClue",
      args: [BigInt(huntId), clueText, answerHash, rewardAmount, location],
    });
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
    if (!TREASURE_HUNT_CONTRACT) {
      throw new Error("Contract address not set");
    }
    const amountBigInt = parseCUSD(amount);
    writeContract({
      address: TREASURE_HUNT_CONTRACT,
      abi: TREASURE_HUNT_ABI,
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

export function useApproveCUSD() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const approveCUSD = (spender: Address, amount: bigint) => {
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

export function useSubmitAnswer() {
  const { writeContract, hash, isPending, isConfirming, isConfirmed, error } =
    useTreasureHuntContract();

  const submitAnswer = (huntId: number, clueIndex: number, answer: string) => {
    if (!TREASURE_HUNT_CONTRACT) {
      throw new Error("Contract address not set");
    }
    const answerHash = hashAnswer(answer);
    writeContract({
      address: TREASURE_HUNT_CONTRACT,
      abi: TREASURE_HUNT_ABI,
      functionName: "submitAnswer",
      args: [BigInt(huntId), BigInt(clueIndex), answerHash],
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

export function usePublishHunt() {
  const { writeContract, hash, isPending, isConfirming, isConfirmed, error } =
    useTreasureHuntContract();

  const publishHunt = (huntId: number) => {
    if (!TREASURE_HUNT_CONTRACT) {
      throw new Error("Contract address not set");
    }
    writeContract({
      address: TREASURE_HUNT_CONTRACT,
      abi: TREASURE_HUNT_ABI,
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

