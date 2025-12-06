// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {TreasureHunt} from "../src/TreasureHunt.sol";

contract DeployTreasureHunt is Script {
    // Celo Mainnet cUSD address
    address constant CUSD_MAINNET = 0x765DE816845861e75A25fCA122bb6898B8B1282a;
    
    // Celo Alfajores Testnet cUSD address (for testing)
    address constant CUSD_ALFAJORES = 0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address cUSD = vm.envOr("CUSD_ADDRESS", CUSD_MAINNET);
        
        vm.startBroadcast(deployerPrivateKey);
        
        TreasureHunt treasureHunt = new TreasureHunt(cUSD);
        
        console.log("TreasureHunt deployed at:", address(treasureHunt));
        console.log("cUSD token address:", cUSD);
        
        vm.stopBroadcast();
    }
}

