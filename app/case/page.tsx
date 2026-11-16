import type { Metadata } from 'next';
import EuroLayout from '@/app/components/euro/EuroLayout';
import {
  CASE_FACTS, CASE_LAYOUTS, DEFAULT_CASE_CONFIG,
  caseConfigToQuery, formatHardware, getCaseBom, getCaseHardware, getCaseLayout, parseCaseConfig,
  type CaseConfig, type LayoutId,
} from '@/lib/euro/case';
import { getCaseSteps } from '@/lib/euro/case-guide';
import Configurator from './Configurator';
import ui from '@/app/components/euro/ui.module.css';
import styles from './page.module.css';

const SITE = 'https://breadmodular.com';
const REPO = 'https://github.com/bread-modular/big-modular';   // CAD source of the case

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

// The configuration is in the address (/case?layout=double&front=grill), so
// the print list and the assembly guide of that case are in the page's HTML.
async function readConfig(searchParams: Props['searchParams']): Promise<CaseConfig> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(await searchParams)) {
    if (typeof value === 'string') params.set(key, value);
  }
  return parseCaseConfig(params);
}

// One address per layout for search engines: covers, extras and colour do not make a new page
function layoutPath(id: LayoutId): string {
  return id === DEFAULT_CASE_CONFIG.layout ? '/case' : `/case?layout=${id}`;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const layout = getCaseLayout((await readConfig(searchParams)).layout);
  const first = layout.id === DEFAULT_CASE_CONFIG.layout;
  const title = first
    ? '3D Printed Eurorack Case: Configurator, STL Files and Assembly Guide - Bread Modular'
    : `${layout.name} ${layout.hp} HP 3D Printed Eurorack Case: STL Files and Assembly Guide - Bread Modular`;
  const description = first
    ? 'Configure the Bread Modular 3D printed Eurorack case, from a 42 HP skiff to a 252 HP studio stand. Download the STL files for free and follow the step by step assembly guide.'
    : `The Bread Modular ${layout.name} case: ${layout.cases} cases, ${layout.hp} HP of 3U Eurorack. ${layout.description} Free STL files, hardware list and a step by step assembly guide.`;
  return {
    title,
    description,
    keywords: ['3d printed eurorack case', 'eurorack case stl', 'eurorack skiff', 'diy eurorack case', `${layout.hp}hp eurorack case`, 'bread modular'],
    alternates: { canonical: layoutPath(layout.id), types: { 'application/json': '/api/case' } },
    openGraph: { title, description, type: 'website', url: layoutPath(layout.id) },
    twitter: { card: 'summary', title, description },
  };
}

function jsonLd(config: CaseConfig) {
  const layout = getCaseLayout(config.layout);
  const url = `${SITE}${layoutPath(layout.id)}`;
  const name = `Bread Modular ${layout.name} 3D printed Eurorack case`;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CreativeWork',
        name,
        description: layout.description,
        url,
        isAccessibleForFree: true,
        license: 'https://opensource.org/license/mit',
        isBasedOn: REPO,
        creator: { '@type': 'Organization', name: 'Bread Modular', url: SITE },
        encodingFormat: 'model/stl',
        hasPart: getCaseBom(config).map(line => ({
          '@type': '3DModel',
          name: line.name,
          encodingFormat: 'model/stl',
          contentUrl: `${SITE}${line.url}`,
        })),
      },
      {
        '@type': 'HowTo',
        name: `How to build the ${name}`,
        description: `Step by step assembly of the ${layout.hp} HP ${layout.name} case from the 3D printed parts.`,
        url,
        supply: [
          ...getCaseBom(config).map(line => ({ '@type': 'HowToSupply', name: line.name, requiredQuantity: line.qty })),
          ...getCaseHardware(config).map(line => ({ '@type': 'HowToSupply', name: formatHardware(line) })),
        ],
        tool: [{ '@type': 'HowToTool', name: '3D printer with a 256 x 256 mm bed' }, { '@type': 'HowToTool', name: '2.5 mm hex key' }],
        step: getCaseSteps(config).map((step, i) => ({
          '@type': 'HowToStep',
          position: i + 1,
          name: step.title,
          text: [step.text, ...(step.points ?? [])].join(' '),
          url: `${url}#step-${step.id}`,
        })),
      },
    ],
  };
}

export default async function CasePage({ searchParams }: Props) {
  const config = await readConfig(searchParams);
  return (
    <EuroLayout>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd(config)).replace(/</g, '\\u003c') }} />
      <div className={ui.container}>
        <header className={`${ui.pageHead} ${styles.head}`}>
          <p className={ui.eyebrow}>3D printed case · Free STL files</p>
          <h1>Build your case.</h1>
          <p>
            A 42 HP Eurorack skiff you print yourself. Pick a layout and your covers, see it in 3D,
            download exactly the files you need and follow the steps to put it together.
          </p>
          <p className={styles.source}>
            The case is open source. <a href={REPO} className={ui.textLink}>Get the CAD files on GitHub <span aria-hidden="true">→</span></a>
          </p>
        </header>

        {/* A link to another layout lands here again: start over from its address */}
        <Configurator key={caseConfigToQuery(config)} initial={config} />

        <section className={styles.facts} aria-label="About the case">
          <div>
            <h2>The case</h2>
            <ul>
              {CASE_FACTS.map(fact => <li key={fact}>{fact}</li>)}
              <li>Open source under the MIT licence: <a href={REPO}>CAD and print files on GitHub</a></li>
            </ul>
          </div>
          <div>
            <h2>Layouts and their assembly guides</h2>
            <ul>
              {CASE_LAYOUTS.map(layout => (
                <li key={layout.id}>
                  <a href={layoutPath(layout.id)}>{layout.name}</a> ({layout.tagline}): {layout.description}
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </EuroLayout>
  );
}
