// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { Incense, IncenseData, PropBlindBox, PropBlindBoxData } from "../codegen/index.sol";
import { ProcessPointsParams, PointsData, WishPropsResult } from "./Struct.sol";
import { WishUtils } from "./WishUtils.sol";

library WishPointsLib {
  function processPoints(
    ProcessPointsParams memory processPointsParams
  ) internal view returns (PointsData memory pointsData) {
    bytes32 poolId = processPointsParams.poolId;
    IncenseData memory incenseData = Incense.get(poolId, processPointsParams.incenseId);
    PropBlindBoxData memory blindBoxData = PropBlindBox.get(poolId, processPointsParams.blindBoxId);

    pointsData.wishPropsResultIncense = lightingIncense(incenseData, processPointsParams.wisher);
    pointsData.wishPropsResultBlindBox = openBox(blindBoxData, processPointsParams.wisher);
    pointsData.incenseEasterEggPoints = easterEggPoints(
      incenseData.amount == 0,
      pointsData.wishPropsResultIncense.points,
      processPointsParams.wisher
    );
    pointsData.boxEasterEggPoints = easterEggPoints(
      blindBoxData.amount == 0,
      pointsData.wishPropsResultBlindBox.points,
      processPointsParams.wisher
    );
  }

  function lightingIncense(IncenseData memory incenseData, address wisher) internal view returns (WishPropsResult memory) {
    require(incenseData.pointsMax > 0, "Invalid Incense");
    return _handleWishProps(incenseData.pointsMin, incenseData.pointsMax, incenseData.starProbability, true, wisher);
  }

  function openBox(PropBlindBoxData memory propBlindBoxData, address wisher) internal view returns (WishPropsResult memory) {
    require(propBlindBoxData.pointsMax > 0, "Invalid Blind Box");
    return
      _handleWishProps(propBlindBoxData.pointsMin, propBlindBoxData.pointsMax, propBlindBoxData.starProbability, false, wisher);
  }

  function _handleWishProps(
    uint256 pointsMin,
    uint256 pointsMax,
    uint256 starProbability,
    bool isIncense,
    address wisher
  ) internal view returns (WishPropsResult memory result) {
    uint256 random = isIncense ? 99 : 66;
    result.points = WishUtils.getPoints(pointsMin, pointsMax, random, wisher);
    result.joinWishStar = WishUtils.eligibilityWishStar(starProbability, random, wisher);
  }

  function easterEggPoints(bool isFree, uint256 points, address wisher) internal view returns (uint256) {
    uint256 expansionRatio;
    uint256 expansionPoints;
    uint256 randomValue = WishUtils.getRandom(points, 100, wisher);
    uint256 num = points + randomValue;
    if (isFree) {
      if (randomValue < 15) {
        expansionRatio = 50 + WishUtils.getRandom(num, 51, wisher);
      }
    } else {
      if (randomValue < 5) {
        expansionRatio = 200;
      } else if (randomValue < 30) {
        expansionRatio = 50 + WishUtils.getRandom(num, 51, wisher);
      } else if (randomValue < 65) {
        expansionRatio = 5 + WishUtils.getRandom(num, 46, wisher);
      } else {
        expansionPoints = 5 + WishUtils.getRandom(num, 21, wisher);
      }
    }
    if (expansionRatio > 0) {
      expansionPoints = (points * expansionRatio) / 100;
    }
    return expansionPoints;
  }
}
