// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { Entity } from "./Entity.sol";
import { WishingPool, Incense, PropBlindBox, CycleInfo } from "../codegen/index.sol";

library Validate {
  function _validatePool(bytes32 poolId) internal view {
    require(WishingPool.getCreator(poolId) != address(0), "No pool");
  }

  function _validateIsBoosted(bytes32 poolId, uint256 cycle) internal view {
    require(!(CycleInfo.getIsboost(poolId, cycle, 1) || CycleInfo.getIsboost(poolId, cycle, 2)), "Boosted");
  }

  function _validateAndFetchAmount(
    bytes32 poolId,
    uint256 incenseId,
    uint256 blindBoxId
  ) internal view returns (uint256 totalAmount, bool isFreeWish) {
    uint256 incenseAmount = Incense.getAmount(poolId, incenseId);
    uint256 blindboxAmount = PropBlindBox.getAmount(poolId, blindBoxId);
    totalAmount = incenseAmount + blindboxAmount;
    isFreeWish = totalAmount == 0;
  }
}
