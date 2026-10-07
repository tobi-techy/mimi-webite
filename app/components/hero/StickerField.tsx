"use client";

import { useEffect, useRef } from "react";
import { StickerEngine } from "@/app/lib/stickers/engine";
import styles from "./StickerField.module.css";

const FONT_WAIT_MS = 1500;

export function StickerField() {
  const fieldRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const field = fieldRef.current;
    const hero = field?.closest<HTMLElement>("[data-hero]");
    if (!field || !hero) return;

    let engine: StickerEngine | null = null;
    let cancelled = false;
    const fontsReady = Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, FONT_WAIT_MS))]);

    fontsReady.then(() => {
      if (cancelled) return;
      engine = new StickerEngine(hero, field, {
        sticker: styles.sticker,
        body: styles.body,
        image: styles.image,
        awake: styles.awake,
        grabbed: styles.grabbed,
      });
    });

    return () => {
      cancelled = true;
      engine?.destroy();
    };
  }, []);

  return <div ref={fieldRef} className={styles.field} aria-hidden="true" />;
}
