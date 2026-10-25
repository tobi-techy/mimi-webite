import { connectors, providus, type Connector } from "@/features/console/content/connectors";

/** Which connectors are connected in the demo session (Connectors page and payment providers). */
const initial: ReadonlySet<string> = new Set(connectors.filter((c) => c.connected).map((c) => c.key));
let connected = initial;
const listeners = new Set<() => void>();

export const connectorsStore = {
  get: (): ReadonlySet<string> => connected,
  getServer: (): ReadonlySet<string> => initial,
  set(key: string, on: boolean): void {
    const next = new Set(connected);
    if (on) next.add(key);
    else next.delete(key);
    connected = next;
    listeners.forEach((l) => l());
  },
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

export const findConnector = (key: string): Connector | undefined =>
  key === providus.key ? providus : connectors.find((c) => c.key === key);
