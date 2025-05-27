import React, { useState, useEffect, useCallback } from "react";
import styles from "./WishPanel.module.css";
import carouselStyles from "./carousel.module.css";
import { getComponentValue } from "@latticexyz/recs";
import { components } from "../../mud/recs";
import { encodeEntity } from "@latticexyz/store-sync/recs";
import { wishPool } from "../../utils/contants";
import { formatEther } from 'viem';

const images = [
  "assets/img/CLUK.webp",
  "assets/img/HOOT.webp",
  "assets/img/KOALA.webp",
  "assets/img/KUMA.webp",
  "assets/img/MEOW.webp",
  "assets/img/MIYA.webp",
];

const itemInformation = []

export type Props = {
  readonly wish?: (incenseId: number, blindBoxId: number, wishContent: string, value: number) => Promise<void>;
};

const WishPanel = ({ wish }: Props) => {
  const [showModal, setShowModal] = useState(false);
  const [wishContent, setWishContent] = useState("");

  const [incenseId, setIncenseIdRaw] = useState<number | null>(null);
  const [incensePrice, setIncensePrice] = useState<number>(0);
  const [blindBoxId, setBlindBoxIdRaw] = useState<number | null>(null);
  const [blindBoxPrice, setBlindBoxPrice] = useState<number>(0);

  const MAX_WISH_LENGTH = 120;

  const setIncenseId = useCallback((id: number) => {
    setIncenseIdRaw(id);
    const incenseData = getComponentValue(components.Incense, encodeEntity({ poolId: "bytes32", id: "uint256" }, { poolId: wishPool, id: BigInt(id) }));
    if (!incenseData || incenseData.amount == 0n) {
      setIncensePrice(0);
    } else {
      setIncensePrice(parseFloat(formatEther(incenseData.amount)));
    }
  }, []);

  const setBlindBoxId = useCallback((id: number) => {
    setBlindBoxIdRaw(id);
    const blindBoxData = getComponentValue(components.PropBlindBox, encodeEntity({ poolId: "bytes32", id: "uint256" }, { poolId: wishPool, id: BigInt(id) }));
    if (!blindBoxData || blindBoxData.amount == 0n) {
      setBlindBoxPrice(0);
    } else {
      setBlindBoxPrice(parseFloat(formatEther(blindBoxData.amount)));
    }
  }, []);

  const handleSubmit = async () => {
    if (setIncenseId === null || wishContent.trim() === "") {
      alert("no wish content");
      return;
    }

    if (wish) {
      try {
        if (!incenseId || !blindBoxId) {
          return;
        }
        await wish(incenseId, blindBoxId, wishContent, incensePrice + blindBoxPrice);
        console.log("wish success");
      } catch (error) {
        console.error("wish error:", error);
        alert("Please retry");
        return;
      }
    } else {
      console.warn("no wish fn");
    }

    setShowModal(false);
    setIncenseIdRaw(null);
    setBlindBoxIdRaw(null);
    setWishContent("");
  };


  return (
    <>
      <div className={styles.buttonContainer}>
        <button className={styles.mainButton} onClick={() => setShowModal(true)}>
          Make a wish
        </button>
      </div>

      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h1>MAKE A WISH</h1>
            <span className={styles.dividingLine}>
              <img src="/images/wish/WishPanel/DividingLine.webp" alt="dividing line" />
            </span>

            <span className={styles.itemTitle}>WISH</span>
            <div className={styles.inputBoxContainer}>
              <textarea
                className={styles.inputBox}
                value={wishContent}
                onChange={(e) => setWishContent(e.target.value)}
                placeholder="Please enter your wish..."
                maxLength={MAX_WISH_LENGTH}
              />
              <div className={styles.charCount}>
                {wishContent.length}/{MAX_WISH_LENGTH}
              </div>
              {wishContent.length >= MAX_WISH_LENGTH && (
                <div className={styles.maxLengthWarning}>
                  Maximum length reached
                </div>
              )}
            </div>

            <div>
              <span className={styles.itemTitle}>CHOOSE YOUR LIGHT</span>
              <Carousel
                images={images}
                onSelectId={setIncenseId}
              />
            </div>

            <div>
              <span className={styles.itemTitle}>SELECT A BLESSING ITEM</span>
              <Carousel
                images={images}
                onSelectId={setBlindBoxId}
              />
            </div>
            <p className={styles.totalEth}>
              Total: {incensePrice + blindBoxPrice} ETH
            </p>
            <button className={styles.sendButton} onClick={() => handleSubmit()}>
              <span className={styles.sendButtonText}>Send the wish</span>
            </button>
            <button className={styles.closeButton} onClick={() => setShowModal(false)}>
              <img src="/images/wish/WishPanel/Close.webp" alt="Close" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default WishPanel;


type CarouselProps = {
  images: string[];
  onSelectId: (id: number) => void;
};

const Carousel = ({ images, onSelectId }: CarouselProps) => {

  const total = images.length;
  const [currentIndex, setCurrentIndex] = useState(0);

  const goPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  };

  const goNext = () => {
    setCurrentIndex((prev) => (prev + 1) % total);
  };

  useEffect(() => {
    onSelectId(currentIndex + 1);
  }, [currentIndex, onSelectId])

  return (
    <div className={carouselStyles.carouselContainer}>
      <button className={carouselStyles.navButton} onClick={goPrev}>
        <img src="/images/wish/WishPanel/ArrowLeft.webp" alt="Previous" />
      </button>
      <div className={carouselStyles.carouselInner}>
        {images.map((src, i) => {
          const offset = (i - currentIndex + total) % total;
          let className = carouselStyles.card;

          if (offset === 0) className += ` ${carouselStyles.active}`;
          else if (offset === 1 || (currentIndex === total - 1 && i === 0))
            className += ` ${carouselStyles.right}`;
          else if (offset === total - 1 || (currentIndex === 0 && i === total - 1))
            className += ` ${carouselStyles.left}`;

          return (
            <img
              key={i}
              src={src}
              className={className}
              onClick={() => setCurrentIndex(i)}
            />
          );
        })}
      </div>
      <button className={carouselStyles.navButton} onClick={goNext}>
        <img src="/images/wish/WishPanel/ArrowRight.webp" alt="Next" />
      </button>
    </div>
  );
};