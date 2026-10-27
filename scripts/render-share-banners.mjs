/**
 * Renders the 1200x630 share banners (Open Graph + Twitter) listed in src/config/share-banners.json
 * into public/og/<file>.png, in the site's locked look: near-black canvas, Geist headline, Geist Mono
 * label, one orange mark, die-cut stickers and the bright helpers.
 *
 * Not part of the build. Re-run it after changing a page headline or the banner list:
 *   npm i --no-save playwright-core@1.49
 *   CHROME_PATH=/path/to/chrome node scripts/render-share-banners.mjs [file ...]
 * CHROME_PATH can be any Chrome/Chromium; without it playwright-core's own browser is used.
 */
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const { banners } = JSON.parse(readFileSync(join(root, "src/config/share-banners.json"), "utf8"));
const only = process.argv.slice(2);
const outDir = join(root, "public/og");
mkdirSync(outDir, { recursive: true });

const fileUrl = (p) => pathToFileURL(join(root, p)).href;
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/* bright helper fills on dark (same set as the console and the brand kit "Bright" look) */
const bright = {
  order: "#ffcf4d",
  collector: "#5ea2ff",
  credit: "#b18cff",
  stock: "#6fd98c",
  brand: "#ff7db8",
  proof: "#3fd9c7",
};

/** A helper (or Mimi) as inline SVG: backdrop removed, body in its bright colour, cuts and eyes ink. */
function figure(key) {
  const name = key === "mimi" ? "mimi" : key.replace("helper-", "");
  let svg = readFileSync(join(root, `public/brand-kit/helpers/${name}-on-dark.svg`), "utf8");
  svg = svg.replace(/<rect width="240" height="240" fill="#101010"\/>/, "");
  if (name !== "mimi") svg = svg.replaceAll('fill="#F4EFE6"', `fill="${bright[name]}"`);
  /* drop every id so several figures can share one page */
  return svg.replace(/\sid="[^"]*"/g, "").replace(/<svg /, '<svg class="fig" ');
}

/* art slots on the right half: [x, y, width, rotation]; the first item is the hero of the art */
const slots = {
  1: [[900, 330, 320, -4]],
  2: [
    [860, 300, 280, -5],
    [1050, 475, 180, 9],
  ],
  3: [
    [860, 325, 260, -5],
    [1050, 190, 165, 10],
    [1045, 480, 170, -8],
  ],
  4: [
    [850, 320, 240, -5],
    [1050, 185, 150, 10],
    [1060, 420, 145, -9],
    [900, 515, 125, 7],
  ],
};

function art(items) {
  if (items[0] === "lineup") {
    /* Mimi on top, her six helpers in two rows of three */
    const lineup = [
      ["mimi", 905, 175, 170],
      ["helper-order", 760, 340, 130],
      ["helper-collector", 905, 345, 130],
      ["helper-credit", 1050, 340, 130],
      ["helper-stock", 760, 490, 130],
      ["helper-brand", 905, 495, 130],
      ["helper-proof", 1050, 490, 130],
    ];
    return lineup
      .map(([k, x, y, w]) => `<div class="a" style="left:${x}px;top:${y}px;width:${w}px">${figure(k)}</div>`)
      .join("");
  }
  const s = slots[items.length];
  return items
    .map((k, i) => {
      const [x, y, w, r] = s[i];
      const inner = k.startsWith("sticker-")
        ? `<img class="st" src="${fileUrl(`public/stickers/${k}.webp`)}" alt="">`
        : figure(k);
      return `<div class="a" style="left:${x}px;top:${y}px;width:${w}px;transform:translate(-50%,-50%) rotate(${r}deg)">${inner}</div>`;
    })
    .join("");
}

function html(b) {
  let title = esc(b.title);
  if (b.underline) title = title.replace(esc(b.underline), `<span class="u">${esc(b.underline)}</span>`);
  return `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:Geist;src:url(${fileUrl("src/assets/fonts/geist-sans-400-500.woff2")}) format("woff2");font-weight:400 500}
@font-face{font-family:GeistMono;src:url(${fileUrl("src/assets/fonts/geist-mono-400.woff2")}) format("woff2");font-weight:400}
*{box-sizing:border-box;margin:0}
html,body{width:1200px;height:630px;background:#101010;overflow:hidden}
.c{position:relative;width:1200px;height:630px;color:#eeeeee;font-family:Geist,sans-serif}
.frame{position:absolute;inset:24px;border:1px solid #2c2a28;border-radius:3px}
.logo{position:absolute;left:72px;top:68px;height:40px}
.txt{position:absolute;left:72px;bottom:72px;width:${b.art[0] === "lineup" ? 600 : 640}px;display:flex;flex-direction:column;gap:22px}
.lab{display:flex;align-items:center;gap:14px;font:400 21px/1 GeistMono,monospace;letter-spacing:.07em;text-transform:uppercase;color:#a8a29e}
.lab i{width:11px;height:11px;background:#ee6018;display:block}
h1{font-weight:400;font-size:92px;line-height:1.02;letter-spacing:-.035em;color:#eeeeee;text-wrap:balance}
h1 .u{text-decoration:underline;text-decoration-color:#ee6018;text-decoration-thickness:6px;text-underline-offset:14px}
.sub{font-size:28px;line-height:1.3;color:#a8a29e;letter-spacing:-.01em}
.a{position:absolute;transform:translate(-50%,-50%)}
.a .st,.a .fig{display:block;width:100%;height:auto;filter:drop-shadow(0 10px 18px rgba(0,0,0,.55)) drop-shadow(0 2px 3px rgba(0,0,0,.35))}
.a .fig{filter:none}
</style></head><body><div class="c">
<div class="frame"></div>
<img class="logo" src="${fileUrl("public/brand/mimi-logo-horizontal-reverse.svg")}" alt="">
${art(b.art)}
<div class="txt"><p class="lab"><i></i>${esc(b.label)}</p><h1>${title}</h1>${b.sub ? `<p class="sub">${esc(b.sub)}</p>` : ""}</div>
</div>
<script>
/* fit the headline: shrink until it is at most three lines and sits below the logo (called once fonts load) */
window.fit=()=>{const h=document.querySelector("h1"),t=document.querySelector(".txt");let s=92;h.style.fontSize=s+"px";
const lines=()=>Math.round(h.getBoundingClientRect().height/(s*1.02));
while((t.getBoundingClientRect().top<150||h.scrollWidth>h.clientWidth||lines()>3)&&s>52){s-=2;h.style.fontSize=s+"px"}
return s};
</script></body></html>`;
}

const { chromium } = await import("playwright-core");
const browser = await chromium.launch({
  ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}),
  args: ["--no-sandbox", "--allow-file-access-from-files"],
});
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
const tmp = join(tmpdir(), "mimi-share-banner.html");
for (const b of banners) {
  if (only.length && !only.includes(b.file)) continue;
  writeFileSync(tmp, html(b));
  await page.goto(pathToFileURL(tmp).href, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  const size = await page.evaluate(() => window.fit());
  await page.waitForTimeout(100);
  await page.screenshot({ path: join(outDir, `${b.file}.png`), type: "png" });
  console.log(`og/${b.file}.png  (headline ${size}px)`);
}
await browser.close();
rmSync(tmp, { force: true });
