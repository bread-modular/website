import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';
import styles from './Layout.module.css';

interface Props {
  children: React.ReactNode;
}

export default function Layout({ children }: Props) {
  return (
    <div className={styles.container}>
      <Header />
      <main className={styles.main}>
        {children}
      </main>
      <Footer />
    </div>
  );
} 