import React from "react";
import styles from "./index.module.css";

const Footer = () => {
  return (
    <div className={styles.footer}>
      <div className={styles.socialIcons}>
        <a href="https://www.notion.so/Q-A-CyberWish-209d5656f3d980e0af0ef0bfed4aa355" target="_blank" rel="noopener noreferrer">
          <img src="/images/About/QA_logo.png" alt="Q&A logo" style={{width: "40px", height: "40px"}}/>
        </a>
        <a href="https://t.me/+5h_pImEEEmU3NTRl" target="_blank" rel="noopener noreferrer">
          <img src="/images/About/Tg_logo.png" alt="Telegram logo" />
        </a>
        <a href="https://x.com/0xCyberWish" target="_blank" rel="noopener noreferrer">
          <img src="/images/About/X_logo.png" alt="X logo" />
        </a>
      </div>
    </div>
  );
};

export default Footer; 