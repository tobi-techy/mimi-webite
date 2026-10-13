import Link from "next/link";
import styles from "./Brand.module.css";

export function Brand() {
  return (
    <Link className={styles.brand} href="/" aria-label="Miriam, home">
      <span className={styles.mark} aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 20 20">
          <rect x="3.5" y="10" width="2.6" height="7" rx="0.8" fill="currentColor" />
          <rect x="8.7" y="6.5" width="2.6" height="10.5" rx="0.8" fill="currentColor" />
          <rect x="13.9" y="3" width="2.6" height="14" rx="0.8" fill="currentColor" />
        </svg>
      </span>
      Miriam
    </Link>
  );
}
