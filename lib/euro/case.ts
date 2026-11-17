// 3D printed Eurorack case: options, print files and the rules that turn a
// configuration into a print list. Shared by the configurator, the JSON API
// and the Markdown page, so people and agents get the same answer.

export const STL_BASE = '/case/stl';

export type LayoutId = 'single' | 'double' | 'angled' | 'double-tier' | 'quad' | 'studio';
export type CoverId = 'solid' | 'grill' | 'honeycomb' | 'diamonds' | 'louvres' | 'perforated';
export type ColorId = 'black' | 'graphite' | 'white' | 'orange' | 'blue' | 'green';

export interface CaseConfig {
  layout: LayoutId;
  front: CoverId;
  back: CoverId;
  cable: boolean;
  color: ColorId;
}

// What the 3D preview can show or highlight on its own: printed parts by role,
// the hardware, and the modules.
export type CaseTag =
  | 'side' | 'middle' | 'rail' | 'cover' | 'bottom' | 'stand' | 'brace' | 'cable-cover' | 'cable-comb'
  | 'spacer-top' | 'spacer-end' | 'spacer-bottom' | 'spacer-stand'
  | 'screw-rail' | 'screw-bottom' | 'screw-stand'
  | 'bus' | 'modules';

// How the 3D preview lays the parts out: the built case, the printed parts on
// print beds, parts on the table before they are joined, or the hardware to order.
export type CaseArrange = 'built' | 'beds' | 'table' | 'hardware';

export interface CaseLayout {
  id: LayoutId;
  name: string;
  tagline: string;
  description: string;
  cases: number;
  hp: number;
  rows: number;         // rail rows: a row is one or two cases wide
  tilted: boolean;      // has a row at 60 degrees on the stand plates
  braces: number;       // top braces it needs: one over every middle frame, wherever two cases sit side by side
  covers: number;       // front covers, and as many back covers: the two rows of a fused set have none between them
  cableHolders: number; // cable holders it can take (0 = not available)
}

export const CASE_LAYOUTS: CaseLayout[] = [
  {
    id: 'single', name: 'Single', tagline: '1 case · 42 HP',
    description: 'One 42 HP skiff. Two side panels, two rails, a bottom plate and two slide-in covers.',
    cases: 1, hp: 42, rows: 1, tilted: false, braces: 0, covers: 1, cableHolders: 0,
  },
  {
    id: 'double', name: 'Double', tagline: '2 cases · 84 HP',
    description: 'Two cases side by side. One shared middle frame replaces the two inner side panels.',
    cases: 2, hp: 84, rows: 1, tilted: false, braces: 1, covers: 2, cableHolders: 0,
  },
  {
    id: 'angled', name: 'Two tier', tagline: '2 cases · 84 HP',
    description: 'One case flat and one behind it at 60 degrees, held by two bolt-on stand plates.',
    cases: 2, hp: 84, rows: 2, tilted: true, braces: 0, covers: 2, cableHolders: 1,
  },
  {
    id: 'double-tier', name: 'Double two tier', tagline: '4 cases · 168 HP',
    description: 'Two Double cases on the stand plates: one flat on the desk and one behind it at 60 degrees.',
    cases: 4, hp: 168, rows: 2, tilted: true, braces: 2, covers: 4, cableHolders: 2,
  },
  {
    id: 'quad', name: 'Quad', tagline: '4 cases · 168 HP',
    description: 'Four cases, two by two in one plane. The side panels and the middle frame are fused end to end, and the inside is open from the front row to the rear row.',
    cases: 4, hp: 168, rows: 2, tilted: false, braces: 2, covers: 2, cableHolders: 0,
  },
  {
    id: 'studio', name: 'Studio', tagline: '6 cases · 252 HP',
    description: 'A double row flat on the desk with a quad set behind it at 60 degrees, on the stand plates.',
    cases: 6, hp: 252, rows: 3, tilted: true, braces: 3, covers: 4, cableHolders: 2,
  },
];

export const CASE_COVERS: { id: CoverId; name: string }[] = [
  { id: 'solid', name: 'Solid' },
  { id: 'grill', name: 'Grill' },
  { id: 'honeycomb', name: 'Honeycomb' },
  { id: 'diamonds', name: 'Diamonds' },
  { id: 'louvres', name: 'Louvres' },
  { id: 'perforated', name: 'Perforated' },
];

// Preview colours only: the files are the same whatever filament you print.
export const CASE_COLORS: { id: ColorId; name: string; hex: string }[] = [
  { id: 'black', name: 'Black', hex: '#1b1b1d' },
  { id: 'graphite', name: 'Graphite', hex: '#5b5f66' },
  { id: 'white', name: 'White', hex: '#eceae4' },
  { id: 'orange', name: 'Orange', hex: '#e8702a' },
  { id: 'blue', name: 'Blue', hex: '#2f6fde' },
  { id: 'green', name: 'Green', hex: '#3f8f5b' },
];

export const DEFAULT_CASE_CONFIG: CaseConfig = {
  layout: 'single',
  front: 'honeycomb',
  back: 'solid',
  cable: false,
  color: 'black',
};

interface PartFile {
  name: string;
  bytes: number;
}

const PARTS = {
  'side-panel-left': { name: 'Side panel, left', bytes: 177084 },
  'side-panel-right': { name: 'Side panel, right', bytes: 163484 },
  'rail': { name: 'Rail', bytes: 577984 },
  'bottom-plate': { name: 'Bottom plate', bytes: 415884 },
  'cover-solid': { name: 'Cover, solid', bytes: 1484 },
  'cover-grill': { name: 'Cover, grill', bytes: 852884 },
  'cover-honeycomb': { name: 'Cover, honeycomb', bytes: 144284 },
  'cover-diamonds': { name: 'Cover, diamonds', bytes: 118484 },
  'cover-louvres': { name: 'Cover, louvres', bytes: 33484 },
  'cover-perforated': { name: 'Cover, perforated', bytes: 3633684 },
  'middle-frame': { name: 'Middle frame', bytes: 109984 },
  'fused-side-left': { name: 'Fused side panel, left', bytes: 354284 },
  'fused-side-right': { name: 'Fused side panel, right', bytes: 326284 },
  'fused-middle': { name: 'Fused middle frame', bytes: 192584 },
  'joiner-left': { name: 'Stand plate, left', bytes: 585784 },
  'joiner-right': { name: 'Stand plate, right', bytes: 585784 },
  'top-brace-6hp': { name: 'Top brace', bytes: 2883084 },
  'cable-holder-cover': { name: 'Cable holder cover', bytes: 17484 },
  'cable-holder-comb-60': { name: 'Cable holder comb', bytes: 251884 },
} satisfies Record<string, PartFile>;

export type PartId = keyof typeof PARTS;

export interface BomLine {
  id: PartId;
  name: string;
  qty: number;
  file: string;   // file name, e.g. rail.stl
  url: string;    // path on this site
  bytes: number;
  note?: string;
}

export function getCaseLayout(id: LayoutId): CaseLayout {
  return CASE_LAYOUTS.find(l => l.id === id) ?? CASE_LAYOUTS[0];
}

function pick<T extends string>(value: string | null | undefined, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

// Builds a valid configuration from query parameters. Unknown values fall back
// to the defaults, and extras a layout can't take are switched off. The top
// brace is not an option: a layout with cases side by side always has it.
export function parseCaseConfig(params: URLSearchParams): CaseConfig {
  const d = DEFAULT_CASE_CONFIG;
  const config: CaseConfig = {
    layout: pick(params.get('layout'), CASE_LAYOUTS.map(l => l.id), d.layout),
    front: pick(params.get('front'), CASE_COVERS.map(c => c.id), d.front),
    back: pick(params.get('back'), CASE_COVERS.map(c => c.id), d.back),
    cable: params.get('cable') === '1',
    color: pick(params.get('color'), CASE_COLORS.map(c => c.id), d.color),
  };
  return normalizeCaseConfig(config);
}

export function normalizeCaseConfig(config: CaseConfig): CaseConfig {
  const layout = getCaseLayout(config.layout);
  return {
    ...config,
    cable: config.cable && layout.cableHolders > 0,
  };
}

export function caseConfigToQuery(config: CaseConfig): string {
  const params = new URLSearchParams({ layout: config.layout, front: config.front, back: config.back });
  if (config.cable) params.set('cable', '1');
  if (config.color !== DEFAULT_CASE_CONFIG.color) params.set('color', config.color);
  return params.toString();
}

export function getCaseBom(input: CaseConfig): BomLine[] {
  const config = normalizeCaseConfig(input);
  const layout = getCaseLayout(config.layout);
  const qty = new Map<PartId, number>();
  const notes = new Map<PartId, string>();
  const add = (id: PartId, n: number, note?: string) => {
    if (n <= 0) return;
    qty.set(id, (qty.get(id) ?? 0) + n);
    if (note) notes.set(id, note);
  };

  // Panels that hold the rails
  if (config.layout === 'single') {
    add('side-panel-left', 1);
    add('side-panel-right', 1);
  } else if (config.layout === 'double') {
    add('side-panel-left', 1);
    add('side-panel-right', 1);
    add('middle-frame', 1, 'Replaces the two inner side panels');
  } else if (config.layout === 'angled') {
    add('side-panel-left', 2);
    add('side-panel-right', 2);
  } else if (config.layout === 'double-tier') {
    add('side-panel-left', 2);
    add('side-panel-right', 2);
    add('middle-frame', 2, 'One per row. Replaces the two inner side panels');
  } else if (config.layout === 'quad') {
    add('fused-side-left', 1, 'Two left side panels in one piece');
    add('fused-side-right', 1, 'Two right side panels in one piece');
    add('fused-middle', 1, 'Two middle frames in one piece');
  } else {
    add('side-panel-left', 1, 'Lower row');
    add('side-panel-right', 1, 'Lower row');
    add('middle-frame', 1, 'Lower row');
    add('fused-side-left', 1, 'Upper set');
    add('fused-side-right', 1, 'Upper set');
    add('fused-middle', 1, 'Upper set');
  }

  add('rail', layout.cases * 2, 'Front and back rail are the same part');
  add('bottom-plate', layout.cases);

  const holders = config.cable ? layout.cableHolders : 0;
  add(`cover-${config.front}`, layout.covers);
  add(`cover-${config.back}`, layout.covers - holders);

  if (layout.tilted) {
    add('joiner-left', 1);
    add('joiner-right', 1);
  }
  add('top-brace-6hp', layout.braces, 'Required. Goes on top of the modules, across the middle frame');
  if (holders) {
    add('cable-holder-cover', holders, 'Replaces the back cover of the top row');
    add('cable-holder-comb-60', holders, 'Clips into the cover, no screws');
  }

  return [...qty.entries()].map(([id, n]) => ({
    id,
    name: PARTS[id].name,
    qty: n,
    file: `${id}.stl`,
    url: `${STL_BASE}/${id}.stl`,
    bytes: PARTS[id].bytes,
    note: notes.get(id),
  }));
}

export interface HardwareLine {
  qty: number | null;   // null: as many as you need
  item: string;
  use: string;
  kind: 'spacer' | 'screw' | 'foot' | 'glue';
  label: string;        // short name and what to look for, for the 3D preview
  detail: string;
  length?: number;      // screws: mm under the head
}

export const RAIL_SOCKETS = 21;   // module screw positions per rail, one every 2 HP

// Bottom plates that stand on the desk: on a tilted layout only the lower row does.
export function groundPlates(layout: CaseLayout): number {
  if (!layout.tilted) return layout.cases;
  return layout.id === 'angled' ? 1 : 2;
}

// Screws, spacers and feet for a configuration. The counts follow the case
// generator of the hardware repo: a rail end is only screwed at an outer side
// panel, and every case has four bottom screws.
export function getCaseHardware(input: CaseConfig): HardwareLine[] {
  const config = normalizeCaseConfig(input);
  const layout = getCaseLayout(config.layout);
  const railEnds = layout.rows * 4;
  const bottom = layout.cases * 4;
  const stand = layout.tilted ? 16 : 0;
  const braces = layout.braces;
  const plates = groundPlates(layout);

  const lines: HardwareLine[] = [
    {
      qty: railEnds + bottom + stand,
      item: 'M3 x 10 mm female hex spacer (standoff), 5.5 mm across flats',
      use: [
        `${railEnds} in the rail ends`,
        `${bottom} in the bottom sockets`,
        stand ? `${stand} in the stand plate sockets` : '',
      ].filter(Boolean).join(', ') + '.',
      kind: 'spacer', label: 'M3x10 spacer', detail: 'Hex, 5.5 mm wide',
    },
    {
      // One screw size for the whole case keeps the order simple
      qty: railEnds + bottom + stand + braces * 12,
      item: 'M3 x 8 mm screw',
      use: [
        `${railEnds} for the rail ends`,
        `${bottom} for the bottom plates`,
        stand ? `${stand} for the stand plates` : '',
        braces ? `up to ${braces * 12} for the top ${braces > 1 ? 'braces' : 'brace'}` : '',
      ].filter(Boolean).join(', ') + '.',
      kind: 'screw', label: 'M3x8 screw', detail: 'Any head', length: 8,
    },
    {
      qty: null,
      item: 'M3 hex standoff with a male thread',
      use: 'In the rail sockets where your modules go. Get enough for your modules.',
      kind: 'spacer', label: 'M3 male standoff', detail: 'For the modules',
    },
    {
      qty: plates * 4 + (stand ? 2 : 0),
      item: '3M adhesive rubber foot, 12 x 12 mm',
      use: `Four under every bottom plate that stands on the desk${stand ? ', and one under the rear of each stand plate' : ''}. All the same thickness.`,
      kind: 'foot', label: '3M rubber foot', detail: '12 x 12 mm, adhesive',
    },
  ];
  lines.push({ qty: null, item: 'Superglue', use: 'Holds the spacers in their sockets.', kind: 'glue', label: 'Superglue', detail: '' });
  return lines;
}

// What to order: the hardware list, with the same item counted once.
export function getCaseOrder(input: CaseConfig): HardwareLine[] {
  const order: HardwareLine[] = [];
  for (const line of getCaseHardware(input)) {
    const same = order.find(o => o.item === line.item);
    if (same && same.qty !== null && line.qty !== null) same.qty += line.qty;
    else order.push({ ...line });
  }
  return order;
}

export function formatHardware(line: HardwareLine): string {
  return `${line.qty === null ? '' : `${line.qty} x `}${line.item}`;
}

export function getCaseSummary(input: CaseConfig) {
  const config = normalizeCaseConfig(input);
  const layout = getCaseLayout(config.layout);
  const bom = getCaseBom(config);
  return {
    layout,
    files: bom.length,
    prints: bom.reduce((sum, line) => sum + line.qty, 0),
    bytes: bom.reduce((sum, line) => sum + line.bytes, 0),
  };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export const CASE_FACTS = [
  '42 HP of 3U Eurorack per case',
  'Skiff format: 249 x 132.5 mm footprint, 60 mm side panels',
  'Every part fits a 256 x 256 mm print bed',
  'Slide-in front and back covers in six patterns',
];
