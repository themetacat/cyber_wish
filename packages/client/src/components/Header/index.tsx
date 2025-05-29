import { AccountButton } from "@latticexyz/entrykit/internal";
import styles from "./index.module.css";
import { useNavigate } from "react-router-dom";

export default function Header() {
  const navigate = useNavigate();

  return (
    <header className={styles.header}>
      <div className={styles.logo} onClick={() => navigate("/")}>
        <img src="/images/Header/Logo.webp" alt="Cyber Wish" />
      </div>
      <nav className={styles.nav}>
        <button onClick={() => navigate("/wishing-wall")} className={styles.navItem}>
          Wishing Wall
        </button>
        <button onClick={() => navigate("/my-wishes")} className={styles.navItem}>
          My Wishes
        </button>
        <div className={styles.connectButton}>
          <AccountButton />
        </div>
      </nav>
    </header>
  );
} 