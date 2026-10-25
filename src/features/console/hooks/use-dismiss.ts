"use client";

import { useEffect, type RefObject } from "react";

/** Calls `onDismiss` on a click outside `refs`, any scroll outside them, resize, or Escape. */
export function useDismiss(
  open: boolean,
  refs: ReadonlyArray<RefObject<HTMLElement | null>>,
  onDismiss: () => void,
): void {
  useEffect(() => {
    if (!open) return;
    const inside = (t: EventTarget | null) => refs.some((r) => t instanceof Node && r.current?.contains(t));
    const onPointer = (e: PointerEvent) => {
      if (!inside(e.target)) onDismiss();
    };
    const onScroll = (e: Event) => {
      if (!inside(e.target)) onDismiss();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onDismiss();
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onDismiss);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onDismiss);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, refs, onDismiss]);
}
