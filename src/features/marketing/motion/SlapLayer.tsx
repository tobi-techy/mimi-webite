"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { slapStore } from "@/features/marketing/motion/slap-store";
import { STICKER_POOL } from "@/components/ui/Sticker";
import { cx } from "@/lib/cx";
import { prefersReducedMotion } from "@/lib/dom";
import { sfx } from "@/lib/sound";

type Slap = { id: number; left: number; top: number; w: number; r: number; src: string; out: boolean };

const MAX_SLAPS = 12;
const IGNORE = "a, button, input, select, textarea, label, summary, form, .x-nav, .x-k, .x-st";

/**
 * Tap to slap: a click on empty space drops a random sticker at the tap point. Slaps fade out
 * after 2.5s, at most 12 stay on screen, and the footer counts them. On signup and login only the
 * art panel takes slaps. Cleared on every route change.
 */
export function SlapLayer() {
  const pathname = usePathname();
  const [slaps, setSlaps] = useState<Slap[]>([]);
  const nextId = useRef(0);

  // a new page starts with a clean slate
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setSlaps([]);
  }

  useEffect(() => {
    const timers = new Set<number>();
    const later = (fn: () => void, ms: number) => {
      const id = window.setTimeout(() => {
        timers.delete(id);
        fn();
      }, ms);
      timers.add(id);
    };
    const remove = (id: number) => setSlaps((list) => list.filter((s) => s.id !== id));

    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button > 0) return;
      const target = e.target as Element | null;
      if (!target?.closest || target.closest(IGNORE)) return;
      if (String(window.getSelection?.() ?? "")) return;
      const site = document.getElementById("top");
      if (!site) return;
      if (site.classList.contains("is-signup") && !target.closest(".x-su__art")) return;
      const r = site.getBoundingClientRect();
      const small = window.innerWidth <= 640;
      const w = Math.round(small ? 44 + Math.random() * 26 : 80 + Math.random() * 70);
      const left = Math.min(Math.max(e.clientX - r.left, w / 2 + 6), r.width - w / 2 - 6);
      const slap: Slap = {
        id: nextId.current++,
        left,
        top: e.clientY - r.top,
        w,
        r: Math.round(Math.random() * 50 - 25),
        src: `/stickers/${STICKER_POOL[Math.floor(Math.random() * STICKER_POOL.length)]}.webp`,
        out: false,
      };
      setSlaps((list) => [...list, slap].slice(-MAX_SLAPS));
      slapStore.increment();
      sfx("stickers", "tap", { theme: "bubble" });
      later(() => {
        if (prefersReducedMotion()) return remove(slap.id);
        setSlaps((list) => list.map((s) => (s.id === slap.id ? { ...s, out: true } : s)));
        later(() => remove(slap.id), 520);
      }, 2500);
    };

    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("click", onClick);
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  return (
    <div className="x-slaps" id="slaps" aria-hidden="true">
      {slaps.map((s) => (
        <span
          key={s.id}
          className={cx("x-slap", s.out && "is-out")}
          style={{ left: s.left + "px", top: s.top + "px", "--sw": s.w + "px", "--r": s.r + "deg" }}
        >
          <img src={s.src} alt="" style={{ transform: "none" }} />
        </span>
      ))}
    </div>
  );
}
