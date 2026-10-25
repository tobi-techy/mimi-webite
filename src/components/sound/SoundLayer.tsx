"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { initSound, sfx } from "@/lib/sound";

/** Mounted once in the site frame: turns sounds on and plays one soft whoosh per page change. */
export function SoundLayer() {
  const pathname = usePathname();
  const last = useRef(pathname);

  useEffect(() => initSound(), []);

  useEffect(() => {
    if (last.current === pathname) return;
    last.current = pathname;
    sfx("navigate", "navigate", { emphasis: "subtle" });
  }, [pathname]);

  return null;
}
