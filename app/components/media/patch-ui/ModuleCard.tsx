import React from 'react';
import { KnobSetting, StateSetting, ModuleMetadata } from '../../../../lib/patch-ui/types';
import { STATE_TOP_GAP, STATE_SEPARATOR_OFFSET } from '../../../../lib/patch-ui/constants';
import styles from './PatchUI.module.css';

interface Props {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  inputs: string[];
  outputs: string[];
  knobs: KnobSetting[];
  states: StateSetting[];
  moduleMetadata?: ModuleMetadata;
  showTooltip: (content: string, x: number, y: number) => void;
  hideTooltip: () => void;
  hoveredKnob: string | null;
  setHoveredKnob: (k: string | null | ((prev: string | null) => string | null)) => void;
}

export const ModuleCard: React.FC<Props> = ({ name, x, y, width, height, inputs, outputs, knobs, states, moduleMetadata, showTooltip, hideTooltip, hoveredKnob, setHoveredKnob }) => {
  const pinHeight = 16;
  const pinSpacing = 20;
  const pinAreaHeight = 40 + Math.max(inputs.length, outputs.length) * pinSpacing + 14;
  const knobRadius = width >= 170 ? 18 : width >= 150 ? 16 : 14;
  const knobDiameter = knobRadius * 2;
  const captionHeight = 12;
  const knobRowHeight = knobDiameter + captionHeight + 12;
  const knobRows = knobs.length ? Math.ceil(knobs.length / 2) : 0;
  const knobAreaHeight = knobRows ? knobRows * knobRowHeight + 4 : 0;
  const knobStartY = y + pinAreaHeight;
  const statesStartY = knobStartY + knobAreaHeight + (states.length ? STATE_TOP_GAP : 0);
  const separatorY = states.length ? (statesStartY - STATE_SEPARATOR_OFFSET) : null;

  const getPinDescription = (pinName: string, type: 'input' | 'output') => {
    const pins = type === 'input' ? moduleMetadata?.inputs : moduleMetadata?.outputs;
    return pins?.find(p => p.shortname === pinName)?.description;
  };

  return (
    <g>
      <rect x={x} y={y} width={width} height={height} rx={8} className={styles.moduleBackground} />
      <text x={x + width / 2} y={y + 25} textAnchor="middle" className={styles.moduleName}>{name.toUpperCase()}</text>
      {inputs.map((input, index) => {
        const description = getPinDescription(input, 'input');
        const pinY = y + 40 + (index * pinSpacing);
        const pinX = x - 8;
        return (
          <g key={`input-${input}-${index}`}>
            <rect x={pinX} y={pinY} width={16} height={pinHeight} rx={2} className={styles.inputPin} onMouseEnter={() => description && showTooltip(description, pinX, pinY)} onMouseLeave={hideTooltip} />
            <text x={x + 12} y={pinY + 12} className={styles.pinLabel}>{input}</text>
          </g>
        );
      })}
      {outputs.map((output, index) => {
        const description = getPinDescription(output, 'output');
        const pinY = y + 40 + (index * pinSpacing);
        const pinX = x + width - 8;
        return (
          <g key={`output-${output}-${index}`}>
            <rect x={pinX} y={pinY} width={16} height={pinHeight} rx={2} className={styles.outputPin} onMouseEnter={() => description && showTooltip(description, pinX + 16, pinY)} onMouseLeave={hideTooltip} />
            <text x={x + width - 12} y={pinY + 12} textAnchor="end" className={styles.pinLabel}>{output}</text>
          </g>
        );
      })}
      {knobs.length > 0 && (
        <g className={styles.knobGroup}>
          {knobs.map((k, kIdx) => {
            const row = Math.floor(kIdx / 2);
            const col = kIdx % 2;
            const rowBaseY = knobStartY + row * knobRowHeight;
            const centerY = rowBaseY + knobRadius;
            const colCenterX = col === 0 ? x + width * 0.25 : x + width * 0.75;
            const startAngleDeg = 120;
            const sweepAngleDeg = 285;
            const angleDeg = startAngleDeg + sweepAngleDeg * k.value;
            const angleNormDeg = angleDeg % 360;
            const angleRad = angleNormDeg * Math.PI / 180;
            const indX = colCenterX + Math.cos(angleRad) * (knobRadius - 4);
            const indY = centerY + Math.sin(angleRad) * (knobRadius - 4);
            const startRad = startAngleDeg * Math.PI / 180;
            const endRad = angleRad;
            const extentDeg = ((angleNormDeg - startAngleDeg + 360) % 360);
            const arcR = knobRadius - 3;
            const startX = colCenterX + Math.cos(startRad) * arcR;
            const startY = centerY + Math.sin(startRad) * arcR;
            const endX = colCenterX + Math.cos(endRad) * arcR;
            const endY = centerY + Math.sin(endRad) * arcR;
            const sweepFlag = 1;
            const largeArcFlag = extentDeg > 180 ? 1 : 0;
            const hasArc = extentDeg > 2;
            const arcPath = `M ${startX} ${startY} A ${arcR} ${arcR} 0 ${largeArcFlag} ${sweepFlag} ${endX} ${endY}`;
            const knobKey = `${name}-${k.name}-${kIdx}`;
            const isBottomSector = angleNormDeg > 30 && angleNormDeg < 150;
            const baseValueRadius = knobRadius + 6;
            const valueRadius = isBottomSector ? knobRadius + 2 : baseValueRadius;
            const valueX = colCenterX + Math.cos(angleRad) * valueRadius;
            let valueY = centerY + Math.sin(angleRad) * valueRadius + 1;
            if (isBottomSector) valueY -= 10;
            const quad = (angleNormDeg + 360) % 360;
            let anchor: 'start' | 'end' | 'middle' = 'middle';
            if (quad > 90 && quad < 270) anchor = 'end'; else if (quad < 90 || quad > 270) anchor = 'start';
            const valueStr = k.value.toFixed(2);
            const valWidth = valueStr.length * 5.6 + 6;
            const valHeight = 12;
            let bgX = valueX - valWidth / 2;
            if (anchor === 'start') bgX = valueX - 3;
            if (anchor === 'end') bgX = valueX - valWidth + 3;
            const bgY = valueY - valHeight + 3;
            return (
              <g
                key={`knob-${k.name}-${kIdx}`}
                className={styles.knobCell}
                onMouseEnter={() => {
                  setHoveredKnob(knobKey);
                  if (k.description) showTooltip(k.description, colCenterX, centerY - knobRadius - 8);
                }}
                onMouseLeave={() => {
                  setHoveredKnob((prev: string | null) => prev === knobKey ? null : prev);
                  hideTooltip();
                }}
              >
                <circle cx={colCenterX} cy={centerY} r={knobRadius + 2} className={styles.knobOuter} />
                <circle cx={colCenterX} cy={centerY} r={knobRadius} className={styles.knobInner} />
                {hasArc && <path d={arcPath} className={styles.knobArc} />}
                <line x1={colCenterX} y1={centerY} x2={indX} y2={indY} className={styles.knobIndicator} />
                {hoveredKnob === knobKey && (
                  <g className={styles.knobValueGroup}>
                    <rect x={bgX} y={bgY} width={valWidth} height={valHeight} rx={3} className={styles.knobValueBg} />
                    <text x={valueX} y={valueY} textAnchor={anchor} className={styles.knobValue}>{valueStr}</text>
                  </g>
                )}
                <text x={colCenterX} y={centerY + knobRadius + 10} className={styles.knobCaption} textAnchor="middle">{k.name.toUpperCase()}</text>
              </g>
            );
          })}
        </g>
      )}
      {states.length > 0 && (
        <g className={styles.stateGroup}>
          {separatorY !== null && (
            <line x1={x + 6} x2={x + width - 6} y1={separatorY} y2={separatorY} className={styles.stateSeparator} />
          )}
          {states.map((s, sIdx) => {
            const lineHeight = 16;
            const lineY = statesStartY + sIdx * lineHeight;
            const keyX = x + 10;
            const label = `${s.name.toUpperCase()}: ${s.value}`;
            return (
              <g key={`${name}-state-${s.name}-${sIdx}`} className={styles.stateLine} onMouseEnter={() => s.comment && showTooltip(s.comment, keyX + 40, lineY - 6)} onMouseLeave={hideTooltip}>
                <text x={keyX} y={lineY} className={styles.stateKey} textAnchor="start">{label}</text>
              </g>
            );
          })}
        </g>
      )}
    </g>
  );
};
