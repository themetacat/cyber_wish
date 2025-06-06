import React, { useState, useEffect } from "react";
import styles from "./myIncenseCarousel.module.css";
import { incenseData } from "../../utils/incenseData";

interface IncenseItemWithPurchaseInfo {
  id: number;
  expiredOn: number; // Timestamp in seconds
}

// Function to get the index of the element with the latest expiredOn
function getLatestExpiredIncenseIndex(
  incenseData: IncenseItemWithPurchaseInfo[]
): number | null {
  if (!incenseData || incenseData.length === 0) {
    return null;
  }

  let latestIndex = 0; // Assume the first element has the latest expiredOn initially

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
  const myIncenseData: IncenseItemWithPurchaseInfo[] = [
    {
      id: 1,
      expiredOn: 1754044800, // 2025-07-31 00:00:00
    },
    {
      id: 3,
      expiredOn: 1754726400, // 2025-08-08 00:00:00
    },
    {
      id: 5,
      expiredOn: 1755302400, // 2025-08-15 00:00:00
    },
  ];

  const total = myIncenseData.length;

  // Determine the initial index
  const initialIndex = (() => {
    try {
      const storedIndex = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedIndex !== null) {
        const parsedIndex = parseInt(storedIndex, 10);
        // Check if the parsed index is a valid number and within the bounds of the data array
        if (!isNaN(parsedIndex) && parsedIndex >= 0 && parsedIndex < total) {
          console.log("Using stored index:", parsedIndex);
          return parsedIndex;
        } else {
          console.log("Stored index is invalid, using latest expired.");
          // Clear invalid storage if necessary
           localStorage.removeItem(LOCAL_STORAGE_KEY);
        }
      }
      console.log("No stored index found, using latest expired.");
    } catch (e) {
      console.error("Could not read from localStorage", e);
      // Fallback in case localStorage is not available or error occurs
      console.log("Error reading localStorage, using latest expired.");
    }

    // Fallback: get the index of the latest expired incense if no valid stored index
    const latestExpiredIndex = getLatestExpiredIncenseIndex(myIncenseData);
    return latestExpiredIndex !== null ? latestExpiredIndex : 0; // Default to 0 if data is empty
  })();


  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [countdownDisplay, setCountdownDisplay] = useState("");


  // Effect to update localStorage when currentIndex changes
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, String(currentIndex));
      console.log("Saved index", currentIndex, "to localStorage");
    } catch (e) {
       console.error("Could not write to localStorage", e);
    }
  }, [currentIndex]);


  const goPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + total) % total);
    // The useEffect above will handle saving the new index to localStorage
  };

  const goNext = () => {
    setCurrentIndex((prev) => (prev + 1) % total);
    // The useEffect above will handle saving the new index to localStorage
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
  }, [currentLocalIncense.expiredOn, currentIndex]); // Added currentIndex dependency


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
