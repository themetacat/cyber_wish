import React, { useEffect, useState } from "react";
import styles from "./wishResult.module.css";
import { useComponentValue } from "@latticexyz/react";
import { components } from "../../mud/recs";
import { getComponentValue } from "@latticexyz/recs";
import { encodeEntity, singletonEntity } from "@latticexyz/store-sync/recs";
import { wishPool } from "../../utils/contants";
import { pad } from "viem";
import { useAccount } from "wagmi";
import { propsData } from "../../utils/propsData";
import { incenseData } from "../../utils/incenseData";

interface WishInfo {
  wisher: string;
  wishContent: string;
  wishTime: number;
  incenseId: number;
  propId: number;
  lightPoints: number;
  blindBoxPoints: number;
  lightPointsSwell: number;
  blindBoxPointsSwell: number;
}

export type Props = {
  wishStatus: boolean;
};

export default function WishesResult({ wishStatus }: Props) {
  const { address: userAddress } = useAccount();
  const Wishes = components.Wishes;
  const [incenseId, setIncenseId] = useState<number>(0);
  const [propId, setPropId] = useState<number>(0);
  const [lightPoints, setLightPoints] = useState<number>(0);
  const [lightPointsSwell, setLightPointsSwell] = useState<number>(0);
  const [blindBoxPoints, setBlindBoxPoints] = useState<number>(0);
  const [blindBoxPointsSwell, setBlindBoxPointsSwell] = useState<number>(0);
  const [wishCount, setWishCount] = useState<number>(0);
  const [showModal, setShowModal] = useState(true);

  const fetchOneWish = (wishIndex: number): WishInfo | undefined => {
    const id = pad(`0x${wishIndex.toString(16)}`, { size: 32 });
    const key = encodeEntity(Wishes.metadata.keySchema, {
      poolId: wishPool,
      id: id,
    });
    const wishData = getComponentValue(Wishes, key);

    if (!wishData) {
      return;
    }
    const wishInfo: WishInfo = {
      wisher: wishData.wisher as string,
      wishContent: wishData.wishContent as string,
      wishTime: Number(wishData.wishTime),
      incenseId: Number(wishData.incenseId),
      propId: Number(wishData.propId),
      lightPoints: Number(wishData.pointsIncense),
      lightPointsSwell: Number(wishData.pointsIncenseSwell || 0),
      blindBoxPoints: Number(wishData.pointsBlindBox),
      blindBoxPointsSwell: Number(wishData.pointsBlindBoxSwell || 0),
    };
    return wishInfo;
  };

  useEffect(() => {
    if (wishStatus) {
      console.log("+1 wish count");
      setWishCount((prev) => prev + 1);
    }
  }, [wishStatus]);

  const wishCountData = useComponentValue(
    components.WishCount,
    singletonEntity
  );

  useEffect(() => {
    if (wishCount == 0) {
      return;
    }

    if (!wishCountData || (wishCountData as { count: bigint }).count <= 0n) {
      return;
    }
    const totalWishCount = Number((wishCountData as { count: bigint }).count);
    const wishInfo = fetchOneWish(totalWishCount);
    if (!wishInfo) {
      return;
    }
    if (wishInfo.wisher !== userAddress) {
      return;
    }
    console.log(wishInfo);
    setIncenseId(wishInfo.incenseId);
    setPropId(wishInfo.propId);
    setLightPoints(wishInfo.lightPoints);
    setLightPointsSwell(wishInfo.lightPointsSwell);
    setBlindBoxPoints(wishInfo.blindBoxPoints);
    setBlindBoxPointsSwell(wishInfo.blindBoxPointsSwell);
    setWishCount((prev) => prev - 1);
  }, [wishCountData, userAddress, wishCount]);

  return (
    <>
      {wishStatus && showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <span className={styles.title}>✨WISH SENT!✨</span>
            <button
              className={styles.closeButton}
              onClick={() => setShowModal(false)}
            >
              <img src="/images/wish/WishPanel/Close.webp" alt="Close" />
            </button>
            <span className={styles.subtitle}>
              Good fortune follows you......
            </span>

            <span className={styles.dividingLine}>
              <img
                src="/images/wish/WishPanel/DividingLine.webp"
                alt="dividing line"
              />
            </span>

            <span className={styles.blessingItemTitle}>
              Your blessing item is:
            </span>
            {propsData[propId] && (
              <div className={styles.blessingItemContainer}>
                <img src={propsData[propId].imageUrl} alt="blessing item img" />
                <span className={styles.blessingItemContentContainer}>
                  <span className={styles.blessingItemName}>
                    {propsData[propId].name}
                  </span>
                  <span className={styles.blessingItemDesc}>
                    {propsData[propId].desc}
                  </span>
                </span>
              </div>
            )}

            <span className={styles.wishPointsTitle}>Wish Points(WP)</span>
            {propsData[propId] && (
              <div className={styles.wishPointsContainer}>
                <div className={styles.wishPointsTop}>
                  <div className={styles.wishPointsColumn}>
                    <div className={styles.imageBorderWrapper}>
                      <img src={incenseData[incenseId - 1].img} alt="light points" />
                    </div>
                    <span className={styles.wishPointsValue}>+{lightPoints} +{lightPointsSwell}</span>
                  </div>
                  <div className={styles.wishPointsColumn}>
                    <img src={propsData[propId].imageUrl} alt="blind box points" />
                    <span className={styles.wishPointsValue}>+{blindBoxPoints} +{blindBoxPointsSwell}</span>
                  </div>
                  <div className={styles.wishPointsColumn}>
                    <span className={styles.wishPointsLabel}>WP:&nbsp;</span>
                    <span className={styles.wishPointsPercentage}>+50%</span>
                  </div>
                </div>
                <div className={styles.wishPointsBottom}>
                  <span className={styles.wishPointsTotal}>
                    Total:&nbsp;&nbsp;
                    <span className={styles.wishPointsTotalValue}>
                        +100 WP
                    </span>
                </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
