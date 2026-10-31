"use client";

import Link from "next/link";
import { useState } from "react";
import { isApiThread, liveAnswer } from "@/features/console/api/actions";
import { useLive } from "@/features/console/api/live-store";
import { HelperFace } from "@/features/console/components/helpers/HelperFace";
import { Icon } from "@/features/console/components/ui/Icon";
import { consoleRoutes, threadHref } from "@/features/console/config";
import { answerAsk } from "@/features/console/demo/engine";
import { helperEntry } from "@/features/console/demo/roster";
import { findConversation, useDemo } from "@/features/console/demo/store";
import type { AskAnswer, Conversation, Message, Worker } from "@/features/console/demo/types";
import { askAnswer, type AskMessage } from "@/features/console/lib/chat-view";
import { cx } from "@/lib/cx";

/**
 * A helper asking the owner something. The same ask shows in two places: in the helper's own chat
 * (her question, answer right there) and in Mimi's chat as "Needs you" (Mimi is the inbox for
 * questions; she passes the answer on and the helper carries on in her own chat). Answered in
 * either place, both read answered.
 */

/** Where a helper's chat opens: the live demo's shared thread seen as hers, or her own sample thread. */
export function chatHref(conversations: Conversation[], who: Worker, live: boolean): string {
  if (who === "Mimi") return consoleRoutes.home;
  if (live) {
    const owner = conversations.find((c) => c.api?.kind === "owner");
    if (owner) return `${consoleRoutes.threads}/new?id=${encodeURIComponent(owner.slug)}&with=${who}`;
  }
  const entry = helperEntry(conversations, who);
  return entry ? threadHref(entry.slug) : `${consoleRoutes.helpers}/${who.toLowerCase()}`;
}

/** The ask's answer: on the message (sample), from this tab (live), or the owner's next message to her (live). */
export function useAskAnswer(slug: string, ask: AskMessage): AskAnswer | undefined {
  const local = useLive((s) => s.answers[ask.id]);
  const conv = useDemo((s) => findConversation(s, slug));
  if (ask.answered) return ask.answered;
  if (!conv?.api) return local;
  const msgs = conv.messages;
  const i = msgs.findIndex((m) => m.id === ask.id);
  const helperOfTurn = (turn: string) => {
    const h = msgs.find((m): m is Extract<Message, { kind: "step" }> => m.kind === "step" && m.variant === "handoff" && m.turn === turn);
    return h?.to;
  };
  return askAnswer(ask, i >= 0 ? msgs.slice(i + 1) : [], local ?? null, helperOfTurn);
}

function answer(slug: string, ask: AskMessage, text: string, via: AskAnswer["via"]) {
  if (isApiThread(slug)) liveAnswer(slug, ask.id, ask.from, text, via);
  else answerAsk(slug, ask.id, text, via);
}

/** Buttons when the helper offered choices, else a one-line answer box. */
function AnswerBox({ slug, ask, via }: { slug: string; ask: AskMessage; via: AskAnswer["via"] }) {
  const [text, setText] = useState("");
  const capped = useLive((s) => isApiThread(slug) && !!s.cap);
  if (ask.options?.length)
    return (
      <div className="mf-ask__opts" role="group" aria-label={`Answer ${ask.from}`}>
        {ask.options.map((o, i) => (
          <button key={o.label} type="button" className={cx("mf-ask__op", i === 0 && "is-pri")} disabled={capped} onClick={() => answer(slug, ask, o.text, via)}>
            {o.label}
          </button>
        ))}
      </div>
    );
  return (
    <form
      className="mf-ask__form"
      onSubmit={(e) => {
        e.preventDefault();
        if (text.trim()) answer(slug, ask, text, via);
      }}
    >
      <input
        className="mf-ask__in"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={`Answer ${ask.from}`}
        aria-label={`Your answer to ${ask.from}`}
        disabled={capped}
      />
      <button type="submit" className="mf-ask__send" aria-label="Send answer" disabled={capped || !text.trim()}>
        <Icon name="arrow-up" />
      </button>
    </form>
  );
}

/** In the helper's own chat: her question as a bubble, and the answer right under it. */
export function AskBubble({ m, slug }: { m: AskMessage; slug: string }) {
  const done = useAskAnswer(slug, m);
  return (
    <div className={cx("mc-b mc-b--them mf-ask", done && "is-done")}>
      <p className="mf-ask__q">{m.question}</p>
      {done ? (
        <p className="mf-ask__done">
          <Icon name="check" />
          {done.via === "mimi" ? "Answered in your chat with Mimi" : "Answered"}
        </p>
      ) : (
        <AnswerBox slug={slug} ask={m} via="helper" />
      )}
    </div>
  );
}

/** In Mimi's chat: one "Needs you" message per ask, which helper is asking, and the answer. */
function NeedsYouItem({ slug, ask, href }: { slug: string; ask: AskMessage; href: string }) {
  const done = useAskAnswer(slug, ask);
  return (
    <article className={cx("mf-need", done && "is-done")} aria-label={`${ask.from} needs you`}>
      <header className="mf-need__h">
        <span className="mf-need__k">{done ? "Answered" : "Needs you"}</span>
        <Link className="mf-need__who" href={href}>
          <HelperFace name={ask.from} size={20} quiet still />
          {ask.from} asks
        </Link>
      </header>
      <p className="mf-need__q">{ask.question}</p>
      {done ? (
        <div className="mf-need__a">
          <p className="mf-need__you">“{done.text}”</p>
          <p className="mf-need__pass">
            {done.via === "mimi" ? `Mimi passed your answer to ${ask.from}` : `You answered in ${ask.from}'s chat`}
            {" · "}
            <Link href={href}>Open {ask.from}</Link>
          </p>
        </div>
      ) : (
        <AnswerBox slug={slug} ask={ask} via="mimi" />
      )}
    </article>
  );
}

/** Mimi's chat: every helper's question, newest last, open ones and the ones just answered. */
export function NeedsYou({ asks }: { asks: { slug: string; ask: AskMessage }[] }) {
  const conversations = useDemo((s) => s.conversations);
  const live = useLive((s) => s.status === "ready");
  if (!asks.length) return null;
  return (
    <section className="mf-needs" aria-label="Questions from your helpers">
      {asks.map(({ slug, ask }) => (
        <NeedsYouItem key={ask.id} slug={slug} ask={ask} href={chatHref(conversations, ask.from, live && !!conversations.find((c) => c.slug === slug)?.api)} />
      ))}
    </section>
  );
}
