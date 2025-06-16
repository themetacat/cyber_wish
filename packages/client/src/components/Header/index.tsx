import styles from "./index.module.css";
import { useNavigate, useLocation } from "react-router-dom";
import { useAccount } from "wagmi";
import { useState, useRef, useEffect } from "react";
import MyFateGifts from "../Fate/myFateGifts";
import { useDisconnect } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { supportedChains } from "../../wagmiConfig";
import { useDetectedChainId } from "../../common";

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { address } = useAccount();
  const [showMyFateGifts, setShowMyFateGifts] = useState(false);
  const { disconnect } = useDisconnect();
  const [isBGMPlaying, setIsBGMPlaying] = useState(false);
  const bgmAudioRef = useRef<HTMLAudioElement | null>(null);
  const chainId = useDetectedChainId();
  
  const isSupportedChain = chainId ? supportedChains.includes(chainId) : false;
  
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
      navigate("/my-wishes");
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
        <div className={styles.connectButton}>
          <ConnectButton.Custom>
            {({
              account,
              chain,
              openAccountModal,
              openChainModal,
              openConnectModal,
              authenticationStatus,
              mounted,
            }) => {
              const ready = mounted && authenticationStatus !== 'loading';
              const connected =
                ready &&
                account &&
                chain &&
                (!authenticationStatus ||
                  authenticationStatus === 'authenticated');

              return (
                <div
                  {...(!ready && {
                    'aria-hidden': true,
                    'style': {
                      opacity: 0,
                      pointerEvents: 'none',
                      userSelect: 'none',
                    },
                  })}
                  
                >
                  {(() => {
                    if (!connected) {
                      return (
                        <button onClick={openConnectModal} type="button" className={styles.navItem}>
                          Connect Wallet
                        </button>
                      );
                    }
                    if (chain.unsupported) {
                      return (
                        <button onClick={openChainModal} type="button" className={styles.navItem}>
                          Wrong network
                        </button>
                      );
                    }
                    return (
                      <button onClick={openAccountModal} type="button" className={styles.navItem}>
                        {account.displayName}
                        {account.displayBalance
                          ? ` (${account.displayBalance})`
                          : ''}
                      </button>
                    );
                  })()}
                </div>
              );
            }}
          </ConnectButton.Custom>

          {
            address && isSupportedChain && <div className={styles.dropdown}>
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