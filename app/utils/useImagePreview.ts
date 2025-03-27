/**
 * React hook for image preview functionality
 * 
 * This hook provides a more React-friendly way to use the image preview
 * functionality in components that need more control over the preview behavior.
 */

import { useCallback, useEffect, useRef } from 'react';
import { openImagePreview } from './imagePreview';

interface UseImagePreviewOptions {
  /**
   * CSS selector for the container of images
   */
  containerSelector: string;
  
  /**
   * Whether to enable hover effects on images
   * @default true
   */
  enableHoverEffects?: boolean;
  
  /**
   * Scale factor for hover effect
   * @default 1.02
   */
  hoverScale?: number;
  
  /**
   * Dependency array for the useEffect hook
   * @default []
   */
  dependencies?: unknown[];
}

/**
 * Hook for adding image preview functionality to images in a container
 */
export default function useImagePreview({
  containerSelector,
  enableHoverEffects = true,
  hoverScale = 1.02,
  dependencies = []
}: UseImagePreviewOptions) {
  // Keep track of processed images to avoid duplicate processing
  const processedImagesRef = useRef<Set<HTMLImageElement>>(new Set());
  
  /**
   * Function to open an image preview directly
   */
  const preview = useCallback((src: string, alt: string = '') => {
    openImagePreview(src, alt);
  }, []);
  
  /**
   * Setup effect to make images zoomable
   */
  useEffect(() => {
    // Run only on client-side
    if (typeof window === 'undefined') return;
    
    // Keep track of new images added in this effect
    const newImages: HTMLImageElement[] = [];
    
    // Find all images in the container
    const images = document.querySelectorAll<HTMLImageElement>(`${containerSelector} img`);
    console.log(`Processing ${images.length} images for zoom functionality`);
    
    // Add click handlers to all images
    images.forEach(img => {
      // Skip images we've already processed to avoid duplicates
      if (processedImagesRef.current.has(img)) return;
      
      // Replace with new image to clean event listeners
      const newImg = img.cloneNode(true) as HTMLImageElement;
      
      // Style image to look zoomable
      newImg.style.cursor = 'zoom-in';
      
      if (enableHoverEffects) {
        newImg.style.transition = 'transform 0.3s ease';
        
        // Add hover effect
        newImg.addEventListener('mouseenter', () => {
          newImg.style.transform = `scale(${hoverScale})`;
        });
        
        newImg.addEventListener('mouseleave', () => {
          newImg.style.transform = 'scale(1)';
        });
      }
      
      // Add click handler
      newImg.addEventListener('click', () => {
        const src = newImg.getAttribute('src') || '';
        const alt = newImg.getAttribute('alt') || '';
        openImagePreview(src, alt);
      });
      
      // Replace old image with new one
      if (img.parentNode) {
        img.parentNode.replaceChild(newImg, img);
        
        // Track this new image
        newImages.push(newImg);
        processedImagesRef.current.add(newImg);
      }
    });
    
    // Cleanup function to remove tracked images on unmount or dependencies change
    return () => {
      // If we're completely unmounting, no need to clean up individual images
      // React will handle DOM cleanup for us
    };
  }, [containerSelector, enableHoverEffects, hoverScale, dependencies]);
  
  return { preview };
} 