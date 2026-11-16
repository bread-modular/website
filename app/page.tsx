import Link from 'next/link';
import type { Metadata } from 'next';
import EuroLayout from './components/euro/EuroLayout';
import HeroRack from './components/euro/HeroRack';
import NewsletterSignup from './components/NewsletterSignup';
import ui from './components/euro/ui.module.css';
import styles from './home.module.css';

const title = 'Bread Modular - Eurorack Made Affordable';
const description = 'Bread Modular: Eurorack Made Affordable. A complete system with MIDI native modules. Launching in 2027. For now, 3D print our Eurorack cases from free STL files.';

export const metadata: Metadata = {
  title,
  description,
  keywords: ['bread modular', 'eurorack', 'eurorack modules', '3d printed eurorack case', 'modular synth', 'synthesizer'],
  alternates: { canonical: '/' },
  openGraph: { title, description, images: ['/images/home-slide/01.jpg'], type: 'website', url: '/' },
  twitter: { card: 'summary_large_image', title, description, images: ['/images/home-slide/01.jpg'] },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      name: 'Bread Modular',
      url: 'https://breadmodular.com',
      logo: 'https://breadmodular.com/images/bread-modular-logo.png',
      slogan: 'Eurorack Made Affordable',
      sameAs: ['https://instagram.com/breadmodular', 'https://youtube.com/@breadmodular', 'https://github.com/bread-modular/bread-modular'],
    },
    { '@type': 'WebSite', name: 'Bread Modular', url: 'https://breadmodular.com', description },
  ],
};

export default function Home() {
  return (
    <EuroLayout>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />

      <section className={styles.hero} aria-label="Introduction">
        <div className={ui.container}>
          <h1 className={styles.heroTitle}>Eurorack Made Affordable</h1>
          <p className={styles.heroSecond}>A complete system with MIDI native modules.</p>
          <p className={styles.heroText}>
            Launching in 2027. For now, 3D print our Eurorack cases.
          </p>
          <div className={styles.heroActions}>
            <Link href="/case" className={ui.button}>Make your 3D printed case</Link>
          </div>
        </div>
        <div className={styles.rackWrap}>
          <div className={styles.rackStage}>
            <HeroRack />
          </div>
          <p className={styles.rackCaption}>
            The case configurator, playing by itself: from one 42 HP case to a 252 HP studio set. The modules are still in the works.
          </p>
        </div>
      </section>

      <section className={ui.container} aria-labelledby="home-instagram">
        <div className={`${styles.callout} ${styles.calloutFirst}`}>
          <div>
            <p className={ui.eyebrow}>Updates</p>
            <h2 id="home-instagram" className={styles.calloutTitle}>Follow the progress on Instagram</h2>
            <p className={styles.sectionText}>
              We post updates there on the way to the 2027 launch.
            </p>
          </div>
          <Link href="https://instagram.com/breadmodular" className={ui.button}>@breadmodular on Instagram</Link>
        </div>
      </section>

      <div className={styles.newsletter}>
        <NewsletterSignup />
      </div>

      <section className={ui.container} aria-label="Social media links">
        <nav className={styles.socials} aria-label="Social media navigation">
          <Link href="https://youtube.com/@breadmodular">YouTube <span>for tutorials</span></Link>
          <Link href="https://discord.gg/W72YQKU7mq">Discord <span>for discussions</span></Link>
        </nav>
      </section>

      <section className={ui.container} aria-labelledby="home-original">
        <div className={styles.callout}>
          <div>
            <p className={ui.eyebrow}>Still here</p>
            <h2 id="home-original" className={styles.calloutTitle}>Bread Modular Original</h2>
            <p className={styles.sectionText}>
              The affordable, open source modular synth platform with modular MIDI and USB-C power.
            </p>
          </div>
          <Link href="/original" className={ui.buttonGhost}>See Original</Link>
        </div>
      </section>
    </EuroLayout>
  );
}
