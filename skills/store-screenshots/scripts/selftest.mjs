#!/usr/bin/env node
// Renders the demo into a temp folder and checks the contract: every picture exists at the device's exact size, the row
// preview is written, and a missing raw screenshot makes the run fail with a clear message. node selftest.mjs
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const demo = resolve(here, '../examples/demo');
const render = join(here, 'render.mjs');
const cfg = JSON.parse(readFileSync(join(demo, 'config.json'), 'utf8'));
const out = mkdtempSync(join(tmpdir(), 'ss-selftest-'));
const tmpCfg = join(demo, '.selftest-config.json');
let failed = 0;
const check = (ok, what) => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${what}`);
  if (!ok) failed++;
};
const pngSize = (f) => {
  const b = readFileSync(f);
  return [b.readUInt32BE(16), b.readUInt32BE(20)];
};

try {
  writeFileSync(tmpCfg, JSON.stringify({ ...cfg, out }));
  const run = spawnSync('node', [render, tmpCfg], { encoding: 'utf8' });
  check(run.status === 0, `render exits 0 (${(run.stderr || '').trim().split('\n').pop() || 'no errors'})`);
  for (const [dev, spec] of Object.entries(cfg.devices)) {
    for (const slot of cfg.slots) {
      const f = join(out, dev, `${slot.name}.png`);
      check(existsSync(f) && pngSize(f).join('x') === spec.size.join('x'), `${dev}/${slot.name} is ${spec.size.join('x')}`);
    }
    check(existsSync(join(out, `preview-${dev}.png`)), `preview row for ${dev}`);
  }
  // A slot whose raw screenshot does not exist fails the run and names the file.
  const broken = { ...cfg, out, slots: [...cfg.slots, { name: '99-missing', file: 'nope.png', title: ['x'] }] };
  writeFileSync(tmpCfg, JSON.stringify(broken));
  const bad = spawnSync('node', [render, tmpCfg, '--device', Object.keys(cfg.devices)[0], '--no-preview'], { encoding: 'utf8' });
  check(bad.status === 1 && /MISSING .*99-missing/.test(bad.stderr), 'a missing raw screenshot fails the run and says which');
} finally {
  rmSync(tmpCfg, { force: true });
  rmSync(out, { recursive: true, force: true });
}
console.log(failed ? `\n${failed} check(s) failed` : '\nall checks passed');
process.exit(failed ? 1 : 0);
