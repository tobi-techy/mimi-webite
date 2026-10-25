/**
 * Mimi Alive: a tiny spring-driven face rig for the Mimi mascot.
 *
 * The head is treated as a sphere. Eyes and the bow are points on that sphere,
 * so turning the head (yaw / pitch) slides them across the face with proper
 * foreshortening, and the bow slips behind the head when she turns away.
 * Every value runs through a damped spring, so any change of mood or gaze
 * blends smoothly with a small natural overshoot. No dependencies.
 */

export type Mood =
  | "idle"
  | "happy"
  | "laugh"
  | "surprised"
  | "thinking"
  | "working"
  | "squeeze"
  | "sleepy"
  | "sad"
  | "wink"
  | "love";

type Pose = {
  w: number; // eye width multiplier
  h: number; // eye height multiplier
  bend: number; // vertical bend: + = happy arc (^), - = sad droop
  bendX: number; // horizontal bend: + = squeeze chevrons (> <)
  lid: number; // 0 open .. 1 closed (both eyes)
  wink: number; // 0 .. 1 closes the right eye only
  tilt: number; // head roll in degrees
  squash: number; // + squash, - stretch
  lift: number; // head lift in px (negative = up)
  gazeY: number; // eye drift on the face, -1 up .. 1 down
  spread: number; // eye spacing multiplier
};

const BASE: Pose = { w: 1, h: 1, bend: 0, bendX: 0, lid: 0, wink: 0, tilt: -6, squash: 0, lift: 0, gazeY: 0, spread: 1 };

export const MOODS: Record<Mood, Partial<Pose>> = {
  idle: {},
  happy: { w: 1.2, h: 0.6, bend: 0.75, gazeY: -0.15, tilt: -10, squash: 0.03 },
  laugh: { w: 1.25, h: 0.55, bend: 0.85, gazeY: -0.2, tilt: -4, squash: 0.06 },
  surprised: { w: 1.25, h: 1.25, lift: -8, squash: -0.06, tilt: 0, spread: 1.04 },
  thinking: { w: 0.9, h: 0.85, gazeY: -0.55, tilt: -14, lid: 0.18 },
  working: { w: 0.95, h: 0.8, gazeY: 0.25, tilt: -3, lid: 0.12 },
  squeeze: { w: 0.55, h: 1.05, bendX: 1, squash: 0.12, tilt: 0, spread: 0.92 },
  sleepy: { lid: 0.72, tilt: -16, lift: 4, gazeY: 0.2 },
  sad: { w: 0.95, h: 0.9, bend: -0.3, gazeY: 0.4, tilt: -12, lift: 5 },
  wink: { wink: 1, tilt: -10, bend: 0.15 },
  love: { w: 1.15, h: 0.6, bend: 0.75, tilt: -8, squash: 0.04, gazeY: -0.1 },
};

class Spring {
  v = 0;
  constructor(public x: number, public k = 170, public c = 19) {}
  step(target: number, dt: number) {
    const a = this.k * (target - this.x) - this.c * this.v;
    this.v += a * dt;
    this.x += this.v * dt;
    return this.x;
  }
}

const NS = "http://www.w3.org/2000/svg";
const FACE =
  "M120 36c48 0 84 16 88 60 3 34-10 62-36 76-17 9-34 12-52 12s-35-3-52-12C42 158 29 130 32 96 36 52 72 36 120 36Z";
const BOW =
  "M0 0 C-8 -9 -20 -22 -33 -18 C-41 -15 -42 -2 -37 -1 C-42 2 -41 15 -33 17 C-21 21 -8 9 0 0Z M0 0 C8 -9 20 -22 33 -18 C41 -15 42 -2 37 -1 C42 2 41 15 33 17 C21 21 8 9 0 0Z";

// Head as a sphere in viewBox units
const CX = 120;
const CY = 112;
const RX = 86;
const RY = 72;
const EYE_YAW = 0.33; // radians from centre, each eye
const EYE_PITCH = -0.03;
const EYE_RX = 9.5;
const EYE_RY = 13;

/** Build an eye outline as a path: an ellipse that can bend into arcs or chevrons. */
function eyePath(cx: number, cy: number, rx: number, ry: number, rot: number, bend: number, bendX: number, mirror: number) {
  const n = 28;
  const cr = Math.cos(rot);
  const sr = Math.sin(rot);
  let d = "";
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * Math.PI * 2;
    let x = Math.cos(t) * rx;
    let y = Math.sin(t) * ry;
    // vertical bend: lift the ends, so a flat eye turns into a ^ arc (or a droop when negative)
    const u = rx > 0.01 ? x / rx : 0;
    y += bend * ry * 1.25 * (u * u - 0.35);
    // horizontal bend: push the middle outward so a tall eye turns into > or <
    const v = ry > 0.01 ? y / ry : 0;
    x += mirror * bendX * rx * 1.4 * (0.5 - v * v);
    const px = cx + x * cr - y * sr;
    const py = cy + x * sr + y * cr;
    d += (i ? "L" : "M") + px.toFixed(2) + " " + py.toFixed(2);
  }
  return d + "Z";
}

export type MimiAliveOptions = {
  /** Follow the pointer when it is near (default true). */
  follow?: boolean;
  /** Wander, blink and glance on its own (default true). */
  autonomous?: boolean;
  /** Starting mood. */
  mood?: Mood;
};

export class MimiAlive {
  svg: SVGSVGElement;
  private head: SVGGElement;
  private face: SVGPathElement;
  private eyeL: SVGPathElement;
  private eyeR: SVGPathElement;
  private bowFront: SVGGElement;
  private bowBack: SVGGElement;
  private cheekL: SVGEllipseElement;
  private cheekR: SVGEllipseElement;
  private raf = 0;
  private last = 0;
  private mood: Mood = "idle";
  private target = { yaw: 0, pitch: 0 };
  private pointer: { x: number; y: number; at: number } | null = null;
  private nextGlance = 0;
  private nextBlink = 0;
  private blinkT = -1;
  private scanT = 0;
  private bounceT = -1;
  private s: Record<string, Spring> = {};
  private opts: Required<MimiAliveOptions>;
  private reduced = false;
  private onMove = (e: PointerEvent) => {
    this.pointer = { x: e.clientX, y: e.clientY, at: performance.now() };
  };

  constructor(host: HTMLElement, options: MimiAliveOptions = {}) {
    this.opts = { follow: true, autonomous: true, mood: "idle", ...options };
    this.mood = this.opts.mood;
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", "0 0 240 220");
    svg.setAttribute("class", "x-mimi-alive");
    svg.setAttribute("aria-hidden", "true");
    const mk = <K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string>, parent: Element) => {
      const el = document.createElementNS(NS, tag);
      for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
      parent.appendChild(el);
      return el;
    };
    this.head = mk("g", {}, svg);
    this.bowBack = mk("g", { class: "x-mimi-alive__bow" }, this.head);
    mk("path", { d: BOW }, this.bowBack);
    mk("ellipse", { rx: "7.5", ry: "9" }, this.bowBack);
    this.face = mk("path", { d: FACE, class: "x-mimi-alive__face" }, this.head);
    this.cheekL = mk("ellipse", { class: "x-mimi-alive__cheek", rx: "9", ry: "5" }, this.head);
    this.cheekR = mk("ellipse", { class: "x-mimi-alive__cheek", rx: "9", ry: "5" }, this.head);
    this.eyeL = mk("path", { class: "x-mimi-alive__eye" }, this.head);
    this.eyeR = mk("path", { class: "x-mimi-alive__eye" }, this.head);
    this.bowFront = mk("g", { class: "x-mimi-alive__bow" }, this.head);
    mk("path", { d: BOW }, this.bowFront);
    mk("ellipse", { rx: "7.5", ry: "9" }, this.bowFront);
    host.appendChild(svg);
    this.svg = svg;

    const pose = { ...BASE, ...MOODS[this.mood] };
    for (const k of Object.keys(BASE) as (keyof Pose)[]) this.s[k] = new Spring(pose[k]);
    this.s.yaw = new Spring(0, 120, 17);
    this.s.pitch = new Spring(0, 120, 17);
    this.s.eyeLead = new Spring(0, 320, 26); // eyes arrive a beat before the head
    this.s.eyeLeadY = new Spring(0, 320, 26);
    this.s.blink = new Spring(0, 900, 48);
    this.s.bounce = new Spring(0, 260, 14);
    this.s.cheek = new Spring(0, 200, 22);

    this.reduced = typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (this.opts.follow) window.addEventListener("pointermove", this.onMove, { passive: true });
    this.render(0);
    if (!this.reduced) this.raf = requestAnimationFrame(this.tick);
  }

  /** Change mood; springs blend into it. */
  setMood(m: Mood) {
    if (m === this.mood) return;
    this.mood = m;
    if (m === "laugh" || m === "happy" || m === "love") this.bounceT = 0;
    if (this.reduced) this.render(1);
  }

  getMood() {
    return this.mood;
  }

  /** Point the head: yaw and pitch in -1..1 (left/right, up/down). */
  look(yaw: number, pitch: number) {
    this.target.yaw = Math.max(-1, Math.min(1, yaw));
    this.target.pitch = Math.max(-1, Math.min(1, pitch));
    this.nextGlance = performance.now() + 2200;
    if (this.reduced) this.render(1);
  }

  /** One blink now. */
  blink() {
    this.blinkT = 0;
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    window.removeEventListener("pointermove", this.onMove);
    this.svg.remove();
  }

  private tick = (now: number) => {
    const dt = Math.min(0.033, this.last ? (now - this.last) / 1000 : 0.016);
    this.last = now;
    this.behave(now, dt);
    this.render(dt);
    this.raf = requestAnimationFrame(this.tick);
  };

  private behave(now: number, dt: number) {
    // pointer follow wins while the pointer is moving and near
    let following = false;
    if (this.opts.follow && this.pointer && now - this.pointer.at < 2500) {
      const r = this.svg.getBoundingClientRect();
      const dx = this.pointer.x - (r.left + r.width / 2);
      const dy = this.pointer.y - (r.top + r.height / 2);
      const reach = Math.max(r.width * 3, 420);
      if (Math.hypot(dx, dy) < reach) {
        this.target.yaw = Math.tanh(dx / (r.width * 1.1));
        this.target.pitch = Math.tanh(dy / (r.height * 1.3));
        following = true;
      }
    }
    if (!following && this.opts.autonomous) {
      if (this.mood === "working") {
        // reading a ledger: quick left-to-right scans with a small return
        this.scanT += dt;
        const p = (this.scanT % 1.6) / 1.6;
        this.target.yaw = p < 0.8 ? -0.55 + (p / 0.8) * 1.1 : 0.55 - ((p - 0.8) / 0.2) * 1.1;
        this.target.pitch = 0.25 + Math.floor(this.scanT / 1.6) % 3 * 0.08;
      } else if (now > this.nextGlance) {
        const calm = this.mood === "sleepy" ? 0.25 : this.mood === "thinking" ? 0.5 : 1;
        const roll = Math.random();
        if (roll < 0.35) {
          this.target.yaw = 0;
          this.target.pitch = 0;
        } else {
          this.target.yaw = (Math.random() * 2 - 1) * 0.85 * calm;
          this.target.pitch = (Math.random() * 1.4 - 0.7) * 0.7 * calm;
        }
        if (this.mood === "thinking") {
          this.target.yaw = -0.45 + Math.random() * 0.2;
          this.target.pitch = -0.55;
        }
        this.nextGlance = now + 1300 + Math.random() * 2400;
      }
    }
    if (this.opts.autonomous && now > this.nextBlink) {
      if (this.mood !== "sleepy" && this.mood !== "happy" && this.mood !== "laugh" && this.mood !== "squeeze") this.blinkT = 0;
      this.nextBlink = now + 2400 + Math.random() * 3200;
      if (Math.random() < 0.18) this.nextBlink = now + 260; // double blink sometimes
    }
  }

  private render(dt: number) {
    const s = this.s;
    const pose = { ...BASE, ...MOODS[this.mood] };
    const step = (k: keyof Pose | string, t: number) => {
      const sp = s[k] as Spring;
      if (dt) return sp.step(t, dt);
      sp.x = t;
      return t;
    };
    const p = {} as Pose;
    for (const k of Object.keys(BASE) as (keyof Pose)[]) p[k] = step(k, pose[k]);

    // blink: quick close, slower open
    let blinkTarget = 0;
    if (this.blinkT >= 0) {
      this.blinkT += dt;
      blinkTarget = this.blinkT < 0.07 ? 1 : 0;
      if (this.blinkT > 0.35) this.blinkT = -1;
    }
    const blink = step("blink", blinkTarget);

    // laugh bounce
    let bounceTarget = 0;
    if (this.bounceT >= 0) {
      this.bounceT += dt;
      bounceTarget = this.mood === "laugh" ? Math.sin(this.bounceT * 18) * 3.2 : this.bounceT < 0.08 ? -6 : 0;
      if (this.mood !== "laugh" && this.bounceT > 0.6) this.bounceT = -1;
    }
    const bounce = step("bounce", bounceTarget);

    // gaze: eyes lead, head follows
    const ty = this.target.yaw;
    const tp = this.target.pitch;
    const yawN = step("yaw", ty);
    const pitchN = step("pitch", tp);
    const leadX = step("eyeLead", ty - yawN);
    const leadY = step("eyeLeadY", tp - pitchN);
    const yaw = yawN * 0.95; // radians-ish
    const pitch = pitchN * 0.55;

    // head body: parallax shift + squash/stretch around the chin
    const shiftX = Math.sin(yaw) * 10;
    const shiftY = Math.sin(pitch) * 7 + p.lift + bounce;
    const sx = 1 + p.squash * 0.9 - Math.abs(Math.sin(yaw)) * 0.025;
    const sy = 1 - p.squash;
    this.head.setAttribute(
      "transform",
      `translate(${(CX + shiftX).toFixed(2)} ${(196 + shiftY).toFixed(2)}) rotate(${p.tilt.toFixed(2)}) scale(${sx.toFixed(4)} ${sy.toFixed(4)}) translate(${-CX} -196)`,
    );

    // eyes on the sphere
    const lidAll = Math.min(1, p.lid + blink);
    const drawEye = (el: SVGPathElement, side: -1 | 1, extraLid: number) => {
      const th = side * EYE_YAW * p.spread + yaw + leadX * 0.25;
      const ph = EYE_PITCH + pitch + p.gazeY * 0.18 + leadY * 0.18;
      const z = Math.cos(th) * Math.cos(ph);
      const x = CX + RX * Math.sin(th) * Math.cos(ph);
      const y = CY + RY * Math.sin(ph);
      const fore = Math.max(0, z);
      const foreY = Math.max(0, Math.cos(ph));
      const lid = Math.min(1, lidAll + extraLid);
      const rx = EYE_RX * p.w * (0.25 + 0.75 * fore);
      const ry = Math.max(0.6, EYE_RY * p.h * (0.35 + 0.65 * foreY) * (1 - lid * 0.93));
      // eyes tilt along the curve of the face as they travel toward the edge
      const rot = -Math.sin(th) * Math.sin(ph) * 0.9;
      el.setAttribute("d", eyePath(x, y + lid * 5, rx, ry, rot, p.bend, p.bendX, -side));
      el.style.opacity = z > 0.05 ? "1" : "0";
      return { x, y, z };
    };
    const L = drawEye(this.eyeL, -1, 0);
    const R = drawEye(this.eyeR, 1, p.wink);

    // cheeks only when happy / love / laugh
    const cheekOn = this.mood === "happy" || this.mood === "laugh" || this.mood === "love" ? 1 : 0;
    const cheek = step("cheek", cheekOn);
    for (const [el, e, side] of [[this.cheekL, L, -1], [this.cheekR, R, 1]] as const) {
      el.setAttribute("cx", (e.x + side * 6).toFixed(2));
      el.setAttribute("cy", (e.y + 21).toFixed(2));
      el.style.opacity = (Math.max(0, cheek) * Math.max(0, e.z) * 0.9).toFixed(3);
    }

    // bow: a point on the upper right of the sphere
    const bth = 0.72 + yaw;
    const bph = -0.78 + pitch * 0.8;
    const bz = Math.cos(bth) * Math.cos(bph);
    const bx = CX + (RX + 6) * Math.sin(bth) * Math.cos(bph);
    const by = CY + (RY + 6) * Math.sin(bph);
    const bscale = 0.8 * (0.82 + 0.18 * Math.abs(Math.cos(bth)));
    const bt = `translate(${bx.toFixed(2)} ${by.toFixed(2)}) rotate(${(20 + yaw * 18).toFixed(2)}) scale(${(bscale * (0.6 + 0.4 * Math.abs(Math.cos(bth)))).toFixed(3)} ${bscale.toFixed(3)})`;
    this.bowFront.setAttribute("transform", bt);
    this.bowBack.setAttribute("transform", bt);
    const front = bz > -0.15;
    this.bowFront.style.opacity = front ? "1" : "0";
    this.bowBack.style.opacity = front ? "0" : "1";
  }
}
