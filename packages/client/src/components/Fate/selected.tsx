import React, { useEffect, useState } from 'react';
import styles from './selected.module.css';
import { shortenAddress } from '../../utils/common';
import { useAccount } from 'wagmi';
import { getBoostWisherRecords, getWisherCycleRecords } from '../common';
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
    if (!boostWisherRecords) {
      return;
    }
    const tempData: WisherData[] = [];
    for (let index = 0; index < boostWisherRecords.boostedWisherByPoints.length; index++) {
      const wisher = boostWisherRecords.boostedWisherByPoints[index];
      const boostedAmountData = getWisherCycleRecords(cycle, wisher);
      if (!boostedAmountData) {
        continue;
      }
      tempData.push({
        wisher,
        wp: Number(boostedAmountData.points),
        wp_pool_rewards: Number(formatEther(boostedAmountData.boostedPointsAmount)),
        fated_pool_qualified: false,
        fated_pool_rewards: Number(formatEther(0)),
      });
    }
    setData(tempData.sort((a, b) => {
      if (b.wp_pool_rewards !== a.wp_pool_rewards) {
        return b.wp_pool_rewards - a.wp_pool_rewards;
      }
      if (b.wp !== a.wp) {
        return b.wp - a.wp;
      }
      return b.fated_pool_rewards - a.fated_pool_rewards;
    }));
  }, [cycle])

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>Cycle Details</h2>
        </div>
        <div className={styles.divider} />

        <div className={styles.tableWrapper}>
          <div className={styles.tableHeader}>
            <div className={`${styles.cell} ${styles.colNum}`}>Num</div>
            <div className={`${styles.cell} ${styles.colAddress}`}>Address</div>
            <div className={`${styles.cell} ${styles.colWishPoints}`}>Wish Points</div>
            <div className={`${styles.cell} ${styles.colWishPointsPool}`}>Wish Points Pool {CURRENCY_SYMBOL}</div>
            <div className={`${styles.cell} ${styles.colFatedPoolQualified}`}>Fated Pool Qualified</div>
            <div className={`${styles.cell} ${styles.colFatedPool}`}>Fated Pool {CURRENCY_SYMBOL}</div>
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
                    <div className={`${styles.cell} ${styles.colFatedPoolQualified}`}>{row.wp_pool_rewards ? 'Yes' : 'No'}</div>
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
