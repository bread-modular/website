import React, { useRef, useState, useMemo } from 'react';
import styles from './PatchUI.module.css';
import { PatchUIProps, ModuleMetadata } from '../../../../lib/patch-ui/types';
import { sanitizePatchRaw, parsePatchData } from '../../../../lib/patch-ui/parse';
import { getLayoutParams, calculateModulePositionsDynamic } from '../../../../lib/patch-ui/layout';
import { BASE_MODULE_HEIGHT, PIN_SPACING, PIN_HEIGHT, STATE_TOP_GAP } from '../../../../lib/patch-ui/constants';
import { Connections } from './Connections';
import { useContainerWidth } from './hooks/useContainerWidth';
import { useTooltip } from './hooks/useTooltip';
import { Tooltip } from './Tooltip';
import { openEndedPalettes } from '../../../../lib/patch-ui/colors';
import { ModuleCard } from './ModuleCard';

const PatchUI: React.FC<PatchUIProps> = ({ patchData, moduleMetadataList }) => {
  const [moduleMetadata ] = useState<Map<string, ModuleMetadata>>(moduleMetadataList || new Map());
  const [showText, setShowText] = useState(false);
  const [hoveredKnob, setHoveredKnob] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const containerWidth = useContainerWidth(containerRef);

  const sanitizedPatch = useMemo(() => sanitizePatchRaw(patchData), [patchData]);
  const { modules, connections, knobSettings, stateSettings } = useMemo(() => parsePatchData(sanitizedPatch), [sanitizedPatch]);
  const moduleNames = useMemo(() => Array.from(modules.keys()), [modules]);
  const layout = useMemo(() => getLayoutParams(containerWidth), [containerWidth]);
  const moduleWidth = layout.moduleWidth;

  const moduleHeights = useMemo(() => {
    const map = new Map<string, number>();
    modules.forEach((module, name) => {
      const inputCount = module.inputs.length;
      const outputCount = module.outputs.length;
      const maxPinCount = Math.max(inputCount, outputCount);
      const knobs = knobSettings.get(name) || [];
      const states = stateSettings.get(name) || [];
      const pinAreaHeight = 40 + maxPinCount * PIN_SPACING + 14;
      const knobRadius = moduleWidth >= 170 ? 18 : moduleWidth >= 150 ? 16 : 14;
      const knobDiameter = knobRadius * 2;
      const captionHeight = 12;
      const knobRowHeight = knobDiameter + captionHeight + 12;
      const knobRows = knobs.length ? Math.ceil(knobs.length / 2) : 0;
      const knobAreaHeight = knobRows ? knobRows * knobRowHeight + 4 : 0;
      const statesAreaHeight = states.length * 16 + (states.length ? STATE_TOP_GAP : 0);
      const h = Math.max(BASE_MODULE_HEIGHT, pinAreaHeight + knobAreaHeight + statesAreaHeight + 10);
      map.set(name, h);
    });
    return map;
  }, [modules, knobSettings, stateSettings, moduleWidth]);

  const { positions, totalHeight } = useMemo(() => calculateModulePositionsDynamic(moduleNames, layout, moduleHeights), [moduleNames, layout, moduleHeights]);

  const layoutPadding = layout.startY;
  const maxRowWidth = layout.modulesPerRow * layout.moduleWidth + (layout.modulesPerRow - 1) * layout.moduleSpacing;
  const contentWidth = layout.startX * 2 + maxRowWidth;
  const maxX = contentWidth;

  const openEndedConnections = useMemo(() => connections.filter(c => (c.from.module === '_' && c.from.pin === '_') || (c.from.module.toLowerCase() === 'none' && c.from.pin.toLowerCase() === 'none')), [connections]);

  const extraHeight = useMemo(() => openEndedConnections.reduce((acc, conn) => {
    const toPos = positions.get(conn.to.module);
    const toModuleData = modules.get(conn.to.module);
    if (!toPos || !toModuleData) return acc;
    const toInputIndex = conn.to.index >= 0 ? conn.to.index : toModuleData.inputs.indexOf(conn.to.pin);
    const toY = toPos.y + 40 + (toInputIndex * PIN_SPACING) + (PIN_HEIGHT / 2);
    const moduleH = moduleHeights.get(conn.to.module) || BASE_MODULE_HEIGHT;
    const dropEndY = toY + moduleH + 20;
    const base = totalHeight + layoutPadding;
    return Math.max(acc, Math.max(0, dropEndY - base));
  }, 0), [openEndedConnections, positions, modules, moduleHeights, totalHeight, layoutPadding]);

  const maxY = totalHeight + layoutPadding + extraHeight;
  const normalConnections = useMemo(() => connections.filter(c => !openEndedConnections.includes(c)), [connections, openEndedConnections]);

  const { tooltip, show, hide } = useTooltip(maxX);

  const renderOpenEnded = () => openEndedConnections.map(conn => {
    const idx = connections.indexOf(conn);
    const toPos = positions.get(conn.to.module);
    const toModuleData = modules.get(conn.to.module);
    if (!toPos || !toModuleData) return <g key={`oe-${idx}`}></g>;
    const toInputIndex = conn.to.index >= 0 ? conn.to.index : toModuleData.inputs.indexOf(conn.to.pin);
    const toX = toPos.x;
    const toY = toPos.y + 40 + (toInputIndex * PIN_SPACING) + (PIN_HEIGHT / 2);
    const moduleH = moduleHeights.get(conn.to.module) || BASE_MODULE_HEIGHT;

    const ROW_TOL = 6;
    const sameRow = Array.from(positions.entries()).filter(a => Math.abs(a[1].y - toPos.y) < ROW_TOL).sort((a,b) => a[1].x - b[1].x);
    let prev: { x: number } | null = null; let next: { x: number } | null = null;
    for (let i=0;i<sameRow.length;i++) if (sameRow[i][0] === conn.to.module) { if (i>0) prev = { x: sameRow[i-1][1].x }; if (i<sameRow.length-1) next = { x: sameRow[i+1][1].x }; break; }
    const moduleW = moduleWidth;
    const prevRight = prev ? prev.x + moduleW : null;
    const nextLeft = next ? next.x : null;
    const leftGap = prevRight !== null ? (toPos.x - prevRight) : 0;
    const rightGap = nextLeft !== null ? (nextLeft - (toPos.x + moduleW)) : 0;
    const MIN_GAP = 16;
    let useLeft = false;
    if (leftGap >= MIN_GAP || rightGap >= MIN_GAP) {
      if (leftGap >= rightGap) useLeft = leftGap >= MIN_GAP; else useLeft = false;
    }
    const svgWidth = maxX;
    let targetX: number;
    if (useLeft) {
      const center = prevRight! + leftGap / 2; targetX = Math.max(12, Math.min(svgWidth - 12, center));
    } else if (rightGap >= MIN_GAP) {
      const center = toPos.x + moduleW + rightGap / 2; targetX = Math.max(12, Math.min(svgWidth - 12, center));
    } else {
      targetX = toPos.x + moduleW * 0.15;
    }
    const endY = toY + moduleH * 0.9;
    const c1X = toX + (targetX - toX) * 0.35; const c1Y = toY + 22;
    const c2X = targetX; const c2Y = toY + (endY - toY) * 0.55;
    const pathData = `M ${toX} ${toY} C ${c1X} ${c1Y} ${c2X} ${c2Y} ${targetX} ${endY}`;
    const palette = openEndedPalettes[idx % openEndedPalettes.length];
    return (
      <g key={`oe-${idx}`} className={styles.cableGroup}>
        <path d={pathData} stroke={palette.glow} strokeWidth={8} fill="none" className={styles.cableOuterGlow} />
        <path d={pathData} stroke={palette.glow} strokeWidth={5} fill="none" className={styles.cableGlow} />
        <path d={pathData} stroke={palette.main} strokeWidth={2.5} fill="none" className={styles.cable} />
        <g className={styles.plugGroup}>
          <circle cx={toX} cy={toY} r={6} fill="#2d3436" stroke="#636e72" strokeWidth={1} className={styles.plugShadow} />
          <circle cx={toX} cy={toY} r={5} fill={palette.main} stroke="#111" strokeWidth={1} className={styles.connectionPlug} />
          <circle cx={toX} cy={toY} r={2} fill="rgba(255,255,255,0.6)" className={styles.plugHighlight} />
        </g>
        <g className={styles.openEndedHandle}>
          <circle cx={targetX} cy={endY} r={7} fill="#0d1117" stroke={palette.main} strokeWidth={2} />
          <circle cx={targetX} cy={endY} r={3} fill={palette.main} />
        </g>
      </g>
    );
  });

  return (
    <div className={styles.patchContainer} ref={containerRef}>
      <button type="button" className={styles.toggleButton} onClick={() => setShowText(s => !s)} aria-label={showText ? 'Show graphical patch' : 'Show text patch'}>
        {showText ? 'Patch View' : 'Text View'}
      </button>
      {showText ? (
        <pre className={styles.patchText}>{sanitizedPatch}</pre>
      ) : (
        <svg width={containerWidth || maxX} height={maxY} className={styles.patchSvg} viewBox={`0 0 ${maxX} ${maxY}`} preserveAspectRatio="xMidYMin meet">
          <g className={styles.modulesLayer}>
            {Array.from(modules.entries()).map(([name, module]) => {
              const pos = positions.get(name)!;
              const knobs = knobSettings.get(name) || [];
              const states = stateSettings.get(name) || [];
              const h = moduleHeights.get(name)!;
              return (
                <ModuleCard
                  key={name}
                  name={name}
                  x={pos.x}
                  y={pos.y}
                  width={moduleWidth}
                  height={h}
                  inputs={module.inputs}
                  outputs={module.outputs}
                  knobs={knobs}
                  states={states}
                  moduleMetadata={moduleMetadata.get(name)}
                  showTooltip={(content, x, y) => show(content, x, y)}
                  hideTooltip={hide}
                  hoveredKnob={hoveredKnob}
                  setHoveredKnob={setHoveredKnob}
                />
              );
            })}
          </g>
          <Connections connections={normalConnections} modules={modules} positions={positions} moduleWidth={moduleWidth} />
          {renderOpenEnded()}
          <Tooltip tooltip={tooltip} />
        </svg>
      )}
    </div>
  );
};

export default PatchUI;
