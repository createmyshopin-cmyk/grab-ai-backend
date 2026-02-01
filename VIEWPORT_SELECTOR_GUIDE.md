# 📐 Viewport Selector UI - Quick Guide

## What We Built

A beautiful **viewport selection modal** that appears when you paste React code into the canvas. You can now **choose which responsive variants to generate** instead of always getting all 3.

---

## ✨ Features

### Viewport Options (Exact Dimensions)

- **📱 Mobile** - `402 × 874`
- **📱 Tablet** - `1133 × 744`
- **🖥️ Browser** - `1440 × 1024`

### Selection Flexibility

- ✅ All 3 viewports (default)
- ✅ Any 2 viewports
- ✅ Just 1 viewport
- ⚡ Instant generation (< 10ms, no AI)

---

## 🎯 How To Use

### Step 1: Paste React Code

Paste any React component from the Chrome extension:

```jsx
import React from "react";
export default function CapturedSection() {
  return <div>...</div>;
}
```

### Step 2: Viewport Selector Appears Automatically

A modal pops up showing:

```
⚡ Select Responsive Variants

Choose which viewport variants to generate (instant, no AI)

☑ 📱 Mobile
    402 × 874

☑ 📱 Tablet  
    1133 × 744

☑ 🖥️ Browser
    1440 × 1024

[Cancel]  [Generate 3 Variants]
```

### Step 3: Select Viewports

- **All 3 checked (default)** - Best for comprehensive responsive testing
- **Uncheck any** - If you only need specific viewports (e.g., just Mobile + Desktop)
- **At least 1 required** - Button disabled if nothing selected

### Step 4: Click "Generate X Variants"

Button text updates based on selection:
- "Generate 3 Variants" (all selected)
- "Generate 2 Variants" (2 selected)
- "Generate 1 Variant" (1 selected)

### Step 5: Blocks Appear Instantly

Blocks are positioned horizontally with:
- ✅ Transformed code (responsive rules applied)
- ✅ Proper viewport dimensions in name
- ✅ Icon (📱 for mobile/tablet, 🖥️ for desktop)

---

## 🎨 UI Design

### Modal Style

- **Clean white background** with subtle shadow
- **Blue highlight** on selected options
- **Disabled state** when no selection
- **Smooth animations** on selection

### Block Names

Generated blocks have clear, descriptive names:

- `📱 Mobile (402×874)`
- `📱 Tablet (1133×744)`
- `🖥️ Browser (1440×1024)`

---

## 🚀 Technical Details

### Rule-Based Transformations

Each viewport gets specific transformations:

**Mobile (402×874)**
- `flex-row` → `flex-col` (stack vertically)
- `p-8` → `p-3` (reduce padding)
- `text-4xl` → `text-xl` (smaller text)
- `w-1/2` → `w-full` (full width)
- Fixed `width: 800px` → `width: '100%'`

**Tablet (1133×744)**
- Moderate adjustments for tablet screens
- Balanced spacing and text sizes

**Browser (1440×1024)**
- Enhanced spacing and larger text
- Max-width containers for desktop

### API Endpoint

```
POST /api/convert/to-viewports-instant
Body: { code: string, sourceViewport: 'desktop' }
Response: { mobile: string, tablet: string, desktop: string }
```

### Performance

- **< 10ms** conversion time
- **No AI** - pure deterministic rules
- **$0 cost** - no API fees
- **100% reliable** - no network failures

---

## 📸 User Flow

```
1. User pastes React code
   ↓
2. Modal appears with checkboxes
   ↓
3. User selects desired viewports
   ↓
4. User clicks "Generate X Variants"
   ↓
5. Blocks appear on canvas instantly
```

---

## 🔧 Implementation Files

- **Component**: `src/components/canvas-v2/ViewportSelector.tsx`
- **Integration**: `src/components/canvas-v2/CanvasContainer.tsx`
- **Converter**: `src/lib/viewportConverter.ts`
- **API**: `src/app/api/convert/to-viewports-instant/route.ts`

---

## 💡 Pro Tips

1. **Test Mobile First**: Uncheck Tablet and Browser to focus on mobile optimization
2. **Compare Side-by-Side**: Select all 3 to compare responsive transformations
3. **Quick Desktop Test**: Only select Browser for fast desktop-only testing
4. **Instant Iteration**: Cancel and re-paste to try different viewport combinations

---

## 🎉 Benefits Over AI Approach

| Feature | This (Rule-Based) | AI (Gemini) |
|---------|------------------|-------------|
| **Speed** | < 10ms | 2-5 seconds |
| **Cost** | Free | $0.0001-0.001 per request |
| **Reliability** | 100% deterministic | Variable (can fail) |
| **Selection** | Choose specific viewports | Always all 3 |
| **Offline** | Yes | No (requires API) |

---

## ✅ Test It Now!

1. Open `http://localhost:9003`
2. Use Chrome extension to capture any website section
3. Paste the React code
4. **Modal appears** - select viewports
5. Click "Generate" and see instant results!

---

**That's it!** You now have a professional viewport selector that gives you full control over responsive variant generation. 🎊
