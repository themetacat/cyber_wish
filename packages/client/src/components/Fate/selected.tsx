import React, { useEffect, useState } from 'react';
import styles from './selected.module.css';
import { shortenAddress } from '../../utils/common';
import { useAccount } from 'wagmi';
import { getBoostWisherRecords, getCycleInfo, getWisherByIndex, getWisherCycleRecords } from '../common';
import { formatEther } from 'viem';
import { CURRENCY_SYMBOL } from "../../utils/contants"
import { apiServer } from '../../common';

interface Props {
  cycle: number,
  onClose: () => void;
}

interface WisherData {
  wisher: string;
  wp: number;
  wp_pool_rewards: number;
  fated_pool_qualified: boolean;
  fated_pool_rewards: number;
}


interface ApiWisherCycleRecordData {
  wisher: string;
  points: number;
  boosted_points_amount: bigint;
  boosted_star_amount: bigint;
}


const Selected = ({ cycle, onClose }: Props) => {
  const [data, setData] = useState<WisherData[]>([]);
  const { address: userAddress } = useAccount();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!cycle) {
      return
    }
    wisherCycleRecordFromApi();
  }, [cycle])

  const wisherCycleRecordFromApi = async () => {
    setLoading(true);

    const boostWisherRecords = getBoostWisherRecords(cycle);
    if (!boostWisherRecords) return;

    const wisherStarArr: string[] =
      boostWisherRecords.boostedWisherByStar.length === 0
        ? getStarWisherArr()
        : [];
    try {

      const params = new URLSearchParams({
        cycle: cycle.toString()
      });

      const res = await fetch(apiServer + `/api/cyberwish/get_wisher_cycle_record?${params}`);

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const jsonRes = await res.json();
      if (!jsonRes.success) {
        throw new Error(jsonRes.error || 'API request failed');
      }

      const tempData = jsonRes.data.map((data: ApiWisherCycleRecordData) => ({
        wisher: data.wisher,
        wp: data.points,
        wp_pool_rewards: Number(formatEther(data.boosted_points_amount)),
        fated_pool_qualified: includesAddressIgnoreCase(boostWisherRecords.boostedWisherByStar, data.wisher) || wisherStarArr.includes(data.wisher),
        fated_pool_rewards: Number(formatEther(data.boosted_star_amount)),
      }));
      setData(tempData.sort(sortWisherData));
    } catch (error) {
      console.error('Failed to load wisher cycle record data:', error);
    } finally {
      setLoading(false);
    }
  }

  const sortWisherData = (a: WisherData, b: WisherData): number => {
    if (b.fated_pool_rewards !== a.fated_pool_rewards) {
      return b.fated_pool_rewards - a.fated_pool_rewards;
    }
    if (b.wp_pool_rewards !== a.wp_pool_rewards) {
      return b.wp_pool_rewards - a.wp_pool_rewards;
    }
    if (b.fated_pool_qualified !== a.fated_pool_qualified) {
      return Number(b.fated_pool_qualified) - Number(a.fated_pool_qualified);
    }
    return b.wp - a.wp;
  };

  function includesAddressIgnoreCase(list: string[], target: string): boolean {
    return list.some(addr => addr.toLowerCase() === target.toLowerCase());
  }

  const getStarWisherArr = (): string[] => {
    const cycleInfo = getCycleInfo(cycle, 2);
    if (!cycleInfo || (Number(cycleInfo.wisherCount) === 0 && cycleInfo.isboost)) {
      return [];
    }

    const indexId = Number(cycleInfo.wisherIndexId);
    const res: string[] = [];

    for (let index = 1; index <= cycleInfo.wisherCount; index++) {
      const wisherInfo = getWisherByIndex(2, indexId, index);
      if (wisherInfo) {
        res.push(wisherInfo.wisher.toLowerCase());
      }
    }

    return res;
  };


  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>Cycle Details</h2>
        </div>
        <div className={styles.divider} />

        <div className={styles.tableWrapper}>
          <div className={styles.tableHeader}>
            <div className={`${styles.colNum}`}>Num</div>
            <div className={`${styles.colAddress}`}>Address</div>
            <div className={`${styles.colWishPoints}`}>Wish Points</div>
            <div className={`${styles.colWishPointsPool}`}>Wish Points Pool {CURRENCY_SYMBOL}</div>
            <div className={`${styles.colFatedPoolQualified}`}>Fated Pool Qualified</div>
            <div className={`${styles.colFatedPool}`} style={{ borderRight: "1px solid rgba(255, 209, 98, 1)" }}>Fated Pool {CURRENCY_SYMBOL}</div>
          </div>
          <div className={styles.scrollContainer}>
            <div className={styles.tableBodyWrapper}>
              <div className={styles.tableBody}>
                {data.map((row, idx) => (
                  <div key={idx} className={styles.row}>
                    <div className={`${styles.cell} ${styles.colNum}`}>{idx + 1}</div>
                    <div className={`${styles.cell} ${styles.colAddress}`}>
                      {shortenAddress(row.wisher)}
                      {userAddress?.toLowerCase() == (row.wisher) ? <span style={{ color: "rgba(244, 200, 116, 1)" }}> (you)</span> : ""}
                    </div>
                    <div className={`${styles.cell} ${styles.colWishPoints}`}>{row.wp} WP</div>
                    <div className={`${styles.cell} ${styles.colWishPointsPool}`}>{row.wp_pool_rewards} {CURRENCY_SYMBOL}</div>
                    <div className={`${styles.cell} ${styles.colFatedPoolQualified}`}>{row.fated_pool_qualified ? 'Yes' : 'No'}</div>
                    <div className={`${styles.cell} ${styles.colFatedPool}`}>{row.fated_pool_rewards} {CURRENCY_SYMBOL}</div>
                  </div>
                ))}
              </div>
              {loading && (
                <div className={styles.loading}>
                  <img src="/images/wishWall/Loading.webp" alt="Loading..." />
                </div>
              )}
            </div>
          </div>
        </div>

        <button className={styles.closeButton} onClick={() => onClose()}>
          <img src="/images/wish/WishPanel/Close.webp" alt="Close" />
        </button>
      </div>
    </div>
  );
};

export default Selected;
