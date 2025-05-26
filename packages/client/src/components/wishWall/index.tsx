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
  props: number;
}

type PropsItem = {
  name: string;
  imageUrl: string;
};

const propsData: Record<number, PropsItem> = {
  1: { name: "yiyi", imageUrl:  "assets/img/CLUK.webp" },
  2: { name: "erer", imageUrl:  "assets/img/CLUK.webp" },
  3: { name: "sansan", imageUrl:  "assets/img/CLUK.webp" },
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
      props: 1
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
      <h1 className={styles.title}>Wishing Wall</h1>
      <div className={styles.content} ref={containerRef}>
        {wishes.map((item, index) => (
          <div key={index} className={styles.infoBox}>
            <div className={styles.textContent}>
              <div className={styles.wishContent}>{item.wishContent}</div>
              <div className={styles.wishMeta}>
                by {shortenAddress(item.wisher)}
                <span className={styles.metaTime}>
                  {format(new Date(item.wishTime * 1000), "h:mma·MMM d,yyyy")}
                </span></div>
            </div>
            <img src={propsData[item.props].imageUrl} className={styles.image} alt="图标" />
          </div>
        ))}
        {loading && <div className={styles.loading}>loading...</div>}
      </div>
    </div>
  );
}
