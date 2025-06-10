import React, { useState, useEffect, useCallback } from "react";
import styles from "./myIncenseCarousel.module.css";
import { ImageItem, incenseData } from "../../utils/incenseData";
import { useAccount } from "wagmi";

interface IncenseItemWithPurchaseInfo {
  id: number;
  expiredOn: number; // Timestamp in seconds
}


interface ApiMyIncenseData {
  incense_id: number;
  expire_time: number
}


// Function to get the index of the element with the latest expiredOn
function getLatestExpiredIncenseIndex(
  incenseData: IncenseItemWithPurchaseInfo[]
): number | null {
  if (!incenseData || incenseData.length === 0) {
    return null;
  }

  let latestIndex = 1; // Assume the first element has the latest expiredOn initially

  for (let i = 1; i < incenseData.length; i++) {
    if (incenseData[i].expiredOn > incenseData[latestIndex].expiredOn) {
      latestIndex = i; // Update the index if a later expiredOn item is found
    }
  }

  return latestIndex; // Return the index of the element with the latest expiredOn
}

// Helper function to format seconds into "xxd HH:mm:ss" format
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

  // Format with 'd' after days and spaces around colons
  if (days > 0) {
    return `${days}d ${paddedHours} : ${paddedMinutes} : ${paddedSeconds}`;
  } else {
    return `${paddedHours} : ${paddedMinutes} : ${paddedSeconds}`;
  }
}

const LOCAL_STORAGE_KEY = 'lastIncenseIndex'; // Key for localStorage

export const MyIncenseCarousel = () => {
   const { address: userAddress } = useAccount();
  const [myIncenseData, setMyIncenseData] = useState<IncenseItemWithPurchaseInfo[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentLocalIncense, setCurrentLocalIncense] = useState<IncenseItemWithPurchaseInfo>();
  const [fullIncenseDetails, setFullIncenseDetails] = useState<ImageItem>();
  const [countdownDisplay, setCountdownDisplay] = useState("");

  const totalLength = myIncenseData.length;

  const loadMyIncense = useCallback(async () => {
    if (!userAddress) return;
    try {
      const params = new URLSearchParams({ wisher: userAddress });
      const res = await fetch(`/api/get_incense_by_wisher?${params}`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const jsonRes = await res.json();
      if (!jsonRes.success) throw new Error(jsonRes.error || 'API request failed');

      const incenseList = jsonRes.data.map((data: ApiMyIncenseData) => ({
        id: data.incense_id,
        expiredOn: data.expire_time
      }));
      setMyIncenseData(incenseList);
    } catch (err) {
      console.error('Failed to load incense data:', err);
    }
  }, [userAddress]);

  const initIndex = useCallback(() => {
    if (!userAddress || totalLength === 0) return;
    try {
      const storedIndex = parseInt(localStorage.getItem(LOCAL_STORAGE_KEY) ?? '', 10);
      if (!isNaN(storedIndex) && storedIndex > 0 && storedIndex <= totalLength) {
        setCurrentIndex(storedIndex);
        return;
      }
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch (e) {
      console.error("localStorage read error", e);
    }
    const fallbackIndex = getLatestExpiredIncenseIndex(myIncenseData);
    setCurrentIndex(fallbackIndex ?? 1);
  }, [myIncenseData, totalLength, userAddress]);

  useEffect(() => {
    loadMyIncense();
  }, [loadMyIncense]);

  useEffect(() => {
    initIndex();
  }, [initIndex]);

  useEffect(() => {
    if (currentIndex === 0) return;
    try {
      const existing = parseInt(localStorage.getItem(LOCAL_STORAGE_KEY) ?? '0');
      if (currentIndex !== existing) {
        localStorage.setItem(LOCAL_STORAGE_KEY, String(currentIndex));
      }
    } catch (e) {
      console.error("localStorage write error", e);
    }
  }, [currentIndex]);

  useEffect(() => {
    if (currentIndex > 0 && currentIndex <= totalLength) {
      setCurrentLocalIncense(myIncenseData[currentIndex - 1]);
    }
  }, [currentIndex, myIncenseData]);

  const goPrev = () => {
    setCurrentIndex((prev) => ((prev - 2 + totalLength) % totalLength) + 1);
  };

  const goNext = () => {
    setCurrentIndex((prev) => (prev % totalLength) + 1);
  };

  useEffect(() => {
    if (!currentLocalIncense) return;
    setFullIncenseDetails(
      incenseData.find((item) => item.id === currentLocalIncense.id)
    );

    const calculateCountdown = () => {
      const currentTime = Math.floor(Date.now() / 1000);
      const timeRemaining = currentLocalIncense.expiredOn - currentTime;
      setCountdownDisplay(formatTimeDifference(timeRemaining));
    };

    calculateCountdown();
    const timerId = setInterval(calculateCountdown, 1000);
    return () => clearInterval(timerId);
  }, [currentLocalIncense]);

  const imgSrc = fullIncenseDetails?.img || "";
  const imgAlt = fullIncenseDetails?.name || `Current Incense: ${currentLocalIncense?.id ?? "0"}`;

  return (
    <>
      {
        totalLength > 0  && currentIndex > 0 && <div className={styles.myIncenseCarouselContainer}>
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
      }
    </>
  );
};
