import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import EuroLayout from '@/app/components/euro/EuroLayout';
import ui from '@/app/components/euro/ui.module.css';
import { FIRMWARES, firmwareTitle, getFirmware } from '@/lib/euro/firmwares';
import FirmwarePicker from '../FirmwarePicker';
import FirmwareApp from '../FirmwareApp';
import styles from '../page.module.css';

export const dynamicParams = false;

export function generateStaticParams() {
  return FIRMWARES.map(firmware => ({ id: firmware.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const firmware = getFirmware(id);
  if (!firmware) return {};
  const title = firmware.link === 'audio'
    ? `${firmwareTitle(firmware)} for the ${firmware.module} module - Bread Modular`
    : `${firmwareTitle(firmware)} firmware - Bread Modular`;
  return {
    title,
    description: firmware.description,
    alternates: { canonical: `/firmwares/${firmware.id}` },
    openGraph: { title, description: firmware.description, type: 'website', url: `/firmwares/${firmware.id}` },
  };
}

export default async function FirmwarePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const firmware = getFirmware(id);
  if (!firmware) notFound();

  return (
    <EuroLayout>
      <div className={ui.container}>
        <header className={`${ui.pageHead} ${styles.head}`}>
          <p className={ui.eyebrow}><Link href="/firmwares">Firmwares</Link> / {firmware.module}</p>
          <h1>{firmwareTitle(firmware)}.</h1>
          <p>{firmware.description}</p>
        </header>

        <FirmwarePicker activeId={firmware.id} />
      </div>

      <div className={styles.wide}>
        <FirmwareApp firmware={firmware}>
          {firmware.link === 'audio' ? (
            <>
              Plug the module&apos;s USB-C port into your computer, press <strong>Connect</strong> and allow the audio
              input. Best in Chrome or Edge, which can pick the output too. No module? Press <strong>Demo</strong>.
            </>
          ) : (
            <>
              Plug the module&apos;s USB-C port into your computer and press <strong>Connect</strong>. It needs a browser
              with Web Serial, such as Chrome or Edge. No module? Press <strong>Demo</strong>.
            </>
          )}
        </FirmwareApp>
      </div>

      <div className={ui.container}>
        <section className={styles.features} aria-labelledby="features">
          <h2 id="features">What it does</h2>
          <ul>
            {firmware.features.map(feature => <li key={feature}>{feature}</li>)}
          </ul>
        </section>
      </div>
    </EuroLayout>
  );
}
