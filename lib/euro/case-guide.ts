// Step by step assembly guide for a case configuration. The steps follow the
// build notes of the hardware repo (mechanical/case). Each step also says what
// the 3D preview shows and highlights.

import {
  RAIL_SOCKETS, caseConfigToQuery, formatHardware, getCaseBom, getCaseHardware, getCaseLayout, getCaseOrder,
  normalizeCaseConfig,
  type CaseArrange, type CaseConfig, type CaseTag, type LayoutId,
} from './case';

export interface CaseStep {
  id: string;
  title: string;
  text: string;
  points?: string[];
  needs: string[];    // parts, hardware and tools used in this step
  show: CaseTag[];    // what the 3D preview shows at this step
  focus: CaseTag[];   // what it highlights
  arrange: CaseArrange;
}

const PRINTED: CaseTag[] = ['side', 'middle', 'rail', 'cover', 'cable-cover', 'bottom', 'stand', 'brace', 'cable-comb'];
const SPACERS: CaseTag[] = ['spacer-top', 'spacer-end', 'spacer-bottom', 'spacer-stand'];

const HAS_MIDDLE: LayoutId[] = ['double', 'double-tier', 'studio'];
const HAS_FUSED: LayoutId[] = ['quad', 'studio'];

const DOUBLE_ROW = [
  'Fit two rails to the left side panel with two M3 x 10 mm screws.',
  'Slide the middle frame onto the two free rail ends. They go into its closed sockets along their length and need no screws. The lip on the middle frame faces the right case.',
  'Put the other two rails into the right side of the middle frame, then close the row with the right side panel and two more screws.',
  'Do not force the rails to the back of the sockets. A small gap is meant to stay there.',
];

const FUSED_SET = [
  'Put four rails, two per row, into the fused left side panel along their length. Fix them with four M3 x 10 mm screws from outside.',
  'Slide the fused middle frame onto the four free rail ends. No screws there.',
  'Put the other four rails into the middle frame, then add the fused right side panel and its four screws.',
];

function bottomSockets(layout: LayoutId): string {
  switch (layout) {
    case 'single':
    case 'angled':
      return 'two in the bottom edge of every side panel';
    case 'double':
    case 'double-tier':
      return 'two in the bottom edge of every side panel and four under every middle frame';
    case 'quad':
      return 'four under each fused side panel and eight under the fused middle frame';
    case 'studio':
      return 'two under each side panel and four under the middle frame of the lower row, four under each fused side panel and eight under the fused middle frame';
  }
}

function railPoints(layout: LayoutId): { text: string; points?: string[] } {
  const single = 'Slide the rail ends into the notches in the top corners of the side panels, from the front and from the back. The hex sockets face up. Front and back rail are the same part. Fix every rail end with an M3 x 10 mm screw through the side panel wall, into the spacer in the rail end.';
  switch (layout) {
    case 'single':
      return { text: single };
    case 'angled':
      return { text: `${single} Build both cases this way.` };
    case 'double':
      return { text: 'The two cases share the middle frame, so build the row from left to right.', points: DOUBLE_ROW };
    case 'double-tier':
      return { text: 'The two cases of a row share a middle frame, so build each row from left to right. Do this twice.', points: DOUBLE_ROW };
    case 'quad':
      return { text: 'Both rows share the fused panels, so build the frame from left to right.', points: FUSED_SET };
    case 'studio':
      return {
        text: 'Build the lower row and the upper set as two separate frames, each from left to right.',
        points: [...DOUBLE_ROW.map(p => `Lower row: ${p}`), ...FUSED_SET.map(p => `Upper set: ${p}`)],
      };
  }
}

export function getCaseSteps(input: CaseConfig): CaseStep[] {
  const config = normalizeCaseConfig(input);
  const layout = getCaseLayout(config.layout);
  const bom = getCaseBom(config);
  const hardware = getCaseHardware(config);
  const prints = bom.reduce((sum, line) => sum + line.qty, 0);
  const railEnds = layout.rows * 4;
  const bottom = layout.cases * 4;
  const many = layout.cases > 1;
  const middle = HAS_MIDDLE.includes(layout.id);
  const fused = HAS_FUSED.includes(layout.id);
  const holders = config.cable ? layout.cableHolders : 0;
  const braces = layout.braces;
  const steps: CaseStep[] = [];

  // 1. Print
  const printPoints = ['Side panels print with the outer face down.'];
  if (middle) printPoints.push('The middle frame needs supports under its two down-facing rail sockets and under the channel on its underside. Keep supports out of the up-facing sockets and the hex pockets.');
  if (fused) printPoints.push('The fused panels only fit the bed diagonally, as supplied. Do not let the slicer turn them. The fused middle frame needs normal supports, not tree supports.');
  if (layout.tilted) printPoints.push('The stand plates only fit the bed diagonally, as supplied. A starting point for them is PETG, 0.2 mm layers, 6 walls and 40 to 50 % infill.');
  if (braces) printPoints.push('The top brace prints with its flat side down, without supports.');
  if (holders) printPoints.push('The cable holder cover prints with its outer face down and the comb with its top face down, both without supports. Use at least four walls for the comb.');
  printPoints.push('The 3D preview lays the parts out on 256 x 256 mm beds to show what there is to print. Your slicer may arrange them differently.');
  steps.push({
    id: 'print',
    title: 'Print the parts',
    text: `Print the ${prints} parts from the print list. Every STL file is already turned the way it should lie on the print bed, so keep that orientation and do not scale the parts. They all fit a 256 x 256 mm bed.`,
    points: printPoints,
    needs: bom.map(line => `${line.qty} x ${line.name}`),
    show: PRINTED,
    focus: [],
    arrange: 'beds',
  });

  // 2. Order the hardware
  const order = getCaseOrder(config);
  const count = (kind: 'spacer' | 'screw', length?: number) => order.find(line => line.kind === kind && line.length === length)?.qty ?? 0;
  const orderPoints = [
    `${count('spacer')} x M3 hex spacer (standoff): 10 mm long, female thread at both ends, 5.5 mm across the flats. Brass ones work well. The printed sockets are made for 5.5 mm, so check the width before you buy.`,
    `${count('screw', 10)} x M3 x 10 mm socket head screw, for the rail ends.`,
    `${count('screw', 6)} x M3 x 6 mm socket head screw, for the bottom ${many ? 'plates' : 'plate'}.`,
  ];
  if (count('screw', 8)) {
    const uses = [layout.tilted ? '16 for the stand plates' : '', braces ? `up to ${braces * 12} for the top ${braces > 1 ? 'braces' : 'brace'}` : ''].filter(Boolean);
    orderPoints.push(`${count('screw', 8)} x M3 x 8 mm socket head screw: ${uses.join(', ')}.`);
  }
  orderPoints.push(
    'For every module you mount: two more spacers and two more M3 x 6 mm screws. Count your modules and add them to the order.',
    'Socket head screws are also sold as hex socket cap screws (ISO 4762 or DIN 912). An M3 one has a head 5.5 mm wide and 3 mm high, which is what the printed recesses are made for.',
  );
  if (layout.tilted) orderPoints.push('4 x adhesive rubber foot, 12 x 12 mm, all the same thickness.');
  orderPoints.push('Superglue for the spacers, and a 2.5 mm hex key for all the screws.');
  steps.push({
    id: 'hardware',
    title: 'Order the M3 spacers and screws',
    text: 'The printed parts are held together by M3 spacers and screws, and they are all standard sizes. Order them while the parts print.',
    points: orderPoints,
    needs: [...order.map(formatHardware), '2.5 mm hex key'],
    show: [],
    focus: [],
    arrange: 'hardware',
  });

  // 3. Spacers
  const spacerPoints = [
    `Rail ends: ${railEnds} spacers, one in every rail end that meets an outer side panel.${middle || fused ? ' The rail ends that go into a middle frame need none.' : ''}`,
    `Bottom sockets: ${bottom} spacers, ${bottomSockets(layout.id)}.`,
    `Rail tops: one spacer for every module screw, two per module. Each rail has ${RAIL_SOCKETS} sockets, one every 2 HP. Only fill the ones you need.`,
  ];
  if (layout.tilted) {
    const where = layout.id === 'studio'
      ? 'four in each outer side panel of the lower row and four in the front half of each fused side panel'
      : 'four in each outer side panel';
    spacerPoints.push(`Stand plate sockets: 16 spacers, ${where}. Push them in from inside the case until they sit against the outer wall. A little glue keeps a loose one in place. Do this now: you cannot reach them once the modules are in.`);
  }
  steps.push({
    id: 'spacers',
    title: 'Glue in the M3 hex spacers',
    text: 'The case is held together by M3 x 10 mm female hex spacers (standoffs) that sit in printed hex sockets. Put a small drop of superglue in a socket, push the spacer in until it sits just below the surface, and let it cure. Keep the glue out of the thread.',
    points: spacerPoints,
    needs: [formatHardware(hardware[0]), 'Superglue'],
    show: ['side', 'middle', 'rail', ...SPACERS],
    focus: SPACERS,
    arrange: 'table',
  });

  // 4. Rails
  const rails = railPoints(layout.id);
  steps.push({
    id: 'rails',
    title: many ? 'Join the rails and the side panels' : 'Screw the rails to the side panels',
    text: rails.text,
    points: rails.points,
    needs: [`${layout.cases * 2} x Rail`, `${railEnds} x M3 x 10 mm socket head screw`, '2.5 mm hex key'],
    show: ['side', 'middle', 'rail', ...SPACERS, 'screw-rail'],
    focus: middle || fused ? ['rail', 'middle', 'screw-rail'] : ['rail', 'screw-rail'],
    arrange: 'built',
  });

  // 5. Covers
  const coverPoints: string[] = [];
  if (holders) coverPoints.push(`On the tilted ${holders > 1 ? 'cases' : 'case'}, the cable holder cover takes the place of the back cover: ribs to the inside, slots towards the bottom plate.`);
  if (fused) coverPoints.push(`${layout.id === 'studio' ? 'The upper set' : 'The set'} has no covers between its two rows: the front row only gets a front cover and the rear row only a back cover. The grooves between the rows stay empty.`);
  steps.push({
    id: 'covers',
    title: 'Slide in the covers',
    text: `Turn the frame upside down. Slide a cover into the front and the back groove${layout.id === 'quad' ? ' of the frame' : many ? ' of every case' : ''} from the open bottom, until its top edge sits in the groove under the rail.`,
    points: coverPoints.length ? coverPoints : undefined,
    needs: bom.filter(line => line.id.startsWith('cover-') || line.id === 'cable-holder-cover').map(line => `${line.qty} x ${line.name}`),
    show: ['side', 'middle', 'rail', ...SPACERS, 'screw-rail', 'cover', 'cable-cover'],
    focus: ['cover', 'cable-cover'],
    arrange: 'built',
  });

  // 6. Bottom plate
  steps.push({
    id: 'bottom',
    title: many ? 'Screw on the bottom plates' : 'Screw on the bottom plate',
    text: `With the frame still upside down, set ${many ? 'a bottom plate on every case' : 'the bottom plate on'}. The side panels drop into its sockets and the cover edges into its grooves. Fix ${many ? 'each plate' : 'it'} with four M3 x 6 mm screws from underneath, into the spacers in the side panels.`,
    points: [
      ...(middle || fused ? ['Two screws of each plate go into the middle frame. Seat a plate on both sides before you tighten it.'] : []),
      'The four holes in the middle of the plate are for the bus board that powers the modules.',
    ],
    needs: [`${layout.cases} x Bottom plate`, `${bottom} x M3 x 6 mm socket head screw`, '2.5 mm hex key'],
    show: ['side', 'middle', 'rail', ...SPACERS, 'screw-rail', 'cover', 'cable-cover', 'bottom', 'screw-bottom'],
    focus: ['bottom', 'screw-bottom'],
    arrange: 'built',
  });

  const built: CaseTag[] = ['side', 'middle', 'rail', ...SPACERS, 'screw-rail', 'cover', 'cable-cover', 'bottom', 'screw-bottom'];

  // 7. Stand
  if (layout.tilted) {
    const lower = layout.id === 'angled' ? 'case' : 'row';
    const upper = layout.id === 'studio' ? 'upper set' : layout.id === 'angled' ? 'second case' : 'second row';
    const standPoints = [
      'The recesses of a plate face the cases, the screw counterbores face out.',
      'Start all 16 M3 x 8 mm screws loosely, then tighten them evenly by hand. Stop if a plate rocks, a spacer spins or the plastic starts to crush.',
      `Stick on four rubber feet of the same thickness: one under the rear foot of each plate, one under each front corner of the lower ${lower}.`,
      'The stand is made for a desk. Do not carry the joined cases by the plates.',
    ];
    if (layout.id === 'studio') {
      standPoints.splice(1, 0, 'The upper rings of the plates take the front row of the upper set. Its rear row stands above it.');
      standPoints.push('Three rows tip back more easily than two. Keep the stand on a stable desk and do not lean on the top row.');
    }
    steps.push({
      id: 'stand',
      title: 'Bolt on the stand plates',
      text: `Put the lower ${lower} flat on the desk. Hold the ${upper} behind it at 60 degrees and support it: a single plate must not carry it alone. Then place one stand plate on each outer side.`,
      points: standPoints,
      needs: ['1 x Stand plate, left', '1 x Stand plate, right', '16 x M3 x 8 mm socket head screw', '4 x 12 x 12 mm adhesive rubber foot', '2.5 mm hex key'],
      show: [...built, 'stand', 'screw-stand'],
      focus: ['stand', 'screw-stand'],
      arrange: 'built',
    });
    built.push('stand', 'screw-stand');
  }

  // 8. Modules
  steps.push({
    id: 'modules',
    title: 'Mount the modules',
    text: `Turn the case upright. The first module of a row sits next to the 1 HP lip of the left side panel. Fix every module with two M3 x 6 mm screws into the spacers in the rails. The sockets are on a 2 HP grid.${layout.tilted ? ' Add modules and cables a few at a time, and check that the stand does not rock or slide.' : ''}`,
    needs: ['2 x M3 x 6 mm socket head screw per module', '2 x M3 x 10 mm hex spacer per module'],
    show: [...built, 'bus', 'modules'],
    focus: [],
    arrange: 'built',
  });
  built.push('bus', 'modules');

  // 9. Top brace
  if (braces) {
    steps.push({
      id: 'brace',
      title: braces > 1 ? 'Add the top braces' : 'Add the top brace',
      text: `Two cases side by side need a top brace: it ties them together across the middle frame. It goes on once all the modules are in. Take out the module screws under its four tabs, lower the brace straight down over the middle frame and fix it with M3 x 8 mm screws through the rail holes of the module panels.`,
      points: [
        'Use at least four screws per brace, and up to twelve where the panels under it have holes. Do not drill a panel.',
        'Every tab has to lie on a module panel. Fit a blank panel first where a slot is empty.',
        'The brace has to lie flat. If it rocks, do not pull it down with the screws.',
      ],
      needs: [`${braces} x Top brace`, `Up to ${braces * 12} x M3 x 8 mm socket head screw`],
      show: [...built, 'brace'],
      focus: ['brace'],
      arrange: 'built',
    });
    built.push('brace');
  }

  // 10. Cable comb
  if (holders) {
    steps.push({
      id: 'cable',
      title: holders > 1 ? 'Clip on the cable combs' : 'Clip on the cable comb',
      text: 'Hold the comb with its tip about 20 degrees higher than it will rest. Push both tongues into two neighbouring slots of the cable holder cover, then lower the tip. The hooks drop behind the cover. No screws.',
      points: ['To take it off, lift the tip and pull the comb out.', 'It is made for patch cables only.'],
      needs: [`${holders} x Cable holder comb`],
      show: [...built, 'cable-comb'],
      focus: ['cable-comb'],
      arrange: 'built',
    });
  }

  return steps;
}

// Plain text print list and build notes that go into the zip download.
export function casePrintList(input: CaseConfig, siteUrl: string): string {
  const config = normalizeCaseConfig(input);
  const layout = getCaseLayout(config.layout);
  const lines = [
    'Bread Modular - 3D printed Eurorack case',
    `${layout.name} (${layout.tagline.replace(' · ', ', ')})`,
    `${siteUrl}/case?${caseConfigToQuery(config)}`,
    '',
    'Print list',
    ...getCaseBom(config).map(line => `  ${line.qty} x ${line.file}${line.note ? `  (${line.note})` : ''}`),
    '',
    'Hardware',
    ...getCaseHardware(config).map(line => `  ${formatHardware(line)}  (${line.use})`),
    '',
    'Assembly',
    ...getCaseSteps(config).flatMap((step, i) => [
      '',
      `  ${i + 1}. ${step.title}`,
      `     ${step.text}`,
      ...(step.points ?? []).map(point => `     - ${point}`),
    ]),
  ];
  return lines.join('\n') + '\n';
}
