# 🚀 Quick Start Guide: Auto Viewports + Animations

## ✨ What's New

### 1. Auto Viewport Conversion
Paste once → Get 3 responsive variants automatically!

### 2. Animation Support
Marquee, carousels, and all CSS animations now work!

---

## 📱 Using Auto Viewports

### Step 1: Enable the Feature
Look at the top toolbar:

```
┌─────────────────────────────────────────────────┐
│ [IC] Themes  [✓ Auto Viewports]  Import  Share │
│              ↑ Click this!                      │
└─────────────────────────────────────────────────┘
```

**States:**
- 🟢 **Green = ON** → Generates 3 variants
- ⚪ **Gray = OFF** → Single component (old behavior)

### Step 2: Paste Your Component
1. Copy HTML, React, or CSS code
2. Click anywhere on canvas
3. Press `Ctrl+V` (or `Cmd+V` on Mac)
4. Wait ~5 seconds ⏱️

### Step 3: See the Magic! ✨

```
Canvas Layout:
┌──────────────┬───────────────┬───────────────┐
│   MOBILE     │    TABLET     │   DESKTOP     │
│   (400px)    │    (768px)    │   (1200px)    │
│              │               │               │
│  [Stacked]   │  [2-Column]   │  [3-Column]   │
│  Vertical    │   Grid        │   Full        │
│  Layout      │   Layout      │   Layout      │
└──────────────┴───────────────┴───────────────┘
```

**What You Get:**
- ✅ Mobile: Touch-optimized, vertical stack
- ✅ Tablet: 2-column grid, hybrid nav
- ✅ Desktop: Multi-column, hover states

---

## 🎬 Using Animation Capture

### Step 1: Reload Extension
**IMPORTANT:** Must reload after updating!

```
1. Open chrome://extensions
2. Find "Grab AI - HTML to React"
3. Click 🔄 (reload icon)
```

### Step 2: Capture Animated Element
```
1. Click extension icon 📌
2. Click "Start Capture" button
3. Hover over element with animation
4. Click to capture
5. Extension says "✅ React JSX Ready!"
```

### Step 3: Paste in Canvas
```
1. Click canvas area
2. Press Ctrl+V
3. Animation runs immediately! 🎉
```

---

## 🎯 Example Workflows

### Workflow 1: Shopify Hero Banner (with Animation)

**Input:** Shopify hero section with fade-in text
```html
<section class="hero fade-in">
  <h1>Welcome to Our Store</h1>
</section>

<style>
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
.fade-in {
  animation: fade-in 1s ease;
}
</style>
```

**Steps:**
1. ✅ Enable "Auto Viewports"
2. 📋 Capture section with extension
3. ⌨️ Paste in canvas (Ctrl+V)

**Result:**
```
[Mobile Hero]    [Tablet Hero]    [Desktop Hero]
- Fade-in ✓      - Fade-in ✓      - Fade-in ✓
- Vertical       - Wider           - Full width
- Touch btn      - Larger btn      - Hover effects
```

### Workflow 2: Product Carousel (with Marquee)

**Input:** Infinite scrolling product list
```html
<div class="marquee">
  <div class="track">
    <img src="product1.jpg">
    <img src="product2.jpg">
    ...
  </div>
</div>

<style>
@keyframes scroll {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
.marquee .track {
  animation: scroll 20s linear infinite;
}
</style>
```

**Steps:**
1. ✅ Enable "Auto Viewports"
2. 📋 Capture carousel
3. ⌨️ Paste in canvas

**Result:**
```
[Mobile Carousel]      [Tablet Carousel]     [Desktop Carousel]
- Scrolls ✓            - Scrolls ✓           - Scrolls ✓
- 1-2 items visible    - 3-4 items visible   - 5-6 items visible
- Slower speed         - Medium speed        - Original speed
```

### Workflow 3: Navigation Menu (Responsive)

**Input:** Desktop nav with mobile hamburger
```html
<nav class="navbar">
  <div class="logo">Brand</div>
  <div class="menu">
    <a href="#">Home</a>
    <a href="#">Shop</a>
    <a href="#">About</a>
  </div>
</nav>
```

**Steps:**
1. ✅ Enable "Auto Viewports"
2. 📋 Capture navigation
3. ⌨️ Paste in canvas

**Result:**
```
[Mobile Nav]           [Tablet Nav]          [Desktop Nav]
- Hamburger menu       - Hybrid menu         - Full horizontal
- Stacked items        - Icons + text        - All links visible
- Touch-friendly       - Collapsible         - Hover dropdowns
```

---

## 🔧 Troubleshooting

### ❌ Animations Not Working

**Problem:** Component appears static, no movement

**Solution:**
```
1. ✅ Reload extension (chrome://extensions)
2. ✅ Check original site (does animation work there?)
3. ✅ Try simpler animation first (test with fade-in)
4. ✅ Check browser console for errors
```

**Debug:**
- Open pasted component's code
- Look for `<style>` block
- Should contain `@keyframes`

```javascript
<style dangerouslySetInnerHTML={{
  __html: `
    @keyframes scroll { ... }  // ← Should be here!
  `
}} />
```

### ❌ Viewport Conversion Failing

**Problem:** Only 1 block appears instead of 3

**Solution:**
```
1. ✅ Check .env.local has GOOGLE_GEMINI_API_KEY
2. ✅ Verify API key is valid
3. ✅ Check terminal for errors
4. ✅ Try with simpler component
```

**Fallback:**
- If conversion fails, you still get 1 component
- Error notification shows what went wrong
- You can manually adjust for viewports

### ❌ Components Look Broken

**Problem:** Layout is messed up or overlapping

**Solution:**
```
1. ✅ Check if original site uses external CSS
2. ✅ Verify images are loading (check network tab)
3. ✅ Try capturing larger container
4. ✅ Disable browser extensions (AdBlock, etc.)
```

**Tips:**
- Capture the parent section, not individual elements
- Look for `.container`, `<section>`, `<main>` tags
- Shopify sections have `data-section-id`

---

## 💡 Pro Tips

### For Best Results

**1. Capture Logical Sections**
✅ DO: Capture entire `<section>`, `<header>`, `<article>`
❌ DON'T: Capture individual `<div>`, `<span>`, `<p>`

**2. Check for External Resources**
✅ DO: Verify images, fonts load correctly
❌ DON'T: Assume all resources are inline

**3. Test on Multiple Sites**
✅ DO: Try Shopify, WordPress, custom sites
❌ DON'T: Only test on one type of site

### Keyboard Shortcuts

```
Ctrl/Cmd + V     → Paste component
Ctrl/Cmd + D     → Duplicate selected
Ctrl/Cmd + U     → Upload screenshot
Delete/Backspace → Delete selected
Escape           → Deselect all
Space + Drag     → Pan canvas
Mouse Wheel      → Zoom in/out
```

### Canvas Tips

**Organizing Viewports:**
- Drag blocks to rearrange
- Use space between for clarity
- Label blocks (click name to edit)
- Group related components

**Testing Responsive:**
- Resize blocks to test breakpoints
- Check text wrapping
- Verify button sizes
- Test navigation behavior

---

## 📊 Performance Guide

### What's Fast ⚡
- Simple components (< 100 elements)
- Pure CSS animations
- Inline styles
- Standard HTML tags

### What's Slow 🐌
- Complex components (> 500 elements)
- Many nested divs
- External stylesheet dependencies
- JavaScript-heavy pages

### Optimization Tips
1. **Simplify Before Capture**
   - Remove unnecessary wrappers
   - Clean up nested divs
   - Inline critical CSS

2. **Use Loading States**
   - Show placeholders while generating
   - Progressive enhancement
   - Lazy load images

3. **Cache Results**
   - Components auto-save to Supabase
   - Reuse common patterns
   - Export for later use

---

## 🎓 Learning Path

### Beginner
1. ✅ Paste simple HTML (1 element)
2. ✅ See single component render
3. ✅ Enable Auto Viewports
4. ✅ Paste same HTML again
5. ✅ Compare 3 variants

### Intermediate
1. ✅ Capture Shopify product card
2. ✅ Verify responsive layouts
3. ✅ Capture with animation (marquee)
4. ✅ Test in all viewports
5. ✅ Export and use in project

### Advanced
1. ✅ Capture complex sections (hero, nav, footer)
2. ✅ Customize AI prompts (edit API route)
3. ✅ Add custom viewport sizes
4. ✅ Integrate with Figma
5. ✅ Build component library

---

## 📚 Resources

### Documentation
- `ANIMATION_FIX.md` - Technical animation details
- `SESSION_SUMMARY.md` - Full feature overview
- `README.md` - Project setup

### API Endpoints
- `/api/convert/to-viewports` - Responsive conversion
- `/api/convert/direct` - HTML to React
- `/api/preview/chatgpt` - AI enhancement
- `/api/analyze` - Keyword extraction

### Code Examples
- `src/components/canvas-v2/` - Canvas components
- `chrome-extension/` - Extension code
- `src/lib/htmlToReactConverter.ts` - Conversion logic

---

## 🎉 Success Checklist

Before considering this feature "working", verify:

- [ ] "Auto Viewports" button visible in toolbar
- [ ] Button toggles green ↔ gray
- [ ] Pasting with toggle ON creates 3 blocks
- [ ] Pasting with toggle OFF creates 1 block
- [ ] Mobile variant has vertical layout
- [ ] Tablet variant has 2-column grid
- [ ] Desktop variant has multi-column layout
- [ ] Extension reloaded after update
- [ ] Marquee animation captured
- [ ] Animation runs in canvas
- [ ] Animation loops correctly
- [ ] All 3 viewports show animation
- [ ] No console errors
- [ ] Supabase sync working (if configured)

---

## 🆘 Getting Help

### Quick Fixes (Try First)
1. Reload Chrome extension
2. Refresh browser page
3. Clear browser cache
4. Restart dev server (`npm run dev`)

### Still Stuck?
- Check browser console (F12)
- Check terminal/logs
- Read error messages carefully
- Try minimal example first

### Common Error Messages

**"Failed to generate responsive variants"**
- Check API key in `.env.local`
- Verify Gemini API quota
- Try with simpler component

**"Capture Failed"**
- Reload extension
- Try different element
- Check for CORS issues
- Look at browser console

**"Animation not defined"**
- Verify `@keyframes` in captured CSS
- Check animation-name matches keyframe name
- Ensure animation properties captured

---

## 🚀 Next Steps

Now that you have both features working:

1. **Build Component Library**
   - Capture your favorite sections
   - Organize by viewport
   - Export for reuse

2. **Customize Prompts**
   - Edit `/api/convert/to-viewports/route.ts`
   - Add brand-specific guidelines
   - Fine-tune responsive behavior

3. **Share with Team**
   - Export components
   - Document patterns
   - Create style guide

4. **Integrate with Workflow**
   - Use in Shopify themes
   - Export to Figma
   - Build design system

---

**Ready to build amazing responsive components! 🎨**
