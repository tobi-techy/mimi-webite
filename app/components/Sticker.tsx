"use client";

import Image from "next/image";
import { useEffect, useRef, type CSSProperties } from "react";

import { STICKERS, type StickerName } from "@/content/stickers";

type StickerState = {
  dx: number;
  dy: number;
  drift: number;
  dragging: boolean;
  active: boolean;
  sx: number;
  sy: number;
  startX: number;
  startY: number;
};

type StickerProps = {
  name: StickerName;
  rotation?: number;
  /** Entrance stagger, in ms. */
  delay?: number;
  className?: string;
  style?: CSSProperties;
  priority?: boolean;
  sizes?: string;
};

/**
 * A single die-cut sticker. Decorative, so `alt` is empty. Draggable with
 * pointer events: mouse drags immediately, touch waits for a horizontal intent
 * so vertical scrolling is never hijacked.
 */
export function Sticker({ name, rotation = 0, delay = 0, className = "", style, priority, sizes }: StickerProps) {
  const ref = useRef<HTMLImageElement>(null);
  const state = useRef<StickerState>({
    dx: 0,
    dy: 0,
    drift: 0,
    dragging: false,
    active: false,
    sx: 0,
    sy: 0,
    startX: 0,
    startY: 0,
  });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const s = state.current;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

    const paint = () => {
      el.style.transform =
        `translate3d(${s.dx}px, ${s.dy + s.drift}px, 0) rotate(${rotation}deg)` + (s.dragging ? " scale(1.05)" : "");
    };

    let timer: number | undefined;
    const scheduleDrift = () => {
      if (reduce.matches) return;
      timer = window.setTimeout(
        () => {
          if (!s.dragging) {
            s.drift = (Math.random() * 2 - 1) * 1.6;
            paint();
          }
          scheduleDrift();
        },
        2600 + Math.random() * 1800,
      );
    };
    scheduleDrift();

    const onEnter = () => {
      if (s.dragging || reduce.matches) return;
      el.style.transform = `translate3d(${s.dx}px, ${s.dy}px, 0) rotate(${rotation + 3}deg) scale(1.04)`;
    };
    const onLeave = () => {
      if (s.dragging) return;
      s.drift = 0;
      paint();
    };

    const beginDrag = (event: PointerEvent) => {
      s.dragging = true;
      el.setAttribute("data-dragging", "true");
      try {
        el.setPointerCapture(event.pointerId);
      } catch {
        /* capture is best-effort */
      }
      paint();
    };

    const onDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      s.active = true;
      s.dragging = false;
      s.sx = event.clientX - s.dx;
      s.sy = event.clientY - s.dy;
      s.startX = event.clientX;
      s.startY = event.clientY;
      if (event.pointerType === "mouse") beginDrag(event);
    };

    const onMove = (event: PointerEvent) => {
      if (!s.active) return;
      if (!s.dragging) {
        const moveX = event.clientX - s.startX;
        const moveY = event.clientY - s.startY;
        if (Math.abs(moveX) > 10 && Math.abs(moveX) > Math.abs(moveY)) beginDrag(event);
        else return;
      }
      s.dx = event.clientX - s.sx;
      s.dy = event.clientY - s.sy;
      paint();
    };

    const onUp = () => {
      if (!s.active) return;
      s.active = false;
      if (!s.dragging) return;
      s.dragging = false;
      el.removeAttribute("data-dragging");
      s.dx = 0;
      s.dy = 0;
      s.drift = 0;
      el.style.transition = reduce.matches ? "none" : "transform 520ms cubic-bezier(.22,1,.36,1)";
      paint();
      window.setTimeout(() => {
        el.style.transition = "";
        el.style.transform = "";
      }, 540);
    };

    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    el.addEventListener("pointerenter", onEnter);
    el.addEventListener("pointerleave", onLeave);

    return () => {
      if (timer) window.clearTimeout(timer);
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
      el.removeEventListener("pointerenter", onEnter);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, [rotation]);

  const asset = STICKERS[name];

  return (
    <Image
      ref={ref}
      src={asset.src}
      alt=""
      width={asset.width}
      height={asset.height}
      sizes={sizes}
      priority={priority}
      draggable={false}
      data-drop
      data-rotated="true"
      className={`sticker ${className}`.trim()}
      style={{ "--rot": `${rotation}deg`, "--d": `${delay}ms`, ...style } as CSSProperties}
    />
  );
}
