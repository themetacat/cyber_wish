// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { Entity } from "./Entity.sol";
import { WishingPool, WishingPoolData, CycleInfoData, PropBlindBox, CycleInfo, WisherIndexId } from "../codegen/index.sol";

library WishUtils {
  function getCurrentCycle(bytes32 poolId) internal view returns (uint256) {
    WishingPoolData memory wishingPoolData = WishingPool.get(poolId);
    if (wishingPoolData.startTime == 0 || wishingPoolData.duration == 0 || block.timestamp < wishingPoolData.startTime) {
      return 0;
    }
    uint256 currentCycle = (block.timestamp - wishingPoolData.startTime) / wishingPoolData.duration + 1;
    return currentCycle;
  }

  function getRandom(uint256 num, uint256 range, address sender) internal view returns (uint256 res) {
    res = uint256(keccak256(abi.encodePacked(block.timestamp, num, sender, range))) % range;
  }

  function getPoints(
    uint256 pointsMin,
    uint256 pointsMax,
    uint256 random,
    address wisher
  ) internal view returns (uint256 points) {
    uint256 pointsRange = pointsMax - pointsMin + 1;
    points = getRandom(random + pointsMax, pointsRange, wisher) + pointsMin;
  }

  function eligibilityWishStar(uint256 probability, uint256 random, address wisher) internal view returns (bool) {
    if (probability == 0) {
      return false;
    }
    uint256 eligibilityNum = getRandom(probability + random, 100, wisher);
    return eligibilityNum < probability;
  }

  function getWisherIndexId(uint256 boostType, uint256 currentCycle) internal view returns (uint256) {
    for (uint256 index = 0; index < currentCycle; index++) {
      uint256 indexId = index + 1;
      bool inUse = WisherIndexId.getInUse(indexId, boostType);
      if (!inUse) {
        return indexId;
      }
    }
    return currentCycle;
  }

  function getPropsFromBox(bytes32 poolId, uint256 blindBoxId, address wisher) internal view returns (uint256) {
    uint256[] memory propIds = PropBlindBox.getPropIds(poolId, blindBoxId);
    uint256 propIdsLength = propIds.length;
    require(propIdsLength > 0, "No Props");
    uint256 index = getRandom(blindBoxId, propIds.length, wisher);
    return propIds[index];
  }
}
