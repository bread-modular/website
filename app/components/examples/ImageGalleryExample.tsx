'use client';

import { useState } from 'react';
import useImagePreview from '../../utils/useImagePreview';
import styles from './ImageGalleryExample.module.css';

/**
 * Example component demonstrating the use of useImagePreview hook
 * in a simple image gallery
 */
export default function ImageGalleryExample() {
  const [images, setImages] = useState([
    {
      src: '/images/bread-modular-system.jpg',
      alt: 'Bread Modular System',
      caption: 'The complete Bread Modular system'
    },
    {
      src: '/images/docs/hithat-pcb-module.png',
      alt: 'PCB Module Design',
      caption: 'PCB design for a hihat module'
    },
    {
      src: '/images/home-slide/01.jpg',
      alt: 'Bread Modular Modules',
      caption: 'A collection of Bread Modular modules'
    }
  ]);

  // Use the image preview hook
  const { preview } = useImagePreview({
    containerSelector: `.${styles.galleryGrid}`,
    hoverScale: 1.05
  });

  // Handle manual preview for captions
  const handleCaptionClick = (src: string, alt: string) => {
    preview(src, alt);
  };

  return (
    <div className={styles.galleryContainer}>
      <h2>Image Gallery Example</h2>
      <p>Click on any image to view it in a preview. You can also click on the captions below each image.</p>
      
      <div className={styles.galleryGrid}>
        {images.map((image, index) => (
          <div key={index} className={styles.galleryItem}>
            <img src={image.src} alt={image.alt} />
            <div 
              className={styles.caption}
              onClick={() => handleCaptionClick(image.src, image.alt)}
            >
              {image.caption}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 