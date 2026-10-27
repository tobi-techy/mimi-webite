"""Mimi helpers v6 motion: tokens + keyframe tracks, one source of truth.

The same track data generates the CSS in motion.html and drives the Python frame
renderer for the lineup video, so the video is exactly what the CSS does.

Track = target group, duration (ms), easing token, iterations, keyframes
[(pct, {x, y, r, sx, sy, o})]. Easing applies per segment (CSS semantics).
"""
import math

# ---------------------------------------------------------------- tokens
EASE = {   # cubic-bezier
    'mech':   (0.4, 0.0, 0.2, 1.0),    # Factory UI curve: quick, mechanical
    'out':    (0.2, 0.7, 0.2, 1.0),    # settle
    'inout':  (0.45, 0.0, 0.55, 1.0),  # breathe, sway
    'spring': (0.34, 1.56, 0.64, 1.0), # overshoot pop
    'snap':   (0.7, 0.0, 0.84, 0.0),   # fall into a land (accelerate)
    'lin':    (0.0, 0.0, 1.0, 1.0),    # only for densely sampled composite tracks (Brand root)
}
DUR = {    # ms
    'blink': 4200, 'blink_close': 120,
    'breathe': 3200, 'glance_cycle': 6400,
    'work_bounce': 640, 'work_eyes': 1280, 'work_sig': 1280,
    'wait_sway': 2400, 'ring_pulse': 1600, 'dot_pulse': 960,
    'done_pop': 900, 'idle_sig': 5600, 'stagger': 137,
}
AMP = {    # unitless scale deltas, px in the 240 rig box, degrees
    'breathe_sy': 0.025, 'breathe_sx': -0.012,
    'hop_px': 7, 'land_squash': 0.08, 'land_stretch': 0.06,
    'pop_px': 22, 'pop_squash': 0.12,
    'sway_deg': 2.5, 'glance_px': 5, 'eyes_up_px': 8,
    'jiggle_deg': 9,
}

def K(*frames):   # helper: (pct, dict) list
    return list(frames)

# ---------------------------------------------------------------- shared tracks per state
def blink(dur=DUR['blink']):
    c = DUR['blink_close'] / dur * 100
    h = 27   # lid travel = eye height + 4
    return dict(target='lid', dur=dur, ease='mech', keys=K(
        (0, {}), (90, {}), (90 + c*0.5, {'y': h}), (90 + c, {}), (100, {})))

SHARED = {
    'idle': [
        dict(target='root', dur=DUR['breathe'], ease='inout', keys=K(
            (0, {}), (50, {'sx': 1 + AMP['breathe_sx'], 'sy': 1 + AMP['breathe_sy']}), (100, {}))),
        dict(target='face', dur=DUR['glance_cycle'], ease='mech', keys=K(
            (0, {}), (40, {}), (44, {'x': AMP['glance_px'], 'y': -1}), (62, {'x': AMP['glance_px'], 'y': -1}),
            (66, {'x': -4, 'y': 0}), (82, {'x': -4, 'y': 0}), (86, {}), (100, {}))),
        blink(),
    ],
    'working': [   # quick hops, squash on every land, eyes busy and slightly down
        dict(target='root', dur=DUR['work_bounce'], ease='out', keys=K(
            (0, {'sx': 1 + AMP['land_squash'], 'sy': 1 - AMP['land_squash']}),
            (18, {'sx': 1 - AMP['land_stretch']*0.6, 'sy': 1 + AMP['land_stretch']*0.6}),
            (45, {'y': -AMP['hop_px'], 'sx': 0.99, 'sy': 1.02}),
            (78, {'y': 0, 'sx': 1 - AMP['land_stretch']*0.4, 'sy': 1 + AMP['land_stretch']*0.4}),
            (100, {'sx': 1 + AMP['land_squash'], 'sy': 1 - AMP['land_squash']}))),
        dict(target='face', dur=DUR['work_eyes'], ease='mech', keys=K(
            (0, {'x': -4, 'y': 3}), (46, {'x': -4, 'y': 3}), (50, {'x': 4, 'y': 3}), (96, {'x': 4, 'y': 3}), (100, {'x': -4, 'y': 3}))),
        dict(target='dot', dur=DUR['dot_pulse'], ease='inout', keys=K(
            (0, {}), (50, {'sx': 1.3, 'sy': 1.3}), (100, {}))),
        blink(3100),
    ],
    'waiting': [   # stretched up, leaning toward the owner, slow sway, ring breathes
        dict(target='root', dur=DUR['wait_sway'], ease='inout', keys=K(
            (0, {'r': -AMP['sway_deg'], 'sy': 1.03, 'sx': 0.985}), (50, {'r': AMP['sway_deg'], 'sy': 1.03, 'sx': 0.985}),
            (100, {'r': -AMP['sway_deg'], 'sy': 1.03, 'sx': 0.985}))),
        dict(target='face', dur=DUR['wait_sway'], ease='inout', keys=K(
            (0, {'x': -2, 'y': -AMP['eyes_up_px']}), (50, {'x': 2, 'y': -AMP['eyes_up_px']}), (100, {'x': -2, 'y': -AMP['eyes_up_px']}))),
        dict(target='ring', dur=DUR['ring_pulse'], ease='inout', keys=K(
            (0, {}), (50, {'sx': 1.18, 'sy': 1.18, 'o': 0.55}), (100, {}))),
        blink(3600),
    ],
    'done': [      # anticipation squash, pop up stretched, land squash, wobble settle (plays once)
        dict(target='root', dur=DUR['done_pop'], ease='out', iter=1, keys=K(
            (0, {}),
            (12, {'sx': 1 + AMP['pop_squash'], 'sy': 1 - AMP['pop_squash']}),
            (34, {'y': -AMP['pop_px'], 'sx': 0.93, 'sy': 1.09}),
            (52, {'y': 0, 'sx': 0.97, 'sy': 1.04}),
            (60, {'sx': 1 + AMP['pop_squash']*0.9, 'sy': 1 - AMP['pop_squash']*0.9}),
            (74, {'sx': 0.97, 'sy': 1.03}),
            (88, {'sx': 1.015, 'sy': 0.985}),
            (100, {}))),
        dict(target='face', dur=DUR['done_pop'], ease='out', iter=1, keys=K(
            (0, {}), (34, {'y': -3}), (60, {'y': 2}), (100, {}))),
    ],
}

# ---------------------------------------------------------------- per-helper twist: jiggle + signature
def jiggle(deg, axis='r', settle=True):
    """damped jiggle used on the twist part after a land"""
    vals = [0, deg, -deg*0.6, deg*0.35, -deg*0.15, 0]
    pcts = [0, 18, 38, 58, 78, 100]
    return K(*[(p, {axis: v}) for p, v in zip(pcts, vals)])

SIG = {   # one signature move per helper, keyframes for target 'part'
    'order':     K((0, {}), (20, {'r': -6, 'x': -2}), (45, {'r': 5, 'x': 2}), (65, {'r': -3}), (82, {'r': 1.5}), (100, {})),
    # fila dog-ear flops down (hinge at the top of the fold), rebounds, settles
    'collector': K((0, {}), (14, {'r': 6, 'sy': 0.96}), (32, {'r': -3.5, 'sy': 1.02}), (50, {'r': 2.2}), (68, {'r': -0.9}), (84, {'r': 0.3}), (100, {})),
    'credit':    K((0, {}), (16, {'r': -18, 'sy': 0.9}), (36, {'r': 6}), (56, {'r': -4}), (76, {'r': 1.5}), (100, {})),
    'stock':     K((0, {}), (22, {'r': -14, 'y': -6}), (40, {'r': -16, 'y': -8}), (58, {'r': 2, 'y': 0}), (72, {'r': -4}), (86, {'r': 1}), (100, {})),
    # agogo: the small bell is struck second (the big bell's tick rides on the root at 0%): ting-ting
    'brand':     K((0, {}), (48, {}), (52, {'r': -7}), (58, {'r': 4.5}), (65, {'r': -2.5}), (73, {'r': 1}), (82, {}), (100, {})),
    'proof':     K((0, {}), (25, {'x': -5, 'y': -2, 'r': -6}), (50, {'x': 5, 'y': 1, 'r': 5}), (75, {'x': -3, 'y': 2, 'r': -2}), (100, {})),
}

SIG_PROP = {
    # nylon bag hangs from its handles: swings late (lag behind the body) and settles
    'collector': K((0, {}), (22, {'r': 7}), (42, {'r': -6}), (62, {'r': 3.5}), (80, {'r': -1.5}), (100, {})),
    # sound arcs round the loop: a small flash on each tick (big bell at 0%, small bell at 52%), spread + fade
    'brand':     K((0, {'o': 0, 'sx': 0.85, 'sy': 0.85}), (3, {'o': 1, 'sx': 0.92, 'sy': 0.92}), (22, {'o': 0, 'sx': 1.14, 'sy': 1.14}),
                   (50, {'o': 0, 'sx': 0.85, 'sy': 0.85}), (54, {'o': 0.9, 'sx': 0.92, 'sy': 0.92}), (74, {'o': 0, 'sx': 1.12, 'sy': 1.12}),
                   (100, {'o': 0, 'sx': 0.85, 'sy': 0.85})),
}
def _rest(h):  # resting value of the prop channel
    return {'o': 0} if h == 'brand' else {}

# Brand: the big bell's strike is a quick damped rock of the whole figure (it carries the eyes with it).
# It is composed onto the shared root motion and densely sampled, so it plays as an own-root track.
def _tick(p, at, amp=3.2, width=22):
    u = (p - at)/width
    if u < 0 or u > 1: return 0.0
    return -amp*math.sin(u*math.pi*3.2)*(1 - u)**1.6
def _composite_root(base_track, dur, tick_at, step=2.0, amp=3.2, tick_w=None):
    keys = []; n = int(100/step)
    tw = tick_w if tick_w is not None else 22
    for i in range(n + 1):
        p = i*step; v = at(base_track, p/100*dur)
        v = {k: round(x, 4) for k, x in v.items() if k != 'o'}
        v['r'] = round(v.get('r', 0) + _tick(p, tick_at, amp, tw), 3)
        keys.append((p, v))
    return keys

def compress(keys, start_pct):
    """squeeze a keyframe list into [start_pct, 100] with rest before it (idle: plays now and then)"""
    r0 = keys[0][1]
    out = [(0, dict(r0)), (start_pct, dict(r0))]
    for p, v in keys[1:]:
        out.append((start_pct + (100 - start_pct)*p/100, v))
    return out

JIGGLE = {'collector': 5}   # long lever (the dog-ear hangs far from its hinge): smaller angle
def tracks(helper, state):
    t = [dict(tr) for tr in SHARED[state]]
    sp = SIG_PROP.get(helper)
    if helper == 'brand' and state in ('idle', 'working'):
        base = next(tr for tr in t if tr['target'] == 'root'); t.remove(base)
        if state == 'idle':   # two breaths, then ting (big) ... ting (small)
            dur = DUR['breathe']*2
            t.insert(0, dict(target='root', own=True, dur=dur, ease='lin', keys=_composite_root(base, dur, 78, step=0.5, tick_w=7)))
        else:                 # two hops per strike cycle: big bell rings on the first land, small bell on the second
            dur = DUR['work_sig']
            t.insert(0, dict(target='root', own=True, dur=dur, ease='lin', keys=_composite_root(base, dur, 0, step=2.0)))
    if state == 'idle':
        idur = DUR['breathe']*2 if helper == 'brand' else DUR['idle_sig']
        t.append(dict(target='part', dur=idur, ease='inout', keys=compress(SIG[helper], 78)))
        if sp: t.append(dict(target='prop', dur=idur, ease='inout', keys=compress(sp, 80 if helper == 'collector' else 78)))
    elif state == 'working':
        t.append(dict(target='part', dur=DUR['work_sig'], ease='inout', keys=SIG[helper]))
        if helper == 'collector':   # bag swings off every hop, a beat behind the body
            t.append(dict(target='prop', dur=DUR['work_bounce'], ease='inout', keys=K(
                (0, {'r': -4}), (30, {'r': -5}), (65, {'r': 4}), (100, {'r': -4}))))
        elif sp:
            t.append(dict(target='prop', dur=DUR['work_sig'], ease='out', keys=sp))
    elif state == 'waiting':
        if helper == 'brand':     # small bell rocks gently, waiting for the go-ahead
            keys = K((0, {'r': -2}), (50, {'r': 2}), (100, {'r': -2}))
        elif helper == 'collector':   # dog-ear sways a little (long lever)
            keys = K((0, {'r': 2}), (50, {'r': -2}), (100, {'r': 2}))
        else:
            keys = K((0, {'r': 3}), (50, {'r': -3}), (100, {'r': 3}))
        t.append(dict(target='part', dur=DUR['wait_sway'], ease='inout', keys=keys))
        if helper == 'collector':  # bag sways opposite the body, lagging
            t.append(dict(target='prop', dur=DUR['wait_sway'], ease='inout', keys=K(
                (0, {'r': 3}), (50, {'r': -3}), (100, {'r': 3}))))
    elif state == 'done':   # twist part jiggles off the land (secondary motion)
        if helper == 'brand':   # the small bell rings as it lands, arcs burst once
            keys = K((0, {}), (40, {}), (48, {'r': -8}), (56, {'r': 5}), (64, {'r': -3}), (74, {'r': 1.2}), (84, {}), (100, {}))
            t.append(dict(target='prop', dur=DUR['done_pop'] + 300, ease='out', iter=1, keys=K(
                (0, {'o': 0, 'sx': 0.8, 'sy': 0.8}), (50, {'o': 0, 'sx': 0.8, 'sy': 0.8}), (58, {'o': 1, 'sx': 0.9, 'sy': 0.9}),
                (88, {'o': 0, 'sx': 1.2, 'sy': 1.2}), (100, {'o': 0, 'sx': 0.8, 'sy': 0.8}))))
        else:
            keys = jiggle(JIGGLE.get(helper, AMP['jiggle_deg']))
            keys = [(0, {})] + [(40 + p*0.6, v) for p, v in keys[1:]]
            if helper == 'collector':
                t.append(dict(target='prop', dur=DUR['done_pop'] + 300, ease='inout', iter=1,
                              keys=[(0, {})] + [(46 + p*0.54, v) for p, v in jiggle(7)[1:]]))
        t.append(dict(target='part', dur=DUR['done_pop'] + 300, ease='inout', iter=1, keys=keys))
    return t

# ---------------------------------------------------------------- sampling (python renderer)
def bez(p1x, p1y, p2x, p2y):
    def sample(t):
        # solve x(u)=t by bisection, return y(u)
        lo, hi = 0.0, 1.0
        for _ in range(40):
            u = (lo + hi)/2
            x = 3*(1-u)**2*u*p1x + 3*(1-u)*u**2*p2x + u**3
            if x < t: lo = u
            else: hi = u
        u = (lo + hi)/2
        return 3*(1-u)**2*u*p1y + 3*(1-u)*u**2*p2y + u**3
    return sample
_EZ = {k: bez(*v) for k, v in EASE.items()}
DEFAULT = {'x': 0, 'y': 0, 'r': 0, 'sx': 1, 'sy': 1, 'o': 1}

def at(track, t_ms):
    dur = track['dur']; it = track.get('iter', 'infinite')
    if it == 1 and t_ms >= dur: p = 100.0
    else: p = (t_ms % dur)/dur*100 if t_ms >= 0 else ((t_ms % dur)/dur*100)
    keys = track['keys']
    for (p0, v0), (p1, v1) in zip(keys, keys[1:]):
        if p0 <= p <= p1:
            u = 0 if p1 == p0 else (p - p0)/(p1 - p0)
            e = _EZ[track['ease']](u)
            out = {}
            for k in DEFAULT:
                a = v0.get(k, DEFAULT[k]); b = v1.get(k, DEFAULT[k])
                out[k] = a + (b - a)*e
            return out
    return {k: keys[-1][1].get(k, DEFAULT[k]) for k in DEFAULT}

def sample(helper, state, t_ms, offset=0):
    dyn = {}
    for tr in tracks(helper, state):
        tt = t_ms + (0 if tr.get('iter') == 1 else offset)
        v = at(tr, tt)
        dyn[tr['target']] = v
    if 'dot' in dyn: dyn['dot'].pop('o', None)
    if 'ring' in dyn and 'o' in dyn['ring']:
        pass
    return dyn

# ---------------------------------------------------------------- CSS generation
def css_tf(v):
    x, y = v.get('x', 0), v.get('y', 0); r = v.get('r', 0); sx, sy = v.get('sx', 1), v.get('sy', 1)
    s = f'transform: translate({x:.2f}px, {y:.2f}px) rotate({r:.2f}deg) scale({sx:.3f}, {sy:.3f});'
    if 'o' in v: s += f' opacity: {v["o"]:.2f};'
    return s

def css(helpers):
    lines = [':root {']
    for k, v in EASE.items(): lines.append(f'  --ease-{k}: cubic-bezier({", ".join(str(x) for x in v)});')
    for k, v in DUR.items(): lines.append(f'  --dur-{k.replace("_", "-")}: {v}ms;')
    lines.append('}')
    sel = {'root': '.rig-root', 'face': '.rig-face', 'lid': '.rig-lid', 'part': '.rig-part', 'prop': '.rig-prop',
           'dot': '.rig-dot', 'ring': '.rig-ring', 'acc': '.rig-acc'}
    done = set()
    for h in helpers:
        for st in SHARED:
            for i, tr in enumerate(tracks(h, st)):
                shared = tr['target'] not in ('part', 'prop') and not tr.get('own')
                name = f'{st}-{tr["target"]}' + ('' if shared else f'-{h}')
                if tr.get('own'): name = f'{st}-{tr["target"]}-{h}'
                if tr['target'] == 'lid': name = f'{st}-lid-{tr["dur"]}'
                if name not in done:
                    done.add(name)
                    lines.append(f'@keyframes {name} {{')
                    for p, v in tr['keys']:
                        lines.append(f'  {p:.2f}% {{ {css_tf(v)} }}')
                    lines.append('}')
                scope = f'.mimi-helper[data-state="{st}"]' + ('' if shared else f'[data-helper="{h}"]')
                it = 'infinite' if tr.get('iter', 'infinite') == 'infinite' else '1 both'
                delay = '0ms' if tr.get('iter') == 1 else 'var(--stagger, 0ms)'
                rule = (f'{scope} {sel[tr["target"]]} {{ animation: {name} {tr["dur"]}ms var(--ease-{tr["ease"]}) {delay} {it}; }}')
                if rule not in done:
                    done.add(rule); lines.append(rule)
    return '\n'.join(lines)
