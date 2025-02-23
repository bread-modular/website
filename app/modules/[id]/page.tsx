import { notFound } from 'next/navigation';
import Image from 'next/image';
import Layout from '@/app/components/Layout';
import { getModuleData } from '@/lib/modules';
import PricingSection from './PricingSection';
import MarkdownContent from '@/app/components/media/MarkdownContent';
import ModuleNav from '@/app/components/ModuleNav';
import styles from './page.module.css';
import { Metadata } from 'next';

export async function generateMetadata({ params }: {params: Promise<{ id: string }>}): Promise<Metadata> {
  const id = (await params).id;
  const moduleData = await getModuleData(id);
  
  if (!moduleData) {
    return {
      title: 'Not Found',
      description: 'The module you are looking for does not exist.'
    };
  }

  return {
    title: `${moduleData.title} | Bread Modular`,
    description: moduleData.description,
    openGraph: {
      title: moduleData.title,
      description: moduleData.description,
      type: 'article',
      url: `/modules/${id}`,
      images: [
        {
          url: moduleData.image,
          alt: moduleData.title,
        }
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: moduleData.title,
      description: moduleData.description,
      images: [moduleData.image],
    },
  };
}

export default async function ModulePage({ params }: {params: Promise<{ id: string }>}) {
  const id = (await params).id;
  const moduleData = await getModuleData(id);
  
  if (!moduleData) {
    notFound();
  }

  return (
    <Layout>
      <ModuleNav currentModuleId={id} />
      <div className={styles.content}>
        <div className={styles.infoSection}>
          <h1>{moduleData.title}</h1>
          <p className={styles.description}>{moduleData.description}</p>

          <div>
            <a href="#" className={styles.diyLink}>BUILD IT YOURSELF</a>
          </div>

          <PricingSection versions={moduleData.versions} checkoutLink={moduleData.checkoutLink} />
        </div>
        <div className={styles.imageSection}>
          <Image
            src={moduleData.image}
            alt={moduleData.title}
            fill
            className={styles.moduleImage}
            priority
          />
        </div>
      </div>

      <div className={styles.markdownWrapper}>
        <MarkdownContent content={moduleData.contentHtml} />
      </div>
    </Layout>
  );
} 