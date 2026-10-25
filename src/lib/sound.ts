import { bind, play, setEnabled, setVolume, unlock, type PlayOptions, type SoundName } from "cuelume";
import { soundConfig } from "@/config/sound";

const KEY = "mimi-sound";
type Area = Exclude<keyof typeof soundConfig, "enabled" | "defaultOn" | "volume">;

let ready = false;

/** The visitor's saved choice, or the default. */
export function isSoundOn(): boolean {
  if (!soundConfig.enabled) return false;
  try {
    const v = localStorage.getItem(KEY);
    return v === null ? soundConfig.defaultOn : v === "1";
  } catch {
    return soundConfig.defaultOn;
  }
}

/** Called once by SoundLayer. Wires data-cuelume-* attributes and returns the unbind. */
export function initSound(): () => void {
  setVolume(soundConfig.volume);
  setEnabled(isSoundOn());
  ready = true;
  const unbind = bind();
  return () => {
    ready = false;
    unbind();
  };
}

/** Play one cue for one interaction. Silent until SoundLayer is mounted, or when the area is off. */
export function sfx(area: Area, name: SoundName, options?: PlayOptions): void {
  if (!ready || !soundConfig.enabled || !soundConfig[area]) return;
  play(name, options);
}

/** Speaker button: saves the choice and confirms it with one snap. */
export function setSound(on: boolean): void {
  try {
    localStorage.setItem(KEY, on ? "1" : "0");
  } catch {
    /* private mode: choice lasts for this visit */
  }
  if (on) {
    setEnabled(true);
    void unlock();
    play("toggle");
  } else {
    play("toggle", { direction: "back" });
    window.setTimeout(() => setEnabled(false), 160);
  }
  window.dispatchEvent(new Event("mimi-sound"));
}
