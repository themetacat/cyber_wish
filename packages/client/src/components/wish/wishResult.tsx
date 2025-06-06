import React, { useEffect, useState, useRef } from "react";
import styles from "./wishResult.module.css";
import { useComponentValue } from "@latticexyz/react";
import { components } from "../../mud/recs";
import { getComponentValue } from "@latticexyz/recs";
import { encodeEntity, singletonEntity } from "@latticexyz/store-sync/recs";
import { WISH_POOL_ID } from "../../utils/contants";
import { pad } from "viem";
import { useAccount } from "wagmi";
import { propsData } from "../../utils/propsData";
import { incenseData } from "../../utils/incenseData";
import { blindBoxData } from "../../utils/blindBoxData";

interface WishInfo {
  wisher: string;
  wishContent: string;
  wishTime: number;
  incenseId: number;
  blindBoxId: number;
  propId: number;
  lightPoints: number;
  blindBoxPoints: number;
  lightPointsSwell: number;
  blindBoxPointsSwell: number;
  isStar: boolean;
}

export type Props = {
  wishStatus: boolean;
};

export default function WishesResult({ wishStatus }: Props) {
  const { address: userAddress } = useAccount();
  const Wishes = components.Wishes;
  const [incenseId, setIncenseId] = useState<number>(0);
  const [blindBoxId, setBlindBoxId] = useState<number>(0);
  const [propId, setPropId] = useState<number>(0);
  const [lightPoints, setLightPoints] = useState<number>(0);
  const [lightPointsSwell, setLightPointsSwell] = useState<number>(0);
  const [blindBoxPoints, setBlindBoxPoints] = useState<number>(0);
  const [blindBoxPointsSwell, setBlindBoxPointsSwell] = useState<number>(0);
  const [isStar, setIsStar] = useState<boolean>(false);

  const [showLightPointsSwell, setShowLightPointsSwell] =
    useState<boolean>(false);
  const [showBlindBoxPointsSwell, setShowBlindBoxPointsSwell] =
    useState<boolean>(false);
  const [showBlindBoxPoints, setShowBlindBoxPoints] = useState<boolean>(false);

  const [animatedPercentage, setAnimatedPercentage] = useState<number>(0);
  const [animateLightPoints, setAnimateLightPoints] = useState<boolean>(false);
  const [animateBlindBoxPoints, setAnimateBlindBoxPoints] =
    useState<boolean>(false);

  const [displayedTotalPoints, setDisplayedTotalPoints] = useState<number>(0);

  const [wishCount, setWishCount] = useState<number>(0);
  const [showModal, setShowModal] = useState(true);

  const percentageInterval1Ref = useRef<number | null>(null);
  const percentageInterval2Ref = useRef<number | null>(null);
  const timeout1Ref = useRef<number | null>(null);
  const timeout2Ref = useRef<number | null>(null);
  const timeout3Ref = useRef<number | null>(null);
  const timeout4Ref = useRef<number | null>(null);

  const openBlindBoxAudioRef = useRef<HTMLAudioElement | null>(null);
  const hasPlayedOpenBlindBoxAudio = useRef<boolean>(false);
  const receiveWPAudioRef = useRef<HTMLAudioElement | null>(null);
  const wishSentAudioRef = useRef<HTMLAudioElement | null>(null);

  const fetchOneWish = (wishIndex: number): WishInfo | undefined => {
    const id = pad(`0x${wishIndex.toString(16)}`, { size: 32 });
    const key = encodeEntity(Wishes.metadata.keySchema, {
      poolId: WISH_POOL_ID,
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
      blindBoxId: Number(wishData.blindBoxId),
      propId: Number(wishData.propId),
      lightPoints: Number(wishData.pointsIncense),
      lightPointsSwell: Number(wishData.pointsIncenseEasterEgg || 0),
      blindBoxPoints: Number(wishData.pointsBlindBox),
      blindBoxPointsSwell: Number(wishData.pointsBlindBoxEasterEgg || 0),
      isStar: Boolean(wishData.isStar),
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
      setShowBlindBoxPoints(false);
      setAnimatedPercentage(0);
      hasPlayedOpenBlindBoxAudio.current = false;

      // Play audio when blindBoxPropContainer appears
      if (openBlindBoxAudioRef.current && !hasPlayedOpenBlindBoxAudio.current) {
        const openBlindBoxTimer = setTimeout(() => {
          openBlindBoxAudioRef.current?.play();
          hasPlayedOpenBlindBoxAudio.current = true;
        }, 8000); // 8s is when blindBoxPropContainer appears (5s + 3s)

        return () => {
          clearTimeout(openBlindBoxTimer);
          if (openBlindBoxAudioRef.current) {
            openBlindBoxAudioRef.current.pause();
            openBlindBoxAudioRef.current.currentTime = 0;
          }
        };
      }
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
    setBlindBoxId(wishInfo.blindBoxId);
    setPropId(wishInfo.propId);
    setLightPoints(wishInfo.lightPoints);
    setLightPointsSwell(wishInfo.lightPointsSwell);
    setBlindBoxPoints(wishInfo.blindBoxPoints);
    setBlindBoxPointsSwell(wishInfo.blindBoxPointsSwell);
    setIsStar(wishInfo.isStar);
    setWishCount((prev) => prev - 1);
    // Initialize total points after base points are set
    setDisplayedTotalPoints(wishInfo.lightPoints);
  }, [wishCountData, userAddress, wishCount]);

  useEffect(() => {
    // Create audio elements
    openBlindBoxAudioRef.current = new Audio("/audio/openBlindBox.mp3");
    receiveWPAudioRef.current = new Audio("/audio/receiveWP.mp3");
    wishSentAudioRef.current = new Audio("/audio/wishSent.mp3");
    hasPlayedOpenBlindBoxAudio.current = false;
  }, []);

  useEffect(() => {
    if (!showModal) return;

    // Play wishSent sound when animation starts
    if (wishSentAudioRef.current) {
      wishSentAudioRef.current.currentTime = 0;
      wishSentAudioRef.current.play();
    }

    timeout1Ref.current = setTimeout(() => {
      setAnimatedPercentage(0); // Start percentage from 0
      percentageInterval1Ref.current = setInterval(() => {
        setAnimatedPercentage((prev) => {
          // Generate a random change (e.g., between -15 and 15)
          const randomChange = Math.random() * 30 - 15;
          const next = prev + randomChange;

          // Keep the value within a reasonable range during animation (e.g., 0 to 250)
          const boundedNext = Math.max(0, Math.min(250, next));

          return boundedNext;
        });
      }, 100);

      // Stop animation, set to calculated %, show lightPointsSwell after 3 seconds
      timeout2Ref.current = setTimeout(() => {
        clearInterval(percentageInterval1Ref.current!);

        const lightPointsPercentage =
          lightPoints > 0
            ? Math.round((lightPointsSwell / lightPoints) * 100)
            : 0;

        setAnimatedPercentage(lightPointsPercentage);
        setShowLightPointsSwell(true);
        setDisplayedTotalPoints(lightPoints + lightPointsSwell);

        // Trigger light points animation
        setAnimateLightPoints(false);
        setTimeout(() => {
          setAnimateLightPoints(true);
          // Reset animation state after animation completes
          setTimeout(() => {
            setAnimateLightPoints(false);
          }, 1000);
        }, 50);

        // Play receiveWP sound when first animation stops
        if (wishStatus && receiveWPAudioRef.current) {
          receiveWPAudioRef.current.currentTime = 0;
          receiveWPAudioRef.current.play();
        }

        // Phase 3: Show blindBoxPoints and start its animation
        timeout3Ref.current = setTimeout(() => {
          setShowBlindBoxPoints(true);
          setDisplayedTotalPoints(lightPoints + lightPointsSwell + blindBoxPoints);
          setAnimatedPercentage(0); // Start percentage from 0 again
          percentageInterval2Ref.current = setInterval(() => {
            setAnimatedPercentage((prev) => {
              // Generate a random change (e.g., between -15 and 15)
              const randomChange = Math.random() * 30 - 15;
              const next = prev + randomChange;

              // Keep the value within a reasonable range during animation (e.g., 0 to 250)
              const boundedNext = Math.max(0, Math.min(250, next));

              return boundedNext;
            });
          }, 100);

          // Stop animation, set to calculated %, show blindBoxPointsSwell after 3 seconds
          timeout4Ref.current = setTimeout(() => {
            clearInterval(percentageInterval2Ref.current!);

            const blindBoxPointsPercentage =
              blindBoxPoints > 0
                ? Math.round((blindBoxPointsSwell / blindBoxPoints) * 100)
                : 0;

            setAnimatedPercentage(blindBoxPointsPercentage);
            setShowBlindBoxPointsSwell(true);
            setDisplayedTotalPoints(lightPoints + lightPointsSwell + blindBoxPoints + blindBoxPointsSwell);

            // Trigger blind box points animation
            setAnimateBlindBoxPoints(false);
            setTimeout(() => {
              setAnimateBlindBoxPoints(true);
              // Reset animation state after animation completes
              setTimeout(() => {
                setAnimateBlindBoxPoints(false);
              }, 1000);
            }, 50);

            // Play receiveWP sound when second animation stops
            if (wishStatus && receiveWPAudioRef.current) {
              receiveWPAudioRef.current.currentTime = 0;
              receiveWPAudioRef.current.play();
            }
          }, 3000); // 3 seconds for the second animation
        }, 2000); // 2 seconds delay before showing blind box points
      }, 3000); // 3 seconds for the first animation
    }, 15550); // Start after wishPointsContainer CSS animation finishes (13.5s delay + 2s additional delay)

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
      if (receiveWPAudioRef.current) {
        receiveWPAudioRef.current.pause();
        receiveWPAudioRef.current.currentTime = 0;
      }
    };
  }, [
    showModal,
    lightPoints,
    blindBoxPoints,
    lightPointsSwell,
    blindBoxPointsSwell,
  ]);

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
              <div className={styles.blindBoxContainer}>
                <img
                  className={styles.blindBoxImg}
                  src={blindBoxData[blindBoxId - 1].img}
                />
              </div>
            )}

            {propsData[propId] && (
              <div className={styles.blindBoxPropContainer}>
                <img src={propsData[propId].imageUrl} />
                <span className={styles.blindBoxPropImgName}>
                  {propsData[propId].name}
                </span>
                <span className={styles.blindBoxPropImgDesc}>
                  {propsData[propId].desc}
                </span>
              </div>
            )}

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
                      <span
                        className={`${styles.wishPointsSwellValue} ${animateLightPoints ? styles.animate : ""}`}
                      >
                        {showLightPointsSwell && ` +${lightPointsSwell}`}
                      </span>
                    </span>
                  </div>
                  <div className={styles.wishPointsColumn}>
                    {showBlindBoxPoints && (
                      <img
                        src={propsData[propId].imageUrl}
                        alt="blind box points"
                      />
                    )}
                    <span className={styles.wishPointsValue}>
                      {showBlindBoxPoints && `+${blindBoxPoints}`}
                      <span
                        className={`${styles.wishPointsSwellValue} ${animateBlindBoxPoints ? styles.animate : ""}`}
                      >
                        {showBlindBoxPointsSwell && ` +${blindBoxPointsSwell}`}
                      </span>
                    </span>
                  </div>
                  <div className={styles.wishPointsColumn}>
                    <span>WP:&nbsp;</span>
                    <span>+{Math.floor(animatedPercentage)}%</span>
                  </div>
                </div>
                <div className={styles.wishPointsBottom}>
                  <span className={styles.wishPointsTotal}>
                    Total:&nbsp;&nbsp;
                    <span
                      className={`${styles.wishPointsTotalValue} ${animateLightPoints || animateBlindBoxPoints ? styles.animate : ""}`}
                    >
                      +{displayedTotalPoints} WP
                    </span>
                  </span>
                </div>
              </div>
            )}
            <span className={styles.congratulationText}>
              <div className={styles.congratulationContainer}>
                <span>Fated Wish Fund:</span>
                <img 
                  src={isStar ? "/images/wish/WishResult/Qualified.webp" : "/images/wish/WishResult/Missed.webp"} 
                  alt={isStar ? "Qualified" : "Missed"}
                  className={styles.congratulationImage}
                />
              </div>
            </span>
          </div>
        </div>
      )}
    </>
  );
}
