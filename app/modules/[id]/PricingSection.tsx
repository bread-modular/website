'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
  const [isDIY, setIsDIY] = useState(false);
  const { addItem } = useCart();
  const isProcessingRef = useRef(false);

  // Hide success message after 3 seconds
  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess]);

  // Debounce function to prevent multiple rapid clicks
  const debounce = (callback: () => void, delay: number) => {
    if (isProcessingRef.current) return;
    
    isProcessingRef.current = true;
    callback();
    
    setTimeout(() => {
      isProcessingRef.current = false;
    }, delay);
  };

  const handleAddToCart = useCallback(() => {
    debounce(() => {
      addItem(moduleId, moduleTitle, selectedVersion);
      setShowSuccess(true);
    }, 500);
  }, [moduleId, moduleTitle, selectedVersion, addItem]);

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

  const handleVersionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (e.target.value === 'diy') {
      setIsDIY(true);
    } else {
      setIsDIY(false);
      const version = versions.find(v => v.name === e.target.value);
      if (version) setSelectedVersion(version);
    }
  };

  return (
    <div className={styles.buySection}>
      <div className={styles.buyHeader}>
        
        <select 
          className={styles.versionSelect}
          value={isDIY ? 'diy' : selectedVersion.name}
          onChange={handleVersionChange}
          aria-label="Select version or build option"
        >
          {versions.map((version) => (
            <option key={version.name} value={version.name}>
              {version.name}
            </option>
          ))}
          <option value="diy">Build It Yourself (DIY)</option>
        </select>
        {!isDIY && (
          <Link href="/docs/getting-started/getting-started#difference-between-semi-assembled-x26-fully-assembled" className={styles.differenceLink}>{"difference?"}</Link>
        )}
      </div>
      <div className={styles.buyOptions}>
        {!isDIY ? (
          <>
            <div className={styles.price}>${selectedVersion.price}</div>
            <button 
              className={styles.buyButton}
              onClick={handleAddToCart}
            >
              ADD TO CART
            </button>
          </>
        ) : (
          <Link href="/docs/getting-started/build-it-yourself" className={styles.buyButton}>
            BUILD IT YOURSELF
          </Link>
        )}
      </div>
      {showSuccess && !isDIY && (
        <div className={styles.successMessage}>
          Item added to cart! <Link href="/cart">View Cart</Link>
        </div>
      )}
    </div>
  );
} 