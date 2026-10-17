#!/usr/bin/env node
// store-screenshots: raw app screenshots -> store listing images.
//   node render.mjs <config.json> [--device <name>] [--only <slot>] [--no-preview]
// Every device of the config is one row of pictures: the pictures are slices of ONE wide background, so the shapes, the
// line and the dishes on a border continue from picture to picture. No dependencies: Node 20+ and Chrome/Chromium.
// CHROME=<binary> overrides the browser. See ../references/config.md for every option.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

// ---------------------------------------------------------------- arguments and config

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(name);
  return i < 0 ? null : args.splice(i, 2)[1] ?? null;
};
const noPreview = (() => { const i = args.indexOf('--no-preview'); if (i < 0) return false; args.splice(i, 1); return true; })();
const onlyDevice = flag('--device');
const onlySlot = flag('--only');
const configPath = args[0] ? resolve(args[0]) : null;
if (!configPath || !existsSync(configPath)) {
  console.error('usage: node render.mjs <config.json> [--device <name>] [--only <slot>] [--no-preview]');
  process.exit(2);
}
const base = dirname(configPath);
const cfg = JSON.parse(readFileSync(configPath, 'utf8'));
const at = (p) => (p == null ? null : resolve(base, p));

const theme = {
  background: '#2649C0', // one colour, or two or more for a gradient
  shapes: [], // colours of the soft shapes behind the phones (darker/lighter than the background)
  text: '#FFFFFF',
  accent: '#FFFFFF', // the hero's badge fill and the line's colour
  badgeText: null, // the hero badge's text colour (default: the first background colour)
  phone: '#0A0D1C', // bezel
  ...cfg.theme,
};
const layout = { align: 'left', phoneWidth: 0.82, phoneTop: 0.24, bleed: true, titleSize: 0.078, ...cfg.layout };
const decor = { style: 'auto', ...cfg.decor }; // 'auto' | 'none' | explicit lists (shapes, line, border)
const font = { family: 'system-ui', file: null, weight: 700, ...cfg.font };
const outDir = at(cfg.out ?? 'out');
const format = cfg.format ?? 'png'; // 'png' | 'jpeg' (flattened: some stores refuse transparency)
const slots = cfg.slots ?? [];
const devices = cfg.devices ?? {};
if (!slots.length || !Object.keys(devices).length) {
  console.error('config needs "slots" and "devices"');
  process.exit(2);
}

const CHROME = process.env.CHROME || [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].find((p) => existsSync(p));
if (!CHROME) {
  console.error('Chrome or Chromium not found: install one or set CHROME=<binary>');
  process.exit(2);
}

// ---------------------------------------------------------------- helpers

const url = (p) => pathToFileURL(p).href;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const num = (x, d) => (typeof x === 'number' ? x : d);

// Small deterministic random for the 'auto' decoration: the same config always draws the same picture.
function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);
}

function pngSize(file) {
  const b = readFileSync(file);
  if (b.length < 24 || b.readUInt32BE(0) !== 0x89504e47) return null;
  return [b.readUInt32BE(16), b.readUInt32BE(20)];
}

function background(colors, w, total) {
  const list = Array.isArray(colors) ? colors : [colors];
  return list.length === 1 ? list[0] : `linear-gradient(100deg, ${list.join(', ')})`;
}

// ---------------------------------------------------------------- decoration

// Coordinates: x in picture widths from the left of the row (a border between picture k-1 and k is x = k), y in
// picture heights. 'auto' makes soft shapes and one wave line from the theme; explicit lists replace it.
function autoDecor(n) {
  const r = rng(n * 7919 + theme.shapes.length);
  const colors = theme.shapes.length ? theme.shapes : [shade(theme.background, -0.14), shade(theme.background, -0.26)];
  const shapes = [];
  for (let i = 0; i < n; i++) {
    const top = i % 2 === 0;
    shapes.push({ kind: 'ellipse', cx: i + 0.2 + r() * 0.6, cy: top ? 0.05 + r() * 0.1 : 0.88 + r() * 0.1, rx: 0.5 + r() * 0.2, ry: 0.17 + r() * 0.08, rot: Math.round(-25 + r() * 50), color: colors[i % colors.length] });
  }
  const pts = [];
  for (let i = 0; i <= n; i++) pts.push([i, 0.2 + 0.18 * Math.sin(i * 1.9 + 0.6) + r() * 0.04]);
  return { shapes, line: { points: pts, color: theme.accent, opacity: 0.8, width: 0.006 }, border: [] };
}

function shade(hex, amount) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.startsWith('#') ? hex : '');
  if (!m) return hex;
  const v = parseInt(m[1], 16);
  const ch = (shift) => {
    const c = (v >> shift) & 255;
    return Math.max(0, Math.min(255, Math.round(amount < 0 ? c * (1 + amount) : c + (255 - c) * amount)));
  };
  return '#' + [16, 8, 0].map((s) => ch(s).toString(16).padStart(2, '0')).join('');
}

function smoothPath(points, w, h) {
  const P = points.map(([x, y]) => [x * w, y * h]);
  if (P.length < 2) return '';
  let d = `M${P[0][0]} ${P[0][1]}`;
  for (let i = 0; i < P.length - 1; i++) {
    const p0 = P[i - 1] ?? P[i], p1 = P[i], p2 = P[i + 1], p3 = P[i + 2] ?? P[i + 1];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0]} ${c1[1]}, ${c2[0]} ${c2[1]}, ${p2[0]} ${p2[1]}`;
  }
  return d;
}

// ---------------------------------------------------------------- one picture as HTML

function pageHtml({ i, w, h, shot, slot, scale = 1 }) {
  const n = slots.length;
  const tablet = w > h * 0.7;
  const total = w * n;
  const auto = decor.style === 'none' ? { shapes: [], line: null, border: [] } : autoDecor(n);
  const shapes = decor.shapes ?? auto.shapes;
  const line = decor.line === null ? null : decor.line ?? auto.line;
  const border = decor.border ?? auto.border;
  const center = layout.align === 'center';
  const fs = Math.round(w * (tablet ? layout.titleSize * 0.76 : layout.titleSize));
  const pad = Math.round(w * 0.075);
  const pw = Math.round(w * (tablet ? Math.min(layout.phoneWidth + 0.02, 0.9) : layout.phoneWidth));
  const top = Math.round(h * (tablet ? layout.phoneTop - 0.02 : layout.phoneTop));
  const bezel = Math.round(w * 0.012);
  const r = Math.round(w * (tablet ? 0.035 : 0.075));
  const bleed = layout.bleed;
  const bg = background(theme.background, w, total);
  const fontFace = font.file ? `@font-face{font-family:'SSFont';src:url("${url(at(font.file))}");font-weight:${font.weight}}` : '';
  const family = font.file ? `'SSFont', ${font.family}` : `${font.family}, -apple-system, 'Helvetica Neue', Arial, sans-serif`;

  const dish = (it, z = 1) => {
    const wd = it.w * w;
    return `<img src="${url(at(it.file))}" style="position:absolute;left:${it.x * w - wd / 2}px;top:${it.y * h}px;width:${wd}px;transform:rotate(${it.rot ?? 0}deg);z-index:${it.z ?? z};filter:drop-shadow(0 ${wd * 0.05}px ${wd * 0.06}px rgba(0,0,0,.28))">`;
  };
  // A decor item on a border sits on the seam between picture k-1 and k: half in each.
  const borderHtml = border.map((it) => dish({ ...it, x: it.at }, 1)).join('');

  const ellipses = shapes.filter((s) => s.kind !== 'ring').map((s) => `<ellipse cx="${s.cx * w}" cy="${s.cy * h}" rx="${s.rx * w}" ry="${s.ry * h}" transform="rotate(${s.rot ?? 0} ${s.cx * w} ${s.cy * h})" fill="${s.color}" opacity="${s.opacity ?? 1}"/>`).join('');
  const rings = shapes.filter((s) => s.kind === 'ring').map((s) => `<circle cx="${s.cx * w}" cy="${s.cy * h}" r="${s.r * w}" fill="none" stroke="${s.color}" stroke-width="${(s.stroke ?? 0.012) * w}" opacity="${s.opacity ?? 0.4}"/>`).join('');
  const lineSvg = line ? `<path d="${smoothPath(line.points, w, h)}" fill="none" stroke="${line.color ?? theme.accent}" stroke-opacity="${line.opacity ?? 0.8}" stroke-width="${(line.width ?? 0.006) * w}" stroke-linecap="round"/>` : '';

  const hero = slot.kind === 'hero';
  const heroHtml = hero ? heroBlock(slot, { w, h, pad, dish }) : '';
  const titleTop = hero && (slot.logo || slot.brand) ? Math.round(h * 0.13) : Math.round(h * 0.055);
  const title = (slot.title ?? []).map(esc).join('<br>');
  const phone = hero || !shot ? '' : `<div class="p"><img src="${url(shot)}"></div>`;

  return `<!doctype html><meta charset="utf-8"><style>
${fontFace}
*{margin:0;box-sizing:border-box}html,body{width:${w}px;height:${h}px;overflow:hidden;background:${Array.isArray(theme.background) ? theme.background[0] : theme.background}}
.pan{position:absolute;left:${-i * w}px;top:0;width:${total}px;height:${h}px;background:${bg}}
.pan>svg{position:absolute;left:0;top:0}
.t{position:absolute;left:${pad}px;right:${pad}px;top:${titleTop}px;color:${theme.text};font:${font.weight} ${fs}px/1.1 ${family};letter-spacing:-.01em;z-index:6;text-align:${center ? 'center' : 'left'}}
.p{position:absolute;left:${Math.round((w - pw) / 2)}px;top:${top}px;width:${pw}px;z-index:5;border-radius:${r + bezel}px ${r + bezel}px ${bleed ? 0 : r + bezel}px ${bleed ? 0 : r + bezel}px;padding:${bezel}px ${bezel}px ${bleed ? 0 : bezel}px;
  background:${theme.phone};box-shadow:0 ${Math.round(w * 0.03)}px ${Math.round(w * 0.09)}px rgba(0,0,0,.45)}
.p img{display:block;width:100%;border-radius:${r}px ${r}px ${bleed ? 0 : r}px ${bleed ? 0 : r}px}
</style><body>
<div class="pan"><svg width="${total}" height="${h}">${ellipses}${rings}${lineSvg}</svg>${borderHtml}</div>
${heroHtml}<div class="t">${title}</div>${phone}</body>`;
}

// The first picture of a row: brand, headline, big food or product shots, a badge. No phone.
function heroBlock(slot, { w, h, pad, dish }) {
  const logo = slot.logo ? at(slot.logo) : null;
  const brand = slot.brand
    ? `<div style="position:absolute;left:${pad}px;top:${Math.round(h * 0.05)}px;z-index:6;display:flex;align-items:center;gap:${w * 0.025}px;color:${theme.text};font:${font.weight} ${Math.round(w * 0.05)}px system-ui">${logo ? `<img src="${url(logo)}" style="width:${w * 0.1}px;${slot.logoMono ? 'filter:brightness(0) invert(1)' : ''}">` : ''}${esc(slot.brand)}</div>`
    : '';
  const images = (slot.images ?? []).map((it) => dish({ ...it, w: it.w }, 3)).join('');
  const badge = slot.badge
    ? `<div style="position:absolute;left:${pad}px;top:${Math.round(h * 0.84)}px;z-index:5;padding:${w * 0.026}px ${w * 0.05}px;border-radius:99px;background:${theme.accent};color:${theme.badgeText ?? (Array.isArray(theme.background) ? theme.background[0] : theme.background)};font:${font.weight} ${Math.round(w * 0.04)}px system-ui">${esc(slot.badge)}</div>`
    : '';
  return brand + images + badge;
}

// ---------------------------------------------------------------- rendering

const tmp = mkdtempSync(join(tmpdir(), 'store-shots-'));
process.on('exit', () => rmSync(tmp, { recursive: true, force: true }));

function shoot(html, out, w, h, name) {
  const file = join(tmp, name.replace(/[^\w.-]/g, '_') + '.html');
  writeFileSync(file, html);
  const r = spawnSync(CHROME, ['--headless=new', '--hide-scrollbars', '--force-device-scale-factor=1', '--allow-file-access-from-files', `--window-size=${w},${h}`, `--screenshot=${out}`, '--virtual-time-budget=3000', url(file)], { stdio: 'ignore' });
  return r.status === 0 && existsSync(out);
}

function flatten(png) {
  if (format !== 'jpeg') return png;
  const jpg = png.replace(/\.png$/, '.jpg');
  let ok = spawnSync('sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', '92', png, '--out', jpg], { stdio: 'ignore' }).status === 0;
  if (!ok) ok = spawnSync('magick', [png, '-background', 'white', '-alpha', 'remove', '-quality', '92', jpg], { stdio: 'ignore' }).status === 0;
  if (!ok) {
    console.error('format "jpeg" needs sips (macOS) or ImageMagick; kept the PNG');
    return png;
  }
  rmSync(png, { force: true });
  return jpg;
}

let failures = 0;
for (const [dev, spec] of Object.entries(devices)) {
  if (onlyDevice && dev !== onlyDevice) continue;
  const [w, h] = spec.size;
  const dir = join(outDir, dev);
  mkdirSync(dir, { recursive: true });
  const made = [];
  slots.forEach((slot, i) => {
    if (onlySlot && slot.name !== onlySlot) return;
    const hero = slot.kind === 'hero';
    const shotFile = hero ? null : at(join(spec.raw ?? dev, slot.file ?? `${slot.name}.png`));
    if (!hero && !existsSync(shotFile)) {
      console.error(`MISSING ${dev}/${slot.name}: ${shotFile}`);
      failures++;
      return;
    }
    const out = join(dir, `${slot.name}.png`);
    if (!shoot(pageHtml({ i, w, h, shot: shotFile, slot }), out, w, h, `${dev}-${slot.name}`)) {
      console.error(`FAIL ${dev}/${slot.name}: Chrome did not write the picture`);
      failures++;
      return;
    }
    const got = pngSize(out);
    if (!got || got[0] !== w || got[1] !== h) {
      console.error(`SIZE ${dev}/${slot.name}: ${got ? got.join('x') : '?'} but the device says ${w}x${h}`);
      failures++;
    }
    made.push(flatten(out));
    console.log(`ok   ${dev}/${basename(made.at(-1))}`);
  });
  // The whole row in one picture: how the background runs through, at a glance.
  if (!noPreview && !onlySlot && made.length === slots.length) {
    const cell = 300, ch = Math.round((cell * h) / w);
    const row = `<!doctype html><body style="margin:0;background:#000;display:flex">${made.map((f) => `<img src="${url(f)}" style="width:${cell}px;height:${ch}px">`).join('')}</body>`;
    const prev = join(outDir, `preview-${dev}.png`);
    if (shoot(row, prev, cell * made.length, ch, `preview-${dev}`)) console.log(`row  ${prev}`);
  }
}
process.exit(failures ? 1 : 0);
