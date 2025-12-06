import { keccak256, encodePacked } from "viem";

/**
 * Normalize answer: lowercase, trim whitespace, remove extra spaces
 */
export function normalizeAnswer(answer: string): string {
  return answer
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\s/g, ""); // Remove all spaces
}

/**
 * Hash an answer using keccak256 (same as Solidity)
 */
export function hashAnswer(answer: string): `0x${string}` {
  const normalized = normalizeAnswer(answer);
  return keccak256(encodePacked(["string"], [normalized]));
}

/**
 * Format cUSD amount for display
 */
export function formatCUSD(amount: bigint): string {
  const decimals = 18;
  const divisor = BigInt(10 ** decimals);
  const whole = amount / divisor;
  const fraction = amount % divisor;
  
  if (fraction === BigInt(0)) {
    return whole.toString();
  }
  
  const fractionStr = fraction.toString().padStart(decimals, "0");
  const trimmed = fractionStr.replace(/0+$/, "");
  
  if (trimmed === "") {
    return whole.toString();
  }
  
  return `${whole}.${trimmed}`;
}

/**
 * Parse cUSD amount from string (e.g., "1.5" -> 1.5 * 10^18)
 */
export function parseCUSD(amount: string): bigint {
  const decimals = 18;
  const parts = amount.split(".");
  
  if (parts.length === 1) {
    return BigInt(parts[0]) * BigInt(10 ** decimals);
  }
  
  const whole = BigInt(parts[0]);
  const fraction = parts[1].padEnd(decimals, "0").slice(0, decimals);
  const fractionBigInt = BigInt(fraction);
  
  return whole * BigInt(10 ** decimals) + fractionBigInt;
}

/**
 * Validate reward amount (0.01 to 10.00 cUSD)
 */
export function validateReward(amount: string): { valid: boolean; error?: string } {
  const num = parseFloat(amount);
  
  if (isNaN(num)) {
    return { valid: false, error: "Invalid number" };
  }
  
  if (num < 0.01) {
    return { valid: false, error: "Minimum reward is 0.01 cUSD" };
  }
  
  if (num > 10) {
    return { valid: false, error: "Maximum reward is 10.00 cUSD" };
  }
  
  return { valid: true };
}

