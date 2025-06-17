import { useMemo, useState } from "react";
import { useWorldContract } from "../mud/useWorldContract";
import { useSync } from "@latticexyz/store-sync/react";
import styles from "./index.module.css";
import WishPanel from "./wish/WishPanel";
import WishesPanel from "./wish/wishesPanel";
import WishingWall from "./wishWall";
import MyWishes from "./myWishes";
import WishResult from "./wish/wishResult";
import { MyIncenseCarousel } from './wish/myIncenseCarousel';
import FateGifts from "./Fate/fateGifts";
import Header from "./Header";
import Footer from "./Footer";
import About from "./About";
import { useLocation } from "react-router-dom";
import { WISH_POOL_ID } from "../utils/contants";
import { useAccount } from 'wagmi';


export default function Main() {
  const [wishStatus, setWishStatus] = useState(false);
  const location = useLocation();
  const { address } = useAccount(); // Get the connected address

  const sync = useSync();
  const worldContract = useWorldContract();

  const wish = useMemo(
    () =>
      sync.data && worldContract
        ? async (incenseId: number, blindBoxId: number, wishContent: string, value: number) => {
          console.log("incenseId:", incenseId);
          console.log("blindBoxId:", blindBoxId);
          console.log("wishContent:", wishContent);
          const tx = await worldContract.write.cyberwish__wish([WISH_POOL_ID
            , BigInt(incenseId), BigInt(blindBoxId), wishContent], { value: BigInt((value * 1e18).toFixed(0)), gas: 15000000n, });
          const res = await sync.data.waitForTransaction(tx);
          if (res && res.status != "success") {
            await worldContract.simulate.cyberwish__wish([WISH_POOL_ID, BigInt(incenseId), BigInt(blindBoxId), wishContent], { value: BigInt(Math.floor(value * 1e18)) });
          }
          return res;
        }
        : undefined,
    [sync.data, worldContract],
  );

  const boostByPoints = useMemo(
    () =>
      sync.data && worldContract
        ? async () => {
          console.log("boost points");
          const tx = await worldContract.write.cyberwish__BoostWisherByPoints([WISH_POOL_ID, BigInt(2)]);
          console.log("tx", tx);
          console.log(await sync.data.waitForTransaction(tx));
          const simulateRes = await worldContract.simulate.cyberwish__BoostWisherByPoints([WISH_POOL_ID, BigInt(1)]);
          console.log(simulateRes);
        }
        : undefined,
    [sync.data, worldContract],
  );

  const boostByStar = useMemo(
    () =>
      sync.data && worldContract
        ? async () => {
          console.log("boost star");
          const tx = await worldContract.write.cyberwish__BoostWisherByStar([WISH_POOL_ID, BigInt(2)]);
          console.log("tx", tx);
          console.log(await sync.data.waitForTransaction(tx));
          const simulateRes = await worldContract.simulate.cyberwish__BoostWisherByStar([WISH_POOL_ID, BigInt(3)]);
          console.log(simulateRes);
        }
        : undefined,
    [sync.data, worldContract],
  );

  return (
    <>
      <div className={styles.container}>
        <Header />
        {/* <button onClick={() => boostByStar()}>boost star</button>
        <br />
        <button onClick={() => boostByPoints()}>boost points</button> */}
        <WishPanel wish={wish} setWishStatus={setWishStatus} />
        {location.pathname === "/" && <WishesPanel />}
        {location.pathname === "/" && address && <MyIncenseCarousel />}
        {location.pathname === "/wishing-wall" && <WishingWall />}
        {location.pathname === "/my-wishes" && <MyWishes />}
        {location.pathname === "/wishflow-rewards" && <FateGifts/>}
        {location.pathname === "/about" && <About />}
        <WishResult wishStatus={wishStatus}/>
        <Footer />
      </div>
    </>
  );
}
