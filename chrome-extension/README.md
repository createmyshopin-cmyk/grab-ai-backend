# Grab AI - Website to React Chrome Extension

Capture any website section and convert it to a React component with all styles, responsive breakpoints, and assets preserved.

## Features

✅ **Complete Style Capture**
- All CSS properties (padding, margin, colors, fonts, etc.)
- Layout (Flexbox, Grid, positioning)
- Typography (font family, size, weight, line height)
- Colors (background, text, borders)
- Animations and transitions
- Box shadows and borders

✅ **Image Extraction**
- Direct `<img>` tags with URLs
- Background images from CSS
- Image dimensions and alt text
- All image URLs preserved

✅ **Responsive Design**
- Captures current viewport styles
- Extracts media queries from stylesheets
- Generates mobile-first Tailwind classes
- Desktop, tablet, and mobile breakpoints

✅ **React Component Generation**
- Clean, production-ready React code
- Tailwind CSS classes
- Framer Motion animations
- TypeScript-ready structure
- Shopify Liquid export compatible

✅ **Text & Content**
- Preserves all text content
- Heading hierarchy (H1-H6)
- Text styles for each element
- Font properties

## Installation

### 1. Load Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right)
3. Click "Load unpacked"
4. Select the `chrome-extension` folder
5. Pin the extension to your toolbar

### 2. Grant Permissions

The extension needs:
- **Active Tab**: To capture elements on the current page
- **Storage**: To save your captured components
- **All URLs**: To work on any website

## How to Use

### Basic Usage

1. **Navigate to any website** you want to capture from

2. **Click the Grab AI extension icon** in your toolbar

3. **Click "Start Capture"** button

4. **Hover over the element** you want to capture
   - A blue overlay will highlight the element
   - You'll see the element's boundaries clearly

5. **Click the highlighted element** to capture it
   - Capture process starts automatically
   - Notification shows progress

6. **Component is generated!**
   - React code is created
   - Saved to extension storage
   - Sent to your Grab AI app (if running)
   - Available in "Recent Captures"

### Advanced Features

#### View Recent Captures

1. Open the extension popup
2. Scroll to "Recent Captures" section
3. Click any capture to:
   - Copy React code to clipboard
   - Open original website

#### Send to Grab AI App

If your Grab AI app is running on `localhost:9003`, captured components are automatically sent to the canvas!

1. Start your Grab AI app: `npm run dev`
2. Capture elements from any website
3. Components appear on your canvas instantly

#### Cancel Capture

- Press `ESC` key while in selection mode
- Or click "Cancel Capture" in the popup

## What Gets Captured

### CSS Properties

```
✓ Layout: display, position, flexbox, grid
✓ Spacing: margin, padding, gap
✓ Size: width, height, max/min dimensions
✓ Typography: font-family, size, weight, line-height
✓ Colors: text, background, border
✓ Borders: width, style, radius
✓ Shadows: box-shadow, text-shadow
✓ Animations: transition, animation properties
✓ Transform: translate, rotate, scale
✓ Overflow: hidden, auto, scroll
```

### Content & Assets

```
✓ All text content
✓ Heading hierarchy (H1-H6)
✓ Image URLs (img tags + CSS backgrounds)
✓ Image dimensions
✓ Alt text and accessibility attributes
✓ Links and buttons
✓ Form inputs
```

### Responsive Data

```
✓ Current viewport dimensions
✓ Media query breakpoints
✓ Mobile-first Tailwind classes
✓ Desktop, tablet, mobile styles
```

## Generated React Component

### Example Output

```jsx
'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function CapturedSection4521() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center p-8 bg-blue-500 text-white rounded-xl shadow-lg hover:scale-105 hover:shadow-xl transition-all duration-300 ease-in-out md:p-10 lg:p-12 xl:max-w-7xl xl:mx-auto"
    >
      Captured Component Content
    </motion.div>
  );
}
```

### Component Features

- ✅ **'use client' directive** for Next.js
- ✅ **React hooks** (useState, useEffect)
- ✅ **Framer Motion** animations
- ✅ **Tailwind CSS** utility classes
- ✅ **Responsive breakpoints** (md:, lg:, xl:)
- ✅ **Hover effects** and transitions
- ✅ **Mobile-first** approach
- ✅ **Clean, readable** code

## Integration with Grab AI App

### Auto-Send to Canvas

To enable automatic sending to your Grab AI canvas:

1. Make sure your Grab AI app is running:
   ```bash
   cd "c:\APP DEV\grab-ai-backend-main"
   npm run dev
   ```

2. Create the API endpoint (if not exists):
   ```
   src/app/api/capture/from-extension/route.ts
   ```

3. Capture elements - they'll appear on your canvas automatically!

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `ESC` | Cancel capture mode |
| Click | Capture hovered element |

## Troubleshooting

### Extension Not Working

1. **Refresh the page** after installing extension
2. **Check permissions** in `chrome://extensions/`
3. **Reload extension** if you updated code
4. **Check console** for errors (F12 → Console)

### Capture Not Starting

1. Ensure you clicked "Start Capture" in popup
2. Look for blue overlay when hovering
3. Check if page allows content scripts (some sites block them)

### Component Not Generating

1. Check browser console (F12) for errors
2. View extension background page:
   - `chrome://extensions/`
   - Click "service worker" under Grab AI
   - Check console for errors

### Not Sending to Grab AI App

1. Verify app is running on `localhost:9003`
2. Check CORS settings
3. Look for fetch errors in extension console

## Browser Compatibility

✅ **Chrome**: Full support (v88+)  
✅ **Edge**: Full support (v88+)  
✅ **Brave**: Full support  
⚠️ **Firefox**: Manual conversion needed (manifest v2)  
❌ **Safari**: Not supported (different extension system)

## Privacy & Security

- ✅ **All processing happens locally** on your machine
- ✅ **No data sent to external servers** (except your Grab AI app if running)
- ✅ **Captures saved in Chrome storage** only
- ✅ **No tracking or analytics**
- ✅ **Open source** - inspect the code yourself

## Development

### Folder Structure

```
chrome-extension/
├── manifest.json          # Extension configuration
├── content.js            # Runs on every webpage
├── content.css           # Injected styles
├── background.js         # Background service worker
├── popup.html            # Extension popup UI
├── popup.js              # Popup logic
├── icons/                # Extension icons
│   ├── icon-16.png
│   ├── icon-48.png
│   └── icon-128.png
└── README.md             # This file
```

### Modify & Reload

1. Edit files in `chrome-extension/` folder
2. Go to `chrome://extensions/`
3. Click reload icon under "Grab AI"
4. Test changes on a webpage

### Debug Content Script

1. Open DevTools (F12) on target webpage
2. Go to Console tab
3. Content script logs appear here

### Debug Background Script

1. Go to `chrome://extensions/`
2. Click "service worker" under Grab AI
3. Separate DevTools window opens
4. Background script logs appear here

### Debug Popup

1. Right-click extension icon
2. Select "Inspect popup"
3. DevTools for popup opens

## Customization

### Change Captured Styles

Edit `content.js` → `extractAllStyles()` function to add/remove style properties.

### Modify React Output

Edit `background.js` → `convertToReactComponent()` to change generated code structure.

### Add More Tailwind Mappings

Edit `background.js` → mapping helper functions (mapFontSize, mapSpacing, etc.)

### Change Selection Overlay Style

Edit `content.js` → `createOverlay()` function to customize blue highlight.

## Limitations

⚠️ **Cannot capture:**
- Content inside iframes (different domain)
- Shadow DOM elements (Web Components)
- Dynamically loaded content (before it loads)
- Canvas/WebGL renders (rasterized only)
- Video/audio streams

⚠️ **Approximations:**
- Tailwind color mappings (uses closest match)
- Complex gradients (simplified)
- Custom fonts (may not be available)
- Pseudo-elements (::before, ::after) styles

## License

MIT License - Free to use and modify

## Support

Issues? Questions? Improvements?

1. Check the troubleshooting section
2. Review console logs
3. Inspect extension code
4. Test on different websites

---

**Made with ❤️ for Grab AI**

Happy capturing! 🎯
