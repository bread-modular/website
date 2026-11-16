import EuroHeader from './EuroHeader';
import EuroFooter from './EuroFooter';
import { handFont } from './fonts';
import styles from './EuroLayout.module.css';

interface Props {
  children: React.ReactNode;
}

// Layout for the Eurorack pages. Bread Modular Original pages keep
// app/components/Layout.tsx.
export default function EuroLayout({ children }: Props) {
  return (
    <div className={`${styles.euro} ${handFont.variable}`}>
      <EuroHeader />
      <main className={styles.main}>{children}</main>
      <EuroFooter />
    </div>
  );
}
