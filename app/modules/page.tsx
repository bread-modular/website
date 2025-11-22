import Image from 'next/image';
import Link from 'next/link';
import Layout from '@/app/components/Layout';
import { getModuleData } from '@/lib/modules';
import { modulesDisplayConfig, categoryOrder, type ModuleDisplayConfig } from './config';
import type { Metadata } from 'next';
import type { ModuleSpec } from '@/lib/modules';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: "Modules - Bread Modular",
  description: "Explore our range of affordable, open-source modular synthesizer modules.",
  openGraph: {
    title: "Modules - Bread Modular",
    description: "Explore our range of affordable, open-source modular synthesizer modules.",
    images: ["/images/modules/starter-kit.jpg"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Modules - Bread Modular",
    description: "Explore our range of affordable, open-source modular synthesizer modules.",
    images: ["/images/modules/starter-kit.jpg"],
  },
};

// Extended type that includes the original moduleId for routing and category
interface ModuleDisplay extends ModuleSpec {
  originalModuleId: string; // Original moduleId for routing (always uses the base module)
  category: string; // Category for grouping modules
}

export default async function ModulesPage() {
  // Load modules based on config, merging config overrides with module metadata
  const modulesResults = await Promise.all(
    modulesDisplayConfig.map(async (config, index) => {
      const moduleData = await getModuleData(config.moduleId);
      
      if (!moduleData) {
        console.warn(`Module not found: ${config.moduleId}`);
        return null;
      }

      // Merge config overrides with module data
      // Generate a unique display ID if the same module appears multiple times
      const displayId = modulesDisplayConfig.filter(c => c.moduleId === config.moduleId).length > 1
        ? `${config.moduleId}-${index}`
        : config.moduleId;

      // Create ModuleSpec (without contentHtml) with config overrides
      const { contentHtml, ...moduleSpec } = moduleData;
      const result: ModuleDisplay = {
        id: displayId,
        originalModuleId: config.moduleId, // Always use original moduleId for routing
        title: config.title ?? moduleSpec.title,
        description: config.description ?? moduleSpec.description,
        image: config.image ?? moduleSpec.image,
        versions: moduleSpec.versions,
        checkout: moduleSpec.checkout,
        inputs: moduleSpec.inputs,
        outputs: moduleSpec.outputs,
        featured: config.featured !== undefined ? config.featured : moduleSpec.featured,
        size: config.size ?? moduleSpec.size,
        category: config.category,
      };
      return result;
    })
  );

  // Filter out null entries (modules that weren't found)
  const modules = modulesResults.filter((module): module is ModuleDisplay => module !== null);
  
  // Group modules by category
  const modulesByCategory = new Map<string, ModuleDisplay[]>();
  modules.forEach((module) => {
    const category = module.category || 'Others';
    if (!modulesByCategory.has(category)) {
      modulesByCategory.set(category, []);
    }
    modulesByCategory.get(category)!.push(module);
  });

  return (
    <Layout>
      {categoryOrder.map((category) => {
        const categoryModules = modulesByCategory.get(category);
        if (!categoryModules || categoryModules.length === 0) return null;

        const isFeatured = category === 'Featured';
        const featuredModule = isFeatured ? categoryModules.find(m => m.featured) || categoryModules[0] : null;
        const regularModules = isFeatured && featuredModule 
          ? categoryModules.filter(m => m.id !== featuredModule.id)
          : categoryModules;

        return (
          <div key={category}>
            {/* Category Heading */}
            <h2 className={styles.categoryHeading}>{category}</h2>

            {/* Featured Module (only for Featured category) */}
            {isFeatured && featuredModule && (
              <section className={styles.featuredModule} aria-label={`Featured module in ${category}`}>
                <Link href={`/modules/${featuredModule.originalModuleId}`}>
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
            {regularModules.length > 0 && (
              <section aria-label={`${category} modules`} className={styles.moduleGrid}>
                {regularModules.map((module) => (
                  <Link 
                    key={module.id}
                    href={`/modules/${module.originalModuleId}`}
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
            )}
          </div>
        );
      })}
    </Layout>
  );
} 