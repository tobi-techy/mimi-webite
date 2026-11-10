"use client";

import { useMemo, useState } from "react";
import { runItemAction, sendChannelMessage } from "@/features/console/api/command-actions";
import { ItemCard } from "@/features/console/components/command/ItemCard";
import { Button } from "@/features/console/components/ui/Button";
import type { Channel, ChannelMessage, CommandActor, CommandDigest, Item } from "@/features/console/content/command";
import { isOpenItem, provenanceWords, seesItem, type ItemAction } from "@/features/console/lib/command-rules";
import { cx } from "@/lib/cx";

/**
 * One channel: what was said, who said it and how it was written, the item cards that belong here,
 * and a composer. A message from Mimi or a helper says how it was written (code, or a named model
 * with what it cost); a mirrored shop message says it is the shop's own words. Only the item cards
 * the caller may see are drawn, so a rep never sees a colleague's card.
 *
 * When this is the caller's first channel, the morning digest sits at the top as the day's first
 * message: deterministic lines from records, with no model narrative added.
 */
export function ChannelView({
  channel,
  actor,
  messages,
  items,
  digest,
  now,
  primary,
}: {
  channel: Channel;
  actor: CommandActor;
  /** Every message the console knows; the view takes this channel's own. */
  messages: ChannelMessage[];
  /** Every item the console knows; the ones carried by a message are drawn with it, the rest below. */
  items: Item[];
  digest: CommandDigest | null;
  now: number;
  /** True for the first channel the rail draws: the one the digest leads. */
  primary: boolean;
}) {
  const mine = useMemo(
    () =>
      messages
        .filter((m) => m.channelId === channel.id)
        .sort((a, b) => (Date.parse(a.createdAt) || 0) - (Date.parse(b.createdAt) || 0)),
    [messages, channel.id],
  );
  const carried = useMemo(() => new Set(mine.filter((m) => m.itemId).map((m) => m.itemId)), [mine]);
  const loose = useMemo(
    () => items.filter((i) => i.channelId === channel.id && isOpenItem(i) && seesItem(actor, i) && !carried.has(i.id)),
    [items, channel.id, actor, carried],
  );
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [text, setText] = useState("");

  const onAction = async (item: Item, action: ItemAction) => {
    setBusy(true);
    const out = await runItemAction(item, action);
    setBusy(false);
    setNote(out.note);
  };

  const send = async () => {
    if (!text.trim() || busy) return;
    setBusy(true);
    const out = await sendChannelMessage(channel.id, text);
    setBusy(false);
    setNote(out.note);
    if (out.ok) setText("");
  };

  return (
    <section className="cmd-main" aria-label={channel.name}>
      <header className="cmd-hd">
        <h1 className="cmd-hd__t">{channel.name}</h1>
        {channel.topic && <p className="cmd-hd__s">{channel.topic}</p>}
        <span className="cmd-hd__c">
          {channel.openItems} open item{channel.openItems === 1 ? "" : "s"}
        </span>
      </header>

      <div className="cmd-msgs">
        {primary && digest && digest.lines.length > 0 && <DigestBlock digest={digest} />}

        {mine.length === 0 && !(primary && digest) && <p className="cmd-empty">Nothing has been said in here yet.</p>}

        {mine.map((m) => {
          const p = m.authorKind === "agent" || m.authorKind === "helper" || m.authorKind === "system" ? provenanceWords(m.provenance) : null;
          return (
            <article key={m.id} className={cx("cmd-msg", m.mirrored && "cmd-msg--shop", m.authorKind === "system" && "cmd-msg--sys")}>
              <p className="cmd-msg__hd">
                <span className="cmd-msg__a">{m.authorName}</span>
                {p ? (
                  <span className="cmd-msg__p">
                    {p.label} · {p.detail}
                  </span>
                ) : m.mirrored ? (
                  <span className="cmd-msg__p">Mirrored. The shop&apos;s own words.</span>
                ) : null}
              </p>
              <p className="cmd-msg__tx">{m.text}</p>
              {m.item && seesItem(actor, m.item) && <ItemCard item={m.item} actor={actor} now={now} onAction={onAction} busy={busy} />}
            </article>
          );
        })}
      </div>

      {loose.length > 0 && (
        <section className="cmd-loose" aria-label={`Open items in ${channel.name}`}>
          <p className="cmd-gh">Open items in this channel</p>
          {loose.map((i) => (
            <ItemCard key={i.id} item={i} actor={actor} now={now} onAction={onAction} busy={busy} />
          ))}
        </section>
      )}

      {note && <p className="cmd-note">{note}</p>}

      <form
        className="cmd-cmp"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <textarea
          rows={1}
          value={text}
          aria-label={`Message ${channel.name}`}
          placeholder="Write in this channel"
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              void send();
            }
          }}
        />
        <Button type="submit" variant="primary" size="sm" disabled={!text.trim() || busy}>
          Send
        </Button>
      </form>
    </section>
  );
}

/** The day's brief, as the first message: code-built lines, one per thing a person must know. */
function DigestBlock({ digest }: { digest: CommandDigest }) {
  const [first, ...rest] = digest.lines;
  return (
    <article className="cmd-msg cmd-msg--digest" aria-label="Today's brief">
      <p className="cmd-msg__hd">
        <span className="cmd-msg__a">Mimi</span>
        <span className="cmd-msg__p">Written by code · the day&apos;s first message</span>
      </p>
      <p className="cmd-msg__tx cmd-msg__tx--lead">{first}</p>
      {rest.length > 0 && (
        <ul className="cmd-msg__list">
          {rest.map((l, i) => (
            <li key={i}>{l}</li>
          ))}
        </ul>
      )}
    </article>
  );
}
