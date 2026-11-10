"use client";

import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { loadCommand, useCommand } from "@/features/console/api/command-store";
import { ChannelRail } from "@/features/console/components/command/ChannelRail";
import { ChannelView } from "@/features/console/components/command/ChannelView";
import { NeedsView } from "@/features/console/components/command/NeedsView";
import { SkeletonRows } from "@/features/console/components/live/Skeleton";
import { Button } from "@/features/console/components/ui/Button";
import { EmptyState } from "@/features/console/components/ui/EmptyState";
import { firstChannel, groupChannels, needsYou } from "@/features/console/lib/command-rules";

/**
 * Command: one screen where the distributor's day happens. The rail on the left is the caller's
 * channels, grouped the way the business runs; the right column is either their pile ("Needs you",
 * the default) or one channel. Selection travels in the query (`?c=slug`), so the static export has
 * a page to serve and a link can be shared.
 *
 * While Command reads the typed mock, a plain line says so: nothing here is connected to the API yet,
 * so nothing here changes a record.
 */
export function CommandHome() {
  const { status, preview, data, notice } = useCommand();
  const params = useSearchParams();
  const slug = params.get("c");
  const [now] = useState(() => Date.now());

  const groups = useMemo(() => (data ? groupChannels(data.actor, data.channels) : []), [data]);
  const visible = useMemo(() => groups.flatMap((g) => g.channels), [groups]);
  const needs = useMemo(() => (data ? needsYou(data.actor, data.items, now) : []), [data, now]);
  const selected = slug ? (visible.find((c) => c.slug === slug) ?? null) : null;

  if (status === "loading") return <SkeletonRows count={5} />;
  if (status === "failed" || !data)
    return (
      <>
        <EmptyState>Command couldn&apos;t be read just now</EmptyState>
        <p className="x-sub">{notice || "The channels were not read, so nothing is shown."}</p>
        <Button onClick={() => loadCommand()}>Try again</Button>
      </>
    );

  /* a channel the caller is not in reads as not there, the way the API answers 404 rather than 403,
   * and the rail stays drawn so their own channels are still one tap away */
  if (slug && !selected)
    return (
      <>
        {preview && <PreviewNote />}
        <div className="cmd">
          <ChannelRail groups={groups} needsCount={needs.length} selected={null} />
          <section className="cmd-main" aria-label="Channel">
            <EmptyState>That channel is not one of yours</EmptyState>
            <p className="x-sub">It may belong to another territory. Your channels are on the left.</p>
          </section>
        </div>
      </>
    );

  const primary = firstChannel(data.actor, data.channels);

  return (
    <>
      {preview && <PreviewNote />}
      <div className="cmd">
        <ChannelRail groups={groups} needsCount={needs.length} selected={selected ? selected.slug : null} />
        {selected ? (
          <ChannelView
            channel={selected}
            actor={data.actor}
            messages={data.messages}
            items={data.items}
            digest={data.digest}
            now={now}
            primary={!!primary && primary.id === selected.id}
          />
        ) : (
          <NeedsView actor={data.actor} items={data.items} now={now} />
        )}
      </div>
    </>
  );
}

/** The plain line that says Command is reading the preview, not the API. */
function PreviewNote() {
  return (
    <p className="x-sub cmd-preview">
      Channels are not connected yet. What you see is a fixed preview of what the API will send, so
      nothing here changes a record.
    </p>
  );
}
