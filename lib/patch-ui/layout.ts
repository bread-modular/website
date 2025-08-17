import { LayoutParams } from './types';
import { TARGET_MODULE_WIDTH, MIN_MODULE_WIDTH, TARGET_SPACING, MIN_SPACING, MIN_PADDING, TOP_PADDING } from './constants';

export function getLayoutParams(containerWidth: number | null): LayoutParams {
  let moduleWidth = TARGET_MODULE_WIDTH;
  let moduleSpacing = TARGET_SPACING;
  let rowSpacing = 140;
  let startX = MIN_PADDING;
  const startY = TOP_PADDING;
  let modulesPerRow = 3;

  if (containerWidth) {
    if (containerWidth < 300) {
      modulesPerRow = 1;
      moduleSpacing = 28;
      moduleWidth = Math.min(170, containerWidth - MIN_PADDING * 2);
      rowSpacing = 130;
      startX = Math.max(MIN_PADDING, (containerWidth - moduleWidth) / 2);
      return { moduleWidth, moduleSpacing, rowSpacing, startX, startY, modulesPerRow };
    } else if (containerWidth < 400) {
      modulesPerRow = 2;
      moduleSpacing = 20;
      const available = containerWidth - MIN_PADDING * 2 - moduleSpacing;
      moduleWidth = Math.min(Math.max(MIN_MODULE_WIDTH, Math.floor(available / 2)), TARGET_MODULE_WIDTH);
      rowSpacing = 130;
      const rowWidth = modulesPerRow * moduleWidth + moduleSpacing;
      startX = Math.max(MIN_PADDING, (containerWidth - rowWidth) / 2);
      return { moduleWidth, moduleSpacing, rowSpacing, startX, startY, modulesPerRow };
    }

    const fits3 = () => (modulesPerRow === 3) && (
      (3 * moduleWidth) + (2 * moduleSpacing) + (2 * MIN_PADDING) <= containerWidth
    );
    modulesPerRow = 3;
    if (!fits3()) {
      while (!fits3() && moduleWidth > MIN_MODULE_WIDTH) moduleWidth -= 2;
      while (!fits3() && moduleSpacing > MIN_SPACING) moduleSpacing -= 2;
    }
    if (!fits3()) {
      modulesPerRow = 2;
      moduleWidth = Math.min(TARGET_MODULE_WIDTH, Math.max(moduleWidth, 170));
      moduleSpacing = Math.min(TARGET_SPACING, Math.max(moduleSpacing, 32));
    }
    const rowWidth = modulesPerRow * moduleWidth + (modulesPerRow - 1) * moduleSpacing;
    startX = Math.max(MIN_PADDING, (containerWidth - rowWidth) / 2);
  }
  return { moduleWidth, moduleSpacing, rowSpacing, startX, startY, modulesPerRow };
}

export function calculateModulePositionsDynamic(moduleNames: string[], layout: LayoutParams, moduleHeights: Map<string, number>): { positions: Map<string, { x: number; y: number }>; totalHeight: number } {
  const { modulesPerRow, moduleWidth, moduleSpacing, startX, startY, rowSpacing } = layout;
  const positions = new Map<string, { x: number, y: number }>();
  const total = moduleNames.length;
  const fullRowWidth = modulesPerRow * moduleWidth + (modulesPerRow - 1) * moduleSpacing;
  let currentY = startY;

  for (let i = 0; i < total; i += modulesPerRow) {
    const rowModules = moduleNames.slice(i, i + modulesPerRow);
    const remainder = rowModules.length;
    let rowStartX = startX;
    if (remainder < modulesPerRow) {
      const usedWidth = remainder * moduleWidth + (remainder - 1) * moduleSpacing;
      const leftover = fullRowWidth - usedWidth;
      rowStartX = startX + leftover / 2;
    }
    rowModules.forEach((name, idx) => {
      positions.set(name, { x: rowStartX + idx * (moduleWidth + moduleSpacing), y: currentY });
    });
    const tallest = Math.max(...rowModules.map(n => moduleHeights.get(n) || 0));
    currentY += tallest + Math.max(40, rowSpacing - 100);
  }
  return { positions, totalHeight: currentY };
}
