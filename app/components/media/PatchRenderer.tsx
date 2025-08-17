import React, { useState, useEffect } from 'react';
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

function calculateModulePositions(moduleNames: string[]): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  
  // Layout: arrange modules in rows of 3
  const modulesPerRow = 3;
  const moduleWidth = 200;
  const moduleSpacing = 50;
  const rowSpacing = 200;
  const startX = 50;
  const startY = 50;

  moduleNames.forEach((name, index) => {
    const row = Math.floor(index / modulesPerRow);
    const col = index % modulesPerRow;
    
    positions.set(name, {
      x: startX + col * (moduleWidth + moduleSpacing),
      y: startY + row * rowSpacing
    });
  });

  return positions;
}

function renderConnections(
  connections: Connection[],
  modules: Map<string, ModuleData>,
  positions: Map<string, { x: number; y: number }>
): React.ReactElement[] {
  const moduleWidth = 180;
  const pinHeight = 16;
  const pinSpacing = 20;

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

    // Create more fluid cables with natural physics-based curves
    const deltaX = toX - fromX;
    const deltaY = toY - fromY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // Calculate natural cable sag based on distance and gravity
    const sagFactor = Math.min(0.4, distance / 400);
    const baseSag = distance * sagFactor;
    const gravitySag = Math.max(0, deltaY * 0.3);
    const totalSag = baseSag + gravitySag;
    
    // More natural control point calculation for smoother curves
    const horizontalInfluence = Math.min(Math.abs(deltaX) * 0.6, 120);
    const verticalInfluence = Math.abs(deltaY) * 0.2;
    
    // First control point - smooth exit from output with natural curve
    const control1X = fromX + Math.max(30, horizontalInfluence * 0.4);
    let control1Y = fromY + totalSag * 0.3 + verticalInfluence;
    
    // Second control point - smooth approach to input with natural curve
    const control2X = toX - Math.max(30, horizontalInfluence * 0.4);
    let control2Y = toY + totalSag * 0.3 + verticalInfluence;
    
    // Add realistic cable physics for different scenarios
    if (Math.abs(deltaX) < 50) {
      // Short horizontal connections - less sag, more direct
      control1Y = fromY + Math.min(20, totalSag * 0.5);
      control2Y = toY + Math.min(20, totalSag * 0.5);
    } else if (deltaY < -50) {
      // Cables going significantly upward - reduce sag
      const upwardReduction = Math.abs(deltaY) * 0.2;
      control1Y -= upwardReduction;
      control2Y -= upwardReduction;
    }
    
    // Create smooth bezier curve with natural cable physics
    const pathData = `M ${fromX} ${fromY} C ${control1X} ${control1Y} ${control2X} ${control2Y} ${toX} ${toY}`;

    return (
      <g key={index} className={styles.cableGroup}>
        {/* Cable outer glow for depth */}
        <path
          d={pathData}
          stroke="rgba(255, 107, 53, 0.15)"
          strokeWidth="8"
          fill="none"
          className={styles.cableOuterGlow}
        />
        {/* Cable glow effect */}
        <path
          d={pathData}
          stroke="rgba(255, 107, 53, 0.3)"
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
            <stop offset="0%" stopColor="#ff9f43" />
            <stop offset="30%" stopColor="#ff6b35" />
            <stop offset="70%" stopColor="#ff6b35" />
            <stop offset="100%" stopColor="#e55039" />
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
            fill="#ff6b35" 
            stroke="#e55039" 
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
            fill="#ff6b35" 
            stroke="#e55039" 
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

  const { modules, connections } = parsePatchData(patchData);
  const moduleNames = Array.from(modules.keys());
  const positions = calculateModulePositions(moduleNames);

  // Use external metadata if provided
  useEffect(() => {
    if (externalMetadata) {
      setModuleMetadata(externalMetadata);
    }
  }, [externalMetadata]);

  const moduleWidth = 180;
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

  // Calculate SVG dimensions
  const baseModuleHeight = 120;
  const maxX = Math.max(...Array.from(positions.values()).map(p => p.x)) + moduleWidth + 50;
  const maxY = Math.max(...Array.from(positions.values()).map(p => p.y)) + baseModuleHeight + 50;

  return (
    <div className={styles.patchContainer}>
      <svg width={maxX} height={maxY} className={styles.patchSvg}>
        {/* Definitions for gradients and patterns */}
        <defs>
          {connections.map((_, index) => (
            <linearGradient key={index} id={`cableGradient${index}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ff8c42" />
              <stop offset="50%" stopColor="#ff6b35" />
              <stop offset="100%" stopColor="#d63031" />
            </linearGradient>
          ))}
        </defs>
        
        {/* Render connections first (behind modules) */}
        {renderConnections(connections, modules, positions)}
        
        {/* Render modules */}
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
                    <text
                      x={pos.x + 12}
                      y={pinY + 12}
                      className={styles.pinLabel}
                    >
                      {input}
                    </text>
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
                    <text
                      x={pos.x + moduleWidth - 12}
                      y={pinY + 12}
                      textAnchor="end"
                      className={styles.pinLabel}
                    >
                      {output}
                    </text>
                  </g>
                );
              })}
            </g>
          );
        })}
        
        {/* Hover tooltip */}
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
