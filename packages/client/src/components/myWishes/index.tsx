import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import styles from "./index.module.css";
import commonStyles from "../common/common.module.css";
import wishWallStyles from "../wishWall/index.module.css";
import { components } from "../../mud/recs";
import { getComponentValue } from "@latticexyz/recs";
import { encodeEntity } from "@latticexyz/store-sync/recs";
import { WISH_POOL_ID } from "../../utils/contants";
import { format } from "date-fns";
import { propsData } from "../../utils/propsData";
import { shortenAddress } from "../../utils/common";
import MyFateGifts from "../Fate/myFateGifts";
import { useAccount } from "wagmi";
import { apiServer } from "../../common";
import { useConnectModal } from '@rainbow-me/rainbowkit';

interface WishData {
  wisher: string;
  wishContent: string;
  wishTime: number;
  propId: number;
  pointsIncense: number;
  pointsBlindBox: number;
  pointsIncenseEasterEgg: number;
  pointsBlindBoxEasterEgg: number;
}

interface ApiWishData {
  wisher: string;
  wish_content: string;
  wish_time: number;
  prop_id: number;
  points_incense: number;
  points_blind_box: number;
  points_incense_easter_egg: number;
  points_blind_box_easter_egg: number;
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
  const { openConnectModal } = useConnectModal();
  const Wisher = components.Wisher;
  const loadPage = useRef<number>(1);
  const pageSize = 8;

  useEffect(() => {
    setWishes([]);
    if (!userAddress) {
      if (openConnectModal) {
        openConnectModal();
      }
    }
  }, [userAddress, openConnectModal]);

  const wisherKey = useMemo(() => {
    if (!WISH_POOL_ID || !userAddress) return null;

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
        address: userAddress ?? '',
        page: String(loadPage.current ?? 1),
        pageSize: String(pageSize ?? 20),
      });
      const res = await fetch(apiServer + '/api/cyberwish/get_wishes_by_wisher?' + params)
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
          propId: data.prop_id,
          pointsIncense: data.points_incense,
          pointsBlindBox: data.points_blind_box,
          pointsIncenseEasterEgg: data.points_incense_easter_egg,
          pointsBlindBoxEasterEgg: data.points_blind_box_easter_egg
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
       <div className={commonStyles.divider} />
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
      <div className={commonStyles.divider} />
      <br />
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

              <div className={wishWallStyles.wishInteractData}>
                <div data-tooltip="Coming Soon"><img src="/images/wishWall/Worship.webp" alt="Worship" /></div>
                <div data-tooltip="Coming Soon"><img src="/images/wishWall/Msg.webp" alt="Message" /></div>
                <div data-tooltip="Wish Point(WP)">
                  <img src="/images/wishWall/Points.webp" alt="Points" />
                  {item.pointsIncense + item.pointsBlindBox + item.pointsIncenseEasterEgg + item.pointsBlindBoxEasterEgg}
                </div>
              </div>
            </div>

            <img
              src={propsData[item.propId].imageUrl}
              className={styles.image}
              alt="blessing item"
            />
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
        ))}
        {loading && (
          <div className={commonStyles.loading}>
            <img src="/images/wishWall/Loading.webp" alt="Loading..." />
          </div>
        )}

        {!hasMore && (
          <div className={wishWallStyles.notHasMore}>
            <span>
              <img src="/images/wishWall/NotHasMore.png" alt="notHasMore" />
            </span>
            <span>You've reached the end!</span>
          </div>
        )}
      </div>
      {showMyFateGifts && <MyFateGifts onClose={() => setShowMyFateGifts(false)} />}
    </div>
  );
}
