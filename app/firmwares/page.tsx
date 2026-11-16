import type { Metadata } from 'next';
import Link from 'next/link';
import EuroLayout from '@/app/components/euro/EuroLayout';
import ui from '@/app/components/euro/ui.module.css';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Firmwares - Bread Modular',
  description: 'Firmwares for Bread Modular Eurorack modules are on the way.',
  alternates: { canonical: '/firmwares' },
};

export default function Firmwares() {
  return (
    <EuroLayout>
      <div className={ui.container}>
        <header className={ui.pageHead}>
          <span className={ui.badge}>Coming soon</span>
          <h1>Firmwares.</h1>
          <p>Firmwares for the digital Eurorack modules are on the way. This is where you will find and install them.</p>
        </header>

        <section className={styles.original} aria-labelledby="original-apps">
          <div>
            <p className={ui.eyebrow}>Bread Modular Original</p>
            <h2 id="original-apps">Looking for the Original web apps?</h2>
            <p>The 16bit and 32bit apps for Bread Modular Original are still where they were.</p>
          </div>
          <div className={styles.links}>
            <Link href="/ui/16bit" className={ui.buttonGhost}>Open the 16bit UI</Link>
            <Link href="/ui/32bit" className={ui.buttonGhost}>Open the 32bit UI</Link>
          </div>
        </section>
      </div>
    </EuroLayout>
  );
}
