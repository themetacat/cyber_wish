import React, { useEffect, useState } from 'react';
import styles from './selected.module.css';
import { shortenAddress } from '../../utils/common';
import { useAccount } from 'wagmi';
import { getBoostWisherRecords, getCycleInfo, getWisherByIndex, getWisherCycleRecords } from '../common';
import { formatEther } from 'viem';
import { CURRENCY_SYMBOL } from "../../utils/contants"

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

const Selected = ({ cycle, onClose }: Props) => {

  const [data, setData] = useState<WisherData[]>([]);
  const { address: userAddress } = useAccount();

  useEffect(() => {
    if (!cycle) {
      return
    }
    const boostWisherRecords = getBoostWisherRecords(cycle);
    if (!boostWisherRecords) return;

    const cycleInfo = getCycleInfo(cycle, 1);
    if (!cycleInfo) return;
    console.log(cycleInfo);
    

    const wisherStarArr: string[] =
      boostWisherRecords.boostedWisherByStar.length === 0
        ? getStarWisherArr()
        : [];

    const tempData: WisherData[] = [];
    const indexId = Number(cycleInfo.wisherIndexId);
    for (let index = 1; index <= cycleInfo.wisherCount; index++) {
      const wisherInfo = getWisherByIndex(1, indexId, index);

      if (!wisherInfo) {
        continue;
      }
      const wisher = wisherInfo.wisher;
      const wisherCycleRecord = getWisherCycleRecords(cycle, wisher);
      if (!wisherCycleRecord) {
        continue;
      }
      tempData.push({
        wisher: wisher,
        wp: Number(wisherCycleRecord.points),
        wp_pool_rewards: Number(formatEther(wisherCycleRecord.boostedPointsAmount)),
        fated_pool_qualified: boostWisherRecords.boostedWisherByStar.includes(wisher) || wisherStarArr.includes(wisher),
        fated_pool_rewards: Number(formatEther(wisherCycleRecord.boostedStarAmount)),
      });
    }

    setData(tempData.sort(sortWisherData));
  }, [cycle])

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
        res.push(wisherInfo.wisher);
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
            <div className={`${styles.colFatedPool}`} style={{borderRight: "1px solid rgba(255, 209, 98, 1)"}}>Fated Pool {CURRENCY_SYMBOL}</div>
          </div>
          <div className={styles.scrollContainer}>
            <div className={styles.tableBodyWrapper}>
              <div className={styles.tableBody}>
                {data.map((row, idx) => (
                  <div key={idx} className={styles.row}>
                    <div className={`${styles.cell} ${styles.colNum}`}>{idx + 1}</div>
                    <div className={`${styles.cell} ${styles.colAddress}`}>
                      {shortenAddress(row.wisher)}
                      {userAddress == (row.wisher) ? <span style={{ color: "rgba(244, 200, 116, 1)" }}> (you)</span> : ""}
                    </div>
                    <div className={`${styles.cell} ${styles.colWishPoints}`}>{row.wp} WP</div>
                    <div className={`${styles.cell} ${styles.colWishPointsPool}`}>{row.wp_pool_rewards} {CURRENCY_SYMBOL}</div>
                    <div className={`${styles.cell} ${styles.colFatedPoolQualified}`}>{row.fated_pool_qualified ? 'Yes' : 'No'}</div>
                    <div className={`${styles.cell} ${styles.colFatedPool}`}>{row.fated_pool_rewards} {CURRENCY_SYMBOL}</div>
                  </div>
                ))}
              </div>
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
