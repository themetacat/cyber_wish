// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { System } from "@latticexyz/world/src/System.sol";

import { WishingPool, Wisher, WisherData, Incense, IncenseData, Wishes, BoostWisherRecords, IndexToWisher, CycleInfo, CycleInfoData, WisherCycleRecords, WisherCycleRecords, PropBlindBox, PropBlindBoxData, WisherTemporaryRecords, WisherTemporaryRecordsData, CycleInfoData, WisherIndexId } from "./codegen/index.sol";
import { Entity } from "./lib/Entity.sol";
import { uuid } from "./lib/createEntity.sol";
import { WishPropsResult, PointsData, ProcessPointsParams } from "./lib/Struct.sol";
import { WishPointsLib } from "./lib/WishPointsLib.sol";
import { BoostCycleLib } from "./lib/BoostCycleLib.sol";
import { WishUtils } from "./lib/WishUtils.sol";
import { Validate } from "./lib/Validate.sol";


contract WishSystem is System {
  function wish(bytes32 poolId, uint256 incenseId, uint256 blindBoxId, string memory wishContent) public payable {
    address wisher = _msgSender();
    uint256 timestamp = block.timestamp;

    Validate._validatePool(poolId);

    (uint256 totalAmount, bool isFreeWish) = Validate._validateAndFetchAmount(poolId, incenseId, blindBoxId);
    require(_msgValue() == totalAmount, "Insufficient balance");

    WisherTemporaryRecordsData memory wisherTemporaryRecordsData = WisherTemporaryRecords.get(poolId, wisher);

    require(!(isFreeWish && wisherTemporaryRecordsData.freeWishTime >= 10), "Free times limit reached");
    uint256 currentCycle = WishUtils.getCurrentCycle(poolId);
    Validate._validateIsBoosted(poolId, currentCycle);

    if (!isFreeWish) {
      WishingPool.setAmount(poolId, WishingPool.getAmount(poolId) + totalAmount);
    }
    uint256 propId = WishUtils.getPropsFromBox(poolId, blindBoxId, wisher);

    PointsData memory pointsData = WishPointsLib.processPoints(
      ProcessPointsParams(poolId, incenseId, blindBoxId, wisher)
    );
    uint256 totalPoints = pointsData.wishPropsResultIncense.points +
      pointsData.wishPropsResultBlindBox.points +
      pointsData.incenseEasterEggPoints +
      pointsData.boxEasterEggPoints;

    wisherTemporaryRecordsData = updateTemporaryRecords(
      wisherTemporaryRecordsData,
      currentCycle,
      totalPoints,
      isFreeWish
    );

    bool isStar;
    if (currentCycle > 0) {
      if (!isFreeWish) {
        BoostWisherRecords.setAmount(
          poolId,
          currentCycle,
          BoostWisherRecords.getAmount(poolId, currentCycle) + totalAmount
        );
      }
      // for boost wisher
      isStar = BoostCycleLib.processCycleForBoost(
        poolId,
        currentCycle,
        wisher,
        wisherTemporaryRecordsData,
        pointsData.wishPropsResultIncense.joinWishStar || pointsData.wishPropsResultBlindBox.joinWishStar
      );
    }

    Wishes.set(
      poolId,
      uuid(),
      wisher,
      currentCycle,
      timestamp,
      timestamp + Incense.getDuration(poolId, incenseId),
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
    {
      WisherData memory wisherData = Wisher.get(poolId, wisher);
      wisherData.points += totalPoints;
      wisherData.wishCount += 1;
      Wisher.set(poolId, wisher, wisherData);
    }

    {
      wisherTemporaryRecordsData.pointsLastCycle = currentCycle;
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

}
