// Exports the Eurorack front panel layouts (holes and labels) from the KiCad
// panel boards into lib/euro/panels.json, so the website draws the real panels.
//
//   node scripts/export-euro-panels.mjs <path to the Eurorack hardware repo>
//
// Panel frame: origin at the upper left corner seen from the front, mm.

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = process.argv[2];
if (!repo) {
  console.error('Usage: node scripts/export-euro-panels.mjs <path to the Eurorack hardware repo>');
  process.exit(1);
}

// website id -> [module folder, panel board]
const PANELS = {
  'power': ['usb-power', 'usb-power-panel'],
  'midi': ['midi', 'midi-panel'],
  'acid': ['acid', 'acid-panel'],
  'low': ['low', 'low-panel'],
  'hats': ['hats', 'hats-panel'],
  'ladder': ['ladder', 'ladder-panel'],
  'drive': ['drive', 'drive-panel'],
  'vca-mix': ['vca-mix', 'vca-mix-panel'],
  'env': ['env', 'env-panel'],
  'motion': ['motion', 'motion-panel'],
  'lfo': ['8bit', '8bit-lfo-panel'],
  '12bit': ['12bit', '12bit-panel'],
  '16bit': ['16bit', '16bit-panel'],
  '32bit': ['32bit', '32bit-panel'],
  '4mix': ['4mix', '4mix-panel'],
  'imix': ['imix', 'imix-panel'],
  'line-in': ['line-in', 'line-in-panel'],
  'usb-audio': ['usb-audio', 'usb-audio-panel'],
  'audio-out': ['audio-out', 'audio-out-panel'],
  'blank2': ['blank', 'blank-2hp'],
  'blank4': ['blank', 'blank-4hp'],
};

// 3.2 mm holes that take a screw instead of an LED (panel coordinates)
const EXTRA_SCREWS = { 'power': [[6.4, 22], [6.4, 106.5]], '4mix': [[25.33, 114], [65.97, 114]] };
// Labels on the boards that are not for the website
const SKIP_LABELS = /MODULAR$|^V\d+$/;

const HP = 5.08;
const PANEL_H = 128.5;

function parse(text) {
  const tokens = text.match(/"(?:[^"\\]|\\.)*"|[()]|[^\s()]+/g);
  let i = 0;
  const read = () => {
    const token = tokens[i++];
    if (token !== '(') return token.startsWith('"') ? JSON.parse(token) : token;
    const list = [];
    while (tokens[i] !== ')') list.push(read());
    i++;
    return list;
  };
  return read();
}

const all = (node, name) => node.filter(n => Array.isArray(n) && n[0] === name);
const one = (node, name) => all(node, name)[0];
const num = v => Math.round(parseFloat(v) * 1000) / 1000;
const round = v => Math.round(v * 1000) / 1000;

function exportPanel(id, [folder, board]) {
  const tree = parse(readFileSync(join(repo, 'modules', folder, 'panels/front-pcb', `${board}.kicad_pcb`), 'utf8'));
  const edges = ['gr_rect', 'gr_line', 'gr_arc'].flatMap(kind => all(tree, kind))
    .filter(item => one(item, 'layer')[1] === 'Edge.Cuts')
    .map(item => ['start', 'mid', 'end'].map(key => one(item, key)).filter(Boolean).map(p => [num(p[1]), num(p[2])]));
  const points = edges.flat();
  const x0 = Math.min(...points.map(p => p[0])), y0 = Math.min(...points.map(p => p[1]));
  const width = round(Math.max(...points.map(p => p[0])) - x0);

  const holes = [];
  for (const footprint of all(tree, 'footprint')) {
    const at = one(footprint, 'at');
    const x = round(num(at[1]) - x0), y = round(num(at[2]) - y0);
    for (const pad of all(footprint, 'pad')) {
      const drill = one(pad, 'drill');
      if (drill[1] === 'oval') {
        holes.push({ kind: 'usb', x, y, w: num(drill[2]), h: num(drill[3]) });
        continue;
      }
      const d = num(drill[1]);
      const onRail = Math.abs(y - 3) < 0.5 || Math.abs(y - (PANEL_H - 3)) < 0.5;
      const extra = (EXTRA_SCREWS[id] ?? []).some(([sx, sy]) => sx === x && sy === y);
      const kind = d >= 7 ? 'pot' : d >= 6 ? 'jack' : d >= 3.5 ? 'button' : onRail || extra ? 'screw' : 'led';
      holes.push({ kind, x, y });
    }
  }

  // An opening inside the outline (the USB-C port of the power module)
  const inner = edges.filter(edge => edge.every(([px, py]) => px > x0 && px < x0 + width && py > y0 && py < y0 + PANEL_H)).flat();
  if (inner.length) {
    const xs = inner.map(p => p[0] - x0), ys = inner.map(p => p[1] - y0);
    const w = round(Math.max(...xs) - Math.min(...xs)), h = round(Math.max(...ys) - Math.min(...ys));
    holes.push({ kind: 'usb', x: round(Math.min(...xs) + w / 2), y: round(Math.min(...ys) + h / 2), w, h });
  }

  // Sorted top to bottom, left to right; ids count per kind: j1, p1, l1, b1...
  holes.sort((a, b) => a.y - b.y || a.x - b.x);
  const counts = {};
  for (const hole of holes) {
    if (hole.kind === 'screw') continue;
    const letter = hole.kind === 'button' ? 'b' : hole.kind[0];
    counts[letter] = (counts[letter] ?? 0) + 1;
    hole.id = `${letter}${counts[letter]}`;
  }

  const labels = all(tree, 'gr_text')
    .filter(text => one(text, 'layer')[1] === 'F.SilkS' && !SKIP_LABELS.test(text[1]))
    .map(text => {
      const at = one(text, 'at');
      const size = one(one(text, 'effects'), 'font').find(n => Array.isArray(n) && n[0] === 'size');
      return { text: text[1], x: round(num(at[1]) - x0), y: round(num(at[2]) - y0), size: num(size[1]) };
    })
    .sort((a, b) => a.y - b.y || a.x - b.x);

  return { hp: Math.round(width / HP), width, holes, labels };
}

const panels = Object.fromEntries(Object.entries(PANELS).map(([id, source]) => [id, exportPanel(id, source)]));
const out = join(dirname(fileURLToPath(import.meta.url)), '../lib/euro/panels.json');
writeFileSync(out, JSON.stringify(panels).replace(/("[\w-]+":\{"hp")/g, '\n$1').replace(/\}$/, '\n}\n'));
for (const [id, panel] of Object.entries(panels)) {
  console.log(`${id}: ${panel.hp} HP, ${panel.holes.length} holes, ${panel.labels.length} labels`);
}
