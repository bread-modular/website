'use client';

import { useRef, useEffect } from 'react';
import Image from 'next/image';
import { openImagePreview } from '@/app/utils/imagePreview';
import styles from './page.module.css';

interface ModuleImageProps {
  src: string;
  alt: string;
}

export default function ModuleImage({ src, alt }: ModuleImageProps) {
  const imageRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Skip if not on client or ref is not set
    if (typeof window === 'undefined' || !imageRef.current) return;
    
    // Find the image element
    const imageEl = imageRef.current.querySelector('img');
    if (!imageEl) return;
    
    // Add click handler
    imageEl.style.cursor = 'zoom-in';
    
    // Define handler function so we can remove it later
    const handleImageClick = () => {
      openImagePreview(src, alt);
    };
    
    // Add event listener
    imageEl.addEventListener('click', handleImageClick);
    
    // Cleanup function to remove event listener
    return () => {
      imageEl.removeEventListener('click', handleImageClick);
    };
  }, [src, alt]);
  
  return (
    <div className={styles.imageSection} ref={imageRef}>
      <Image
        src={src}
        alt={alt}
        fill
        className={styles.moduleImage}
        sizes="(max-width: 768px) 100vw, 50vw"
        priority // Load this image with priority as it's above the fold
      />
    </div>
  );
} 