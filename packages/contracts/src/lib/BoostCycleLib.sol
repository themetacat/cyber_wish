// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { IndexToWisher, IndexToWisherData, CycleInfo, CycleInfoData, WisherTemporaryRecordsData, WisherTemporaryRecords, WisherIndexId } from "../codegen/index.sol";
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
    IndexToWisher.set(
      poolId,
      1,
      indexId,
      tempData.pointsWishIndex,
      wisher,
      tempData.points,
      tempData.wishCount,
      tempData.freeWishTime
    );

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
      IndexToWisher.set(poolId, 2, indexId, tempData.starWishIndex, wisher, tempData.points, 0, 0);
    }
  }

  function selectEligibleWishers(
    bytes32 poolId,
    uint256 wisherIndexId,
    uint256 wisherCount
  ) internal view returns (uint256, WisherPoints[] memory) {
    uint256 freeWisherCount;
    uint256 payWisherCount;

    for (uint256 i = 0; i < wisherCount; i++) {
      IndexToWisherData memory indexToWisherData = IndexToWisher.get(poolId, 1, wisherIndexId, i + 1);
      if (indexToWisherData.wishCount == indexToWisherData.freeWishTime) {
        freeWisherCount++;
      } else {
        payWisherCount++;
      }
    }
    WisherPoints[] memory freeWisherArr = new WisherPoints[](freeWisherCount);
    WisherPoints[] memory payWisherArr = new WisherPoints[](payWisherCount);
    uint256 freeIndex = 0;
    uint256 payIndex = 0;

    for (uint256 i = 0; i < wisherCount; i++) {
      IndexToWisherData memory indexToWisherData = IndexToWisher.get(poolId, 1, wisherIndexId, i + 1);

      WisherPoints memory wisherPoints = WisherPoints({
        wisher: indexToWisherData.wisher,
        points: nonlinear(indexToWisherData.points)
      });

      if (indexToWisherData.wishCount == indexToWisherData.freeWishTime) {
        freeWisherArr[freeIndex] = wisherPoints;
        freeIndex++;
      } else {
        payWisherArr[payIndex] = wisherPoints;
        payIndex++;
      }
    }

    uint256 selectCount = payWisherCount / 3;
    if(selectCount == 0){
      selectCount = 1;
    }
    if (freeWisherCount == 0) {
      return (selectCount, payWisherArr);
    }

    uint256 selectFreeCount = PowerCalculator.computeSampleCount(payWisherCount, freeWisherCount);
    WisherPoints[] memory selectedFreeWisher = weightedRandomSelection(selectFreeCount, freeWisherArr);

    uint256 totalCount = payWisherCount + selectedFreeWisher.length;
    WisherPoints[] memory selected = new WisherPoints[](totalCount);

    for (uint256 i = 0; i < payWisherCount; i++) {
      selected[i] = payWisherArr[i];
    }
    for (uint256 i = 0; i < selectedFreeWisher.length; i++) {
      selected[payWisherCount + i] = selectedFreeWisher[i];
    }

    return (selectCount, selected);
  }

  function weightedRandomSelection(
    uint256 count,
    WisherPoints[] memory wisherPoints
  ) internal view returns (WisherPoints[] memory selected) {
    uint256 wisherCount = wisherPoints.length;
    require(count <= wisherCount, "Count exceeds available entries");

    selected = new WisherPoints[](count);
    uint256 totalWeight = 0;

    for (uint256 i = 0; i < wisherCount; i++) {
      totalWeight += wisherPoints[i].points;
    }

    WisherPoints[] memory pool = new WisherPoints[](wisherCount);
    for (uint256 i = 0; i < wisherCount; i++) {
      pool[i] = wisherPoints[i];
    }

    for (uint256 k = 0; k < count; k++) {
      uint256 rand = WishUtils.getRandom(k, totalWeight, pool[k].wisher);

      uint256 cumulative = 0;
      for (uint256 i = 0; i < wisherCount - k; i++) {
        cumulative += pool[i].points;
        if (rand < cumulative) {
          selected[k] = pool[i];

          totalWeight -= pool[i].points;
          pool[i] = pool[wisherCount - k - 1];
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
      boostAmount[i] = (totalAmount * weights[i]) / totalWeight;
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
