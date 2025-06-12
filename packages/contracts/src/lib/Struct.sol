// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

struct WishPropsResult {
  uint256 points;
  bool joinWishStar;
}

struct PointsData {
  uint256 incenseEasterEggPoints;
  uint256 boxEasterEggPoints;
  WishPropsResult wishPropsResultIncense;
  WishPropsResult wishPropsResultBlindBox;
}

struct ProcessPointsParams {
  bytes32 poolId;
  uint256 incenseId;
  uint256 blindBoxId;
  address wisher;
}

struct WisherPoints {
  address wisher;
  uint256 points;
}