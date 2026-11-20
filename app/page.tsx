import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import EuroLayout from './components/euro/EuroLayout';
import HeroRack from './components/euro/HeroRack';
import NewsletterSignup from './components/NewsletterSignup';
import { getAllBlogPosts } from '@/lib/blog';
import { SOCIAL_IMAGE, SOCIAL_SITE } from '@/lib/euro/social';
import ui from './components/euro/ui.module.css';
import styles from './home.module.css';

const title = 'Bread Modular - Eurorack Made Affordable';
const description = 'Bread Modular: Eurorack Made Affordable. A complete system with MIDI native modules.';

export const metadata: Metadata = {
  title,
  description,
  keywords: ['bread modular', 'eurorack', 'eurorack modules', '3d printed eurorack case', 'modular synth', 'synthesizer'],
  alternates: { canonical: '/' },
  openGraph: { ...SOCIAL_SITE, title, description, images: [SOCIAL_IMAGE], type: 'website', url: '/' },
  twitter: { card: 'summary_large_image', title, description, images: [SOCIAL_IMAGE] },
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

export default async function Home() {
  const [latestPost] = await getAllBlogPosts();

  return (
    <EuroLayout>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />

      <section className={`${ui.container} ${styles.hero}`} aria-labelledby="home-title">
        <div className={styles.heroIntro}>
          <div>
            <h1 id="home-title" className={styles.heroTitle}>Eurorack Made <span>Affordable</span></h1>
          </div>
          <div className={styles.heroCopy}>
            <p className={styles.heroSecond}>A complete system with MIDI native modules.</p>
            <p className={styles.heroText}>
              Launching in 2027. For now, 3D print our Eurorack cases.
            </p>
            <div className={styles.heroActions}>
              <Link href="/eurorack-case" className={ui.button}>Make your 3D printed case <span aria-hidden="true">→</span></Link>
            </div>
          </div>
        </div>

        <figure className={styles.rackWrap}>
          <div className={styles.rackStage}>
            <HeroRack />
          </div>
          <figcaption className={styles.rackCaption}>
            <span><strong>One case. Room to grow.</strong> From 42 HP to a 252 HP studio set.</span>
          </figcaption>
        </figure>
      </section>

      <div className={ui.container}>
        <section id="home-updates" className={styles.updates} aria-labelledby="home-instagram">
          <div className={styles.instagram}>
            <div>
              <p className={styles.eyebrow}>From the workbench</p>
              <h2 id="home-instagram" className={styles.sectionTitle}>Follow the build.</h2>
              <p className={styles.sectionText}>
                See what we’re working on, one update at a time.<br className={styles.desktopBreak} />
                {' '}Follow our progress towards the 2027 launch on Instagram.
              </p>
            </div>
            <a href="https://instagram.com/breadmodular" className={styles.instagramLink}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none" />
              </svg>
              <span><strong>@breadmodular</strong><span>Follow on Instagram</span></span>
              <span className={styles.linkArrow} aria-hidden="true">↗</span>
            </a>
          </div>
          <div className={styles.newsletter}>
            <NewsletterSignup variant="minimal" />
          </div>
        </section>

        <nav className={styles.socials} aria-label="More from the community">
          <div>
            <a href="https://youtube.com/@breadmodular" className={styles.textLink}>Tutorials on YouTube <span aria-hidden="true">↗</span></a>
          </div>
        </nav>

        {latestPost && (
          <section className={styles.latest} aria-labelledby="home-latest">
            <p className={styles.eyebrow}>From the blog</p>
            <Link href={`/blog/${latestPost.slug}`} className={styles.latestCard}>
              {latestPost.image && (
                <div className={styles.latestImage}>
                  <Image src={latestPost.image} alt="" fill sizes="(max-width: 760px) 100vw, 420px" />
                </div>
              )}
              <div className={styles.latestBody}>
                <time dateTime={latestPost.date} className={styles.latestDate}>
                  {new Date(latestPost.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}
                </time>
                <h2 id="home-latest" className={styles.latestTitle}>{latestPost.title}</h2>
                <p className={styles.sectionText}>{latestPost.summary}</p>
                <span className={styles.latestMore}>Read the post <span aria-hidden="true">→</span></span>
              </div>
            </Link>
            <Link href="/blog" className={styles.textLink}>All posts <span aria-hidden="true">→</span></Link>
          </section>
        )}

        <section className={styles.original} aria-labelledby="home-original">
          <div>
            <p className={styles.eyebrow}>Where it started</p>
            <h2 id="home-original" className={styles.originalTitle}>Bread Modular Original</h2>
            <p className={styles.sectionText}>
              Our affordable, open source modular synth platform with modular MIDI and USB-C power. Still here, still yours to explore.
            </p>
          </div>
          <Link href="/original" className={styles.textLink}>Explore Original <span aria-hidden="true">→</span></Link>
        </section>
      </div>
    </EuroLayout>
  );
}
