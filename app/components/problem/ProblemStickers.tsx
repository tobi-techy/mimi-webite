"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { PROBLEM_STICKERS, SCATTER_SIZE } from "@/app/lib/stickers/scatter";
import styles from "./ProblemStickers.module.css";

const FALL_EASING = "cubic-bezier(.45, .05, .75, .6)";
const IMPACT_EASING = "cubic-bezier(.2, 1.4, .4, 1)";
const STAGGER_MS = 130;
const PHONE_MAX = 640;
/* A passing cursor nudges these stickers aside and they ease back. */
const POKE_REACH = 210;
const POKE_SHIFT = 52;

type ScatterStyle = CSSProperties & {
  "--x": number;
  "--w": string;
  "--h": string;
  "--rest": string;
  "--scatter-inset": string;
};

export function ProblemStickers() {
  const fieldRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const field = fieldRef.current;
    const section = field?.closest<HTMLElement>("[data-problem]");
    if (!field || !section) return;

    const items = Array.from(field.querySelectorAll<HTMLElement>("[data-scatter]"));
    if (!items.length) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const phone = window.matchMedia(`(max-width: ${PHONE_MAX - 0.02}px)`);

    const place = () => {
      const visible = PROBLEM_STICKERS.map((sticker) => !phone.matches || Boolean(sticker.phone));
      items.forEach((el, i) => {
        el.hidden = !visible[i];
        if (!visible[i]) return;
        const body = el.firstElementChild as HTMLElement | null;
        if (!body) return;
        body.getAnimations().forEach((animation) => animation.cancel());
        if (reduced.matches) return;
        /* Each falls from above the section's top edge, so they read as stickers
         * dropping out of the hero and landing on this one. */
        const from = el.offsetTop + el.offsetHeight + 60;
        body.animate(
          [
            {
              opacity: 0,
              transform: `translate3d(0, ${-from}px, 0) rotate(${el.dataset.angle}deg)`,
              easing: FALL_EASING,
            },
            { opacity: 1, transform: "translate3d(0, 9px, 0) rotate(0deg)", offset: 0.82, easing: IMPACT_EASING },
            { transform: "translate3d(0, -3px, 0) rotate(0deg)", offset: 0.92, easing: "ease-out" },
            { transform: "none" },
          ],
          { duration: 900, delay: i * STAGGER_MS, fill: "backwards" },
        );
      });
    };

    const landing = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        place();
        landing.disconnect();
      },
      { rootMargin: "0px 0px -40% 0px" },
    );
    landing.observe(section);
    phone.addEventListener("change", place);

    const poke = (event: PointerEvent) => {
      if (reduced.matches || event.buttons > 0) return;
      const box = section.getBoundingClientRect();
      const px = event.clientX - box.left;
      const py = event.clientY - box.top;
      for (const el of items) {
        const body = el.firstElementChild as HTMLElement | null;
        if (!body || el.hidden) continue;
        const dx = el.offsetLeft + el.offsetWidth / 2 - px;
        const dy = el.offsetTop + el.offsetHeight / 2 - py;
        const distance = Math.hypot(dx, dy);
        if (distance > POKE_REACH) {
          if (body.style.transform) body.style.transform = "";
          continue;
        }
        const falloff = Math.pow(1 - distance / POKE_REACH, 1.5);
        const nx = dx / (distance || 1);
        const ny = dy / (distance || 1);
        body.style.transform = `translate3d(${(nx * POKE_SHIFT * falloff).toFixed(1)}px, ${(ny * POKE_SHIFT * falloff).toFixed(1)}px, 0) rotate(${(nx * 9 * falloff).toFixed(1)}deg)`;
      }
    };

    const release = () => {
      for (const el of items) {
        const body = el.firstElementChild as HTMLElement | null;
        if (body?.style.transform) body.style.transform = "";
      }
    };

    section.addEventListener("pointermove", poke, { passive: true });
    section.addEventListener("pointerleave", release, { passive: true });

    return () => {
      landing.disconnect();
      phone.removeEventListener("change", place);
      section.removeEventListener("pointermove", poke);
      section.removeEventListener("pointerleave", release);
    };
  }, []);

  return (
    <div ref={fieldRef} className={styles.field} aria-hidden="true">
      {PROBLEM_STICKERS.map((sticker) => {
        const style: ScatterStyle = {
          "--x": sticker.x,
          "--w": `${sticker.aspect >= 1 ? SCATTER_SIZE : Math.round(SCATTER_SIZE * sticker.aspect)}px`,
          "--h": `${sticker.aspect >= 1 ? Math.round(SCATTER_SIZE / sticker.aspect) : SCATTER_SIZE}px`,
          "--rest": `${sticker.rotation}deg`,
          "--scatter-inset": `${sticker.inset}px`,
          ...(sticker.anchor === "top" ? { top: "var(--scatter-inset)" } : { bottom: "var(--scatter-inset)" }),
        };
        return (
          <div
            key={sticker.id}
            data-scatter={sticker.id}
            data-angle={sticker.fallAngle}
            className={styles.sticker}
            style={style}
          >
            <span className={styles.body}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className={styles.image} src={sticker.src} alt="" draggable={false} />
            </span>
          </div>
        );
      })}
    </div>
  );
}
