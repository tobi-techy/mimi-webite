"""Mimi helpers v6 sheets: silhouettes, states, expressions, stickers, tiles, family."""
import os
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from scipy import ndimage
from helpers_v6 import *

def font(sz, mono=False, bold=False):
    p = '/usr/share/fonts/truetype/dejavu/DejaVuSans' + ('Mono' if mono else '') + ('-Bold' if bold else '') + '.ttf'
    return ImageFont.truetype(p, sz)

def header(d, text, fg, x=80, y=60):
    d.text((x, y), text, fill=fg, font=font(24, mono=True))

def label(d, cx, y, text, fg, sz=26, mono=False):
    fnt = font(sz, mono=mono); w = d.textlength(text, font=fnt)
    d.text((cx - w/2, y), text, fill=fg, font=fnt)

def paste(sheet, im, x, y):
    sheet.alpha_composite(im, (int(x), int(y)))

# ---------------------------------------------------------------- silhouettes.png
def silhouettes():
    W, Hh = 2400, 1640
    sh = Image.new('RGBA', (W, Hh), CREAM); d = ImageDraw.Draw(sh)
    header(d, 'MIMI HELPERS  /  V6 SILHOUETTES  /  ONE BLOB, ONE TWIST', INK)
    colw = (W - 160) // 3
    for i, k in enumerate(ORDER):
        cx = 80 + (i % 3)*colw + colw//2; y = 120 + (i//3)*600
        paste(sh, png(build(k), 520), cx - 260, y)
        label(d, cx, y + 520, LABEL[k], INK, 30)
        label(d, cx, y + 560, CUE[k], '#6b655c', 17)
    y0 = 1420
    d.line((80, y0 - 34, W - 80, y0 - 34), fill='#cfc7b8', width=2)
    d.text((80, y0), '24 + 48 PX', fill=INK, font=font(20, mono=True))
    for i, k in enumerate(ORDER):
        x = 250 + i*150
        paste(sh, png(build(k), 24), x, y0 + 4); paste(sh, png(build(k), 48), x + 40, y0 - 8)
    d.text((1230, y0), '24 PX x4', fill=INK, font=font(20, mono=True))
    for i, k in enumerate(ORDER):
        paste(sh, png(build(k), 24).resize((96, 96), Image.NEAREST), 1370 + i*165, y0 - 34)
    sh.convert('RGB').save(os.path.join(OUT, 'silhouettes.png'))

# ---------------------------------------------------------------- states.png
def states():
    st = ['idle', 'working', 'waiting', 'done']
    cell = 300; W = 260 + cell*4 + 80; Hh = 160 + cell*6 + 60
    sh = Image.new('RGBA', (W, Hh), CREAM); d = ImageDraw.Draw(sh)
    header(d, 'STATES  /  EYES + ONE ORANGE MARK ONLY', INK)
    desc = {'idle': 'idle', 'working': 'working  (dot)', 'waiting': 'waiting on owner  (ring)', 'done': 'done'}
    for j, s in enumerate(st):
        label(d, 260 + j*cell + cell//2, 112, desc[s].upper(), INK, 17, mono=True)
    for i, k in enumerate(ORDER):
        y = 150 + i*cell
        d.text((80, y + cell//2 - 14), LABEL[k], fill=INK, font=font(26))
        for j, s in enumerate(st):
            paste(sh, png(build(k, state=s), 280), 260 + j*cell + 10, y + 10)
    sh.convert('RGB').save(os.path.join(OUT, 'states.png'))

# ---------------------------------------------------------------- expressions.png
def expressions():
    cols = 6; cell = 340; W = 80*2 + cell*cols; Hh = 140 + 2*(cell + 70) + 230
    sh = Image.new('RGBA', (W, Hh), CREAM); d = ImageDraw.Draw(sh)
    header(d, 'EYE EXPRESSION SET  /  12 SWAPPABLE LAYERS, SHARED BY ALL SIX', INK)
    for n, e in enumerate(EXPRS):
        k = ORDER[n % 6]
        x = 80 + (n % cols)*cell; y = 120 + (n//cols)*(cell + 70)
        paste(sh, png(build(k, expr=e, status=False), 320), x + 10, y)
        label(d, x + cell//2, y + 322, e.upper(), INK, 18, mono=True)
    # one helper, all 12, at 48px and 24px
    y0 = 120 + 2*(cell + 70) + 20
    d.line((80, y0 - 20, W - 80, y0 - 20), fill='#cfc7b8', width=2)
    d.text((80, y0), 'SAME LAYERS ON BRAND  /  96 PX  +  48 PX', fill=INK, font=font(18, mono=True))
    for n, e in enumerate(EXPRS):
        x = 80 + n*165
        paste(sh, png(build('brand', expr=e, status=False), 96), x, y0 + 40)
        paste(sh, png(build('brand', expr=e, status=False), 48), x + 100, y0 + 70)
    sh.convert('RGB').save(os.path.join(OUT, 'expressions.png'))

# ---------------------------------------------------------------- stickers.png
def dilate(a, r):
    dist = ndimage.distance_transform_edt(a < 128)
    return np.where(dist <= r, 255, 0).astype(np.uint8)

def sticker(svg, w, body_fill, keyline, paper, outline_px, border_px, shadow=(12, 14)):
    """svg drawn on transparent; outline = keyline colour ring, border = paper ring, hard offset shadow"""
    art = png(svg, w); a = np.array(art.split()[-1])
    pad = border_px + outline_px + 30
    A = np.pad(a, pad); art_p = Image.new('RGBA', (A.shape[1], A.shape[0]), (0, 0, 0, 0))
    art_p.alpha_composite(art, (pad, pad))
    o1 = dilate(A, max(outline_px, 0.5)); o2 = dilate(A, outline_px + border_px)
    o2 = np.array(Image.fromarray(o2).filter(ImageFilter.GaussianBlur(1.2)))
    out = Image.new('RGBA', art_p.size, (0, 0, 0, 0))
    sh = Image.new('RGBA', art_p.size, (0, 0, 0, 0))
    sh.paste(Image.new('RGBA', art_p.size, (0, 0, 0, 255)), (shadow[0], shadow[1]), Image.fromarray(o2))
    out.alpha_composite(sh)
    out.paste(Image.new('RGBA', art_p.size, paper), (0, 0), Image.fromarray(o2))
    lay = Image.new('RGBA', art_p.size, keyline); out.paste(lay, (0, 0), Image.fromarray(o1))
    out.alpha_composite(art_p)
    return out

def stickers():
    """v6: solid stickers, like Tobi's sticker-grid ref: one flat colour body, cuts + eyes take the sticker paper,
    paper die-cut border, hard shadow. No ink keyline (no lines except the eyes)."""
    W, Hh = 2400, 1260
    sh = Image.new('RGBA', (W, Hh), '#101010'); d = ImageDraw.Draw(sh)
    header(d, 'STICKERS  /  DIE-CUT, SOLID FAMILY COLOUR, PAPER BORDER, HARD SHADOW', '#8a857c')
    keys = ['order', 'collector', 'credit', 'mimi', 'stock', 'brand', 'proof']
    col = dict(COLOUR, mimi='tangerine')
    def art(k, fg, cut):
        if k == 'mimi':
            return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240">' + mimi(fg=fg, cut=cut, scale=0.82) + '</svg>'
        return build(k, fg=fg, cut=cut, state='idle', status=False)
    colw = (W - 160) // 7
    for i, k in enumerate(keys):
        st = sticker(art(k, FAMILY[col[k]], '#ffffff'), 290, None, '#ffffff', '#ffffff', 0, 18)
        st = st.rotate([-6, 5, -4, 3, 6, -5, 4][i], resample=Image.BICUBIC, expand=True)
        cx = 80 + i*colw + colw//2; paste(sh, st, cx - st.width//2, 170)
    d.text((80, 660), 'MONO  /  INK ON CREAM PAPER', fill='#8a857c', font=font(24, mono=True))
    for i, k in enumerate(keys):
        st = sticker(art(k, INK, CREAM), 290, None, CREAM, CREAM, 0, 18, shadow=(10, 12))
        st = st.rotate([5, -4, 6, -3, -5, 4, -6][i], resample=Image.BICUBIC, expand=True)
        cx = 80 + i*colw + colw//2; paste(sh, st, cx - st.width//2, 750)
    sh.convert('RGB').save(os.path.join(OUT, 'stickers.png'))

# ---------------------------------------------------------------- tiles.png
def tile(k, colour, size=360, radius=84, mode='ink'):
    """app-tile: flat family colour tile; ink body with tile-colour eyes (mode ink),
    or family-colour body with ink eyes on a cream tile (mode body)"""
    t = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    m = Image.new('L', (size, size), 0); ImageDraw.Draw(m).rounded_rectangle((0, 0, size-1, size-1), radius, fill=255)
    bgc = colour if mode == 'ink' else INK
    t.paste(Image.new('RGBA', (size, size), bgc), (0, 0), m)
    if k == 'mimi':
        svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240">'
               + mimi(fg=INK if mode == 'ink' else colour, cut=bgc, eye=bgc if mode == 'ink' else INK, scale=0.82) + '</svg>')
    else:
        svg = build(k, fg=INK if mode == 'ink' else colour, cut=bgc, eye=bgc if mode == 'ink' else INK, status=False)
    art = png(svg, int(size*0.84)); t.alpha_composite(art, (int(size*0.08), int(size*0.04)))
    return t

def tiles():
    keys = ORDER[:3] + ['mimi'] + ORDER[3:]
    col = dict(COLOUR, mimi='tangerine')
    W, Hh = 80*2 + 7*320, 1200
    sh = Image.new('RGBA', (W, Hh), CREAM); d = ImageDraw.Draw(sh)
    header(d, 'FAMILY COLOUR TILES  /  ILLUSTRATION + APP TILES ONLY (PRODUCT UI STAYS INK/CREAM)', INK)
    for i, k in enumerate(keys):
        x = 80 + i*320
        paste(sh, tile(k, FAMILY[col[k]], 280, 66, 'ink'), x, 130)
        label(d, x + 140, 420, ('Mimi' if k == 'mimi' else LABEL[k]), INK, 22)
        label(d, x + 140, 452, f'{col[k]}  {FAMILY[col[k]]}', '#6b655c', 15, mono=True)
        paste(sh, tile(k, FAMILY[col[k]], 280, 66, 'body'), x, 520)
    d.text((80, 830), 'MONO  (PRODUCT UI)  /  CREAM ON INK  +  INK ON BONE', fill=INK, font=font(20, mono=True))
    for i, k in enumerate(keys):
        x = 80 + i*320
        for j, (tb, fgc) in enumerate([(INK, CREAM), ('#e6dfd2', INK)]):
            t = Image.new('RGBA', (136, 136), (0, 0, 0, 0)); m = Image.new('L', (136, 136), 0)
            ImageDraw.Draw(m).rounded_rectangle((0, 0, 135, 135), 32, fill=255)
            t.paste(Image.new('RGBA', (136, 136), tb), (0, 0), m)
            svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240">' + mimi(fg=fgc, cut=tb, scale=0.82) + '</svg>') \
                if k == 'mimi' else build(k, fg=fgc, cut=tb, status=False)
            t.alpha_composite(png(svg, 114), (11, 6)); paste(sh, t, x + j*146, 880)
        for j, sz in enumerate([48, 32, 24]):
            t = tile(k, FAMILY[col[k]], sz*2, int(sz*0.46), 'ink').resize((sz, sz), Image.LANCZOS)
            paste(sh, t, x + [0, 62, 108][j], 1060)
    d.text((80, 1140), 'APP-TILE SIZES 48 / 32 / 24 PX', fill='#6b655c', font=font(15, mono=True))
    sh.convert('RGB').save(os.path.join(OUT, 'tiles.png'))

# ---------------------------------------------------------------- family.png
def family(colour=False):
    W, Hh = 2400, 760
    keys = ORDER[:3] + ['mimi'] + ORDER[3:]
    xs = [215, 530, 845, 1200, 1555, 1870, 2185]
    looks = {'order': 'idle', 'collector': 'happy', 'credit': 'content', 'stock': 'wink',
             'brand': 'excited', 'proof': 'idle'}
    col = dict(COLOUR, mimi='tangerine')
    bg = INK; base = 600; body = ''
    for k, x in zip(keys, xs):
        fg = FAMILY[col[k]] if colour else CREAM
        if k == 'mimi':
            sc = 1.72
            body += f'<g transform="translate({x-120*sc} {base-222*sc}) scale({sc})">{mimi(fg=fg, cut=bg, scale=1.0, look=(0, -4))}</g>'
        else:
            sc = 1.36
            body += (f'<g transform="translate({x-120*sc} {base-222*sc}) scale({sc})">'
                     f'{build(k, fg=fg, cut=bg, expr=looks[k], standalone=False, status=False, prefix="fam-"+k)}</g>')
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {Hh}" width="{W}" height="{Hh}">'
           f'<rect width="{W}" height="{Hh}" fill="{bg}"/>'
           f'<rect x="100" y="{base}" width="{W-200}" height="2" fill="#2a2a2a"/>{body}</svg>')
    im = png(svg, W); d = ImageDraw.Draw(im)
    d.text((100, 70), 'MIMI  +  HER SIX HELPERS', fill='#8a857c', font=font(24, mono=True))
    for k, x in zip(keys, xs):
        label(d, x, base + 40, 'MIMI' if k == 'mimi' else LABEL[k].upper(), CREAM if k == 'mimi' else '#8a857c', 20, mono=True)
    im.convert('RGB').save(os.path.join(OUT, 'family-colour.png' if colour else 'family.png'))

def family_colour(): family(True)

if __name__ == '__main__':
    import sys
    which = sys.argv[1:] or ['silhouettes', 'states', 'expressions', 'stickers', 'tiles', 'family', 'family_colour']
    for w in which: globals()[w](); print(w, 'ok')
