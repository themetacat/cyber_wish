import React from "react";
import styles from "./index.module.css";

const Footer = () => {
  return (
    <div className={styles.footer}>
      <div className={styles.socialIcons}>
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