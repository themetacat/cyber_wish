import React, { useState, useEffect, useCallback } from "react";
import styles from "./WishPanel.module.css";
import carouselStyles from "./carousel.module.css";
import { getComponentValue } from "@latticexyz/recs";
import { components } from "../../mud/recs";
import { encodeEntity } from "@latticexyz/store-sync/recs";
import { wishPool } from "../../utils/contants";
import { formatEther } from 'viem';

type ImageItem = {
  id: number;
  name: string;
  desc: string;
  img: string;
};

const incenseImages: ImageItem[] = [
  {
    id: 1,
    name: "Pure Wish",
    desc: "For sincere prayers and pure-hearted intentions to ascend.",
    img: "/images/wish/WishPanel/Incense/1.1.gif"
  },
  {
    id: 2,
    name: "Luck  Wish",
    desc: "For luck and good things to grow.",
    img: "/images/wish/WishPanel/Incense/1.2.gif"
  },
  {
    id: 3,
    name: "Fortune Bloom",
    desc: "For unlocking financial opportunities and abundance flow.",
    img: "/images/wish/WishPanel/Incense/1.3.gif"
  },
  {
    id: 4,
    name: "Fate Whisper",
    desc: "For deepening destined bonds and meaningful encounters.",
    img: "/images/wish/WishPanel/Incense/1.4.gif"
  },
  {
    id: 5,
    name: "Celestial Wish",
    desc: "For big dreams to reach the sky.",
    img: "/images/wish/WishPanel/Incense/1.5.gif"
  }
];

const blindBoxImages: ImageItem[] = [
  {
    id: 1,
    name: "Pray",
    desc: "Pray for a smooth and joyful life.",
    img: "/images/wish/WishPanel/Props/NAMASKAR.png"
  },
  {
    id: 2,
    name: "Health Blessing",
    desc: "May you enjoy strong vitality and lasting balance in body and mind.",
    img: "/images/wish/WishPanel/BlindBox/Health.png"
  },
  {
    id: 3,
    name: "Fortune Blessing",
    desc: "May fortune find you, bringing wealth and unexpected opportunities.",
    img: "/images/wish/WishPanel/BlindBox/Fortune.png"
  },
  {
    id: 4,
    name: "Wisdom Blessing",
    desc: "May your mind be clear and your choices filled with insight.",
    img: "/images/wish/WishPanel/BlindBox/Wisdom.png"
  },
  {
    id: 5,
    name: "Love Blessing",
    desc: "May you meet your true love and enjoy a harmonious, loving relationship.",
    img: "/images/wish/WishPanel/BlindBox/Love.png"
  }
];

export type Props = {
  readonly wish?: (incenseId: number, blindBoxId: number, wishContent: string, value: number) => Promise<void>;
  setWishStatus: (status: boolean) => void;
};

const WishPanel = ({ wish, setWishStatus }: Props) => {
  const [showModal, setShowModal] = useState(false);
  const [wishContent, setWishContent] = useState("");

  const [incenseId, setIncenseIdRaw] = useState<number | null>(null);
  const [incenseAmount, setIncenseAmount] = useState<bigint>(0n);
  const [blindBoxId, setBlindBoxIdRaw] = useState<number | null>(null);
  const [blindBoxAmount, setBlindBoxAmount] = useState<bigint>(0n);

  const MAX_WISH_LENGTH = 120;

  const setIncenseId = useCallback((id: number) => {
    setIncenseIdRaw(id);
    const incenseData = getComponentValue(components.Incense, encodeEntity({ poolId: "bytes32", id: "uint256" }, { poolId: wishPool, id: BigInt(id) }));
    if (!incenseData || incenseData.amount == 0n) {
      setIncenseAmount(0n);
    } else {
      setIncenseAmount(incenseData.amount);
    }
  }, []);

  const setBlindBoxId = useCallback((id: number) => {
    setBlindBoxIdRaw(id);
    const blindBoxData = getComponentValue(components.PropBlindBox, encodeEntity({ poolId: "bytes32", id: "uint256" }, { poolId: wishPool, id: BigInt(id) }));
    if (!blindBoxData || blindBoxData.amount == 0n) {
      setBlindBoxAmount(0n);
    } else {
      setBlindBoxAmount(blindBoxData.amount);
    }
  }, []);

  const totalAmount = incenseAmount + blindBoxAmount;

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
        const res = await wish(incenseId, blindBoxId, wishContent, Number(formatEther(totalAmount)));
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
          <span className={styles.mainButtonText}>Make a wish</span>
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
                images={incenseImages}
                onSelectId={setIncenseId}
              />
            </div>

            <div>
              <span className={styles.itemTitle}>SELECT A BLESSING ITEM</span>
              <Carousel
                images={blindBoxImages}
                onSelectId={setBlindBoxId}
                type="blindBox"
              />
            </div>
            <p className={styles.totalEth}>
              Total: {formatEther(totalAmount)} ETH
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
  images: ImageItem[];
  onSelectId: (id: number) => void;
  type?: 'incense' | 'blindBox';
};

type IncenseData = {
  name: string;
  amount: bigint;
  duration: bigint;
  desc: string;
};

type BlindBoxData = {
  name: string;
  amount: bigint;
  desc: string;
};

const formatDuration = (seconds: bigint): string => {
  const hours = Number(seconds) / 3600;
  return `For ${hours} hours`;
};

const Carousel = ({ images, onSelectId, type = 'incense' }: CarouselProps) => {
  const total = images.length;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentItemData, setCurrentItemData] = useState<IncenseData | BlindBoxData | null>(null);

  const goPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  };

  const goNext = () => {
    setCurrentIndex((prev) => (prev + 1) % total);
  };

  useEffect(() => {
    onSelectId(images[currentIndex].id);
    const itemData = type === 'incense'
      ? getComponentValue(components.Incense, encodeEntity({ poolId: "bytes32", id: "uint256" }, { poolId: wishPool, id: BigInt(images[currentIndex].id) }))
      : getComponentValue(components.PropBlindBox, encodeEntity({ poolId: "bytes32", id: "uint256" }, { poolId: wishPool, id: BigInt(images[currentIndex].id) }));
    
    if (itemData) {
      if (type === 'incense') {
        setCurrentItemData({
          ...itemData,
          name: images[currentIndex].name,
          desc: images[currentIndex].desc
        } as IncenseData);
      } else {
        setCurrentItemData({
          ...itemData,
          name: images[currentIndex].name,
          desc: images[currentIndex].desc
        } as BlindBoxData);
      }
    }
  }, [currentIndex, onSelectId, images, type]);

  return (
    <div className={carouselStyles.carouselWrapper}>
      <div className={carouselStyles.carouselContainer}>
        <button className={carouselStyles.navButton} onClick={goPrev}>
          <img src="/images/wish/WishPanel/ArrowLeft.webp" alt="Previous" />
        </button>
        <div className={carouselStyles.carouselInner}>
          {images.map((item, i) => {
            const offset = (i - currentIndex + total) % total;
            let className = carouselStyles.card;

            if (offset === 0) className += ` ${carouselStyles.active}`;
            else if (offset === 1 || (currentIndex === total - 1 && i === 0))
              className += ` ${carouselStyles.right}`;
            else if (offset === total - 1 || (currentIndex === 0 && i === total - 1))
              className += ` ${carouselStyles.left}`;

            return (
              <div
                key={i}
                className={className}
                onClick={() => setCurrentIndex(i)}
              >
                <img
                  src={item.img}
                  className={carouselStyles.cardImage}
                />
              </div>
            );
          })}
        </div>
        <button className={carouselStyles.navButton} onClick={goNext}>
          <img src="/images/wish/WishPanel/ArrowRight.webp" alt="Next" />
        </button>
      </div>

      <div className={carouselStyles.carouselText}>
        <div className={carouselStyles.title}>{currentItemData?.name || "Loading..."}</div>
        <div className={carouselStyles.sub}>
          <span className={carouselStyles.price}>{currentItemData?.amount ? `${formatEther(currentItemData.amount)} ETH` : "Free"}</span>
          {type === 'incense' && (
            <span className={carouselStyles.time}>
              {(currentItemData as IncenseData)?.duration ? formatDuration((currentItemData as IncenseData).duration) : ""}
            </span>
          )}
        </div>
        <div className={carouselStyles.desc}>{currentItemData?.desc || "No description available"}</div>
      </div>
    </div>
  );
};