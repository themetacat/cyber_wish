import { useEffect, useState, useMemo } from 'react';
import styles from './myFateGifts.module.css';
import { useAccount } from 'wagmi';
import { formatEther } from 'viem';
import { components } from "../../mud/recs";
import { getComponentValue } from "@latticexyz/recs";
import { encodeEntity } from '@latticexyz/store-sync/recs';
import { WISH_POOL_ID } from '../../utils/contants';
import { useAccountModal } from '@latticexyz/entrykit/internal';

interface Props {
  onClose: () => void;
}

const MyFateGifts = ({ onClose }: Props) => {
  const { address: userAddress } = useAccount();
  const [timeSelected, setTimeSelected] = useState(0);
  const [totalReceived, setTotalReceived] = useState<bigint>(0n);
  const { openAccountModal } = useAccountModal();
  const Wisher = components.Wisher;

  const wisherKey = useMemo(() => {
    
    if (!userAddress) {
      openAccountModal()
      onClose();
    } else {
      return encodeEntity(Wisher.metadata.keySchema, {
        poolId: WISH_POOL_ID,
        wisher: userAddress,
      });
    }

  }, [userAddress, Wisher, openAccountModal]);

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
          <div className={styles.divider} />
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
                    {/* {[...Array(20)].map((_, i) => (
                      <div key={i} className={styles.row}>

                        <div className={styles.cell}>
                          2025-06-05
                        </div>
                        <div className={styles.cell}>Type {i + 1}</div>
                        <div className={styles.cell}>0.003 ETH</div>
                      </div>
                    ))} */}
                  </div>
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
