import { useEffect, useState } from "react";
import styles from "./index.module.css";

export default function About() {
  const [showSocialIcons, setShowSocialIcons] = useState(false);

  useEffect(() => {
    const handleScroll = (e: Event) => {
      const container = e.target as HTMLElement;
      const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 1;
      setShowSocialIcons(isAtBottom);
    };

    const container = document.querySelector(`.${styles.imgScrollContainer}`);
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  return (
    <div className={styles.pageContainer}>
      <div className={styles.imgScrollContainer}>
        <img src="/images/About/Main.png" alt="About page main image" />
      </div>
      <div className={`${styles.socialIcons} ${showSocialIcons ? styles.visible : ''}`}>
        <a href="https://www.notion.so/Q-A-CyberWish-209d5656f3d980e0af0ef0bfed4aa355" target="_blank" rel="noopener noreferrer">
          <img src="/images/About/QA_logo.png" alt="Q&A logo"/>
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
}