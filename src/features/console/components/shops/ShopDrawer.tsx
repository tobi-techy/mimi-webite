"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";
import { Icon } from "@/features/console/components/ui/Icon";
import { consoleRoutes } from "@/features/console/config";

/**
 * The shop detail drawer (`.x-drawer`) over the shops list. It is its own route
 * (/console/shops/[id]) so it can be linked; Escape, the scrim and the close button go back.
 */
type ShopDrawerProps = { titleId: string; head: ReactNode; children: ReactNode };

export function ShopDrawer({ titleId, head, children }: ShopDrawerProps) {
  const router = useRouter();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") router.push(consoleRoutes.shops, { scroll: false });
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [router]);

  const close = () => router.push(consoleRoutes.shops, { scroll: false });

  return (
    <>
      <div className="x-dscrim is-on" aria-hidden="true" onClick={close} />
      <aside className="x-drawer is-on" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className="x-dh">
          {head}
          <button ref={closeRef} className="x-ib" type="button" aria-label="Close" onClick={close}>
            <Icon name="x" />
          </button>
        </div>
        {children}
      </aside>
    </>
  );
}
