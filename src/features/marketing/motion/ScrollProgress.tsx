"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { rafThrottle } from "@/lib/dom";

/** The orange scroll-progress hairline at the top of the page (hidden on signup and login by CSS). */
export function ScrollProgress() {
  const ref = useRef<HTMLDivElement>(null);
  const request = useRef<() => void>(() => {});
  const pathname = usePathname();

  useEffect(() => {
    const html = document.documentElement;
    const frame = rafThrottle(() => {
      const bar = ref.current;
      if (!bar) return;
      const y = window.pageYOffset || html.scrollTop;
      const max = html.scrollHeight - window.innerHeight;
      bar.style.transform = "scaleX(" + (max > 0 ? Math.min(1, Math.max(0, y / max)) : 0).toFixed(4) + ")";
    });
    request.current = frame.request;
    window.addEventListener("scroll", frame.request, { passive: true });
    window.addEventListener("resize", frame.request, { passive: true });
    return () => {
      frame.cancel();
      window.removeEventListener("scroll", frame.request);
      window.removeEventListener("resize", frame.request);
    };
  }, []);

  // a new page has a new height
  useEffect(() => request.current(), [pathname]);

  return <div ref={ref} className="x-prog" aria-hidden="true" />;
}
