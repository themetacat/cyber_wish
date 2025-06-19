import React, { useEffect, useState, useRef } from "react";
import styles from "./wishesPanel.module.css";
import { useComponentValue } from "@latticexyz/react";
import { components } from "../../mud/recs";
import { getComponentValue } from "@latticexyz/recs";
import { encodeEntity, singletonEntity } from "@latticexyz/store-sync/recs";
import { WISH_POOL_ID } from "../../utils/contants";
import { pad } from "viem";
import { format } from "date-fns";


interface WishInfo {
  wisher: string;
  wishContent: string;
  wishTime: number;
}

const MAX_WISHES = 30;
const SPEED = 0.5;

export default function WishesPanel() {
  const leftRef = useRef<HTMLUListElement>(null);
  const rightRef = useRef<HTMLUListElement>(null);
  const wishInfoArrLeft = useRef<WishInfo[]>([]);
  const wishInfoArrRight = useRef<WishInfo[]>([]);
  const [leftOffset, setLeftOffset] = useState(0);
  const [rightOffset, setRightOffset] = useState(0);
  const lastFetchIndexRef = useRef<number>(0);
  const [oldWishCount, setOldWishCount] = useState(-1);
  const Wishes = components.Wishes;
  const lastAddedSideRef = useRef<'left' | 'right'>('right');

  useEffect(() => {
    const wishCount = getWishCount();
    // lastFetchIndexRef.current = wishCount;

    const fetchInitialWishes = () => {
      let turn = 0;
      // for (let index = wishCount; index >= wishCount - MAX_WISHES && index > 0; index--) {
      for (let index = wishCount; index >= wishCount - MAX_WISHES; index--) {

        const wishInfo = popOneWish();
        if (wishInfo) {
          if (turn === 0) {
            wishInfoArrLeft.current.push(wishInfo);
          } else {
            wishInfoArrRight.current.push(wishInfo);
          }
          turn = 1 - turn;
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
    const key = encodeEntity(Wishes.metadata.keySchema, { poolId: WISH_POOL_ID, id: id });
    const wishData = getComponentValue(Wishes, key);

    if (!wishData) {
      return;
    }
    const wishInfo = {
      wisher: wishData.wisher,
      wishContent: wishData.wishContent,
      wishTime: Number(wishData.wishTime)
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

    const sides: ('left' | 'right')[] =
      lastAddedSideRef.current === 'right' ? ['left', 'right'] : ['right', 'left'];

    for (const side of sides) {
      const len = side === 'left' ? wishInfoArrLeft.current.length : wishInfoArrRight.current.length;
      if (len < 40) {
        if (side === 'left') {
          wishInfoArrLeft.current.push(wishInfo);
        } else {
          wishInfoArrRight.current.push(wishInfo);
        }
        lastAddedSideRef.current = side;
        break;
      }
    }
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
    let animationFrameId: number;
    let currentOffset = 0;

    const animate = () => {
      currentOffset -= SPEED;

      const container = leftRef.current;
      const firstItem = container?.children[0] as HTMLElement | undefined;
      if (firstItem && Math.abs(currentOffset) >= firstItem.offsetHeight) {
        const consumedHeight = firstItem.offsetHeight;

        wishInfoArrLeft.current.shift();
        if (wishInfoArrLeft.current.length < MAX_WISHES / 2) {
          const newWish = popOneWish();
          if (newWish) wishInfoArrLeft.current.push(newWish);
        }
        currentOffset += consumedHeight + 25;
      }

      setLeftOffset(currentOffset);
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  useEffect(() => {
    let animationFrameId: number;
    let currentOffset = 0;

    const animate = () => {
      currentOffset -= SPEED;

      const container = rightRef.current;
      const firstItem = container?.children[0] as HTMLElement | undefined;
      if (firstItem && Math.abs(currentOffset) >= firstItem.offsetHeight) {
        const consumedHeight = firstItem.offsetHeight;

        wishInfoArrRight.current.shift();
        if (wishInfoArrRight.current.length < MAX_WISHES / 2) {
          const newWish = popOneWish();
          if (newWish) wishInfoArrRight.current.push(newWish);
        }
        currentOffset += consumedHeight + 25;
      }

      setRightOffset(currentOffset);
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);


  // useEffect(() => {
  //   function updateVisibleCount() {
  //     const leftHeight = leftRef.current?.clientHeight ?? 200;
  //     const rightHeight = rightRef.current?.clientHeight ?? 200;
  //     const minHeight = Math.min(leftHeight, rightHeight);
  //     const count = Math.floor(minHeight / ITEM_HEIGHT);
  //     setVisibleCount(count > 0 ? count : 1);
  //   }
  //   updateVisibleCount();
  //   window.addEventListener("resize", updateVisibleCount);
  //   return () => window.removeEventListener("resize", updateVisibleCount);
  // }, []);


  function shortenAddress(address: string) {
    return `${address.slice(0, 5)}...${address.slice(-4)}`;
  }

  return (
    <div className={styles.container}>
      <div className={styles.panel}>
        <div className={styles.scrollWindow}>
          <ul
            ref={leftRef}
            className={styles.list}
            style={{
              transform: `translateY(${leftOffset}px)`,
              transition: "none",
            }}
          >
            {wishInfoArrLeft.current.map((wish, i) => (
              <li key={i} className={styles.item}>
                <div className={styles.wishContent}>{wish.wishContent}</div>
                <div className={styles.wishMeta}>
                  <div className={styles.metaAddress}>
                    By {shortenAddress(wish.wisher)}
                  </div>
                  <div className={styles.metaTime}>
                    {format(new Date(wish.wishTime * 1000), "h:mma·MMMd,yyyy")}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className={styles.panel}>
        <div className={styles.scrollWindow}>
          <ul
            ref={rightRef}
            className={styles.list}
            style={{
              transform: `translateY(${rightOffset}px)`,
              transition: "none",
            }}
          >
            {wishInfoArrRight.current.map((wish, i) => (
              <li key={i} className={styles.item}>
                <div className={styles.wishContent}>{wish.wishContent}</div>
                <div className={styles.wishMeta}>
                  by {shortenAddress(wish.wisher)}
                  <span className={styles.metaTime}>
                    {format(new Date(wish.wishTime * 1000), "h:mm a·MMM d,yyyy")}
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
