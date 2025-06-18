import { useEffect, useState, useMemo, useCallback } from 'react';
import styles from './myFateGifts.module.css';
import commonStyles from "../common/common.module.css";
import { useAccount } from 'wagmi';
import { formatEther } from 'viem';
import { components } from "../../mud/recs";
import { getComponentValue } from "@latticexyz/recs";
import { encodeEntity } from '@latticexyz/store-sync/recs';
import { WISH_POOL_ID } from '../../utils/contants';
import { getTimeStampByCycle, getWisherCycleRecords } from '../common';
import { formatInTimeZone } from 'date-fns-tz';
import { apiServer } from '../../common';
import { useConnectModal } from '@rainbow-me/rainbowkit';


interface Props {
  onClose: () => void;
}


interface RewardsData {
  wishTime: number;
  type: string;
  reward: bigint
}


interface ApiRewardsData {
  cycle: number;
  boosted_type: [string, string];
}


const MyFateGifts = ({ onClose }: Props) => {
  const { address: userAddress } = useAccount();
  const [timeSelected, setTimeSelected] = useState(0);
  const [allRewardsData, setAllRewardsData] = useState<RewardsData[]>([]);
  const [totalReceived, setTotalReceived] = useState<bigint>(0n);
  const { openConnectModal } = useConnectModal();
  const [loading, setLoading] = useState(false);
  const Wisher = components.Wisher;

  useEffect(() => {
    if (!userAddress) {
      setAllRewardsData([]);
      if (openConnectModal) {
        openConnectModal();
      }
      onClose();
    }
  }, [userAddress, openConnectModal, onClose]);

  const wisherKey = useMemo(() => {
    if (!userAddress) return undefined;

    return encodeEntity(Wisher.metadata.keySchema, {
      poolId: WISH_POOL_ID,
      wisher: userAddress,
    });
  }, [userAddress, Wisher]);

  const loadWishRewards = useCallback(async () => {
    if (!userAddress) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        address: userAddress
      });

      const res = await fetch(apiServer + `/api/cyberwish/get_selection_history_by_wisher?${params}`);

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const jsonRes = await res.json();
      if (!jsonRes.success) {
        throw new Error(jsonRes.error || 'API request failed');
      }

      const rewardsData: RewardsData[] = jsonRes.data.flatMap((data: ApiRewardsData) => {
        const wishTime = getTimeStampByCycle(data.cycle);
        const wisherCycleRecords = getWisherCycleRecords(data.cycle, userAddress);

        return data.boosted_type.map((boostedType) => {
          const isPointsType = boostedType === "boosted_wisher_by_points";

          return {
            wishTime,
            type: isPointsType ? "Wish Points Fund" : "Fated Wish Fund",
            reward: isPointsType
              ? wisherCycleRecords?.boostedPointsAmount ?? 0n
              : wisherCycleRecords?.boostedStarAmount ?? 0n,
          };
        });
      });

      setAllRewardsData(rewardsData);
    } catch (err) {
      console.error('Failed to load wish rewards:', err);
    } finally {
      setLoading(false);
    }
  }, [userAddress]);

  useEffect(() => {
    loadWishRewards();
  }, [loadWishRewards]);

  const wisherData = useMemo(() => {
    if (!wisherKey) return null;
    return getComponentValue(Wisher, wisherKey);
  }, [Wisher, wisherKey]);

  useEffect(() => {
    if (wisherData) {
      setTimeSelected(Number(wisherData.timePointsSelected + wisherData.timeStarSelected));
      setTotalReceived(wisherData.boostedPointsAmount + wisherData.boostedStarAmount);
    } else {
      setTimeSelected(0);
      setTotalReceived(0n);
    }
  }, [wisherData]);


  return (
    <>
      {userAddress && <div className={styles.overlay}>
        <div className={styles.modal}>
          <div className={styles.header}>
            <h2>My Wish Rewards</h2>
          </div>
          <div className={commonStyles.divider} />
          <div className={styles.body}>
            <div className={styles.totalInfo}>
              <div className={styles.totalInfoItem}>
                <div className={styles.totalInfoNumber}>{timeSelected}</div>
                <div className={styles.totalInfoNumberType}>Times Selected</div>
              </div>
              <div className={styles.totalInfoItem}>
                <div className={styles.totalInfoNumber}>{Number(formatEther(totalReceived)).toFixed(6).replace(/\.?0+$/, '')}
                  <span>
                    &nbsp;ETH
                  </span>
                </div>
                <div className={styles.totalInfoNumberType}>Total Received</div>
              </div>
            </div>
            <p className={styles.pTitle}>MY SELECTION HISTORY :</p>
            <div className={styles.tableWrapper}>
              <div className={styles.tableHeader}>
                <div className={styles.cell}>Time</div>
                <div className={styles.cell}>Type</div>
                <div className={styles.cell}>Received</div>
                <div className={styles.scrollbarSpacer} />
              </div>
              <div className={styles.scrollContainer}>
                <div className={styles.tableBodyWrapper}>
                  <div className={styles.tableBody}>
                    {allRewardsData.map((data, i) => (
                      <div key={i} className={styles.row}>
                        <div className={styles.cell}>
                          {
                            formatInTimeZone(
                              new Date(data.wishTime * 1000),
                              'Asia/Shanghai',
                              'yyyy.MM.dd'
                            )
                          }
                        </div>
                        <div className={styles.cell}>{data.type}</div>
                        <div className={styles.cell}>{formatEther(data.reward)} ETH</div>
                      </div>
                    ))}
                  </div>
                  {loading && (
                    <div className={commonStyles.loading}>
                      <img src="/images/wishWall/Loading.webp" alt="Loading..." />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <button className={styles.closeButton} onClick={() => onClose()}>
            <img src="/images/wish/WishPanel/Close.webp" alt="Close" />
          </button>
        </div>
      </div>}
    </>
  );
};

export default MyFateGifts;
