"use client";

import { useEffect, useState } from "react";
import { loadScreenshot } from "@/features/console/api/computer-tasks";

type Loaded = { for: string; url?: string; failed?: boolean };

/**
 * One step's screenshot, read through the API as a Blob so the session token never lands in an
 * `<img src>`. When there is no screenshot, or it cannot be read, the step says so in words: a
 * broken image or a stand-in picture is never shown.
 */
export function TaskScreenshot({
  taskId,
  source,
  alt,
}: {
  taskId: string;
  source: string | null | undefined;
  alt: string;
}) {
  const key = `${taskId}\n${source ?? ""}`;
  const [loaded, setLoaded] = useState<Loaded | null>(null);

  useEffect(() => {
    if (!source) return;
    let url = "";
    let alive = true;
    const ctrl = new AbortController();
    loadScreenshot(source, taskId, ctrl.signal)
      .then((blob) => {
        if (!alive) return;
        /* a 2xx that is not a picture (a JSON "not captured yet", an empty body) is not shown as one */
        if (!blob.type.startsWith("image/")) {
          setLoaded({ for: key, failed: true });
          return;
        }
        url = URL.createObjectURL(blob);
        setLoaded({ for: key, url });
      })
      .catch(() => {
        if (alive) setLoaded({ for: key, failed: true });
      });
    return () => {
      alive = false;
      ctrl.abort();
      if (url) URL.revokeObjectURL(url);
    };
  }, [key, source, taskId]);

  if (!source) return <span className="x-ctss x-ctss--none">No screenshot for this step.</span>;
  if (loaded?.for === key) {
    if (loaded.failed) return <span className="x-ctss x-ctss--bad">Screenshot could not be shown.</span>;
    return <img className="x-ctss__img" src={loaded.url} alt={alt} loading="lazy" decoding="async" onError={() => setLoaded({ for: key, failed: true })} />;
  }
  return <span className="x-ctss x-ctss--load" role="status" aria-label="Loading the screenshot" />;
}
