// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { UD60x18, ud } from "@prb/math/src/UD60x18.sol";

library PowerCalculator {
  function powPointEight(uint256 x) external pure returns (uint256) {
    if(x == 0) return 0;

    UD60x18 base = ud(x);
    UD60x18 exponent = ud(8e17);

    UD60x18 result = base.pow(exponent);

    return result.unwrap();
  }

  function computeSampleCount(uint256 payCount, uint256 freeCount) internal pure returns (uint256) {
    uint256 x = payCount;
    if (x == 0) return 0;

    uint256 z = (x + 1) / 2;
    uint256 y = x;
    while (z < y) {
      y = z;
      z = (x / z + z) / 2;
    }

    uint256 sqrtPayCount = y;
    if (sqrtPayCount < 1) {
      sqrtPayCount = 1;
    }

    uint256 maxVal = sqrtPayCount;
    uint256 limit = freeCount / 10;

    return maxVal < limit ? maxVal : limit;
  }
}
