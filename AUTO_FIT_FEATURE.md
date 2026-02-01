# 🎯 Auto-Fit Feature

## Overview
The Auto-Fit feature automatically resizes component blocks to match their rendered content size, eliminating the need for manual resizing.

## How to Use

### 1. **Enable Auto-Fit**
- Select any component block on the canvas
- Click the **Auto-Fit button** (⛶) in the floating header toolbar
- The button turns **GREEN** when active
- A pulsing green badge appears at the bottom showing current dimensions

### 2. **Visual Indicators**

**Button States:**
- 🔲 Gray = Auto-fit OFF (manual sizing)
- 🟢 Green = Auto-fit ON (automatic sizing)

**Badge Display:**
When auto-fit is active, you'll see:
```
⛶ Auto-fit: 1440 × 1024
```

### 3. **How It Works**

The system measures content using multiple techniques:

1. **PostMessage Communication** - Iframe sends size updates to parent
2. **ResizeObserver** - Watches for DOM changes in real-time
3. **MutationObserver** - Detects content additions/removals
4. **Multiple Measurements** - Takes max of all scroll/offset dimensions
5. **Smart Timing** - Measures at 50ms, 200ms, 500ms, 1s, 2s intervals

### 4. **Features**

✅ **Automatic Updates** - Resizes when content changes
✅ **Smart Limits** - Min: 400×250px, Max: 3500×2500px
✅ **Debounced** - Only updates if change > 15px (prevents jitter)
✅ **Padding** - Adds 40px padding around content
✅ **All Content Types** - Works with HTML, React, and Vanilla JS
✅ **Manual Trigger** - Click button anytime to re-measure

## Use Cases

### Wide Content (Banners)
```
Before: Component showing with scrollbars at 600×400
After:  Component perfectly sized to 3175×275 (no scrollbars)
```

### Dynamic Content
```
- Expanding accordions
- Collapsible sections  
- Content loaded via API
- Animated height changes
```

### Responsive Variants
```
Mobile (402×874)  → Auto-fits to actual content
Tablet (1133×744) → Auto-fits to actual content
Desktop (1440×1024) → Auto-fits to actual content
```

## Tips

1. **For Large Content**: The feature prevents sizes beyond 3500×2500px. If your content is larger, manually resize.

2. **For Dynamic Content**: If content loads asynchronously (APIs, images), click the auto-fit button again after loading completes.

3. **Toggle On/Off**: Click the button to toggle. When toggling, it always triggers a measurement.

4. **Combine with Device Presets**: 
   - Select a device preset (Mobile/Tablet/Desktop)
   - Enable auto-fit
   - Component adjusts to actual content while maintaining proportions

## Console Logs

When auto-fit is active, watch the browser console for:
```
🔄 Auto-fit enabled, measuring content...
📐 Auto-fit measured: {contentWidth: 3135, contentHeight: 235}
✅ Auto-fit updating: {newWidth: 3175, newHeight: 275}
📊 Content size: {width: 3135, height: 235}
📨 Received content size: {width: 3135, height: 235}
✨ Updating dimensions: {from: {w: 600, h: 400}, to: {w: 3175, h: 275}}
```

## Troubleshooting

### Auto-fit not working?
1. **Check if button is green** - Must be enabled
2. **Check console logs** - Look for measurement data
3. **Wait a moment** - Measurements happen over 2 seconds
4. **Click again** - Re-triggers measurement
5. **Check content** - CORS restrictions may prevent measurement

### Content too small/large?
- **Too small**: Minimum is 400×250px
- **Too large**: Maximum is 3500×2500px
- **Solution**: Manually resize or adjust limits in code

### Dimensions jumping?
- Debounce threshold is 15px
- Increase threshold in code if needed
- Turn off auto-fit for stable sizes

## Technical Details

**Location**: `src/components/canvas-v2/CodeBlock.tsx`

**Key Functions**:
- `handleAutoFit()` - Measures iframe content
- `toggleAutoFit()` - Toggles feature and triggers measurement
- `onContentResize` - Callback from Preview component

**Preview Component**: `src/components/canvas-v2/Preview.tsx`
- Injects size-reporting scripts into all iframe types
- Uses ResizeObserver and MutationObserver
- Sends postMessage with dimensions

## Future Enhancements

- [ ] Remember auto-fit state per component
- [ ] Auto-fit groups of components
- [ ] Custom padding settings
- [ ] Min/max dimension overrides
- [ ] Auto-fit on paste
