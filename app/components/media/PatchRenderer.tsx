import React, { useState, useEffect, useRef } from 'react';
import styles from './PatchRenderer.module.css';

export interface Connection {
  from: {
    module: string;
    pin: string;
  };
  to: {
    module: string;
    pin: string;
  };
}

export interface ModuleData {
  name: string;
  inputs: string[];
  outputs: string[];
}

export interface ModuleMetadata {
  inputs?: Array<{ shortname: string; description: string }>;
  outputs?: Array<{ shortname: string; description: string }>;
}

interface PatchRendererProps {
  patchData: string;
  moduleMetadata?: Map<string, ModuleMetadata>;
}

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  content: string;
  width?: number;
  height?: number;
}

interface KnobSetting { name: string; value: number; description?: string }

function sanitizePatchRaw(raw: string): string {
  // Replace paragraph and break tags with newlines first to preserve line structure
  let s = raw
    .replace(/\r\n?/g, '\n')
    .replace(/<\/(p|div)>/gi, '\n')
    .replace(/<(p|div)(\s+[^>]*)?>/gi, '')
    .replace(/<br\s*\/?>(?=.)/gi, '\n');
  // Remove any remaining HTML tags
  s = s.replace(/<[^>]+>/g, '');
  // Decode a few common HTML entities
  s = s.replace(/&amp;/g, '&')
       .replace(/&lt;/g, '<')
       .replace(/&gt;/g, '>')
       .replace(/&quot;/g, '"')
       .replace(/&#39;/g, "'");
  // Collapse multiple blank lines
  s = s.split('\n').map(l => l.trimEnd()).join('\n');
  return s.trim();
}

function parsePatchData(patchData: string): { modules: Map<string, ModuleData>; connections: Connection[]; knobSettings: Map<string, KnobSetting[]> } {
  const lines = patchData.split('\n').map(l => l.trim()).filter(l => l.length);
  const modules = new Map<string, ModuleData>();
  const connections: Connection[] = [];
  const knobSettings = new Map<string, KnobSetting[]>();
  let inKnobSection = false;

  for (const rawLine of lines) {
    let line = rawLine.trim();
    if (!line) continue;
    if (line.toLowerCase().startsWith('---knobs')) { inKnobSection = true; continue; }

    if (inKnobSection) {
      if (!line.includes(':') || !line.includes('@')) continue;
      const [modPart, restAll] = line.split(/:(.+)/); // first ':' only
      if (!restAll) continue;
      const moduleName = modPart.trim();
      const atIdx = restAll.indexOf('@');
      if (atIdx === -1) continue;
      const knobName = restAll.slice(0, atIdx).trim();
      const afterAt = restAll.slice(atIdx + 1).trim();
      const spaceIdx = afterAt.indexOf(' ');
      let valueStr = spaceIdx === -1 ? afterAt : afterAt.slice(0, spaceIdx);
      const description = spaceIdx === -1 ? '' : afterAt.slice(spaceIdx + 1).trim();
      const value = parseFloat(valueStr);
      if (isNaN(value)) continue;
      if (!knobSettings.has(moduleName)) knobSettings.set(moduleName, []);
      knobSettings.get(moduleName)!.push({ name: knobName, value: Math.min(Math.max(value, 0), 1), description: description || undefined });
      if (!modules.has(moduleName)) modules.set(moduleName, { name: moduleName, inputs: [], outputs: [] });
      continue;
    }

    if (line.includes('->')) {
      // Clean any stray HTML remnants (should be gone, but safe)
      line = line.replace(/<[^>]+>/g, '');
      const [fromRaw, toRaw] = line.split('->').map(s => s.trim());
      if (!fromRaw || !toRaw) continue;
      const [fromModule, fromPin = ''] = fromRaw.split(':');
      const [toModule, toPin = ''] = toRaw.split(':');
      if (!fromModule || !toModule) continue;
      if (!modules.has(fromModule)) modules.set(fromModule, { name: fromModule, inputs: [], outputs: [] });
      if (!modules.has(toModule)) modules.set(toModule, { name: toModule, inputs: [], outputs: [] });
      const fromModuleData = modules.get(fromModule)!;
      const toModuleData = modules.get(toModule)!;
      if (fromPin && !fromModuleData.outputs.includes(fromPin)) fromModuleData.outputs.push(fromPin);
      if (toPin && !toModuleData.inputs.includes(toPin)) toModuleData.inputs.push(toPin);
      connections.push({ from: { module: fromModule, pin: fromPin }, to: { module: toModule, pin: toPin } });
    }
  }
  return { modules, connections, knobSettings };
}

interface LayoutParams {
  moduleWidth: number;
  moduleSpacing: number;
  rowSpacing: number; // baseline spacing (used as vertical gap)
  startX: number;
  startY: number;
  modulesPerRow: number;
}

function getLayoutParams(containerWidth: number | null): LayoutParams {
  // Target / min values
  const TARGET_MODULE_WIDTH = 180;
  const MIN_MODULE_WIDTH = 140;
  const TARGET_SPACING = 40;
  const MIN_SPACING = 24;
  const MIN_PADDING = 8;   // allow tighter side padding
  const TOP_PADDING = 40;  // unified padding (also used for bottom)

  let moduleWidth = TARGET_MODULE_WIDTH;
  let moduleSpacing = TARGET_SPACING;
  let rowSpacing = 140;  // slightly tighter vertical spacing
  let startX = MIN_PADDING;
  const startY = TOP_PADDING;
  let modulesPerRow = 3; // strive for 3 whenever feasible (desktop >= 400 now)

  if (containerWidth) {
    // Mobile specific overrides
    if (containerWidth < 300) {
      // Extra small: single column
      modulesPerRow = 1;
      moduleSpacing = 28;
      moduleWidth = Math.min(170, containerWidth - MIN_PADDING * 2);
      rowSpacing = 130;
      startX = Math.max(MIN_PADDING, (containerWidth - moduleWidth) / 2);
      return { moduleWidth, moduleSpacing, rowSpacing, startX, startY, modulesPerRow };
    } else if (containerWidth < 400) {
      // Mobile (requested range 300-400): force 2 columns
      modulesPerRow = 2;
      moduleSpacing = 20; // tighter for small width
      // Compute max module width that fits
      const available = containerWidth - MIN_PADDING * 2 - moduleSpacing; // spacing between 2 cols
      moduleWidth = Math.min(Math.max(MIN_MODULE_WIDTH, Math.floor(available / 2)), TARGET_MODULE_WIDTH);
      rowSpacing = 130;
      const rowWidth = modulesPerRow * moduleWidth + moduleSpacing;
      startX = Math.max(MIN_PADDING, (containerWidth - rowWidth) / 2);
      return { moduleWidth, moduleSpacing, rowSpacing, startX, startY, modulesPerRow };
    }

    // From 400 upwards we use previous adaptive desktop logic (attempt 3 cols)
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

function calculateModulePositionsDynamic(moduleNames: string[], layout: LayoutParams, moduleHeights: Map<string, number>): { positions: Map<string, { x: number; y: number }>; totalHeight: number } {
  const { modulesPerRow, moduleWidth, moduleSpacing, startX, startY, rowSpacing } = layout;
  const positions = new Map<string, { x: number, y: number }>();
  const total = moduleNames.length;
  const fullRowWidth = modulesPerRow * moduleWidth + (modulesPerRow - 1) * moduleSpacing;
  let currentY = startY;

  for (let i = 0; i < total; i += modulesPerRow) {
    const rowModules = moduleNames.slice(i, i + modulesPerRow);
    const remainder = rowModules.length;
    // center partial row
    let rowStartX = startX;
    if (remainder < modulesPerRow) {
      const usedWidth = remainder * moduleWidth + (remainder - 1) * moduleSpacing;
      const leftover = fullRowWidth - usedWidth;
      rowStartX = startX + leftover / 2;
    }
    // place modules
    rowModules.forEach((name, idx) => {
      positions.set(name, { x: rowStartX + idx * (moduleWidth + moduleSpacing), y: currentY });
    });
    // advance Y by tallest module in this row + vertical gap (rowSpacing acts as gap baseline)
    const tallest = Math.max(...rowModules.map(n => moduleHeights.get(n) || 0));
    currentY += tallest + Math.max(40, rowSpacing - 100); // ensure at least 40px gap (rowSpacing originally ~140 for base 120h)
  }
  return { positions, totalHeight: currentY };
}

function renderConnections(
  connections: Connection[],
  modules: Map<string, ModuleData>,
  positions: Map<string, { x: number; y: number }>,
  moduleWidth: number
): React.ReactElement[] {
  const pinHeight = 16;
  const pinSpacing = 20;
  
  // Define cable colors
  const cableColors = [
    { main: '#ff6b35', gradient: ['#ff9f43', '#ff6b35', '#e55039'], glow: 'rgba(255, 107, 53, 0.3)' },
    { main: '#4834d4', gradient: ['#686de0', '#4834d4', '#341f97'], glow: 'rgba(72, 52, 212, 0.3)' },
    { main: '#00d2d3', gradient: ['#55efc4', '#00d2d3', '#00a085'], glow: 'rgba(0, 210, 211, 0.3)' },
    { main: '#ff9ff3', gradient: ['#ffeaa7', '#ff9ff3', '#fd79a8'], glow: 'rgba(255, 159, 243, 0.3)' },
    { main: '#ff7675', gradient: ['#fd79a8', '#ff7675', '#e84393'], glow: 'rgba(255, 118, 117, 0.3)' }
  ];

  return connections.map((connection, index) => {
    const fromPos = positions.get(connection.from.module);
    const toPos = positions.get(connection.to.module);
    
    if (!fromPos || !toPos) return <g key={index}></g>;

    const fromModule = modules.get(connection.from.module)!;
    const toModule = modules.get(connection.to.module)!;

    // Calculate pin positions
    const fromOutputIndex = fromModule.outputs.indexOf(connection.from.pin);
    const toInputIndex = toModule.inputs.indexOf(connection.to.pin);

    const fromX = fromPos.x + moduleWidth;
    const fromY = fromPos.y + 40 + (fromOutputIndex * pinSpacing) + (pinHeight / 2);
    
    const toX = toPos.x;
    const toY = toPos.y + 40 + (toInputIndex * pinSpacing) + (pinHeight / 2);

    // Pick a color for this cable (consistent based on index)
    const colorIndex = index % cableColors.length;
    const cableColor = cableColors[colorIndex];

    // Create cables that follow natural gravity and physics
    const deltaX = toX - fromX;
    const deltaY = toY - fromY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // Calculate natural cable sag based on distance and gravity
    const sagFactor = Math.min(0.3, distance / 600); // Reduced sag factor
    const baseSag = distance * sagFactor;
    
    // Always add downward sag due to gravity
    const gravitySag = Math.max(20, distance * 0.15); // Minimum sag for gravity effect
    const totalSag = baseSag + gravitySag;
    
    // Calculate control points for natural cable curve
    const horizontalInfluence = Math.min(Math.abs(deltaX) * 0.5, 100);
    
    // First control point - smooth exit from output with natural downward curve
    const control1X = fromX + Math.max(40, horizontalInfluence * 0.6);
    const control1Y = fromY + totalSag * 0.6; // Always sag down from start point
    
    // Second control point - smooth approach to input with natural curve
    const control2X = toX - Math.max(40, horizontalInfluence * 0.6);
    const control2Y = toY + totalSag * 0.6; // Always sag down toward end point
    
    // For very short distances, use a gentler curve
    if (distance < 150) {
      const midX = (fromX + toX) / 2;
      const gentleSag = Math.max(15, distance * 0.1);
      const control1Y_simple = Math.max(fromY, toY) + gentleSag;
      
      const pathData = `M ${fromX} ${fromY} Q ${midX} ${control1Y_simple} ${toX} ${toY}`;
      
      return (
        <g key={index} className={styles.cableGroup}>
          {/* Cable outer glow for depth */}
          <path
            d={pathData}
            stroke={cableColor.glow}
            strokeWidth="8"
            fill="none"
            className={styles.cableOuterGlow}
          />
          {/* Main cable with gradient */}
          <defs>
            <linearGradient id={`cableGradient${index}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={cableColor.gradient[0]} />
              <stop offset="50%" stopColor={cableColor.gradient[1]} />
              <stop offset="100%" stopColor={cableColor.gradient[2]} />
            </linearGradient>
          </defs>
          <path
            d={pathData}
            stroke={`url(#cableGradient${index})`}
            strokeWidth="3"
            fill="none"
            className={styles.cable}
          />
          {/* Connection plugs */}
          <circle cx={fromX} cy={fromY} r="5" fill={cableColor.main} className={styles.connectionPlug} />
          <circle cx={toX} cy={toY} r="5" fill={cableColor.main} className={styles.connectionPlug} />
        </g>
      );
    }
    
    // Create smooth bezier curve with natural gravity sag
    const pathData = `M ${fromX} ${fromY} C ${control1X} ${control1Y} ${control2X} ${control2Y} ${toX} ${toY}`;

    return (
      <g key={index} className={styles.cableGroup}>
        {/* Cable outer glow for depth */}
        <path
          d={pathData}
          stroke={cableColor.glow}
          strokeWidth="8"
          fill="none"
          className={styles.cableOuterGlow}
        />
        {/* Cable glow effect */}
        <path
          d={pathData}
          stroke={cableColor.glow}
          strokeWidth="5"
          fill="none"
          className={styles.cableGlow}
        />
        {/* Cable shadow for depth */}
        <path
          d={pathData}
          stroke="rgba(0, 0, 0, 0.3)"
            strokeWidth="3"
          fill="none"
          transform="translate(1, 1)"
          className={styles.cableShadow}
        />
        {/* Main cable with animated gradient */}
        <defs>
          <linearGradient id={`cableGradient${index}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={cableColor.gradient[0]} />
            <stop offset="30%" stopColor={cableColor.gradient[1]} />
            <stop offset="70%" stopColor={cableColor.gradient[1]} />
            <stop offset="100%" stopColor={cableColor.gradient[2]} />
          </linearGradient>
          <linearGradient id={`cableHighlight${index}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(255, 255, 255, 0.3)" />
            <stop offset="50%" stopColor="rgba(255, 255, 255, 0.1)" />
            <stop offset="100%" stopColor="rgba(255, 255, 255, 0.0)" />
          </linearGradient>
        </defs>
        {/* Main cable body */}
        <path
          d={pathData}
          stroke={`url(#cableGradient${index})`}
          strokeWidth="2.5"
          fill="none"
          className={styles.cable}
        />
        {/* Cable highlight for 3D effect */}
        <path
          d={pathData}
          stroke={`url(#cableHighlight${index})`}
          strokeWidth="1"
          fill="none"
          className={styles.cableHighlight}
        />
        {/* Connection plugs with better styling */}
        <g className={styles.plugGroup}>
          <circle 
            cx={fromX} 
            cy={fromY} 
            r="6" 
            fill="#2d3436" 
            stroke="#636e72"
            strokeWidth="1"
            className={styles.plugShadow}
          />
          <circle 
            cx={fromX} 
            cy={fromY} 
            r="5" 
            fill={cableColor.main} 
            stroke={cableColor.gradient[2]} 
            strokeWidth="1"
            className={styles.connectionPlug} 
          />
          <circle 
            cx={fromX} 
            cy={fromY} 
            r="2" 
            fill="rgba(255, 255, 255, 0.6)" 
            className={styles.plugHighlight} 
          />
        </g>
        <g className={styles.plugGroup}>
          <circle 
            cx={toX} 
            cy={toY} 
            r="6" 
            fill="#2d3436" 
            stroke="#636e72"
            strokeWidth="1"
            className={styles.plugShadow}
          />
          <circle 
            cx={toX} 
            cy={toY} 
            r="5" 
            fill={cableColor.main} 
            stroke={cableColor.gradient[2]} 
            strokeWidth="1"
            className={styles.connectionPlug} 
          />
          <circle 
            cx={toX} 
            cy={toY} 
            r="2" 
            fill="rgba(255, 255, 255, 0.6)" 
            className={styles.plugHighlight} 
          />
        </g>
      </g>
    );
  });
}

export default function PatchRenderer({ patchData, moduleMetadata: externalMetadata }: PatchRendererProps) {
  const [moduleMetadata, setModuleMetadata] = useState<Map<string, ModuleMetadata>>(externalMetadata || new Map());
  const [tooltip, setTooltip] = useState<TooltipState>({ visible: false, x: 0, y: 0, content: '' });
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState<number | null>(null);
  const [showText, setShowText] = useState(false); // toggle raw text view

  // Observe container width for responsive layout
  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const update = () => setContainerWidth(el.clientWidth);
    update();
    const ro = new ResizeObserver(() => update());
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const sanitizedPatch = sanitizePatchRaw(patchData);
  const { modules, connections, knobSettings } = parsePatchData(sanitizedPatch);
  const moduleNames = Array.from(modules.keys());
  const layout = getLayoutParams(containerWidth);
  const moduleWidth = layout.moduleWidth;
  const pinHeight = 16;
  const pinSpacing = 20;
  const baseModuleHeight = 120;

  // Pre-compute per-module heights including knob grid (2 per row)
  const moduleHeights = new Map<string, number>();
  modules.forEach((module, name) => {
    const inputCount = module.inputs.length;
    const outputCount = module.outputs.length;
    const maxPinCount = Math.max(inputCount, outputCount);
    const knobs = knobSettings.get(name) || [];
    const pinAreaHeight = 40 + maxPinCount * pinSpacing + 14; // title + pins + spacing to knobs
    // Dynamic knob sizing based on module width
    const knobRadius = moduleWidth >= 170 ? 18 : moduleWidth >= 150 ? 16 : 14;
    const knobDiameter = knobRadius * 2;
    const captionHeight = 12; // text height below knob
    const knobRowHeight = knobDiameter + captionHeight + 12; // knob + caption + gap
    const knobRows = knobs.length ? Math.ceil(knobs.length / 2) : 0;
    const knobAreaHeight = knobRows ? knobRows * knobRowHeight + 4 : 0; // slight top padding already accounted in pinAreaHeight
    const h = Math.max(baseModuleHeight, pinAreaHeight + knobAreaHeight + 20); // bottom padding
    moduleHeights.set(name, h);
  });

  const { positions, totalHeight } = calculateModulePositionsDynamic(moduleNames, layout, moduleHeights);

  // Use external metadata if provided
  useEffect(() => {
    if (externalMetadata) {
      setModuleMetadata(externalMetadata);
    }
  }, [externalMetadata]);

  // Helper function to get pin description
  const getPinDescription = (moduleName: string, pinName: string, type: 'input' | 'output'): string | undefined => {
    const metadata = moduleMetadata.get(moduleName);
    if (!metadata) return undefined;
    
    const pins = type === 'input' ? metadata.inputs : metadata.outputs;
    const pin = pins?.find(p => p.shortname === pinName);
    return pin?.description;
  };

  // Tooltip event handlers
  const showTooltip = (event: React.MouseEvent, content: string, x: number, y: number) => {
    if (!content) return;
    
    // Calculate tooltip dimensions to fit the full content
    const padding = 20; // More generous padding
    const charWidth = 7; // Approximate character width
    
    // Calculate actual width needed for the content
    const contentWidth = content.length * charWidth;
    const tooltipWidth = Math.max(contentWidth + padding, 120); // Ensure minimum width but don't restrict max
    const tooltipHeight = 36; // Slightly taller for better padding
    
    // Ensure tooltip stays within SVG bounds
    const svgWidth = maxX;
    const margin = 15;
    
    // Adjust horizontal position
    let adjustedX = x;
    const halfWidth = tooltipWidth / 2;
    
    if (x - halfWidth < margin) {
      adjustedX = halfWidth + margin;
    } else if (x + halfWidth > svgWidth - margin) {
      adjustedX = svgWidth - halfWidth - margin;
    }
    
    // Adjust vertical position (prefer above, fall back to below)
    let adjustedY = y - tooltipHeight - 15;
    if (adjustedY < margin) {
      adjustedY = y + 25; // Show below pin
    }
    
    setTooltip({
      visible: true,
      x: adjustedX,
      y: adjustedY,
      content,
      width: tooltipWidth,
      height: tooltipHeight
    });
  };

  const hideTooltip = () => {
    setTooltip(prev => ({ ...prev, visible: false }));
  };

  // Calculate SVG dimensions with extra space for cable sag (uniform padding top/bottom)
  const layoutPadding = layout.startY;
  const maxRowWidth = layout.modulesPerRow * layout.moduleWidth + (layout.modulesPerRow - 1) * layout.moduleSpacing;
  const contentWidth = layout.startX * 2 + maxRowWidth;
  const maxX = contentWidth;
  const maxY = totalHeight + layoutPadding; // already includes final gap + padding

  return (
    <div className={styles.patchContainer} ref={containerRef}>
      <button
        type="button"
        className={styles.toggleButton}
        onClick={() => setShowText(s => !s)}
        aria-label={showText ? 'Show graphical patch' : 'Show text patch'}
      >
        {showText ? 'Patch View' : 'Text View'}
      </button>
      {showText ? (
        <pre className={styles.patchText}>{sanitizedPatch}</pre>
      ) : (
        <svg
          width={containerWidth || maxX}
          height={maxY}
          className={styles.patchSvg}
          viewBox={`0 0 ${maxX} ${maxY}`}
          preserveAspectRatio="xMidYMin meet"
        >
          {/* Group for modules - render first so cables appear above */}
          <g className={styles.modulesLayer}>
            {Array.from(modules.entries()).map(([name, module]) => {
              const pos = positions.get(name)!;
              const inputCount = module.inputs.length;
              const outputCount = module.outputs.length;
              const maxPinCount = Math.max(inputCount, outputCount);
              const knobs = knobSettings.get(name) || [];
              const pinAreaHeight = 40 + maxPinCount * pinSpacing + 14;
              // knob metrics (must match height calc above)
              const knobRadius = moduleWidth >= 170 ? 18 : moduleWidth >= 150 ? 16 : 14;
              const knobDiameter = knobRadius * 2;
              const captionHeight = 12;
              const knobRowHeight = knobDiameter + captionHeight + 12;
              const knobRows = knobs.length ? Math.ceil(knobs.length / 2) : 0;
              const knobStartY = pos.y + pinAreaHeight; // top of knob area
              const calculatedHeight = moduleHeights.get(name)!;
              return (
                <g key={name}>
                  <rect x={pos.x} y={pos.y} width={moduleWidth} height={calculatedHeight} rx={8} className={styles.moduleBackground} />
                  <text x={pos.x + moduleWidth / 2} y={pos.y + 25} textAnchor="middle" className={styles.moduleName}>{name.toUpperCase()}</text>
                  {module.inputs.map((input, index) => {
                    const description = getPinDescription(name, input, 'input');
                    const pinY = pos.y + 40 + (index * pinSpacing);
                    const pinX = pos.x - 8;
                    return (
                      <g key={`input-${input}-${index}`}>
                        <rect x={pinX} y={pinY} width={16} height={pinHeight} rx={2} className={styles.inputPin} onMouseEnter={(e) => description && showTooltip(e, description, pinX, pinY)} onMouseLeave={hideTooltip} />
                        <text x={pos.x + 12} y={pinY + 12} className={styles.pinLabel}>{input}</text>
                      </g>
                    );
                  })}
                  {module.outputs.map((output, index) => {
                    const description = getPinDescription(name, output, 'output');
                    const pinY = pos.y + 40 + (index * pinSpacing);
                    const pinX = pos.x + moduleWidth - 8;
                    return (
                      <g key={`output-${output}-${index}`}>
                        <rect x={pinX} y={pinY} width={16} height={pinHeight} rx={2} className={styles.outputPin} onMouseEnter={(e) => description && showTooltip(e, description, pinX + 16, pinY)} onMouseLeave={hideTooltip} />
                        <text x={pos.x + moduleWidth - 12} y={pinY + 12} textAnchor="end" className={styles.pinLabel}>{output}</text>
                      </g>
                    );
                  })}
                  {knobs.length > 0 && (
                    <g className={styles.knobGroup}>
                      {knobs.map((k, kIdx) => {
                        const row = Math.floor(kIdx / 2);
                        const col = kIdx % 2; // 0 or 1
                        const rowBaseY = knobStartY + row * knobRowHeight;
                        const centerY = rowBaseY + knobRadius; // center of knob
                        const colCenterX = col === 0
                          ? pos.x + moduleWidth * 0.25
                          : pos.x + moduleWidth * 0.75;
                        // Knob angle logic: 0 at 7 o'clock (120° here), max at 5 o'clock (420° -> 60° normalized), total sweep 300° clockwise
                        const startAngleDeg = 120; // 7 o'clock relative to +x axis (0° = 3 o'clock, increasing clockwise)
                        const sweepAngleDeg = 300; // total travel
                        const angleDeg = startAngleDeg + sweepAngleDeg * k.value; // may exceed 360
                        const angleNormDeg = angleDeg % 360; // for rendering position
                        const angleRad = angleNormDeg * Math.PI / 180;
                        const indX = colCenterX + Math.cos(angleRad) * (knobRadius - 4);
                        const indY = centerY + Math.sin(angleRad) * (knobRadius - 4);
                        // Arc from startAngle to current angle across clockwise, handling wrap
                        const startRad = startAngleDeg * Math.PI / 180;
                        const endRad = angleRad; // normalized end
                        const extentDeg = ((angleNormDeg - startAngleDeg + 360) % 360); // current sweep amount (0..300)
                        const arcR = knobRadius - 3; // slight inset
                        const startX = colCenterX + Math.cos(startRad) * arcR;
                        const startY = centerY + Math.sin(startRad) * arcR;
                        const endX = colCenterX + Math.cos(endRad) * arcR;
                        const endY = centerY + Math.sin(endRad) * arcR;
                        const sweepFlag = 1; // clockwise
                        const largeArcFlag = extentDeg > 180 ? 1 : 0; // use large arc when over half circle
                        const hasArc = extentDeg > 2; // render only if some rotation (> ~2°)
                        const arcPath = `M ${startX} ${startY} A ${arcR} ${arcR} 0 ${largeArcFlag} ${sweepFlag} ${endX} ${endY}`;
                        return (
                          <g key={`knob-${k.name}-${kIdx}`} className={styles.knobCell} onMouseEnter={(e) => k.description && showTooltip(e, k.description, colCenterX, centerY - knobRadius - 8)} onMouseLeave={hideTooltip}>
                            <circle cx={colCenterX} cy={centerY} r={knobRadius + 2} className={styles.knobOuter} />
                            <circle cx={colCenterX} cy={centerY} r={knobRadius} className={styles.knobInner} />
                            {hasArc && <path d={arcPath} className={styles.knobArc} />}
                            <line x1={colCenterX} y1={centerY} x2={indX} y2={indY} className={styles.knobIndicator} />
                            <text x={colCenterX} y={centerY + knobRadius + 10} className={styles.knobCaption} textAnchor="middle">{k.name.toUpperCase()}</text>
                          </g>
                        );
                      })}
                    </g>
                  )}
                </g>
              );
            })}
          </g>
          {/* Group for connections - render after modules so they appear above */}
          <g className={styles.connectionsLayer}>
            {renderConnections(connections, modules, positions, moduleWidth)}
          </g>
          {/* Hover tooltip - rendered on very top */}
          {tooltip.visible && (
            <g className={styles.hoverTooltip}>
              <rect
                x={tooltip.x - (tooltip.width || 120) / 2}
                y={tooltip.y}
                width={tooltip.width || 120}
                height={tooltip.height || 36}
                rx="8"
                className={styles.tooltipBackground}
              />
              <text
                x={tooltip.x}
                y={tooltip.y + (tooltip.height || 36) / 2 + 1}
                textAnchor="middle"
                className={styles.tooltipText}
                fontSize="11"
                dominantBaseline="middle"
              >
                {tooltip.content}
              </text>
            </g>
          )}
        </svg>
      )}
    </div>
  );
}
