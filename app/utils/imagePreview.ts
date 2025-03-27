/**
 * Image Preview Utility
 * 
 * This utility provides functionality for creating image previews/lightboxes
 * when images are clicked. It handles the creation of modal overlays and
 * all related event listeners.
 */

/**
 * Opens an image preview modal with the provided image source
 * @param src Image source URL
 * @param alt Alternative text for the image
 */
export function openImagePreview(src: string, alt: string): void {
  console.log("Opening image preview:", src);
  
  // Check if a preview is already open
  if (document.querySelector('.image-preview-overlay')) {
    console.log("Preview already open, not opening another one");
    return;
  }
  
  // Create elements
  const overlay = document.createElement('div');
  const container = document.createElement('div');
  const image = document.createElement('img');
  const closeBtn = document.createElement('div');
  
  // Add classes for identification
  overlay.className = 'image-preview-overlay';
  container.className = 'image-preview-container';
  image.className = 'image-preview-image';
  closeBtn.className = 'image-preview-close';
  
  // Style overlay
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100%';
  overlay.style.height = '100%';
  overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
  overlay.style.zIndex = '9999999';
  overlay.style.display = 'flex';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'center';
  overlay.style.padding = '20px';
  overlay.style.boxSizing = 'border-box';
  
  // Style container
  container.style.position = 'relative';
  container.style.maxWidth = '90%';
  container.style.maxHeight = '90%';
  
  // Style image
  image.src = src;
  image.alt = alt || 'Image preview';
  image.style.maxWidth = '100%';
  image.style.maxHeight = '85vh';
  image.style.display = 'block';
  image.style.borderRadius = '4px';
  image.style.boxShadow = '0 5px 20px rgba(0, 0, 0, 0.3)';
  image.style.objectFit = 'contain';
  
  // Style close button
  closeBtn.textContent = '×';
  closeBtn.style.position = 'absolute';
  closeBtn.style.top = '-50px';
  closeBtn.style.right = '0';
  closeBtn.style.width = '44px';
  closeBtn.style.height = '44px';
  closeBtn.style.borderRadius = '50%';
  closeBtn.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
  closeBtn.style.color = 'white';
  closeBtn.style.fontSize = '40px';
  closeBtn.style.display = 'flex';
  closeBtn.style.alignItems = 'center';
  closeBtn.style.justifyContent = 'center';
  closeBtn.style.cursor = 'pointer';
  closeBtn.style.userSelect = 'none';
  closeBtn.style.lineHeight = '0';
  closeBtn.style.paddingBottom = '4px';
  closeBtn.style.paddingRight = '1px';
  
  // Close function
  const closePreview = () => {
    document.body.removeChild(overlay);
    document.body.style.overflow = '';
  };
  
  // Event listeners
  closeBtn.addEventListener('click', closePreview);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closePreview();
  });
  
  // Keyboard listener
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      closePreview();
      window.removeEventListener('keydown', handleKeyDown);
    }
  };
  window.addEventListener('keydown', handleKeyDown);
  
  // Prevent scrolling
  document.body.style.overflow = 'hidden';
  
  // Build DOM structure
  container.appendChild(image);
  container.appendChild(closeBtn);
  overlay.appendChild(container);
  document.body.appendChild(overlay);
}

/**
 * Makes images zoomable by adding click handlers to open the image preview
 * @param container CSS selector for the container of images
 */
export function makeImagesZoomable(container: string): void {
  // Run only on client-side
  if (typeof window === 'undefined') return;
  
  // Find all images in the container
  const images = document.querySelectorAll(`${container} img`);
  console.log(`Processing ${images.length} images for zoom functionality`);
  
  // Add click handlers to all images
  images.forEach(img => {
    // Skip already processed images
    if (img.getAttribute('data-zoomable') === 'true') return;
    
    // Replace with new image to clean event listeners
    const newImg = img.cloneNode(true) as HTMLImageElement;
    
    // Mark as processed
    newImg.setAttribute('data-zoomable', 'true');
    
    // Style image to look zoomable
    newImg.style.cursor = 'zoom-in';
    newImg.style.transition = 'transform 0.3s ease';
    
    // Add hover effect
    newImg.addEventListener('mouseenter', () => {
      newImg.style.transform = 'scale(1.02)';
    });
    
    newImg.addEventListener('mouseleave', () => {
      newImg.style.transform = 'scale(1)';
    });
    
    // Add click handler
    newImg.addEventListener('click', () => {
      const src = newImg.getAttribute('src') || '';
      const alt = newImg.getAttribute('alt') || '';
      openImagePreview(src, alt);
    });
    
    // Replace old image with new one
    if (img.parentNode) {
      img.parentNode.replaceChild(newImg, img);
    }
  });
} 