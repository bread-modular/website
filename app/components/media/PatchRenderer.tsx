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

function parsePatchData(patchData: string): { modules: Map<string, ModuleData>; connections: Connection[] } {
  const lines = patchData.trim().split('\n').filter(line => line.trim());
  const modules = new Map<string, ModuleData>();
  const connections: Connection[] = [];

  lines.forEach(line => {
    line = line.trim();
    if (line.includes('->')) {
      const [from, to] = line.split('->').map(s => s.trim());
      const [fromModule, fromPin] = from.split(':');
      const [toModule, toPin] = to.split(':');

      // Add modules if not seen before
      if (!modules.has(fromModule)) {
        modules.set(fromModule, { name: fromModule, inputs: [], outputs: [] });
      }
      if (!modules.has(toModule)) {
        modules.set(toModule, { name: toModule, inputs: [], outputs: [] });
      }

      // Add pins to modules
      const fromModuleData = modules.get(fromModule)!;
      const toModuleData = modules.get(toModule)!;

      if (!fromModuleData.outputs.includes(fromPin)) {
        fromModuleData.outputs.push(fromPin);
      }
      if (!toModuleData.inputs.includes(toPin)) {
        toModuleData.inputs.push(toPin);
      }

      // Add connection
      connections.push({
        from: { module: fromModule, pin: fromPin },
        to: { module: toModule, pin: toPin }
      });
    }
  });

  return { modules, connections };
}

interface LayoutParams {
  moduleWidth: number;
  moduleSpacing: number;
  rowSpacing: number;
  startX: number;
  startY: number;
  modulesPerRow: number;
}

function getLayoutParams(containerWidth: number | null, moduleCount: number): LayoutParams {
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
  let startY = TOP_PADDING;
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

function calculateModulePositions(moduleNames: string[], layout: LayoutParams): Map<string, { x: number; y: number }> {
  const { modulesPerRow, moduleWidth, moduleSpacing, rowSpacing, startX, startY } = layout;
  const positions = new Map<string, { x: number; y: number }>();
  const total = moduleNames.length;
  const fullRowWidth = modulesPerRow * moduleWidth + (modulesPerRow - 1) * moduleSpacing;
  const remainder = total % modulesPerRow;
  const lastRowIndex = Math.floor((total - 1) / modulesPerRow);

  moduleNames.forEach((name, index) => {
    const row = Math.floor(index / modulesPerRow);
    const col = index % modulesPerRow;

    // Center the final partial row (keep 3-column overall width) without changing earlier rows
    let rowStartX = startX;
    if (row === lastRowIndex && remainder !== 0 && remainder < modulesPerRow) {
      const usedWidth = remainder * moduleWidth + (remainder - 1) * moduleSpacing;
      const leftover = fullRowWidth - usedWidth;
      rowStartX = startX + leftover / 2; // center the partial row
    }

    positions.set(name, {
      x: rowStartX + col * (moduleWidth + moduleSpacing),
      y: startY + row * rowSpacing
    });
  });
  return positions;
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

  const { modules, connections } = parsePatchData(patchData);
  const moduleNames = Array.from(modules.keys());
  const layout = getLayoutParams(containerWidth, moduleNames.length);
  const positions = calculateModulePositions(moduleNames, layout);

  // Use external metadata if provided
  useEffect(() => {
    if (externalMetadata) {
      setModuleMetadata(externalMetadata);
    }
  }, [externalMetadata]);

  const moduleWidth = layout.moduleWidth;
  const pinHeight = 16;
  const pinSpacing = 20;

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
    const svgHeight = maxY;
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
  const baseModuleHeight = 120;
  const layoutPadding = layout.startY;
  const maxRowWidth = (() => {
    // Always reserve width for the full column count (to keep consistent 3-column visual on desktop)
    return layout.modulesPerRow * layout.moduleWidth + (layout.modulesPerRow - 1) * layout.moduleSpacing;
  })();
  const contentWidth = layout.startX * 2 + maxRowWidth;
  const maxX = contentWidth;
  const maxY = Math.max(...Array.from(positions.values()).map(p => p.y)) + baseModuleHeight + layoutPadding; // symmetric top/bottom

  return (
    <div className={styles.patchContainer} ref={containerRef}>
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
            const calculatedHeight = Math.max(baseModuleHeight, Math.max(inputCount, outputCount) * pinSpacing + 60);
            return (
              <g key={name}>
                {/* Module background */}
                <rect
                  x={pos.x}
                  y={pos.y}
                  width={moduleWidth}
                  height={calculatedHeight}
                  rx="8"
                  className={styles.moduleBackground}
                />
                {/* Module name */}
                <text
                  x={pos.x + moduleWidth / 2}
                  y={pos.y + 25}
                  textAnchor="middle"
                  className={styles.moduleName}
                >
                  {name.toUpperCase()}
                </text>
                {/* Input pins */}
                {module.inputs.map((input, index) => {
                  const description = getPinDescription(name, input, 'input');
                  const pinY = pos.y + 40 + (index * pinSpacing);
                  const pinX = pos.x - 8;
                  return (
                    <g key={`input-${input}-${index}`}>
                      <rect
                        x={pinX}
                        y={pinY}
                        width="16"
                        height={pinHeight}
                        rx="2"
                        className={styles.inputPin}
                        onMouseEnter={(e) => description && showTooltip(e, description, pinX, pinY)}
                        onMouseLeave={hideTooltip}
                      />
                      <text x={pos.x + 12} y={pinY + 12} className={styles.pinLabel}>{input}</text>
                    </g>
                  );
                })}
                {/* Output pins */}
                {module.outputs.map((output, index) => {
                  const description = getPinDescription(name, output, 'output');
                  const pinY = pos.y + 40 + (index * pinSpacing);
                  const pinX = pos.x + moduleWidth - 8;
                  return (
                    <g key={`output-${output}-${index}`}>
                      <rect
                        x={pinX}
                        y={pinY}
                        width="16"
                        height={pinHeight}
                        rx="2"
                        className={styles.outputPin}
                        onMouseEnter={(e) => description && showTooltip(e, description, pinX + 16, pinY)}
                        onMouseLeave={hideTooltip}
                      />
                      <text x={pos.x + moduleWidth - 12} y={pinY + 12} textAnchor="end" className={styles.pinLabel}>{output}</text>
                    </g>
                  );
                })}
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
    </div>
  );
}
