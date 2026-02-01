# ⚡ Instant Viewport Conversion (No AI)

## Overview

**Rule-based viewport conversion** that creates Mobile, Tablet, and Desktop variants **instantly** without any AI API calls.

### Benefits
- ⚡ **Instant** - No API calls, no waiting
- 💰 **Free** - No AI costs
- 🎯 **Reliable** - Deterministic transformations
- 🔒 **Private** - All processing client-side or server-side (no external APIs)

---

## How It Works

### 1. Tailwind Class Transformations

Automatically transforms responsive Tailwind classes:

**Mobile (320px - 767px)**
- `flex-row` → `flex-col` (stack vertically)
- `p-8` → `p-3` (reduce padding)
- `text-4xl` → `text-xl` (smaller text)
- `w-1/2` → `w-full` (full width)
- `gap-6` → `gap-2` (tighter spacing)

**Tablet (768px - 1023px)**
- `p-8` → `p-5` (moderate padding)
- `text-6xl` → `text-4xl` (moderate text)
- `w-full` → `w-2/3` (two-thirds width)

**Desktop (1024px+)**
- `p-3` → `p-6` (generous padding)
- `text-2xl` → `text-4xl` (larger text)
- Adds `max-w-7xl mx-auto` container

### 2. Inline Style Transformations

**Mobile:**
- Fixed `width: 800px` → `width: '100%'`
- `fontSize: 48px` → `fontSize: 34px` (30% reduction)

**Tablet:**
- `fontSize: 48px` → `fontSize: 41px` (15% reduction)

### 3. Responsive Prefix Removal

Removes Tailwind responsive prefixes (`sm:`, `md:`, `lg:`, `xl:`) and applies the appropriate base classes for each viewport.

---

## Usage

### From Canvas (Paste Code)

1. Paste React/JSX code into the canvas
2. **Viewport Selector modal appears** with checkboxes:
   - ☑ 📱 Mobile (402 × 874)
   - ☑ 📱 Tablet (1133 × 744)  
   - ☑ 🖥️ Browser (1440 × 1024)
3. Select which viewports you want (1, 2, or all 3)
4. Click "Generate X Variants"
5. **Selected blocks created instantly** with responsive transformations

**API Endpoint:** `/api/convert/to-viewports-instant`

```javascript
// Example API call
fetch('/api/convert/to-viewports-instant', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    code: reactComponentCode,
    sourceViewport: 'desktop' // or 'mobile' or 'tablet'
  })
})
.then(res => res.json())
.then(data => {
  console.log('Mobile:', data.mobile);
  console.log('Tablet:', data.tablet);
  console.log('Desktop:', data.desktop);
});
```

### From Chrome Extension

The viewport converter is built into the extension:

```javascript
// Available globally in content.js
const variants = window.viewportConverter.convertToViewports(reactCode);

console.log(variants.mobile);
console.log(variants.tablet);
console.log(variants.desktop);
```

**Future Enhancement:** Add a checkbox in the extension popup:
- ☐ Generate 3 viewport variants (Mobile, Tablet, Desktop)

---

## Transformation Rules

### Complete Rule Set

```javascript
VIEWPORT_RULES = {
  mobile: {
    flexDirection: {
      'flex-row': 'flex-col',
      'flex-row-reverse': 'flex-col-reverse',
    },
    spacing: {
      'p-8': 'p-3', 'p-6': 'p-3', 'p-4': 'p-2',
      'px-8': 'px-3', 'px-6': 'px-4', 'px-4': 'px-3',
      'py-8': 'py-3', 'py-6': 'py-4', 'py-4': 'py-3',
      'm-8': 'm-2', 'm-6': 'm-2', 'm-4': 'm-2',
    },
    text: {
      'text-6xl': 'text-3xl',
      'text-5xl': 'text-2xl',
      'text-4xl': 'text-xl',
      'text-3xl': 'text-lg',
      'text-2xl': 'text-base',
      'text-xl': 'text-base',
      'text-lg': 'text-sm',
    },
    width: {
      'w-1/2': 'w-full',
      'w-1/3': 'w-full',
      'w-1/4': 'w-full',
      'w-2/3': 'w-full',
      'w-3/4': 'w-full',
    },
    gap: {
      'gap-8': 'gap-2',
      'gap-6': 'gap-2',
      'gap-4': 'gap-2',
    },
  },
  // ... tablet and desktop rules (see source code)
};
```

---

## Comparison: AI vs Rule-Based

| Feature | AI (Gemini) | Rule-Based |
|---------|-------------|------------|
| **Speed** | 2-5 seconds | < 10ms |
| **Cost** | $0.0001-0.001 per request | $0 (free) |
| **Reliability** | Variable (API can fail) | 100% deterministic |
| **Quality** | Sometimes creative | Consistent, predictable |
| **Requires API Key** | Yes | No |
| **Works Offline** | No | Yes (client-side) |

---

## Extension: Adding Viewport Conversion Feature

To add a "Generate 3 Viewports" option to the extension popup:

1. **Add checkbox to `popup.html`:**
```html
<label>
  <input type="checkbox" id="multiViewportCheckbox">
  <span>📱 Generate 3 Viewports (Mobile, Tablet, Desktop)</span>
</label>
```

2. **Save setting in `popup.js`:**
```javascript
multiViewportCheckbox.addEventListener('change', async (e) => {
  await chrome.storage.local.set({ multiViewport: e.target.checked });
});
```

3. **Use in `content.js`:**
```javascript
const { multiViewport } = await chrome.storage.local.get(['multiViewport']);

if (multiViewport) {
  const variants = window.viewportConverter.convertToViewports(reactCode);
  
  // Copy all 3 variants
  const combined = `
    // 📱 MOBILE
    ${variants.mobile}
    
    // 📱 TABLET
    ${variants.tablet}
    
    // 🖥️ DESKTOP
    ${variants.desktop}
  `;
  
  navigator.clipboard.writeText(combined);
}
```

---

## Future Enhancements

1. **More transformation rules** for other CSS frameworks (Bootstrap, Material UI)
2. **Custom breakpoints** (user-defined viewport sizes)
3. **Media query splitting** (extract and categorize existing `@media` rules)
4. **Grid/Flexbox detection** (smarter layout transformations)
5. **Image optimization** (different srcset for each viewport)

---

## Files

- **Server:** `src/lib/viewportConverter.ts` + `src/app/api/convert/to-viewports-instant/route.ts`
- **Canvas:** `src/components/canvas-v2/CanvasContainer.tsx` (line 162)
- **Extension:** `chrome-extension/viewport-converter.js`

---

## Testing

Test the instant conversion:

```bash
# Start dev server
npm run dev

# Open http://localhost:9003
# Paste React code
# Press Shift + R

# Result: 3 blocks appear instantly (Mobile, Tablet, Desktop)
```

The transformation is **< 10ms** and works 100% offline!
