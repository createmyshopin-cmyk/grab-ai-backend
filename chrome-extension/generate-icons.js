/**
 * Generate Chrome Extension Icons
 * Run: node generate-icons.js
 */

const fs = require('fs');
const path = require('path');

// Simple PNG generator without dependencies
function createSimplePNG(size, color) {
  // For simplicity, we'll create a data URL that can be saved
  // This creates a simple colored square
  
  const canvas = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body>
<canvas id="c" width="${size}" height="${size}"></canvas>
<script>
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');

// Blue gradient background
const gradient = ctx.createLinearGradient(0, 0, ${size}, ${size});
gradient.addColorStop(0, '#3B82F6');
gradient.addColorStop(1, '#1E40AF');
ctx.fillStyle = gradient;
ctx.fillRect(0, 0, ${size}, ${size});

// Target/crosshair symbol
ctx.strokeStyle = 'white';
ctx.fillStyle = 'white';
ctx.lineWidth = Math.max(2, ${size} / 16);

const center = ${size} / 2;
const radius1 = ${size} * 0.35;
const radius2 = ${size} * 0.2;
const radius3 = ${size} * 0.08;

// Outer circle
ctx.beginPath();
ctx.arc(center, center, radius1, 0, Math.PI * 2);
ctx.stroke();

// Middle circle
ctx.beginPath();
ctx.arc(center, center, radius2, 0, Math.PI * 2);
ctx.stroke();

// Inner filled circle
ctx.beginPath();
ctx.arc(center, center, radius3, 0, Math.PI * 2);
ctx.fill();

// Crosshairs
const crossLength = ${size} * 0.15;
ctx.beginPath();
ctx.moveTo(center, center - radius1 - crossLength);
ctx.lineTo(center, center - radius1);
ctx.moveTo(center, center + radius1);
ctx.lineTo(center, center + radius1 + crossLength);
ctx.moveTo(center - radius1 - crossLength, center);
ctx.lineTo(center - radius1, center);
ctx.moveTo(center + radius1, center);
ctx.lineTo(center + radius1 + crossLength, center);
ctx.stroke();

// Output as data URL
console.log(canvas.toDataURL('image/png'));
</script>
</body>
</html>`;
  
  return canvas;
}

console.log('🎨 Generating Chrome Extension Icons...\n');

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir);
}

// Generate simple fallback icons (solid color with text)
const sizes = [16, 48, 128];

sizes.forEach(size => {
  // Create SVG icon (simpler approach)
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3B82F6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1E40AF;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background -->
  <rect width="${size}" height="${size}" fill="url(#grad)"/>
  
  <!-- Target circles -->
  <circle cx="${size/2}" cy="${size/2}" r="${size*0.35}" fill="none" stroke="white" stroke-width="${Math.max(1, size/16)}"/>
  <circle cx="${size/2}" cy="${size/2}" r="${size*0.2}" fill="none" stroke="white" stroke-width="${Math.max(1, size/16)}"/>
  <circle cx="${size/2}" cy="${size/2}" r="${size*0.08}" fill="white"/>
  
  <!-- Crosshairs -->
  <line x1="${size/2}" y1="${size/2 - size*0.35 - size*0.15}" x2="${size/2}" y2="${size/2 - size*0.35}" stroke="white" stroke-width="${Math.max(1, size/16)}"/>
  <line x1="${size/2}" y1="${size/2 + size*0.35}" x2="${size/2}" y2="${size/2 + size*0.35 + size*0.15}" stroke="white" stroke-width="${Math.max(1, size/16)}"/>
  <line x1="${size/2 - size*0.35 - size*0.15}" y1="${size/2}" x2="${size/2 - size*0.35}" y2="${size/2}" stroke="white" stroke-width="${Math.max(1, size/16)}"/>
  <line x1="${size/2 + size*0.35}" y1="${size/2}" x2="${size/2 + size*0.35 + size*0.15}" y2="${size/2}" stroke="white" stroke-width="${Math.max(1, size/16)}"/>
</svg>`;

  const svgPath = path.join(iconsDir, `icon-${size}.svg`);
  fs.writeFileSync(svgPath, svg);
  console.log(`✅ Created: icons/icon-${size}.svg`);
});

console.log('\n⚠️  SVG files created!');
console.log('\n📋 To convert SVG to PNG:');
console.log('   Option 1: Open each SVG in browser → Right-click → Save as PNG');
console.log('   Option 2: Use online converter: https://cloudconvert.com/svg-to-png');
console.log('   Option 3: Use the create-icons.html file (easier!)');
console.log('\n💡 EASIEST METHOD:');
console.log('   1. Open: create-icons.html in Chrome');
console.log('   2. Click 3 download buttons');
console.log('   3. Move PNGs to icons/ folder');
console.log('   4. Done!\n');
