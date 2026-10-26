"use client";

import { useEffect, useRef } from "react";
import { HelperFace } from "@/features/console/components/helpers/HelperFace";
import { VerdictTag } from "@/features/console/components/chat/Messages";
import { Icon } from "@/features/console/components/ui/Icon";
import { approveCard, closeSheet, setPlanMessage, setRowTone } from "@/features/console/demo/engine";
import { findConversation, useDemo } from "@/features/console/demo/store";
import type { Tone } from "@/features/console/demo/types";
import { cx } from "@/lib/cx";

const naira = (n: number) => `₦${Math.round(n).toLocaleString("en-US")}`;
const TONES: Tone[] = ["Firm", "Soft", "Skip"];

/** The reminder plan as a bottom sheet: edit each shop's tone and the message, then approve. */
export function PlanSheet() {
  const sheet = useDemo((s) => s.sheet);
  const conv = useDemo((s) => (s.sheet ? findConversation(s, s.sheet.slug) : undefined));
  const closeRef = useRef<HTMLButtonElement>(null);
  const m = conv?.messages.find((x) => x.id === sheet?.messageId);

  useEffect(() => {
    if (!sheet) return;
    closeRef.current?.focus();
    const esc = (e: KeyboardEvent) => e.key === "Escape" && closeSheet();
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [sheet]);

  if (!sheet || !m || m.kind !== "card") return null;
  const c = m.card;
  const live = c.rows.filter((r) => r.tone !== "Skip");
  const total = live.reduce((s, r) => s + (r.amount ?? 0), 0);
  const locked = c.status !== "needs";

  return (
    <>
      <div className="mc-sheetbg" aria-hidden="true" onClick={closeSheet} />
      <div className="mc-sheet" role="dialog" aria-modal="true" aria-labelledby="plan-title">
        <span className="mc-sheet__grab" aria-hidden="true" />
        <div className="mc-sheet__h">
          <HelperFace name={m.from === "me" ? "Collector" : m.from} size={32} />
          <div>
            <b id="plan-title">Reminder plan</b>
            <small>
              From {m.from} · {live.length} shops · {naira(total)}
            </small>
          </div>
          {c.status === "needs" ? <span className="mc-nd">Needs you</span> : <span className="mc-nd mc-nd--ok">Sent</span>}
          <button ref={closeRef} type="button" className="mc-ib mc-ib--b" aria-label="Close plan" onClick={closeSheet}>
            <Icon name="x" />
          </button>
        </div>
        <div className="mc-sheet__b">
          <h3 className="mc-cap">Goal</h3>
          <p>{c.goal}</p>
          <h3 className="mc-cap">Who gets a message</h3>
          <table className="mc-ptable">
            <tbody>
              {c.rows.map((r, i) => (
                <tr key={r.label} className={cx(r.tone === "Skip" && "is-skip")}>
                  <td>
                    {r.label}
                    {r.flag && <span className="mc-or"> · {r.flag}</span>}
                  </td>
                  <td className="mc-n">{r.amount !== undefined ? naira(r.amount) : ""}</td>
                  <td className="mc-n mc-mono">{r.days} days</td>
                  <td className="mc-n">
                    <span className="mc-seg" role="radiogroup" aria-label={`Tone for ${r.label}`}>
                      {TONES.map((t) => (
                        <button
                          key={t}
                          type="button"
                          role="radio"
                          aria-checked={r.tone === t}
                          disabled={locked}
                          className={cx(r.tone === t && "is-on", r.tone === t && r.edited && "is-edit")}
                          onClick={() => setRowTone(sheet.slug, m.id, i, t)}
                        >
                          {t}
                        </button>
                      ))}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <h3 className="mc-cap">Proof</h3>
          {c.proof?.map((p) => (
            <div key={p.label} className="mc-pf">
              {p.label}
              <VerdictTag v={p.verdict} />
            </div>
          ))}
          {c.message && (
            <>
              <h3 className="mc-cap">Message to {c.message.to}</h3>
              <div className="mc-wa">
                <small>
                  <span>WhatsApp · from Coral Lane Trading</span>
                  <span>{c.rows.find((r) => r.label === c.message?.to)?.tone ?? c.message.tone}</span>
                </small>
                <textarea
                  aria-label={`Message to ${c.message.to}`}
                  value={c.message.text}
                  readOnly={locked}
                  rows={3}
                  onChange={(e) => setPlanMessage(sheet.slug, m.id, e.target.value)}
                />
              </div>
            </>
          )}
        </div>
        <div className="mc-sheet__f">
          <button type="button" className="mc-btn" onClick={closeSheet}>
            {locked ? "Close" : "Save draft"}
          </button>
          {!locked && (
            <button type="button" className="mc-btn mc-btn--pri" onClick={() => approveCard(sheet.slug, m.id)}>
              Approve and send {live.length}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
