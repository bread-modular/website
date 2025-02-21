const fs = require('fs');
const path = require('path');

// Create the directory if it doesn't exist
const dir = path.join(process.cwd(), 'public', 'images', 'modules');
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

// Generate an SVG placeholder
function generatePlaceholderSVG(width, height, text) {
  return `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#f5f5f5"/>
  <text 
    x="50%" 
    y="50%" 
    font-family="Arial" 
    font-size="24" 
    fill="#666"
    text-anchor="middle" 
    dominant-baseline="middle"
  >
    ${text}
  </text>
</svg>
`;
}

// Generate placeholders for each size
const baseWidth = 300;
const baseHeight = 750; // 300 * 2.5

const sizes = {
  base: { width: baseWidth, height: baseHeight, text: 'Base Module' },
  double: { width: baseWidth * 2, height: baseHeight, text: 'Double Module' },
  triple: { width: baseWidth * 3, height: baseHeight, text: 'Triple Module' },
};

Object.entries(sizes).forEach(([size, config]) => {
  const svg = generatePlaceholderSVG(config.width, config.height, config.text);
  fs.writeFileSync(
    path.join(dir, `placeholder-${size}.svg`),
    svg
  );
}); 