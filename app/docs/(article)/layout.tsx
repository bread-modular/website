import Layout from '@/app/components/Layout';
import SidebarNav from '@/app/components/SidebarNav';
import { getDocCategories } from '@/lib/docs';
import styles from './layout.module.css';

// The sidebar lives in a layout so it stays mounted (keeping its scroll
// position and animating the active item) while moving between docs.
export default async function DocsArticleLayout({ children }: { children: React.ReactNode }) {
  const categories = await getDocCategories();
  const sections = categories.map(category => ({
    title: category.name,
    items: category.docs.map(doc => ({
      href: `/docs/${category.slug}/${doc.slug}`,
      title: doc.title
    }))
  }));

  return (
    <Layout>
      <div className={styles.container}>
        <SidebarNav
          eyebrow="Documentation"
          title="Bread Modular Docs"
          titleHref="/docs"
          sections={sections}
          action={
            <a
              href="https://notebooklm.google.com/notebook/09159f54-4055-407e-a2f8-818cbaf1744f/preview"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.chatLink}
            >
              <span>💬</span>
              <span>Chat with AI</span>
            </a>
          }
        />
        <div className={styles.content}>{children}</div>
      </div>
    </Layout>
  );
}
