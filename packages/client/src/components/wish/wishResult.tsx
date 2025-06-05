import React, { useEffect, useState, useRef } from "react";
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

  const [showLightPointsSwell, setShowLightPointsSwell] =
    useState<boolean>(false);
  const [showBlindBoxPointsSwell, setShowBlindBoxPointsSwell] =
    useState<boolean>(false);

  const [animatedPercentage, setAnimatedPercentage] = useState<number>(0);

  const [displayedTotalPoints, setDisplayedTotalPoints] = useState<number>(0);
  
  const [wishCount, setWishCount] = useState<number>(0);
  const [showModal, setShowModal] = useState(true);

  const percentageInterval1Ref = useRef<number | null>(null);
  const percentageInterval2Ref = useRef<number | null>(null);
  const timeout1Ref = useRef<number | null>(null);
  const timeout2Ref = useRef<number | null>(null);
  const timeout3Ref = useRef<number | null>(null);
  const timeout4Ref = useRef<number | null>(null);

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
      setShowModal(true);
      setShowLightPointsSwell(false);
      setShowBlindBoxPointsSwell(false);
      setAnimatedPercentage(0);
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
    // Initialize total points after base points are set
    setDisplayedTotalPoints(wishInfo.lightPoints + wishInfo.blindBoxPoints);
  }, [wishCountData, userAddress, wishCount]);

  useEffect(() => {
    if (!showModal) return;

    timeout1Ref.current = setTimeout(() => {
      setAnimatedPercentage(0); // Start percentage from 0
      percentageInterval1Ref.current = setInterval(() => {
        setAnimatedPercentage((prev) => {
          const next = prev + 200 / 60; // Animate from 0 to 200 over 3 seconds (60 updates at 50ms interval)
          return next <= 200 ? next : 200; // Cap at 200
        });
      }, 50);

      // Stop animation, set to calculated %, show lightPointsSwell after 3 seconds
      timeout2Ref.current = setTimeout(() => {
        clearInterval(percentageInterval1Ref.current!);

        const lightPointsPercentage = lightPoints > 0 ? Math.round((lightPointsSwell / lightPoints) * 100) : 0;
        
        setAnimatedPercentage(lightPointsPercentage);
        setShowLightPointsSwell(true);
        setDisplayedTotalPoints(prev => prev + lightPointsSwell);

        // Phase 3: Animate percentage for blindBoxPointsSwell
        timeout3Ref.current = setTimeout(() => {
          setAnimatedPercentage(0); // Start percentage from 0 again
          percentageInterval2Ref.current = setInterval(() => {
            setAnimatedPercentage((prev) => {
              const next = prev + 200 / 60; // Animate from 0 to 200 over 3 seconds
              return next <= 200 ? next : 200;
            });
          }, 50);

          // Stop animation, set to calculated %, show blindBoxPointsSwell after 3 seconds
          timeout4Ref.current = setTimeout(() => {
            clearInterval(percentageInterval2Ref.current!);

            const blindBoxPointsPercentage = blindBoxPoints > 0 ? Math.round((blindBoxPointsSwell / blindBoxPoints) * 100) : 0;
            
            setAnimatedPercentage(blindBoxPointsPercentage);
            setShowBlindBoxPointsSwell(true);
            setDisplayedTotalPoints(prev => prev + blindBoxPointsSwell);
          }, 3000); // 3 seconds for the second animation
        }, 1000); // Short delay before starting second animation
      }, 3000); // 3 seconds for the first animation
    }, 9050); // Start after wishPointsContainer CSS animation finishes (7s delay + 2s duration = 9s)

    // Cleanup function
    return () => {
      if (percentageInterval1Ref.current)
        clearInterval(percentageInterval1Ref.current);
      if (percentageInterval2Ref.current)
        clearInterval(percentageInterval2Ref.current);
      if (timeout1Ref.current) clearTimeout(timeout1Ref.current);
      if (timeout2Ref.current) clearTimeout(timeout2Ref.current);
      if (timeout3Ref.current) clearTimeout(timeout3Ref.current);
      if (timeout4Ref.current) clearTimeout(timeout4Ref.current);
    };
  }, [showModal, lightPoints, blindBoxPoints, lightPointsSwell, blindBoxPointsSwell]);

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
                      <img
                        src={incenseData[incenseId - 1].img}
                        alt="light points"
                      />
                    </div>
                    <span className={styles.wishPointsValue}>
                      +{lightPoints}
                      {showLightPointsSwell && ` +${lightPointsSwell}`}
                    </span>
                  </div>
                  <div className={styles.wishPointsColumn}>
                    <img
                      src={propsData[propId].imageUrl}
                      alt="blind box points"
                    />
                    <span className={styles.wishPointsValue}>
                      +{blindBoxPoints}
                      {showBlindBoxPointsSwell && ` +${blindBoxPointsSwell}`}
                    </span>
                  </div>
                  <div className={styles.wishPointsColumn}>
                    <span className={styles.wishPointsLabel}>WP:&nbsp;</span>
                    <span className={styles.wishPointsPercentage}>
                      +{Math.floor(animatedPercentage)}%
                    </span>
                  </div>
                </div>
                <div className={styles.wishPointsBottom}>
                  <span className={styles.wishPointsTotal}>
                    Total:&nbsp;&nbsp;
                    <span className={styles.wishPointsTotalValue}>
                        +{displayedTotalPoints} WP
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
