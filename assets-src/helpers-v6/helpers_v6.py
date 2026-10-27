"""Mimi helpers v6 (= v4 shapes, made solid: no decorative strokes, one gap per accessory max): one soft blob each, one silhouette twist, personality in the eyes.

Hand-built vector geometry only (Python -> SVG -> PNG via cairosvg). No masks.
  FG   body colour (ink in product UI, or the helper's family colour on tiles)
  CUT  the surface it sits on; used for cut-outs and the few separating gaps
  EYE  eye cut-out colour (defaults to CUT; ink when the body is a family colour on cream)

Each helper's Nigerian cue is built into the blob's outline.
v4: Brand is the agogo double bell (one eye per bell); Collector wears a true abeti-aja fila with a drooping dog-ear. The one moving "twist"
part (oranges, fila dog-ear, page corner, carton flap, small agogo bell, loupe) is drawn as its own FG
piece overlapping the body with no seam, so it reads as one shape but can jiggle.

Shared rig skeleton (ids prefixed with the helper key, e.g. order-root):
  <k>-root        whole figure; animated (breathe / bounce / squash / pop); origin = base pivot (120,222)
    .rig-tilt     static tilt about the same pivot (shared range 4-5 deg)
      <k>-back    pieces behind the body (pouch strap etc.; empty if none)
      <k>-body    the blob outline + its edge notches
      <k>-acc     accessory group (secondary motion); origin = where it joins the body
        <k>-part  the twist part (signature move); origin = its hinge
      <k>-face    eyes; animated (glance); origin = eye midpoint (120,166)
        .rig-look           static resting look offset
          <k>-expr-<name>   one layer per expression (12, shared by all six); only one visible
            idle layer holds <k>-eye-l / <k>-eye-r, each clipped to its oval with a .rig-lid for blinks
      <k>-prop    second piece with its own motion; origin in data-origin
                  (Collector: nylon market bag, swings with lag; Brand: sound arcs round the loop, hidden at rest, flash on each tick;
                   empty on the other four)
    <k>-status    orange status mark (dot = working, ring = waiting), level, outside the tilt
"""
import io, os, math, re
import cairosvg
from shapes_v6 import rpoly, skew_bell
from PIL import Image

OUT = os.path.dirname(os.path.abspath(__file__))
INK, CREAM, ORANGE = '#101010', '#F4EFE6', '#ee6018'
FAMILY = {'tangerine': '#FF6414', 'marigold': '#FF9E1B', 'mint': '#14B8A6', 'violet': '#9B5CFF',
          'cobalt': '#1E7BFF', 'bubblegum': '#FF3D9A', 'stone': '#8C8A84', 'cocoa': '#99653A'}
GAP = 6
R = 18
BASE = 222
PIVOT = (120, BASE)
S = 0.8                         # body scale vs Mimi v8 (176 x 148 -> 141 x 118)
EYE_RX, EYE_RY = 8.5, 11.5
EYE_DX, EYE_Y = 23, 166
FACE_O = (120, EYE_Y)
BODY_T = f'translate(120 {BASE}) scale({S}) translate(-120 -184)'   # Mimi-space -> canvas

def f(x): return f'{x:.2f}'.rstrip('0').rstrip('.')
def cv(x, y):                   # Mimi-space point -> canvas point
    return (120 + (x-120)*S, BASE + (y-184)*S)

# Mimi v8 body halves (Mimi space, x 32..208, y 36..184)
LOWER_ROUND = "L208 96C211 130 198 158 172 172C155 181 138 184 120 184S85 181 68 172C42 158 29 130 32 96"
LOWER_BOX = "L207 96C208 132 204 158 182 172C164 182 142 184 120 184S76 182 58 172C36 158 32 132 33 96"
MIMI_TOP = "M32 96C36 52 72 36 120 36C168 36 204 52 208 96"

def body(top, lower=LOWER_ROUND):
    """top: path from (x,96) on the left, clockwise over the top to (x,96) on the right"""
    return f'<path class="f" d="{top}{lower}Z" transform="{BODY_T}" fill="{{FG}}"/>'
def mpath(d, cls='f', fill='{FG}', extra=''):      # a Mimi-space path
    return f'<path class="{cls}" d="{d}" transform="{BODY_T}" fill="{fill}" {extra}/>'
def F(d, extra=''): return f'<path class="f" d="{d}" fill="{{FG}}" {extra}/>'
def C(d, extra=''): return f'<path class="c" d="{d}" fill="{{CUT}}" {extra}/>'
def P(d, extra=''):
    return (f'<path class="h" d="{d}" fill="{{CUT}}" stroke="{{CUT}}" stroke-width="{GAP*2}" stroke-linejoin="round" {extra}/>'
            f'<path class="f" d="{d}" fill="{{FG}}" {extra}/>')

def capsule(x1, y1, x2, y2, r):
    a = math.atan2(y2-y1, x2-x1); nx, ny = -math.sin(a)*r, math.cos(a)*r
    return (f'M{f(x1+nx)} {f(y1+ny)}L{f(x2+nx)} {f(y2+ny)}A{r} {r} 0 0 0 {f(x2-nx)} {f(y2-ny)}'
            f'L{f(x1-nx)} {f(y1-ny)}A{r} {r} 0 0 0 {f(x1+nx)} {f(y1+ny)}Z')
def circle_d(cx, cy, r):
    return f'M{f(cx)} {f(cy-r)}A{r} {r} 0 1 1 {f(cx)} {f(cy+r)}A{r} {r} 0 1 1 {f(cx)} {f(cy-r)}Z'

H = {}

# 1 ORDER: the hawker's akpata tray becomes a flat, dished crown; three oranges sit in the dish
def _order():
    top = ("M32 96C34.5 74 37 68 42 64"              # small pinch under the tray (tangent-matched)
           "C28 62 16 58 16 47Q16 34 30 33"            # left end of the tray: thick, round
           "C64 36 92 44 120 44C148 44 176 36 210 33"  # dished top
           "Q224 34 224 47C224 58 212 62 198 64"       # right end
           "C203 68 205.5 74 208 96")
    oranges = ''.join(mpath(circle_d(x, y, 22)) for x, y in [(97, 22), (143, 22), (120, -14)])
    return dict(body=body(top), acc='{PART}', part=oranges, tilt=-4, look=(4, -1),
                status=(216, 140), acc_o=cv(120, 40), part_o=cv(120, 38))

# 2 COLLECTOR: the trusted alajo in an abeti-aja fila ("like a dog's ears"). v4 shape, from Tobi's refs:
# a band that steps a touch wider than the head, a soft crown that is higher and rounder on one side, and the
# cloth folded down over the OTHER side into a soft pointed ear that hangs past the band beside the face.
# The fold (ear) is the twist part; its halo cut is the crisp fold edge. One 6-unit cut separates cap from face.
# At the hip: the white T-shirt nylon market bag (unchanged from v3).
FILA_CUT_Y = 80                  # Mimi-space centre line of the cap/face cut
FILA_CROWN = rpoly([(31, 92), (24, 40), (38, 6), (110, 4), (213, 44), (212, 82)], [4, 30, 28, 40, 24, 4])
FILA_FOLDS = {   # three fold variations explored in fila-options.png
    'ear':   rpoly([(102, 4), (224, 42), (248, 82), (242, 138), (224, 106), (216, 72), (110, 24)], [14, 26, 40, 11, 30, 20, 14]),
    'brow':  rpoly([(102, 4), (220, 40), (234, 70), (200, 114), (186, 88), (112, 24)], [14, 22.5, 22.5, 12, 22.5, 14]),
    'crisp': rpoly([(100, 2), (228, 40), (250, 140), (214, 78), (112, 22)], [12, 20, 7, 14, 12]),
}
FILA_PICK = 'brow'   # v6: Tobi's pick, tip folded over the brow
FILA_BAND_CUT = False   # v6: the fold's halo is the one gap on the fila; the band step reads in the outline
def scale_d(d, s, ox, oy):
    """scale an absolute-command path (M L C Q S T V H Z) by s about (ox, oy); keeps the shape, only the size changes"""
    out = []; toks = re.findall(r'[A-Za-z]|-?\d*\.?\d+', d); cmd = None; i = 0; xy = 0
    while i < len(toks):
        t = toks[i]
        if t.isalpha():
            cmd = t; out.append(t); xy = 0; i += 1; continue
        v = float(t)
        if cmd == 'V': v = oy + (v - oy)*s
        elif cmd == 'H': v = ox + (v - ox)*s
        else:
            v = (ox + (v - ox)*s) if xy % 2 == 0 else (oy + (v - oy)*s); xy += 1
        out.append(f(v) + ' '); i += 1
    return ''.join(out).replace(' Z', 'Z').replace(' C', 'C').replace(' V', 'V').replace(' Q', 'Q').replace(' L', 'L').strip()
BAG_S = 0.83          # v6 final: bag shrunk ~17% so Collector's optical weight sits closer to the family
BAG_ANCHOR = (64, 200)  # scale about the side that tucks against the hip, so the bag stays at the hip and keeps its one gap
def halo_m(d):   # a Mimi-space twist piece with its 6-unit surface-coloured halo (the separating cut)
    return mpath(d, 'h', '{CUT}', f'stroke="{{CUT}}" stroke-width="{GAP*2/S:.1f}" stroke-linejoin="round"') + mpath(d)
def _collector(fold=None):
    cut = mpath(f"M22 {FILA_CUT_Y-3.75}Q120 {FILA_CUT_Y+3-3.75} 214 {FILA_CUT_Y-3.75}"
                f"V{FILA_CUT_Y+3.75}Q120 {FILA_CUT_Y+3+3.75} 22 {FILA_CUT_Y+3.75}Z", 'c', '{CUT}')
    part = halo_m(FILA_FOLDS[fold or FILA_PICK])
    # white T-shirt nylon market bag: two strap handles with slot holes, deep U opening, soft bulging bottom
    bag = ("M6 180C6 168 8 160 10 154V145Q10 138 17 138Q24 138 24 145V148C27 168 47 168 50 148V145"
           "Q50 138 57 138Q64 138 64 145V154C66 160 68 168 68 180C68 204 62 222 37 222C12 222 6 204 6 180Z")
    holes = C("M14.5 144H19.5V155H14.5Z") + C("M54.5 144H59.5V155H54.5Z")
    note = P("M28 122Q28 117 33 117H45Q50 117 50 122V170H28Z", 'transform="rotate(-14 39 150)"')
    if not FILA_BAND_CUT: cut = ''
    bag = scale_d(bag, BAG_S, *BAG_ANCHOR)
    # v6: no slot holes in the handles, no note tucked behind: bag is one solid shape with its one gap
    return dict(body=body(MIMI_TOP) + mpath(FILA_CROWN) + cut, acc='{PART}', part=part, tilt=5, look=(-3, 1),
                prop=P(bag), prop_o=(BAG_ANCHOR[0] + (37 - BAG_ANCHOR[0])*BAG_S, BAG_ANCHOR[1] + (140 - BAG_ANCHOR[1])*BAG_S),
                status=(22, 102), acc_o=cv(104, 10), part_o=cv(104, 10))

# 3 CREDIT: the shop's credit jotter: a squarer body, spiral bites down the spine, biro behind the ear
def _credit():
    # top-right page corner is dog-eared: corner cut away, the folded flap is the twist
    top = "M33 96V62Q33 36 60 36H156L207 86V96"
    bites = ''.join(mpath(circle_d(33, y, 10), 'c', '{CUT}') for y in (64, 100, 136))
    fold = ("M156 44Q156 36 164 40L200 78Q204 86 196 86H170Q156 86 156 72Z")
    return dict(body=body(top, LOWER_BOX) + bites, acc='{PART}', part=mpath(fold, 'h', '{CUT}',
                f'stroke="{{CUT}}" stroke-width="{GAP*2/S:.1f}" stroke-linejoin="round"') + mpath(fold),
                tilt=-5, look=(4, -1), status=(24, 132), acc_o=cv(180, 60), part_o=cv(158, 40))

# 4 STOCK: a provisions carton: squarer body, tape notch in the lid, one flap sprung open (the twist)
def _stock():
    top = ("M33 96V60Q33 40 52 40H124"                                  # lid line
           "L140 40L182 8Q186 5 190 7L236 22Q242 25 238 30L207 60V96")     # right flap folded out (static)
    flap = "M40 42L4 26Q-2 22 3 18L46 -6Q50 -8 54 -6L104 42Z"             # left flap sprung open (twist)
    return dict(body=body(top, LOWER_BOX), acc='{PART}', part=mpath(flap), tilt=4, look=(-4, 0),
                status=(218, 150), acc_o=cv(70, 40), part_o=cv(52, 40))

# 5 BRAND: the town crier / market announcer. v4: the body IS an agogo double bell (Tobi picked v3 option C).
# Fixing v3's kettlebell read: two separate flared bells (a tall one and a shorter one) whose tips lean into one
# bent-iron loop, with a deep gap between them from the mouths up to the loop. One eye per bell.
# The small bell is the twist part (rocks on its eye when struck); the big bell's strike rides on the root.
# k-prop = small sound arcs either side of the loop, hidden at rest, flashing on each tick.
def _bez(p0, p1, p2, p3, n=24):
    return [((1-u)**3*p0[0]+3*(1-u)**2*u*p1[0]+3*(1-u)*u**2*p2[0]+u**3*p3[0],
             (1-u)**3*p0[1]+3*(1-u)**2*u*p1[1]+3*(1-u)*u**2*p2[1]+u**3*p3[1]) for u in [i/n for i in range(n+1)]]
def _bands(pts, t): return ''.join(mpath(x) for x in band(pts, t).split('|'))
def _arc(cx, cy, r, a0, a1, n=14):
    return [(cx + r*math.cos(math.radians(a0 + (a1-a0)*i/n)), cy + r*math.sin(math.radians(a0 + (a1-a0)*i/n))) for i in range(n+1)]
AGOGO_LOOP_C = (122, 8)
def _agogo_arcs():
    cx, cy = AGOGO_LOOP_C
    return (_bands(_arc(cx, cy, 44, 196, 232), 8) + _bands(_arc(cx, cy, 62, 200, 228), 8)
            + _bands(_arc(cx, cy, 44, 308, 344), 8) + _bands(_arc(cx, cy, 62, 312, 340), 8))
def _brand_agogo(tipgap=8, bt=22, st=54, kneey=86, fo=9, ix=(113, 127), ib=(102, 138), mx=(22, 218), h=-20, rt=13, lt=14, sh=7):
    """(v4 pick) one eye per bell: tall bell left, short bell right, deep gap, loop joining the tips"""
    c = 120
    # outer sides get a soft shoulder (pushed out by sh) so the bells stay in the blob family
    def shoulder(a, b, t, out):
        return (a[0] + (b[0]-a[0])*t + out, a[1] + (b[1]-a[1])*t)
    bl_tip, bl_lip = (c - tipgap/2 - 22, bt), (mx[0] + fo + 6, 150)
    sr_tip, sr_lip = (c + tipgap/2 + 20, st), (mx[1] - fo - 6, 150)
    # inner edges run straight past the eyes (so every expression layer keeps clear of the gap),
    # then open out toward the mouths: the gap is a narrow slot under the loop that widens into a V
    big = rpoly([bl_tip, (c - tipgap/2, bt + 2), (ix[0], kneey), (ix[0], 132), (ib[0], 184),
                 (mx[0], 184), bl_lip, shoulder(bl_tip, bl_lip, 0.34, -sh)], [rt, rt, 30, 30, 12, 22, 30, 50])
    small = rpoly([(c + tipgap/2, st + 2), sr_tip, shoulder(sr_tip, sr_lip, 0.34, sh), sr_lip, (mx[1], 184),
                   (ib[1], 184), (ix[1], 132), (ix[1], kneey + 6)], [rt, rt, 50, 30, 22, 12, 30, 30])
    loop = _bands(_bez((c - tipgap/2 - 11, bt + 8), (c - 16, h), (c + 22, h + 6), (c + tipgap/2 + 10, st + 6)), lt)
    return dict(body=mpath(big) + loop, acc='{PART}', part=halo_m(small), tilt=-5, look=(0, 0),
                prop=_agogo_arcs(), prop_o=cv(*AGOGO_LOOP_C), prop_rest_o=0,
                status=(26, 136), acc_o=(EYE_DX + 120, EYE_Y), part_o=(EYE_DX + 120, EYE_Y))
def _brand_agogo_big():
    """(alt) both eyes on the big bell, small bell leaning in at the side"""
    big = skew_bell((116, 28), 26, 34, 196, 184, flare=8)
    small = skew_bell((176, 78), 18, 204, 250, 184, flare=6)
    loop = _bands(_bez((114, 36), (112, -8), (178, -4), (176, 84)), 11)
    return dict(body=mpath(big) + loop, acc='{PART}', part=halo_m(small), tilt=-5, look=(-2, -1),
                status=(26, 136), acc_o=cv(176, 80), part_o=cv(176, 80))
def _brand_agogo_v3():
    """(v3 option C, for reference) two cones fused into one body: read as a kettlebell at 24 px"""
    top = ("M30 176C40 140 58 86 74 54Q80 40 96 40H104Q114 40 118 50"
           "Q120 56 122 50Q126 40 136 40H144Q160 40 166 54C182 86 200 140 210 176")
    lower = "Q212 184 200 184H140Q128 184 124 176L120 166L116 176Q112 184 100 184H40Q28 184 30 176"
    bod = f'<path class="f" d="{top}{lower}Z" transform="{BODY_T}" fill="{{FG}}"/>'
    loop = ("M92 46C92 16 104 2 120 2C136 2 148 16 148 46H134C134 26 128 16 120 16C112 16 106 26 106 46Z")
    return dict(body=bod, acc='{PART}', part=mpath(loop), tilt=-5, look=(3, -2),
                status=(26, 136), acc_o=cv(120, 46), part_o=cv(120, 46))

def _brand_v6():
    """v6 pick: v3 option C (Tobi's marked ref), same proportions and loop, joins smoothed.
    Two cones fused under one round loop (soft V between the tips), a small rounded V notch at the base, one eye per bell. No gaps."""
    top = ("M30 176C40 140 58 86 74 54Q80 40 96 40H100"
           "C108 40 113 44 117.5 49.5Q120 52.8 122.5 49.5C127 44 132 40 140 40"   # the two cone tips meet in a soft V (was a crack)
           "H144Q160 40 166 54C182 86 200 140 210 176")
    lower = ("Q212 184 200 184H140Q130 184 126 177.5L122.6 172Q120 168 117.4 172L114 177.5"   # rounded V notch at the base
             "Q110 184 100 184H40Q28 184 30 176")
    bod = f'<path class="f" d="{top}{lower}Z" transform="{BODY_T}" fill="{{FG}}"/>'
    # v3 C loop, unchanged: 14-unit iron, legs sink into the two cone tips; the hole's floor is the soft V between the cones.
    # Small concave fillets only where the loop's outer feet meet the cone shoulders.
    loop = "M92 50C92 16 104 2 120 2C136 2 148 16 148 50H134C134 26 128 16 120 16C112 16 106 26 106 50Z"
    fil = mpath("M92.914 35Q92.306 39.563 87 41.359L89 47H99V35Z") + mpath("M147.086 35Q147.694 39.563 153 41.359L151 47H141V35Z")
    loop_svg = mpath(loop) + fil
    return dict(body=bod, acc='{PART}', part=loop_svg, tilt=-5, look=(0, 0),
                status=(26, 136), acc_o=cv(120, 46), part_o=cv(120, 46))

def _brand():
    return _brand_v6()

# 6 PROOF: "send proof": a loupe screwed into one eye; ring cut round the eye, handle out the side
def _proof():
    ex, ey = 120 + EYE_DX, EYE_Y
    # v6: lens + handle are one solid loupe with one continuous 6-unit gap round it (v4 shape, no separate ring)
    handle = capsule(ex + 18, ey + 18, ex + 54, ey + 46, 9)
    loupe = (C(circle_d(ex, ey, 19 + GAP)) + C(capsule(ex + 18, ey + 18, ex + 54, ey + 46, 9 + GAP))
             + F(circle_d(ex, ey, 19)) + F(handle))
    return dict(body=body(MIMI_TOP), acc='{PART}', part=loupe, tilt=5, look=(-2, -1),
                status=(26, 136), acc_o=(ex, ey), part_o=(ex, ey), face_over_part=True)

# --------------------------------------------------------------- eye expression set
def band(pts, t):
    """filled band of width t along a polyline, round ends (no strokes)"""
    L, Rr = [], []
    for i, (x, y) in enumerate(pts):
        a = pts[max(i-1, 0)]; b = pts[min(i+1, len(pts)-1)]
        dx, dy = b[0]-a[0], b[1]-a[1]; n = math.hypot(dx, dy) or 1
        nx, ny = -dy/n*t/2, dx/n*t/2
        L.append((x+nx, y+ny)); Rr.append((x-nx, y-ny))
    d = 'M' + ' L'.join(f'{f(x)} {f(y)}' for x, y in L) + ' L' + ' L'.join(f'{f(x)} {f(y)}' for x, y in reversed(Rr)) + 'Z'
    # round ends as separate subpaths (split on '|' when emitting; avoids winding holes)
    d += '|' + circle_d(pts[0][0], pts[0][1], t/2) + '|' + circle_d(pts[-1][0], pts[-1][1], t/2)
    return d
def arc_pts(cx, cy, w, h, n=18, up=True):
    out = []
    for i in range(n+1):
        u = i/n; out.append((cx - w/2 + w*u, cy - (1 if up else -1)*h*4*u*(1-u)))
    return out
def ell_pts(cx, cy, rx, ry, keep=lambda x, y: True, n=48):
    return [(cx+rx*math.cos(2*math.pi*i/n), cy+ry*math.sin(2*math.pi*i/n)) for i in range(n)
            if keep(cx+rx*math.cos(2*math.pi*i/n), cy+ry*math.sin(2*math.pi*i/n))]
def poly(pts): return 'M' + ' L'.join(f'{f(x)} {f(y)}' for x, y in pts) + 'Z'
def star(cx, cy, ro, ri):
    return poly([(cx + (ro if i % 2 == 0 else ri)*math.sin(math.pi*i/5), cy - (ro if i % 2 == 0 else ri)*math.cos(math.pi*i/5)) for i in range(10)])
def heart(cx, cy, s):
    return (f'M{f(cx)} {f(cy+s*0.95)}C{f(cx-s*1.5)} {f(cy)} {f(cx-s*1.1)} {f(cy-s*1.15)} {f(cx)} {f(cy-s*0.45)}'
            f'C{f(cx+s*1.1)} {f(cy-s*1.15)} {f(cx+s*1.5)} {f(cy)} {f(cx)} {f(cy+s*0.95)}Z')
def spiral(cx, cy, r, turns=1.6, n=40):
    return [(cx + r*(0.15+0.85*i/n)*math.cos(2*math.pi*turns*i/n), cy + r*(0.15+0.85*i/n)*math.sin(2*math.pi*turns*i/n)) for i in range(n+1)]

EXPRS = ['idle', 'glance', 'happy', 'content', 'wink', 'determined', 'surprised',
         'dizzy', 'error', 'excited', 'sleepy', 'heart']
def expr_paths(name):
    """returns list of path d strings (canvas coords, look offset applied by the parent)"""
    out = []
    for s in (-1, 1):
        x, y = 120 + s*EYE_DX, EYE_Y
        if name == 'glance':   out.append(poly(ell_pts(x+4, y-1, EYE_RX*0.9, EYE_RY)))
        elif name == 'happy':  out.append(band(arc_pts(x, y+4, EYE_RX*2+5, 11), 7))
        elif name == 'content':out.append(band(arc_pts(x, y-2, EYE_RX*2+5, 8, up=False), 7))
        elif name == 'wink':
            out.append(poly(ell_pts(x, y, EYE_RX, EYE_RY)) if s < 0 else band(arc_pts(x, y+3, EYE_RX*2+5, 11), 7))
        elif name == 'determined':   # inner-top slant cut
            k = 0.7*s
            out.append(poly(ell_pts(x, y+1, EYE_RX+1.5, EYE_RY, n=72, keep=lambda px, py, x=x, y=y, k=k: py > y - 4 - k*(px-x))))
        elif name == 'surprised': out.append(circle_d(x, y-1, 11))
        elif name == 'dizzy':
            pts = spiral(x, y, 11.5, 1.75) if s < 0 else [(2*x - px, py) for px, py in spiral(x, y, 11.5, 1.75)]
            out.append('S:M' + ' L'.join(f'{f(px)} {f(py)}' for px, py in pts))
        elif name == 'error':
            out.append(capsule(x-8, y-8, x+8, y+8, 3.4)); out.append(capsule(x-8, y+8, x+8, y-8, 3.4))
        elif name == 'excited': out.append(star(x, y, 13, 6))
        elif name == 'sleepy': out.append(poly(ell_pts(x, y+2, EYE_RX+1, EYE_RY, keep=lambda px, py, y=y: py >= y + 1)))
        elif name == 'heart':  out.append(heart(x, y+1, 9.5))
    return out

# --------------------------------------------------------------- registry
for k, fn in [('order', _order), ('collector', _collector), ('credit', _credit),
              ('stock', _stock), ('brand', _brand), ('proof', _proof)]:
    H[k] = fn()
ORDER = list(H)
LABEL = {k: k.capitalize() for k in ORDER}
COLOUR = {'order': 'marigold', 'collector': 'cobalt', 'credit': 'violet',
          'stock': 'cocoa', 'brand': 'bubblegum', 'proof': 'mint'}   # Mimi herself: tangerine
CUE = {'order': 'akpata hawker tray as a flat dished crown, three oranges in the dish',
       'collector': 'abeti-aja fila: high round crown, cloth tip folded over the brow + nylon market bag',
       'credit': 'spiral credit jotter body with a dog-eared page corner',
       'stock': 'provisions carton body with a taped lid and one flap sprung open',
       'brand': 'town crier: the body is an agogo, two bells fused under one loop, one eye per bell',
       'proof': 'a loupe in one eye, for checking the "send proof" of payment'}

# v6: every helper stands ON the baseline: after its tilt, the lowest ink point is lifted to y 222
LIFT = {'credit': 0.4, 'brand': 5.4, 'proof': 5.4}   # measured at 2400 px (check_v6.py item 5)
MIMI_DY = 3.3   # Mimi mark offset so her lowest point sits on y 222 (in her own units)

# --------------------------------------------------------------- the rig
STATE = {   # which expression + pose per state (also the reduced-motion pose)
    'idle':    dict(expr='idle', face=(0, 0), dot=0, ring=0),
    'working': dict(expr='idle', face=(-4, 3), dot=1, ring=0),
    'waiting': dict(expr='idle', face=(0, -8), dot=0, ring=1),
    'done':    dict(expr='happy', face=(0, 0), dot=0, ring=0),
}

def tr(p, origin):
    if not p: return ''
    x, y, r = p.get('x', 0), p.get('y', 0), p.get('r', 0)
    sx, sy = p.get('sx', 1), p.get('sy', 1); ox, oy = origin
    return (f' transform="translate({f(ox+x)} {f(oy+y)}) rotate({f(r)}) scale({f(sx)} {f(sy)}) '
            f'translate({f(-ox)} {f(-oy)})"')

def eyes_svg(pid, expr, dyn):
    lid_h = EYE_RY*2 + 4; layers = []
    lid = dyn.get('lid', {})
    idle = ''
    for side, s in (('l', -1), ('r', 1)):
        ex = 120 + s*EYE_DX
        idle += (f'<clipPath id="{pid}-eye-{side}-clip"><ellipse cx="{f(ex)}" cy="{EYE_Y}" rx="{EYE_RX}" ry="{EYE_RY}"/></clipPath>'
                 f'<g id="{pid}-eye-{side}" class="rig-eye rig-eye-{side}" clip-path="url(#{pid}-eye-{side}-clip)">'
                 f'<ellipse class="e" cx="{f(ex)}" cy="{EYE_Y}" rx="{EYE_RX}" ry="{EYE_RY}" fill="{{EYE}}"/>'
                 f'<rect class="f rig-lid" x="{f(ex-EYE_RX-2)}" y="{f(EYE_Y-EYE_RY-2-lid_h)}" width="{f(EYE_RX*2+4)}" '
                 f'height="{f(lid_h)}" fill="{{FG}}"{tr(lid, (ex, EYE_Y))}/></g>')
    for name in EXPRS:
        vis = '' if name == expr else ' opacity="0"'
        inner = idle if name == 'idle' else ''.join(
            (f'<path class="es" d="{d[2:]}" fill="none" stroke="{{EYE}}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>'
             if d.startswith('S:') else f'<path class="e" d="{d}" fill="{{EYE}}"/>')
            for dd in expr_paths(name) for d in dd.split('|'))
        layers.append(f'<g id="{pid}-expr-{name}" class="rig-expr" data-expr="{name}"{vis}>{inner}</g>')
    return ''.join(layers)

def build(k, fg=INK, cut=CREAM, eye=None, state='idle', expr=None, dyn=None, prefix=None,
          standalone=True, bg=None, status=True):
    h = H[k]; dyn = dyn or {}; pid = prefix or k; st = STATE[state]
    expr = expr or dyn.get('expr') or st['expr']
    face = dyn.get('face')
    if face is None and not dyn and state != 'idle': face = {'x': st['face'][0], 'y': st['face'][1]}
    lx, ly = h['look'] if expr in ('idle', 'determined', 'surprised', 'sleepy') else (0, 0)
    sx, sy = h['status']
    dot_o = dyn.get('dot', {}).get('o', st['dot']); ring_o = dyn.get('ring', {}).get('o', st['ring'])
    if not status: dot_o = ring_o = 0
    stat = (f'<g id="{pid}-status" class="rig-status" transform="translate({sx} {sy})">'
            f'<circle class="c rig-halo" r="15" fill="{{CUT}}" opacity="{max(dot_o, ring_o)}"/>'
            f'<circle id="{pid}-dot" class="rig-dot" r="8.5" fill="{ORANGE}" opacity="{dot_o}"{tr(dyn.get("dot"), (0, 0))}/>'
            f'<path id="{pid}-ring" class="rig-ring" fill-rule="evenodd" fill="{ORANGE}" opacity="{ring_o}" '
            f'd="{circle_d(0, 0, 12.5)}{circle_d(0, 0, 6.5)}"{tr(dyn.get("ring"), (0, 0))}/></g>')
    part = (f'<g id="{pid}-part" class="rig-part" data-origin="{f(h["part_o"][0])} {f(h["part_o"][1])}"'
            f'{tr(dyn.get("part"), h["part_o"])}>{h["part"]}</g>')
    acc = (f'<g id="{pid}-acc" class="rig-acc" data-origin="{f(h["acc_o"][0])} {f(h["acc_o"][1])}"'
           f'{tr(dyn.get("acc"), h["acc_o"])}>{h["acc"].replace("{PART}", part)}</g>')
    facesvg = (f'<g id="{pid}-face" class="rig-face" data-origin="{FACE_O[0]} {FACE_O[1]}"{tr(face, FACE_O)}>'
               f'<g class="rig-look" transform="translate({lx} {ly})">{eyes_svg(pid, expr, dyn)}</g></g>')
    po = h.get('prop_o', PIVOT); pd = dyn.get('prop') or {}
    p_op = pd.get('o', 1 if (state == 'working' and not dyn) else h.get('prop_rest_o', 1))   # still pose: arcs show while working
    propsvg = (f'<g id="{pid}-prop" class="rig-prop" data-origin="{f(po[0])} {f(po[1])}"'
               + (f' opacity="{f(p_op)}"' if p_op != 1 else '') + f'{tr(pd, po)}>{h.get("prop", "")}</g>')
    inner = (f'<g id="{pid}-root" class="rig-root" data-origin="{PIVOT[0]} {PIVOT[1]}"{tr(dyn.get("root"), PIVOT)}>'
             f'<g class="rig-tilt" transform="translate(0 {f(-LIFT.get(k, 0))}) rotate({h["tilt"]} {PIVOT[0]} {PIVOT[1]})">'
             f'<g id="{pid}-back" class="rig-back">{h.get("back", "")}</g>'
             f'<g id="{pid}-body" class="rig-body">{h["body"]}</g>'
             f'{acc}{facesvg}'
             f'{propsvg}</g>{stat}</g>')
    inner = inner.replace('{FG}', fg).replace('{CUT}', cut).replace('{EYE}', eye or cut)
    if not standalone: return inner
    bgr = f'<rect width="240" height="240" fill="{bg}"/>' if bg else ''
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width="240" height="240" '
            f'id="helper-{pid}" class="mimi-helper" data-helper="{k}" data-state="{state}">{bgr}{inner}</svg>')

def mimi(fg=INK, cut=CREAM, eye=None, scale=1.0, look=(10, -6), expr=None, dy=MIMI_DY):
    """Mimi v8 mark (geometry unchanged), FG/CUT, standing on the shared baseline"""
    eye = eye or cut
    # v6: bow is one solid shape (two loops + knot) with one 6-unit gap round the whole bow (no knot ring)
    loops = ["M0 0 C-8 -9 -20 -22 -33 -18 C-41 -15 -42 -2 -37 -1 C-42 2 -41 15 -33 17 C-21 21 -8 9 0 0Z",
             "M0 0 C8 -9 20 -22 33 -18 C41 -15 42 -2 37 -1 C42 2 41 15 33 17 C21 21 8 9 0 0Z"]
    gw = GAP*2/0.8/scale   # 6 canvas units at any scale, same gap as the helpers
    bow = (f'<g transform="translate(170 50) rotate(20) scale(0.8)">'
           + ''.join(f'<path d="{d}" fill="{cut}" stroke="{cut}" stroke-width="{gw}" stroke-linejoin="round"/>' for d in loops)
           + f'<ellipse rx="9.5" ry="11" fill="{cut}" stroke="{cut}" stroke-width="{gw}"/>'
           + ''.join(f'<path d="{d}" fill="{fg}"/>' for d in loops)
           + f'<ellipse rx="9.5" ry="11" fill="{fg}"/></g>')
    if expr == 'happy':
        ey = ''.join(f'<path d="{d}" fill="{eye}"/>' for x in (102, 158) for d in band(arc_pts(x, 118, 22, 12), 7).split('|'))
    else:
        ey = (f'<g transform="translate({look[0]} {look[1]})"><ellipse cx="92" cy="114" rx="9.5" ry="13" fill="{eye}"/>'
              f'<ellipse cx="148" cy="114" rx="9.5" ry="13" fill="{eye}"/></g>')
    return (f'<g transform="translate(120 {BASE}) scale({scale}) translate(-120 {f(-188 + dy)})">'
            f'<g transform="rotate(-8 120 110)"><path d="M120 36c48 0 84 16 88 60 3 34-10 62-36 76-17 9-34 12-52 12s-35-3-52-12C42 158 29 130 32 96 36 52 72 36 120 36Z" fill="{fg}"/>{ey}{bow}</g></g>')

def png(svg, w):
    return Image.open(io.BytesIO(cairosvg.svg2png(bytestring=svg.encode(), output_width=w))).convert('RGBA')

if __name__ == '__main__':
    for k in ORDER:
        open(os.path.join(OUT, f'{k}.svg'), 'w').write(build(k))
    print('svgs ok')
