// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { Script } from "forge-std/Script.sol";
import { console } from "forge-std/console.sol";
import { ResourceId, WorldResourceIdLib, WorldResourceIdInstance } from "@latticexyz/world/src/WorldResourceId.sol";
import { RESOURCE_SYSTEM } from "@latticexyz/world/src/worldResourceTypes.sol";
import { WishSystem } from "../src/WishSystem.sol";
import { StoreSwitch } from "@latticexyz/store/src/StoreSwitch.sol";
import { Incense } from "../src/codegen/index.sol";

import { IWorld } from "../src/codegen/world/IWorld.sol";

contract WishExtension is Script {
  function run() external {
    uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
    address worldAddress = vm.envAddress("WORLD_ADDRESS");
    console.log("world Address: ", worldAddress);
    vm.startBroadcast(deployerPrivateKey);
    StoreSwitch.setStoreAddress(worldAddress);

    WishSystem wishSystem = new WishSystem();

    ResourceId systemId = WorldResourceIdLib.encode({
      typeId: RESOURCE_SYSTEM,
      namespace: "cyberwish",
      name: "WishSystem"
    });

    IWorld(worldAddress).registerSystem(systemId, wishSystem, true);

    vm.stopBroadcast();
  }
}
