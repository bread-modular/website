import React from 'react';
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

interface PatchRendererProps {
  patchData: string;
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
  
  // Simple layout: arrange modules in a horizontal line with some spacing
  const moduleWidth = 200;
  const moduleSpacing = 50;
  const startX = 50;
  const y = 100;

  moduleNames.forEach((name, index) => {
    positions.set(name, {
      x: startX + index * (moduleWidth + moduleSpacing),
      y: y
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

    // Create a curved cable connection
    const midX = (fromX + toX) / 2;
    const controlX1 = fromX + (midX - fromX) * 0.5;
    const controlX2 = toX - (toX - midX) * 0.5;
    
    const pathData = `M ${fromX} ${fromY} C ${controlX1} ${fromY} ${controlX2} ${toY} ${toX} ${toY}`;

    return (
      <g key={index}>
        <path
          d={pathData}
          stroke="#ff6b35"
          strokeWidth="2"
          fill="none"
          className={styles.cable}
        />
        {/* Connection dots */}
        <circle cx={fromX} cy={fromY} r="3" fill="#ff6b35" />
        <circle cx={toX} cy={toY} r="3" fill="#ff6b35" />
      </g>
    );
  });
}

export default function PatchRenderer({ patchData }: PatchRendererProps) {
  const { modules, connections } = parsePatchData(patchData);
  const moduleNames = Array.from(modules.keys());
  const positions = calculateModulePositions(moduleNames);

  const moduleWidth = 180;
  const pinHeight = 16;
  const pinSpacing = 20;

  // Calculate SVG dimensions
  const baseModuleHeight = 120;
  const maxX = Math.max(...Array.from(positions.values()).map(p => p.x)) + moduleWidth + 50;
  const maxY = Math.max(...Array.from(positions.values()).map(p => p.y)) + baseModuleHeight + 50;

  return (
    <div className={styles.patchContainer}>
      <svg width={maxX} height={maxY} className={styles.patchSvg}>
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
              {module.inputs.map((input, index) => (
                <g key={`input-${input}-${index}`}>
                  <rect
                    x={pos.x - 8}
                    y={pos.y + 40 + (index * pinSpacing)}
                    width="16"
                    height={pinHeight}
                    rx="2"
                    className={styles.inputPin}
                  />
                  <text
                    x={pos.x + 12}
                    y={pos.y + 40 + (index * pinSpacing) + 12}
                    className={styles.pinLabel}
                  >
                    {input}
                  </text>
                </g>
              ))}
              
              {/* Output pins */}
              {module.outputs.map((output, index) => (
                <g key={`output-${output}-${index}`}>
                  <rect
                    x={pos.x + moduleWidth - 8}
                    y={pos.y + 40 + (index * pinSpacing)}
                    width="16"
                    height={pinHeight}
                    rx="2"
                    className={styles.outputPin}
                  />
                  <text
                    x={pos.x + moduleWidth - 12}
                    y={pos.y + 40 + (index * pinSpacing) + 12}
                    textAnchor="end"
                    className={styles.pinLabel}
                  >
                    {output}
                  </text>
                </g>
              ))}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
