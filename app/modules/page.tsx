import Image from 'next/image';
import Link from 'next/link';
import Layout from '@/app/components/Layout';
import { getAllModules } from '@/lib/modules';
import type { Metadata } from 'next';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: "Modules - Bread Modular",
  description: "Explore our range of affordable, open-source modular synthesizer modules.",
};

export default async function ModulesPage() {
  const modules = await getAllModules();
  const featuredModule = modules.find(m => m.featured);
  const regularModules = modules.filter(m => !m.featured);

  return (
    <Layout>
      {/* Featured Module */}
      {featuredModule && (
        <section className={styles.featuredModule} aria-label="Featured module">
          <Link href={`/modules/${featuredModule.id}`}>
            <article className={styles.moduleCard}>
              <div className={styles.moduleImageContainer}>
                <Image
                  src={featuredModule.image}
                  alt={featuredModule.title}
                  fill
                  className={styles.moduleImage}
                  sizes="(max-width: 768px) 100vw, 1024px"
                />
              </div>
              <div className={styles.moduleContent}>
                <h2 className={styles.moduleTitle}>{featuredModule.title}</h2>
                <p className={styles.moduleDescription}>{featuredModule.description}</p>
              </div>
            </article>
          </Link>
        </section>
      )}

      {/* Module Grid */}
      <section aria-label="All modules" className={styles.moduleGrid}>
        {regularModules.map((module) => (
          <Link 
            key={module.id}
            href={`/modules/${module.id}`}
            className={`${
              module.size === 'double' ? styles.moduleDouble : 
              module.size === 'triple' ? styles.moduleTriple : ''
            }`}
          >
            <article className={styles.moduleCard}>
              <div className={styles.moduleImageContainer}>
                <Image
                  src={module.image}
                  alt={module.title}
                  fill
                  className={styles.moduleImage}
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              </div>
              <div className={styles.moduleContent}>
                <h2 className={styles.smallModuleTitle}>{module.title}</h2>
                <p className={styles.smallModuleDescription}>{module.description}</p>
              </div>
            </article>
          </Link>
        ))}
      </section>
    </Layout>
  );
} 