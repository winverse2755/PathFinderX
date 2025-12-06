# Product Requirements Document (PRD)
## Celo Treasure Hunt

**Version:** 1.0  
**Date:** December 6, 2024  
**Status:** MVP Development  
**Platform:** Celo Blockchain (Sepolia Testnet → Mainnet)

---

## 1. Executive Summary

### Overview
Celo Treasure Hunt is a mobile-first, blockchain-powered scavenger hunt application where players solve clues by scanning QR codes to earn instant cryptocurrency rewards. The app combines real-world exploration with on-chain gaming mechanics, leveraging Celo's fast and cheap transactions to create an engaging treasure hunting experience.

### Vision
Make cryptocurrency accessible and fun by gamifying real-world exploration, enabling anyone to create and participate in location-based treasure hunts with instant crypto rewards.

### Target Audience
- **Primary**: Event organizers, educators, and community builders
- **Secondary**: Crypto enthusiasts, gamers, tourists, and students
- **Geographic Focus**: Initial launch targeting mobile-first markets (Africa via MiniPay, global via Farcaster)

---

## 2. Product Goals

### Business Objectives
1. Achieve 100+ unique players within first month
2. Generate 10+ community-created hunts
3. Process 1,000+ on-chain transactions
4. Demonstrate Celo's capabilities for real-world applications

### User Objectives
1. **For Players**: Earn cryptocurrency while having fun exploring
2. **For Creators**: Engage audiences through gamified experiences
3. **For Communities**: Drive foot traffic and interaction with locations

---

## 3. Core Features

### 3.1 Hunt Creation (Creator Flow)

#### Feature: Create Hunt
**Description**: Creators design custom treasure hunts with multiple clues and rewards.

**User Story**: *"As an event organizer, I want to create a scavenger hunt so that attendees can explore the venue and win prizes."*

**Requirements**:
- Creator must connect their wallet (MiniPay, MetaMask, WalletConnect)
- Creator must register as a hunt creator (one-time, on-chain)
- Hunt requires:
  - Title (max 100 characters)
  - Description (max 500 characters)
  - Start time (optional, defaults to immediate)
  - End time (optional, can be indefinite)

**Success Criteria**:
- Hunt creation completes in <30 seconds
- Transaction cost <$0.001
- Hunt appears in active hunts list immediately

---

#### Feature: Add Clues
**Description**: Creators add sequential clues with rewards and answers.

**User Story**: *"As a creator, I want to add clues with specific answers so that only correct solutions earn rewards."*

**Requirements**:
- Minimum 1 clue, maximum 20 clues per hunt
- Each clue requires:
  - Clue text/hint (max 500 characters)
  - Answer (case-insensitive, hashed on-chain)
  - Reward amount (in cUSD, min 0.01, max 10.00)
  - Location name/tag (optional, max 100 characters)
- Answers are hashed using keccak256 before storage
- Clues must be solved sequentially (can't skip)

**Technical Notes**:
- Answer format: Remove spaces, convert to lowercase before hashing
- Hash generation: `keccak256(abi.encodePacked(answer))`
- Store only hash on-chain, never plaintext answer

**Success Criteria**:
- Clue addition takes <10 seconds per clue
- Gas cost <$0.0001 per clue
- QR code generated automatically

---

#### Feature: Fund Hunt
**Description**: Creators deposit cUSD to fund all clue rewards.

**User Story**: *"As a creator, I want to fund my hunt upfront so that players can claim rewards instantly."*

**Requirements**:
- Total funding = sum of all clue rewards
- Creator must approve cUSD token transfer
- Funds locked in smart contract until claimed or refunded
- Creator can add more funding if hunt is underfunded

**Flow**:
1. Calculate total rewards needed
2. Request cUSD approval from creator
3. Transfer cUSD to TreasureHuntCreator contract
4. Emit FundingAdded event
5. Update hunt status to "funded"

**Success Criteria**:
- Funding completes in <20 seconds
- Clear display of funding status
- Warning if creator has insufficient cUSD balance

---

#### Feature: Generate QR Codes
**Description**: System generates unique QR codes for each clue answer.

**User Story**: *"As a creator, I want QR codes for my clues so that I can print and hide them at locations."*

**Requirements**:
- QR format: `celo-hunt://hunt/{huntId}/clue/{clueIndex}/token/{answerHash}`
- Generate downloadable PNG files (300x300px minimum)
- Batch download option (ZIP file of all QR codes)
- Preview before download

**Additional Options**:
- Custom QR styling (colors, logo overlay)
- Print-friendly format (A4 PDF with location labels)
- Shareable links (web-based clues, no QR needed)

**Success Criteria**:
- QR codes scannable from 2+ meters away
- Generation completes in <5 seconds
- Files downloadable without additional tools

---

#### Feature: Publish Hunt
**Description**: Make hunt visible and playable to all users.

**User Story**: *"As a creator, I want to publish my hunt so that players can discover and join it."*

**Requirements**:
- All clues must be added
- Hunt must be fully funded
- Creator confirms publication
- Hunt becomes immediately discoverable

**Pre-Publication Checklist**:
- [ ] Minimum 1 clue added
- [ ] All clues funded
- [ ] QR codes generated
- [ ] Hunt details complete

**Success Criteria**:
- Hunt appears in "Active Hunts" within 5 seconds
- Players can immediately start hunting
- Creator receives confirmation notification

---

### 3.2 Hunt Playing (Player Flow)

#### Feature: Browse Hunts
**Description**: Players discover and select available treasure hunts.

**User Story**: *"As a player, I want to see all active hunts so that I can choose one to play."*

**Requirements**:
- Display all published hunts
- Show for each hunt:
  - Title and description
  - Number of clues
  - Total reward pool
  - Number of active players
  - Creator name/address
  - Estimated completion time
- Filter by:
  - Reward size
  - Number of clues
  - Location (if available)
  - Active/completed status
- Sort by:
  - Newest first
  - Highest rewards
  - Most popular
  - Ending soon

**Success Criteria**:
- Hunt list loads in <3 seconds
- Filters work instantly (client-side)
- Images and details display correctly on mobile

---

#### Feature: View Clue
**Description**: Players see the current clue they need to solve.

**User Story**: *"As a player, I want to see my current clue so that I know what to find."*

**Requirements**:
- Display:
  - Clue text/hint
  - Clue number (e.g., "Clue 2 of 5")
  - Reward amount for this clue
  - Progress bar
  - Location hint (if provided)
- Show previously completed clues (grayed out)
- Hide future clues (spoiler protection)
- Show map marker if location provided

**UI Elements**:
- Large, readable clue text
- Prominent "Scan QR" button
- "Enter Answer Manually" option
- "Need a hint?" button (future feature)

**Success Criteria**:
- Clue loads instantly (cached data)
- Text readable outdoors (high contrast)
- Map integration if location provided

---

#### Feature: Scan QR Code
**Description**: Players scan QR codes to submit answers.

**User Story**: *"As a player, I want to scan QR codes so that I can quickly submit answers."*

**Requirements**:
- Camera access permission request
- Real-time QR detection
- Parse QR data format: `celo-hunt://hunt/{huntId}/clue/{clueIndex}/token/{answerHash}`
- Validate:
  - Correct hunt ID
  - Correct clue index (current clue only)
  - Valid answer hash format
- Provide instant feedback on scan
- Support multiple QR formats (URL, plain text, custom scheme)

**Error Handling**:
- Wrong hunt: "This QR belongs to a different hunt"
- Wrong clue: "You need to solve the current clue first"
- Invalid format: "Invalid QR code, try manual entry"
- Camera error: "Camera access denied, enable in settings"

**Accessibility**:
- Manual entry fallback
- Flashlight toggle for low light
- Freeze frame to help with focus

**Success Criteria**:
- QR detected within 2 seconds
- 95%+ successful scan rate
- Clear error messages
- Works in various lighting conditions

---

#### Feature: Submit Answer
**Description**: Players submit answers to claim rewards.

**User Story**: *"As a player, I want to submit my answer so that I can earn the reward."*

**Requirements**:
- Accept answer from:
  - QR scan (auto-submit)
  - Manual text entry
- Normalize answer (lowercase, trim whitespace)
- Hash answer client-side
- Submit to smart contract
- Wait for transaction confirmation
- Display transaction status:
  - Pending (show spinner)
  - Confirming (show block count)
  - Success (show reward)
  - Failed (show error + retry)

**Smart Contract Verification**:
1. Check hunt is active
2. Check within time window
3. Check player hasn't already claimed this clue
4. Check answer hash matches stored hash
5. Transfer reward to player
6. Increment player progress
7. Emit ClueSolved event

**Success Criteria**:
- Answer submission takes 3-5 seconds
- Transaction success rate >95%
- Clear feedback at each step
- Failed transactions allow retry

---

#### Feature: Receive Reward
**Description**: Players instantly receive cUSD when correct.

**User Story**: *"As a player, I want to receive my reward immediately so that I feel accomplished."*

**Requirements**:
- Instant cUSD transfer on correct answer
- Display:
  - Amount earned (e.g., "+0.5 cUSD")
  - Total earnings in this hunt
  - Transaction hash (link to explorer)
  - Updated wallet balance
- Celebration animation/confetti
- Option to share achievement

**Transaction Details**:
- Show gas cost (transparency)
- Link to Celoscan explorer
- Copy transaction hash
- View in wallet

**Success Criteria**:
- Reward appears in wallet within 5 seconds
- Balance updates immediately in app
- Transaction verifiable on explorer

---

#### Feature: Progress Tracking
**Description**: Players see their progress through the hunt.

**User Story**: *"As a player, I want to track my progress so that I know how close I am to finishing."*

**Requirements**:
- Display:
  - Clues completed (e.g., "3/5")
  - Progress bar (visual percentage)
  - Total rewards earned so far
  - Estimated completion time
  - Completed clue history with timestamps
- Persist progress on-chain
- Accessible across devices (wallet-based)

**Visual Design**:
- Progress bar with checkmarks
- Trophy/badge icons for milestones
- Color-coded status (gray=locked, yellow=current, green=complete)

**Success Criteria**:
- Progress updates instantly after each clue
- Accurate across all devices
- No progress lost on app restart

---

#### Feature: Hunt Completion
**Description**: Players complete hunts and view achievements.

**User Story**: *"As a player, I want to see my achievements when I finish so that I feel rewarded."*

**Requirements**:
- Trigger on final clue completion
- Display:
  - "Hunt Complete!" message
  - Total rewards earned
  - Total time taken
  - Rank/position on leaderboard
  - NFT badge (stretch feature)
- Options:
  - View full leaderboard
  - Share on social media
  - Start another hunt
  - Rate the hunt

**Completion Event**:
- Emit HuntCompleted event
- Update leaderboard
- Mint completion NFT (if enabled)
- Send congratulations notification

**Success Criteria**:
- Completion screen engaging
- Clear call-to-action for next steps
- Social sharing works seamlessly

---

### 3.3 Leaderboard

#### Feature: Global Leaderboard
**Description**: Display top players across all hunts.

**User Story**: *"As a player, I want to see how I rank against others so that I can compete."*

**Requirements**:
- Display top 100 players
- Show for each player:
  - Wallet address (truncated) or ENS name
  - Total clues solved
  - Total rewards earned
  - Hunts completed
  - Average completion time
- Highlight current user's position
- Real-time updates

**Ranking Criteria**:
- Primary: Total rewards earned
- Secondary: Hunts completed
- Tiebreaker: Fastest average time

**Success Criteria**:
- Leaderboard loads in <2 seconds
- Updates within 30 seconds of clue completion
- Accurate rankings

---

#### Feature: Hunt-Specific Leaderboard
**Description**: Show rankings within a specific hunt.

**User Story**: *"As a player, I want to see who's fastest in this hunt so that I can compete."*

**Requirements**:
- Display all players who started the hunt
- Show:
  - Player address
  - Clues completed
  - Total time
  - Rank
- Filter by:
  - Completed only
  - In progress
  - All players

**Success Criteria**:
- Accurate time tracking
- Fair comparison (same starting conditions)
- Updates in real-time

---

### 3.4 Wallet Integration

#### Feature: Multi-Wallet Support
**Description**: Support multiple wallet types for accessibility.

**Requirements**:
- Supported wallets:
  - **MiniPay** (primary, 11M+ users)
  - MetaMask
  - WalletConnect
  - Valora
  - Coinbase Wallet
- Auto-detect wallet in mobile browsers
- Remember last connected wallet

**Connection Flow**:
1. User clicks "Connect Wallet"
2. Show wallet options
3. User selects wallet
4. Request connection
5. Display connected address
6. Store connection state

**Success Criteria**:
- Connection takes <10 seconds
- 98%+ success rate
- Clear error messages for failures

---

## 4. Technical Architecture

### 4.1 Smart Contracts

**Contracts**:
1. **TreasureHuntPlayer.sol**
   - Manages player state and progress
   - Verifies answers and distributes rewards
   - Emits game events

2. **TreasureHuntCreator.sol**
   - Handles hunt creation and management
   - Manages funding and refunds
   - Generates QR data

**Key Functions**:
- `registerCreator()` - Register as hunt creator
- `createHunt()` - Create new hunt
- `addClue()` - Add clue with answer hash
- `fundHunt()` - Deposit rewards
- `submitAnswer()` - Player submits answer
- `getPlayerProgress()` - View player state

**Security Features**:
- Answer hashing (keccak256)
- Sequential clue enforcement
- Anti-replay protection (per-player-per-clue mapping)
- ReentrancyGuard on fund transfers
- Ownable for creator-only functions

---

### 4.2 Frontend

**Framework**: Next.js 14 (React)

**Key Libraries**:
- **Wagmi** - Wallet connection and contract interactions
- **Viem** - Ethereum utilities
- **html5-qrcode** - QR scanning
- **Recharts** - Leaderboard visualizations
- **TailwindCSS** - Styling (Celo brand colors)

**Pages**:
- `/` - Home / Hunt list
- `/hunt/[id]` - Hunt details and play
- `/create` - Create hunt flow
- `/leaderboard` - Global leaderboard
- `/profile` - Player profile and history

**State Management**:
- React Query for server state
- React Context for global app state
- LocalStorage for UI preferences

---

### 4.3 Infrastructure

**Blockchain**: Celo Sepolia (testnet) → Celo Mainnet

**Token**: cUSD (Celo Dollar stablecoin)
- Sepolia: Mock deployment
- Mainnet: `0x765DE816845861e75A25fCA122bb6898B8B1282a`

**Hosting**: Vercel (frontend)

**RPC**: Celo public nodes / Alchemy

**Explorer**: Celoscan.io

---

## 5. User Flows

### 5.1 Creator Flow (Detailed)

```
1. Landing Page
   ↓
2. Click "Create Hunt"
   ↓
3. Connect Wallet (MiniPay/MetaMask)
   ↓
4. Register as Creator (if first time)
   → TX: registerCreator()
   → Cost: ~$0.0001
   ↓
5. Enter Hunt Details
   - Title: "Downtown Adventure"
   - Description: "Explore 5 local landmarks"
   - Duration: 2 hours
   ↓
6. Click "Create Hunt"
   → TX: createHunt()
   → Returns: huntId = 0
   ↓
7. Add Clue 1
   - Text: "Find the statue in the square"
   - Answer: "LIBERTY"
   - Reward: 0.5 cUSD
   - Location: "Town Square"
   → TX: addClue()
   → Generates: QR code string
   ↓
8. Repeat for Clues 2-5
   ↓
9. Review Total Costs
   - Total rewards: 2.5 cUSD
   - Gas fees: ~$0.001
   ↓
10. Approve cUSD
    → TX: approve()
    ↓
11. Fund Hunt
    → TX: fundHunt()
    → Transfers: 2.5 cUSD to contract
    ↓
12. Download QR Codes
    → ZIP file with 5 QR PNGs
    ↓
13. Publish Hunt
    → TX: publishHunt()
    ↓
14. Hunt is Live!
    - Share link
    - Place QR codes
    - Monitor progress
```

---

### 5.2 Player Flow (Detailed)

```
1. Landing Page
   ↓
2. Connect Wallet
   ↓
3. Browse Active Hunts
   - Filters: Location, Reward, Difficulty
   - Sorts: Newest, Popular
   ↓
4. Select "Downtown Adventure"
   - See: 5 clues, 2.5 cUSD total
   ↓
5. Click "Start Hunt"
   ↓
6. View Clue 1
   "Find the statue in the square"
   Reward: 0.5 cUSD
   ↓
7. Travel to Location (Town Square)
   ↓
8. Find Hidden QR Code
   ↓
9. Click "Scan QR"
   → Camera opens
   → Point at QR code
   → Auto-detects and parses
   ↓
10. Answer Extracted: "LIBERTY"
    ↓
11. Submit Answer
    → TX: submitAnswer(huntId, "LIBERTY")
    → Status: Pending → Confirming → Success
    ↓
12. Reward Received! 🎉
    - +0.5 cUSD added to wallet
    - Progress: 1/5 complete
    - Confetti animation
    ↓
13. View Clue 2
    "Cross the old bridge to find..."
    ↓
14. Repeat Steps 7-12 for Clues 2-5
    ↓
15. Complete Clue 5
    → Hunt Complete!
    ↓
16. Completion Screen
    - Total earned: 2.5 cUSD
    - Time: 1h 23m
    - Rank: #7 out of 42 players
    - Achievement unlocked: "Explorer"
    ↓
17. Options:
    - View Leaderboard
    - Share on Twitter/Farcaster
    - Start Another Hunt
    - Rate Hunt (⭐⭐⭐⭐⭐)
```

---

## 6. Success Metrics

### Key Performance Indicators (KPIs)

**User Acquisition**:
- Daily Active Users (DAU)
- Weekly Active Users (WAU)
- New wallet connections per day
- Retention rate (D1, D7, D30)

**Engagement**:
- Hunts started per user
- Average completion rate (target: >60%)
- Average time per hunt
- Clues solved per day
- Return player rate

**Creator Metrics**:
- Hunts created per week
- Average clues per hunt
- Average reward per hunt
- Creator retention rate

**Blockchain Metrics**:
- Total transactions
- Gas fees paid
- Transaction success rate (target: >95%)
- Average confirmation time

**Economic Metrics**:
- Total cUSD distributed as rewards
- Average reward per player
- Creator spending per hunt
- Platform sustainability

---

## 7. Security & Privacy

### Security Measures

**Smart Contract**:
- OpenZeppelin security standards
- ReentrancyGuard on all value transfers
- Access control (Ownable, role-based)
- Answer hashing (never store plaintext)
- Audit before mainnet deployment

**Frontend**:
- Input validation and sanitization
- Rate limiting on submissions
- HTTPS only
- No private key storage
- Wallet-based authentication

**Anti-Cheat**:
- Sequential clue solving (can't skip)
- One claim per player per clue
- Answer hashing prevents sharing
- Time-based constraints
- On-chain verification

### Privacy Considerations

**Player Privacy**:
- Wallet addresses are pseudonymous
- Optional location sharing
- No email or personal data required
- Users can play without revealing identity

**Data Collection**:
- Minimal: Only wallet address and on-chain actions
- No tracking cookies
- No third-party analytics (optional: privacy-first analytics)

---

## 8. Roadmap

### Phase 1: MVP (Current)
**Timeline**: Week 1-2
- ✅ Smart contract development
- ✅ Basic frontend (hunt list, play, create)
- ✅ QR scanning
- ✅ Wallet integration
- ✅ Leaderboard
- ✅ Deploy to Sepolia testnet

### Phase 2: Beta Launch
**Timeline**: Week 3-4
- [ ] Deploy to Celo mainnet
- [ ] MiniPay integration testing
- [ ] Farcaster mini app deployment
- [ ] Create 5 demo hunts
- [ ] Beta testing with 50 users
- [ ] Bug fixes and optimization

### Phase 3: Public Launch
**Timeline**: Week 5-6
- [ ] Marketing campaign
- [ ] Creator onboarding program
- [ ] Mobile app optimization
- [ ] Social features (share, rate)
- [ ] Hunt discovery improvements

### Phase 4: Growth Features
**Timeline**: Week 7-12
- [ ] NFT badges for completion
- [ ] Team hunts (collaborative)
- [ ] Time-limited race mode
- [ ] Hint system (pay cUSD for hints)
- [ ] Hunt templates
- [ ] Map-based hunt discovery
- [ ] Push notifications

### Phase 5: Advanced Features
**Timeline**: Month 4-6
- [ ] Multi-chain support (Polygon, Base)
- [ ] Creator marketplace (sell hunt templates)
- [ ] Sponsored hunts (brands pay rewards)
- [ ] AR clues (augmented reality)
- [ ] Live events integration
- [ ] Multi-language support

---

## 9. Constraints & Assumptions

### Technical Constraints
- Celo gas limits (20M per block)
- Mobile browser camera API limitations
- Wallet connection UX varies by wallet
- QR scanning requires good lighting
- Network latency affects UX

### Business Constraints
- Bootstrap budget (no external funding initially)
- Team size: 1-2 developers
- Hackathon timeline: 2 weeks
- Limited marketing budget

### Assumptions
- Users have smartphones with cameras
- Users have basic crypto knowledge (or willing to learn)
- Creators have cUSD to fund hunts
- Players trust smart contracts
- QR codes are physically accessible
- Internet connection available during play

---

## 10. Risk Assessment

### Technical Risks

**Risk**: Smart contract bugs
- **Mitigation**: Extensive testing, OpenZeppelin libraries, audit before mainnet

**Risk**: Poor QR scanning performance
- **Mitigation**: Multiple QR libraries, manual entry fallback, clear instructions

**Risk**: Wallet connection failures
- **Mitigation**: Support multiple wallets, clear error messages, retry logic

### Business Risks

**Risk**: Low creator adoption
- **Mitigation**: Create demo hunts, onboarding program, templates

**Risk**: Low player engagement
- **Mitigation**: Compelling rewards, gamification, social features

**Risk**: Insufficient funding for rewards
- **Mitigation**: Creator education, funding calculator, escrow system

### Legal/Compliance Risks

**Risk**: Regulatory issues with crypto rewards
- **Mitigation**: Legal review, clear terms of service, geographic restrictions if needed

**Risk**: Privacy concerns with location data
- **Mitigation**: Optional location sharing, transparent privacy policy

---

## 11. Open Questions

1. Should we allow hunt editing after publication?
2. What happens to unclaimed rewards when hunts expire?
3. Should creators be able to delete hunts?
4. How do we handle disputes (wrong answer marked correct)?
5. Should we implement a rating/review system for hunts?
6. What's the minimum viable reward amount?
7. Should we cap maximum clues per hunt?
8. How do we prevent QR code vandalism/theft?
9. Should we allow hunt pausing/resuming?
10. What happens if creator wallet is compromised?

---

## 12. Appendix

### A. Glossary

- **Hunt**: A complete treasure hunt with multiple clues
- **Clue**: A single puzzle/question in a hunt
- **Creator**: User who creates hunts
- **Player**: User who participates in hunts
- **cUSD**: Celo Dollar stablecoin (1 cUSD ≈ $1 USD)
- **Answer Hash**: Cryptographic hash of the correct answer
- **QR Code**: 2D barcode containing answer or link
- **MiniPay**: Celo's mobile wallet (11M+ users)
- **Farcaster**: Decentralized social network

### B. References

- Celo Documentation: https://docs.celo.org
- Wagmi Docs: https://wagmi.sh
- OpenZeppelin Contracts: https://docs.openzeppelin.com
- EIP-1559: https://eips.ethereum.org/EIPS/eip-1559

### C. Contact

- **Product Owner**: [Your Name]
- **Technical Lead**: [Your Name]
- **GitHub**: [Repository URL]
- **Demo**: [Live Demo URL]

---

**Document Status**: Living Document  
**Last Updated**: December 6, 2025  
**Next Review**: After MVP completion