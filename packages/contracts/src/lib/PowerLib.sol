// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { UD60x18, ud } from "@prb/math/src/UD60x18.sol";

library PowerCalculator {
  function powPointEight(uint256 x) external pure returns (uint256) {
    require(x > 0, "x must be positive");

    UD60x18 base = ud(x);
    UD60x18 exponent = ud(8e17);

    UD60x18 result = base.pow(exponent);

    return result.unwrap();
  }
}
