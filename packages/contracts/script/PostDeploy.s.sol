// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { Script } from "forge-std/Script.sol";
import { console } from "forge-std/console.sol";
import { StoreSwitch } from "@latticexyz/store/src/StoreSwitch.sol";
import { WishingPool, Props, PropBlindBox, Incense } from "../src/codegen/index.sol";
import { IWorld } from "../src/codegen/world/IWorld.sol";

contract PostDeploy is Script {
  function run(address worldAddress) external {
    // Specify a store so that you can use tables directly in PostDeploy
    StoreSwitch.setStoreAddress(worldAddress);

    // Load the private key from the `PRIVATE_KEY` environment variable (in .env)
    uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

    // Start broadcasting transactions from the deployer account
    vm.startBroadcast(deployerPrivateKey);

    bytes32 poolId = bytes32(uint256(1));
    WishingPool.set(poolId, 0x60EA96f57B3a5715A90DAe1440a78f8bb339C92e, 0, block.timestamp, 300, "CyberWish");

    Incense.set(poolId, 1, 0, 3600, 0, 3, 0, false, "Pure Wish");
    Incense.set(poolId, 2, 19 * 10 ** 14, 3600 * 6, 15, 30, 20, true, "Luck Wish");
    Incense.set(poolId, 3, 38 * 10 ** 14, 3600 * 12, 30, 60, 30, true, "Spirit Wish");
    Incense.set(poolId, 4, 68 * 10 ** 14, 3600 * 24, 60, 100, 40, true, "Fortune Bloom");
    Incense.set(poolId, 5, 12 * 10 ** 15, 3600 * 48, 100, 200, 50, true, "Fate Whisper");
    Incense.set(poolId, 6, 23 * 10 ** 15, 3600 * 96, 200, 400, 60, true, "Celestial Wish");
    uint256[] memory propIds1 = new  uint256[](1);
    propIds1[0] = 1;
    PropBlindBox.set(poolId, 1, 0, 0, 3, 0, false, "Pray", propIds1);
    uint256[] memory propIds2 = new  uint256[](4);
    propIds2[0] = 2;
    propIds2[1] = 3;
    propIds2[2] = 4;
    propIds2[3] = 5;
    PropBlindBox.set(poolId, 2, 38 * 10 ** 14, 25, 45, 30, true, "Fortune Blessing", propIds2);
    uint256[] memory propIds3 = new  uint256[](3);
    propIds3[0] = 6;
    propIds3[1] = 7;
    propIds3[2] = 8;
    PropBlindBox.set(poolId, 3, 45 * 10 ** 14, 40, 80, 35, true, "Wisdom Blessing", propIds3);
    propIds3[0] = 9;
    propIds3[1] = 10;
    propIds3[2] = 11;
    PropBlindBox.set(poolId, 4, 56 * 10 ** 14, 55, 95, 38, true, "Love Blessing", propIds3);
    propIds2[0] = 12;
    propIds2[1] = 13;
    propIds2[2] = 14;
    propIds2[3] = 15;
    PropBlindBox.set(poolId, 5, 56 * 10 ** 14, 55, 95, 38, true, "Health Blessing", propIds2);
    
    vm.stopBroadcast();
  }
}
