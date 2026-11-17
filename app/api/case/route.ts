import {
  CASE_COVERS, CASE_LAYOUTS,
  caseConfigToQuery, getCaseBom, getCaseHardware, getCaseSummary, parseCaseConfig,
} from '@/lib/euro/case';
import { getCaseSteps } from '@/lib/euro/case-guide';

// Print list, hardware and assembly steps for a case configuration, for AI agents and scripts.
// Example: /api/case?layout=double&front=honeycomb&back=solid
export async function GET(req: Request) {
  const url = new URL(req.url);
  const site = process.env.SITE_URL || url.origin;
  const config = parseCaseConfig(url.searchParams);
  const summary = getCaseSummary(config);

  return Response.json({
    name: 'Bread Modular 3D printed Eurorack case',
    config: { layout: config.layout, front: config.front, back: config.back, cable: config.cable },
    summary: {
      layout: summary.layout.name,
      description: summary.layout.description,
      cases: summary.layout.cases,
      hp: summary.layout.hp,
      partsToPrint: summary.prints,
      totalBytes: summary.bytes,
    },
    parts: getCaseBom(config).map(line => ({
      quantity: line.qty,
      name: line.name,
      file: line.file,
      url: `${site}${line.url}`,
      bytes: line.bytes,
      note: line.note,
    })),
    hardware: getCaseHardware(config).map(line => ({ quantity: line.qty ?? undefined, item: line.item, use: line.use })),
    assembly: getCaseSteps(config).map((step, i) => ({
      step: i + 1,
      title: step.title,
      text: step.text,
      notes: step.points,
      needs: step.needs,
    })),
    configurator: `${site}/eurorack-case?${caseConfigToQuery(config)}`,
    options: {
      layout: CASE_LAYOUTS.map(l => ({ id: l.id, name: l.name, cases: l.cases, hp: l.hp, topBraces: l.braces, cable: l.cableHolders > 0 })),
      front: CASE_COVERS.map(c => c.id),
      back: CASE_COVERS.map(c => c.id),
      cable: ['1'],
    },
  });
}
