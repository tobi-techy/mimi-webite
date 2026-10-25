/** A tiny external store for the tap-to-slap sticker count shown in the footer. */
type Listener = () => void;

let count = 0;
const listeners = new Set<Listener>();

export const slapStore = {
  get: (): number => count,
  getServer: (): number => 0,
  increment(): void {
    count += 1;
    listeners.forEach((l) => l());
  },
  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
