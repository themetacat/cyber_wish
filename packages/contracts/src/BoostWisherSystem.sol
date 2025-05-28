// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { System } from "@latticexyz/world/src/System.sol";
import { WishingPool, WishingPoolData, Wisher, WisherData, Incense, IncenseData, Wishes, BoostWisherRecords, BoostWisherRecordsData, WisherCycleRecords, CycleInfo, CycleInfoData, IndexToWisher, IndexToWisherData } from "./codegen/index.sol";
import { Entity } from "./Entity.sol";
import { getCurrentCycle, getRandom } from "./Utils.sol";
import { WorldResourceIdLib } from "@latticexyz/world/src/WorldResourceId.sol";
import { IWorld } from "../src/codegen/world/IWorld.sol";

struct WisherPoints {
  address wisher;
  uint256 points;
}
contract BoostWisherSystem is System {
  function BoostWisherByPoints(bytes32 poolId, uint256 boostCycle) public {
    address sender = _msgSender();
    // require(WishingPool.getCreator(poolId) == sender, "Not eligible");
    require(boostCycle > 0, "Does not exist cycle");

    uint256 currentCycle = getCurrentCycle(poolId);
    require(currentCycle == 0 || currentCycle > boostCycle, "Not yet finished");

    CycleInfoData memory cycleInfoData = CycleInfo.get(poolId, boostCycle, 0);
    uint256 wisherCount = cycleInfoData.wisherCount;
    require(wisherCount > 0, "No Wisher");

    BoostWisherRecordsData memory boostWisherRecordsData = BoostWisherRecords.get(poolId, boostCycle);
    uint256 totalBoostAmount = (boostWisherRecordsData.amount * 24) / 100;
    require(totalBoostAmount > 0 && boostWisherRecordsData.boostedWisherByPoints.length == 0, "Not allow boost");
    boostWisherRecordsData.amountStar = totalBoostAmount;

    WisherPoints[] memory selectedWisher = weightedRandomSelection(
      poolId,
      cycleInfoData.wisherIndexId,
      wisherCount,
      sender
    );

    uint256[] memory boostAmount = getPointsBoostAmount(selectedWisher, totalBoostAmount);
    address[] memory selectedWisherAddr = new address[](selectedWisher.length);
    for (uint256 i = 0; i < selectedWisher.length; i++) {
      selectedWisherAddr[i] = selectedWisher[i].wisher;
      IWorld(_world()).transferBalanceToAddress(
        WorldResourceIdLib.encodeNamespace("cyberwish"),
        selectedWisher[i].wisher,
        boostAmount[i]
      );
      Wisher.setBoostedPointsAmount(
        poolId,
        selectedWisher[i].wisher,
        Wisher.getBoostedPointsAmount(poolId, selectedWisher[i].wisher) + boostAmount[i]
      );
      WisherCycleRecords.setBoostedPointsAmount(poolId, boostCycle, selectedWisher[i].wisher, boostAmount[i]);
    }
    boostWisherRecordsData.boostedWisherByPoints = selectedWisherAddr;
    CycleInfo.setIsboost(poolId, boostCycle, 0, true);
    BoostWisherRecords.set(poolId, boostCycle, boostWisherRecordsData);
  }

  function BoostWisherByStar(bytes32 poolId, uint256 boostCycle) public {
    // WishingPoolData memory wishingPoolData = WishingPool.get(poolId);

    // require(WishingPool.getCreator(poolId) == _msgSender(), "Not eligible");
    require(boostCycle > 0, "Does not exist cycle");

    uint256 currentCycle = getCurrentCycle(poolId);
    require(currentCycle == 0 || currentCycle > boostCycle, "Not yet finished");

    CycleInfoData memory cycleInfoData = CycleInfo.get(poolId, boostCycle, 1);
    uint256 wisherCount = cycleInfoData.wisherCount;
    require(wisherCount > 0, "No Wisher");

    BoostWisherRecordsData memory boostWisherRecordsData = BoostWisherRecords.get(poolId, boostCycle);
    uint256 boostAmount = (boostWisherRecordsData.amount * 36) / 100;
    require(boostAmount > 0 && boostWisherRecordsData.boostedWisherByStar.length == 0, "Not allow boost");

    boostWisherRecordsData.amountStar = boostAmount;

    (uint256[] memory starWishersIndex, uint256[] memory boostPercents) = getStarWishers(wisherCount);
    address[] memory starWishers = new address[](starWishersIndex.length);

    for (uint256 index = 0; index < starWishersIndex.length; index++) {
      uint256 boostedWisherAmount = (boostAmount * boostPercents[index]) / 100;
      address wisher = IndexToWisher.getWisher(poolId, 1, cycleInfoData.wisherIndexId, starWishersIndex[index]);
      starWishers[index] = wisher;
      IWorld(_world()).transferBalanceToAddress(
        WorldResourceIdLib.encodeNamespace("cyberwish"),
        wisher,
        boostedWisherAmount
      );
      Wisher.setBoostedStarAmount(poolId, wisher, Wisher.getBoostedStarAmount(poolId, wisher) + boostedWisherAmount);
      WisherCycleRecords.setBoostedStarAmount(poolId, boostCycle, wisher, boostedWisherAmount);
    }

    boostWisherRecordsData.boostedWisherByStar = starWishers;
    CycleInfo.setIsboost(poolId, boostCycle, 1, true);
    BoostWisherRecords.set(poolId, boostCycle, boostWisherRecordsData);
  }

  function getStarWishers(uint256 wisherCount) internal view returns (uint256[] memory, uint256[] memory) {
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

    address sender = _msgSender();
    uint256[] memory starWishersIndex = new uint256[](starWisherCount);
    for (uint256 i = 0; i < starWisherCount; i++) {
      uint256 j = i + getRandom(i, wisherCount - i, sender);
      (pool[i], pool[j]) = (pool[j], pool[i]);
      starWishersIndex[i] = pool[i];
    }

    return (starWishersIndex, boostPercents);
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
      weights[i] = nonlinear(IndexToWisher.getPoints(poolId, 0, wisherIndexId, i + 1));
      totalWeight += weights[i];
    }

    selected = new WisherPoints[](boostCount);
    bool[] memory used = new bool[](wisherCount);

    for (uint256 k = 0; k < boostCount; k++) {
      uint256 random = getRandom(k + wisherCount, totalWeight, sender);

      uint256 cumulative = 0;
      for (uint256 i = 0; i < wisherCount; i++) {
        if (used[i]) continue;
        cumulative += weights[i];
        if (random < cumulative) {
          selected[k] = WisherPoints({
            wisher: IndexToWisher.getWisher(poolId, 0, wisherIndexId, i + 1),
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
      weights[i] = nonlinear(selectedWisher[i].points);
      totalWeight += weights[i];
    }

    for (uint256 i = 0; i < n; i++) {
      boostAmount[i] = (totalAmount * weights[i]) / totalWeight;
    }
  }

  function nonlinear(uint256 x) internal pure returns (uint256) {
    return sqrt(x);
  }

  function sqrt(uint256 x) internal pure returns (uint256 y) {
    uint256 z = (x + 1) / 2;
    y = x;
    while (z < y) {
      y = z;
      z = (x / z + z) / 2;
    }
  }
}
