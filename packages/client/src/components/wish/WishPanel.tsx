import React, { useState, useEffect, useCallback, useRef } from "react";
import styles from "./WishPanel.module.css";
import carouselStyles from "./carousel.module.css";
import { getComponentValue } from "@latticexyz/recs";
import { components } from "../../mud/recs";
import { encodeEntity } from "@latticexyz/store-sync/recs";
import { CURRENCY_SYMBOL, WISH_POOL_ID } from "../../utils/contants";
import { formatEther, TransactionReceipt } from "viem";
import { useAccount } from "wagmi";
import { ImageItem, incenseData } from "../../utils/incenseData";
import { blindBoxData } from "../../utils/blindBoxData";
import { ErrorToast } from "../common/ErrorToast";
import { useLocation } from "react-router-dom";
import { ConnectButton, useConnectModal } from '@rainbow-me/rainbowkit';
import commonStyles from "../common/common.module.css";

export type Props = {
  readonly wish?: (
    incenseId: number,
    blindBoxId: number,
    wishContent: string,
    value: number
  ) => Promise<TransactionReceipt>;
  setWishStatus: (status: boolean) => void;
};

const WishPanel = ({ wish, setWishStatus }: Props) => {
  const [showModal, setShowModal] = useState(false);
  const [wishContent, setWishContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { address } = useAccount();
  const { openConnectModal } = useConnectModal();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    if (showModal && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [showModal]);

  const [incenseId, setIncenseIdRaw] = useState<number | null>(null);
  const [incenseAmount, setIncenseAmount] = useState<bigint>(0n);
  const [blindBoxId, setBlindBoxIdRaw] = useState<number | null>(null);
  const [blindBoxAmount, setBlindBoxAmount] = useState<bigint>(0n);

  const MAX_WISH_LENGTH = 120;

  const setIncenseId = useCallback((id: number) => {
    setIncenseIdRaw(id);
    const incenseData = getComponentValue(
      components.Incense,
      encodeEntity(
        { poolId: "bytes32", id: "uint256" },
        { poolId: WISH_POOL_ID, id: BigInt(id) }
      )
    );
    if (!incenseData || incenseData.amount == 0n) {
      setIncenseAmount(0n);
    } else {
      setIncenseAmount(incenseData.amount);
    }
  }, []);

  const setBlindBoxId = useCallback((id: number) => {
    setBlindBoxIdRaw(id);
    const blindBoxData = getComponentValue(
      components.PropBlindBox,
      encodeEntity(
        { poolId: "bytes32", id: "uint256" },
        { poolId: WISH_POOL_ID, id: BigInt(id) }
      )
    );
    if (!blindBoxData || blindBoxData.amount == 0n) {
      setBlindBoxAmount(0n);
    } else {
      setBlindBoxAmount(blindBoxData.amount);
    }
  }, []);

  const totalAmount = incenseAmount + blindBoxAmount;

  const handleSubmit = async () => {
    if (!address) {
      if (openConnectModal) {
        openConnectModal();
      }
      return;
    }

    if (setIncenseId === null || wishContent.trim() === "") {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
      return;
    }

    if (wish) {
      try {
        if (!incenseId || !blindBoxId) {
          return;
        }
        setIsSubmitting(true);
        setWishStatus(false);
        const res = await wish(
          incenseId,
          blindBoxId,
          wishContent,
          Number(formatEther(totalAmount))
        );
        if (res && res.status == "success") {
          setWishStatus(true);
          setShowModal(false);
          setWishContent("");
          setIncenseIdRaw(null);
          setBlindBoxIdRaw(null);
        } else {
          setErrorMessage("Failed to make a wish. Please try again.");
        }
      } catch (error) {
        console.error("wish error:", error);
        const errorMessage =
          error instanceof Error ? error.message : String(error);

        if (errorMessage.includes("Insufficient balance")) {
          setErrorMessage("Insufficient balance.");
        } else if (errorMessage.includes("Free times limit reached.")) {
          setErrorMessage("Free times limit reached.");
        } else {
          setErrorMessage("Failed to make a wish. Please try again.");
        }
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setErrorMessage("Failed to make a wish. Please try again.");
      console.warn("no wish fn");
    }
  };

  return (
    <>
      {location.pathname === "/" && (
        <div className={styles.buttonContainer}>
          <button
            className={styles.mainButton}
            onClick={() => setShowModal(true)}
          >
            <span className={styles.mainButtonText}>Make a wish</span>
          </button>
        </div>
      )}

      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h1>MAKE A WISH</h1>
            <div className={commonStyles.divider} style={{width: "100%", marginLeft: "auto"}}/>

            <span className={styles.itemTitle}>WISH</span>
            <div className={styles.inputBoxContainer}>
              <textarea
                ref={textareaRef}
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
              <Carousel images={incenseData} onSelectId={setIncenseId} />
            </div>

            <div>
              <span className={styles.itemTitle}>SELECT A BLESSING ITEM</span>
              <Carousel
                images={blindBoxData}
                onSelectId={setBlindBoxId}
                type="blindBox"
              />
            </div>
            <p className={styles.totalEth}>
              Total: {formatEther(totalAmount)} {CURRENCY_SYMBOL}
            </p>
            <ConnectButton.Custom>
              {({
                account,
                chain,
                openChainModal,
                openConnectModal,
                authenticationStatus,
                mounted,
              }) => {
                const ready = mounted && authenticationStatus !== 'loading';
                const connected =
                  ready &&
                  account &&
                  chain &&
                  (!authenticationStatus ||
                    authenticationStatus === 'authenticated');

                return (
                  <div
                    {...(!ready && {
                      'aria-hidden': true,
                      'style': {
                        opacity: 0,
                        pointerEvents: 'none',
                        userSelect: 'none',
                      },
                    })}

                  >
                    {(() => {
                      if (!connected) {
                        return (
                          <button
                            className={styles.sendButton}
                            onClick={openConnectModal}
                          >
                            <span className={styles.sendButtonText}>
                              Connect Wallet
                            </span>
                          </button>
                        );
                      }
                      if (chain.unsupported) {
                        return (
                          <button
                            className={styles.sendButton}
                            onClick={openChainModal}
                          >
                            <span className={styles.wrongNetwork}>
                              Wrong network
                            </span>
                          </button>
                        );
                      }
                      return (
                        <button
                          className={styles.sendButton}
                          onClick={() => handleSubmit()}
                          disabled={isSubmitting}
                        >
                          <span className={styles.sendButtonText}>
                            {isSubmitting ? "Loading..." : "Send the wish"}
                          </span>
                        </button>
                      );
                    })()}
                  </div>
                );
              }}
            </ConnectButton.Custom>
            <button
              className={styles.closeButton}
              onClick={() => setShowModal(false)}
            >
              <img src="/images/wish/WishPanel/Close.webp" alt="Close" />
            </button>
          </div>
        </div>
      )}
      {errorMessage && (
        <ErrorToast
          message={errorMessage}
          onClose={() => setErrorMessage(null)}
        />
      )}
    </>
  );
};

export default WishPanel;

type CarouselProps = {
  images: ImageItem[];
  onSelectId: (id: number) => void;
  type?: "incense" | "blindBox";
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

const Carousel = ({ images, onSelectId, type = "incense" }: CarouselProps) => {
  const total = images.length;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentItemData, setCurrentItemData] = useState<
    IncenseData | BlindBoxData | null
  >(null);

  const goPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  };

  const goNext = () => {
    setCurrentIndex((prev) => (prev + 1) % total);
  };

  useEffect(() => {
    onSelectId(images[currentIndex].id);
    const itemData =
      type === "incense"
        ? getComponentValue(
          components.Incense,
          encodeEntity(
            { poolId: "bytes32", id: "uint256" },
            { poolId: WISH_POOL_ID, id: BigInt(images[currentIndex].id) }
          )
        )
        : getComponentValue(
          components.PropBlindBox,
          encodeEntity(
            { poolId: "bytes32", id: "uint256" },
            { poolId: WISH_POOL_ID, id: BigInt(images[currentIndex].id) }
          )
        );

    if (itemData) {
      if (type === "incense") {
        setCurrentItemData({
          ...itemData,
          name: images[currentIndex].name,
          desc: images[currentIndex].desc,
        } as IncenseData);
      } else {
        setCurrentItemData({
          ...itemData,
          name: images[currentIndex].name,
          desc: images[currentIndex].desc,
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
            if (type === "incense") {
              className += ` ${carouselStyles.incense}`;
            }

            if (offset === 0) className += ` ${carouselStyles.active}`;
            else if (offset === 1 || (currentIndex === total - 1 && i === 0))
              className += ` ${carouselStyles.right}`;
            else if (
              offset === total - 1 ||
              (currentIndex === 0 && i === total - 1)
            )
              className += ` ${carouselStyles.left}`;

            return (
              <div
                key={i}
                className={className}
                onClick={() => setCurrentIndex(i)}
              >
                <img src={item.img} className={carouselStyles.cardImage} />
              </div>
            );
          })}
        </div>
        <button className={carouselStyles.navButton} onClick={goNext}>
          <img src="/images/wish/WishPanel/ArrowRight.webp" alt="Next" />
        </button>
      </div>

      <div className={carouselStyles.carouselText}>
        <div className={carouselStyles.title}>
          {currentItemData?.name || "Loading..."}
        </div>
        <div className={carouselStyles.sub}>
          <span className={carouselStyles.price}>
            {currentItemData?.amount
              ? `${formatEther(currentItemData.amount)} ${CURRENCY_SYMBOL}`
              : "Free"}
          </span>
          {type === "incense" && (
            <span className={carouselStyles.time}>
              {(currentItemData as IncenseData)?.duration
                ? formatDuration((currentItemData as IncenseData).duration)
                : ""}
            </span>
          )}
        </div>
        <div className={carouselStyles.desc}>
          {currentItemData?.desc || "No description available"}
        </div>
      </div>
    </div>
  );
};
