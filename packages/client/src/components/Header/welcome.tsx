import styles from "./welcome.module.css";
import { useState, useRef, useEffect } from "react";
import commonStyles from "../common/common.module.css";


interface Props {
    onClose: () => void;
}

export default function Welcome({ onClose }: Props) {
    return (
        <div className={styles.container}>
            <div className={styles.title}>WELCOME!</div>
            <div className={commonStyles.divider} />

            <div className={styles.module}>
                <div className={styles.moduleHeader}>
                    <img src="/images/Header/Welcome/Hands.webp" alt="hands" className={styles.iconHand} />
                    <span className={styles.moduleTitle}>Make A Wish</span>
                </div>
                <div className={styles.moduleContent}>
                    Leave your wish on-chain,<br /> and earn Wish Points (WP)!
                </div>
            </div>

            <div className={styles.module}>
                <div className={styles.moduleHeader}>
                    <img src="/images/Header/Welcome/Gift.webp" alt="gift" className={styles.iconGift} />
                    <span className={styles.moduleTitle}>Two Prize Pools</span>
                </div>
                <div className={styles.moduleContent}>
                    Two prize pools for every day. <br /> Winners are drawn daily at 8 PM(UTC+8) <br /> Your WP and luck both matter.
                </div>
            </div>
            <button className={commonStyles.closeButton} onClick={() => onClose()}>
                <img src="/images/wish/WishPanel/Close.webp" alt="Close" />
            </button>
            <img src="/images/Header/Welcome/WelcomeHandBg.webp" alt="WelcomeHandBg" className={styles.cornerImage} />

        </div>
    );
} 