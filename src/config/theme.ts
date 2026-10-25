/** Theme constants shared by the boot script, the toggle and both app shells. */
export type Theme = "dark" | "light";

/** Dark is the default; the saved choice lives under this key. */
export const THEME_STORAGE_KEY = "mimi-theme";
export const DEFAULT_THEME: Theme = "dark";

/** Circular reveal duration when the theme switches (View Transitions API). */
export const THEME_REVEAL_MS = 400;
