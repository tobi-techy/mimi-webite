import { MIMI_API_URL } from "@/features/console/api/config";
import { errorKind, type ErrorKind } from "@/features/console/api/mappers";
import type {
  ApiApprovalList,
  ApiCredit,
  ApiDecision,
  ApiDemoSession,
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
 * - The bearer goes in the Authorization header only: never in a URL, never logged.
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
  const ctrl = new AbortController();
  const onAbort = () => ctrl.abort();
  o.signal?.addEventListener("abort", onAbort, { once: true });
  const timer = setTimeout(() => ctrl.abort(), o.timeoutMs ?? TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(`${MIMI_API_URL}${path}`, {
      method: o.method ?? "GET",
      headers: {
        Accept: "application/json",
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
  return (await res.json()) as T;
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

  shops: (token: string, o: Sig = {}) => call<ApiShopList>("/v1/shops", { token, ...o }),
  shop: (token: string, id: string, o: Sig = {}) => call<ApiShopDetail>(`/v1/shops/${q(id)}`, { token, ...o }),
  credit: (token: string, o: Sig = {}) => call<ApiCredit>("/v1/credit", { token, ...o }),
};
