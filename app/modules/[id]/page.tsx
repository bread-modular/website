import { notFound } from 'next/navigation';
import Header from '@/app/components/Header';
import { getModuleData } from '@/lib/modules';
import ModuleContent from './ModuleContent';
import styles from './page.module.css';

export default async function ModulePage({ params }: {params: Promise<{ id: string }>}) {
  const id = (await params).id;
  const moduleData = await getModuleData(id);
  
  if (!moduleData) {
    notFound();
  }

  return (
    <div className={styles.container}>
      <Header />
      <ModuleContent moduleData={moduleData} />
    </div>
  );
} 