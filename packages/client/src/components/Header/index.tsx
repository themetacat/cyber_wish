import { AccountButton } from "@latticexyz/entrykit/internal";
import styles from "./index.module.css";
import { useNavigate, useLocation } from "react-router-dom";

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();

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
          onClick={() => navigate("/my-wishes")} 
          className={`${styles.navItem} ${location.pathname === "/my-wishes" ? styles.selected : ""}`}
        >
          My Wishes
        </button>
        <div className={styles.connectButton}>
          <AccountButton />
        </div>
      </nav>
    </header>
  );
} 