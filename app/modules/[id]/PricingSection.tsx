'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { ModuleVersion } from '@/lib/modules';
import styles from './page.module.css';
import { useCart } from '@/lib/cart';

interface Props {
  versions: ModuleVersion[];
  checkout?: {
    link: string;
    price: number;
  };
  moduleId: string;
  moduleTitle: string;
}

export default function PricingSection({ versions, checkout, moduleId, moduleTitle }: Props) {
  const [selectedVersion, setSelectedVersion] = useState(versions[0]);
  const [showSuccess, setShowSuccess] = useState(false);
  const { addItem } = useCart();

  // Hide success message after 3 seconds
  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess]);

  if (checkout) {
    return (
      <div className={styles.buySection}>
        <div className={styles.buyHeader}>
          <span>OR</span>
        </div>
        <div className={styles.buyOptions}>
          <div className={styles.price}>${checkout.price}</div>
          <a href={checkout.link} className={styles.buyButton}>BUY NOW</a>
        </div>
      </div>
    );
  }

  if (versions.length === 0) return null;

  const handleAddToCart = () => {
    addItem(moduleId, moduleTitle, selectedVersion);
    setShowSuccess(true);
  };

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
        <Link href="/docs/getting-started/getting-started#difference-between-semi-assembled-x26-fully-assembled" className={styles.differenceLink}>{"difference?"}</Link>
      </div>
      <div className={styles.buyOptions}>
        <div className={styles.price}>${selectedVersion.price}</div>
        <button 
          className={styles.buyButton}
          onClick={handleAddToCart}
        >
          ADD TO CART
        </button>
      </div>
      {showSuccess && (
        <div className={styles.successMessage}>
          Item added to cart! <Link href="/cart">View Cart</Link>
        </div>
      )}
    </div>
  );
} 