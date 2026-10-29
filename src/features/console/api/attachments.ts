/**
 * Console attachments (demo build): what the composer accepts before anything is uploaded, and
 * the plain words for a refusal. Pure (no browser APIs), so node:test runs it.
 *
 * The API (POST /v1/media, MIMI-AGENT mimi/api/uploads.py) checks the same list again and also
 * reads the file's first bytes, so a renamed file is refused there too.
 */

export type AttachKind = "image" | "voice" | "document";

/** The same 10 MB the API keeps (mimi.api.media.MAX_BYTES). */
export const MAX_ATTACH_BYTES = 10 * 1024 * 1024;
/** A recording stops (and sends) at five minutes. */
export const MAX_RECORD_S = 300;

const TYPES: Record<string, AttachKind> = {
  "image/jpeg": "image",
  "image/png": "image",
  "image/webp": "image",
  "audio/ogg": "voice",
  "audio/webm": "voice",
  "audio/mp4": "voice",
  "audio/mpeg": "voice",
  "audio/wav": "voice",
  "application/pdf": "document",
};

const BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  ogg: "audio/ogg",
  oga: "audio/ogg",
  opus: "audio/ogg",
  webm: "audio/webm",
  m4a: "audio/mp4",
  mp4: "audio/mp4",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  pdf: "application/pdf",
};

const ALIASES: Record<string, string> = {
  "image/jpg": "image/jpeg",
  "audio/x-wav": "audio/wav",
  "audio/wave": "audio/wav",
  "audio/x-m4a": "audio/mp4",
  "audio/mp3": "audio/mpeg",
  "video/webm": "audio/webm",
};

/** "audio/webm;codecs=opus" -> "audio/webm"; an empty type falls back to the file name. */
export function baseMime(type: string, name = ""): string {
  const t = (type.split(";", 1)[0] ?? "").trim().toLowerCase();
  const m = ALIASES[t] ?? t;
  if (m && m !== "application/octet-stream") return m;
  const ext = /\.([a-z0-9]+)$/i.exec(name)?.[1]?.toLowerCase() ?? "";
  return BY_EXT[ext] ?? m;
}

/** What the picker was for: a photo, a voice note, or an invoice (a PDF or a photo of one). */
export type AttachPurpose = "photo" | "voice" | "invoice";

export type AttachCheck = { ok: true; kind: AttachKind; mime: string } | { ok: false; error: string };

const WANTS: Record<AttachPurpose, { kinds: AttachKind[]; say: string }> = {
  photo: { kinds: ["image"], say: "Mimi takes photos as JPEG, PNG or WebP." },
  voice: { kinds: ["voice"], say: "Mimi takes voice notes as Ogg, WebM, M4A, MP3 or WAV." },
  invoice: { kinds: ["document", "image"], say: "Invoices go in as a PDF or a photo (JPEG, PNG or WebP)." },
};

/** Checks one file before it is uploaded: the type for what it was picked as, then the size. */
export function checkAttachment(f: { name: string; type: string; size: number }, purpose: AttachPurpose): AttachCheck {
  const mime = baseMime(f.type, f.name);
  const kind = TYPES[mime];
  const want = WANTS[purpose];
  if (!kind || !want.kinds.includes(kind)) return { ok: false, error: want.say };
  if (f.size <= 0) return { ok: false, error: "That file is empty." };
  if (f.size > MAX_ATTACH_BYTES) return { ok: false, error: `That file is ${sizeLabel(f.size)}. Mimi takes files up to 10 MB.` };
  return { ok: true, kind, mime };
}

/** Plain words for an upload the API refused (status and its detail). */
export function uploadRefusal(status: number, detail = ""): string | null {
  const d = detail.toLowerCase();
  if (status === 413) return "That file is over 10 MB. Mimi takes files up to 10 MB.";
  if (status === 415) return d.includes("not the type") ? "That file isn't what its name says, so Mimi didn't keep it." : "Mimi can't read that kind of file.";
  if (status === 422 && d.includes("empty")) return "That file is empty.";
  if (status === 422 && d.includes("attach the file again")) return "Mimi lost that file. Attach it again.";
  if (status === 429 && d.includes("files")) return "This demo has all the files it can take. Reset the demo to start again.";
  return null;
}

export function sizeLabel(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(/\.0$/, "")} MB`;
}

/** The recorder type this browser supports, best first (Chrome and Firefox: WebM, Safari: MP4). */
export function pickRecorderMime(isSupported: (t: string) => boolean): string {
  for (const t of ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"]) {
    try {
      if (isSupported(t)) return t;
    } catch {
      /* a browser that throws on the question */
    }
  }
  return "";
}

/** A caption like "Invoice INV-2304.pdf" for a document; photos and voice notes have their own labels. */
export const attachLabel = (kind: AttachKind, name: string): string =>
  kind === "document" ? name || "Document" : kind === "voice" ? "Your voice note" : "1 Photo";
