import { notFound } from 'next/navigation';
import Image from 'next/image';
import Layout from '@/app/components/Layout';
import { getModuleData } from '@/lib/modules';
import PricingSection from './PricingSection';
import MarkdownContent from '@/app/components/MarkdownContent';
import styles from './page.module.css';

export default async function ModulePage({ params }: {params: Promise<{ id: string }>}) {
  const id = (await params).id;
  const moduleData = await getModuleData(id);
  
  if (!moduleData) {
    notFound();
  }

  return (
    <Layout>
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