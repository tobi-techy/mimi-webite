import { computers as initial, type Computer } from "@/features/console/content/computers";

/** In-memory computers for the demo session: Settings > Computers grid and "Pause all". */
let state: readonly Computer[] = initial;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

const sleep = (c: Computer): Computer => ({
  ...c,
  running: false,
  task: "Nothing running",
  uptime: "Asleep · just now",
});
const original = (name: string) => initial.find((c) => c.name === name);

export const computersStore = {
  get: (): readonly Computer[] => state,
  getServer: (): readonly Computer[] => initial,
  toggle(name: string): void {
    state = state.map((c) => {
      if (c.name !== name) return c;
      if (c.running) return sleep(c);
      const first = original(name);
      return {
        ...c,
        running: true,
        task: first?.running ? first.task : "Waiting for a task",
        uptime: "Up 0m",
      };
    });
    emit();
  },
  pauseAll(): void {
    state = state.map((c) => (c.running ? sleep(c) : c));
    emit();
  },
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
