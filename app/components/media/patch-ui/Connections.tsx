import React from 'react';
import { Connection, ModuleData } from '../../../..//lib/patch-ui/types';
import { cableColors } from '../../../..//lib/patch-ui/colors';
import styles from './PatchUI.module.css';

interface Props {
  connections: Connection[];
  modules: Map<string, ModuleData>;
  positions: Map<string, { x: number; y: number }>;
  moduleWidth: number;
}

export const Connections: React.FC<Props> = ({ connections, modules, positions, moduleWidth }) => {
  return (
    <g className={styles.connectionsLayer}>
      {connections.map((connection, index) => {
        const openEndedSource = (connection.from.module === '_' && connection.from.pin === '_') || (connection.from.module.toLowerCase() === 'none' && connection.from.pin.toLowerCase() === 'none');
        const openEndedDest = (connection.to.module === '_' && connection.to.pin === '_') || (connection.to.module.toLowerCase() === 'none' && connection.to.pin.toLowerCase() === 'none');
        if (openEndedSource) return <g key={index}></g>;
        const fromPos = positions.get(connection.from.module);
        const toPos = openEndedDest ? undefined : positions.get(connection.to.module);
        if (!fromPos || !toPos) return <g key={index}></g>;

        const toModuleData = openEndedDest ? undefined : modules.get(connection.to.module)!;
        const fromModuleData = openEndedSource ? undefined : modules.get(connection.from.module)!;
        const pinHeight = 16;
        const pinSpacing = 20;

        const fromOutputIndex = connection.from.index >= 0 ? connection.from.index : fromModuleData!.outputs.indexOf(connection.from.pin);
        const toInputIndex = connection.to.index >= 0 ? connection.to.index : toModuleData!.inputs.indexOf(connection.to.pin);
        const fromX = fromPos!.x + moduleWidth;
        const fromY = fromPos!.y + 40 + (fromOutputIndex * pinSpacing) + (pinHeight / 2);
        const toX = toPos!.x;
        const toY = toPos!.y + 40 + (toInputIndex * pinSpacing) + (pinHeight / 2);

        const colorIndex = index % cableColors.length;
        const cableColor = cableColors[colorIndex];
        const deltaX = toX - fromX;
        const deltaY = toY - fromY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const sagFactor = Math.min(0.3, distance / 600);
        const baseSag = distance * sagFactor;
        const gravitySag = Math.max(20, distance * 0.15);
        const totalSag = baseSag + gravitySag;
        const horizontalInfluence = Math.min(Math.abs(deltaX) * 0.5, 100);
        const control1X = fromX + Math.max(40, horizontalInfluence * 0.6);
        const control1Y = fromY + totalSag * 0.6;
        const control2X = toX - Math.max(40, horizontalInfluence * 0.6);
        const control2Y = toY + totalSag * 0.6;
        if (distance < 150) {
          const midX = (fromX + toX) / 2;
          const gentleSag = Math.max(15, distance * 0.1);
          const control1Y_simple = Math.max(fromY, toY) + gentleSag;
          const pathData = `M ${fromX} ${fromY} Q ${midX} ${control1Y_simple} ${toX} ${toY}`;
          return (
            <g key={index} className={styles.cableGroup}>
              <path d={pathData} stroke={cableColor.glow} strokeWidth="8" fill="none" className={styles.cableOuterGlow} />
              <defs>
                <linearGradient id={`cableGradient${index}`} x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={cableColor.gradient[0]} />
                  <stop offset="50%" stopColor={cableColor.gradient[1]} />
                  <stop offset="100%" stopColor={cableColor.gradient[2]} />
                </linearGradient>
              </defs>
              <path d={pathData} stroke={`url(#cableGradient${index})`} strokeWidth="3" fill="none" className={styles.cable} />
              <circle cx={fromX} cy={fromY} r="5" fill={cableColor.main} className={styles.connectionPlug} />
              <circle cx={toX} cy={toY} r="5" fill={cableColor.main} className={styles.connectionPlug} />
            </g>
          );
        }
        const pathData = `M ${fromX} ${fromY} C ${control1X} ${control1Y} ${control2X} ${control2Y} ${toX} ${toY}`;
        return (
          <g key={index} className={styles.cableGroup}>
            <path d={pathData} stroke={cableColor.glow} strokeWidth="8" fill="none" className={styles.cableOuterGlow} />
            <path d={pathData} stroke={cableColor.glow} strokeWidth="5" fill="none" className={styles.cableGlow} />
            <path d={pathData} stroke="rgba(0, 0, 0, 0.3)" strokeWidth="3" fill="none" transform="translate(1, 1)" className={styles.cableShadow} />
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
            <path d={pathData} stroke={`url(#cableGradient${index})`} strokeWidth="2.5" fill="none" className={styles.cable} />
            <path d={pathData} stroke={`url(#cableHighlight${index})`} strokeWidth="1" fill="none" className={styles.cableHighlight} />
            <g className={styles.plugGroup}>
              <circle cx={fromX} cy={fromY} r="6" fill="#2d3436" stroke="#636e72" strokeWidth="1" className={styles.plugShadow} />
              <circle cx={fromX} cy={fromY} r="5" fill={cableColor.main} stroke={cableColor.gradient[2]} strokeWidth="1" className={styles.connectionPlug} />
              <circle cx={fromX} cy={fromY} r="2" fill="rgba(255, 255, 255, 0.6)" className={styles.plugHighlight} />
            </g>
            <g className={styles.plugGroup}>
              <circle cx={toX} cy={toY} r="6" fill="#2d3436" stroke="#636e72" strokeWidth="1" className={styles.plugShadow} />
              <circle cx={toX} cy={toY} r="5" fill={cableColor.main} stroke={cableColor.gradient[2]} strokeWidth="1" className={styles.connectionPlug} />
              <circle cx={toX} cy={toY} r="2" fill="rgba(255, 255, 255, 0.6)" className={styles.plugHighlight} />
            </g>
          </g>
        );
      })}
    </g>
  );
};
