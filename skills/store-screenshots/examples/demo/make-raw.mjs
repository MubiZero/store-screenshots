// Draws three screens of a made-up coffee app ("Brew") as raw screenshots at each device's size, so the demo needs no
// real app: node make-raw.mjs
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const CHROME = process.env.CHROME || ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/chromium'].find(existsSync);
const devices = { 'iphone-6.9': [1320, 2868], 'play-phone': [1080, 2160] };
const css = (w) => `*{margin:0;box-sizing:border-box}body{width:${w}px;font-family:system-ui,-apple-system,sans-serif;background:#faf6f0;color:#2b1a12}
.h{padding:${w * 0.07}px ${w * 0.06}px ${w * 0.03}px;font-size:${w * 0.085}px;font-weight:800}
.row{display:flex;align-items:center;gap:${w * 0.04}px;margin:${w * 0.025}px ${w * 0.05}px;padding:${w * 0.035}px;background:#fff;border-radius:${w * 0.04}px}
.e{font-size:${w * 0.12}px}.n{font-size:${w * 0.048}px;font-weight:700}.s{font-size:${w * 0.036}px;color:#8a7468}.pr{margin-left:auto;font-size:${w * 0.046}px;font-weight:800}
.btn{margin:${w * 0.05}px;padding:${w * 0.045}px;border-radius:99px;background:#6b3f26;color:#fff;text-align:center;font-size:${w * 0.048}px;font-weight:800}
.big{font-size:${w * 0.42}px;text-align:center;padding-top:${w * 0.08}px}.step{display:flex;gap:${w * 0.04}px;margin:${w * 0.035}px ${w * 0.07}px;font-size:${w * 0.048}px}.dot{width:${w * 0.05}px;height:${w * 0.05}px;border-radius:50%;background:#6b3f26;margin-top:${w * 0.01}px}.off{background:#d8cdc4}`;
const items = [['☕', 'Flat white', 'Double shot, oat milk', '4.50'], ['🥐', 'Butter croissant', 'Baked this morning', '3.20'], ['🍵', 'Matcha latte', 'Ceremonial grade', '5.10'], ['🧁', 'Lemon muffin', 'With poppy seeds', '3.60']];
const screens = {
  '01-menu': (w) => `<div class="h">Brew</div>${items.map(([e, n, s, p]) => `<div class="row"><div class="e">${e}</div><div><div class="n">${n}</div><div class="s">${s}</div></div><div class="pr">${p}</div></div>`).join('')}<div class="btn">Order 2 items · 7.70</div>`,
  '02-drink': (w) => `<div class="big">☕</div><div class="h" style="padding-top:${w * 0.03}px">Flat white</div><div class="s" style="padding:0 ${w * 0.06}px;font-size:${w * 0.045}px">Double shot of espresso with silky oat milk.</div><div class="row"><div class="n">Size</div><div class="pr">S · M · L</div></div><div class="row"><div class="n">Milk</div><div class="pr">Oat</div></div><div class="btn">Add · 4.50</div>`,
  '03-order': (w) => `<div class="h">Order #214</div><div class="h" style="font-size:${w * 0.06}px;color:#6b3f26;padding-top:0">Ready in about 4 minutes</div>${['Received', 'Brewing', 'Ready at the counter', 'Picked up'].map((t, i) => `<div class="step"><div class="dot ${i > 1 ? 'off' : ''}"></div><div>${t}</div></div>`).join('')}`,
};
for (const [dev, [w, h]] of Object.entries(devices)) {
  const dir = join(here, 'raw', dev);
  mkdirSync(dir, { recursive: true });
  for (const [name, body] of Object.entries(screens)) {
    const html = join(here, `.${dev}-${name}.html`);
    writeFileSync(html, `<!doctype html><meta charset="utf-8"><style>${css(w)}</style><body>${body(w)}</body>`);
    const out = join(dir, `${name}.png`);
    spawnSync(CHROME, ['--headless=new', '--hide-scrollbars', '--force-device-scale-factor=1', `--window-size=${w},${h}`, `--screenshot=${out}`, pathToFileURL(html).href], { stdio: 'ignore' });
    console.log(existsSync(out) ? 'ok' : 'FAIL', dev, name);
  }
}
