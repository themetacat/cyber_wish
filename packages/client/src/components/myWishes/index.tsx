import { useEffect, useState, useRef, useMemo } from "react";
import styles from "./index.module.css";
import { components } from "../../mud/recs";
import { getComponentValue } from "@latticexyz/recs";
import { encodeEntity } from "@latticexyz/store-sync/recs";
import { WISH_POOL_ID } from "../../utils/contants";
import { format } from "date-fns";
import { propsData } from "../../utils/propsData";
import { shortenAddress } from "../../utils/common";
import MyFateGifts from "../Fate/myFateGifts";
import { useAccount } from "wagmi";

interface WishInfo {
  wisher: string;
  wishContent: string;
  wishTime: number;
  propId: number;
}

export default function MyWishes() {
  const [wishes, setWishes] = useState<WishInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const onceLoadWishesCount = 8;
  const noLoadCount = useRef<number>(0);
  const [wishCount, setWishCount] = useState(0);
  const [wishPoints, setWishPoints] = useState(0);
  const { address: userAddress } = useAccount();
  const [showMyFateGifts, setShowMyFateGifts] = useState(false);
  const Wishes = components.Wishes;
  const Wisher = components.Wisher;

  const wisherKey = useMemo(() => {
    if (!userAddress || !WISH_POOL_ID) return null;
    return encodeEntity(Wisher.metadata.keySchema, {
      poolId: WISH_POOL_ID,
      wisher: userAddress,
    });
  }, [userAddress, Wisher]);

  const wisherData = useMemo(() => {
    if (!wisherKey) return null;
    return getComponentValue(Wisher, wisherKey);
  }, [Wisher, wisherKey]);

  useEffect(() => {
    if (!wisherData) {
      setWishCount(0);
      setWishPoints(0);
      return;
    }
    setWishCount(Number(wisherData.wishCount));
    setWishPoints(Number(wisherData.points))
  }, [wisherData])

  const loadWishes = async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    const newWishes: WishInfo[] = [];

    for (
      let i = noLoadCount.current;
      i > noLoadCount.current - onceLoadWishesCount && i > 0;
      i--
    ) {
      const wish = fetchOneWish(i);
      if (wish) {
        newWishes.push(wish);
      }
    }

    noLoadCount.current -= onceLoadWishesCount;
    if (noLoadCount.current <= 0) {
      setHasMore(false);
    }

    setWishes((prev) => [...prev, ...newWishes]);
    setLoading(false);
  };

  useEffect(() => {
    if (noLoadCount.current) {
      return;
    }
    // noLoadCount.current = getWishCount();
    loadWishes();
  }, []);

  // const getWishCount = () => {
  //   const wishCountData = getComponentValue(
  //     components.WishCount,
  //     singletonEntity
  //   );
  //   if (!wishCountData || wishCountData.count <= 0n) {
  //     return 0;
  //   }
  //   const wishCount = Number(wishCountData.count);
  //   return wishCount;
  // };

  // const fetchOneWish = (wishIndex: number): WishInfo | undefined => {
  //   const id = pad(`0x${wishIndex.toString(16)}`, { size: 32 });
  //   const key = encodeEntity(Wishes.metadata.keySchema, {
  //     poolId: wishPool,
  //     id: id,
  //   });
  //   const wishData = getComponentValue(Wishes, key);

  //   if (!wishData) return;
  //   const wishInfo = {
  //     wisher: wishData.wisher,
  //     wishContent: wishData.wishContent,
  //     wishTime: Number(wishData.wishTime),
  //     propId: Number(wishData.propId),
  //   };

  //   return wishInfo;
  // };

  useEffect(() => {
    const onScroll = () => {
      const container = containerRef.current;
      if (!container) return;

      if (
        container.scrollTop + container.clientHeight >=
        container.scrollHeight - 10
      ) {
        loadWishes();
      }
    };
    const container = containerRef.current;
    container?.addEventListener("scroll", onScroll);
    return () => container?.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>My Wishes</h1>
      <div className={styles.content} ref={containerRef}>
        <span className={styles.dividingLine}>
          <img
            src="/images/wish/WishPanel/DividingLine.webp"
            alt="dividing line"
          />
        </span>

        <div className={styles.wishSummary}>
          <div className={styles.wishSummaryItem}>
            <span>{wishCount} Wishes</span>
          </div>
          <div className={styles.wishSummaryItem}>
            <span>{wishPoints} Wish Points</span>
          </div>
          <div className={styles.myFatedGifts} onClick={() => setShowMyFateGifts(!showMyFateGifts)}>
            <span>My Wish Rewards</span>
          </div>
        </div>

        {wishes.map((item, index) => (
          <div key={index} className={styles.infoBox}>
            <div className={styles.textContent}>
              <div className={styles.wishContent}>{item.wishContent}</div>

              <div className={styles.wishMeta}>
                By {shortenAddress(item.wisher)}
                <span className={styles.metaTime}>
                  {format(new Date(item.wishTime * 1000), "h:mma·MMM d,yyyy")}
                </span>
              </div>
            </div>

            <img
              src={propsData[item.propId].imageUrl}
              className={styles.image}
              alt="blessing item"
            />
          </div>
        ))}
        {loading && (
          <div className={styles.loading}>
            <img src="/images/wishWall/Loading.webp" alt="Loading..." />
          </div>
        )}

        {!hasMore && (
          <div className={styles.notHasMore}>
            <span>
              <img src="/images/wishWall/NotHasMore.svg" alt="notHasMore" />
            </span>
            <span>You've reached the end!</span>
          </div>
        )}
      </div>
      {showMyFateGifts && <MyFateGifts onClose={() => setShowMyFateGifts(false)} />}
    </div>
  );
}
