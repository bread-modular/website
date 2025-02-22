'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { Module } from '@/lib/modules';
import styles from './page.module.css';

interface Props {
  moduleData: Module;
}

export default function ModuleContent({ moduleData }: Props) {
  const [selectedVersion, setSelectedVersion] = useState(moduleData.versions[0]);

  return (
    <main className={styles.main}>
      <div className={styles.content}>
        <div className={styles.infoSection}>
          <h1>{moduleData.title}</h1>
          <p className={styles.description}>{moduleData.description}</p>

          {moduleData.versions.length > 0 && (
            <div className={styles.versions}>
              <h2>Version</h2>
              <div className={styles.versionButtons}>
                {moduleData.versions.map((version) => (
                  <button
                    key={version.name}
                    onClick={() => setSelectedVersion(version)}
                    className={`${styles.versionButton} ${
                      version.name === selectedVersion.name ? styles.active : ''
                    }`}
                  >
                    {version.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {selectedVersion && (
            <div className={styles.pricing}>
              <div className={styles.price}>${selectedVersion.price}</div>
              <button className={styles.buyButton}>BUY</button>
              <button className={styles.diyButton}>DIY IT</button>
            </div>
          )}
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

      <div className={styles.markdownContent} dangerouslySetInnerHTML={{ __html: moduleData.contentHtml }} />
    </main>
  );
} 