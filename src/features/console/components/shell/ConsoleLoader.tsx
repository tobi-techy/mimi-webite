"use client";

import { useEffect, useState } from "react";
import { CONSOLE_LOADER_MS } from "@/features/console/config";

const FADE_MS = 200;

/**
 * "Opening your book": shown on the first console visit of a session. The boot script decides
 * before paint (`html.c-loading`, skipped under reduced motion); this fills the bar and removes it.
 */
export function ConsoleLoader() {
  const [filled, setFilled] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    if (!root.classList.contains("c-loading")) return;
    const raf = requestAnimationFrame(() => setFilled(true));
    const out = window.setTimeout(() => root.classList.add("c-loading-out"), CONSOLE_LOADER_MS);
    const done = window.setTimeout(
      () => root.classList.remove("c-loading", "c-loading-out"),
      CONSOLE_LOADER_MS + FADE_MS,
    );
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(out);
      window.clearTimeout(done);
    };
  }, []);

  return (
    <div className="c-load" aria-hidden="true">
      <img
        className="c-load__mark c-load__mark--dark"
        src="/console/loader-dark.svg"
        alt=""
        width={56}
        height={56}
      />
      <img
        className="c-load__mark c-load__mark--light"
        src="/console/loader-light.svg"
        alt=""
        width={56}
        height={56}
      />
      <span className="c-load__label">Opening your book</span>
      <span className="c-load__track">
        <i className={filled ? "is-full" : undefined}></i>
      </span>
    </div>
  );
}
