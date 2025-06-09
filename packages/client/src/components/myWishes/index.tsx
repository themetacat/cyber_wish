import { useEffect, useState, useRef, useMemo, useCallback } from "react";
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
import { useAccountModal } from "@latticexyz/entrykit/internal";

interface WishData {
  wisher: string;
  wishContent: string;
  wishTime: number;
  propId: number;
}

interface ApiWishData {
  wisher: string;
  wish_content: string;
  wish_time: number;
  prop_id: number;
}


export default function MyWishes() {
  const [wishes, setWishes] = useState<WishData[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const [wishCount, setWishCount] = useState(0);
  const firstFetch = useRef(false);
  const [wishPoints, setWishPoints] = useState(0);
  const { address: userAddress } = useAccount();
  const [showMyFateGifts, setShowMyFateGifts] = useState(false);
  const { openAccountModal } = useAccountModal();
  const Wisher = components.Wisher;
  const loadPage = useRef<number>(1);
  const pageSize = 5;

  const wisherKey = useMemo(() => {
    if (!WISH_POOL_ID) return null;

    if (!userAddress) {
      setWishes([]);
      openAccountModal();
      return;
    }

    return encodeEntity(Wisher.metadata.keySchema, {
      poolId: WISH_POOL_ID,
      wisher: userAddress,
    });
  }, [userAddress, Wisher, openAccountModal]);

  const wisherData = useMemo(() => {
    if (!wisherKey) return null;
    return getComponentValue(Wisher, wisherKey);
  }, [Wisher, wisherKey]);

  useEffect(() => {
    if (!wisherData) {
      setWishCount(0);
      setWishPoints(0);
      setWishes([]);
      return;
    }
    setWishCount(Number(wisherData.wishCount));
    setWishPoints(Number(wisherData.points))
  }, [wisherData])

  const loadWishes = useCallback(async () => {

    if (loading || !hasMore || !userAddress) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        wisher: userAddress ?? '',
        page: String(loadPage.current ?? 1),
        pageSize: String(pageSize ?? 20),
      });
      const res = await fetch('/api/get_wishes_by_wisher?' + params)
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const jsonRes = await res.json();
      if (jsonRes.success) {
        const totalData = jsonRes.data;
        if (totalData.length < pageSize) {
          setHasMore(false);
        } else {
          loadPage.current += 1;
        }
        const newWishes: WishData[] = totalData.map((data: ApiWishData) => ({
          wisher: data.wisher,
          wishContent: data.wish_content,
          wishTime: data.wish_time,
          propId: data.prop_id
        }));
        setWishes((prev) => [...prev, ...newWishes]);
      } else {
        console.error('API Error:', jsonRes.error);
      }
    } catch (err) {
      console.error('error:', err);
    } finally {
      setLoading(false);
    }
  }, [userAddress, pageSize, hasMore, loading]);

  useEffect(() => {
    if (firstFetch.current) return;
    loadWishes();
    firstFetch.current = true;
  }, [loadWishes]);

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
  }, [loadWishes]);

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
