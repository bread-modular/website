'use client';

import { useEffect, useRef, useState } from 'react';
import s from './lab.module.css';

// Knobs, steppers and choices in the style of the 32bit Master page.

const ARC = 270;
const R = 15;

function polar(deg: number) {
  const a = ((deg - 90) * Math.PI) / 180;
  return [20 + R * Math.cos(a), 20 + R * Math.sin(a)];
}

function arc(from: number, to: number) {
  if (Math.abs(to - from) < 0.01) return '';
  const [x1, y1] = polar(from);
  const [x2, y2] = polar(to);
  const large = Math.abs(to - from) > 180 ? 1 : 0;
  const sweep = to > from ? 1 : 0;
  return `M${x1} ${y1}A${R} ${R} 0 ${large} ${sweep} ${x2} ${y2}`;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

// The wheel turns a control and not the page (React's wheel listeners are passive)
function useWheel<T extends Element>(onWheel: (e: WheelEvent) => void) {
  const ref = useRef<T>(null);
  const handler = useRef(onWheel);
  useEffect(() => { handler.current = onWheel; });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const listener = (e: Event) => {
      e.preventDefault();
      handler.current(e as WheelEvent);
    };
    el.addEventListener('wheel', listener, { passive: false });
    return () => el.removeEventListener('wheel', listener);
  }, []);
  return ref;
}

// Wheel notches from a mouse (100) or many small steps from a touchpad
function wheelSteps(e: WheelEvent, acc: { current: number }) {
  acc.current += e.deltaMode === 1 ? e.deltaY * 33 : e.deltaY;
  const steps = Math.trunc(acc.current / 50);
  acc.current -= steps * 50;
  return -steps;
}

export interface KnobProps {
  label: string;
  value: number;
  min: number;
  max: number;
  log?: boolean;
  // the knob's centre value (offsets): the arc starts there
  bipolar?: boolean;
  defaultValue: number;
  format: (v: number) => string;
  // parses what is typed into the value box (default: a number)
  parse?: (text: string) => number;
  round?: (v: number) => number;
  onChange: (v: number) => void;
  disabled?: boolean;
  title?: string;
}

// A knob: drag up / down (Shift = fine), the wheel or the arrow keys turn it,
// double-click resets it, a click on the value types one in.
export function Knob({ label, value, min, max, log, bipolar, defaultValue, format, parse, round, onChange, disabled, title }: KnobProps) {
  const [editing, setEditing] = useState(false);
  const drag = useRef<{ y: number; pos: number } | null>(null);
  const wheelAcc = useRef(0);

  const toPos = (v: number) => (log ? Math.log(v / min) / Math.log(max / min) : (v - min) / (max - min));
  const fromPos = (p: number) => {
    const v = log ? min * Math.pow(max / min, clamp(p, 0, 1)) : min + (max - min) * clamp(p, 0, 1);
    return round ? clamp(round(v), min, max) : v;
  };
  const pos = clamp(toPos(value), 0, 1);
  const start = -ARC / 2;
  const angle = start + pos * ARC;
  const zero = bipolar ? start + clamp(toPos(0), 0, 1) * ARC : start;
  const [px, py] = polar(angle);
  const nudge = (steps: number, fine: boolean) => onChange(fromPos(pos + steps * (fine ? 0.002 : 0.01)));
  const svgRef = useWheel<SVGSVGElement>(e => {
    const steps = wheelSteps(e, wheelAcc);
    if (!disabled && steps) nudge(steps, e.shiftKey);
  });

  const commit = (text: string) => {
    setEditing(false);
    const v = parse ? parse(text) : parseFloat(text);
    if (Number.isFinite(v)) onChange(clamp(round ? round(v) : v, min, max));
  };

  return (
    <div className={`${s.kn} ${disabled ? s.off : ''}`} title={title}>
      <span className={s.klabel}>{label}</span>
      <svg
        ref={svgRef}
        viewBox="0 0 40 40"
        tabIndex={disabled ? -1 : 0}
        role="slider"
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={format(value)}
        onPointerDown={e => {
          if (disabled) return;
          e.currentTarget.setPointerCapture(e.pointerId);
          drag.current = { y: e.clientY, pos };
        }}
        onPointerMove={e => {
          const d = drag.current;
          if (!d) return;
          const dy = d.y - e.clientY;
          d.y = e.clientY;
          d.pos = clamp(d.pos + dy / (e.shiftKey ? 1000 : 200), 0, 1);
          onChange(fromPos(d.pos));
        }}
        onPointerUp={() => { drag.current = null; }}
        onPointerCancel={() => { drag.current = null; }}
        onDoubleClick={() => !disabled && onChange(defaultValue)}
        onKeyDown={e => {
          if (disabled) return;
          if (e.key === 'ArrowUp' || e.key === 'ArrowRight') { nudge(1, e.shiftKey); e.preventDefault(); }
          if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') { nudge(-1, e.shiftKey); e.preventDefault(); }
        }}
      >
        <circle className={s.kbody} cx="20" cy="20" r="11" />
        <path className={s.ktrack} d={arc(start, start + ARC)} />
        <path className={s.kval} d={arc(Math.min(zero, angle), Math.max(zero, angle))} />
        <line className={s.kptr} x1={20 + (px - 20) * 0.3} y1={20 + (py - 20) * 0.3} x2={20 + (px - 20) * 0.66} y2={20 + (py - 20) * 0.66} />
      </svg>
      {editing ? (
        <input
          autoFocus
          defaultValue={format(value)}
          onFocus={e => e.currentTarget.select()}
          onBlur={e => commit(e.currentTarget.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') commit(e.currentTarget.value);
            if (e.key === 'Escape') setEditing(false);
          }}
        />
      ) : (
        <span className={s.kvalue} onClick={() => !disabled && setEditing(true)}>{format(value)}</span>
      )}
    </div>
  );
}

// A value from a list, stepped with ‹ › or the wheel
export function Stepper<T>({ label, options, value, format, onChange, title }: {
  label: string;
  options: readonly T[];
  value: T;
  format: (v: T) => string;
  onChange: (v: T) => void;
  title?: string;
}) {
  const i = Math.max(0, options.indexOf(value));
  const go = (d: number) => onChange(options[clamp(i + d, 0, options.length - 1)]);
  const wheelAcc = useRef(0);
  const boxRef = useWheel<HTMLDivElement>(e => {
    const steps = wheelSteps(e, wheelAcc);
    if (steps) go(Math.sign(steps));
  });
  return (
    <div className={s.stepper} title={title}>
      <span className={s.klabel}>{label}</span>
      <div className={s.stepbox} ref={boxRef}>
        <button type="button" onClick={() => go(-1)} disabled={i === 0} aria-label={`${label} down`}>‹</button>
        <span>{format(value)}</span>
        <button type="button" onClick={() => go(1)} disabled={i === options.length - 1} aria-label={`${label} up`}>›</button>
      </div>
    </div>
  );
}

// A row of choices, one selected
export function Seg<T extends string | number>({ options, value, onChange, labels, disabled, title }: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  labels?: Partial<Record<T, string>>;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <div className={`${s.seg} ${disabled ? s.off : ''}`} role="radiogroup" title={title}>
      {options.map(o => (
        <button
          key={o}
          type="button"
          role="radio"
          aria-checked={o === value}
          className={o === value ? s.sel : undefined}
          onClick={() => !disabled && onChange(o)}
        >
          {labels?.[o] ?? o}
        </button>
      ))}
    </div>
  );
}

// An on / off switch
export function Toggle({ on, onChange, children, title, className, style }: {
  on: boolean;
  style?: React.CSSProperties;
  onChange: (on: boolean) => void;
  children: React.ReactNode;
  title?: string;
  className?: string;
}) {
  return (
    <button type="button" className={`${s.tg} ${on ? s.on : ''} ${className ?? ''}`} aria-pressed={on} onClick={() => onChange(!on)} title={title} style={style}>
      {children}
    </button>
  );
}
