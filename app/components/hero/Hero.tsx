import { HeroCopy } from "./HeroCopy";
import { SiteHeader } from "./SiteHeader";
import { StickerField } from "./StickerField";
import styles from "./Hero.module.css";

export function Hero() {
  return (
    <section className={styles.hero} aria-labelledby="hero-title" data-hero>
      <SiteHeader />
      <StickerField />
      <HeroCopy />
    </section>
  );
}
