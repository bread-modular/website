import type { LayoutId } from '@/lib/euro/case';

// Small plan of a case layout, seen from the front edge of the desk. Rows on
// the stand (tilted at 60 degrees) are drawn shorter and shaded.
const ROWS: Record<LayoutId, { cases: number; tilted: boolean }[]> = {
  single: [{ cases: 1, tilted: false }],
  double: [{ cases: 2, tilted: false }],
  angled: [{ cases: 1, tilted: true }, { cases: 1, tilted: false }],
  'double-tier': [{ cases: 2, tilted: true }, { cases: 2, tilted: false }],
  quad: [{ cases: 2, tilted: false }, { cases: 2, tilted: false }],
  studio: [{ cases: 2, tilted: true }, { cases: 2, tilted: true }, { cases: 2, tilted: false }],
};

interface Props {
  id: LayoutId;
  className?: string;
}

export default function LayoutIcon({ id, className }: Props) {
  const rows = ROWS[id];
  const height = (tilted: boolean) => (tilted ? 6 : 11);
  // Top edge of every row, with the stack centred in the icon
  const tops = rows.map((_, r) => rows.slice(0, r).reduce((sum, row) => sum + height(row.tilted) + 2, 0));
  const start = (40 - tops[rows.length - 1] - height(rows[rows.length - 1].tilted)) / 2;
  return (
    <svg viewBox="0 0 64 40" className={className} fill="none" stroke="currentColor" strokeWidth={1.6} aria-hidden="true">
      {rows.map((row, r) => Array.from({ length: row.cases }, (_, c) => (
        <rect
          key={`${r}-${c}`}
          x={row.cases === 1 ? 21 : 9 + c * 24}
          y={start + tops[r]}
          width={22}
          height={height(row.tilted)}
          rx={1.5}
          fill={row.tilted ? 'currentColor' : 'none'}
          fillOpacity={0.16}
        />
      )))}
    </svg>
  );
}
