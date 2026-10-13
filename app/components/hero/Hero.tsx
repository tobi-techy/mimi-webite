import { HeroCopy } from "./HeroCopy";
import { StickerField } from "./StickerField";
import styles from "./Hero.module.css";

export function Hero() {
  return (
    <section className={styles.hero} aria-labelledby="hero-title" data-hero>
      <StickerField />
      <HeroCopy />
    </section>
  );
}
