import React, { useEffect, useState, useRef } from "react";
import styles from "./wishesPanel.module.css";
import { useComponentValue, useEntityQuery } from "@latticexyz/react";
import { components } from "../../mud/recs";
import { getComponentValue, Has } from "@latticexyz/recs";
import { encodeEntity, singletonEntity } from "@latticexyz/store-sync/recs";
import { wishPool } from "../../utils/contants";
import { pad } from "viem";
import { format } from "date-fns";


interface WishInfo {
  wisher: string;
  wishContent: string;
  wishTime: bigint;
}
// const wishInfoArr: WishInfo[] = []; 
const MAX_WISHES = 20;
const ITEM_HEIGHT = 96;

export default function WishesPanel() {
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);

  const wishInfoArr = useRef<WishInfo[]>([]); // 全部愿望数据
  // const [tick, setTick] = useState(0); // 控制重渲染
  const [leftOffset, setLeftOffset] = useState(0);
  const [rightOffset, setRightOffset] = useState(0);
  const lastFetchIndexRef = useRef<number>(0);
  const [visibleCount, setVisibleCount] = useState(4);
  const [oldWishCount, setOldWishCount] = useState(-1);

  const getLeftData = () =>
    wishInfoArr.current.filter((_, i) => i % 2 === 0).slice(0, visibleCount + 1);
  const getRightData = () =>
    wishInfoArr.current.filter((_, i) => i % 2 === 1).slice(0, visibleCount + 1);

  const SCROLL_INTERVAL = 2000;
  const Wishes = components.Wishes;

  useEffect(() => {
    const wishCount = getWishCount();
    // lastFetchIndexRef.current = wishCount;

    const fetchInitialWishes = () => {
      // for (let index = wishCount; index >= wishCount - MAX_WISHES && index > 0; index--) {
      for (let index = wishCount; index >= wishCount - MAX_WISHES; index--) {

        const wishInfo = popOneWish();
        if (wishInfo) {
          wishInfoArr.current.push(wishInfo);
        }
      }
    }
    if (!lastFetchIndexRef.current) {
      lastFetchIndexRef.current = wishCount;
      setOldWishCount(wishCount);
      fetchInitialWishes();
    }
  }, [])

  const popOneWish = (): WishInfo | undefined => {
    if (lastFetchIndexRef.current == 0) {
      const wishCount = getWishCount();
      if (!wishCount) {
        return;
      }
      lastFetchIndexRef.current = wishCount;
    }
    const wishInfo = fetchOneWish(lastFetchIndexRef.current);
    lastFetchIndexRef.current -= 1;
    return wishInfo;
  }

  const fetchOneWish = (wishIndex: number): WishInfo | undefined => {

    const id = pad(`0x${wishIndex.toString(16)}`, { size: 32 });
    const key = encodeEntity(Wishes.metadata.keySchema, { poolId: wishPool, id: id });
    const wishsData = getComponentValue(Wishes, key);

    if (!wishsData) {
      return;
    }
    const wishInfo = {
      wisher: wishsData.wisher,
      wishContent: wishsData.wishContent,
      wishTime: wishsData.wishTime
    }

    return wishInfo;
  }

  const wishCountData = useComponentValue(components.WishCount, singletonEntity);

  useEffect(() => {

    if (!wishCountData || wishCountData.count <= 0n) {
      return;
    }

    const wishCount = Number(wishCountData.count);
    if (wishCount <= oldWishCount || oldWishCount == -1) {
      return;
    }
    const wishInfo = fetchOneWish(wishCount);
    if (!wishInfo) {
      return;
    }
    console.log(wishInfo);

    wishInfoArr.current.push(wishInfo);
  }, [wishCountData, oldWishCount])


  const getWishCount = () => {
    const wishCountData = getComponentValue(components.WishCount, singletonEntity);
    if (!wishCountData || wishCountData.count <= 0n) {
      return 0;
    }
    const wishCount = Number(wishCountData.count);
    return wishCount;
  }

  useEffect(() => {
    function updateVisibleCount() {
      const leftHeight = leftRef.current?.clientHeight ?? 200;
      const rightHeight = rightRef.current?.clientHeight ?? 200;
      const minHeight = Math.min(leftHeight, rightHeight);
      const count = Math.floor(minHeight / ITEM_HEIGHT);
      setVisibleCount(count > 0 ? count : 1);
    }
    updateVisibleCount();
    window.addEventListener("resize", updateVisibleCount);
    return () => window.removeEventListener("resize", updateVisibleCount);
  }, []);

  const scrollOnce = async () => {
    setLeftOffset(-ITEM_HEIGHT);
    setRightOffset(-ITEM_HEIGHT);

    setTimeout(async () => {
      wishInfoArr.current.shift();
      wishInfoArr.current.shift();

      if (wishInfoArr.current.length < MAX_WISHES) {
        const newWish1 = popOneWish();
        const newWish2 = popOneWish();
        if (newWish1) {
          wishInfoArr.current.push(newWish1);
        }
        if (newWish2) {
          wishInfoArr.current.push(newWish2);
        }
      }
      setLeftOffset(0);
      setRightOffset(0);
    }, 500);
  };

  useEffect(() => {
    const interval = setInterval(scrollOnce, SCROLL_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  function shortenAddress(address: string) {
    return `${address.slice(0, 5)}...${address.slice(-4)}`;
  }

  return (
    <div className={styles.container}>
      <div className={styles.panel} ref={leftRef}>
        <div className={styles.scrollWindow}>
          <ul
            className={styles.list}
            style={{
              transform: `translateY(${leftOffset}px)`,
              transition: leftOffset === 0 ? "none" : "transform 0.5s ease",
            }}
          >
            {getLeftData().map((wish, i) => (
              <li key={i} className={styles.item}>
                <div className={styles.wishContent}>{wish.wishContent}</div>
                <div className={styles.wishMeta}>
                  <div className={styles.metaAddress}>
                    by {shortenAddress(wish.wisher)}
                  </div>
                  <div className={styles.metaTime}>
                    {format(new Date(Number(wish.wishTime) * 1000), "h:mma·MMM d, yyyy")}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className={styles.panel} ref={rightRef}>
        <div className={styles.scrollWindow}>
          <ul
            className={styles.list}
            style={{
              transform: `translateY(${rightOffset}px)`,
              transition: rightOffset === 0 ? "none" : "transform 0.5s ease",
            }}
          >
            {getRightData().map((wish, i) => (
              <li key={i} className={styles.item}>
                <div className={styles.wishContent}>{wish.wishContent}</div>
                <div className={styles.wishMeta}>
                  by {shortenAddress(wish.wisher)}
                  <span className={styles.metaTime}>
                    {format(new Date(Number(wish.wishTime) * 1000), "h:mma·MMM d,yyyy")}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
