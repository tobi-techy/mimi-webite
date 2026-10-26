"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ActionGroup } from "@/features/console/components/ui/ActionGroup";
import { Avatar, Identity } from "@/features/console/components/ui/Avatar";
import { EmptyState } from "@/features/console/components/ui/EmptyState";
import { Icon } from "@/features/console/components/ui/Icon";
import { MiniBar } from "@/features/console/components/ui/Meter";
import { SearchField } from "@/features/console/components/ui/SearchField";
import { Segmented } from "@/features/console/components/ui/Segmented";
import { shopHref } from "@/features/console/config";
import {
  creditLines,
  creditRecommendations,
  type CreditLine,
  type CreditRecommendation,
} from "@/features/console/content/credit";
import { useToast } from "@/features/console/hooks/use-toast";
import { naira } from "@/features/console/lib/format";
import { Table } from "@/features/console/components/ui/Table";
import { Button } from "@/features/console/components/ui/Button";

type Tab = "all" | "late" | "rec";
const LIMIT_TOAST = "Only Coral Lane can set limits. Draft saved.";
const suggestsChange = (l: CreditLine): boolean => /^(Raise|Lower)/.test(l.recommendation);

/** Recommended limit changes and the credit lines they apply to. Accepting updates the line. */
export function CreditBoard() {
  const router = useRouter();
  const say = useToast();
  const [lines, setLines] = useState<readonly CreditLine[]>(creditLines);
  const [recs, setRecs] = useState<readonly CreditRecommendation[]>(creditRecommendations);
  const [tab, setTab] = useState<Tab>("all");
  const [q, setQ] = useState("");

  function decide(rec: CreditRecommendation, accept: boolean) {
    const line = lines.find((l) => l.shop.id === rec.shopId);
    if (!line) return;
    setRecs(recs.filter((r) => r !== rec));
    setLines(
      lines.map((l) =>
        l === line
          ? {
              ...l,
              limit: accept ? rec.to : l.limit,
              recommendation: accept ? `Set to ${naira(rec.to)} today` : "Hold",
            }
          : l,
      ),
    );
    say(
      accept
        ? `${line.shop.name} limit set to ${naira(rec.to)}`
        : `Dismissed: ${rec.verb.toLowerCase()} ${line.shop.name}`,
    );
  }

  const rows = useMemo(() => {
    const query = q.trim().toLowerCase();
    return lines.filter(
      (l) =>
        (tab === "all" || (tab === "late" ? l.late : suggestsChange(l))) &&
        (!query || `${l.shop.name} ${l.shop.area} ${l.recommendation}`.toLowerCase().includes(query)),
    );
  }, [lines, tab, q]);

  return (
    <>
      <div className="x-card x-recs">
        <p className="x-rh">
          Recommended changes <span className="x-num">· {recs.length}</span>
        </p>
        {recs.length === 0 && (
          <div className="x-ri">
            <div>
              <small>No changes to review. Mimi checks again tomorrow.</small>
            </div>
          </div>
        )}
        {recs.map((r) => {
          const name = lines.find((l) => l.shop.id === r.shopId)?.shop.name ?? r.shopId;
          return (
            <div key={r.shopId} className="x-ri">
              <Avatar name={name} />
              <div>
                <b>
                  {r.verb} {name} to {naira(r.to)}
                </b>
                <small>{r.why}</small>
              </div>
              <Button size="sm" onClick={() => decide(r, true)}>
                Accept
              </Button>
              <button
                className="x-ib"
                type="button"
                aria-label={`Dismiss: ${r.verb.toLowerCase()} ${name}`}
                onClick={() => decide(r, false)}
              >
                <Icon name="x" />
              </button>
            </div>
          );
        })}
      </div>
      <div className="x-grp">
        <div className="x-gh">
          <Icon name="landmark" />
          <h2>Credit lines</h2>
          <span className="x-num">{lines.length}</span>
        </div>
        <div className="x-ltools">
          <SearchField label="Search credit lines" value={q} onChange={setQ} />
          <Segmented
            label="Credit lines"
            value={tab}
            onChange={setTab}
            segments={[
              { value: "all", label: "All", count: lines.length },
              { value: "late", label: "Overdue", count: lines.filter((l) => l.late).length },
              { value: "rec", label: "Change suggested", count: lines.filter(suggestsChange).length },
            ]}
          />
        </div>
        {rows.length === 0 ? (
          <EmptyState>No credit lines match the current filters</EmptyState>
        ) : (
          <Table label="Credit lines">
            <thead>
              <tr>
                <th scope="col">Shop</th>
                <th scope="col" className="r">
                  Limit
                </th>
                <th scope="col">Used</th>
                <th scope="col">Due</th>
                <th scope="col">Score</th>
                <th scope="col">Recommendation</th>
                <th scope="col">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((l) => (
                <tr key={l.shop.id} className="is-link" onClick={() => router.push(shopHref(l.shop.id))}>
                  <td>
                    <Link
                      href={shopHref(l.shop.id)}
                      aria-label={`Review ${l.shop.name}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Identity name={l.shop.name} sub={l.shop.area} />
                    </Link>
                  </td>
                  <td className="r x-ink">{naira(l.limit)}</td>
                  <td>
                    <MiniBar percent={(l.shop.owed / l.limit) * 100} />
                    <span className="x-num">{naira(l.shop.owed)}</span>
                  </td>
                  <td className={l.late ? "x-late" : undefined}>
                    {l.due}
                    {l.late && " · overdue"}
                  </td>
                  <td className="x-num">
                    <span className="x-ink">{l.shop.score}</span>
                    <span className="x-mu">/100</span>
                  </td>
                  <td className="x-mu">{l.recommendation}</td>
                  <td className="r">
                    <ActionGroup
                      row
                      label={`More for ${l.shop.name}`}
                      actions={["Review", "Set credit limit"]}
                      onAction={(a) => (a === "Review" ? router.push(shopHref(l.shop.id)) : say(LIMIT_TOAST))}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </div>
    </>
  );
}
