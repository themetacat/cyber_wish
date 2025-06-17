// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { System } from "@latticexyz/world/src/System.sol";
import { WishingPool, Wisher, WisherData, BoostWisherRecords, BoostWisherRecordsData, WisherCycleRecords, CycleInfo, CycleInfoData, IndexToWisher, WisherIndexId } from "./codegen/index.sol";
import { Entity } from "./lib/Entity.sol";
import { WishUtils } from "./lib/WishUtils.sol";
import { WorldResourceIdLib } from "@latticexyz/world/src/WorldResourceId.sol";
import { IWorld } from "./codegen/world/IWorld.sol";
import { WisherPoints } from "./lib/Struct.sol";
import { BoostCycleLib } from "./lib/BoostCycleLib.sol";
import { UD60x18 } from "@prb/math/src/UD60x18.sol";

contract BoostWisherSystem is System {
  function BoostWisherByPoints(bytes32 poolId, uint256 boostCycle) public {
    address sender = _msgSender();
    require(WishingPool.getCreator(poolId) == sender, "Not eligible");
    require(boostCycle > 0, "Does not exist cycle");

    uint256 currentCycle = WishUtils.getCurrentCycle(poolId);
    require(currentCycle == 0 || currentCycle > boostCycle, "Not yet finished");

    CycleInfoData memory cycleInfoData = CycleInfo.get(poolId, boostCycle, 1);
    require(!cycleInfoData.isboost, "Not allow boost");
    uint256 wisherCount = cycleInfoData.wisherCount;
    require(wisherCount > 0, "No Wisher");

    BoostWisherRecordsData memory boostWisherRecordsData = BoostWisherRecords.get(poolId, boostCycle);
    uint256 totalBoostAmount = (boostWisherRecordsData.amount * 24) / 100;

    CycleInfo.setIsboost(poolId, boostCycle, 1, true);
    WisherIndexId.setInUse(cycleInfoData.wisherIndexId, 1, false);
    if (totalBoostAmount == 0) return;

    boostWisherRecordsData.amountPoints = totalBoostAmount;

    (uint256 selectCount, WisherPoints[] memory eligibleWishers) = BoostCycleLib.selectEligibleWishers(
      poolId,
      cycleInfoData.wisherIndexId,
      wisherCount
    );
    if (selectCount == 0) return;
    WisherPoints[] memory selectedWisher = BoostCycleLib.weightedRandomSelection(selectCount, eligibleWishers);

    uint256[] memory boostAmount = BoostCycleLib.getPointsBoostAmount(selectedWisher, totalBoostAmount);
    address[] memory selectedWisherAddr = new address[](selectedWisher.length);
    for (uint256 i = 0; i < selectedWisher.length; i++) {
      address wisher = selectedWisher[i].wisher;
      if (wisher == address(0)) continue;
      selectedWisherAddr[i] = wisher;
      IWorld(_world()).transferBalanceToAddress(
        WorldResourceIdLib.encodeNamespace("cyberwish"),
        wisher,
        boostAmount[i]
      );
      WisherData memory wisherData = Wisher.get(poolId, wisher);
      wisherData.boostedPointsAmount += boostAmount[i];
      wisherData.timePointsSelected += 1;
      Wisher.set(poolId, wisher, wisherData);
      WisherCycleRecords.setBoostedPointsAmount(poolId, boostCycle, wisher, boostAmount[i]);
    }
    boostWisherRecordsData.boostedWisherByPoints = selectedWisherAddr;
    BoostWisherRecords.set(poolId, boostCycle, boostWisherRecordsData);
  }

  function BoostWisherByStar(bytes32 poolId, uint256 boostCycle) public {
    address sender = _msgSender();
    require(WishingPool.getCreator(poolId) == _msgSender(), "Not eligible");
    require(boostCycle > 0, "Does not exist cycle");

    uint256 currentCycle = WishUtils.getCurrentCycle(poolId);
    require(currentCycle == 0 || currentCycle > boostCycle, "Not yet finished");

    CycleInfoData memory cycleInfoData = CycleInfo.get(poolId, boostCycle, 2);
    require(!cycleInfoData.isboost, "Not allow boost");
    uint256 wisherCount = cycleInfoData.wisherCount;
    require(wisherCount > 0, "No Wisher");

    BoostWisherRecordsData memory boostWisherRecordsData = BoostWisherRecords.get(poolId, boostCycle);
    uint256 boostAmount = (boostWisherRecordsData.amount * 36) / 100;

    WisherIndexId.setInUse(cycleInfoData.wisherIndexId, 2, false);
    CycleInfo.setIsboost(poolId, boostCycle, 2, true);

    if (boostAmount == 0) return;

    boostWisherRecordsData.amountStar = boostAmount;

    (uint256[] memory starWishersIndex, uint256[] memory boostPercents) = BoostCycleLib.getStarWishers(
      wisherCount,
      sender
    );
    address[] memory starWishers = new address[](starWishersIndex.length);

    for (uint256 index = 0; index < starWishersIndex.length; index++) {
      uint256 boostedWisherAmount = (boostAmount * boostPercents[index]) / 100;
      address wisher = IndexToWisher.getWisher(poolId, 2, cycleInfoData.wisherIndexId, starWishersIndex[index]);
      if (wisher == address(0)) continue;
      starWishers[index] = wisher;
      IWorld(_world()).transferBalanceToAddress(
        WorldResourceIdLib.encodeNamespace("cyberwish"),
        wisher,
        boostedWisherAmount
      );

      WisherData memory wisherData = Wisher.get(poolId, wisher);
      wisherData.boostedStarAmount += boostedWisherAmount;
      wisherData.timeStarSelected += 1;
      Wisher.set(poolId, wisher, wisherData);
      WisherCycleRecords.setBoostedStarAmount(poolId, boostCycle, wisher, boostedWisherAmount);
    }

    boostWisherRecordsData.boostedWisherByStar = starWishers;
    BoostWisherRecords.set(poolId, boostCycle, boostWisherRecordsData);
  }
}
