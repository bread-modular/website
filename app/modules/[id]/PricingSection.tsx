'use client';

import { useState } from 'react';
import type { ModuleVersion } from '@/lib/modules';
import styles from './page.module.css';

interface Props {
  versions: ModuleVersion[];
  checkoutLink?: string;
}

export default function PricingSection({ versions, checkoutLink }: Props) {
  const [selectedVersion, setSelectedVersion] = useState(versions[0]);

  if (checkoutLink) {
    return (
      <div className={styles.buySection}>
        <div className={styles.buyHeader}>
          <span>OR</span>
        </div>
        <div className={styles.buyOptions}>
          <a href={checkoutLink} className={styles.buyButton}>BUY NOW</a>
        </div>
      </div>
    );
  }

  if (versions.length === 0) return null;

  return (
    <div className={styles.buySection}>
      <div className={styles.buyHeader}>
        <span>OR BUY IT:</span>
        <select 
          className={styles.versionSelect}
          value={selectedVersion.name}
          onChange={(e) => {
            const version = versions.find(v => v.name === e.target.value);
            if (version) setSelectedVersion(version);
          }}
        >
          {versions.map((version) => (
            <option key={version.name} value={version.name}>
              {version.name}
            </option>
          ))}
        </select>
        <a href="#" className={styles.differenceLink}>{"difference?"}</a>
      </div>
      <div className={styles.buyOptions}>
        <div className={styles.price}>${selectedVersion.price}</div>
        <button className={styles.buyButton}>ADD TO CART</button>
      </div>
    </div>
  );
} 