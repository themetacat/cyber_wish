// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { IndexToWisher, CycleInfo, CycleInfoData, WisherTemporaryRecordsData, WisherIndexId } from "../codegen/index.sol";
import { WishUtils } from "./WishUtils.sol";
import { WisherPoints } from "./Struct.sol";
import { PowerCalculator } from "./PowerLib.sol";

library BoostCycleLib {
  function processCycleForBoost(
    bytes32 poolId,
    uint256 currentCycle,
    address wisher,
    WisherTemporaryRecordsData memory tempData,
    bool joinWishStar
  ) internal returns (bool isStar) {
    // Normal boost
    CycleInfoData memory cycleInfoData = CycleInfo.get(poolId, currentCycle, 1);
    uint256 wisherCount = cycleInfoData.wisherCount + 1;
    uint256 indexId = cycleInfoData.wisherIndexId;

    if (indexId == 0) {
      // new cycle new record
      indexId = WishUtils.getWisherIndexId(1, currentCycle);
      WisherIndexId.setInUse(indexId, 1, true);

      CycleInfo.set(poolId, currentCycle, 1, wisherCount, false, indexId);
      tempData.pointsWishIndex = wisherCount;
    } else if (tempData.pointsLastCycle != currentCycle) {
      // new wisher in current cycle
      CycleInfo.setWisherCount(poolId, currentCycle, 1, wisherCount);
      tempData.pointsWishIndex = wisherCount;
    } else {
      wisherCount -= 1;
    }
    IndexToWisher.set(poolId, 1, indexId, tempData.pointsWishIndex, wisher, tempData.points);

    // WishStar boost
    if (tempData.starLastCycle != currentCycle && joinWishStar) {
      cycleInfoData = CycleInfo.get(poolId, currentCycle, 2);
      wisherCount = cycleInfoData.wisherCount + 1;
      indexId = cycleInfoData.wisherIndexId;
      if (indexId == 0) {
        indexId = WishUtils.getWisherIndexId(2, currentCycle);
        WisherIndexId.setInUse(indexId, 2, true);
        CycleInfo.set(poolId, currentCycle, 2, wisherCount, false, indexId);
      } else {
        CycleInfo.setWisherCount(poolId, currentCycle, 2, wisherCount);
      }
      isStar = true;
      tempData.starWishIndex = wisherCount;
      tempData.starLastCycle = currentCycle;
      IndexToWisher.set(poolId, 2, indexId, tempData.starWishIndex, wisher, tempData.points);
    }
  }

  function weightedRandomSelection(
    bytes32 poolId,
    uint256 wisherIndexId,
    uint256 wisherCount,
    address sender
  ) internal view returns (WisherPoints[] memory selected) {
    uint256 boostCount = wisherCount / 3;
    if (boostCount == 0) {
      boostCount = 1;
    }
    uint256[] memory weights = new uint256[](wisherCount);

    uint256 totalWeight;
    for (uint256 i = 0; i < wisherCount; i++) {
      weights[i] = nonlinear(IndexToWisher.getPoints(poolId, 1, wisherIndexId, i + 1));
      totalWeight += weights[i];
    }

    selected = new WisherPoints[](boostCount);
    bool[] memory used = new bool[](wisherCount);

    for (uint256 k = 0; k < boostCount; k++) {
      uint256 random = WishUtils.getRandom(k + wisherCount, totalWeight, sender);

      uint256 cumulative = 0;
      for (uint256 i = 0; i < wisherCount; i++) {
        if (used[i]) continue;
        cumulative += weights[i];
        if (random < cumulative) {
          selected[k] = WisherPoints({
            wisher: IndexToWisher.getWisher(poolId, 1, wisherIndexId, i + 1),
            points: weights[i]
          });
          totalWeight -= weights[i];
          used[i] = true;
          break;
        }
      }
    }
  }

  function getPointsBoostAmount(
    WisherPoints[] memory selectedWisher,
    uint256 totalAmount
  ) internal pure returns (uint256[] memory boostAmount) {
    uint256 n = selectedWisher.length;
    boostAmount = new uint256[](n);
    uint256 totalWeight = 0;

    uint256[] memory weights = new uint256[](n);
    for (uint256 i = 0; i < n; i++) {
      weights[i] = selectedWisher[i].points;
      totalWeight += weights[i];
    }

    for (uint256 i = 0; i < n; i++) {
      boostAmount[i] = totalAmount * weights[i] / totalWeight;
    }
  }

  function nonlinear(uint256 x) internal pure returns (uint256) {
    return PowerCalculator.powPointEight(x);
  }


  function getStarWishers(
    uint256 wisherCount,
    address sender
  ) internal view returns (uint256[] memory, uint256[] memory) {
    require(wisherCount > 0, "No wishers");

    uint256[] memory boostPercents;
    uint256 starWisherCount;
    if (wisherCount <= 3) {
      starWisherCount = 1;
      boostPercents = new uint256[](starWisherCount);
      boostPercents[0] = 100;
    } else if (wisherCount <= 9) {
      starWisherCount = 2;
      boostPercents = new uint256[](starWisherCount);
      boostPercents[0] = 65;
      boostPercents[1] = 35;
    } else {
      starWisherCount = 3;
      boostPercents = new uint256[](starWisherCount);
      boostPercents[0] = 50;
      boostPercents[1] = 30;
      boostPercents[2] = 20;
    }

    uint256[] memory pool = new uint256[](wisherCount);
    for (uint256 i = 0; i < wisherCount; ) {
      pool[i] = i + 1;
      unchecked {
        ++i;
      }
    }

    uint256[] memory starWishersIndex = new uint256[](starWisherCount);
    for (uint256 i = 0; i < starWisherCount; i++) {
      uint256 j = i + WishUtils.getRandom(i, wisherCount - i, sender);
      (pool[i], pool[j]) = (pool[j], pool[i]);
      starWishersIndex[i] = pool[i];
    }

    return (starWishersIndex, boostPercents);
  }
}
