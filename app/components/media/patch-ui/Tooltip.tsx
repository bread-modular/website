import React from 'react';
import { TooltipState } from '../../../../lib/patch-ui/types';
import { TOOLTIP_HPAD, TOOLTIP_LINE_HEIGHT, TOOLTIP_VPAD } from '../../../../lib/patch-ui/constants';
import styles from './PatchUI.module.css';

export const Tooltip: React.FC<{ tooltip: TooltipState }> = ({ tooltip }) => {
  if (!tooltip.visible) return null;
  const width = tooltip.width || 120;
  const height = tooltip.height || 36;
  return (
    <g className={styles.hoverTooltip}>
      <rect
        x={tooltip.x - width / 2}
        y={tooltip.y}
        width={width}
        height={height}
        rx={8}
        className={styles.tooltipBackground}
      />
      <text className={styles.tooltipText} fontSize={11} textAnchor="start">
        {tooltip.lines && tooltip.lines.length > 0 ? (
          tooltip.lines.map((ln, i) => (
            <tspan
              key={i}
              x={tooltip.x - width / 2 + TOOLTIP_HPAD / 2}
              {...(i === 0
                ? { y: tooltip.y + TOOLTIP_VPAD - 4 + TOOLTIP_LINE_HEIGHT }
                : { dy: TOOLTIP_LINE_HEIGHT })}
            >{ln}</tspan>
          ))
        ) : (
          <tspan
            x={tooltip.x - width / 2 + TOOLTIP_HPAD / 2}
            y={tooltip.y + TOOLTIP_VPAD + TOOLTIP_LINE_HEIGHT}
          >{tooltip.content}</tspan>
        )}
      </text>
    </g>
  );
};
