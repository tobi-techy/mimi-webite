"""Builds motion.html (self-contained) and renders the lineup video frames.
usage: python3 make_motion_v6.py html | frames START END | encode"""
import os, sys, json, subprocess
from helpers_v6 import *
import motion_v6 as M

def html():
    cards = []
    for i, k in enumerate(ORDER):
        svg = build(k).replace('<svg ', f'<svg style="--stagger:-{i*M.DUR["stagger"]}ms" ', 1)
        btns = ''.join(f'<button data-s="{s}">{s}</button>' for s in ['idle', 'working', 'waiting', 'done'])
        cards.append(f'''<article class="card" data-k="{k}" style="--tile:{FAMILY[COLOUR[k]]}">
  <div class="stage">{svg}</div>
  <div class="meta"><div><b>{LABEL[k]}</b><span class="mono">{COLOUR[k]}</span></div><p>{CUE[k]}</p>
  <div class="row">{btns}</div></div></article>''')
    exprs = ''.join(f'<button data-e="{e}">{e}</button>' for e in EXPRS)
    page = f'''<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Mimi helpers v6 / motion</title>
<style>
:root {{ --bg:#101010; --panel:#161616; --line:#262626; --text:#eeeeee; --muted:#8a857c; --or:{ORANGE};
  --fg:{CREAM}; --cut:#161616; --eye:#161616; }}
html.light {{ --bg:#f4efe6; --panel:#fbf8f2; --line:#e2dbcf; --text:#101010; --muted:#6b655c; --fg:{INK}; --cut:#fbf8f2; --eye:#fbf8f2; }}
* {{ box-sizing:border-box }}
body {{ margin:0; background:var(--bg); color:var(--text); font:15px/1.45 Geist, ui-sans-serif, system-ui, -apple-system, sans-serif; }}
.mono, button, .lbl {{ font-family:"Geist Mono", ui-monospace, SFMono-Regular, Menlo, monospace; text-transform:uppercase; letter-spacing:.04em; font-size:11px }}
header {{ display:flex; justify-content:space-between; align-items:flex-end; gap:24px; padding:40px 40px 20px; flex-wrap:wrap }}
h1 {{ margin:0; font-size:28px; font-weight:600; letter-spacing:-.01em }}
header p {{ margin:6px 0 0; color:var(--muted); max-width:620px }}
.bar {{ display:flex; gap:28px; padding:0 40px 24px; flex-wrap:wrap; border-bottom:1px solid var(--line) }}
.grp {{ display:flex; gap:6px; flex-wrap:wrap; align-items:center }}
.grp .lbl {{ color:var(--muted); margin-right:6px }}
button {{ background:transparent; color:var(--text); border:1px solid var(--line); border-radius:3px; padding:7px 10px; cursor:pointer;
  transition:background 180ms cubic-bezier(.4,0,.2,1), border-color 180ms cubic-bezier(.4,0,.2,1) }}
button:hover {{ border-color:var(--muted) }}
button.on {{ background:var(--text); color:var(--bg); border-color:var(--text) }}
main {{ display:grid; grid-template-columns:repeat(3,1fr); gap:1px; background:var(--line); border-bottom:1px solid var(--line) }}
@media (max-width:900px) {{ main {{ grid-template-columns:repeat(2,1fr) }} }}
@media (max-width:560px) {{ main {{ grid-template-columns:1fr }} header, .bar {{ padding-left:20px; padding-right:20px }} }}
.card {{ background:var(--panel); display:flex; flex-direction:column }}
.stage {{ aspect-ratio:1.25; display:grid; place-items:center; }}
.stage svg {{ width:min(78%,300px); height:auto; overflow:visible }}
.meta {{ padding:14px 18px 18px; border-top:1px solid var(--line) }}
.meta div:first-child {{ display:flex; justify-content:space-between; align-items:baseline }}
.meta b {{ font-weight:600; font-size:16px }} .meta .mono {{ color:var(--muted) }}
.meta p {{ color:var(--muted); margin:4px 0 12px; min-height:2.9em }}
.row {{ display:flex; gap:6px; flex-wrap:wrap }}
html.colour .card {{ background:var(--tile) }}
html.colour .stage {{ --fg:#101010; --cut:var(--tile); --eye:var(--tile) }}
html.colour .meta {{ border-top-color:rgba(0,0,0,.18) }} html.colour .meta p, html.colour .meta .mono {{ color:rgba(0,0,0,.6) }}
html.colour .card b {{ color:#101010 }} html.colour .card button {{ color:#101010; border-color:rgba(0,0,0,.25) }}
html.colour .card button.on {{ background:#101010; color:var(--tile) }}
footer {{ padding:24px 40px 48px; color:var(--muted) }}
footer code {{ font-family:"Geist Mono", ui-monospace, monospace; font-size:12px }}

/* rig colours: the static SVG carries literal fills; these make it themeable */
.mimi-helper .f {{ fill:var(--fg) }}
.mimi-helper .c, .mimi-helper .h {{ fill:var(--cut) }}
.mimi-helper .h {{ stroke:var(--cut) }}
.mimi-helper .e {{ fill:var(--eye) }}
.mimi-helper .es {{ stroke:var(--eye) }}
.mimi-helper [data-origin], .mimi-helper .rig-lid, .mimi-helper .rig-dot, .mimi-helper .rig-ring {{ transform-box:view-box }}
.mimi-helper .rig-dot, .mimi-helper .rig-ring, .mimi-helper .rig-halo {{ transition:opacity 180ms cubic-bezier(.4,0,.2,1) }}
.mimi-helper .rig-expr {{ transition:opacity 60ms linear }}

/* ---- motion: generated from motion_v6.py (tokens + tracks) ---- */
{M.css(ORDER)}

/* reduced motion: no loops; each state is a still pose (eyes + one orange mark carry it) */
@media (prefers-reduced-motion: reduce) {{ html:not(.force-motion) .mimi-helper * {{ animation:none !important }} }}
html.rm .mimi-helper * {{ animation:none !important }}
@media (prefers-reduced-motion: reduce) {{
  html:not(.force-motion) .mimi-helper[data-state="working"] .rig-face {{ transform:translate(-4px,3px) }}
  html:not(.force-motion) .mimi-helper[data-state="waiting"] .rig-face {{ transform:translate(0,-8px) }} }}
html.rm .mimi-helper[data-state="working"] .rig-face {{ transform:translate(-4px,3px) }}
html.rm .mimi-helper[data-state="waiting"] .rig-face {{ transform:translate(0,-8px) }}
@media (prefers-reduced-motion: reduce) {{ html:not(.force-motion) .mimi-helper[data-helper="brand"][data-state="working"] .rig-prop {{ opacity:1 }} }}
html.rm .mimi-helper[data-helper="brand"][data-state="working"] .rig-prop {{ opacity:1 }}
</style></head><body>
<header><div><span class="mono" style="color:var(--muted)">Mimi helpers / v6 / motion</span>
<h1>Six helpers, one rig</h1>
<p>Quick, mechanical, a little squishy. Every loop below is generated from the same motion tokens as the lineup video. Orange only ever means status.</p></div>
<div class="grp"><span class="lbl">Theme</span><button data-t="ink" class="on">Ink</button><button data-t="light">Cream</button><button data-t="colour">Colour tiles</button>
<button id="rm">Reduced motion</button></div></header>
<div class="bar"><div class="grp"><span class="lbl">All helpers</span>
<button data-all="idle" class="on">idle</button><button data-all="working">working</button><button data-all="waiting">waiting on owner</button><button data-all="done">done</button><button id="cycle">auto-cycle</button></div>
<div class="grp"><span class="lbl">Eyes</span>{exprs}</div></div>
<main>{''.join(cards)}</main>
<footer>States: <code>data-state="idle|working|waiting|done"</code> on the svg. Expressions: show one <code>.rig-expr[data-expr]</code> layer. Parts: <code>#k-root #k-body #k-acc #k-part #k-face #k-eye-l/r .rig-lid #k-prop #k-status</code>; origins in <code>data-origin</code> (rig units, 240 box).</footer>
<script>
const EXPR_FOR = {{idle:'idle', working:'idle', waiting:'idle', done:'happy'}};
const svgs = [...document.querySelectorAll('.mimi-helper')];
svgs.forEach(s => s.querySelectorAll('[data-origin]').forEach(el => {{
  const [x, y] = el.dataset.origin.split(' '); el.style.transformOrigin = x + 'px ' + y + 'px'; }}));
function setExpr(svg, e) {{ svg.querySelectorAll('.rig-expr').forEach(l => l.setAttribute('opacity', l.dataset.expr === e ? 1 : 0)); }}
function setState(svg, st) {{
  svg.removeAttribute('data-state'); void svg.getBoundingClientRect(); svg.setAttribute('data-state', st);
  setExpr(svg, EXPR_FOR[st]);
  svg.querySelector('.rig-dot').setAttribute('opacity', st === 'working' ? 1 : 0);
  svg.querySelector('.rig-ring').setAttribute('opacity', st === 'waiting' ? 1 : 0);
  svg.querySelector('.rig-halo').setAttribute('opacity', (st === 'working' || st === 'waiting') ? 1 : 0);
  const card = svg.closest('.card'); card.querySelectorAll('.row button').forEach(b => b.classList.toggle('on', b.dataset.s === st));
}}
svgs.forEach(s => setState(s, 'idle'));
document.querySelectorAll('.card .row button').forEach(b => b.onclick = () => setState(b.closest('.card').querySelector('svg'), b.dataset.s));
let timer = null;
function all(st) {{ svgs.forEach(s => setState(s, st)); document.querySelectorAll('[data-all]').forEach(b => b.classList.toggle('on', b.dataset.all === st)); }}
document.querySelectorAll('[data-all]').forEach(b => b.onclick = () => {{ stop(); all(b.dataset.all); }});
document.querySelectorAll('[data-e]').forEach(b => b.onclick = () => {{
  document.querySelectorAll('[data-e]').forEach(x => x.classList.toggle('on', x === b)); svgs.forEach(s => setExpr(s, b.dataset.e)); }});
function stop() {{ clearInterval(timer); timer = null; document.getElementById('cycle').classList.remove('on'); }}
document.getElementById('cycle').onclick = e => {{
  if (timer) return stop(); e.target.classList.add('on');
  const seq = ['idle', 'working', 'waiting', 'done']; let i = 0; all(seq[0]);
  timer = setInterval(() => {{ i = (i + 1) % seq.length; all(seq[i]); }}, 3000); }};
document.querySelectorAll('[data-t]').forEach(b => b.onclick = () => {{
  document.documentElement.classList.remove('light', 'colour'); if (b.dataset.t !== 'ink') document.documentElement.classList.add(b.dataset.t);
  document.querySelectorAll('[data-t]').forEach(x => x.classList.toggle('on', x === b)); }});
document.getElementById('rm').onclick = e => {{ document.documentElement.classList.toggle('rm'); e.target.classList.toggle('on'); }};
</script></body></html>'''
    open(os.path.join(OUT, 'motion.html'), 'w').write(page)
    print('motion.html', len(page))

# ---------------------------------------------------------------- video
FPS = 24
SEQ = [('idle', 3.0), ('working', 3.0), ('waiting', 3.0), ('done', 2.2)]
TOTAL = sum(d for _, d in SEQ)
VW, VH = 1080, 1350
FR = '/tmp/mimi_frames_v6'

def frame_svg(t):
    acc = 0
    for st, d in SEQ:
        if t < acc + d: break
        acc += d
    lt = (t - acc)*1000
    cells = ''
    for i, k in enumerate(ORDER):
        cx = 180 + (i % 3)*360; cy = 400 + (i//3)*470
        dyn = M.sample(k, st, lt, offset=i*M.DUR['stagger'])
        # done: stagger the pop per helper
        if st == 'done':
            dyn = M.sample(k, st, lt - i*90, offset=0)
        dyn['expr'] = 'happy' if st == 'done' else 'idle'
        sc = 1.35
        g = build(k, fg=CREAM, cut=INK, state=st, dyn=dyn, standalone=False, prefix=f'v{i}')
        cells += f'<g transform="translate({cx-120*sc} {cy+130-222*sc}) scale({sc})">{g}</g>'
        cells += (f'<text x="{cx}" y="{cy+190}" text-anchor="middle" font-family="DejaVu Sans Mono" font-size="22" '
                  f'letter-spacing="2" fill="#8a857c">{LABEL[k].upper()}</text>')
    name = {'idle': 'IDLE', 'working': 'WORKING', 'waiting': 'WAITING ON OWNER', 'done': 'DONE'}[st]
    pills = ''
    x = 60
    for s, _ in SEQ:
        w = 26 + 15*len({'idle': 'IDLE', 'working': 'WORKING', 'waiting': 'WAITING', 'done': 'DONE'}[s])
        on = s == st
        pills += (f'<rect x="{x}" y="1240" width="{w}" height="44" rx="3" fill="{CREAM if on else INK}" stroke="#2a2a2a"/>'
                  f'<text x="{x+w/2}" y="1269" text-anchor="middle" font-family="DejaVu Sans Mono" font-size="19" '
                  f'fill="{INK if on else "#8a857c"}">{ {"idle": "IDLE", "working": "WORKING", "waiting": "WAITING", "done": "DONE"}[s] }</text>')
        x += w + 12
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {VW} {VH}" width="{VW}" height="{VH}">'
            f'<rect width="{VW}" height="{VH}" fill="{INK}"/>'
            f'<text x="60" y="96" font-family="DejaVu Sans Mono" font-size="22" letter-spacing="2" fill="#8a857c">MIMI HELPERS / V6</text>'
            f'<text x="60" y="150" font-family="DejaVu Sans" font-size="44" fill="{CREAM}">{name}</text>'
            f'{cells}{pills}</svg>')

def frames(a, b):
    os.makedirs(FR, exist_ok=True)
    for n in range(a, b):
        t = n / FPS
        open(f'{FR}/f{n:04d}.png', 'wb').write(cairosvg.svg2png(bytestring=frame_svg(t).encode(), output_width=VW))

def encode():
    mp4 = os.path.join(OUT, 'lineup.mp4'); gif = os.path.join(OUT, 'lineup.gif')
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', str(FPS), '-i', f'{FR}/f%04d.png',
                    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-movflags', '+faststart', mp4], check=True)
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', str(FPS), '-i', f'{FR}/f%04d.png', '-vf',
                    'fps=15,scale=540:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=32[p];[b][p]paletteuse=dither=none', gif], check=True)
    print(mp4, gif)

if __name__ == '__main__':
    cmd = sys.argv[1]
    if cmd == 'html': html()
    elif cmd == 'frames': frames(int(sys.argv[2]), int(sys.argv[3]))
    elif cmd == 'encode': encode()
    elif cmd == 'count': print(int(TOTAL*FPS))
