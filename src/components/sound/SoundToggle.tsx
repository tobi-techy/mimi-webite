"use client";

import { useEffect, useState } from "react";
import { soundConfig } from "@/config/sound";
import { isSoundOn, setSound } from "@/lib/sound";
import { cx } from "@/lib/cx";

/** Speaker button next to the theme switch. Same look as ThemeToggle. */
export function SoundToggle({ className }: { className?: string }) {
  const [on, setOn] = useState(true);

  useEffect(() => {
    const sync = () => setOn(isSoundOn());
    sync();
    window.addEventListener("mimi-sound", sync);
    return () => window.removeEventListener("mimi-sound", sync);
  }, []);

  if (!soundConfig.enabled) return null;

  return (
    <button
      className={cx("sound-toggle", className)}
      type="button"
      aria-label={on ? "Mute sounds" : "Turn sounds on"}
      aria-pressed={on}
      onClick={() => setSound(!on)}
    >
      <svg viewBox="0 0 16 16" aria-hidden="true">
        <path d="M2.5 6h2.5l3.5-3v10l-3.5-3h-2.5z" />
        {on ? (
          <path d="M11 5.5a3.5 3.5 0 0 1 0 5M12.75 3.75a6 6 0 0 1 0 8.5" />
        ) : (
          <path d="M11 6l3.5 4M14.5 6L11 10" />
        )}
      </svg>
    </button>
  );
}
