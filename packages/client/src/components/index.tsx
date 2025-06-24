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
import { parseEther } from "viem";
import Welcome from "./Header/welcome";


export default function Main() {
  const [wishStatus, setWishStatus] = useState(false);
  const [showWelcomePage, setShowWelcomePage] = useState(true);
  const location = useLocation();
  const { address } = useAccount(); // Get the connected address

  const sync = useSync();
  const worldContract = useWorldContract();

  const wish = useMemo(
    () =>
      sync.data && worldContract
        ? async (incenseId: number, blindBoxId: number, wishContent: string, value: number) => {
          const tx = await worldContract.write.cyberwish__wish([WISH_POOL_ID
            , BigInt(incenseId), BigInt(blindBoxId), wishContent], { value: parseEther(value.toString()), gas: 2000000n, });
          const res = await sync.data.waitForTransaction(tx);
          if (res && res.status != "success") {
            await worldContract.simulate.cyberwish__wish([WISH_POOL_ID, BigInt(incenseId), BigInt(blindBoxId), wishContent], { value: parseEther(value.toString()) });
          }
          return res;
        }
        : undefined,
    [sync.data, worldContract],
  );

  return (
    <>
      <div className={styles.container}>
        <Header />
        {showWelcomePage && <Welcome onClose={() => setShowWelcomePage(false)} />}
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
