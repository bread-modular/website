import { useState, useEffect } from 'react';
import Image from 'next/image';
import styles from './ImagePreview.module.css';

interface ImagePreviewProps {
  src: string;
  alt: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ImagePreview({ src, alt, isOpen, onClose }: ImagePreviewProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Prevent scrolling when modal is open
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    
    // Cleanup function to restore scrolling when component unmounts
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle escape key press to close the preview
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscKey);
    return () => window.removeEventListener('keydown', handleEscKey);
  }, [isOpen, onClose]);

  if (!mounted || !isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.content} onClick={e => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>
          ×
        </button>
        <div className={styles.imageContainer}>
          <Image
            src={src}
            alt={alt}
            fill
            className={styles.previewImage}
            priority
          />
        </div>
      </div>
    </div>
  );
} 