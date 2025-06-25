import React, { useEffect, useState, useRef } from "react";
import styles from "./index.module.css";
import commonStyles from "../common/common.module.css";
import { components } from "../../mud/recs";
import { getComponentValue } from "@latticexyz/recs";
import { encodeEntity, singletonEntity } from "@latticexyz/store-sync/recs";
import { INVALID_ADDRESS, WISH_POOL_ID } from "../../utils/contants";
import { pad } from "viem";
import { format } from "date-fns";
import { propsData } from "../../utils/propsData";

interface WishInfo {
  wisher: string;
  wishContent: string;
  wishTime: number;
  propId: number;
  pointsIncense: number;
  pointsBlindBox: number;
  pointsIncenseEasterEgg: number;
  pointsBlindBoxEasterEgg: number;
}

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

    let validCount = 0;
    let total = 0;
    for (
      let i = noLoadCount.current;
      i > 0 && validCount < onceLoadWishesCount;
      i--
    ) {
      const wish = fetchOneWish(i);

      if (wish && !INVALID_ADDRESS.includes(wish.wisher)) {
        newWishes.push(wish);
        validCount++;
      }
      total++;
    }
    noLoadCount.current -= total;

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
    const key = encodeEntity(Wishes.metadata.keySchema, { poolId: WISH_POOL_ID, id: id });
    const wishData = getComponentValue(Wishes, key);

    if (!wishData) return;
    const wishInfo = {
      wisher: wishData.wisher,
      wishContent: wishData.wishContent,
      wishTime: Number(wishData.wishTime),
      propId: Number(wishData.propId),
      pointsIncense: Number(wishData.pointsIncense),
      pointsBlindBox: Number(wishData.pointsBlindBox),
      pointsIncenseEasterEgg: Number(wishData.pointsIncenseEasterEgg),
      pointsBlindBoxEasterEgg: Number(wishData.pointsBlindBoxEasterEgg),
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
              <div className={styles.wishMeta}>
                <span>By {shortenAddress(item.wisher)}</span>
              </div>
              <div className={styles.wishContent}>{item.wishContent}</div>

            </div>
            <div className={styles.wishMetaContainer}>
              <div>
                <div className={styles.wishMeta}>
                  <span>{format(new Date(item.wishTime * 1000), "h:mm a·MMM d,yyyy")}</span>
                </div>
                <div className={styles.wishInteractData}>
                  <div data-tooltip="Coming Soon"><img src="/images/wishWall/Worship.webp" alt="Worship" /></div>
                  <div data-tooltip="Coming Soon"><img src="/images/wishWall/Msg.webp" alt="Message" /></div>
                  <div data-tooltip="Wish Point(WP)">
                    <img src="/images/wishWall/Points.webp" alt="Points" />
                    {item.pointsIncense + item.pointsBlindBox + item.pointsIncenseEasterEgg + item.pointsBlindBoxEasterEgg}
                  </div>
                </div>
              </div>
              <div>
                <img src={propsData[item.propId].imageUrl} className={styles.wishMetaImg} alt="blessing item" />
                <div className={styles.blessingItemContainer}>
                  <img src={propsData[item.propId].imageUrl} alt="blessing item img" />
                  <span className={styles.blessingItemContentContainer}>
                    <span className={styles.blessingItemName}>
                      {propsData[item.propId].name}
                    </span>
                    <span className={styles.blessingItemDesc}>
                      {propsData[item.propId].desc}
                    </span>
                  </span>
                </div>
              </div>
            </div>


          </div>
        ))}
        {loading &&
          <div className={commonStyles.loading}>
            <img src="/images/wishWall/Loading.webp" alt="Loading..." />
          </div>
        }

        {!hasMore &&
          <div className={styles.notHasMore}>
            <span>
              <img src="/images/wishWall/NotHasMore.png" alt="notHasMore" />
            </span>
            <span>
              You&apos;ve reached the end!
            </span>
          </div>
        }
      </div>
    </div>
  );
}
