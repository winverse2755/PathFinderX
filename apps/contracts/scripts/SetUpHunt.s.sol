// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";

import {TreasureHuntCreator} from "../src/TreasureHuntCreator.sol";
import {IERC20} from "lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";

/**
 * @title SetupHunt
 * @notice Helper script to set up a complete hunt after deployment
 * @dev Registers a creator, creates a hunt, adds clues, and funds it
 *
 * Usage:
 *   forge script script/SetupHunt.s.sol --broadcast --private-key $PRIVATE_KEY
 *
 * Environment variables required:
 *   - PLAYER_ADDRESS: Address of deployed TreasureHuntPlayer contract
 *   - CREATOR_ADDRESS: Address of deployed TreasureHuntCreator contract
 *   - CUSD_ADDRESS: Address of cUSD token
 *   - HUNT_CREATOR: Address of the hunt creator/owner (defaults to deployer)
 *   - HUNT_TITLE: Title of the hunt (defaults to "Demo Hunt")
 *   - HUNT_DESCRIPTION: Description of hunt (defaults to "A demo treasure hunt")
 *
 * Environment variables optional (reward amounts):
 *   - CLUE1_REWARD: Reward for first clue in wei (defaults to 0.04 ether)
 *   - CLUE2_REWARD: Reward for second clue in wei (defaults to 0.03 ether)
 *   - CLUE3_REWARD: Reward for third clue in wei (defaults to 0.03 ether)
 *
 * Example:
 *   PLAYER_ADDRESS=0x... CREATOR_ADDRESS=0x... CUSD_ADDRESS=0x... \
 *   HUNT_CREATOR=0x... HUNT_TITLE="City Tour" \
 *   CLUE1_REWARD=50000000000000000 CLUE2_REWARD=30000000000000000 \
 *   forge script script/SetupHunt.s.sol --broadcast
 */
contract SetupHunt is Script {
    function run() external {
        // Load environment variables
        address playerAddr = vm.envAddress("PLAYER_ADDRESS");
        address creatorAddr = vm.envAddress("CREATOR_ADDRESS");
        address tokenAddr = vm.envAddress("CUSD_ADDRESS");
        address huntCreator = vm.envAddress("HUNT_CREATOR");
        string memory huntTitle = "Demo Hunt";
        string memory huntDescription = "A demo treasure hunt";

        require(playerAddr != address(0), "PLAYER_ADDRESS not set");
        require(creatorAddr != address(0), "CREATOR_ADDRESS not set");
        require(tokenAddr != address(0), "CUSD_ADDRESS not set");
        require(huntCreator != address(0), "HUNT_CREATOR not set");

        // Load optional reward amounts (defaults to 0.04, 0.03, 0.03 ether)
        uint256 clue1Reward = vm.envOr("CLUE1_REWARD", uint256(0.04 ether));
        uint256 clue2Reward = vm.envOr("CLUE2_REWARD", uint256(0.03 ether));
        uint256 clue3Reward = vm.envOr("CLUE3_REWARD", uint256(0.03 ether));

        TreasureHuntCreator creator = TreasureHuntCreator(creatorAddr);
        IERC20 token = IERC20(tokenAddr);

        vm.startBroadcast();

        // 1. Register the creator
        console.log("Registering creator:", huntCreator);
        creator.registerCreator();
        console.log("Creator registered");

        // 2. Create a hunt
        console.log("Creating hunt with title:", huntTitle);
        uint256 huntId = creator.createHunt(huntTitle, huntDescription);
        console.log("Hunt created with ID:", huntId);

        // 3. Add first clue with reward
        console.log("Adding clue 1 with reward:", clue1Reward);
        string memory qr1 =
            creator.addClueWithGeneratedQr(huntId, "Find the statue at the town square", clue1Reward, "Town Square");
        console.log("QR Code 1:", qr1);

        // 4. Add second clue with reward
        console.log("Adding clue 2 with reward:", clue2Reward);
        string memory qr2 =
            creator.addClueWithGeneratedQr(huntId, "Follow the river to the old bridge", clue2Reward, "Old Bridge");
        console.log("QR Code 2:", qr2);

        // 5. Add third clue with reward
        console.log("Adding clue 3 with reward:", clue3Reward);
        string memory qr3 = creator.addClueWithGeneratedQr(
            huntId, "The treasure is buried under the old oak tree", clue3Reward, "Ancient Oak"
        );
        console.log("QR Code 3:", qr3);

        // 6. Approve tokens and fund the hunt
        uint256 totalReward = clue1Reward + clue2Reward + clue3Reward;
        console.log("Total reward needed:", totalReward);
        console.log("Approving tokens for funding...");
        token.approve(creatorAddr, totalReward);

        console.log("Funding hunt with", totalReward, "tokens");
        creator.fundHunt(huntId, totalReward);
        console.log("Hunt funded successfully");

        // 7. Publish hunt
        console.log("Publishing hunt...");
        creator.publishHunt(huntId);
        console.log("Hunt published");

        vm.stopBroadcast();

        console.log("=== Hunt Setup Complete ===");
        console.log("Hunt ID:", huntId);
        console.log("Hunt Title:", huntTitle);
        console.log("Clue 1 Reward:", clue1Reward);
        console.log("Clue 2 Reward:", clue2Reward);
        console.log("Clue 3 Reward:", clue3Reward);
        console.log("Total Reward Pool:", totalReward);
        console.log("Number of Clues: 3");
    }
}
