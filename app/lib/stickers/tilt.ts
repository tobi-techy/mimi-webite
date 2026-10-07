/*
 * Device tilt as a gravity vector. `gamma` is the left-right roll and `beta` the
 * front-back pitch, so the pull along the screen plane is their sines. The sensor
 * only counts as active while the device is actually being turned: a steady tilt
 * held for TILT_SETTLE_MS stops feeding force so resting stickers can settle.
 */
export type TiltHandler = (x: number, y: number, active: boolean) => void;

const DEG = Math.PI / 180;
const TILT_CHANGE = 0.06;
const TILT_DEADZONE = 0.15;
const TILT_SETTLE_MS = 1200;

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

type PermissionCapable = {
  requestPermission?: () => Promise<"granted" | "denied">;
};

function deviceOrientation(): (typeof window.DeviceOrientationEvent & PermissionCapable) | undefined {
  return window.DeviceOrientationEvent as
    | (typeof window.DeviceOrientationEvent & PermissionCapable)
    | undefined;
}

/** True when the device tilts with the screen, so asking for sensors is worthwhile. */
export function canTilt() {
  return typeof window !== "undefined" && Boolean(deviceOrientation()) && window.matchMedia("(pointer: coarse)").matches;
}

export async function requestTilt(): Promise<boolean> {
  if (!canTilt()) return false;
  const api = deviceOrientation();
  if (typeof api?.requestPermission !== "function") return true;
  try {
    return (await api.requestPermission()) === "granted";
  } catch {
    return false;
  }
}

export function startTiltSensor(onTilt: TiltHandler): () => void {
  if (typeof window === "undefined" || !deviceOrientation()) return () => {};

  let active = false;
  let last = { x: 0, y: 0 };
  let settleTimer = 0;

  const onOrientation = (event: DeviceOrientationEvent) => {
    if (event.beta === null || event.gamma === null) return;
    const x = Math.sin(clamp(event.gamma, -90, 90) * DEG);
    const y = Math.sin(clamp(event.beta, -90, 90) * DEG);
    const moved = Math.hypot(x - last.x, y - last.y) > TILT_CHANGE;
    last = { x, y };
    if (!moved && !active) return;

    const leaning = Math.hypot(x, y) > TILT_DEADZONE;
    active = leaning;
    onTilt(leaning ? x : 0, leaning ? y : 0, leaning);

    clearTimeout(settleTimer);
    if (!leaning) return;
    settleTimer = window.setTimeout(() => {
      active = false;
      onTilt(0, 0, false);
    }, TILT_SETTLE_MS);
  };

  window.addEventListener("deviceorientation", onOrientation);
  return () => {
    clearTimeout(settleTimer);
    window.removeEventListener("deviceorientation", onOrientation);
  };
}
