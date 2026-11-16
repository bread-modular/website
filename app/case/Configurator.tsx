'use client';

import { useMemo, useState } from 'react';
import {
  CASE_COLORS, CASE_COVERS, CASE_LAYOUTS,
  caseConfigToQuery, formatBytes, getCaseBom, getCaseHardware, getCaseSummary,
  normalizeCaseConfig,
  type CaseConfig, type CoverId,
} from '@/lib/euro/case';
import { casePrintList, getCaseSteps } from '@/lib/euro/case-guide';
import LayoutIcon from '@/app/components/euro/LayoutIcon';
import CaseViewer from './CaseViewer';
import type { CaseView } from './scene';
import { createZip } from './zip';
import ui from '@/app/components/euro/ui.module.css';
import styles from './page.module.css';

function CoverSwatch({ id }: { id: CoverId }) {
  const holes: React.ReactNode[] = [];
  if (id === 'grill') for (let x = 6; x < 50; x += 5) holes.push(<rect key={x} x={x} y={5} width={2.4} height={14} rx={1.2} />);
  if (id === 'louvres') for (let y = 5; y < 20; y += 5.4) holes.push(<rect key={y} x={6} y={y} width={44} height={2.6} rx={1.3} />);
  if (id === 'honeycomb') {
    for (let row = 0; row < 2; row++) {
      for (let x = 9 + row * 4; x < 50; x += 8) {
        const y = 8 + row * 8;
        holes.push(<path key={`${row}-${x}`} d={`M${x} ${y - 3.6}l3.1 1.8v3.6l-3.1 1.8-3.1-1.8v-3.6z`} />);
      }
    }
  }
  if (id === 'diamonds') for (let x = 10; x < 50; x += 9) holes.push(<path key={x} d={`M${x} 6l4 6-4 6-4-6z`} />);
  if (id === 'perforated') {
    for (let row = 0; row < 4; row++) {
      for (let x = 6 + (row % 2) * 2; x < 52; x += 4) holes.push(<circle key={`${row}-${x}`} cx={x} cy={5.5 + row * 4.3} r={1.1} />);
    }
  }
  return (
    <svg viewBox="0 0 56 24" className={styles.coverSwatch} aria-hidden="true">
      <rect width={56} height={24} rx={3} fill="#1b1b1d" />
      <g fill="#f6f6f4">{holes}</g>
    </svg>
  );
}

// "Two tier, Double two tier or Studio"
function listNames(names: string[]): string {
  return names.length > 1 ? `${names.slice(0, -1).join(', ')} or ${names[names.length - 1]}` : names.join('');
}

interface Props {
  initial: CaseConfig;   // from the page address, so the first HTML already shows this case
}

export default function Configurator({ initial }: Props) {
  const [config, setConfig] = useState<CaseConfig>(initial);
  const [showModules, setShowModules] = useState(true);
  const [stepId, setStepId] = useState<string | null>(null);
  const [download, setDownload] = useState<'idle' | 'working' | 'error'>('idle');

  function change(patch: Partial<CaseConfig>) {
    const next = normalizeCaseConfig({ ...config, ...patch });
    setConfig(next);
    // A shared link carries the configuration in its query string
    window.history.replaceState(null, '', `${window.location.pathname}?${caseConfigToQuery(next)}`);
  }

  const layout = CASE_LAYOUTS.find(l => l.id === config.layout)!;
  const bom = getCaseBom(config);
  const summary = getCaseSummary(config);
  const hardware = getCaseHardware(config);
  const steps = useMemo(() => getCaseSteps(config), [config]);
  const stepIndex = steps.findIndex(s => s.id === stepId);
  const step = stepIndex < 0 ? null : steps[stepIndex];

  // The preview shows the finished case, or the case as it is at the chosen step
  const view = useMemo<CaseView>(() => (
    step
      ? { modules: step.show.includes('modules'), show: step.show, focus: step.focus, arrange: step.arrange }
      : { modules: showModules, show: null, focus: [], arrange: 'built' }
  ), [step, showModules]);

  function showStep(index: number) {
    const next = steps[index];
    if (!next) return;
    setStepId(next.id);
    document.getElementById(`step-${next.id}`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  async function downloadZip() {
    setDownload('working');
    try {
      const folder = `bread-modular-case-${config.layout}`;
      const files = await Promise.all(bom.map(async line => {
        const response = await fetch(line.url);
        if (!response.ok) throw new Error(`Could not load ${line.file}`);
        return { name: `${folder}/${line.qty}x-${line.file}`, data: new Uint8Array(await response.arrayBuffer()) };
      }));
      const list = new TextEncoder().encode(casePrintList(config, window.location.origin));
      const url = URL.createObjectURL(createZip([{ name: `${folder}/PRINT-LIST.txt`, data: list }, ...files]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `${folder}.zip`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      setDownload('idle');
    } catch {
      setDownload('error');
    }
  }

  const downloadLabel = download === 'working' ? 'Preparing files…' : `Download STL files (${formatBytes(summary.bytes)})`;

  return (
    <div className={styles.configurator}>
      <div className={styles.stage}>
        <CaseViewer config={config} view={view}>
          {step ? (
            <div className={styles.stepBar}>
              <button type="button" onClick={() => showStep(stepIndex - 1)} disabled={stepIndex === 0} aria-label="Previous step">‹</button>
              <p>
                <small>Step {stepIndex + 1} of {steps.length}</small>
                <strong>{step.title}</strong>
              </p>
              <button type="button" onClick={() => showStep(stepIndex + 1)} disabled={stepIndex === steps.length - 1} aria-label="Next step">›</button>
              <button type="button" className={styles.stepDone} onClick={() => setStepId(null)}>Finished case</button>
            </div>
          ) : (
            <button type="button" className={styles.stepStart} onClick={() => showStep(0)}>
              See how it goes together <span aria-hidden="true">→</span>
            </button>
          )}
        </CaseViewer>
      </div>

      <div className={styles.panel}>
        <div className={styles.configure}>
          <div className={styles.options}>
            <fieldset className={styles.group}>
              <legend><span>1</span> Layout</legend>
              <div className={styles.layoutGrid}>
                {CASE_LAYOUTS.map(option => (
                  <button
                    key={option.id}
                    type="button"
                    className={option.id === config.layout ? styles.optionActive : styles.option}
                    aria-pressed={option.id === config.layout}
                    onClick={() => { setStepId(null); change({ layout: option.id }); }}
                  >
                    <LayoutIcon id={option.id} className={styles.layoutIcon} />
                    <strong>{option.name}</strong>{' '}
                    <small>{option.tagline}</small>
                  </button>
                ))}
              </div>
              <p className={styles.groupNote}>
                {layout.description}
                {layout.braces > 0 && ' A top brace over the middle frame ties the cases together.'}
              </p>
            </fieldset>

            {(['front', 'back'] as const).map((side, i) => (
              <fieldset key={side} className={styles.group}>
                <legend><span>{i + 2}</span> {side === 'front' ? 'Front cover' : 'Back cover'}</legend>
                <div className={styles.coverGrid}>
                  {CASE_COVERS.map(cover => (
                    <button
                      key={cover.id}
                      type="button"
                      className={cover.id === config[side] ? styles.optionActive : styles.option}
                      aria-pressed={cover.id === config[side]}
                      onClick={() => change(side === 'front' ? { front: cover.id } : { back: cover.id })}
                    >
                      <CoverSwatch id={cover.id} />
                      <small>{cover.name}</small>
                    </button>
                  ))}
                </div>
              </fieldset>
            ))}

            <fieldset className={styles.group}>
              <legend><span>4</span> Extras</legend>
              <label className={layout.cableHolders ? styles.toggle : styles.toggleDisabled}>
                <input type="checkbox" checked={config.cable} disabled={!layout.cableHolders} onChange={e => change({ cable: e.target.checked })} />
                <span>
                  <strong>Cable holder</strong>{' '}
                  <small>A clip-on comb for patch cables on the tilted row. For every layout on the stand.</small>
                </span>
              </label>
              {!layout.cableHolders && (
                <p className={styles.groupNote}>
                  Not available for the {layout.name} case. The comb is made for a case tilted at 60 degrees,
                  where the back cover faces up, and this layout lies flat. Pick{' '}
                  {listNames(CASE_LAYOUTS.filter(option => option.cableHolders > 0).map(option => option.name))} to add it.
                </p>
              )}
            </fieldset>

            <fieldset className={styles.group}>
              <legend><span>5</span> Preview</legend>
              <div className={styles.colorRow}>
                {CASE_COLORS.map(color => (
                  <button
                    key={color.id}
                    type="button"
                    className={color.id === config.color ? styles.colorActive : styles.color}
                    style={{ background: color.hex }}
                    aria-pressed={color.id === config.color}
                    aria-label={`${color.name} filament`}
                    title={color.name}
                    onClick={() => change({ color: color.id })}
                  />
                ))}
              </div>
              <p className={styles.groupNote}>Filament colour is for the preview only. The files are the same.</p>
              <label className={step ? styles.toggleDisabled : styles.toggle}>
                <input type="checkbox" checked={showModules} disabled={!!step} onChange={e => setShowModules(e.target.checked)} />
                <span><strong>Show modules</strong>{' '}<small>Fill the case, or look inside it.</small></span>
              </label>
            </fieldset>
          </div>

          <section className={styles.result} aria-labelledby="print-list">
            <p className={ui.eyebrow}>Your case</p>
            <h2 id="print-list">{layout.name} · {layout.hp} HP</h2>
            <p className={styles.resultMeta}>
              {layout.cases} {layout.cases === 1 ? 'case' : 'cases'} · {summary.prints} parts to print · {summary.files} different files
            </p>
            <div className={styles.resultActions}>
              <button type="button" className={ui.button} onClick={downloadZip} disabled={download === 'working'}>
                {downloadLabel}
              </button>
              {download === 'error' && <p className={styles.error} role="alert">Download failed. Try again, or use the links below.</p>}
            </div>

            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr><th>Print</th><th>Part</th><th>STL file</th></tr>
                </thead>
                <tbody>
                  {bom.map(line => (
                    <tr key={line.id}>
                      <td className={styles.qty}>{line.qty}×</td>
                      <td>
                        {line.name}{' '}
                        {line.note && <small>{line.note}</small>}
                      </td>
                      <td>
                        <a href={line.url} download>{line.file}</a>{' '}
                        <small>{formatBytes(line.bytes)}</small>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h3 className={styles.hardwareTitle}>Hardware you also need</h3>
            <ul className={styles.hardware}>
              {hardware.map(line => (
                <li key={line.item + line.use}>
                  <span className={styles.qty}>{line.qty === null ? '' : `${line.qty}×`}</span>{' '}
                  <span>
                    {line.item}{' '}
                    <small>{line.use}</small>
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <div className={styles.mobileBar}>
            <span><strong>{layout.name}</strong> · {summary.prints} parts</span>
            <button type="button" className={ui.button} onClick={downloadZip} disabled={download === 'working'}>
              {download === 'working' ? 'Preparing…' : 'Download STL'}
            </button>
          </div>
        </div>

        <section className={styles.guide} aria-labelledby="assembly-guide">
          <p className={ui.eyebrow}>Assembly guide</p>
          <h2 id="assembly-guide">How to build the {layout.name} case</h2>
          <p className={styles.guideIntro}>
            {steps.length} steps, from the printed parts to a case with modules in it.
            Select a step to see its parts and the state of the case in the 3D preview.
          </p>
          <ol className={styles.steps}>
            {steps.map((item, i) => {
              const active = item.id === stepId;
              return (
                <li key={item.id} id={`step-${item.id}`} className={active ? styles.stepActive : styles.step}>
                  <h3>
                    <button type="button" aria-pressed={active} onClick={() => setStepId(active ? null : item.id)}>
                      <span className={styles.stepNum}>{i + 1}</span>{' '}
                      <span className={styles.stepTitle}>{item.title}</span>{' '}
                      <span className={styles.stepShow}>{active ? 'Showing in 3D' : 'Show in 3D'}</span>
                    </button>
                  </h3>
                  <p>{item.text}</p>
                  {item.points && <ul>{item.points.map(point => <li key={point}>{point}</li>)}</ul>}
                  <p className={styles.stepNeeds}><strong>You need:</strong> {item.needs.join(', ')}.</p>
                </li>
              );
            })}
          </ol>
        </section>
      </div>
    </div>
  );
}
