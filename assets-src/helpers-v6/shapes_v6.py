"""v6 (unchanged from v4) shape helpers: rounded polygons (soft blob corners, no strokes)."""
import math
def _f(x): return f'{x:.2f}'.rstrip('0').rstrip('.')
def rpoly(pts, rad):
    """closed polygon with every corner filleted by a quadratic curve; rad: number or list per vertex"""
    n = len(pts); rads = rad if isinstance(rad, (list, tuple)) else [rad]*n
    segs = []
    for i in range(n):
        p0, p1, p2 = pts[i-1], pts[i], pts[(i+1) % n]
        a = (p0[0]-p1[0], p0[1]-p1[1]); b = (p2[0]-p1[0], p2[1]-p1[1])
        la, lb = math.hypot(*a), math.hypot(*b); r = min(rads[i], la*0.5, lb*0.5)
        s = (p1[0]+a[0]/la*r, p1[1]+a[1]/la*r); e = (p1[0]+b[0]/lb*r, p1[1]+b[1]/lb*r)
        segs.append((s, p1, e))
    d = f'M{_f(segs[0][2][0])} {_f(segs[0][2][1])}'
    for s, c, e in segs[1:] + segs[:1]:
        d += f'L{_f(s[0])} {_f(s[1])}Q{_f(c[0])} {_f(c[1])} {_f(e[0])} {_f(e[1])}'
    return d + 'Z'
def cone(tip, tip_w, bot_l, bot_r, by, flare=6, rt=14, rb=18, waist=0.72):
    """flared bell cone in Mimi space: narrow round top at tip=(x,y), mouth from bot_l..bot_r at y=by.
    flare pushes the mouth corners out past the straight side (bell lip)."""
    tx, ty = tip
    tl, tr_ = (tx - tip_w/2, ty), (tx + tip_w/2, ty)
    def side(a, b, t): return (a[0] + (b[0]-a[0])*t, a[1] + (b[1]-a[1])*t)
    ml = side(tl, (bot_l + flare, by), waist); mr = side(tr_, (bot_r - flare, by), waist)
    pts = [tl, tr_, mr, (bot_r, by), (bot_l, by), ml]
    return rpoly(pts, [rt, rt, 40, rb, rb, 40])
def bell(tip, mouth, tip_w, mouth_w, flare=7, rt=12, rb=18, rs=34, at=0.84):
    """symmetric flared bell cone along an axis from tip=(x,y) (narrow, round) to mouth=(x,y) (wide).
    Straight sides to `at`, then the lip flares out by `flare` (agogo mouth)."""
    (tx, ty), (mx, my) = tip, mouth
    ax, ay = mx - tx, my - ty; L = math.hypot(ax, ay); ux, uy = ax/L, ay/L; nx, ny = -uy, ux   # n points to the left of travel? (screen right when going down)
    def P(c, off): return (c[0] + nx*off, c[1] + ny*off)
    tl, tr_ = P(tip, tip_w/2), P(tip, -tip_w/2)
    ml, mr = P(mouth, mouth_w/2 + flare), P(mouth, -mouth_w/2 - flare)
    sl = P((tx + ax*at, ty + ay*at), tip_w/2 + (mouth_w - tip_w)/2*at)
    sr = P((tx + ax*at, ty + ay*at), -(tip_w/2 + (mouth_w - tip_w)/2*at))
    pts = [tr_, tl, sl, ml, mr, sr]
    return rpoly(pts, [rt, rt, rs, rb, rb, rs])
def skew_bell(tip, tip_w, ml, mr, my, flare=7, rt=11, rb=18, rs=40, at=0.82):
    """bell standing on a horizontal mouth (ml..mr at y=my); the narrow round tip may sit off-centre so
    two bells lean into one loop. Straight sides to `at`, then the lip flares out by `flare`."""
    tx, ty = tip
    tl, tr_ = (tx - tip_w/2, ty), (tx + tip_w/2, ty)
    def lerp(a, b, t): return (a[0] + (b[0]-a[0])*t, a[1] + (b[1]-a[1])*t)
    sl = lerp(tl, (ml, my), at); sr = lerp(tr_, (mr, my), at)
    pts = [tl, tr_, sr, (mr + flare, my), (ml - flare, my), sl]
    return rpoly(pts, [rt, rt, rs, rb, rb, rs])
