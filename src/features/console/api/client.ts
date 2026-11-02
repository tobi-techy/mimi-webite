import { MIMI_API_URL } from "@/features/console/api/config";
import { errorKind, type ErrorKind } from "@/features/console/api/mappers";
import type {
  ApiApprovalList,
  ApiCredit,
  ApiDecision,
  ApiDemoSession,
  ApiMe,
  ApiMedia,
  ApiShopDetail,
  ApiShopList,
  ApiThreadDetail,
  ApiThreadList,
  ApiTurn,
  ApiTurnIn,
} from "@/features/console/api/types";

/**
 * The one typed client for the MIMI-AGENT API. Nothing else in the console calls fetch.
 *
 * - Every call has a timeout and takes an optional AbortSignal (abort on unmount).
 * - Reads (GET) retry with backoff on network errors and 502/504. Writes never retry, except
 *   POST /v1/turns, which the API dedupes on `message_id`, so resending the same body is safe.
 * - The bearer goes in the Authorization header only: never in a URL, never logged. Audio and
 *   attachments are read as blobs with the header (the screen plays them from a blob: URL), so no
 *   token ever ends up in an <audio> or <img> src.
 * - Uploads (POST /v1/media) go through XMLHttpRequest, still here, because fetch cannot report
 *   upload progress. Same header, same timeout and abort rules.
 */
export class MimiApiError extends Error {
  readonly status: number;
  readonly kind: ErrorKind;
  readonly detail: string;
  constructor(status: number, detail: string) {
    super(detail || `HTTP ${status}`);
    this.name = "MimiApiError";
    this.status = status;
    this.detail = detail;
    this.kind = errorKind(status, detail);
  }
}

export const isAbort = (e: unknown): boolean => e instanceof DOMException && e.name === "AbortError";

type Opts = {
  token?: string | null;
  method?: "GET" | "POST";
  body?: unknown;
  timeoutMs?: number;
  signal?: AbortSignal;
  /** Retries with backoff (GETs and the deduped turn POST only). */
  retries?: number;
  /** Read the body as a Blob (audio, attachments) instead of JSON. */
  blob?: boolean;
};

const TIMEOUT_MS = 15_000;
const BACKOFF_MS = [400, 1200, 3000];
const retryable = (e: unknown) => e instanceof MimiApiError && (e.status === 0 || e.status === 502 || e.status === 504);

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => (clearTimeout(t), reject(new DOMException("Aborted", "AbortError"))), { once: true });
  });
}

async function once<T>(path: string, o: Opts): Promise<T> {
  const accept = o.blob ? "*/*" : "application/json";
  const ctrl = new AbortController();
  const onAbort = () => ctrl.abort();
  o.signal?.addEventListener("abort", onAbort, { once: true });
  const timer = setTimeout(() => ctrl.abort(), o.timeoutMs ?? TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(`${MIMI_API_URL}${path}`, {
      method: o.method ?? "GET",
      headers: {
        Accept: accept,
        ...(o.body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(o.token ? { Authorization: `Bearer ${o.token}` } : {}),
      },
      body: o.body !== undefined ? JSON.stringify(o.body) : undefined,
      signal: ctrl.signal,
      cache: "no-store",
      credentials: "omit",
    });
  } catch {
    if (o.signal?.aborted) throw new DOMException("Aborted", "AbortError");
    throw new MimiApiError(0, "unreachable");
  } finally {
    clearTimeout(timer);
    o.signal?.removeEventListener("abort", onAbort);
  }
  if (!res.ok) {
    let detail = "";
    try {
      const j = (await res.json()) as { detail?: unknown };
      detail = typeof j.detail === "string" ? j.detail : "";
    } catch {
      /* not JSON */
    }
    throw new MimiApiError(res.status, detail);
  }
  if (o.blob) {
    try {
      return (await res.blob()) as T;
    } catch {
      if (o.signal?.aborted) throw new DOMException("Aborted", "AbortError");
      throw new MimiApiError(0, "unreachable");
    }
  }
  return (await res.json()) as T;
}

const UPLOAD_TIMEOUT_MS = 90_000;

/** One upload attempt with progress (0 to 1). Rejects like `once`. */
function uploadOnce(path: string, token: string, body: Blob, mime: string, o: { signal?: AbortSignal; onProgress?: (p: number) => void }): Promise<ApiMedia> {
  return new Promise((resolve, reject) => {
    if (o.signal?.aborted) return reject(new DOMException("Aborted", "AbortError"));
    const xhr = new XMLHttpRequest();
    const onAbort = () => xhr.abort();
    o.signal?.addEventListener("abort", onAbort, { once: true });
    const done = () => o.signal?.removeEventListener("abort", onAbort);
    xhr.open("POST", `${MIMI_API_URL}${path}`);
    xhr.timeout = UPLOAD_TIMEOUT_MS;
    xhr.withCredentials = false;
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.setRequestHeader("Content-Type", mime);
    xhr.setRequestHeader("Accept", "application/json");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && e.total > 0) o.onProgress?.(Math.min(1, e.loaded / e.total));
    };
    xhr.onload = () => {
      done();
      let j: unknown = null;
      try {
        j = JSON.parse(xhr.responseText);
      } catch {
        /* not JSON */
      }
      if (xhr.status >= 200 && xhr.status < 300 && j) return resolve(j as ApiMedia);
      const d = j && typeof (j as { detail?: unknown }).detail === "string" ? ((j as { detail: string }).detail) : "";
      reject(new MimiApiError(xhr.status, d));
    };
    xhr.onerror = xhr.ontimeout = () => {
      done();
      reject(new MimiApiError(0, "unreachable"));
    };
    xhr.onabort = () => {
      done();
      reject(new DOMException("Aborted", "AbortError"));
    };
    xhr.send(body);
  });
}

async function call<T>(path: string, o: Opts = {}): Promise<T> {
  const retries = o.retries ?? ((o.method ?? "GET") === "GET" ? 2 : 0);
  for (let attempt = 0; ; attempt++) {
    try {
      return await once<T>(path, o);
    } catch (e) {
      if (attempt >= retries || !retryable(e)) throw e;
      await sleep(BACKOFF_MS[attempt] ?? 3000, o.signal);
    }
  }
}

const q = (s: string) => encodeURIComponent(s);
type Sig = { signal?: AbortSignal };

export const mimiApi = {
  createDemoSession: () => call<ApiDemoSession>("/v1/demo/sessions", { method: "POST", timeoutMs: 20_000 }),
  resetDemo: (token: string) => call<ApiDemoSession>("/v1/demo/reset", { method: "POST", token, timeoutMs: 20_000 }),

  /** The caller; in demo mode also today's allowance, so the composer can shut before a refused send. */
  me: (token: string, o: Sig = {}) => call<ApiMe>("/v1/me", { token, ...o }),

  threads: (token: string, o: Sig = {}) => call<ApiThreadList>("/v1/threads?limit=50", { token, ...o }),
  thread: (token: string, id: string, o: Sig = {}) => call<ApiThreadDetail>(`/v1/threads/${q(id)}`, { token, ...o }),

  /** Queues one message and returns at once; poll `turn` for the replies. Safe to resend (deduped on message_id). */
  postTurn: (token: string, body: ApiTurnIn) => call<ApiTurn>("/v1/turns?wait=false", { method: "POST", token, body, retries: 2 }),
  turn: (token: string, id: string, o: Sig = {}) => call<ApiTurn>(`/v1/turns/${q(id)}`, { token, ...o }),

  approvals: (token: string, o: Sig = {}) => call<ApiApprovalList>("/v1/approvals?status=all", { token, ...o }),
  /** Approve or decline. Never retried: deciding twice is a 409. */
  decide: (token: string, id: string, approve: boolean) =>
    call<ApiDecision>(`/v1/approvals/${q(id)}/${approve ? "approve" : "reject"}?wait=false`, {
      method: "POST",
      token,
      body: { note: "", by: "owner" },
    }),

  /** A reply's voice note, as a blob to play from a blob: URL. */
  voice: (token: string, messageId: string, o: Sig = {}) => call<Blob>(`/v1/messages/${q(messageId)}/voice`, { token, blob: true, timeoutMs: 30_000, ...o }),
  /** Demo: an attachment the owner sent from the console, as a blob. */
  media: (token: string, messageId: string, o: Sig = {}) => call<Blob>(`/v1/messages/${q(messageId)}/media`, { token, blob: true, timeoutMs: 30_000, ...o }),
  /**
   * Demo: keep one attachment for a turn (raw body, its type in Content-Type). Safe to resend (the
   * API stores a file by its hash), so a network failure is retried once.
   */
  upload: async (token: string, body: Blob, mime: string, o: Sig & { onProgress?: (p: number) => void } = {}): Promise<ApiMedia> => {
    for (let attempt = 0; ; attempt++) {
      try {
        return await uploadOnce("/v1/media", token, body, mime, o);
      } catch (e) {
        if (attempt >= 1 || !retryable(e)) throw e;
        await sleep(BACKOFF_MS[0]!, o.signal);
      }
    }
  },

  shops: (token: string, o: Sig = {}) => call<ApiShopList>("/v1/shops", { token, ...o }),
  shop: (token: string, id: string, o: Sig = {}) => call<ApiShopDetail>(`/v1/shops/${q(id)}`, { token, ...o }),
  credit: (token: string, o: Sig = {}) => call<ApiCredit>("/v1/credit", { token, ...o }),
};
