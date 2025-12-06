# Treasure Hunt App - Deployment Guide

## Overview

This is a Celo Treasure Hunt application built on the Farcaster miniapp template. Players solve clues by scanning QR codes to earn cUSD rewards on Celo mainnet.

## Smart Contract Deployment

### 1. Deploy the TreasureHunt Contract

```bash
cd apps/contracts
forge build
forge script script/DeployTreasureHunt.s.sol --rpc-url $CELO_MAINNET_RPC --broadcast --verify
```

### 2. Update Environment Variables

After deployment, update `apps/web/.env.local`:

```env
NEXT_PUBLIC_TREASURE_HUNT_CONTRACT=0x...your_deployed_contract_address
```

The contract constructor requires the cUSD token address:
- Celo Mainnet: `0x765DE816845861e75A25fCA122bb6898B8B1282a`

## Key Features Implemented

### ✅ Smart Contracts
- `TreasureHunt.sol` - Main contract handling:
  - Creator registration
  - Hunt creation and management
  - Clue addition with answer hashing
  - Hunt funding with cUSD
  - Answer submission and reward distribution
  - Player progress tracking

### ✅ Frontend Pages
- `/` - Hunt browsing/list page
- `/hunt/[id]` - Hunt playing page with QR scanning
- `/create` - Hunt creation flow
- `/leaderboard` - Global and hunt-specific leaderboards

### ✅ Key Components
- QR Scanner component using html5-qrcode
- Wallet integration via Farcaster miniapp connector
- cUSD token interactions using wagmi

### ✅ Utilities
- Answer hashing (keccak256)
- cUSD formatting and parsing
- QR code generation and parsing
- Contract interaction hooks

## Transaction Flow

All cUSD transfers happen through the smart contract:
1. **Funding**: Creator approves cUSD → calls `fundHunt()` → contract transfers cUSD from creator
2. **Rewards**: Player calls `submitAnswer()` → contract verifies answer → contract transfers cUSD to player

The app uses wagmi's `writeContract` hook, which internally uses `sendTransaction` for all contract interactions, including cUSD transfers.

## Network Configuration

The app is configured for:
- **Primary**: Celo Mainnet (chain ID: 42220)
- **Secondary**: Celo Alfajores Testnet (for testing)

cUSD token address on Celo Mainnet: `0x765DE816845861e75A25fCA122bb6898B8B1282a`

## Next Steps

1. Deploy the contract to Celo mainnet
2. Set the `NEXT_PUBLIC_TREASURE_HUNT_CONTRACT` environment variable
3. Test the full flow:
   - Register as creator
   - Create a hunt
   - Add clues
   - Fund the hunt
   - Publish the hunt
   - Play the hunt and scan QR codes
   - Submit answers and receive rewards

## Notes

- The contract uses OpenZeppelin's ReentrancyGuard and SafeERC20 for security
- Answers are hashed client-side before submission (keccak256)
- QR codes contain the answer hash, not the plaintext answer
- All cUSD amounts use 18 decimals (standard ERC20)

