// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { System } from "@latticexyz/world/src/System.sol";
import { WishingPool, WishingPoolData, Wisher, WisherData, Incense, IncenseData, Wishes, BoostWisherRecords, BoostWisherRecordsData, WisherCycleRecords, CycleInfo, CycleInfoData, IndexToWisher } from "./codegen/index.sol";
import { Entity } from "./Entity.sol";
// import { createEntity } from "./createEntity.sol";
import { getCurrentCycle, getRandom } from "./Utils.sol";

contract BoostWisherSystem is System {
  // function BoostWisherByPionts(bytes32 poolId, uint256 boostCycle) public {
  //   WishingPoolData memory wishingPoolData = WishingPool.get(poolId);
  //   require(wishingPoolData.creator == _msgSender(), "Not eligible");

  //   uint256 wisherCount = CycleInfo.getWisherCount(poolId, boostCycle, 0);
  //   require(wisherCount > 0, "No Wisher");

  //   BoostWisherRecordsData memory boostWisherRecordsData = BoostWisherRecords.get(poolId, boostCycle);
  //   uint256 boostAmount = (boostWisherRecordsData.amount * 24) / 100;

  //   require(boostAmount > 0 && boostWisherRecordsData.boostedWisherByPoints.length == 0, "Not allow boost");

  //   boostWisherRecordsData.amountPoints = boostAmount;
  //   address[] memory boostedWisherByPoints = new address[](1);
  //   boostedWisherByPoints[0] = 0x60EA96f57B3a5715A90DAe1440a78f8bb339C92e;
  //   boostWisherRecordsData.boostedWisherByPoints = boostedWisherByPoints;

  //   for (uint256 index = 0; index < boostedWisherByPoints.length; index++) {
  //     WisherCycleRecords.setBoostedPointsAmount(poolId, boostCycle, boostedWisherByPoints[index], boostAmount);
  //   }
  //   BoostWisherRecords.set(poolId, boostCycle, boostWisherRecordsData);
  // }


  function BoostWisherByStar(bytes32 poolId, uint256 boostCycle) public {
    WishingPoolData memory wishingPoolData = WishingPool.get(poolId);
    require(wishingPoolData.creator == _msgSender(), "Not eligible");

    CycleInfoData memory cycleInfoData = CycleInfo.get(poolId, boostCycle, 1);
    uint256 wisherCount = cycleInfoData.wisherCount;
    require(wisherCount > 0, "No Wisher");

    BoostWisherRecordsData memory boostWisherRecordsData = BoostWisherRecords.get(poolId, boostCycle);
    uint256 boostAmount = (boostWisherRecordsData.amount * 36) / 100;
    require(boostAmount > 0 && boostWisherRecordsData.boostedWisherByPoints.length == 0, "Not allow boost");

    boostWisherRecordsData.amountStar = boostAmount;

    (uint256[] memory starWishers, uint256[] memory boostPercents) = getStarWishers(wisherCount);
    uint256 wihserIndexId = CycleInfo.getWisherIndexId(poolId, boostCycle, 1);
    for (uint256 index = 0; index < starWishers.length; index++) {
      uint256 boostedWisherAmount = (boostAmount * boostPercents[index]) / 100;
      if (boostedWisherAmount == 0) {
        break;
      }
      address wisher = IndexToWisher.getWisher(poolId, 1, wihserIndexId, index);
      WisherCycleRecords.setBoostedStarAmount(poolId, boostCycle, wisher, boostedWisherAmount);
    }
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
      pool[i] = i;
      unchecked {
        ++i;
      }
    }

    address sender = _msgSender();
    uint256[] memory starWishers = new uint256[](starWisherCount);
    for (uint256 i = 0; i < starWisherCount; i++) {
      uint256 j = i + getRandom(i, wisherCount - i, sender);
      (pool[i], pool[j]) = (pool[j], pool[i]);
      starWishers[i] = pool[i];
    }

    return (starWishers, boostPercents);
  }
}
