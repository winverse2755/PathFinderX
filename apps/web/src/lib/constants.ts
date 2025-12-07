// Re-export from contract-abis for backward compatibility
export {
  CUSD_ADDRESS,
  CELO_MAINNET_CHAIN_ID,
  TREASURE_HUNT_CREATOR_ADDRESS,
  TREASURE_HUNT_PLAYER_ADDRESS,
  ERC20_ABI,
} from "./contract-abis";

// Legacy export for backward compatibility (deprecated - use TREASURE_HUNT_PLAYER_ADDRESS instead)
import { TREASURE_HUNT_PLAYER_ADDRESS } from "./contract-abis";
export const TREASURE_HUNT_CONTRACT = TREASURE_HUNT_PLAYER_ADDRESS;

// Legacy ABI export (deprecated - use TREASURE_HUNT_PLAYER_ABI from contract-abis instead)
// Keeping for backward compatibility but should be removed in future
export const TREASURE_HUNT_ABI = [
  {
    inputs: [{ internalType: "address", name: "_cUSD", type: "address" }],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [],
    name: "registerCreator",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "string", name: "_title", type: "string" },
      { internalType: "string", name: "_description", type: "string" },
      { internalType: "uint256", name: "_startTime", type: "uint256" },
      { internalType: "uint256", name: "_endTime", type: "uint256" },
    ],
    name: "createHunt",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_huntId", type: "uint256" },
      { internalType: "string", name: "_clueText", type: "string" },
      { internalType: "bytes32", name: "_answerHash", type: "bytes32" },
      { internalType: "uint256", name: "_reward", type: "uint256" },
      { internalType: "string", name: "_location", type: "string" },
    ],
    name: "addClue",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_huntId", type: "uint256" },
      { internalType: "uint256", name: "_amount", type: "uint256" },
    ],
    name: "fundHunt",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_huntId", type: "uint256" }],
    name: "publishHunt",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_huntId", type: "uint256" },
      { internalType: "uint256", name: "_clueIndex", type: "uint256" },
      { internalType: "bytes32", name: "_answerHash", type: "bytes32" },
    ],
    name: "submitAnswer",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_huntId", type: "uint256" },
      { internalType: "address", name: "_player", type: "address" },
    ],
    name: "getPlayerProgress",
    outputs: [
      {
        components: [
          { internalType: "uint256", name: "currentClueIndex", type: "uint256" },
          { internalType: "uint256", name: "totalEarned", type: "uint256" },
          { internalType: "bool", name: "hasStarted", type: "bool" },
        ],
        internalType: "struct TreasureHunt.PlayerProgress",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_huntId", type: "uint256" }],
    name: "getHunt",
    outputs: [
      {
        components: [
          { internalType: "address", name: "creator", type: "address" },
          { internalType: "string", name: "title", type: "string" },
          { internalType: "string", name: "description", type: "string" },
          { internalType: "uint256", name: "startTime", type: "uint256" },
          { internalType: "uint256", name: "endTime", type: "uint256" },
          { internalType: "uint256", name: "totalRewards", type: "uint256" },
          { internalType: "uint256", name: "totalClaimed", type: "uint256" },
          { internalType: "uint256", name: "clueCount", type: "uint256" },
          { internalType: "bool", name: "published", type: "bool" },
          { internalType: "bool", name: "exists", type: "bool" },
        ],
        internalType: "struct TreasureHunt.Hunt",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_huntId", type: "uint256" },
      { internalType: "uint256", name: "_clueIndex", type: "uint256" },
    ],
    name: "getClue",
    outputs: [
      {
        components: [
          { internalType: "string", name: "clueText", type: "string" },
          { internalType: "bytes32", name: "answerHash", type: "bytes32" },
          { internalType: "uint256", name: "reward", type: "uint256" },
          { internalType: "string", name: "location", type: "string" },
          { internalType: "bool", name: "exists", type: "bool" },
        ],
        internalType: "struct TreasureHunt.Clue",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_huntId", type: "uint256" }],
    name: "refundHunt",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "totalHunts",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "isCreator",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// QR Code URL format: celo-hunt://hunt/{huntId}/clue/{clueIndex}/token/{answerHash}
export function generateQRCodeURL(
  huntId: number,
  clueIndex: number,
  answerHash: string
): string {
  return `celo-hunt://hunt/${huntId}/clue/${clueIndex}/token/${answerHash}`;
}

// Parse QR code URL
export function parseQRCodeURL(url: string): {
  huntId: number;
  clueIndex: number;
  answerHash: string;
} | null {
  try {
    const match = url.match(/celo-hunt:\/\/hunt\/(\d+)\/clue\/(\d+)\/token\/(0x[a-fA-F0-9]{64})/);
    if (!match) return null;
    return {
      huntId: parseInt(match[1], 10),
      clueIndex: parseInt(match[2], 10),
      answerHash: match[3],
    };
  } catch {
    return null;
  }
}

