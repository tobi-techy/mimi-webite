"use client";

import Link from "next/link";
import { useMemo } from "react";
import { goToCard } from "@/features/console/components/chat/Work";
import { HelperFace } from "@/features/console/components/helpers/HelperFace";
import { Icon } from "@/features/console/components/ui/Icon";
import { consoleRoutes } from "@/features/console/config";
import { conversationHref } from "@/features/console/demo/engine";
import { needItems } from "@/features/console/demo/needs";
import { useDemo } from "@/features/console/demo/store";
import { cx } from "@/lib/cx";

const naira = (n: number) => `₦${Math.round(n).toLocaleString("en-US")}`;

/**
 * Mimi's roll-up at the foot of her conversation: everything across the team that waits on the
 * owner (this replaced the sidebar's Needs you row). Each row opens the helper's conversation on
 * that card; a card already on this page just scrolls into view.
 */
export function Waiting() {
  const conversations = useDemo((s) => s.conversations);
  const items = useMemo(() => needItems(conversations), [conversations]);
  const waiting = items.filter((i) => i.status === "needs").length;
  if (!items.length) return null;
  return (
    <div className="mc-grp mc-grp--them mc-grp--answer mc-grp--turn mc-wl" role="group" aria-label="Waiting on you">
      <p className="mc-mh">
        <HelperFace name="Mimi" size={18} />
        <span className="mc-mh__n">Mimi</span>
      </p>
      <div className="mc-wl__box">
        <p className="mc-wl__h">
          <b>
            {waiting} thing{waiting === 1 ? "" : "s"} need{waiting === 1 ? "s" : ""} you
          </b>
          <span>across the team</span>
        </p>
        <ul className="mc-wl__l">
          {items.map((it, n) => (
            <li key={it.key}>
              <Link
                className={cx("mc-wl__r", it.status === "sending" && "is-sending")}
                href={`${conversationHref(it.conv)}#m-${it.messageId}`}
                aria-label={`${it.helper}: ${it.what}${it.amount !== undefined ? `, ${naira(it.amount)}` : ""}. Open the card`}
                onClick={(e) => {
                  if (!document.getElementById(`m-${it.messageId}`)) return;
                  e.preventDefault();
                  goToCard(it.messageId);
                }}
              >
                <HelperFace name={it.helper} size={24} state={it.status === "sending" ? "working" : "waiting"} quiet stagger={n} />
                <span className="mc-wl__tx">
                  <span className="mc-wl__what">
                    {it.what}
                    {it.amount !== undefined && <b> · {naira(it.amount)}</b>}
                  </span>
                  <small className="mc-wl__why">{[it.helper, it.shop].filter(Boolean).join(" · ")}</small>
                </span>
                {it.status === "sending" ? (
                  <i className="mc-spin" aria-hidden="true" />
                ) : (
                  <span className="mc-wl__go" aria-hidden="true">
                    {it.primary}
                    <Icon name="chevron-right" />
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
        <Link className="mc-wl__all" href={consoleRoutes.needs}>
          See them all in one place
          <Icon name="arrow-right" />
        </Link>
      </div>
    </div>
  );
}
