import { encodeEntity } from '@latticexyz/store-sync/recs';
import { components } from '../mud/recs';
import { getComponentValue } from '@latticexyz/recs';
import { WISH_POOL_ID } from '../utils/contants';

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

    const key = encodeEntity(BoostWisherRecords.metadata.keySchema, { poolId: WISH_POOL_ID, cycle: BigInt(cycle) });
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
    const key = encodeEntity(WisherCycleRecords.metadata.keySchema, { poolId: WISH_POOL_ID, cycle: BigInt(cycle), wisher: wisher });
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

export const getTimeStampByCycle = (cycle: number): number => {
    const wisherPoolData = getWishPoolInfo();
    if (!wisherPoolData) {
        return 0;
    }
    return  Number(wisherPoolData.duration)*(cycle-1) + Number(wisherPoolData.startTime);
}

export const getWishPoolInfo = () => {
    const WishingPool = components.WishingPool;
    const key = encodeEntity(WishingPool.metadata.keySchema, { id: WISH_POOL_ID});
    const wisherPoolData = getComponentValue(WishingPool, key);
    return wisherPoolData;
}

export const getCycleInfo = (cycle: number, boostType: number) => {
    const CycleInfo = components.CycleInfo;
    const key = encodeEntity(CycleInfo.metadata.keySchema, { poolId: WISH_POOL_ID, cycle: BigInt(cycle), boostType: BigInt(boostType)});
    const cycleInfo = getComponentValue(CycleInfo, key);
    return cycleInfo;
}
