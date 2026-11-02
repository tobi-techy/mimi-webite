"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { HelperFace } from "@/features/console/components/helpers/HelperFace";
import { USES_API } from "@/features/console/api/config";
import { helperHref } from "@/features/console/config";
import { helperBrief, ruleTierLabel } from "@/features/console/content/helper-brief";
import { faceStateLabel, type FaceState } from "@/features/console/demo/roster";
import type { HelperName } from "@/features/console/demo/types";
import { cx } from "@/lib/cx";

const short = (n: number) => (n >= 1e6 ? `₦${(n / 1e6).toFixed(2)}m` : `₦${Math.round(n / 1000)}k`);
const naira = (n: number) => `₦${n.toLocaleString("en-US")}`;

/**
 * The right panel in a helper's own thread: her state, what she is doing right now, one money
 * sentence where it helps, and her rules (Allowed / Always ask / Never). Wide screens only; it
 * folds away below 1280px and whenever the workspace panel is open. The live demo shows only the
 * live step and the rules, never the sample step list or figures.
 */
export function HelperBrief({ name, state, step }: { name: HelperName; state: FaceState; step: string }) {
  const b = helperBrief[name];
  const steps = USES_API ? [{ text: step, state: "now" as const }] : b.steps;
  const c = USES_API ? undefined : b.collections;
  const total = c ? c.parts.reduce((n, p) => n + p.amount, 0) : 0;
  return (
    <aside className="mf-brief" aria-label={`${name}: right now`}>
      <div className="mf-brief__h">
        <HelperFace name={name} size={36} state={state} />
        <span className="mf-brief__who">
          <Link href={helperHref(name)}>{name}</Link>
          <span className={cx("mf-brief__st", `is-${state}`)}>{faceStateLabel[state]}</span>
        </span>
      </div>

      <section className="mf-card">
        <h2 className="mf-k">Right now</h2>
        <ol className="mf-steps">
          {steps.map((s) => (
            <li key={s.text} className={cx("mf-step", `is-${s.state}`)}>
              <i aria-hidden="true" />
              <span>{s.text}</span>
            </li>
          ))}
        </ol>
      </section>

      {c && (
        <section className="mf-card" aria-label="Collections this week">
          <p className="mf-big">
            {short(c.collected)} <span>collected this week of</span> {short(c.due)} <span>due</span>
          </p>
          <div className="mf-bar" aria-hidden="true">
            {c.parts.map((p) => (
              <i key={p.label} className={`is-${p.tone}`} style={{ "--w": p.amount / total } as CSSProperties} />
            ))}
          </div>
          <ul className="mf-legend">
            {c.parts.map((p) => (
              <li key={p.label}>
                <i className={`is-${p.tone}`} aria-hidden="true" />
                <span>{p.label}</span>
                <span className="mf-legend__n">{naira(p.amount)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mf-rules">
        <h2 className="mf-k">{name}&apos;s rules</h2>
        <ul>
          {b.rules.map((r) => (
            <li key={r.text}>
              <span>{r.text}</span>
              <span className={cx("mf-pill", r.tier === "allowed" && "is-ok", r.tier === "ask" && "is-ask", r.tier === "never" && "is-dim")}>{ruleTierLabel[r.tier]}</span>
            </li>
          ))}
        </ul>
      </section>
    </aside>
  );
}
