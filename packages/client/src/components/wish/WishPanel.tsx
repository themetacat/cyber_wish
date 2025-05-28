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

export type Props = {
  readonly wish?: (incenseId: number, blindBoxId: number, wishContent: string, value: number) => Promise<void>;
  setWishStatus: (status: boolean) => void;
};

const WishPanel = ({ wish, setWishStatus }: Props) => {
  const [showModal, setShowModal] = useState(false);
  const [wishContent, setWishContent] = useState("");

  const [incenseId, setIncenseIdRaw] = useState<number | null>(null);
  const [incensePrice, setIncensePrice] = useState<number>(0);
  const [blindBoxId, setBlindBoxIdRaw] = useState<number | null>(null);
  const [blindBoxPrice, setBlindBoxPrice] = useState<number>(0);


  const setIncenseId = useCallback((id: number) => {
    setIncenseIdRaw(id);
    const incenseData = getComponentValue(components.Incense, encodeEntity({poolId: "bytes32", id: "uint256"}, {poolId: wishPool, id: BigInt(id)}));
    if (!incenseData || incenseData.amount == 0n) {
      setIncensePrice(0);
    }else{
      setIncensePrice(parseFloat(formatEther(incenseData.amount)));
    }
  }, []);

  const setBlindBoxId = useCallback((id: number) => {
    setBlindBoxIdRaw(id);
    const blindBoxData = getComponentValue(components.PropBlindBox, encodeEntity({poolId: "bytes32", id: "uint256"}, {poolId: wishPool, id: BigInt(id)}));
    if (!blindBoxData || blindBoxData.amount == 0n) {
      setBlindBoxPrice(0);
    }else{
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
        setWishStatus(false);
        const res = await wish(incenseId, blindBoxId, wishContent, incensePrice + blindBoxPrice);
        console.log("res: ", res);
        
        if (res && res.status == "success") {
          console.log("wish success");
          setWishStatus(true);
        } else {
          console.log("wish faild");
        }
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

            <span className={styles.itemTitle}>WISH</span>
            <input
              type="text"
              className={styles.inputBox}
              value={wishContent}
              onChange={(e) => setWishContent(e.target.value)}
              placeholder="Please enter your wish..."
            />
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
              Total ETH: {incensePrice + blindBoxPrice} ETH
            </p>
            <button className={styles.sendButton} onClick={() => handleSubmit()}>
              Send the wish
            </button>
            <button className={styles.closeButton} onClick={() => setShowModal(false)}>
              ×
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
      <button className={carouselStyles.navButton} onClick={goPrev}>←</button>
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
      <button className={carouselStyles.navButton} onClick={goNext}>→</button>
    </div>
  );
};