# 🎯 Chrome Extension - Website to React Component

A powerful Chrome extension that captures any website section and converts it to a production-ready React component with all styles, responsive breakpoints, and assets preserved.

## ✨ What It Does

Capture **ANY element** from **ANY website** and get:
- ✅ Clean React component code
- ✅ All CSS properties (padding, margin, colors, fonts, animations)
- ✅ Responsive Tailwind classes (mobile/tablet/desktop)
- ✅ Image URLs and dimensions
- ✅ Text content and typography
- ✅ Framer Motion animations
- ✅ Hover effects and transitions
- ✅ Shopify Liquid export ready

## 🚀 Quick Start

### 1. Install Extension

```bash
1. Open Chrome → chrome://extensions/
2. Enable "Developer mode" (top-right toggle)
3. Click "Load unpacked"
4. Select folder: c:\APP DEV\grab-ai-backend-main\chrome-extension
5. Pin extension to toolbar
```

### 2. Add Icons (Required!)

The extension needs 3 icon files. **Quick method:**

```bash
# Create simple colored squares for testing:
# 1. Open any image editor (Paint, Photoshop, etc.)
# 2. Create 3 PNG files with blue background:
#    - icon-16.png (16x16 pixels)
#    - icon-48.png (48x48 pixels)
#    - icon-128.png (128x128 pixels)
# 3. Save to: chrome-extension/icons/
```

Or use this emoji as icon:
- Screenshot 🎯 emoji at large size
- Resize to 16px, 48px, 128px
- Save as icon-16.png, icon-48.png, icon-128.png

### 3. Start Your Grab AI App

```bash
cd "c:\APP DEV\grab-ai-backend-main"
npm run dev
```

Server must be running on `http://localhost:9003` to receive captures.

### 4. Capture Your First Element!

```bash
1. Go to ANY website (e.g., amazon.com, netflix.com, apple.com)
2. Click the Grab AI extension icon
3. Click "Start Capture"
4. Hover over any element (blue highlight appears)
5. Click the element
6. React component generated! ✨
```

## 📋 What Gets Captured

### Complete CSS Properties

```
✓ Layout
  - display (flex, grid, block)
  - flex properties (direction, justify, align, gap)
  - grid properties (columns, rows, gap)
  - position (relative, absolute, fixed)

✓ Spacing
  - margin (all sides)
  - padding (all sides)
  - gap (flexbox/grid)

✓ Typography
  - font-family
  - font-size
  - font-weight
  - line-height
  - letter-spacing
  - text-align
  - text-transform

✓ Colors
  - text color (RGB → Hex)
  - background color (RGB → Hex)
  - border color
  - All colors converted to Tailwind classes

✓ Visual Effects
  - border-radius
  - box-shadow
  - opacity
  - transform
  - transition
  - animation

✓ Dimensions
  - width/height
  - max/min width/height
  - overflow properties
```

### Images & Assets

```
✓ <img> tags
  - src URL
  - alt text
  - dimensions (width, height)
  - natural size
  - loading attribute

✓ Background images
  - CSS background-image URLs
  - Element they're applied to
  - All images preserved
```

### Responsive Design

```
✓ Current viewport size
✓ Media query breakpoints
✓ Mobile-first Tailwind classes:
  - Default: mobile (320px-767px)
  - md: tablet (768px+)
  - lg: desktop (1024px+)
  - xl: large desktop (1280px+)
```

### Text Content

```
✓ All text nodes
✓ Headings (H1-H6) with hierarchy
✓ Typography styles per element
✓ Font properties
```

## 🎨 Generated React Component

### Example Output

When you capture a hero section, you get:

```tsx
'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function CapturedDiv4521() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center p-6 md:p-8 lg:p-12 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-center rounded-2xl shadow-xl hover:scale-105 hover:shadow-2xl transition-all duration-300 xl:max-w-7xl xl:mx-auto"
    >
      <h1 className="text-4xl lg:text-6xl font-bold mb-4">
        Welcome to Our Platform
      </h1>
      <p className="text-lg lg:text-xl mb-8">
        Build amazing things with our tools
      </p>
      <button className="px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100">
        Get Started
      </button>
    </motion.div>
  );
}
```

### Features of Generated Code

- ✅ **Next.js Ready**: `'use client'` directive
- ✅ **React Hooks**: useState, useEffect imported
- ✅ **Animations**: Framer Motion with fade-in
- ✅ **Responsive**: Mobile-first Tailwind breakpoints
- ✅ **Interactive**: Hover effects and transitions
- ✅ **Clean**: No inline styles, all Tailwind classes
- ✅ **Production Ready**: Optimized and performant

## 🔧 How It Works

### Architecture

```
┌─────────────────┐
│  Content Script │ ← Runs on every webpage
│   (content.js)  │   - Element selection
│                 │   - Style extraction
│                 │   - User interaction
└────────┬────────┘
         │ Captured Data
         ↓
┌─────────────────┐
│ Background Script│ ← Service worker
│  (background.js) │   - Data processing
│                 │   - React conversion
│                 │   - Tailwind mapping
└────────┬────────┘
         │ React Component
         ↓
┌─────────────────┐
│  Grab AI App    │ ← Your Next.js app
│  (localhost:9003)│   - Receives component
│                 │   - Adds to canvas
└─────────────────┘
```

### Capture Process

1. **User clicks "Start Capture"**
   - Extension injects overlay
   - Mouse events tracked

2. **User hovers over element**
   - Blue highlight appears
   - Element boundaries shown

3. **User clicks element**
   - All styles extracted
   - Images found and logged
   - Text content captured
   - Responsive data analyzed

4. **Processing in background**
   - Styles → Tailwind classes
   - Layout → Flexbox/Grid classes
   - Colors → Hex conversion
   - Spacing → Tailwind spacing scale

5. **React component generated**
   - JSX structure built
   - Framer Motion added
   - Responsive classes applied
   - Clean, formatted code

6. **Component delivered**
   - Saved to extension storage
   - Sent to Grab AI app (if running)
   - Available in "Recent Captures"

## 📦 Integration with Grab AI

### Auto-Send to Canvas

When your Grab AI app is running:

1. Start dev server:
   ```bash
   npm run dev
   ```

2. Extension checks: `http://localhost:9003/api/capture/from-extension`

3. If API responds, captured components are sent automatically

4. Components appear on your canvas instantly!

### API Endpoint

Created at: `src/app/api/capture/from-extension/route.ts`

**POST** request receives:
```json
{
  "code": "React component code",
  "componentName": "CapturedDiv4521",
  "metadata": {
    "generatedFrom": "website-capture",
    "sourceUrl": "https://example.com",
    "capturedAt": "2026-01-31T...",
    "colorPalette": ["#3B82F6", "#8B5CF6"],
    "images": [...],
    "responsive": true,
    "enhancements": [...]
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Component captured successfully",
  "component": { ... }
}
```

## 🎯 Usage Examples

### Capture a Hero Section

```
1. Go to apple.com
2. Start capture
3. Click on main hero section
4. Get: Full hero with gradient, images, buttons
```

### Capture a Product Card

```
1. Go to amazon.com
2. Start capture
3. Click on any product card
4. Get: Card with image, title, price, rating, button
```

### Capture a Navigation Bar

```
1. Go to any website
2. Start capture
3. Click on navigation bar
4. Get: Nav with logo, links, responsive menu
```

### Capture a Form

```
1. Go to any signup page
2. Start capture
3. Click on form element
4. Get: Complete form with inputs, labels, button
```

## ⚙️ Configuration

### Modify Style Extraction

Edit `content.js` → `extractAllStyles()`:

```javascript
function extractAllStyles(element, computedStyle) {
  const styles = {};
  
  // Add your custom properties here
  styles.customProperty = computedStyle.getPropertyValue('--custom-property');
  
  return styles;
}
```

### Customize React Output

Edit `background.js` → `convertToReactComponent()`:

```javascript
// Change component structure
const code = `
'use client';

import React from 'react';

// Your custom template here
export default function ${componentName}() {
  return (
    <div className="${tailwindClasses}">
      {/* Your JSX */}
    </div>
  );
}
`;
```

### Add More Tailwind Mappings

Edit `background.js` → mapping functions:

```javascript
function mapCustomProperty(value) {
  // Your custom Tailwind mapping
  if (value === 'special') return 'custom-class';
  return '';
}
```

## 🐛 Troubleshooting

### Extension Not Showing

```
✓ Check: chrome://extensions/
✓ Ensure: "Developer mode" is ON
✓ Reload: Click reload icon under extension
✓ Pin: Click puzzle icon → pin Grab AI
```

### Capture Mode Not Starting

```
✓ Refresh the webpage
✓ Check extension permissions
✓ Look for console errors (F12)
✓ Try different webpage
```

### No Blue Overlay Appearing

```
✓ Check: Content script loaded
✓ Console: Look for "Selection Mode Active" message
✓ Permissions: Extension has access to site
✓ Conflicts: Other extensions might interfere
```

### Component Not Generating

```
✓ Open extension console:
  - chrome://extensions/
  - Click "service worker" under Grab AI
  - Check for errors

✓ Check captured data:
  - Should see "Element captured" log
  - Review captured data structure
```

### Not Sending to Grab AI App

```
✓ App running: npm run dev
✓ Port correct: localhost:9003
✓ CORS enabled: Check API route
✓ Console: Check for fetch errors
```

## 🔒 Privacy & Security

- ✅ **100% Local Processing**: All data stays on your machine
- ✅ **No External Servers**: No data sent anywhere (except your local Grab AI app)
- ✅ **No Tracking**: Zero analytics or telemetry
- ✅ **No Ads**: Completely ad-free
- ✅ **Open Source**: Inspect the code yourself
- ✅ **Storage**: Only saves to Chrome local storage
- ✅ **Permissions**: Only what's absolutely necessary

## 📝 Development

### Folder Structure

```
chrome-extension/
├── manifest.json       # Extension config (manifest v3)
├── content.js         # Webpage injection (1000+ lines)
├── content.css        # Injected styles
├── background.js      # Service worker (500+ lines)
├── popup.html         # Extension UI
├── popup.js           # Popup logic
├── icons/             # Extension icons (16, 48, 128px)
└── README.md          # Documentation
```

### Debug Content Script

```javascript
// In content.js
console.log('🎯 Grab AI: Selection mode active');

// View in webpage console (F12)
```

### Debug Background Script

```javascript
// In background.js
console.log('📥 Element captured:', data);

// View in extension console:
// chrome://extensions/ → service worker
```

### Reload Extension

After code changes:
```
1. Go to chrome://extensions/
2. Click reload icon under Grab AI
3. Refresh target webpage
4. Test changes
```

## 🎓 Advanced Features

### Custom Element Selector

Want to select specific elements?

Add to `content.js`:

```javascript
// Select by class
if (element.classList.contains('my-class')) {
  captureElement(element);
}

// Select by attribute
if (element.hasAttribute('data-capture')) {
  captureElement(element);
}
```

### Batch Capture

Capture multiple elements at once:

```javascript
// In content.js
function captureMultiple(elements) {
  elements.forEach(el => {
    const data = captureElement(el);
    // Process each...
  });
}
```

### Export Options

Add more export formats:

```javascript
// In background.js
function exportAsVue(data) {
  // Convert to Vue component
}

function exportAsAngular(data) {
  // Convert to Angular component
}
```

## 📚 Resources

- [Chrome Extension Docs](https://developer.chrome.com/docs/extensions/)
- [Manifest V3 Guide](https://developer.chrome.com/docs/extensions/mv3/intro/)
- [Content Scripts](https://developer.chrome.com/docs/extensions/mv3/content_scripts/)
- [Background Service Workers](https://developer.chrome.com/docs/extensions/mv3/service_workers/)

---

## 🚀 Next Steps

1. **Add Icons** to `chrome-extension/icons/`
2. **Load Extension** in Chrome
3. **Capture Elements** from your favorite websites
4. **Integrate with Grab AI** for instant canvas updates

---

**Made with ❤️ for Grab AI - Happy Capturing! 🎯**
