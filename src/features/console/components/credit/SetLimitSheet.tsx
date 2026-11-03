"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { liveDecideCredit, liveSetLimit, liveUndoLimit } from "@/features/console/api/actions";
import { useLive } from "@/features/console/api/live-store";
import { HelperFace } from "@/features/console/components/helpers/HelperFace";
import { Avatar } from "@/features/console/components/ui/Avatar";
import { Button } from "@/features/console/components/ui/Button";
import { Icon } from "@/features/console/components/ui/Icon";
import { approveCard } from "@/features/console/demo/engine";
import { owner } from "@/features/console/demo/seed";
import { patchMessage } from "@/features/console/demo/store";
import { useToast } from "@/features/console/hooks/use-toast";
import {
  closeLimitSheet,
  formatAmount,
  historyLine,
  parseAmount,
  quickPicks,
  saveLimit,
  undoLimit,
  useLimits,
  type LimitTarget,
} from "@/features/console/lib/credit-limits";
import { naira } from "@/features/console/lib/format";
import { cx } from "@/lib/cx";
import { sfx } from "@/lib/sound";

/**
 * Set credit limit (Tobi, 31 Oct 2026). The distributor's call, never Mimi's: Credit only
 * suggests, and nothing moves money. One sheet (full screen on a phone): the shop and how it pays,
 * Credit's suggestion with its reason, a naira amount with quick picks and a before → after line,
 * then one confirm, then the new limit with its history line and a short Undo.
 */

const UNDO_S = 8;
/* a stable empty list: the store hands out the same value until it changes */
const NO_HISTORY: { text: string; at: number }[] = [];
const REVIEW = [
  { value: 0, label: "No review" },
  { value: 30, label: "In 30 days" },
  { value: 90, label: "In 90 days" },
] as const;

const reviewDate = (days: number) =>
  days ? new Date(Date.now() + days * 86400000).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : undefined;

/* the moment a limit is set (outside render: called from the Set button only) */
const stamp = () => Date.now();

const firstName = (shop: string) => shop.split(/\s+/).slice(0, 2).join(" ");

function shopMessage(t: LimitTarget, limit: number, review?: string): string {
  return `Hello ${firstName(t.name)}, this is ${owner.company}. Your credit limit is now ${naira(limit)}.${review ? ` We'll look at it again on ${review}.` : ""} Thank you for buying from us.`;
}

function Sheet({ t }: { t: LimitTarget }) {
  const live = useLive((s) => s.status === "ready");
  const say = useToast();
  const start = t.prefill ?? t.current;
  const [shown, setShown] = useState(formatAmount(String(start)));
  const [step, setStep] = useState<"edit" | "confirm" | "done">("edit");
  const [review, setReview] = useState<number>(0);
  const [tell, setTell] = useState(false);
  const [left, setLeft] = useState(UNDO_S);
  const [at, setAt] = useState(0);
  const history = useLimits((s) => s.history[t.shopId]) ?? NO_HISTORY;
  const input = useRef<HTMLInputElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const committed = useRef(false);
  /* the API's id for this change (live demo), which Undo sends back */
  const change = useRef<Promise<string | undefined> | null>(null);
  const onApi = live && !t.shopId.startsWith("card:");
  /* this demo server has no limit route yet: the change lives in this tab only */
  const [localOnly, setLocalOnly] = useState(false);
  const amount = parseAmount(shown);
  const owed = t.owed ?? 0;
  const below = t.owed !== undefined && amount > 0 && amount < owed;
  const delta = amount - t.current;
  const current = t.current;
  const suggested = t.suggestion?.to;
  const picks = useMemo(() => quickPicks(current, suggested), [current, suggested]);
  const when = reviewDate(review);

  useEffect(() => {
    input.current?.focus();
    input.current?.select();
  }, []);

  /* the approval a suggestion card stands for is decided once the Undo window has passed */
  const commit = () => {
    if (committed.current) return;
    committed.current = true;
    if (t.card) {
      if (t.card.messageId.startsWith("apr:")) approveCard(t.card.slug, t.card.messageId, true);
      else {
        patchMessage(t.card.slug, t.card.messageId, (m) =>
          m.kind === "card" ? { ...m, card: { ...m.card, amount, sub: `${naira(t.current)} → ${naira(amount)}`, doneText: `Limit set to ${naira(amount)}` } } : m,
        );
        approveCard(t.card.slug, t.card.messageId, true);
      }
    }
    if (t.suggestion?.approvalId && amount === t.suggestion.to) void liveDecideCredit(t.suggestion.approvalId, true).then((r) => !r.ok && say(r.text));
  };

  /** Takes the new limit back: on the API when it was saved there, and in this tab. */
  async function takeBack(): Promise<boolean> {
    const id = change.current ? await change.current : undefined;
    if (id && !(await liveUndoLimit(id))) return false;
    undoLimit(t.shopId);
    return true;
  }

  const close = () => {
    if (step === "done") {
      commit();
      /* the sheet goes, the change can still be taken back from the toast */
      if (left > 0)
        say(`${firstName(t.name)}: limit now ${naira(amount)}`, {
          label: "Undo",
          run: () => void takeBack().then((ok) => ok && say(`Undone. ${t.name} is back at ${naira(t.current)}.`)),
        });
    }
    closeLimitSheet();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });

  /* Undo counts down, then the change stands */
  useEffect(() => {
    if (step !== "done") return;
    if (left <= 0) return void commit();
    const id = window.setTimeout(() => setLeft((n) => n - 1), 1000);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, left]);

  function set() {
    const now = stamp();
    saveLimit(t.shopId, { limit: amount, prev: t.current, at: now, by: owner.name, review: when, told: tell });
    if (onApi) {
      const reason = t.suggestion && amount === t.suggestion.to ? t.suggestion.why : undefined;
      change.current = liveSetLimit(t.shopId, amount, reason).then((r) => {
        /* refused by the API: the limit did not change anywhere */
        if (!r.ok) {
          undoLimit(t.shopId);
          committed.current = true;
          closeLimitSheet();
        }
        if (r.kept === "local") setLocalOnly(true);
        return r.changeId;
      });
    }
    setAt(now);
    setLeft(UNDO_S);
    setStep("done");
    sfx("console", "success", { emphasis: "subtle" });
  }

  function undo() {
    committed.current = true;
    sfx("console", "close", { emphasis: "subtle" });
    closeLimitSheet();
    void takeBack().then((ok) => ok && say(`Undone. ${t.name} stays at ${naira(t.current)}.`));
  }

  const valid = amount > 0 && amount !== t.current;

  return (
    <>
      <div className="mf-ls__scrim" aria-hidden="true" onClick={close} />
      <div className="mf-ls" role="dialog" aria-modal="true" aria-labelledby="mf-ls-t" ref={box}>
        <header className="mf-ls__h">
          <Avatar name={t.name} size="lg" />
          <div className="mf-ls__who">
            <h2 id="mf-ls-t">{step === "done" ? "Limit set" : "Set credit limit"}</h2>
            <p>
              {t.name}
              {t.area ? ` · ${t.area}` : ""}
            </p>
          </div>
          <button className="mf-ls__x" type="button" aria-label="Close" onClick={close}>
            <Icon name="x" />
          </button>
        </header>

        {step === "edit" && (
          <div className="mf-ls__b">
            <dl className="mf-ls__facts">
              <div>
                <dt>Limit now</dt>
                <dd className="mf-num">{naira(t.current)}</dd>
              </div>
              <div>
                <dt>Owes now</dt>
                <dd className="mf-num">{t.owed !== undefined ? naira(t.owed) : "—"}</dd>
              </div>
              <div>
                <dt>Overdue</dt>
                <dd className={cx("mf-num", (t.overdue ?? 0) > 0 && "is-late")}>{t.overdue !== undefined ? naira(t.overdue) : "—"}</dd>
              </div>
              <div>
                <dt>How they pay</dt>
                <dd>{t.record}</dd>
              </div>
            </dl>

            {t.suggestion && (
              <div className="mf-ls__sug">
                <HelperFace name="Credit" size={24} quiet still />
                <p>
                  <span>Credit suggests {naira(t.suggestion.to)}</span>
                  <small>{t.suggestion.why}</small>
                </p>
                {amount !== t.suggestion.to && (
                  <button type="button" className="mf-ls__use" onClick={() => setShown(formatAmount(String(t.suggestion!.to)))}>
                    Use
                  </button>
                )}
              </div>
            )}

            <label className="mf-ls__lbl" htmlFor="mf-ls-amt">
              New limit
            </label>
            <div className={cx("mf-ls__amt", below && "is-below")}>
              <span aria-hidden="true">₦</span>
              <input
                id="mf-ls-amt"
                ref={input}
                inputMode="numeric"
                autoComplete="off"
                value={shown}
                aria-describedby="mf-ls-pv"
                onChange={(e) => setShown(formatAmount(e.target.value))}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && valid) setStep("confirm");
                }}
              />
            </div>
            <div className="mf-ls__picks" role="group" aria-label="Quick amounts">
              {picks.map((p) => (
                <button key={p.value} type="button" className={cx("mf-ls__pick", amount === p.value && "is-on")} aria-pressed={amount === p.value} onClick={() => setShown(formatAmount(String(p.value)))}>
                  {p.label ? <span className="mf-ls__pk">{p.label}</span> : null}
                  {naira(p.value)}
                </button>
              ))}
            </div>

            <p className="mf-ls__pv" id="mf-ls-pv" aria-live="polite">
              <span className="mf-num">{naira(t.current)}</span>
              <Icon name="arrow-right" />
              <span className="mf-num mf-ls__to">{amount ? naira(amount) : "—"}</span>
              {amount > 0 && delta !== 0 && (
                <small className="mf-num">
                  {delta > 0 ? "+" : "−"}
                  {naira(Math.abs(delta))}
                </small>
              )}
            </p>
            {amount > 0 && t.owed !== undefined && (
              <p className={cx("mf-ls__room", below && "is-below")} role={below ? "status" : undefined}>
                {below ? (
                  <>
                    <i aria-hidden="true" />
                    That&apos;s below what they owe now ({naira(owed)}). They can&apos;t take new goods on credit until they pay {naira(owed - amount)}.
                  </>
                ) : (
                  <>They can take up to {naira(amount - owed)} more on credit.</>
                )}
              </p>
            )}

            <div className="mf-ls__opt">
              <span className="mf-ls__ol">Review date</span>
              <div className="mf-ls__seg" role="radiogroup" aria-label="Review date">
                {REVIEW.map((r) => (
                  <button key={r.value} type="button" role="radio" aria-checked={review === r.value} className={cx(review === r.value && "is-on")} onClick={() => setReview(r.value)}>
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="mf-ls__opt">
              <span className="mf-ls__ol">
                Tell the shop
                <small>A private WhatsApp message to {t.name} only</small>
              </span>
              <button type="button" role="switch" aria-checked={tell} aria-label="Tell the shop" className={cx("mf-ls__sw", tell && "is-on")} onClick={() => setTell(!tell)}>
                <i />
              </button>
            </div>
            {tell && (
              <div className="mf-ls__msg">
                <span className="mf-ls__ml">WhatsApp · {t.name}</span>
                <p>{shopMessage(t, amount || t.current, when)}</p>
              </div>
            )}
          </div>
        )}

        {step === "confirm" && (
          <div className="mf-ls__b">
            <p className="mf-ls__big">
              <span className="mf-num">{naira(t.current)}</span>
              <Icon name="arrow-right" />
              <span className="mf-num">{naira(amount)}</span>
            </p>
            <dl className="mf-ls__sum">
              <div>
                <dt>Shop</dt>
                <dd>{t.name}</dd>
              </div>
              <div>
                <dt>Review</dt>
                <dd>{when ?? "No review date"}</dd>
              </div>
              <div>
                <dt>Tell the shop</dt>
                <dd>{tell ? "Yes, privately on WhatsApp" : "No"}</dd>
              </div>
            </dl>
            {below && (
              <p className="mf-ls__room is-below" role="status">
                <i aria-hidden="true" />
                Below what they owe now. No new goods on credit until they pay {naira(owed - amount)}.
              </p>
            )}
            <p className="mf-ls__note">This only changes how much {t.name} can buy on credit. No money moves.</p>
          </div>
        )}

        {step === "done" && (
          <div className="mf-ls__b">
            <div className="mf-ls__ok">
              <span className="mf-ls__tick" aria-hidden="true">
                <Icon name="check" />
              </span>
              <p className="mf-ls__big mf-num">{naira(amount)}</p>
              <p className="mf-ls__was">
                New limit for {t.name} · was {naira(t.current)}
              </p>
            </div>
            <ul className="mf-ls__hist" aria-label="History">
              {(history.length ? history.slice(0, 3) : [{ text: historyLine(owner.name, at), at }]).map((h) => (
                <li key={h.at + h.text}>{h.text}</li>
              ))}
              {tell && <li>{live ? "Message to the shop: preview only in this demo, not sent" : `${firstName(t.name)} gets the message on WhatsApp`}</li>}
              {when && <li>Review on {when}</li>}
            </ul>
            {localOnly && <p className="mf-ls__note">Demo: the new limit is kept in this browser for now.</p>}
          </div>
        )}

        <footer className="mf-ls__f">
          {step === "edit" && (
            <>
              <Button variant="ghost" onClick={close}>
                Cancel
              </Button>
              <Button variant="primary" disabled={!valid} onClick={() => setStep("confirm")}>
                Review
              </Button>
            </>
          )}
          {step === "confirm" && (
            <>
              <Button variant="ghost" onClick={() => setStep("edit")}>
                Back
              </Button>
              <Button variant="primary" onClick={set}>
                Set limit to {naira(amount)}
              </Button>
            </>
          )}
          {step === "done" && (
            <>
              {left > 0 ? (
                <Button variant="ghost" onClick={undo}>
                  Undo <span className="mf-num mf-ls__cd">{left}s</span>
                </Button>
              ) : (
                <span />
              )}
              <Button variant="primary" onClick={close}>
                Done
              </Button>
            </>
          )}
        </footer>
      </div>
    </>
  );
}

/** Mounted once in the console shell; any entry point opens it with `openLimitSheet`. */
export function LimitSheetHost() {
  const t = useLimits((s) => s.open);
  if (!t) return null;
  return <Sheet key={`${t.shopId}:${t.prefill ?? ""}`} t={t} />;
}
