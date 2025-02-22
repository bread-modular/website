import { redirect } from 'next/navigation';
import { getDocCategories } from '@/lib/docs';
import Layout from '@/app/components/Layout';

export default async function DocsPage() {
  const categories = await getDocCategories();
  
  // Redirect to the first doc if available
  if (categories.length > 0 && categories[0].docs.length > 0) {
    redirect(`/docs/${categories[0].slug}/${categories[0].docs[0].slug}`);
  }

  return (
    <Layout>
      <div>No documentation available.</div>
    </Layout>
  );
} 