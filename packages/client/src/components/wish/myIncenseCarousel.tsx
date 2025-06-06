import React, { useState, useEffect } from "react";
import styles from "./myIncenseCarousel.module.css";
import { incenseData } from "../../utils/incenseData";

interface IncenseItemWithPurchaseInfo {
  id: number;
  purchasedOn: number;
  expiredOn: number;
}

function getLatestPurchasedIncenseIndex(
  incenseData: IncenseItemWithPurchaseInfo[]
): number | null {
  if (!incenseData || incenseData.length === 0) {
    return null;
  }

  let latestIndex = 0;

  for (let i = 1; i < incenseData.length; i++) {
    if (incenseData[i].purchasedOn > incenseData[latestIndex].purchasedOn) {
      latestIndex = i;
    }
  }

  return latestIndex;
}

function formatTimeDifference(seconds: number): string {
  if (seconds < 0) {
    return "Expired";
  }

  const days = Math.floor(seconds / (60 * 60 * 24));
  const remainingSecondsAfterDays = seconds % (60 * 60 * 24);
  const hours = Math.floor(remainingSecondsAfterDays / (60 * 60));
  const remainingSecondsAfterHours = remainingSecondsAfterDays % (60 * 60);
  const minutes = Math.floor(remainingSecondsAfterHours / 60);
  const remainingSeconds = remainingSecondsAfterHours % 60;

  const paddedHours = String(hours).padStart(2, "0");
  const paddedMinutes = String(minutes).padStart(2, "0");
  const paddedSeconds = String(remainingSeconds).padStart(2, "0");

  if (days > 0) {
    return `${days} Day ${paddedHours}:${paddedMinutes}:${paddedSeconds}`;
  } else {
    return `${paddedHours}:${paddedMinutes}:${paddedSeconds}`;
  }
}

export const MyIncenseCarousel = () => {
  const myIncenseData: IncenseItemWithPurchaseInfo[] = [
    {
      id: 1,
      purchasedOn: 1746124800, // 2025-05-02 00:00:00
      expiredOn: 1754044800, // 2025-07-31 00:00:00
    },
    {
      id: 3,
      purchasedOn: 1746729600, // 2025-05-09 00:00:00
      expiredOn: 1754726400, // 2025-08-08 00:00:00
    },
    {
      id: 5,
      purchasedOn: 1745603200, // 2025-05-18 00:00:00
      expiredOn: 1755302400, // 2025-08-15 00:00:00
    },
  ];

  const initialIndex = getLatestPurchasedIncenseIndex(myIncenseData);
  const [currentIndex, setCurrentIndex] = useState(
    initialIndex !== null ? initialIndex : 0
  );
  const total = myIncenseData.length;

  const [countdownDisplay, setCountdownDisplay] = useState("");

  const goPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  };

  const goNext = () => {
    setCurrentIndex((prev) => (prev + 1) % total);
  };

  const currentLocalIncense = myIncenseData[currentIndex];

  const fullIncenseDetails = incenseData.find(
    (item) => item.id === currentLocalIncense.id
  );

  useEffect(() => {
    const calculateCountdown = () => {
      const currentTime = Math.floor(Date.now() / 1000);
      const timeRemaining = currentLocalIncense.expiredOn - currentTime;
      setCountdownDisplay(formatTimeDifference(timeRemaining));
    };

    calculateCountdown();

    const timerId = setInterval(calculateCountdown, 1000);

    return () => clearInterval(timerId);
  }, [currentLocalIncense.expiredOn]);

  const imgSrc = fullIncenseDetails?.img || "";
  const imgAlt = fullIncenseDetails?.name || currentLocalIncense.id.toString();

  return (
    <div className={styles.myIncenseCarouselContainer}>
      <div className={styles.carouselContent}>
        <button className={styles.navButton} onClick={goPrev}>
          <img
            src="/images/wish/WishPanel/ArrowLeft.webp"
            alt="Previous Incense"
          />
        </button>
        <div className={styles.incenseImageContainer}>
          <img src={imgSrc} alt={imgAlt} className={styles.incenseImage} />
        </div>
        <button className={styles.navButton} onClick={goNext}>
          <img
            src="/images/wish/WishPanel/ArrowRight.webp"
            alt="Next Incense"
          />
        </button>
      </div>
      <div className={styles.countdownTimer}>{countdownDisplay}</div>
    </div>
  );
};
