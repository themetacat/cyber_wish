import { AccountButton } from "@latticexyz/entrykit/internal";
import { Direction, Entity } from "../common";
import mudConfig from "contracts/mud.config";
import { useMemo, useState } from "react";
import { useWorldContract } from "../mud/useWorldContract";
import { Synced } from "./mud/Synced";
import { useSync } from "@latticexyz/store-sync/react";
import styles from "./index.module.css";
import WishPanel from "./wish/WishPanel";
import WishesPanel from "./wish/wishesPanel";
import WishingWall from "./wishWall";
import MyWishes from "./MyWishes";
import WishResult from "./wish/wishResult";
import FateGifts from "./Fate/fateGifts";
import Header from "./Header";
import { useLocation } from "react-router-dom";

export default function Main() {
  const [wishStatus, setWishStatus] = useState(false);
  const location = useLocation();

  const sync = useSync();
  const worldContract = useWorldContract();
  const wishPool = "0x0000000000000000000000000000000000000000000000000000000000000001" as `0x${string}`;

  const wish = useMemo(
    () =>
      sync.data && worldContract
        ? async (incenseId: number, blindBoxId: number, wishContent: string, value: number) => {
          console.log("incenseId:", incenseId);
          console.log("blindBoxId:", blindBoxId);
          console.log("wishContent:", wishContent);

          const tx = await worldContract.write.cyberwish__wish([wishPool, BigInt(incenseId), BigInt(blindBoxId), wishContent], { value: BigInt((value * 1e18).toFixed(0)) });
          console.log("tx", tx);
          const res = await sync.data.waitForTransaction(tx);
          worldContract.simulate.cyberwish__wish([wishPool, BigInt(incenseId), BigInt(blindBoxId), wishContent], { value: BigInt(Math.floor(value * 1e18)) });
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
          const tx = await worldContract.write.cyberwish__BoostWisherByPoints([wishPool, BigInt(5)]);
          console.log("tx", tx);
          console.log(await sync.data.waitForTransaction(tx));
          const simulateRes = await worldContract.simulate.cyberwish__BoostWisherByPoints([wishPool, BigInt(1)]);
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
          const tx = await worldContract.write.cyberwish__BoostWisherByStar([wishPool, BigInt(5)]);
          console.log("tx", tx);
          console.log(await sync.data.waitForTransaction(tx));
          const simulateRes = await worldContract.simulate.cyberwish__BoostWisherByStar([wishPool, BigInt(1)]);
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
        {/* <WishPanel wish={wish} setWishStatus={setWishStatus} /> */}
        {/* <WishesPanel /> */}
        {/* <WishingWall /> */}
        {location.pathname === "/" && <WishesPanel />}
        {location.pathname === "/wishing-wall" && <WishingWall />}
        {location.pathname === "/my-wishes" && <MyWishes />}
        {location.pathname === "/fates-gifts" && <FateGifts/>}
        <WishResult wishStatus={wishStatus}/>
      </div>
    </>
  );
}
