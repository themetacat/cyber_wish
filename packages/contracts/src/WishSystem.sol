// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { System } from "@latticexyz/world/src/System.sol";

import { WishingPool, WishingPoolData, Wisher, WisherData, Incense, IncenseData, Wishes, BoostWisherRecords, IndexToWisher, CycleInfo, WisherCycleRecords, WisherCycleRecords, PropBlindBox, PropBlindBoxData, WisherTemporaryRecords, WisherTemporaryRecordsData, CycleInfoData } from "./codegen/index.sol";
import { Entity } from "./Entity.sol";
import { uuid } from "./createEntity.sol";
import { getCurrentCycle, getRandom } from "./Utils.sol";
import { WishPropsResult } from "./Struct.sol";

contract WishSystem is System {
  // receive() external payable {}
  struct PointsData {
    uint256 incenseEasterEggPoints;
    uint256 boxEasterEggPoints;
    WishPropsResult wishPropsResultIncense;
    WishPropsResult wishPropsResultBlindBox;
  }
  
  struct ProcessPointsParams{
    bytes32 poolId;
    uint256 incenseId;
    uint256 blindBoxId;
  }

  function wish(bytes32 poolId, uint256 incenseId, uint256 blindBoxId, string memory wishContent) public payable {
    address wisher = _msgSender();

    _validatePool(poolId);

    uint256 incenseAmount = Incense.getAmount(poolId, incenseId);
    uint256 blindboxAmount = PropBlindBox.getAmount(poolId, blindBoxId);
    require(_msgValue() == incenseAmount + blindboxAmount, "Insufficient balance");

    WisherData memory wisherData = Wisher.get(poolId, wisher);
    WisherTemporaryRecordsData memory wisherTemporaryRecordsData = WisherTemporaryRecords.get(poolId, wisher);

    bool isFreeWish = incenseAmount == 0 && blindboxAmount == 0;
    require(!(isFreeWish && wisherTemporaryRecordsData.freeWishTime >= 10), "Free times limit reached");

    uint256 propId = getPropsFromBox(poolId, blindBoxId);

    ProcessPointsParams memory processPointsParams = ProcessPointsParams({
      poolId: poolId,
      incenseId: incenseId,
      blindBoxId: blindBoxId
    });
    PointsData memory pointsData = _processPoints(processPointsParams);

    uint256 totalPoints = pointsData.wishPropsResultIncense.points + pointsData.wishPropsResultBlindBox.points + pointsData.incenseEasterEggPoints + pointsData.boxEasterEggPoints;
    wisherData.points += totalPoints;
    wisherData.wishCount += 1;

    // !!! check currentCycle isBoosted
    uint256 currentCycle = getCurrentCycle(poolId);

    wisherTemporaryRecordsData = updateTemporaryRecords(
      wisherTemporaryRecordsData,
      currentCycle,
      totalPoints,
      isFreeWish
    );

    bool isStar;
    if (currentCycle > 0) {
      // for boost wisher
      isStar = _processCycleBoost(
        poolId,
        currentCycle,
        wisher,
        wisherTemporaryRecordsData,
        pointsData.wishPropsResultIncense.joinWishStar || pointsData.wishPropsResultBlindBox.joinWishStar
      );
    }

    wisherTemporaryRecordsData.pointsLastCycle = currentCycle;
    Wishes.set(
      poolId,
      uuid(),
      wisher,
      block.timestamp,
      currentCycle,
      incenseId,
      blindBoxId,
      pointsData.wishPropsResultIncense.points,
      pointsData.wishPropsResultBlindBox.points,
      pointsData.incenseEasterEggPoints,
      pointsData.boxEasterEggPoints,
      propId,
      isStar,
      wishContent
    );
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

  function _processPoints(ProcessPointsParams memory processPointsParams) private returns (PointsData memory pointsData) {
    bytes32 poolId = processPointsParams.poolId;
    IncenseData memory incenseData = Incense.get(poolId, processPointsParams.incenseId);
    PropBlindBoxData memory blindBoxData = PropBlindBox.get(poolId, processPointsParams.blindBoxId);

    pointsData.wishPropsResultIncense = lightingIncense(poolId, incenseData);
    pointsData.wishPropsResultBlindBox = openBox(poolId, blindBoxData);
    pointsData.incenseEasterEggPoints = easterEggPoints(incenseData.amount == 0, pointsData.wishPropsResultIncense.points);
    pointsData.boxEasterEggPoints = easterEggPoints(blindBoxData.amount == 0, pointsData.wishPropsResultBlindBox.points);
  }

  function lightingIncense(bytes32 poolId, IncenseData memory incenseData) private returns (WishPropsResult memory) {
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

  function openBox(bytes32 poolId, PropBlindBoxData memory propBlindBoxData) private returns (WishPropsResult memory) {
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

    uint256 random = isIncense ? 1 : 0;
    // if (isIncense) {
    //   // uint256 duration = 1;
    //   random = 1;
    // }
    result.points = getPoints(pointsMin, pointsMax, random);
    result.joinWishStar = eligibilityWishStar(starProbability, random);

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
  ) internal returns (bool isStar) {
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
    } else {
      wisherCount -= 1;
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
      isStar = true;
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

  function eligibilityWishStar(uint256 probability, uint256 random) internal view returns (bool) {
    if (probability == 0) {
      return false;
    }
    uint256 eligibilityNum = getRandom(probability + random, 100, _msgSender());
    return eligibilityNum < probability;
  }

  function getWisherIndexId(bytes32 poolId, uint256 boostType, uint256 currentCycle) internal view returns (uint256) {
    for (uint256 index = 0; index < currentCycle; index++) {
      uint256 indexId = index + 1;
      CycleInfoData memory cycleInfoData = CycleInfo.get(poolId, indexId, boostType);
      if (cycleInfoData.wisherCount == 0 || cycleInfoData.isboost) {
        return indexId;
      }
    }
    return 0;
  }

  function getPropsFromBox(bytes32 poolId, uint256 blindBoxId) internal view returns (uint256) {
    uint256[] memory propIds = PropBlindBox.getPropIds(poolId, blindBoxId);
    uint256 propIdsLength = propIds.length;
    require(propIdsLength > 0, "No Props");
    uint256 index = getRandom(blindBoxId, propIds.length, _msgSender());
    return propIds[index];
  }

  function easterEggPoints(bool isFree, uint256 points) internal view returns (uint256) {
    uint256 expansionRatio;
    uint256 expansionPoints;
    uint256 randomValue = getRandom(points, 100, _msgSender());
    if (isFree) {
      if (randomValue < 15) {
        expansionRatio = 50 + getRandom(points, 51, _msgSender());
      }
    } else {
      if (randomValue < 5) {
        expansionRatio = 200;
      } else if (randomValue < 30) {
        expansionRatio = 50 + getRandom(points, 51, _msgSender());
      } else if (randomValue < 65) {
        expansionRatio = 5 + getRandom(points, 46, _msgSender());
      } else {
        expansionPoints = 5 + getRandom(points, 21, _msgSender());
      }
    }
    if (expansionRatio > 0) {
      expansionPoints = (points * expansionRatio) / 100;
    }
    return expansionPoints;
  }

  function updateTemporaryRecords(
    WisherTemporaryRecordsData memory data,
    uint256 currentCycle,
    uint256 totalPoints,
    bool isFreeWish
  ) internal pure returns (WisherTemporaryRecordsData memory) {
    if (data.pointsLastCycle == currentCycle) {
      data.points += totalPoints;
      data.wishCount += 1;
      if (isFreeWish) {
        data.freeWishTime += 1;
      }
    } else {
      data.points = totalPoints;
      data.wishCount = 1;
      data.freeWishTime = isFreeWish ? 1 : 0;
    }
    return data;
  }

  function _validatePool(bytes32 poolId) internal view {
    require(WishingPool.getCreator(poolId) != address(0), "No pool");
  }
}
