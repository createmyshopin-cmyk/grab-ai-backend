# 📦 Complete Dependency Capture

## ✨ What's New

**Automatic Dependency Detection** - The extension now captures ALL dependencies (CSS, JavaScript, CDN libraries, fonts, media) when you select a section or container!

```
Before:
Capture element → Get HTML + CSS only

After:
Capture element → Get EVERYTHING:
  ✅ HTML + inline CSS
  ✅ External stylesheets
  ✅ JavaScript files
  ✅ Inline scripts
  ✅ CDN libraries (jQuery, Bootstrap, GSAP, etc.)
  ✅ Web fonts (Google Fonts, custom fonts)
  ✅ Images & videos
  ✅ iframes
  ✅ Data attributes
  ✅ Event listeners
  ✅ Framework detection (React, Vue, Alpine, etc.)
  ✅ Capability analysis (interactive, animated, etc.)
```

---

## 🎯 What Gets Captured

### 1. **Stylesheets** 📄
```javascript
Detected:
- External CSS files (<link rel="stylesheet">)
- Inline <style> tags within element
- Global stylesheets from <head>
- CDN stylesheets (Bootstrap, Tailwind, etc.)

Example:
{
  stylesheets: [
    {
      href: "https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css",
      media: "all",
      type: "external"
    },
    {
      content: ".card { border-radius: 8px; }",
      type: "inline"
    }
  ]
}
```

### 2. **JavaScript Files & Scripts** 📜
```javascript
Detected:
- External JS files (<script src="">)
- Inline <script> code
- Async/defer loading status
- Script location (element vs global)

Example:
{
  scripts: [
    {
      src: "https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js",
      async: true,
      defer: false,
      type: "text/javascript",
      location: "element"
    }
  ],
  inlineScripts: [
    {
      content: "document.addEventListener('DOMContentLoaded', ...)",
      type: "text/javascript",
      location: "element"
    }
  ]
}
```

### 3. **CDN Libraries** 📚
```javascript
Detected Automatically:
- jQuery
- Bootstrap
- Tailwind CSS
- Alpine.js
- Vue.js
- React
- GSAP (animation)
- Swiper / Slick (carousels)
- AOS (scroll animations)
- Font Awesome / Material Icons
- Lodash
- Axios
- Chart.js
- Moment.js / Day.js
- Lottie (animations)
- Three.js (3D)
- Anime.js

Example:
{
  cdnLibraries: [
    {
      name: "Swiper",
      category: "Carousel",
      url: "https://cdn.jsdelivr.net/npm/swiper@11/...",
      detected: true
    },
    {
      name: "GSAP",
      category: "Animation",
      url: "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.0/...",
      detected: true
    }
  ]
}
```

### 4. **Web Fonts** 🔤
```javascript
Detected:
- Google Fonts (@import)
- Custom @font-face rules
- <link> tags for fonts
- Only fonts actually USED by the element

Example:
{
  fonts: [
    {
      family: "Inter",
      source: "google",
      url: "https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap"
    },
    {
      family: "CustomFont",
      source: "local",
      formats: ["woff2", "woff"]
    }
  ]
}
```

### 5. **Media Resources** 🖼️🎥
```javascript
Detected:
- <img> tags
- Background images (CSS)
- Lazy-loaded images (data-src)
- <video> and <source> tags
- Video sources

Example:
{
  images: [
    "https://example.com/hero-image.jpg",
    "https://example.com/product-photo.webp"
  ],
  videos: [
    "https://example.com/promo-video.mp4"
  ]
}
```

### 6. **Embedded Content** 📺
```javascript
Detected:
- <iframe> embeds
- YouTube videos
- Vimeo players
- Maps
- Third-party widgets

Example:
{
  iframes: [
    {
      src: "https://www.youtube.com/embed/VIDEO_ID",
      width: "560",
      height: "315",
      title: "Product Demo Video",
      sandbox: "allow-scripts allow-same-origin"
    }
  ]
}
```

### 7. **Data Attributes** 🏷️
```javascript
Detected Important Attributes:
- data-controller (Stimulus)
- data-action (Stimulus)
- data-target (Stimulus)
- x-data (Alpine.js)
- x-init, x-show, x-bind (Alpine.js)
- data-section-id (Shopify)
- data-section-type (Shopify)
- data-product-id (E-commerce)
- data-variant-id (E-commerce)
- data-toggle, data-bs-toggle (Bootstrap)

Example:
{
  dataAttributes: {
    "data-controller": "product-form",
    "data-section-id": "hero-banner",
    "x-data": "{ open: false }"
  }
}
```

### 8. **Event Listeners** 👂
```javascript
Detected:
- Inline event handlers (onclick, onload, etc.)
- Alpine.js event handlers (x-on:click, @click)
- Framework-specific events

Example:
{
  eventListeners: [
    {
      type: "click",
      method: "inline",
      code: "handleAddToCart()",
      element: "BUTTON"
    },
    {
      type: "alpine",
      framework: "Alpine.js",
      element: "DIV"
    }
  ]
}
```

### 9. **Framework Detection** ⚛️
```javascript
Detected Frameworks:
- React (data-reactroot, _reactRootContainer)
- Vue.js (v-if, v-for, v-model)
- Alpine.js (x-data)
- Angular (ng-app, ng-controller)
- Stimulus (data-controller)
- Shopify Liquid (shopify-section classes)

Example:
{
  frameworks: ["Alpine.js", "Shopify Liquid"]
}
```

### 10. **Capability Analysis** ✨
```javascript
Analyzed Automatically:
- Has interactivity (buttons, forms, inputs)
- Has animations (CSS or JS)
- Has forms (input, textarea, select)
- Has media (images, videos, iframes)

Example:
{
  meta: {
    hasInteractivity: true,  // Buttons detected
    hasAnimations: true,      // GSAP detected
    hasForms: false,          // No forms
    hasMedia: true            // Images + videos
  }
}
```

---

## 🎬 User Experience

### Visual Preview with Dependencies

When you capture an element, the preview modal now shows:

```
┌──────────────────────────────────────────┐
│ 📸 Preview Capture                       │
│ <section.hero> • 1200×600px             │
├──────────────────────────────────────────┤
│                                          │
│  [SCREENSHOT OF ELEMENT]                 │
│                                          │
├──────────────────────────────────────────┤
│ 📦 Dependencies Detected                 │
│ These resources will be included         │
│                                          │
│ 📚 Libraries: Swiper  GSAP  Alpine.js    │
│ ⚛️ Frameworks: Alpine.js                  │
│ 📄 Stylesheets: 3 file(s)                │
│ 📜 Scripts: 2 file(s)                     │
│ 🔤 Fonts: 2 font(s)                       │
│ 🖼️ Images: 5 image(s)                     │
│ ✨ Features: Interactive  Animated        │
├──────────────────────────────────────────┤
│         [Cancel]  [✓ Confirm Capture]    │
└──────────────────────────────────────────┘
```

### Console Logging

Detailed dependency scan results in console:

```
🔍 Starting dependency scan...
  📄 Found 3 stylesheets
  📜 Found 2 external scripts, 1 inline scripts
  📚 Detected 3 CDN libraries
  🔤 Found 2 fonts
  🖼️ Found 5 images, 0 videos
  📺 Found 0 iframes
  🏷️ Found 4 data attributes
  👂 Found 3 event listeners
  ⚛️ Detected frameworks: Alpine.js, Shopify Liquid
  📊 Capabilities: {
    hasInteractivity: true,
    hasAnimations: true,
    hasForms: false,
    hasMedia: true
  }
✅ Dependency scan complete
```

---

## 🔧 Technical Implementation

### Scan Process
```javascript
async function scanElementDependencies(element) {
  1. Scan stylesheets (external + inline)
  2. Scan scripts (external + inline)
  3. Detect CDN libraries (pattern matching)
  4. Extract web fonts (already implemented)
  5. Scan media (images, videos)
  6. Scan iframes (embedded content)
  7. Extract data attributes (framework-specific)
  8. Detect event listeners (inline + framework)
  9. Detect frameworks (React, Vue, Alpine, etc.)
  10. Analyze capabilities (interactive, animated, etc.)
  
  return dependencies;
}
```

### Dependency Object Structure
```javascript
{
  stylesheets: [],       // External CSS files
  scripts: [],           // External JS files
  inlineScripts: [],     // Inline <script> code
  inlineStyles: [],      // Inline <style> code
  cdnLibraries: [],      // Detected CDN libraries
  fonts: [],             // Font resources
  images: [],            // Image URLs
  videos: [],            // Video URLs
  iframes: [],           // Embedded iframes
  dataAttributes: {},    // Important data-* attributes
  eventListeners: [],    // Detected event listeners
  frameworks: [],        // Detected frameworks
  meta: {                // Capability analysis
    hasInteractivity: false,
    hasAnimations: false,
    hasForms: false,
    hasMedia: false
  }
}
```

### Integration Points

**1. Visual Preview (Before Capture)**
```javascript
showVisualPreview(element) {
  // Scan dependencies FIRST
  const dependencies = await scanElementDependencies(element);
  
  // Include in elementInfo
  elementInfo.dependencies = dependencies;
  
  // Display in preview modal
  displayPreviewModal(element, screenshot, elementInfo);
}
```

**2. Capture (When Confirmed)**
```javascript
captureElement(element) {
  // Scan dependencies
  const dependencies = await scanElementDependencies(element);
  
  // Include in capture data
  chrome.runtime.sendMessage({
    action: 'elementCaptured',
    data: {
      reactCode: reactCode,
      html: html,
      dependencies: dependencies, // ← All dependencies
      ...
    }
  });
}
```

---

## 📊 Use Cases

### Use Case 1: Interactive Carousel
```
Element: Product carousel with Swiper
Detected:
  ✅ Swiper.js CDN
  ✅ Swiper CSS
  ✅ Inline initialization script
  ✅ 8 product images
  ✅ Navigation buttons (interactive)
  ✅ Alpine.js for state management

Result: Developer knows they need Swiper + Alpine
```

### Use Case 2: Animated Hero Section
```
Element: Hero banner with GSAP animations
Detected:
  ✅ GSAP CDN
  ✅ ScrollTrigger plugin
  ✅ Custom animation script
  ✅ Google Font (Inter)
  ✅ Background video
  ✅ Animated elements

Result: Developer knows they need GSAP + fonts + video
```

### Use Case 3: Shopify Product Card
```
Element: Product card with variant selector
Detected:
  ✅ Shopify Liquid framework
  ✅ data-product-id attribute
  ✅ data-variant-id attributes
  ✅ Alpine.js for interactions
  ✅ Product images (lazy-loaded)
  ✅ Add to Cart button (interactive)

Result: Developer knows Shopify + Alpine integration needed
```

### Use Case 4: Form Section
```
Element: Newsletter signup form
Detected:
  ✅ Form elements (input, button)
  ✅ Bootstrap CSS
  ✅ Bootstrap JS (validation)
  ✅ jQuery (for AJAX)
  ✅ Inline submit handler
  ✅ Has forms: true

Result: Developer knows Bootstrap + jQuery dependencies
```

---

## 🎯 Benefits

### For Developers
✅ **Know exactly what's needed** - No guessing about dependencies  
✅ **CDN detection** - See what libraries are already loaded  
✅ **Framework awareness** - Know if React/Vue/Alpine is used  
✅ **Script analysis** - See what JavaScript is attached  
✅ **Complete context** - Understand element capabilities  

### For Reproduction
✅ **Pixel-perfect reproduction** - Include all necessary resources  
✅ **Functional parity** - Know what scripts to recreate  
✅ **Style completeness** - All CSS dependencies identified  
✅ **Media tracking** - All images/videos cataloged  

### For Documentation
✅ **Dependency manifest** - Complete list of resources  
✅ **Framework documentation** - Know what to document  
✅ **Integration guide** - Clear dependency requirements  
✅ **Capability checklist** - Interactive, animated, etc.  

---

## 🧪 Testing Examples

### Test 1: Basic Product Card
```html
<div class="product-card" data-product-id="12345">
  <img src="product.jpg">
  <h3>Product Name</h3>
  <button onclick="addToCart()">Add to Cart</button>
</div>

Expected Dependencies:
✅ data-product-id attribute
✅ 1 image
✅ 1 event listener (onclick)
✅ hasInteractivity: true
```

### Test 2: Swiper Carousel
```html
<div class="swiper">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css">
  <script src="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js"></script>
  <div class="swiper-wrapper">...</div>
</div>

Expected Dependencies:
✅ Swiper CDN library
✅ Swiper CSS
✅ Swiper JS
✅ Multiple images
✅ hasInteractivity: true
```

### Test 3: Alpine.js Component
```html
<div x-data="{ open: false }">
  <button @click="open = !open">Toggle</button>
  <div x-show="open">Content</div>
</div>

Expected Dependencies:
✅ Alpine.js framework
✅ x-data attribute
✅ Alpine event listeners (@click)
✅ hasInteractivity: true
```

### Test 4: Embedded Video
```html
<section class="video-section">
  <iframe src="https://www.youtube.com/embed/VIDEO_ID"></iframe>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700" rel="stylesheet">
</section>

Expected Dependencies:
✅ 1 iframe (YouTube)
✅ Google Font (Inter)
✅ hasMedia: true
```

---

## 📝 Complete Capture Data

### Before (Old)
```javascript
{
  reactCode: "...",
  html: "...",
  tagName: "section",
  className: "hero",
  pageUrl: "https://example.com"
}
```

### After (New)
```javascript
{
  reactCode: "...",
  html: "...",
  tagName: "section",
  className: "hero",
  pageUrl: "https://example.com",
  dependencies: {
    stylesheets: [
      { href: "bootstrap.min.css", media: "all", type: "external" }
    ],
    scripts: [
      { src: "swiper.min.js", async: true, type: "text/javascript" }
    ],
    inlineScripts: [
      { content: "new Swiper(...)", type: "text/javascript" }
    ],
    cdnLibraries: [
      { name: "Bootstrap", category: "Framework", url: "..." },
      { name: "Swiper", category: "Carousel", url: "..." }
    ],
    fonts: [
      { family: "Inter", source: "google", url: "..." }
    ],
    images: [
      "hero-image.jpg",
      "product-1.jpg",
      "product-2.jpg"
    ],
    videos: [],
    iframes: [],
    dataAttributes: {
      "data-section-id": "hero-section",
      "x-data": "{ slideIndex: 0 }"
    },
    eventListeners: [
      { type: "click", method: "inline", code: "handleClick()" }
    ],
    frameworks: ["Alpine.js", "Shopify Liquid"],
    meta: {
      hasInteractivity: true,
      hasAnimations: true,
      hasForms: false,
      hasMedia: true
    }
  }
}
```

---

## 🚀 How to Use

### Step 1: Start Capture
```
Click extension → "Start Capture"
```

### Step 2: Select Element
```
Hover element → Auto-selects container
(dependencies scanned automatically!)
```

### Step 3: Preview
```
Click → Preview modal appears
Shows dependencies detected
```

### Step 4: Review Dependencies
```
📦 Dependencies Detected section shows:
- Libraries (Swiper, GSAP, etc.)
- Frameworks (Alpine.js, etc.)
- Files (CSS, JS count)
- Media (images, videos)
- Features (Interactive, Animated)
```

### Step 5: Confirm
```
Click "✓ Confirm Capture"
All dependencies included in capture data
```

### Step 6: Paste & Use
```
Paste in canvas
Dependencies available in metadata
Use dependency info to recreate functionality
```

---

## 🎊 Summary

### What Was Added:
1. ✅ `scanElementDependencies()` function
2. ✅ Stylesheet scanning
3. ✅ Script scanning (external + inline)
4. ✅ CDN library detection (20+ libraries)
5. ✅ Media scanning (images, videos)
6. ✅ Iframe detection
7. ✅ Data attribute extraction
8. ✅ Event listener detection
9. ✅ Framework detection (6 frameworks)
10. ✅ Capability analysis
11. ✅ Visual preview with dependency summary
12. ✅ Integration with capture data

### Detected Resources:
- ✅ Stylesheets (external + inline)
- ✅ Scripts (external + inline)
- ✅ CDN libraries (jQuery, Bootstrap, GSAP, etc.)
- ✅ Web fonts (Google Fonts + custom)
- ✅ Images (including lazy-loaded)
- ✅ Videos
- ✅ Iframes
- ✅ Data attributes
- ✅ Event listeners
- ✅ Frameworks (React, Vue, Alpine, etc.)

### Use Cases:
- Know what CDN libraries are needed
- Identify framework dependencies
- Track all media resources
- Document script requirements
- Understand element capabilities
- Complete dependency manifest

---

## 🧪 Test Now!

### Quick Test (3 minutes):
```bash
1. Reload extension
   chrome://extensions → Reload

2. Visit a website with carousels
   (E-commerce sites often have Swiper)

3. Start capture
   Click extension → "Start Capture"

4. Hover product carousel
   Auto-selects carousel container

5. Click to preview
   Preview modal appears

6. Check dependencies! 🎯
   ✅ Should show "Swiper" library
   ✅ Should show scripts count
   ✅ Should show images count
   ✅ Should show "Interactive" + "Animated"

7. Open console
   See detailed dependency scan log

8. Confirm capture
   Dependencies included in data
```

### Expected Results:
```
✅ Dependency scan runs automatically
✅ CDN libraries detected (Swiper, etc.)
✅ Scripts counted correctly
✅ Images counted correctly
✅ Preview shows dependency summary
✅ Console shows detailed scan log
✅ Capture data includes dependencies
```

---

**Complete dependency capture is now live!** 📦🔗✨

The extension now knows **EVERYTHING** about your captured element:
1. ✅ All CSS dependencies
2. ✅ All JavaScript dependencies
3. ✅ All CDN libraries
4. ✅ All fonts
5. ✅ All media
6. ✅ All frameworks
7. ✅ All capabilities

**Test it now and see the magic!** 🚀
