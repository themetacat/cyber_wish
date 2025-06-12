// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { UD60x18, ud } from "@prb/math/src/UD60x18.sol";

library PowerCalculator {
  /// @notice 输入正整数 x（如 1, 10, 100），返回 x^0.8（以 18 位小数表示）
  function powPointEight(uint256 x) external pure returns (uint256) {
    require(x > 0, "x must be positive");

    UD60x18 base = ud(x); // 转换为 UD60x18 类型，自动乘上 1e18
    UD60x18 exponent = ud(8e17); // 0.8 in 18 decimals

    UD60x18 result = base.pow(exponent); // x^0.8

    return result.unwrap(); // 返回 uint256，表示结果 * 1e18
  }
}
