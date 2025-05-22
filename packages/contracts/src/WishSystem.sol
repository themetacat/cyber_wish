// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { System } from "@latticexyz/world/src/System.sol";

import { WishingPool, WishingPoolData, Wisher, WisherData, Incense, IncenseData, Wishes, BoostWisherRecords, IndexToWisher, CycleInfo, WisherCycleRecords, WisherCycleRecords, PropBlindBox, PropBlindBoxData, WisherTemporaryRecords, WisherTemporaryRecordsData, CycleInfoData } from "./codegen/index.sol";
import { Entity } from "./Entity.sol";
import { uuid } from "./createEntity.sol";
import { getCurrentCycle, getRandom } from "./Utils.sol";
import { WishPropsResult } from "./Struct.sol";

contract WishSystem is System {
  function wish(bytes32 poolId, uint256 incenseId, uint256 blindBoxId, string memory wishContent) public payable {
    address wisher = _msgSender();

    require(WishingPool.getCreator(poolId) != address(0), "No pool");

    require(
      _msgValue() == Incense.getAmount(poolId, incenseId) + PropBlindBox.getAmount(poolId, blindBoxId),
      "Insufficient balance"
    );

    // !!! check currentCycle isBoosted
    uint256 currentCycle = getCurrentCycle(poolId);

    WisherData memory wisherData = Wisher.get(poolId, wisher);
    WisherTemporaryRecordsData memory wisherTemporaryRecordsData = WisherTemporaryRecords.get(poolId, wisher);

    WishPropsResult memory incenseResult = lightingIncense(poolId, incenseId);
    WishPropsResult memory boxResult = openBox(poolId, blindBoxId);

    uint256 totalPoints = incenseResult.points + boxResult.points;
    wisherData.points += totalPoints;
    wisherData.wishCount += 1;

    if (wisherTemporaryRecordsData.pointsLastCycle == currentCycle) {
      wisherTemporaryRecordsData.points += totalPoints;
      wisherTemporaryRecordsData.wishCount += 1;
    } else {
      wisherTemporaryRecordsData.points = totalPoints;
      wisherTemporaryRecordsData.wishCount = 1;
    }

    if (currentCycle > 0) {
      // for boost wisher
      _processCycleBoost(poolId, currentCycle, wisher, wisherTemporaryRecordsData, incenseResult.joinWishStar || boxResult.joinWishStar);
    }

    wisherTemporaryRecordsData.pointsLastCycle = currentCycle;

    Wishes.set(poolId, uuid(), wisher, block.timestamp, currentCycle, incenseId, blindBoxId, incenseResult.points, boxResult.points, wishContent);
    Wisher.set(poolId, wisher, wisherData);
    WisherTemporaryRecords.set(poolId, wisher, wisherTemporaryRecordsData);
    WisherCycleRecords.set(
      poolId,
      currentCycle,
      wisher,
      wisherTemporaryRecordsData.wishCount,
      wisherTemporaryRecordsData.points,
      0,
      0
    );
  }

  function lightingIncense(bytes32 poolId, uint256 incenseId) private returns (WishPropsResult memory) {
    IncenseData memory incenseData = Incense.get(poolId, incenseId);
    require(incenseData.pointsMax > 0, "Invalid Incense");
    return
      _handleWishProps(
        poolId,
        incenseData.amount,
        incenseData.pointsMin,
        incenseData.pointsMax,
        incenseData.starProbability,
        true
      );
  }

  function openBox(bytes32 poolId, uint256 blindBoxId) private returns (WishPropsResult memory) {
    PropBlindBoxData memory propBlindBoxData = PropBlindBox.get(poolId, blindBoxId);
    require(propBlindBoxData.pointsMax > 0, "Invalid Blind Box");
    return
      _handleWishProps(
        poolId,
        propBlindBoxData.amount,
        propBlindBoxData.pointsMin,
        propBlindBoxData.pointsMax,
        propBlindBoxData.starProbability,
        false
      );
  }

  function _handleWishProps(
    bytes32 poolId,
    uint256 amount,
    uint256 pointsMin,
    uint256 pointsMax,
    uint256 starProbability,
    bool isIncense
  ) private returns (WishPropsResult memory result) {
    require(_msgValue() >= amount, "Insufficient balance");

    uint256 random;
    if (isIncense) {
      uint256 duration = 1;
      random = 1;
    }
    result.points = getPoints(pointsMin, pointsMax, random);
    result.joinWishStar = eligibilityWishStar(starProbability);

    if (amount > 0) {
      uint256 currentCycle = getCurrentCycle(poolId);
      WishingPool.setAmount(poolId, WishingPool.getAmount(poolId) + amount);
      if (currentCycle > 0) {
        BoostWisherRecords.setAmount(poolId, currentCycle, BoostWisherRecords.getAmount(poolId, currentCycle) + amount);
      }
    }
  }

  function _processCycleBoost(
    bytes32 poolId,
    uint256 currentCycle,
    address wisher,
    WisherTemporaryRecordsData memory tempData,
    bool joinWishStar
  ) internal {
    // Normal boost
    uint256 wisherCount = CycleInfo.getWisherCount(poolId, currentCycle, 0) + 1;
    uint256 indexId = CycleInfo.getWisherIndexId(poolId, currentCycle, 0);

    if (indexId == 0) {
      indexId = getWisherIndexId(poolId, 0, currentCycle);
      CycleInfo.set(poolId, currentCycle, 0, wisherCount, false, indexId);
      tempData.pointsWishIndex = wisherCount;
    } else if (tempData.pointsLastCycle != currentCycle) {
      CycleInfo.setWisherCount(poolId, currentCycle, 0, wisherCount);
      tempData.pointsWishIndex = wisherCount;
    }
    IndexToWisher.set(poolId, 0, indexId, wisherCount, wisher, tempData.points);

    // WishStar boost
    if (tempData.starLastCycle != currentCycle && joinWishStar) {
      wisherCount = CycleInfo.getWisherCount(poolId, currentCycle, 1) + 1;
      indexId = CycleInfo.getWisherIndexId(poolId, currentCycle, 1);
      if (indexId == 0) {
        indexId = getWisherIndexId(poolId, 1, currentCycle);
        CycleInfo.set(poolId, currentCycle, 1, wisherCount, false, indexId);
      } else {
        CycleInfo.setWisherCount(poolId, currentCycle, 1, wisherCount);
      }
      tempData.starWishIndex = wisherCount;
      tempData.starLastCycle = currentCycle;
      IndexToWisher.set(poolId, 1, indexId, wisherCount, wisher, tempData.points);
    }
  }

  function getPoints(uint256 pointsMin, uint256 pointsMax, uint256 random) internal view returns (uint256) {
    uint256 points = 0;
    uint256 pointsRange = pointsMax - pointsMin + 1;
    points = getRandom(random + pointsMax, pointsRange, _msgSender()) + pointsMin;
    return points;
  }

  function eligibilityWishStar(uint256 probability) internal view returns (bool) {
    if (probability == 0) {
      return false;
    }
    uint256 eligibilityNum = getRandom(probability, 100, _msgSender());
    return eligibilityNum < probability;
  }

  function getWisherIndexId(bytes32 poolId, uint256 boostType, uint256 currentCycle) internal view returns (uint256) {
    for (uint256 index = 0; index < currentCycle; index++) {
      CycleInfoData memory cycleInfoData = CycleInfo.get(poolId, currentCycle, boostType);
      if (cycleInfoData.wisherCount == 0 || cycleInfoData.isboost) {
        return index + 1;
      }
    }
    return 0;
  }
}

// uint256 wisherCount = CycleInfo.getWisherCount(poolId, currentCycle, 0) + 1;
// uint256 wisherIndexId = CycleInfo.getWisherIndexId(poolId, currentCycle, 0);
// if (wisherIndexId == 0) {
//   wisherIndexId = getWisherIndexId(poolId, 0, currentCycle);
//   CycleInfo.set(poolId, currentCycle, 0, wisherCount, false, wisherIndexId);
//   wisherTemporaryRecordsData.pointsWishIndex = wisherCount;
// } else {
//   if (wisherTemporaryRecordsData.pointsLastCycle != currentCycle) {
//     CycleInfo.setWisherCount(poolId, currentCycle, 0, wisherCount);
//     wisherTemporaryRecordsData.pointsWishIndex = wisherCount;
//   }
// }
// IndexToWisher.set(
//   poolId,
//   0,
//   wisherIndexId,
//   wisherTemporaryRecordsData.pointsWishIndex,
//   wisher,
//   wisherTemporaryRecordsData.points
// );

// if (
//   wisherTemporaryRecordsData.starLastCycle != currentCycle &&
//   (incenseResult.joinWishStar || boxResult.joinWishStar)
// ) {
//   wisherCount = CycleInfo.getWisherCount(poolId, currentCycle, 1) + 1;
//   wisherIndexId = CycleInfo.getWisherIndexId(poolId, currentCycle, 1);

//   if (wisherIndexId == 0) {
//     wisherIndexId = getWisherIndexId(poolId, 1, currentCycle);
//     CycleInfo.set(poolId, currentCycle, 1, wisherCount, false, wisherIndexId);
//   } else {
//     CycleInfo.setWisherCount(poolId, currentCycle, 1, wisherCount);
//   }

//   wisherTemporaryRecordsData.starWishIndex = wisherCount;
//   wisherTemporaryRecordsData.starLastCycle = currentCycle;
//   IndexToWisher.set(
//     poolId,
//     1,
//     wisherIndexId,
//     wisherTemporaryRecordsData.starWishIndex,
//     wisher,
//     wisherTemporaryRecordsData.points
//   );
// }
