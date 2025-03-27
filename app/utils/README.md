# Image Preview Utilities

This directory contains utilities for adding image preview/lightbox functionality to your components.

## Available Utilities

### 1. Direct Function: `imagePreview.ts`

Provides utilities for making images zoomable and displaying image previews when clicked.

```typescript
import { makeImagesZoomable, openImagePreview } from '../utils/imagePreview';

// In your component:
useEffect(() => {
  // Make all images in a container zoomable
  makeImagesZoomable('.my-container-selector');
  
  // Or manually open an image preview
  const handleImageClick = (src, alt) => {
    openImagePreview(src, alt);
  };
}, []);
```

### 2. React Hook: `useImagePreview.ts`

A more React-friendly approach with a hook that manages the image preview functionality.

```typescript
import useImagePreview from '../utils/useImagePreview';

function MyComponent() {
  // Basic usage
  useImagePreview({
    containerSelector: '.my-container'
  });
  
  // Advanced usage with all options
  const { preview } = useImagePreview({
    containerSelector: '.my-container',
    enableHoverEffects: true,
    hoverScale: 1.05,
    dependencies: [someState, otherProp]
  });
  
  // You can also manually trigger the preview
  const handleCustomPreview = () => {
    preview('path/to/image.jpg', 'Image description');
  };
  
  return (
    <div className="my-container">
      <img src="image1.jpg" alt="Image 1" />
      <img src="image2.jpg" alt="Image 2" />
      
      <button onClick={handleCustomPreview}>
        Open custom preview
      </button>
    </div>
  );
}
```

## Features

- 🖼️ Click images to open a full-screen preview
- 🔍 Zoom effect on hover
- ⌨️ Keyboard support (Escape to close)
- 🖱️ Click outside to close
- ✨ Customizable hover effects
- 📱 Responsive design for all screen sizes
- 🛠️ Available as both direct function and React hook 