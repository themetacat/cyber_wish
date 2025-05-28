import React, { useEffect, useState, useRef } from "react";
import styles from "./index.module.css";
import { components } from "../../mud/recs";
import { getComponentValue } from "@latticexyz/recs";
import { encodeEntity, singletonEntity } from "@latticexyz/store-sync/recs";
import { wishPool } from "../../utils/contants";
import { pad } from "viem";
import { format } from "date-fns";

interface WishInfo {
  wisher: string;
  wishContent: string;
  wishTime: number;
  propId: number;
}

type PropsItem = {
  name: string;
  imageUrl: string;
};

const propsData: Record<number, PropsItem> = {
  // Pray Blessing props
  1: { name: "NAMASKAR", imageUrl: "images/wish/WishPanel/Props/NAMASKAR.png" },

  // Health Blessing Props
  2: { name: "Medicinal Herb Pouch", imageUrl: "images/wish/WishPanel/Props/2.1.png" },
  3: { name: "Green Wellness Candle", imageUrl: "images/wish/WishPanel/Props/2.2.png" },
  4: { name: "Horseshoe", imageUrl: "images/wish/WishPanel/Props/2.3.png" },
  5: { name: "Red String", imageUrl: "images/wish/WishPanel/Props/2.4.png" },

  // Fortune Blessing Props
  6: { name: "Treasure Basin", imageUrl: "images/wish/WishPanel/Props/3.1.png" },
  7: { name: "Lucky Beckoning Cat", imageUrl: "images/wish/WishPanel/Props/3.2.png" },
  8: { name: "God of Wealth", imageUrl: "images/wish/WishPanel/Props/3.3.png" },
  9: { name: "BitCoin", imageUrl: "images/wish/WishPanel/Props/3.4.png" },

  // Wisdom Blessing Props
  10: { name: "Koi Fish", imageUrl: "images/wish/WishPanel/Props/4.1.png" },
  11: { name: "Athena's Owl", imageUrl: "images/wish/WishPanel/Props/4.2.png" },
  12: { name: "Albert Einstein", imageUrl: "images/wish/WishPanel/Props/4.3.png" },

  // Love Blessing Props
  13: { name: "Cupid's Arrow", imageUrl: "images/wish/WishPanel/Props/1.1.png" },
  14: { name: "Lucky Love Box", imageUrl: "images/wish/WishPanel/Props/1.2.png" },
  15: { name: "Love Candle", imageUrl: "images/wish/WishPanel/Props/1.3.png" },
};

export default function WishingWall() {
  const [wishes, setWishes] = useState<WishInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const onceLoadWishesCount = 8;
  const noLoadCount = useRef<number>(0);
  const Wishes = components.Wishes;

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
    noLoadCount.current = getWishCount();
    loadWishes();
  }, []);


  const getWishCount = () => {
    const wishCountData = getComponentValue(components.WishCount, singletonEntity);
    if (!wishCountData || wishCountData.count <= 0n) {
      return 0;
    }
    const wishCount = Number(wishCountData.count);
    return wishCount;
  }

  function shortenAddress(address: string) {
    return `${address.slice(0, 5)}...${address.slice(-4)}`;
  }

  const fetchOneWish = (wishIndex: number): WishInfo | undefined => {

    const id = pad(`0x${wishIndex.toString(16)}`, { size: 32 });
    const key = encodeEntity(Wishes.metadata.keySchema, { poolId: wishPool, id: id });
    const wishData = getComponentValue(Wishes, key);

    if (!wishData) return;
    const wishInfo = {
      wisher: wishData.wisher,
      wishContent: wishData.wishContent,
      wishTime: Number(wishData.wishTime),
      propId:  Number(wishData.propId)
    }

    return wishInfo;
  }

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
      <div className={styles.secTitle}>
        <span className={styles.secTitleWishingWall}>
          WAIHING WALL
        </span>
        <span className={styles.secTitleMyWishs}>
          MY WAIHS
        </span>
      </div>

      <h1 className={styles.title}>Wishing Wall</h1>

      <div className={styles.content} ref={containerRef}>
        {wishes.map((item, index) => (
          <div key={index} className={styles.infoBox}>
            <div className={styles.textContent}>
              <div className={styles.wishContent}>
                {item.wishContent}
              </div>

              <div className={styles.wishMeta}>
                By {shortenAddress(item.wisher)}
                <span className={styles.metaTime}>
                  {format(new Date(item.wishTime * 1000), "h:mma·MMM d,yyyy")}
                </span>
              </div>
            </div>

            <img src={propsData[item.propId].imageUrl} className={styles.image} alt="blessing item" />
          </div>
        ))}
        {loading && <div className={styles.loading}>loading...</div>}
      </div>
    </div>
  );
}
