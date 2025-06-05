import React, { useEffect, useState, useRef } from "react";
import styles from "./wishesPanel.module.css";
import { useComponentValue, useEntityQuery } from "@latticexyz/react";
import { components } from "../../mud/recs";
import { getComponentValue, Has } from "@latticexyz/recs";
import { encodeEntity, singletonEntity } from "@latticexyz/store-sync/recs";
import { WISH_POOL_ID } from "../../utils/contants";
import { pad } from "viem";
import { format } from "date-fns";
import { useAccount } from "wagmi";

interface WishInfo {
    wisher: string;
    wishContent: string;
    wishTime: number;
    propId: number;
    lightPoints: number;
    blindBoxPoints: number;
}

export type Props = {
    wishStatus: boolean;
};

export default function WishesResult({ wishStatus }: Props) {
    const { address: userAddress } = useAccount();
    const Wishes = components.Wishes;
    const [propId, setPropId] = useState<number>(0);
    const [wishCount, setWishCount] = useState<number>(0);

    const fetchOneWish = (wishIndex: number): WishInfo | undefined => {

        const id = pad(`0x${wishIndex.toString(16)}`, { size: 32 });
        const key = encodeEntity(Wishes.metadata.keySchema, { poolId: WISH_POOL_ID, id: id });
        const wishData = getComponentValue(Wishes, key);

        if (!wishData) {
            return;
        }
        const wishInfo = {
            wisher: wishData.wisher,
            wishContent: wishData.wishContent,
            wishTime: Number(wishData.wishTime),
            propId: Number(wishData.propId),
            lightPoints: Number(wishData.pointsIncense),
            blindBoxPoints: Number(wishData.pointsBlindBox),
        }
        return wishInfo;
    }
    useEffect(()=> {
        if (wishStatus) {
            console.log("+1 wish count");
            setWishCount(prev => prev + 1);
        }
    }, [wishStatus])

    const wishCountData = useComponentValue(components.WishCount, singletonEntity);

    useEffect(() => {
        if (wishCount == 0) {
            return;
        }
        
        if (!wishCountData || wishCountData.count <= 0n) {
            return;
        }
        const totalWishCount = Number(wishCountData.count);
        const wishInfo = fetchOneWish(totalWishCount);
        if (!wishInfo) {
            return;
        }
        if (wishInfo.wisher !== userAddress) {
            return;
        }
        console.log(wishInfo);
        setPropId(wishInfo.propId)
        setWishCount(prev => prev - 1);
    }, [wishCountData, userAddress, wishCount])

    function shortenAddress(address: string) {
        return `${address.slice(0, 5)}...${address.slice(-4)}`;
    }

    return (
        <div>
        </div>
    );
}
