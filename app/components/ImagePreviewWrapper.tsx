'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import styles from './ImagePreviewWrapper.module.css';

interface ImagePreviewWrapperProps {
  src: string;
  alt: string;
  className?: string;
}

export default function ImagePreviewWrapper({ src, alt, className }: ImagePreviewWrapperProps) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    if (isPreviewOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [isPreviewOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isPreviewOpen) {
        setIsPreviewOpen(false);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isPreviewOpen]);

  const openPreview = () => setIsPreviewOpen(true);
  const closePreview = () => setIsPreviewOpen(false);

  return (
    <>
      <div className={styles.imageWrapper}>
        <Image
          src={src}
          alt={alt}
          fill
          className={className}
          onClick={openPreview}
        />
      </div>
      
      {isPreviewOpen && (
        <div className={styles.modal} onClick={closePreview}>
          <div className={styles.modalContent}>
            <button className={styles.closeButton} onClick={closePreview}>×</button>
            <div className={styles.modalImageWrapper}>
              <Image
                src={src}
                alt={alt}
                fill
                className={styles.modalImage}
                priority
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
} 