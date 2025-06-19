// // SPDX-License-Identifier: MIT
// pragma solidity >=0.8.24;

// import { Script } from "forge-std/Script.sol";
// import { console } from "forge-std/console.sol";
// import { ResourceId, WorldResourceIdLib, WorldResourceIdInstance } from "@latticexyz/world/src/WorldResourceId.sol";
// import { RESOURCE_SYSTEM } from "@latticexyz/world/src/worldResourceTypes.sol";
// import { BoostWisherSystem } from "../src/BoostWisherSystem.sol";
// import { StoreSwitch } from "@latticexyz/store/src/StoreSwitch.sol";


// import { IWorld } from "../src/codegen/world/IWorld.sol";

// contract MClearBoradExtension is Script {
//   function run() external {
//     uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
//     address worldAddress = vm.envAddress("WORLD_ADDRESS");
//     console.log("world Address: ", worldAddress);

//     vm.startBroadcast(deployerPrivateKey);

//     BoostWisherSystem boostWisherSystem = new BoostWisherSystem();
 
//     ResourceId systemId = WorldResourceIdLib.encode({
//       typeId: RESOURCE_SYSTEM,
//       namespace: "cyberwish",
//       name: "BoostWisherSyste"
//     });

//     IWorld(worldAddress).registerSystem(systemId, boostWisherSystem, true);

//     vm.stopBroadcast();
//   }

// }
