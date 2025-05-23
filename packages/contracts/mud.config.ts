import { defineWorld } from "@latticexyz/world";

export default defineWorld({
  namespace: "cyberwish",
  userTypes: {
    Entity: { type: "bytes32", filePath: "./src/Entity.sol" },
  },
  tables: {
    WishCount: { schema: { count: "uint256" }, key: [] },
    WishingPool: { schema: { id: "bytes32", creator: "address", amount: "uint256", startTime: "uint256", duration: "uint256", name: "string" }, key: ["id"] },
    Wisher: { schema: { poolId: "bytes32", wisher: "address", points: "uint256", wishCount: "uint256", boostedPointsAmount: "uint256", boostedStarAmount: "uint256" }, key: ["poolId", "wisher"] },
    WisherTemporaryRecords: { schema: { poolId: "bytes32", wisher: "address", pointsWishIndex: "uint256", starWishIndex: "uint256", pointsLastCycle: "uint256", starLastCycle: "uint256", wishCount: "uint256", points: "uint256",}, key: ["poolId", "wisher"]},
    Wishes: { schema: { poolId: "bytes32", id: "bytes32", wisher: "address", wishTime: "uint256", cycle: "uint256", incenseId: "uint256", blindBoxId: "uint256", pointsIncense: "uint256", pointsBlindBox: "uint256", isStar: "bool", wishContent: "string" }, key: ["poolId", "id"], type: "offchainTable" },
    BoostWisherRecords: { schema: { poolId: "bytes32", cycle: "uint256", amount: "uint256", amountPoints: "uint256", amountStar: "uint256", boostedWisherByPoints: "address[]", boostedWisherByStar: "address[]"}, key: ["poolId", "cycle"]},
    CycleInfo: { schema: { poolId: "bytes32", cycle: "uint256", boostType: "uint256", wisherCount: "uint256", isboost: "bool", wisherIndexId: "uint256"}, key: ["poolId", "cycle", "boostType"]},
    IndexToWisher: { schema: { poolId: "bytes32", boostType: "uint256", id: "uint256", index: "uint256", wisher: "address", points: "uint256" }, key: ["poolId", "boostType", "id","index"] },
    WisherCycleRecords: { schema: { poolId: "bytes32", cycle: "uint256", wisher: "address", wishCount: "uint256", points: "uint256", boostedPointsAmount: "uint256", boostedStarAmount: "uint256"}, key: ["poolId", "cycle", "wisher"], type: "offchainTable" },
    Incense: { schema: { poolId: "bytes32", id: "uint256", amount: "uint256", duration: "uint256", pointsMin: "uint256", pointsMax: "uint256", starProbability: "uint256", easterEggProbability: "bool", name: "string"}, key: ["poolId", "id"]},
    PropBlindBox: { schema: { poolId: "bytes32", id: "uint256", amount: "uint256", pointsMin: "uint256", pointsMax: "uint256", starProbability: "uint256", easterEggProbability: "bool", name: "string"}, key: ["poolId", "id"]},
    Props: { schema: { poolId: "bytes32", boxId: "uint256", id: "uint256", name: "string"}, key: ["poolId", "boxId", "id"]},
  },
});
