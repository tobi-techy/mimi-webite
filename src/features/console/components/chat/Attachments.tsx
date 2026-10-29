"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { sizeLabel } from "@/features/console/api/attachments";
import { liveDropAttach, liveRetryAttach, loadMediaBlob } from "@/features/console/api/actions";
import { isAbort } from "@/features/console/api/client";
import { Icon } from "@/features/console/components/ui/Icon";
import type { Message, Upload, VoiceAudio } from "@/features/console/demo/types";

/**
 * Attachments in API threads (demo build): the upload line under an attachment the owner sent,
 * the document chip, and the two hooks that read audio and images through the API client (the
 * bearer goes in a header; the screen only ever sees a blob: URL, revoked when it unmounts).
 */

/** "Uploading 40%", "Sending", or the reason it was not sent with Retry (Remove when the file itself was refused). */
export function UploadLine({ slug, id, upload }: { slug: string; id: string; upload: Upload }) {
  if (upload.state === "failed")
    return (
      <p className="mc-up mc-up--bad mc-mono" role="alert">
        <span>Not sent. {upload.error}</span>
        {upload.final ? (
          <button type="button" className="mc-up__retry" onClick={() => liveDropAttach(slug, id)}>
            Remove
          </button>
        ) : (
          <button type="button" className="mc-up__retry" onClick={() => liveRetryAttach(slug, id)}>
            Retry
          </button>
        )}
      </p>
    );
  const pct = Math.round(upload.progress * 100);
  return (
    <p className="mc-up mc-mono" role="status" aria-live="polite">
      {upload.state === "uploading" ? (
        <>
          <span className="mc-up__bar" aria-hidden="true">
            <i style={{ width: `${pct}%` }} />
          </span>
          <span>Uploading {pct}%</span>
        </>
      ) : (
        <span>Sending</span>
      )}
    </p>
  );
}

type Load = { url: string | null; state: "idle" | "loading" | "ready" | "error" };

/**
 * A blob: URL for bytes behind the API (an attachment or a voice note). Starts when `on` is true,
 * aborts and revokes on unmount. `retry` starts it again after an error.
 */
export function useApiBlob(src: Exclude<VoiceAudio, { from: "local" }> | undefined, on: boolean): Load & { retry: () => void } {
  const [load, setLoad] = useState<Load>({ url: null, state: "idle" });
  const [attempt, setAttempt] = useState(0);
  const key = src ? `${src.from}:${src.id}` : "";
  useEffect(() => {
    if (!src || !on) return;
    const ctrl = new AbortController();
    let url: string | null = null;
    // a fetch is starting: show loading at once (the effect is the only place that knows)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoad({ url: null, state: "loading" });
    loadMediaBlob(src, ctrl.signal)
      .then((b) => {
        if (ctrl.signal.aborted) return;
        url = URL.createObjectURL(b);
        setLoad({ url, state: "ready" });
      })
      .catch((e) => {
        if (!isAbort(e) && !ctrl.signal.aborted) setLoad({ url: null, state: "error" });
      });
    return () => {
      ctrl.abort();
      if (url) URL.revokeObjectURL(url);
    };
    // the key stands for src; attempt restarts it
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, on, attempt]);
  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  return { ...load, retry };
}

/** The one voice note playing now: starting another pauses it. */
let current: HTMLAudioElement | null = null;

export type Player = {
  playing: boolean;
  progress: number;
  /** Seconds, once the audio says. */
  duration: number | null;
  state: "idle" | "loading" | "ready" | "error";
  toggle: () => void;
};

/**
 * Real playback for a voice note with `audio`: fetched on the first tap (never before), played from
 * a blob: URL. Pauses, aborts and revokes on unmount. A recording still in this tab plays its own
 * blob: URL, which the attachment owns (revoked on reset).
 */
export function useVoicePlayer(audio: VoiceAudio | undefined): Player {
  const [wanted, setWanted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);
  const remote = audio && audio.from !== "local" ? audio : undefined;
  const blob = useApiBlob(remote, wanted);
  const url = audio?.from === "local" ? audio.url : blob.url;
  const el = useRef<HTMLAudioElement | null>(null);
  const autoplay = useRef(false);

  useEffect(() => {
    if (!url) return;
    const a = new Audio();
    a.preload = "metadata";
    a.src = url;
    el.current = a;
    const time = () => {
      const d = Number.isFinite(a.duration) && a.duration > 0 ? a.duration : null;
      if (d) setDuration(d);
      setProgress(d ? Math.min(1, a.currentTime / d) : 0);
    };
    const end = () => {
      setPlaying(false);
      setProgress(0);
      a.currentTime = 0;
    };
    const pause = () => setPlaying(false);
    const play = () => setPlaying(true);
    const err = () => {
      setFailed(true);
      setPlaying(false);
    };
    a.addEventListener("loadedmetadata", time);
    a.addEventListener("durationchange", time);
    a.addEventListener("timeupdate", time);
    a.addEventListener("ended", end);
    a.addEventListener("pause", pause);
    a.addEventListener("play", play);
    a.addEventListener("error", err);
    if (autoplay.current) {
      autoplay.current = false;
      if (current && current !== a) current.pause();
      current = a;
      a.play().catch(err);
    }
    return () => {
      a.pause();
      a.removeAttribute("src");
      a.load();
      if (current === a) current = null;
      el.current = null;
    };
  }, [url]);

  const toggle = useCallback(() => {
    const a = el.current;
    if (blob.state === "error" || failed) {
      setFailed(false);
      autoplay.current = true;
      blob.retry();
      return;
    }
    if (!a) {
      autoplay.current = true;
      setWanted(true);
      return;
    }
    if (a.paused) {
      if (current && current !== a) current.pause();
      current = a;
      a.play().catch(() => setFailed(true));
    } else a.pause();
  }, [blob, failed]);

  const state: Player["state"] = failed || blob.state === "error" ? "error" : audio?.from === "local" ? "ready" : blob.state === "idle" ? "idle" : blob.state;
  return { playing, progress, duration, state, toggle };
}

/** A document the owner attached: opens in a new tab from a blob: URL (never a URL with a token). */
export function FileChip({ m, slug }: { m: Extract<Message, { kind: "file" }>; slug: string }) {
  const [want, setWant] = useState(false);
  const remote = !m.local && m.remote ? { from: "media" as const, id: m.remote } : undefined;
  const blob = useApiBlob(remote, want);
  const href = m.local ?? blob.url ?? undefined;
  const sub = [m.mime === "application/pdf" ? "PDF" : "File", m.size ? sizeLabel(m.size) : ""].filter(Boolean).join(" · ");
  const body = (
    <>
      <span className="mc-chipcard__i">
        <Icon name="file-text" />
      </span>
      <span>
        {m.name}
        <small className="mc-mono">{blob.state === "loading" ? "Opening" : blob.state === "error" ? "Couldn't open it. Tap to try again" : sub}</small>
      </span>
      <Icon name="chevron-right" />
    </>
  );
  return (
    <div className="mc-att">
      {href ? (
        <a className="mc-chipcard" href={href} target="_blank" rel="noopener noreferrer">
          {body}
        </a>
      ) : (
        <button type="button" className="mc-chipcard" onClick={() => (blob.state === "error" ? blob.retry() : setWant(true))} disabled={!remote}>
          {body}
        </button>
      )}
      {m.upload && <UploadLine slug={slug} id={m.id} upload={m.upload} />}
    </div>
  );
}
