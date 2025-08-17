import { useState } from 'react';
import { TooltipState } from '../../../../../lib/patch-ui/types';
import { TOOLTIP_MAX_WIDTH, TOOLTIP_CHAR_WIDTH, TOOLTIP_LINE_HEIGHT, TOOLTIP_HPAD, TOOLTIP_VPAD } from '../../../../../lib/patch-ui/constants';

export function useTooltip(svgWidth: number) {
  const [tooltip, setTooltip] = useState<TooltipState>({ visible: false, x: 0, y: 0, content: '' });

  const show = (content: string, x: number, y: number) => {
    if (!content) return;
    const maxChars = Math.floor((TOOLTIP_MAX_WIDTH - TOOLTIP_HPAD) / TOOLTIP_CHAR_WIDTH);
    const words = content.split(/\s+/);
    const lines: string[] = [];
    let current = '';
    const push = () => { if (current) { lines.push(current); current=''; } };
    for (let w of words) {
      while (w.length > maxChars) {
        const slice = w.slice(0, maxChars);
        w = w.slice(maxChars);
        if (current) push();
        lines.push(slice);
      }
      if (!current) current = w; else if (current.length + 1 + w.length <= maxChars) current += ' ' + w; else { push(); current = w; }
    }
    push();
    const longest = lines.reduce((m,l)=>Math.max(m,l.length),0);
    const neededWidth = longest * TOOLTIP_CHAR_WIDTH + TOOLTIP_HPAD;
    const width = Math.min(TOOLTIP_MAX_WIDTH, neededWidth);
    const height = lines.length * TOOLTIP_LINE_HEIGHT + TOOLTIP_VPAD * 2;
    const margin = 15;
    const half = width / 2;
    let adjX = x;
    if (adjX - half < margin) adjX = half + margin; else if (adjX + half > svgWidth - margin) adjX = svgWidth - half - margin;
    let adjY = y - height - 15;
    if (adjY < margin) adjY = y + 25;
    setTooltip({ visible: true, x: adjX, y: adjY, content, width, height, lines });
  };
  const hide = () => setTooltip((t: TooltipState) => ({ ...t, visible: false }));
  return { tooltip, show, hide };
}
