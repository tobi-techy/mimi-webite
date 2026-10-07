export type Vec = { x: number; y: number };
export type Rect = { l: number; t: number; r: number; b: number };

export type PhysicsBody = {
  mass: number;
  friction: number;
  restitution: number;
  air: number;
  angular: number;
  flex: number;
  x: number;
  y: number;
  r: number;
  w: number;
  h: number;
  radius: number;
  vx: number;
  vy: number;
  va: number;
  flutterX: number;
  phase: number;
  awake: boolean;
  dragging: boolean;
  covering: boolean;
  coverTime: number;
  stillTime: number;
  pointer: Vec;
  grabLocal: Vec;
};

export type PhysicsWorld = {
  W: number;
  H: number;
  safe: Rect;
  gravity: number;
  tiltX: number;
  tiltY: number;
  tiltActive: boolean;
  maxVelocity: number;
  collisionSoftness: number;
  frictionBias: number;
  edgeOverlap: number;
  intensity: number;
};

export type PointerSample = { x: number; y: number; t: number };

const DEG = Math.PI / 180;
const SAFE_EDGE_ALLOWANCE = 14;
const MAX_COVER_TIME = 360;

export const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export function rotate(x: number, y: number, deg: number): Vec {
  const c = Math.cos(deg * DEG);
  const s = Math.sin(deg * DEG);
  return { x: x * c - y * s, y: x * s + y * c };
}

export function stickerBox(body: PhysicsBody) {
  const c = Math.abs(Math.cos(body.r * DEG));
  const s = Math.abs(Math.sin(body.r * DEG));
  const hw = ((body.w * c + body.h * s) / 2) * 0.86;
  const hh = ((body.w * s + body.h * c) / 2) * 0.86;
  return { hw, hh, l: body.x - hw, r: body.x + hw, t: body.y - hh, b: body.y + hh };
}

export function safeZoneOverlap(body: PhysicsBody, safe: Rect) {
  const k = stickerBox(body);
  return { k, x: Math.min(k.r - safe.l, safe.r - k.l), y: Math.min(k.b - safe.t, safe.b - k.t) };
}

export function resolveInitialOverlap(body: PhysicsBody, world: PhysicsWorld, headerBottom: number) {
  const { k, x, y } = safeZoneOverlap(body, world.safe);
  if (x <= 0 || y <= 0) return;
  const z = world.safe;
  const gap = 6;
  const fits = ({ dx, dy }: { dx: number; dy: number }) => {
    const nx = body.x + dx;
    const ny = body.y + dy;
    return (
      nx > -k.hw * 0.3 &&
      nx < world.W + k.hw * 0.3 &&
      ny - k.hh > headerBottom - k.hh * 0.5 &&
      ny < world.H + k.hh * 0.3
    );
  };
  const moves = [
    { dx: z.l - k.r - gap, dy: 0 },
    { dx: z.r - k.l + gap, dy: 0 },
    { dx: 0, dy: z.t - k.b - gap },
    { dx: 0, dy: z.b - k.t + gap },
  ]
    .filter(fits)
    .sort((p, q) => Math.hypot(p.dx, p.dy) - Math.hypot(q.dx, q.dy));
  const move = moves[0] ?? { dx: 0, dy: z.b - k.t + gap };
  body.x += move.dx;
  body.y += move.dy;
}

export function applyDragConstraint(body: PhysicsBody, world: PhysicsWorld, dt: number) {
  const prevX = body.x;
  const prevY = body.y;
  const o = rotate(body.grabLocal.x, body.grabLocal.y, body.r);
  const pullX = body.pointer.x - (body.x + o.x);
  const pullY = body.pointer.y - (body.y + o.y);
  if (Math.hypot(o.x, o.y) > 12) {
    const inertia = (body.w * body.w + body.h * body.h) / 8;
    body.va += ((o.x * pullY - o.y * pullX) / inertia) * 1.4 * body.angular * Math.max(world.intensity, 0.2);
  }
  body.va = clamp(body.va * Math.pow(0.8, dt), -6, 6);
  body.r += body.va * dt;
  const o2 = rotate(body.grabLocal.x, body.grabLocal.y, body.r);
  body.x = body.pointer.x - o2.x;
  body.y = body.pointer.y - o2.y;
  body.vx = (body.x - prevX) / dt;
  body.vy = (body.y - prevY) / dt;
}

function applySafeZone(body: PhysicsBody, world: PhysicsWorld, dt: number) {
  const { x, y } = safeZoneOverlap(body, world.safe);
  body.covering = x > SAFE_EDGE_ALLOWANCE && y > SAFE_EDGE_ALLOWANCE && body.coverTime < MAX_COVER_TIME;
  if (!body.covering) return;
  body.coverTime += dt;
  const z = world.safe;
  if (x < y) {
    const dir = body.x < (z.l + z.r) / 2 ? -1 : 1;
    body.vx += dir * Math.min(x, 160) * 0.0035 * dt;
  } else {
    const dir = body.y < (z.t + z.b) / 2 ? -1 : 1;
    body.vy += dir * Math.min(y, 160) * 0.0035 * dt;
  }
}

export function integrateBody(body: PhysicsBody, world: PhysicsWorld, dt: number) {
  const speed = Math.hypot(body.vx, body.vy);

  /* Weight only bites once something is already moving, so a resting pile stays put.
   * A tilted device is a real force on the table, so it pulls at rest too. */
  body.vy += world.gravity * Math.min(1, speed / 10) * dt;
  if (world.tiltActive) {
    body.vx += world.tiltX * dt;
    body.vy += world.tiltY * dt;
  }

  if (body.flex > 0 && speed > 0.6) {
    body.phase += 0.2 * dt;
    const wave = Math.sin(body.phase) * body.flex;
    const side = wave * 0.04 * Math.min(speed, 8) * dt;
    const nx = -body.vy / speed;
    const ny = body.vx / speed;
    body.va += wave * 0.06 * body.angular * dt;
    body.vx += nx * side;
    body.vy += ny * side;
  }

  applySafeZone(body, world, dt);

  const drag = Math.max(0, 1 - body.air * speed * dt);
  const damping = 1 + (1 - world.intensity) * 3;
  const friction = Math.pow(body.friction, dt * world.frictionBias * damping);
  body.vx *= drag * friction;
  body.vy *= drag * friction;
  body.va *= Math.pow(body.friction * 0.97, dt * damping);

  body.x += body.vx * dt;
  body.y += body.vy * dt;
  body.r += body.va * dt;
  body.flutterX = 1 - body.flex * 0.035 * Math.sin(body.phase * 1.3) * Math.min(1, speed / 6);
}

export function resolveCollisions(bodies: PhysicsBody[], world: PhysicsWorld, onWake: (body: PhysicsBody) => void) {
  for (let i = 0; i < bodies.length; i++) {
    const a = bodies[i];
    for (let j = i + 1; j < bodies.length; j++) {
      const b = bodies[j];
      if (!(a.awake || a.dragging || b.awake || b.dragging)) continue;
      if (a.dragging && b.dragging) continue;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.hypot(dx, dy);
      const reach = a.radius + b.radius;
      if (dist >= reach || dist < 0.01) continue;
      const nx = dx / dist;
      const ny = dy / dist;
      const rvx = b.vx - a.vx;
      const rvy = b.vy - a.vy;
      const vn = rvx * nx + rvy * ny;
      if (vn >= 0) continue;

      const invA = 1 / (a.dragging ? a.mass * 2 : a.mass);
      const invB = 1 / (b.dragging ? b.mass * 2 : b.mass);
      const e = (a.restitution + b.restitution) / 2;
      const impulse = ((-(1 + e) * vn) / (invA + invB)) * world.collisionSoftness;
      const vt = rvx * -ny + rvy * nx;
      const separation = Math.min(reach - dist, 2.5) * 0.5;

      if (!a.dragging) {
        a.vx -= impulse * invA * nx;
        a.vy -= impulse * invA * ny;
        a.va -= vt * 0.05 * a.angular;
        a.x -= nx * separation;
        a.y -= ny * separation;
        onWake(a);
      }
      if (!b.dragging) {
        b.vx += impulse * invB * nx;
        b.vy += impulse * invB * ny;
        b.va += vt * 0.05 * b.angular;
        b.x += nx * separation;
        b.y += ny * separation;
        onWake(b);
      }
    }
  }
}

export function applyBounds(body: PhysicsBody, world: PhysicsWorld) {
  const k = stickerBox(body);
  const over = world.edgeOverlap;
  const minX = k.hw - over;
  const maxX = world.W - k.hw + over;
  const minY = k.hh - over;
  const maxY = world.H - k.hh + Math.max(over, k.hh * 0.35);
  const bounce = 0.3 + body.restitution;
  if (body.x < minX) {
    if (body.vx < 0) body.vx = -body.vx * bounce;
    body.vx += (minX - body.x) * 0.04;
  }
  if (body.x > maxX) {
    if (body.vx > 0) body.vx = -body.vx * bounce;
    body.vx -= (body.x - maxX) * 0.04;
  }
  if (body.y < minY) {
    if (body.vy < 0) body.vy = -body.vy * bounce;
    body.vy += (minY - body.y) * 0.04;
  }
  if (body.y > maxY) {
    if (body.vy > 0) body.vy = -body.vy * bounce;
    body.vy -= (body.y - maxY) * 0.04;
  }
}

export function isSettled(body: PhysicsBody, dt: number) {
  const still = Math.hypot(body.vx, body.vy) < 0.06 && Math.abs(body.va) < 0.03 && !body.covering;
  body.stillTime = still ? body.stillTime + dt : 0;
  return body.stillTime > 12;
}

export function computeReleaseVelocity(samples: PointerSample[], now: number): Vec {
  const recent = samples.filter((s) => now - s.t <= 110);
  if (recent.length < 2) return { x: 0, y: 0 };
  const first = recent[0];
  const last = recent[recent.length - 1];
  if (now - last.t > 60) return { x: 0, y: 0 };
  const elapsed = Math.max(16, last.t - first.t);
  return { x: ((last.x - first.x) / elapsed) * 16.667, y: ((last.y - first.y) / elapsed) * 16.667 };
}

export function applyThrow(body: PhysicsBody, release: Vec, world: PhysicsWorld) {
  const throwFactor = clamp(1 / Math.sqrt(body.mass), 0.5, 1.5) * Math.max(world.intensity, 0.15);
  let vx = release.x * throwFactor;
  let vy = release.y * throwFactor;
  const speed = Math.hypot(vx, vy);
  if (speed > world.maxVelocity) {
    vx *= world.maxVelocity / speed;
    vy *= world.maxVelocity / speed;
  }
  const o = rotate(body.grabLocal.x, body.grabLocal.y, body.r);
  const inertia = Math.max(400, (body.w * body.w + body.h * body.h) / 8);
  const spin = ((o.x * vy - o.y * vx) / inertia) * 0.9 * body.angular;
  body.vx = vx;
  body.vy = vy;
  body.va = clamp(body.va + spin, -10 * body.angular, 10 * body.angular);
  body.stillTime = 0;
}
