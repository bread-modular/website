// Eurorack front panels as they are drawn on the website. The hole positions
// and labels come from the real panel boards (panels.json, written by
// scripts/export-euro-panels.mjs); the pen drawings are in panel-art.ts.

import panelData from './panels.json';
import { PANEL_ART, type ArtLabel, type Stroke } from './panel-art';

export const HP = 5.08;        // mm per HP
export const PANEL_H = 128.5;  // 3U panel height in mm

export const PEN_WHITE = '#efece4';
export const PEN_GOLD = '#b8944a';
export const PANEL_BLACK = '#121212';

export type HoleKind = 'jack' | 'pot' | 'led' | 'button' | 'usb' | 'screw';

export interface Hole {
  kind: HoleKind;
  x: number;
  y: number;
  id?: string;   // j1, p1, l1, b1, u1: top to bottom, left to right
  w?: number;    // USB opening
  h?: number;
}

export interface EuroModule {
  id: string;
  hp: number;
  width: number;   // panel width in mm, a little under hp x 5.08
  holes: Hole[];
  labels: ArtLabel[];
  strokes: Stroke[];
  big: string[];
}

interface PanelExport {
  hp: number;
  width: number;
  holes: Hole[];
  labels: ArtLabel[];
}

const PANELS = panelData as unknown as Record<string, PanelExport>;

export function getEuroModule(id: string): EuroModule {
  const panel = PANELS[id];
  if (!panel) throw new Error(`Unknown module: ${id}`);
  const art = PANEL_ART[id];
  return {
    id,
    hp: panel.hp,
    width: panel.width,
    holes: panel.holes,
    labels: [...panel.labels, ...(art?.labels ?? [])],
    strokes: art?.strokes ?? [],
    big: art?.big ?? [],
  };
}

export interface RackSlot {
  module: EuroModule;
  x: number;   // left edge of the panel in the row, mm
}

export function layoutRack(ids: string[]): RackSlot[] {
  let hp = 0;
  return ids.map(id => {
    const mod = getEuroModule(id);
    const slot = { module: mod, x: hp * HP + (mod.hp * HP - mod.width) / 2 };
    hp += mod.hp;
    return slot;
  });
}

// Position of a jack in row coordinates, e.g. findJack(slots, 'acid.j4').
export function findJack(slots: RackSlot[], ref: string): { x: number; y: number } {
  const [moduleId, jackId] = ref.split('.');
  const slot = slots.find(s => s.module.id === moduleId);
  const hole = slot?.module.holes.find(h => h.id === jackId);
  if (!slot || !hole) throw new Error(`Unknown jack: ${ref}`);
  return { x: slot.x + hole.x, y: hole.y };
}

// 42 HP rows used for the home page animation and the case preview.
export const RACKS: string[][] = [
  ['power', 'midi', 'acid', 'ladder', 'hats', 'vca-mix', 'audio-out', 'blank2'],
  ['16bit', 'low', 'drive', 'env', 'motion', 'lfo', 'usb-audio'],
  ['4mix', '32bit', '12bit', 'imix', 'line-in', 'blank2'],
];

// Patches for the first row, played one after the other on the home page.
export const PATCHES: [string, string][][] = [
  [
    ['midi.j2', 'acid.j1'],
    ['midi.j3', 'hats.j1'],
    ['acid.j4', 'ladder.j1'],
    ['acid.j7', 'ladder.j3'],
    ['ladder.j4', 'vca-mix.j1'],
    ['hats.j3', 'vca-mix.j4'],
    ['vca-mix.j10', 'audio-out.j1'],
  ],
  [
    ['midi.j2', 'acid.j1'],
    ['midi.j4', 'hats.j1'],
    ['acid.j6', 'vca-mix.j1'],
    ['acid.j7', 'vca-mix.j2'],
    ['vca-mix.j3', 'ladder.j1'],
    ['hats.j4', 'ladder.j2'],
    ['ladder.j4', 'audio-out.j1'],
    ['hats.j3', 'audio-out.j2'],
  ],
  [
    ['midi.j5', 'acid.j1'],
    ['midi.j6', 'hats.j1'],
    ['acid.j5', 'ladder.j1'],
    ['hats.j4', 'ladder.j3'],
    ['ladder.j4', 'vca-mix.j4'],
    ['acid.j4', 'vca-mix.j1'],
    ['acid.j7', 'vca-mix.j5'],
    ['hats.j3', 'vca-mix.j7'],
    ['vca-mix.j10', 'audio-out.j1'],
  ],
];

export const CABLE_COLORS = ['#f0569a', '#8457d6', '#35b25b', '#3d93f2', '#f28a1e', '#f2cf1d', '#e9453b', '#7a4a2b'];
