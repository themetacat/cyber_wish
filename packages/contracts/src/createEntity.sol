// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { Entity } from "./Entity.sol";
import { WishCount } from "./codegen/tables/WishCount.sol";

// function createEntity() returns (Entity entity) {
//   return Entity.wrap(uuid());
// }

function uuid() returns (bytes32) {
  uint256 next = WishCount.get() + 1;
  WishCount.set(next);
  return bytes32(next);
}
