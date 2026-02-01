# 🎯 Simple Chrome Extension - HTML to React JSX

## What It Does (3 Steps)

1. **Capture** - Click any HTML element on any website
2. **Convert** - Automatically converts to React JSX component
3. **Copy** - React code copied to clipboard → Paste in your canvas/editor

---

## Installation (30 seconds)

```bash
1. Open Chrome: chrome://extensions/
2. Enable "Developer mode" (top-right toggle)
3. Click "Load unpacked"
4. Select folder: c:\APP DEV\grab-ai-backend-main\chrome-extension
5. Done! ✅
```

---

## Usage (3 clicks)

```bash
1. Click extension icon (🎯)
2. [Optional] Check boxes:
   - 🏪 Shopify Mode (captures Shopify section data)
   - 📱 Include Media Queries (responsive CSS)
3. Click "Start Capture"
4. Click ANY element on the webpage
5. React code auto-copied → Paste (Ctrl+V) anywhere!
```

---

## ⚙️ Capture Options

### 🏪 Shopify Mode
**When to use:** Capturing from Shopify stores (like gymshark.com, allbirds.com)

**What it does:**
- Detects if site is Shopify
- Extracts section metadata (data-section-id, data-section-type)
- Captures product information
- Captures theme name
- Adds all data as comments in React code

**Example output:**
```jsx
/*
 * 🏪 SHOPIFY SECTION DATA
 * 
 * Shop: gymshark.com
 * Theme: Dawn
 * 
 * Sections:
 *   - hero (template--123456--section)
 *   - featured-product (template--123456--featured)
 * 
 * Product:
 *   - Vital Seamless T-Shirt
 *   - Price: 29.99 USD
 */
```

### 📱 Include Media Queries
**Default:** ON (checked)

**What it does:**
- Captures all @media queries from CSS
- Includes responsive breakpoints (mobile, tablet, desktop)
- Preserves original responsive behavior

**When to disable:**
- Capturing static/non-responsive elements
- Want smaller output file
- Will handle responsive yourself

---

## What You Get

### Input: Any HTML Element
```html
<div class="hero">
  <h1>Hello World</h1>
  <p>Welcome to my site</p>
</div>
```

### Output: React JSX Component
```jsx
import React from "react";

export default function CapturedDivSection() {
  return (
    <>
      <div className="hero">
        <h1>Hello World</h1>
        <p>Welcome to my site</p>
      </div>
      <style
        dangerouslySetInnerHTML={{
          __html: `
html {
  box-sizing: border-box;
}
body {
  margin: 0px;
}
* {
  box-sizing: border-box;
}

/* All CSS styles including media queries */
.hero { ... }
@media (max-width: 768px) { ... }
`,
        }}
      />
    </>
  );
}
```

---

## 📊 Example Outputs

### With Shopify Mode ON (on gymshark.com)
```jsx
import React from "react";

export default function CapturedSectionSection() {
  return (
    <>
      <section className="hero" data-section-id="template--123">
        <h1>Welcome to Gymshark</h1>
      </section>
      <style dangerouslySetInnerHTML={{ __html: `
        .hero { ... }
        @media (max-width: 768px) { ... }
      ` }} />
    </>
  );
}

/*
 * 🏪 SHOPIFY SECTION DATA
 * 
 * Shop: gymshark.com
 * Theme: Dawn
 * 
 * Sections:
 *   - hero (template--123456--section)
 * 
 * Product:
 *   - Vital Seamless T-Shirt
 *   - Price: 29.99 USD
 */
```

### With Media Queries OFF
```jsx
import React from "react";

export default function CapturedDivSection() {
  return (
    <>
      <div className="container">
        <h1>Hello</h1>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        /* Only base styles, no @media queries */
        .container { ... }
      ` }} />
    </>
  );
}
```

---

## Features

✅ **Captures Everything:**
- All HTML structure
- All inline styles
- All CSS classes
- All external CSS (from stylesheets)
- All media queries (responsive CSS)

✅ **Converts to Valid React:**
- `class` → `className`
- `for` → `htmlFor`
- Self-closing tags (`<img />`, `<br />`)
- Style objects for inline styles
- Comments converted properly

✅ **Responsive by Default:**
- Preserves all media queries
- Captures responsive breakpoints
- Works with Tailwind, Bootstrap, custom CSS

✅ **Instant Clipboard:**
- Automatically copies React code
- No manual copy needed
- Paste anywhere (Canvas, VS Code, etc.)

---

## Works With

- ✅ Any website
- ✅ Tailwind CSS sites
- ✅ Bootstrap sites  
- ✅ Shopify stores
- ✅ WordPress sites
- ✅ Custom CSS sites
- ✅ Static sites
- ✅ Dynamic sites

---

## Troubleshooting

### Extension not appearing?
**Fix:** Reload extension at `chrome://extensions/`

### Capture button not working?
**Fix:** Refresh the webpage, try again

### Clipboard not working?
**Fix:** Check browser console (F12) for errors

### React code has errors?
**Fix:** The code is valid JSX - paste in React app, not plain HTML editor

---

## File Structure

```
chrome-extension/
├── manifest.json       # Extension config
├── popup.html          # Popup UI
├── popup.js            # Popup logic
├── content.js          # Main capture logic (HTML → React)
├── background.js       # Clipboard handling
├── content.css         # Selection overlay styles
└── icons/              # Extension icons
```

---

## How It Works (Technical)

1. **Selection Mode** - Overlay highlights elements on hover
2. **Capture HTML** - Clones element with all computed styles
3. **Extract CSS** - Collects all CSS rules from stylesheets
4. **Convert JSX** - Transforms HTML to React JSX
5. **Copy Clipboard** - Sends to background.js for clipboard API
6. **Notification** - Shows success message

---

## Tips

### For Best Results:

1. **Capture larger sections** - Click parent containers, not tiny elements
2. **Responsive sites** - All media queries automatically included
3. **Complex layouts** - Works with flexbox, grid, absolute positioning
4. **Images** - All image URLs preserved
5. **Links** - All href attributes preserved

### Canvas Integration:

Just paste (Ctrl+V) in your canvas editor - it's ready to render!

---

## Recent Captures

The extension saves your last 5 captures. Click any in the popup to re-copy.

---

## That's It!

Super simple. No settings. No configuration. Just capture → convert → paste.

**Try it now:**
1. Visit any website
2. Click extension
3. Click "Start Capture"
4. Click any element
5. Paste in your editor!

---

Made with ❤️ for Grab AI
