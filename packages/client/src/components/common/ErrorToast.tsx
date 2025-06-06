import { useEffect, useState } from 'react';
import styles from './ErrorToast.module.css';

interface ErrorToastProps {
  message: string;
  onClose: () => void;
}

export const ErrorToast = ({ message, onClose }: ErrorToastProps) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for fade out animation
    }, 2000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`${styles.errorToast} ${isVisible ? styles.visible : styles.hidden}`}>
      <span className={styles.warningIcon}>⚠️</span>
      {message}
    </div>
  );
}; 