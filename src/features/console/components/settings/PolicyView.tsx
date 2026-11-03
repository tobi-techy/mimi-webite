"use client";

import { useEffect, useState } from "react";
import { mimiApi } from "@/features/console/api/client";
import { useLive } from "@/features/console/api/live-store";
import { authed } from "@/features/console/api/sync";
import type { ApiPolicyRule } from "@/features/console/api/types";
import { Note } from "@/features/console/components/ui/Note";
import { Row } from "@/features/console/components/ui/Row";
import { policyGroups, samplePolicy } from "@/features/console/content/policy";

const helperWord = (h: string) => (h === "all" ? "Every helper" : h === "mimi" ? "Mimi" : `${h.charAt(0).toUpperCase()}${h.slice(1)}`);

/**
 * Settings > What Mimi may do: the owner's rulebook (GET /v1/policy) in plain words, grouped by
 * what Mimi does with each step. Read only here; the demo's copy uses the same defaults.
 */
export function PolicyView() {
  const status = useLive((s) => s.status);
  const [rules, setRules] = useState<ApiPolicyRule[] | null>(status === "off" || status === "fallback" ? samplePolicy : null);

  useEffect(() => {
    if (status !== "ready") return;
    const ctrl = new AbortController();
    authed((t) => mimiApi.policy(t, { signal: ctrl.signal }))
      .then((p) => setRules(p.rules.length ? p.rules : samplePolicy))
      .catch(() => {
        if (!ctrl.signal.aborted) setRules(samplePolicy);
      });
    return () => ctrl.abort();
  }, [status]);

  const shown = rules ?? samplePolicy;
  return (
    <>
      <div className="x-shead">
        <h1 className="x-title">What Mimi may do</h1>
      </div>
      <p className="x-sub">Every step your helpers can take, and whether they do it on their own, ask you first, or never do it.</p>
      {policyGroups.map((g) => {
        const items = shown.filter((r) => (g.key === "never" ? r.locked || r.behaviour === "never" : !r.locked && r.behaviour === g.key));
        if (!items.length) return null;
        return (
          <section key={g.key} aria-label={g.title} className="x-sg" aria-busy={rules === null || undefined}>
            <h2 className="x-sg__h">{g.title}</h2>
            <p className="x-sub">{g.sub}</p>
            {items.map((r) => (
              <Row key={r.action_type} title={r.label} description={helperWord(r.helper)} />
            ))}
          </section>
        );
      })}
      <Note>These are read only in the demo. Money never moves without you, and a credit limit is always your call.</Note>
    </>
  );
}
