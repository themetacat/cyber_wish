import { AccountButton, useAccountModal } from "@latticexyz/entrykit/internal";
import styles from "./index.module.css";
import { useNavigate, useLocation } from "react-router-dom";
import { useAccount } from "wagmi";
import { useState } from "react";
import MyFateGifts from "../Fate/myFateGifts";
import { useDisconnect } from 'wagmi'

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { openAccountModal } = useAccountModal();
  const { address } = useAccount();
  const [showMyFateGifts, setShowMyFateGifts] = useState(false);
  const { disconnect } = useDisconnect()

  const handleMyWishesClick = () => {
    if (!address) {
      openAccountModal();
    } else {
      navigate("/my-wishes");
    }
  };

  return (
    <header className={styles.header}>
      <div className={styles.logo} onClick={() => navigate("/")}>
        <img src="/images/Header/Logo.webp" alt="Cyber Wish" />
      </div>
      <nav className={styles.nav}>
        <button
          onClick={() => navigate("/wishing-wall")}
          className={`${styles.navItem} ${location.pathname === "/wishing-wall" ? styles.selected : ""}`}
        >
          Wishing Wall
        </button>
        <button
          onClick={() => navigate("/wishflow-fund")}
          className={`${styles.navItem} ${location.pathname === "/wishflow-fund" ? styles.selected : ""}`}
        >
          Wishflow Fund
        </button>
        <div className={styles.connectButton}>
          <AccountButton />
          {
            address && <div className={styles.dropdown}>
              <div className={styles.dropdownItem} style={{ paddingTop: "15px" }} onClick={handleMyWishesClick}>My Wishes</div>
              <div className={styles.dropdownItem} style={{ lineHeight: "30px" }} onClick={() => setShowMyFateGifts(!showMyFateGifts)}>My Wish Rewards</div>
              <div className={styles.dropdownItem} style={{ paddingBottom: "15px" }} onClick={() => disconnect()}>Disconnect</div>
            </div>
          }
        </div>
      </nav>
      {showMyFateGifts && <MyFateGifts onClose={() => setShowMyFateGifts(false)} />}
    </header>
  );
} 