import React, { useEffect, useState } from 'react';
import styles from './selected.module.css';
import { shortenAddress } from '../../utils/common';
import { useAccount } from 'wagmi';
import { getBoostWisherRecords, getWisherCycleRecords } from '../common';
import { formatEther } from 'viem';

interface Props {
  cycle: number,
  onClose: () => void;
}

interface WisherData {
  wisher: string;
  rewards: number;
}


const Selected = ({ cycle, onClose }: Props) => {

  const [data, setData] = useState<WisherData[]>([]);
  const { address: userAddress } = useAccount();
  const [selectedCount, setSelectedCount] = useState(0);

  useEffect(() => {
    if (!cycle) {
      return
    }
    const boostWisherRecords = getBoostWisherRecords(cycle);
    if (!boostWisherRecords) {
      return;
    }
    const tempData: WisherData[] = [];
    setSelectedCount(boostWisherRecords.boostedWisherByPoints.length);
    for (let index = 0; index < boostWisherRecords.boostedWisherByPoints.length; index++) {
      const wisher = boostWisherRecords.boostedWisherByPoints[index];
      const boostedAmountData = getWisherCycleRecords(cycle, wisher);
      if (!boostedAmountData) {
        continue;
      }
      tempData.push({
        wisher,
        rewards: Number(formatEther(boostedAmountData.boostedPointsAmount))
      });
    }
    setData(tempData);
  }, [cycle])

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>Selected ({selectedCount})</h2>
        </div>
        <div className={styles.divider} />

        <div className={styles.tableWrapper}>
          <div className={styles.tableHeader}>
            <div className={styles.cell} style={{ border: "1px solid rgba(255, 209, 98, 1)", borderRight: "none" }}>User</div>
            <div className={styles.cell} style={{ border: "1px solid rgba(255, 209, 98, 1)" }}>Rewards</div>
            <div className={styles.scrollbarSpacer} />
          </div>
          <div className={styles.scrollContainer}>
            <div className={styles.tableBodyWrapper}>
              <div className={styles.tableBody}>
                {data.map((row, idx) => (
                  <div key={idx} className={styles.row}>
                    <div className={styles.cell}>
                      {shortenAddress(row.wisher)}
                      {userAddress == (row.wisher) ? <span style={{ color: "rgba(244, 200, 116, 1)" }}> (you)</span> : ""}
                    </div>
                    <div className={styles.cell}>{row.rewards} ETH</div>
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
