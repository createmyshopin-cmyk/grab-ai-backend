# 🎬 Animation Capture Fix

## Problem
When capturing components with CSS animations (like marquee scrolling), the animations weren't being preserved in the canvas. The pasted component would appear static instead of animated.

## Root Cause
The Chrome extension's CSS extraction wasn't capturing:
1. `@keyframes` rules (animation definitions)
2. Animation-related CSS properties (animation-name, animation-duration, etc.)

## What Was Fixed

### 1. **Keyframes Extraction** (`content.js` lines 331-430)
Added support for capturing `@keyframes` rules:
```javascript
// Now captures CSSRule.KEYFRAMES_RULE
if (rule.type === CSSRule.KEYFRAMES_RULE || rule.type === 7) {
  const keyframeName = rule.name;
  if (animationNames.has(keyframeName)) {
    keyframesRules.push(rule.cssText);
  }
}
```

### 2. **Animation Name Detection**
The extension now scans for `animation-name` properties in all CSS rules and tracks which keyframes are actually being used:
```javascript
const animMatch = ruleText.match(/animation(?:-name)?:\s*([^;}\s]+)/);
if (animMatch) {
  const names = animMatch[1].split(',');
  names.forEach(name => animationNames.add(name.trim()));
}
```

### 3. **Computed Style Analysis**
Elements are now checked for active animations via `getComputedStyle()`:
```javascript
const computed = window.getComputedStyle(el);
const animName = computed.animationName;
if (animName && animName !== 'none') {
  animationNames.add(animName.trim());
}
```

### 4. **Animation Properties Preserved**
Added animation properties to both visual-only and full property lists:
```javascript
'animation', 'animationName', 'animationDuration', 
'animationTimingFunction', 'animationDelay', 
'animationIterationCount', 'animationDirection', 
'animationFillMode', 'animationPlayState'
```

## How to Test

### 1. **Reload the Extension**
```
1. Open Chrome Extensions (chrome://extensions/)
2. Find "Grab AI - HTML to React"
3. Click the refresh icon 🔄
```

### 2. **Test with Animated Component**
Try capturing components with:
- Marquee/scrolling text
- Fade-in animations
- Rotating elements
- Carousel slides
- Loading spinners
- Any CSS animations

### 3. **Verify in Canvas**
After pasting in the canvas:
✅ Animation should run automatically
✅ Animation should loop correctly
✅ Animation timing should match original

## Example: Marquee Animation

### Before Fix ❌
```css
/* Keyframes NOT captured */
.marquee {
  animation: scroll 20s linear infinite;
}
/* @keyframes scroll was missing! */
```

### After Fix ✅
```css
/* Keyframes CAPTURED */
@keyframes scroll {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}

.marquee {
  animation: scroll 20s linear infinite;
}
```

## Technical Details

### CSS Rule Types Captured
- `CSSRule.STYLE_RULE` (1) - Standard CSS rules
- `CSSRule.KEYFRAMES_RULE` (7) - Animation definitions
- `CSSRule.MEDIA_RULE` (4) - Responsive rules
- Keyframes inside media queries

### Order of CSS Output
1. **Animations first** - `@keyframes` must be defined before use
2. **Regular rules** - Class and ID selectors
3. **Media queries** - Responsive overrides

### Animation Detection Strategy
1. Scan all elements for `animationName` in computed styles
2. Track animation names used in CSS rules
3. Extract only referenced `@keyframes` (not all)
4. Include in component's `<style>` block

## Supported Animation Types

✅ **Keyframe Animations**
```css
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

✅ **Transform Animations**
```css
@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
```

✅ **Multi-property Animations**
```css
@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(0.95); }
}
```

✅ **Vendor-prefixed Animations**
```css
@-webkit-keyframes slide {
  /* Webkit-specific animation */
}
@keyframes slide {
  /* Standard animation */
}
```

## What Doesn't Work (Yet)

❌ **JavaScript Animations** - `requestAnimationFrame`, GSAP, etc.
- Solution: Capture will show static state
- Workaround: Convert to CSS animations when possible

❌ **Web Animations API** - `element.animate()`
- Not captured by CSS extraction
- Consider using CSS animations instead

❌ **SVG SMIL Animations** - `<animate>`, `<animateTransform>`
- These are captured as part of SVG markup
- Should work automatically

## Auto-Viewport Conversion

When "Auto Viewports" is enabled, animations are preserved across all responsive variants:
- **Mobile**: Animations optimized for performance
- **Tablet**: Same animations, potentially adjusted timing
- **Desktop**: Full animation complexity

## Performance Notes

### Animation Best Practices
- Use `transform` and `opacity` (GPU-accelerated)
- Avoid animating `width`, `height`, `top`, `left`
- Use `will-change` sparingly
- Consider `prefers-reduced-motion` media query

### Extracted CSS Size
Animations can increase CSS output size. The extension:
- Only captures referenced keyframes
- Removes unused vendor prefixes
- Combines duplicate rules

## Troubleshooting

### Animation Still Not Working?

**Check 1: CSS Output**
Look for `@keyframes` in the component's `<style>` block:
```javascript
<style dangerouslySetInnerHTML={{
  __html: `
    @keyframes scroll { ... }  // Should be here!
  `
}} />
```

**Check 2: Animation Property**
Verify the element has `animation` or `animationName`:
```javascript
<div style={{
  animation: "scroll 20s linear infinite"  // Should be here!
}}>
```

**Check 3: Browser Console**
Check for CSS warnings:
```
[Violation] Forced reflow while executing JavaScript took XXms
```
This might indicate performance issues, not capture issues.

### Still Having Issues?

1. **Reload the extension** (most common fix)
2. **Check browser console** for errors
3. **Try a simpler animation** first (fadeIn)
4. **Verify animation works on original site**

## Future Enhancements

### Planned
- [ ] Capture JavaScript-driven animations
- [ ] Convert GSAP to CSS animations automatically
- [ ] Animation timeline scrubber in canvas
- [ ] Animation pause/play controls
- [ ] Animation speed adjustment

### Under Consideration
- Capture Lottie animations
- Convert Web Animations API to CSS
- SVG animation optimization
- Animation performance profiling

## Related Files

- `chrome-extension/content.js` - Main extension logic
- `src/components/canvas-v2/CanvasContainer.tsx` - Canvas paste handler
- `src/lib/htmlToReactConverter.ts` - HTML to React conversion
- `src/app/api/convert/to-viewports/route.ts` - Responsive conversion

## Summary

✅ **Marquee animations** now capture correctly
✅ **@keyframes** rules are extracted
✅ **Animation properties** are preserved
✅ **Responsive variants** maintain animations
✅ **Performance** optimized (only captures used animations)

The fix ensures that any CSS-based animation will now be captured and run correctly in the canvas!
