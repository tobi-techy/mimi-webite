"use client";

import { useState } from "react";
import { loadTaskFile } from "@/features/console/api/computer-tasks";
import { Icon } from "@/features/console/components/ui/Icon";

/**
 * A file a task left behind. The bytes come through the API as a Blob, so the session token never
 * lands in a link, and the file is saved under the name the service gave it. A file that cannot be
 * read says so; no stand-in file is ever shown.
 */
export function TaskFile({ taskId, name, label }: { taskId: string; name: string; label: string }) {
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  async function save() {
    setFailed(false);
    setBusy(true);
    let url = "";
    try {
      const blob = await loadTaskFile(name, taskId);
      url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      a.rel = "noreferrer noopener";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch {
      if (url) URL.revokeObjectURL(url);
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="x-ctfile">
      <Icon name="file-text" />
      <span className="x-ctfile__n">{label}</span>
      <button type="button" className="x-ctfile__b" onClick={() => void save()} disabled={busy}>
        {busy ? "Getting it" : "Save it"}
      </button>
      {failed && (
        <span className="x-ctfile__bad" role="status">
          This file could not be read.
        </span>
      )}
    </span>
  );
}
