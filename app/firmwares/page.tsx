import type { Metadata } from 'next';
import Link from 'next/link';
import EuroLayout from '@/app/components/euro/EuroLayout';
import ui from '@/app/components/euro/ui.module.css';
import FirmwarePicker from './FirmwarePicker';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Firmwares - Bread Modular',
  description: 'Settings pages for the firmwares of the digital Bread Modular Eurorack modules. They run in your browser and talk to the module over USB.',
  alternates: { canonical: '/firmwares' },
};

export default function Firmwares() {
  return (
    <EuroLayout>
      <div className={ui.container}>
        <header className={ui.pageHead}>
          <span className={ui.badge}>Modules launch in 2027</span>
          <h1>Firmwares.</h1>
          <p>Settings pages for the firmwares of the digital Eurorack modules. They run in your browser and talk to the module over USB. Pick a firmware to open it.</p>
        </header>

        <FirmwarePicker />
        <p className={styles.pickHint}>No module yet? Open a firmware and press <strong>Demo</strong> to try every control.</p>

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
