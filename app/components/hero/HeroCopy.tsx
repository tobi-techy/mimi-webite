import { CtaButton } from "./CtaButton";
import styles from "./HeroCopy.module.css";

export function HeroCopy() {
  return (
    <div className={styles.content}>
      <h1 className={styles.headline} id="hero-title" data-safe-zone>
        Your business has
        <br className={styles.breakNarrowScreen} /> enough
        <br className={styles.breakWideScreen} /> to worry about.
      </h1>
      <p className={styles.sub} data-safe-zone>
        Your finances shouldn&apos;t be one.
      </p>
      <CtaButton className={styles.cta} data-safe-zone>
        Get started
      </CtaButton>
    </div>
  );
}
