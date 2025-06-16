import { AccountButton, useAccountModal } from "@latticexyz/entrykit/internal";
import styles from "./index.module.css";
import { useNavigate, useLocation } from "react-router-dom";
import { useAccount } from "wagmi";
import { useState, useRef, useEffect } from "react";
import MyFateGifts from "../Fate/myFateGifts";
import { useDisconnect } from 'wagmi'
import { shortenAddress } from "../../utils/common";

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { openAccountModal } = useAccountModal();
  const { address } = useAccount();
  const [showMyFateGifts, setShowMyFateGifts] = useState(false);
  const { disconnect } = useDisconnect();
  const [isBGMPlaying, setIsBGMPlaying] = useState(false);
  const bgmAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initialize background music
    bgmAudioRef.current = new Audio('/audio/BGM.mp3');
    bgmAudioRef.current.loop = true;
    bgmAudioRef.current.volume = 0.5;

    // Add click event listener to the document
    const handleFirstInteraction = () => {
      if (bgmAudioRef.current && !isBGMPlaying) {
        bgmAudioRef.current.play();
        setIsBGMPlaying(true);
      }
      // Remove the event listener after first interaction
      document.removeEventListener('click', handleFirstInteraction);
    };

    document.addEventListener('click', handleFirstInteraction);

    return () => {
      if (bgmAudioRef.current) {
        bgmAudioRef.current.pause();
        bgmAudioRef.current.currentTime = 0;
      }
      document.removeEventListener('click', handleFirstInteraction);
    };
  }, []);

  const toggleBGM = () => {
    if (bgmAudioRef.current) {
      if (isBGMPlaying) {
        bgmAudioRef.current.pause();
      } else {
        bgmAudioRef.current.play();
      }
      setIsBGMPlaying(!isBGMPlaying);
    }
  };

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
        <img src="/images/Header/logo.png" alt="Cyber Wish" />
      </div>
      <nav className={styles.nav}>
        <button
            onClick={() => navigate("/")}
            className={styles.navItem}
          >
          Home
        </button>
        <button
          onClick={() => navigate("/wishing-wall")}
          className={`${styles.navItem} ${location.pathname === "/wishing-wall" ? styles.selected : ""}`}
        >
          Wishing Wall
        </button>
        <button
          onClick={() => navigate("/wishflow-rewards")}
          className={`${styles.navItem} ${location.pathname === "/wishflow-rewards" ? styles.selected : ""}`}
        >
          Wishflow Rewards
        </button>
        {/* <button
          onClick={() => navigate("/about")}
          className={`${styles.navItem} ${location.pathname === "/about" ? styles.selected : ""}`}
        >
          About
        </button> */}
        <div className={styles.connectButton}>
          {/* <AccountButton /> */}
          {
            address &&  <span style={{color: "#F8E49C"}}>{shortenAddress(address)}</span>
          }
         
          {
            address && <div className={styles.dropdown}>
              <div className={styles.dropdownItem} style={{ paddingTop: "15px" }} onClick={handleMyWishesClick}>My Wishes</div>
              <div className={styles.dropdownItem} style={{ lineHeight: "30px" }} onClick={() => setShowMyFateGifts(!showMyFateGifts)}>My Wish Rewards</div>
              <div className={styles.dropdownItem} style={{ paddingBottom: "15px" }} onClick={() => disconnect()}>Disconnect</div>
            </div>
          }
        </div>
        <button className={styles.bgmButton} onClick={toggleBGM}>
          <img 
            src={isBGMPlaying ? "/images/BGMOn.png" : "/images/BGMOff.png"} 
            alt={isBGMPlaying ? "Turn off BGM" : "Turn on BGM"} 
          />
        </button>
      </nav>
      {showMyFateGifts && <MyFateGifts onClose={() => setShowMyFateGifts(false)} />}
    </header>
  );
} 