// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { Entity } from "./Entity.sol";
import { WishingPool, WishingPoolData } from "./codegen/index.sol";

function getCurrentCycle(bytes32 poolId) view returns (uint256) {
  WishingPoolData memory wishingPoolData = WishingPool.get(poolId);
  if (wishingPoolData.startTime == 0 || wishingPoolData.duration == 0) {
    return 0;
  }
  uint256 currentCycle = (block.timestamp - wishingPoolData.startTime) / wishingPoolData.duration + 1;
  return currentCycle;
}

function getRandom(uint256 num, uint256 range, address sender) view returns (uint256 res) {
    res = uint256(keccak256(abi.encodePacked(block.timestamp, num, sender, range))) % range;
}
