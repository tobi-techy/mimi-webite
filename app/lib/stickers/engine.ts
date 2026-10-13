import { STICKERS, type StickerConfig } from "./config";
import {
  applyBounds,
  applyDragConstraint,
  applyThrow,
  clamp,
  computeReleaseVelocity,
  integrateBody,
  isSettled,
  resolveCollisions,
  resolveInitialOverlap,
  rotate,
  type PhysicsBody,
  type PhysicsWorld,
  type PointerSample,
  type Vec,
} from "./physics";
import { canTilt, requestTilt, startTiltSensor } from "./tilt";

type Mode = "mobile" | "tablet" | "desktop";

export type StickerClassNames = {
  sticker: string;
  body: string;
  image: string;
  awake: string;
  grabbed: string;
};

type StickerBody = PhysicsBody & {
  cfg: StickerConfig;
  el: HTMLDivElement;
  bodyEl: HTMLDivElement;
  img: HTMLImageElement;
  touched: boolean;
  thrown: boolean;
  mask: { w: number; h: number; data: Uint8Array } | null;
  samples: PointerSample[];
  pointerId: number | null;
};

const MOBILE_MAX = 640;
const TABLET_MAX = 1024;
const EASE_OUT = "cubic-bezier(.22, 1, .36, 1)";
const FALL_EASING = "cubic-bezier(.45, .05, .75, .6)";
const IMPACT_EASING = "cubic-bezier(.2, 1.4, .4, 1)";
const ENTRANCE_STAGGER = 30;
const TILT_FORCE = 0.14;
/* Cursor proximity: how far a pointer reaches into the pile, how hard it pushes, and
 * how far it must travel before it pushes again so a jittering mouse cannot pump. */
const POKE_REACH = 0.2;
const POKE_FORCE = 1.9;
const POKE_MIN_TRAVEL = 3;

function viewportMode(width: number): Mode {
  if (width < MOBILE_MAX) return "mobile";
  if (width < TABLET_MAX) return "tablet";
  return "desktop";
}

function sizeFactor(mode: Mode, W: number, H: number) {
  if (mode === "mobile") return clamp(W / 390, 0.9, 1.15);
  if (mode === "tablet") return 0.76 * clamp(W / 900, 0.85, 1.1);
  return clamp(Math.min(W / 1440, H / 900), 0.72, 1.12);
}

export class StickerEngine {
  private readonly hero: HTMLElement;
  private readonly field: HTMLElement;
  private readonly header: HTMLElement | null;
  private readonly classes: StickerClassNames;
  private readonly reducedQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  private readonly hoverQuery = window.matchMedia("(hover: hover)");
  private readonly resizeObserver: ResizeObserver;

  private readonly world: PhysicsWorld = {
    W: 0,
    H: 0,
    safe: { l: 0, t: 0, r: 0, b: 0 },
    gravity: 0.08,
    tiltX: 0,
    tiltY: 0,
    tiltActive: false,
    maxVelocity: 28,
    collisionSoftness: 0.6,
    frictionBias: 1,
    edgeOverlap: 36,
    intensity: 1,
  };

  private mode: Mode | null = null;
  private bodies: StickerBody[] = [];
  private order: StickerBody[] = [];
  private byEl = new Map<Element, StickerBody>();
  private headerBottom = 0;
  private heroHeight = 1;
  private reduced: boolean;
  private running = false;
  private lastTime = 0;
  private frame = 0;
  private idleTimer = 0;
  private resizeTimer = 0;
  private safeZoneTimer = 0;
  private stopTilt: (() => void) | null = null;
  private tiltAsked = false;
  private pokeAt: Vec = { x: 0, y: 0 };

  constructor(hero: HTMLElement, field: HTMLElement, classes: StickerClassNames) {
    this.hero = hero;
    this.field = field;
    this.header = document.querySelector("[data-hero-header]");
    this.classes = classes;
    this.reduced = this.reducedQuery.matches;

    this.layout();
    if (!this.reduced) this.playEntrance();
    this.safeZoneTimer = window.setTimeout(() => this.measureSafeZone(), 1300);
    this.scheduleIdleMotion();
    this.updateScrollIntensity();

    this.field.addEventListener("pointerdown", this.beginDrag);
    this.field.addEventListener("pointermove", this.updateHoverTilt, { passive: true });
    this.field.addEventListener("pointermove", this.pokePile, { passive: true });
    this.field.addEventListener("pointerout", this.resetHoverTilt, { passive: true });
    this.hero.addEventListener("pointerdown", this.enableTilt, { once: true });
    window.addEventListener("scroll", this.updateScrollIntensity, { passive: true });
    this.reducedQuery.addEventListener("change", this.applyReducedMotion);

    this.resizeObserver = new ResizeObserver(this.onResize);
    this.resizeObserver.observe(hero);
  }

  destroy() {
    cancelAnimationFrame(this.frame);
    clearTimeout(this.idleTimer);
    clearTimeout(this.resizeTimer);
    clearTimeout(this.safeZoneTimer);
    this.stopTilt?.();
    this.resizeObserver.disconnect();
    this.field.removeEventListener("pointerdown", this.beginDrag);
    this.field.removeEventListener("pointermove", this.updateHoverTilt);
    this.field.removeEventListener("pointermove", this.pokePile);
    this.field.removeEventListener("pointerout", this.resetHoverTilt);
    this.hero.removeEventListener("pointerdown", this.enableTilt);
    window.removeEventListener("scroll", this.updateScrollIntensity);
    this.reducedQuery.removeEventListener("change", this.applyReducedMotion);
    delete document.documentElement.dataset.dragging;
    this.field.replaceChildren();
  }

  /* ---------- Setup and layout ---------- */

  private configurePhysics(mode: Mode, W: number, H: number) {
    const unit = Math.min(W, H) / 100;
    this.world.gravity = 0.08 * clamp(H / 900, 0.65, 1.3);
    this.world.maxVelocity = (mode === "mobile" ? 2.4 : mode === "tablet" ? 3 : 3.2) * unit;
    this.world.collisionSoftness = mode === "mobile" ? 0.42 : mode === "tablet" ? 0.52 : 0.6;
    this.world.frictionBias = mode === "mobile" ? 1.15 : 1;
    this.world.edgeOverlap = mode === "mobile" ? 24 : 36;
  }

  private createBody(cfg: StickerConfig): StickerBody {
    const el = document.createElement("div");
    el.className = this.classes.sticker;
    el.setAttribute("aria-hidden", "true");
    el.style.setProperty("--hover-scale", String(cfg.hoverScale));
    el.style.setProperty("--grab-scale", String(cfg.grabScale));
    el.style.setProperty("--squash-x", String(cfg.squash[0]));
    el.style.setProperty("--squash-y", String(cfg.squash[1]));

    const bodyEl = document.createElement("div");
    bodyEl.className = this.classes.body;

    const img = new Image();
    img.className = this.classes.image;
    img.alt = "";
    img.draggable = false;
    img.decoding = "async";
    img.src = cfg.src;

    bodyEl.append(img);
    el.append(bodyEl);

    const body: StickerBody = {
      cfg,
      el,
      bodyEl,
      img,
      mass: cfg.mass,
      friction: cfg.friction,
      restitution: cfg.restitution,
      air: cfg.air,
      angular: cfg.angular,
      flex: cfg.flex,
      x: 0,
      y: 0,
      r: cfg.rotation,
      w: 0,
      h: 0,
      radius: 0,
      vx: 0,
      vy: 0,
      va: 0,
      flutterX: 1,
      phase: Math.random() * Math.PI * 2,
      awake: false,
      dragging: false,
      covering: false,
      coverTime: 0,
      stillTime: 0,
      pointer: { x: 0, y: 0 },
      grabLocal: { x: 0, y: 0 },
      touched: false,
      thrown: false,
      mask: null,
      samples: [],
      pointerId: null,
    };

    if (img.complete && img.naturalWidth) this.buildAlphaMask(body);
    else img.addEventListener("load", () => this.buildAlphaMask(body), { once: true });
    return body;
  }

  private buildAlphaMask(body: StickerBody) {
    try {
      const w = 72;
      const h = Math.max(1, Math.round(72 / body.cfg.aspect));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;
      ctx.drawImage(body.img, 0, 0, w, h);
      const pixels = ctx.getImageData(0, 0, w, h).data;
      const data = new Uint8Array(w * h);
      for (let i = 0; i < data.length; i++) data[i] = pixels[i * 4 + 3];
      body.mask = { w, h, data };
    } catch {
      body.mask = null;
    }
  }

  private buildStickers() {
    this.field.replaceChildren();
    this.byEl.clear();
    const configs = this.mode === "mobile" ? STICKERS.filter((c) => c.mobile) : STICKERS;
    this.bodies = configs.map((cfg) => this.createBody(cfg));
    this.order = this.bodies
      .map((b, i) => ({ b, i }))
      .sort((p, q) => q.b.cfg.layer - p.b.cfg.layer || p.i - q.i)
      .map((p) => p.b);
    for (const body of this.order) {
      this.field.append(body.el);
      this.byEl.set(body.el, body);
    }
    this.restack();
  }

  private restack() {
    this.order.forEach((body, i) => {
      body.el.style.zIndex = String(10 + i);
    });
  }

  private bringToFront(body: StickerBody) {
    this.order.splice(this.order.indexOf(body), 1);
    this.order.push(body);
    this.restack();
  }

  private measureSafeZone() {
    const heroRect = this.hero.getBoundingClientRect();
    const rects: DOMRect[] = [];
    const range = document.createRange();
    for (const node of this.hero.querySelectorAll("[data-safe-zone]")) {
      if (node instanceof HTMLAnchorElement || node instanceof HTMLButtonElement) {
        rects.push(node.getBoundingClientRect());
        continue;
      }
      range.selectNodeContents(node);
      rects.push(...Array.from(range.getClientRects()));
    }
    if (!rects.length) return;
    const pad = this.mode === "mobile" ? 10 : 18;
    this.world.safe = {
      l: Math.min(...rects.map((r) => r.left)) - heroRect.left - pad,
      t: Math.min(...rects.map((r) => r.top)) - heroRect.top - pad,
      r: Math.max(...rects.map((r) => r.right)) - heroRect.left + pad,
      b: Math.max(...rects.map((r) => r.bottom)) - heroRect.top + pad,
    };
    this.headerBottom = this.header ? this.header.getBoundingClientRect().bottom - heroRect.top : 0;
  }

  private layout() {
    const W = this.hero.clientWidth;
    const H = this.hero.clientHeight;
    const mode = viewportMode(W);
    const prevW = this.world.W || W;
    const prevH = this.world.H || H;
    const rebuilt = mode !== this.mode;
    if (rebuilt) {
      this.mode = mode;
      this.buildStickers();
    }
    this.world.W = W;
    this.world.H = H;
    this.heroHeight = this.hero.offsetHeight || H;
    this.configurePhysics(mode, W, H);
    this.measureSafeZone();

    const factor = sizeFactor(mode, W, H);
    for (const body of this.bodies) {
      const placement = mode === "mobile" ? { ...body.cfg, ...body.cfg.mobile } : body.cfg;
      const longest = placement.size * factor;
      body.w = body.cfg.aspect >= 1 ? longest : longest * body.cfg.aspect;
      body.h = body.cfg.aspect >= 1 ? longest / body.cfg.aspect : longest;
      body.radius = (body.w + body.h) * 0.24;
      body.el.style.width = `${body.w}px`;
      body.el.style.height = `${body.h}px`;
      if (rebuilt || !body.touched) {
        body.x = placement.x * W;
        body.y = placement.y * H;
        body.r = placement.rotation;
        resolveInitialOverlap(body, this.world, this.headerBottom);
      } else {
        body.x *= W / prevW;
        body.y *= H / prevH;
      }
      this.render(body);
    }
    return rebuilt;
  }

  private onResize = () => {
    clearTimeout(this.resizeTimer);
    this.resizeTimer = window.setTimeout(() => {
      if (this.hero.clientWidth === this.world.W && this.hero.clientHeight === this.world.H) return;
      if (this.layout() && !this.reduced) this.playEntrance();
      this.updateScrollIntensity();
    }, 120);
  };

  /* ---------- Simulation loop ---------- */

  private wake = (body: PhysicsBody) => {
    const sticker = body as StickerBody;
    if (sticker.awake) return;
    sticker.awake = true;
    sticker.stillTime = 0;
    sticker.el.classList.add(this.classes.awake);
  };

  private sleep(body: StickerBody) {
    body.awake = false;
    body.vx = body.vy = body.va = 0;
    body.flutterX = 1;
    body.covering = false;
    body.coverTime = 0;
    body.el.classList.remove(this.classes.awake);
    this.render(body);
    if (body.thrown) this.playLanding(body);
    body.thrown = false;
  }

  private sleepAll() {
    for (const body of this.bodies) if (body.awake && !body.dragging) this.sleep(body);
  }

  private step(dt: number) {
    let active = false;
    for (const body of this.bodies) {
      if (body.dragging) applyDragConstraint(body, this.world, dt);
      else if (body.awake) integrateBody(body, this.world, dt);
    }
    resolveCollisions(this.bodies, this.world, this.wake);
    for (const body of this.bodies) {
      if (!body.awake && !body.dragging) continue;
      if (!body.dragging) {
        applyBounds(body, this.world);
        if (isSettled(body, dt)) this.sleep(body);
      }
      if (body.awake || body.dragging) {
        this.render(body);
        active = true;
      }
    }
    return active;
  }

  private tick = (now: number) => {
    const dt = clamp((now - this.lastTime) / 16.667, 0.25, 2);
    this.lastTime = now;
    if (this.step(dt)) this.frame = requestAnimationFrame(this.tick);
    else this.running = false;
  };

  private ensureRunning() {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.frame = requestAnimationFrame(this.tick);
  }

  private render(body: StickerBody) {
    body.el.style.transform =
      `translate3d(${(body.x - body.w / 2).toFixed(2)}px, ${(body.y - body.h / 2).toFixed(2)}px, 0) ` +
      `rotate(${body.r.toFixed(3)}deg) scale(${body.flutterX.toFixed(4)}, 1)`;
  }

  /* ---------- Pointer interaction ---------- */

  private worldPoint(event: PointerEvent): Vec {
    const rect = this.hero.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  private hitTest(body: StickerBody, p: Vec): Vec | null {
    const local = rotate(p.x - body.x, p.y - body.y, -body.r);
    const u = local.x / body.w + 0.5;
    const v = local.y / body.h + 0.5;
    if (u < 0 || u > 1 || v < 0 || v > 1) return null;
    if (body.mask) {
      const mx = Math.min(body.mask.w - 1, Math.floor(u * body.mask.w));
      const my = Math.min(body.mask.h - 1, Math.floor(v * body.mask.h));
      if (body.mask.data[my * body.mask.w + mx] < 40) return null;
    }
    return local;
  }

  private pickSticker(event: PointerEvent) {
    const point = this.worldPoint(event);
    for (const el of document.elementsFromPoint(event.clientX, event.clientY)) {
      const body = this.byEl.get(el);
      if (!body) continue;
      const local = this.hitTest(body, point);
      if (local) return { body, local, point };
    }
    return null;
  }

  private beginDrag = (event: PointerEvent) => {
    if (this.reduced || this.world.intensity <= 0 || event.button > 0) return;
    const pick = this.pickSticker(event);
    if (!pick) return;
    event.preventDefault();
    const { body, local, point } = pick;
    body.el.setPointerCapture(event.pointerId);
    body.bodyEl.getAnimations().forEach((a) => a.finish());
    body.pointerId = event.pointerId;
    body.dragging = true;
    body.touched = true;
    body.thrown = false;
    body.coverTime = 0;
    body.grabLocal = local;
    body.pointer = point;
    body.samples = [{ x: point.x, y: point.y, t: event.timeStamp }];
    body.vx = body.vy = 0;
    body.va *= 0.3;
    body.el.style.setProperty("--tilt", "0deg");
    body.el.classList.add(this.classes.grabbed);
    this.wake(body);
    this.bringToFront(body);
    document.documentElement.dataset.dragging = "true";
    body.el.addEventListener("pointermove", this.moveDrag);
    body.el.addEventListener("pointerup", this.endDrag);
    body.el.addEventListener("pointercancel", this.cancelDrag);
    this.ensureRunning();
  };

  private moveDrag = (event: PointerEvent) => {
    const body = this.byEl.get(event.currentTarget as Element);
    if (!body || !body.dragging || event.pointerId !== body.pointerId) return;
    const p = this.worldPoint(event);
    body.pointer = {
      x: clamp(p.x, -body.w * 0.2, this.world.W + body.w * 0.2),
      y: clamp(p.y, -body.h * 0.2, this.world.H + body.h * 0.2),
    };
    body.samples.push({ x: body.pointer.x, y: body.pointer.y, t: event.timeStamp });
    while (body.samples.length > 2 && event.timeStamp - body.samples[0].t > 160) body.samples.shift();
  };

  private detachDrag(body: StickerBody, event: PointerEvent) {
    body.el.removeEventListener("pointermove", this.moveDrag);
    body.el.removeEventListener("pointerup", this.endDrag);
    body.el.removeEventListener("pointercancel", this.cancelDrag);
    if (body.el.hasPointerCapture(event.pointerId)) body.el.releasePointerCapture(event.pointerId);
    body.dragging = false;
    body.el.classList.remove(this.classes.grabbed);
    delete document.documentElement.dataset.dragging;
  }

  private endDrag = (event: PointerEvent) => {
    const body = this.byEl.get(event.currentTarget as Element);
    if (!body || !body.dragging || event.pointerId !== body.pointerId) return;
    this.detachDrag(body, event);
    applyThrow(body, computeReleaseVelocity(body.samples, event.timeStamp), this.world);
    body.thrown = true;
    this.ensureRunning();
  };

  private cancelDrag = (event: PointerEvent) => {
    const body = this.byEl.get(event.currentTarget as Element);
    if (!body || !body.dragging || event.pointerId !== body.pointerId) return;
    this.detachDrag(body, event);
    body.vx = body.vy = 0;
    this.ensureRunning();
  };

  private updateHoverTilt = (event: PointerEvent) => {
    if (!this.hoverQuery.matches || this.reduced || event.pointerType !== "mouse") return;
    const el = (event.target as Element).closest(`.${this.classes.sticker}`);
    const body = el && this.byEl.get(el);
    if (!el || !body || body.dragging) return;
    const p = this.worldPoint(event);
    const local = rotate(p.x - body.x, p.y - body.y, -body.r);
    const tilt = clamp(local.x / (body.w / 2), -1, 1) * 1.6 * Math.min(1, body.angular + 0.3);
    (el as HTMLElement).style.setProperty("--tilt", `${tilt.toFixed(2)}deg`);
  };

  private resetHoverTilt = (event: PointerEvent) => {
    const el = (event.target as Element).closest?.(`.${this.classes.sticker}`);
    if (el) (el as HTMLElement).style.setProperty("--tilt", "0deg");
  };

  /* A passing cursor is a hand brushing the pile: everything within reach is pushed
   * away, hard for paper and barely for a carton, so no drag is needed to play. */
  private pokePile = (event: PointerEvent) => {
    if (this.reduced || this.world.intensity <= 0 || event.buttons > 0) return;
    const point = this.worldPoint(event);
    if (Math.hypot(point.x - this.pokeAt.x, point.y - this.pokeAt.y) < POKE_MIN_TRAVEL) return;
    this.pokeAt = point;

    const reach = Math.min(this.world.W, this.world.H) * POKE_REACH * Math.max(this.world.intensity, 0.2);
    let touched = false;
    for (const body of this.bodies) {
      if (body.dragging) continue;
      const dx = body.x - point.x;
      const dy = body.y - point.y;
      const distance = Math.hypot(dx, dy);
      const edge = reach + body.radius * 0.5;
      if (distance > edge) continue;
      const falloff = Math.pow(1 - distance / edge, 1.5);
      const push = (POKE_FORCE * falloff) / Math.sqrt(body.mass);
      const nx = dx / (distance || 1);
      const ny = dy / (distance || 1);
      body.vx += nx * push;
      body.vy += ny * push;
      body.va += (nx * ny) * push * 0.04 * body.angular;
      this.wake(body);
      touched = true;
    }
    if (touched) this.ensureRunning();
  };

  /* ---------- Device tilt ---------- */

  private enableTilt = async () => {
    if (this.tiltAsked || this.reduced || !canTilt()) return;
    this.tiltAsked = true;
    if (!(await requestTilt())) return;
    this.stopTilt = startTiltSensor((x, y, active) => {
      if (this.world.intensity <= 0) return;
      this.world.tiltX = x * TILT_FORCE;
      this.world.tiltY = y * TILT_FORCE;
      this.world.tiltActive = active;
      if (!active) return;
      for (const body of this.bodies) if (!body.dragging) this.wake(body);
      this.ensureRunning();
    });
  };

  /* ---------- Choreography ---------- */

  private playEntrance() {
    if (this.reduced) return;
    /* Heavier objects land first and light ones flutter down after them. */
    const ranked = [...this.order].sort((a, b) => b.mass - a.mass);
    ranked.forEach((body, i) => {
      const from = -(body.y + body.h + 60);
      const roll = body.cfg.rotation >= 0 ? 9 : -9;
      body.bodyEl.animate(
        [
          { opacity: 0, transform: `translate3d(0, ${from}px, 0) rotate(${roll}deg)`, easing: FALL_EASING },
          { opacity: 1, transform: `translate3d(0, 7px, 0) rotate(${roll * 0.2}deg)`, offset: 0.78, easing: IMPACT_EASING },
          { transform: "translate3d(0, -3px, 0) rotate(0deg)", offset: 0.9, easing: "ease-out" },
          { transform: "none" },
        ],
        {
          duration: 900 + Math.min(body.mass, 3) * 120,
          delay: 150 + i * ENTRANCE_STAGGER,
          fill: "backwards",
        },
      );
    });
  }

  private playLanding(body: StickerBody) {
    if (this.reduced) return;
    if (body.mass >= 1.2) {
      body.bodyEl.animate(
        [{ transform: "none" }, { transform: "scale(.99)", offset: 0.4 }, { transform: "none" }],
        { duration: 280, easing: EASE_OUT },
      );
    } else if (body.mass < 0.6) {
      body.bodyEl.animate(
        [
          { transform: "none" },
          { transform: "rotate(.9deg)", offset: 0.35 },
          { transform: "rotate(-.4deg)", offset: 0.7 },
          { transform: "none" },
        ],
        { duration: 560, easing: "ease-out" },
      );
    }
  }

  private runIdleMotion() {
    if (document.hidden || this.world.intensity < 0.9) return;
    const pool = this.bodies.filter((b) => b.mass <= 0.5 && !b.awake && !b.dragging && !b.el.matches(":hover"));
    const count = Math.min(pool.length, 1 + Math.round(Math.random()));
    const sign = () => (Math.random() < 0.5 ? -1 : 1);
    for (let i = 0; i < count; i++) {
      const body = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
      const dx = sign() * (1 + Math.random());
      const dy = sign() * (1 + Math.random());
      const dr = sign() * (0.5 + Math.random() * 0.5);
      body.bodyEl.animate(
        [
          { transform: "none" },
          { transform: `translate(${dx.toFixed(2)}px, ${dy.toFixed(2)}px) rotate(${dr.toFixed(2)}deg)` },
          { transform: "none" },
        ],
        { duration: 1200 + Math.random() * 800, easing: "cubic-bezier(.45, 0, .55, 1)" },
      );
    }
  }

  private scheduleIdleMotion() {
    clearTimeout(this.idleTimer);
    if (this.reduced) return;
    this.idleTimer = window.setTimeout(() => {
      this.runIdleMotion();
      this.scheduleIdleMotion();
    }, 5000 + Math.random() * 3000);
  }

  private updateScrollIntensity = () => {
    const progress = window.scrollY / Math.max(1, this.heroHeight);
    this.world.intensity = progress <= 0.1 ? 1 : progress >= 0.3 ? 0 : 1 - (progress - 0.1) / 0.2;
    if (this.world.intensity === 0) this.sleepAll();
  };

  private applyReducedMotion = () => {
    this.reduced = this.reducedQuery.matches;
    if (!this.reduced) {
      this.scheduleIdleMotion();
      return;
    }
    clearTimeout(this.idleTimer);
    for (const body of this.bodies) {
      body.bodyEl.getAnimations().forEach((a) => a.cancel());
      if (body.awake && !body.dragging) this.sleep(body);
    }
  };
}
