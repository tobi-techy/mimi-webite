export {};

declare global {
  interface Window {
    /** Set once the client motion layer is running; the boot script uses it as a no-JS fallback check. */
    __mimiMotion?: boolean;
  }
}
