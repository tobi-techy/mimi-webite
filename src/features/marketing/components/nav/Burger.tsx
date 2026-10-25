"use client";

import { useNavState } from "@/features/marketing/components/nav/nav-state";
import { sfx } from "@/lib/sound";

/** Mobile menu button. */
export function Burger() {
  const { open, toggle } = useNavState();
  return (
    <button
      className="x-burger"
      id="burger"
      type="button"
      aria-label={open ? "Close menu" : "Open menu"}
      aria-expanded={open}
      aria-controls="mmenu"
      onClick={() => {
        sfx("menu", open ? "close" : "open", { emphasis: "subtle" });
        toggle();
      }}
    >
      <span></span>
      <span></span>
    </button>
  );
}
