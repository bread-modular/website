import Link from "next/link";
import Image from "next/image";
import ImageSlideshow from "./components/ImageSlideshow";
import type { Metadata } from "next";
import styles from './page.module.css';

export const metadata: Metadata = {
  title: "Bread Modular - Affordable Modular Synth Platform",
  description: "An open-source, affordable modular synthesizer platform using modern electronics and minimalistic design. Features USB-C power, MIDI, and more.",
  keywords: ["modular synth", "synthesizer", "DIY electronics", "open source hardware", "USB-C", "MIDI", "affordable synth"],
  openGraph: {
    title: "Bread Modular - Affordable Modular Synth Platform",
    description: "Open-source modular synthesizer platform with modern features and minimalistic design.",
    images: ["/images/home-slide/01.JPEG"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bread Modular - Affordable Modular Synth Platform",
    description: "Open-source modular synthesizer platform with modern features and minimalistic design.",
    images: ["/images/home-slide/01.JPEG"],
  },
};

export default function Home() {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        {/* Header */}
        <header className={styles.headerContent} role="banner">
          <Link href="/" className={styles.logo} aria-label="Bread Modular Home">
            <Image 
              src="/images/bread-modular-logo.png"
              alt="Bread Modular Logo"
              width={250}
              height={67}
              style={{ objectFit: 'contain', width: 'auto', height: 'auto' }}
            />
          </Link>
          <nav className={styles.nav} aria-label="Main navigation">
            <ul>
              <li><Link href="/modules">MODULES</Link></li>
              <li><Link href="/docs">DOCS</Link></li>
              <li><Link href="/contact">CONTACT</Link></li>
            </ul>
          </nav>
        </header>
        <div className={styles.separator} role="separator"></div>
      </div>

      {/* Main Content */}
      <main className={styles.main} role="main">
        <section aria-label="Product showcase slideshow" className={styles.slideshowSection}>
          <ImageSlideshow />
        </section>
        <section aria-label="Hero section" className={styles.heroSection}>
          <h1 className={styles.heroTitle}>AN AFFORDABLE<br />MODULAR SYNTH PLATFORM</h1>
        </section>
        <section id="key-features" aria-label="Key features" className={styles.featuresSection}>
          <article className={styles.featureArticle}>
            <div className={styles.featureContent}>
              <div>
                <h2 className={styles.featureHeader}><span style={{ fontWeight: 'bold' }}>Minimal</span> Design</h2>
                <p className={styles.featureText}>We use modern electronics with minimalistic design to keep the cost down.</p>
                <Link 
                  href="/how" 
                  className={styles.featureLink}
                  aria-label="Learn more about our minimalistic design"
                >
                  SEE HOW
                </Link>
              </div>
              <div className={styles.featureImage}>
                <p className={styles.featureImageText}>Module Image</p>
              </div>
            </div>
          </article>

          <article className={styles.featureArticle}>
            <div className={styles.featureContent}>
              <div>
                <h2 className={styles.featureHeader}><span style={{ fontWeight: 'bold' }}>Open Source</span> From Day One</h2>
                <p className={styles.featureText}>Everything is Open Source including schematics, PCB design & code.</p>
                <Link 
                  href="/how" 
                  className={styles.featureLink}
                  aria-label="Learn more about our open source policy"
                >
                  LEARN MORE
                </Link>
              </div>
              <div className={styles.featureImage}>
                <p className={styles.featureImageText}>Circuit Image</p>
              </div>
            </div>
          </article>

          <article className={styles.featureArticle}>
            <div className={styles.featureContent}>
              <div>
                <h2 className={styles.featureHeader}><span style={{ fontWeight: 'bold' }}>Modern</span> Capabitlies</h2>
                <p className={styles.featureText}>We use proven analog designs while leveraging modern features like<br/>Modular MIDI & USB-C Power.</p>
                <Link 
                  href="/how" 
                  className={styles.featureLink}
                  aria-label="Explore the modern capabilities of Bread Modular"
                >
                  EXPLORE FEATURES
                </Link>
              </div>
              <div className={styles.featureImage}>
                <p className={styles.featureImageText}>Interface Image</p>
              </div>
            </div>
          </article>
        </section>

        {/* CTA Button */}
        <section aria-label="Call to action" className={styles.ctaSection}>
          <Link 
            href="/get-started" 
            className={styles.ctaButton}
            role="button"
            aria-label="Get started with Bread Modular"
          >
            GET STARTED NOW
          </Link>
        </section>

        {/* Social Links */}
        <section aria-label="Social media links" className={styles.socialSection}>
          <div className={styles.socialSeparator} role="separator"></div>
          <h2 className={styles.socialTitle}>FIND US ON SOCIALS</h2>
          <nav className={styles.socialNav} aria-label="Social media navigation">
            <Link href="https://instagram.com/breadmodular" className={styles.socialLink} aria-label="Follow us on Instagram for updates">
              INSTAGRAM FOR UPDATES
            </Link>
            <Link href="https://youtube.com/@breadmodular" className={styles.socialLink} aria-label="Watch our tutorials on YouTube">
              YOUTUBE FOR TUTORIALS
            </Link>
            <Link href="https://discord.gg/breadmodular" className={styles.socialLink} aria-label="Join our Discord community for discussions">
              DISCORD FOR DISCUSSIONS
            </Link>
          </nav>
        </section>
      </main>
    </div>
  );
}
