// Draws a module front panel on a canvas: the 3D printed black panel, its
// holes, the pen lettering and the white and gold signal-flow lines.

import { PANEL_BLACK, PANEL_H, PEN_GOLD, PEN_WHITE, type EuroModule } from '@/lib/euro/modules';
import type { ArtLabel, Stroke } from '@/lib/euro/panel-art';

type Ctx = CanvasRenderingContext2D;

const HOLE_RADIUS = { jack: 3.1, pot: 3.6, led: 1.6, button: 2.1, screw: 1.6, usb: 0 };
const PEN_WIDTH = 0.44;

// Small repeatable random generator, so a panel looks the same on every draw.
function random(seed: string) {
  let a = 2166136261;
  for (let i = 0; i < seed.length; i++) a = Math.imul(a ^ seed.charCodeAt(i), 16777619);
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// A pen line is never perfectly straight: split the long runs and nudge the points.
function penPoints(pts: number[], rand: () => number): number[] {
  const out: number[] = [pts[0], pts[1]];
  for (let i = 2; i < pts.length; i += 2) {
    const x0 = pts[i - 2], y0 = pts[i - 1], x1 = pts[i], y1 = pts[i + 1];
    const length = Math.hypot(x1 - x0, y1 - y0);
    const steps = Math.max(1, Math.round(length / 6));
    for (let s = 1; s <= steps; s++) {
      const t = s / steps;
      const wobble = s < steps ? (rand() - 0.5) * 0.24 : 0;
      out.push(x0 + (x1 - x0) * t - ((y1 - y0) / length) * wobble, y0 + (y1 - y0) * t + ((x1 - x0) / length) * wobble);
    }
  }
  return out;
}

// Catmull-Rom curve through the points
function curvePoints(pts: number[]): number[] {
  const p = (i: number) => {
    const k = Math.min(Math.max(i, 0), pts.length / 2 - 1) * 2;
    return [pts[k], pts[k + 1]];
  };
  const out: number[] = [];
  for (let i = 0; i < pts.length / 2 - 1; i++) {
    const [a, b, c, d] = [p(i - 1), p(i), p(i + 1), p(i + 2)];
    for (let s = 0; s < 10; s++) {
      const t = s / 10, t2 = t * t, t3 = t2 * t;
      for (const k of [0, 1]) {
        out.push(0.5 * (2 * b[k] + (c[k] - a[k]) * t + (2 * a[k] - 5 * b[k] + 4 * c[k] - d[k]) * t2 + (3 * b[k] - a[k] - 3 * c[k] + d[k]) * t3));
      }
    }
  }
  out.push(pts[pts.length - 2], pts[pts.length - 1]);
  return out;
}

function drawStroke(ctx: Ctx, stroke: Stroke, rand: () => number) {
  const pts = stroke.smooth ? curvePoints(stroke.pts) : penPoints(stroke.pts, rand);
  ctx.strokeStyle = stroke.gold ? PEN_GOLD : PEN_WHITE;
  ctx.lineWidth = PEN_WIDTH;
  ctx.beginPath();
  ctx.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
  ctx.stroke();

  if (stroke.arrow) {
    const n = stroke.pts.length;
    const x = stroke.pts[n - 2], y = stroke.pts[n - 1];
    const angle = Math.atan2(y - stroke.pts[n - 3], x - stroke.pts[n - 4]);
    ctx.beginPath();
    for (const side of [-1, 1]) {
      const a = angle + Math.PI + side * (0.5 + (rand() - 0.5) * 0.08);
      const length = 1.55 + (rand() - 0.5) * 0.2;
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(a) * length, y + Math.sin(a) * length);
    }
    ctx.stroke();
  }
}

// Labels are sized by the height of their capitals, in mm.
function capHeight(size: number) {
  return size < 2 ? size * 1.55 : size * 1.25;
}

function drawLabel(ctx: Ctx, label: ArtLabel, font: string, capRatio: number) {
  const cap = capHeight(label.size);
  ctx.save();
  ctx.translate(label.x, label.y);
  if (label.turn) ctx.rotate(-Math.PI / 2);
  ctx.font = `${cap / capRatio}px ${font}`;
  ctx.fillStyle = ctx.strokeStyle = label.gold ? PEN_GOLD : PEN_WHITE;
  ctx.lineWidth = cap * 0.05;
  ctx.strokeText(label.text, 0, cap / 2);
  ctx.fillText(label.text, 0, cap / 2);
  ctx.restore();
}

function measureCapRatio(ctx: Ctx, font: string) {
  ctx.font = `100px ${font}`;
  const ascent = ctx.measureText('H').actualBoundingBoxAscent;
  return ascent > 10 ? ascent / 100 : 0.7;
}

export function drawPanel(module: EuroModule, font: string, pxPerMm: number): HTMLCanvasElement {
  const { width } = module;
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(width * pxPerMm);
  canvas.height = Math.round(PANEL_H * pxPerMm);
  const ctx = canvas.getContext('2d')!;
  ctx.scale(canvas.width / width, canvas.height / PANEL_H);
  const rand = random(module.id);

  // Printed surface: black with the fine grain of a textured print bed
  ctx.fillStyle = PANEL_BLACK;
  ctx.fillRect(0, 0, width, PANEL_H);
  for (let i = 0; i < width * PANEL_H * 2.2; i++) {
    const light = rand() > 0.45;
    ctx.fillStyle = light ? `rgba(255,255,255,${0.02 + rand() * 0.045})` : `rgba(0,0,0,${0.15 + rand() * 0.25})`;
    const size = 0.12 + rand() * 0.22;
    ctx.fillRect(rand() * width, rand() * PANEL_H, size, size);
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.07)';
  ctx.lineWidth = 0.3;
  ctx.strokeRect(0.15, 0.15, width - 0.3, PANEL_H - 0.3);

  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.textAlign = 'center';
  for (const stroke of module.strokes) drawStroke(ctx, stroke, rand);
  const capRatio = measureCapRatio(ctx, font);
  for (const label of module.labels) drawLabel(ctx, label, font, capRatio);

  for (const hole of module.holes) {
    if (hole.kind === 'usb') {
      const w = hole.w!, h = hole.h!;
      ctx.fillStyle = '#050505';
      ctx.beginPath();
      ctx.roundRect(hole.x - w / 2, hole.y - h / 2, w, h, Math.min(w, h) / 2.2);
      ctx.fill();
      // The USB-C shell and its tongue
      const long = Math.max(w, h) - 1.1, short = Math.min(w, h) - 1.3;
      const [sw, sh] = w > h ? [long, short] : [short, long];
      ctx.strokeStyle = '#9da0a4';
      ctx.lineWidth = 0.42;
      ctx.beginPath();
      ctx.roundRect(hole.x - sw / 2, hole.y - sh / 2, sw, sh, short / 2);
      ctx.stroke();
      ctx.strokeStyle = '#3b3b3b';
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      if (w > h) { ctx.moveTo(hole.x - sw / 2 + 1.5, hole.y); ctx.lineTo(hole.x + sw / 2 - 1.5, hole.y); }
      else { ctx.moveTo(hole.x, hole.y - sh / 2 + 1.5); ctx.lineTo(hole.x, hole.y + sh / 2 - 1.5); }
      ctx.stroke();
      continue;
    }
    ctx.fillStyle = '#040404';
    ctx.beginPath();
    ctx.arc(hole.x, hole.y, HOLE_RADIUS[hole.kind], 0, Math.PI * 2);
    ctx.fill();
  }
  return canvas;
}
