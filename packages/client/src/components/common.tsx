import { encodeEntity } from '@latticexyz/store-sync/recs';
import { components } from '../mud/recs';
import { getComponentValue } from '@latticexyz/recs';
import { wishPool } from '../utils/contants';

export interface SelectedWisher {
    amount: bigint,
    amountPoints: bigint,
    amountStar: bigint,
    boostedWisherByPoints: string[];
    boostedWisherByStar: string[];
}

export interface WisherCycelRecords {
    points: number,
    wishCount: number,
    boostedPointsAmount: bigint,
    boostedStarAmount: bigint,
}

export const getBoostWisherRecords = (cycle: number): SelectedWisher | undefined => {
    const BoostWisherRecords = components.BoostWisherRecords;

    // const cycleHex = pad(`0x${cycle.toString(16)}`, { size: 32 });
    const key = encodeEntity(BoostWisherRecords.metadata.keySchema, { poolId: wishPool, cycle: BigInt(cycle) });
    const boostWisherRecordsData = getComponentValue(BoostWisherRecords, key);

    if (!boostWisherRecordsData) {
        return;
    }
    return {
        amount: boostWisherRecordsData.amount,
        amountPoints: boostWisherRecordsData.amountPoints,
        amountStar: boostWisherRecordsData.amountStar,
        boostedWisherByPoints: boostWisherRecordsData.boostedWisherByPoints,
        boostedWisherByStar: boostWisherRecordsData.boostedWisherByStar
    }
}

export const getWisherCycleRecords = (cycle: number, wisher: any): WisherCycelRecords | undefined => {
    const WisherCycleRecords = components.WisherCycleRecords;
    const key = encodeEntity(WisherCycleRecords.metadata.keySchema, { poolId: wishPool, cycle: BigInt(cycle), wisher: wisher });
    const wisherCycleRecordsData = getComponentValue(WisherCycleRecords, key);

    if (!wisherCycleRecordsData) {
        return;
    }
    return {
        points: Number(wisherCycleRecordsData.points),
        wishCount: Number(wisherCycleRecordsData.wishCount),
        boostedPointsAmount: wisherCycleRecordsData.boostedPointsAmount,
        boostedStarAmount: wisherCycleRecordsData.boostedStarAmount
    }
}