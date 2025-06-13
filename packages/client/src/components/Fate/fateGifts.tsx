import { useEffect, useState, useMemo } from "react";
import { components } from "../../mud/recs";
import { getComponentValue, Has } from "@latticexyz/recs";
import { decodeEntity } from "@latticexyz/store-sync/recs";
import { useEntityQuery } from "@latticexyz/react";
import { formatInTimeZone } from 'date-fns-tz';
import commonStyle from "../wishWall/index.module.css";
import style from './fateGifts.module.css';
import { getCycleInfo, getTimeStampByCycle, getWisherCycleRecords, getWishPoolInfo } from "../common";
import { formatEther } from 'viem';
import { shortenAddress } from "../../utils/common";
import Selected from "./selected";
import { useAccount } from "wagmi";
import MyFateGifts from "./myFateGifts";
import { CURRENCY_SYMBOL } from "../../utils/contants"

interface PoolData {
    title: string;
    amount: bigint;
    selectedCount: number;
    wisherList: string[];
}

interface TotalPoolData {
    id: number;
    isBoost: boolean;
    cycle: number;
    totalAmount: bigint;
    timeStamp: number;
    pools: PoolData[];
}

export default function FateGifts() {
    const [expandedId, setExpandedId] = useState<number | null>(0);
    const [countdown, setCountdown] = useState(0);
    const [selectedCycle, setSelectedCycle] = useState(0);
    const BoostWisherRecords = components.BoostWisherRecords;
    const boostWisherRecordsData = useEntityQuery([Has(BoostWisherRecords)]);
    const { address: userAddress } = useAccount();
    const [showMyFateGifts, setShowMyFateGifts] = useState(false);

    const BOOST_TYLE_STAR = 2;

    const data: TotalPoolData[] = useMemo(() => {
        return boostWisherRecordsData
            .map((key, index): TotalPoolData | undefined => {
                const decodeKey = decodeEntity(BoostWisherRecords.metadata.keySchema, key);
                const singleBoostWisherRecord = getComponentValue(BoostWisherRecords, key);
                if (!singleBoostWisherRecord || singleBoostWisherRecord.amount == 0n) {
                    return;
                }
                const cycle = Number(decodeKey.cycle);
                const cycleInfo = getCycleInfo(cycle, BOOST_TYLE_STAR);
                const isBoost = Boolean(cycleInfo?.isboost);

                const res: TotalPoolData = {
                    id: index,
                    isBoost: isBoost,
                    timeStamp: getTimeStampByCycle(cycle),
                    cycle: cycle,
                    totalAmount: singleBoostWisherRecord.amount,
                    pools: [
                        {
                            title: "Wish Points Rewards",
                            amount: singleBoostWisherRecord.amountPoints,
                            selectedCount: singleBoostWisherRecord.boostedWisherByPoints.length,
                            wisherList: singleBoostWisherRecord.boostedWisherByPoints.slice(0, 3),
                        },
                        {
                            title: "Fated Rewards",
                            amount: singleBoostWisherRecord.amountStar,
                            selectedCount: singleBoostWisherRecord.boostedWisherByStar.length,
                            wisherList: singleBoostWisherRecord.boostedWisherByStar.slice(0, 3),
                        },
                    ],
                };
                return res;
            })
            .filter((item): item is TotalPoolData => !!item)
            .sort((a, b) => b.cycle - a.cycle);
    }, [boostWisherRecordsData, BoostWisherRecords]);

    useEffect(() => {
        // expandedId == null && data.length > 0 && setExpandedId(0);

        const poolInfo = getWishPoolInfo();
        if (!poolInfo || poolInfo.startTime === 0n) return;

        const currentItem = data.find((row) => isCurrent(row.timeStamp));
        if (!currentItem) return;

        const elapsedTime = Math.floor(Date.now() / 1000) - currentItem.timeStamp;
        const initialCountdown = Number(poolInfo.duration) - elapsedTime;

        setCountdown(initialCountdown);

        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [data]);

    const formatCountdown = (seconds: number): string => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h.toString().padStart(2, '0')}:${m
            .toString()
            .padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };


    const toggleExpand = (id: number) => {
        setExpandedId(expandedId === id ? null : id);
    };

    const isCurrent = (timeStamp: number): boolean => {
        const poolInfo = getWishPoolInfo();
        if (!poolInfo || poolInfo.startTime == 0n) {
            return false;
        }
        const elapsedTime = Math.floor(Date.now() / 1000) - timeStamp;
        return elapsedTime < Number(poolInfo.duration);
    };

    return (
        <div className={commonStyle.page}>
            <h1 className={commonStyle.title}>Wishflow Rewards</h1>
            <div className={style.fatedGiftsBtnContainer}>
                <button className={style.fatedGiftsBtn} onClick={() => setShowMyFateGifts(!showMyFateGifts)}>
                    <span>My Wish Rewards</span>
                </button>
            </div>
            <div className={style.dataContainer}>
                <div className={style.scrollableContent}>
                    {data.map((row) => {
                        const isExpanded = expandedId === row.id;
                        const [boostByPointsInfo, boostByStarInfo] = row.pools;
                        const maxRows = Math.max(boostByPointsInfo.wisherList.length, boostByStarInfo.wisherList.length, 0);
                        const showRows = Math.min(maxRows, 3);

                        return (
                            <div
                                key={row.id}
                                className={`${style.row} ${isExpanded ? style.expanded : ''}`}
                                onClick={() => toggleExpand(row.id)}
                            >
                                <div className={`${style.rowHeader} ${isExpanded ? style.expandedColor : ''}`}>
                                    <span >
                                        {isCurrent(row.timeStamp) ? (
                                            <>
                                                <img
                                                    src="/images/Fate/CountDown.webp"
                                                    alt="icon"
                                                    style={{ width: '25px', height: '25px', marginRight: '10px' }}
                                                />
                                                {formatCountdown(countdown)}
                                            </>
                                        ) : (
                                            formatInTimeZone(
                                                new Date(row.timeStamp * 1000),
                                                'Asia/Shanghai',
                                                'MMM d, yyyy'
                                            )
                                        )}
                                    </span>
                                    <span className={row.isBoost ? style.cycleStatus1 : style.cycleStatus}>
                                        {row.isBoost ? "Ended" : "Ongoing"}
                                    </span>
                                    <span className={style.viewAllButton} onClick={() => setSelectedCycle(row.cycle)}>
                                        {isExpanded ? "Cycle Details" : ""}
                                    </span>
                                    <span>
                                        <img src="/images/Fate/Dropdown.webp" alt="" className={`${style.dropdown} ${isExpanded ? style.dropdownSelected : ''}`} />
                                    </span>
                                </div>

                                {isExpanded && (
                                    <div className={style.boxContainer} onClick={(e) => {
                                        e.stopPropagation();
                                    }}>
                                        {[boostByPointsInfo, boostByStarInfo].map((box, i) => {
                                            const index = i + 1
                                            const cycleInfo = getCycleInfo(row.cycle, index);
                                            const participantCount = cycleInfo?.wisherCount ?? 0;
                                            return (
                                                <div key={index} className={index === BOOST_TYLE_STAR ? style.box1 : style.box}>
                                                    <div className={style.boxHeader}>
                                                        <span className={index === BOOST_TYLE_STAR ? style.boxHeaderTitle1 : style.boxHeaderTitle}>{box.title}</span>
                                                    </div>
                                                    <div className={index === BOOST_TYLE_STAR ? style.boxSubtitle1 : style.boxSubtitle}>
                                                        <span>
                                                            Pool: {
                                                                row.isBoost
                                                                    ? formatEther(box.amount)
                                                                    : formatEther((row.totalAmount * BigInt(index === 1 ? 24 : 36)) / 100n)
                                                            } {CURRENCY_SYMBOL}
                                                        </span>
                                                        <span style={{ marginLeft: "2vw" }}>
                                                            {row.isBoost ? `Selected: ${box.selectedCount}` : `Participants: ${participantCount}`}
                                                        </span>
                                                    </div>
                                                    {box.wisherList.slice(0, showRows).map((item: string, i) => (
                                                        <div key={i} className={index === BOOST_TYLE_STAR ? style.dataRow1 : style.dataRow}>
                                                            <span style={{minWidth: "47%"}} className={item == userAddress ? style.dataRowYouColor : ""}>
                                                                {item == userAddress ? shortenAddress(item) + " (YOU)" : shortenAddress(item)}
                                                            </span>
                                                            <span>
                                                                {index == 1 ? Number(formatEther(getWisherCycleRecords(row.cycle, item)?.boostedPointsAmount ?? 0n)).toFixed(6).replace(/\.?0+$/, '') : Number(formatEther(getWisherCycleRecords(row.cycle, item)?.boostedStarAmount ?? 0n)).toFixed(6).replace(/\.?0+$/, '')} {CURRENCY_SYMBOL}
                                                            </span>
                                                        </div>
                                                    ))}
                                                    {box.wisherList.length < showRows &&
                                                        Array(showRows - box.wisherList.length)
                                                            .fill(null)
                                                            .map((_, i) => (
                                                                <div key={i} className={style.dataRow}>&nbsp;</div>
                                                            ))}
                                                </div>
                                            )

                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
                
            </div>
            {showMyFateGifts && <MyFateGifts onClose={() => setShowMyFateGifts(false)} />}
            {selectedCycle && <Selected cycle={selectedCycle} onClose={() => setSelectedCycle(0)} />}
        </div>
    );
}
