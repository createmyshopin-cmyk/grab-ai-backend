# 🧪 Quick Test Guide

## Test 1: Basic Capture (30 seconds)

```
1. Reload extension (chrome://extensions/)
2. Visit https://example.com
3. Click extension → "Start Capture"
4. Click any element
5. Paste code → Should see React component ✅
```

---

## Test 2: Shopify Mode (1 minute)

### Step 1: Enable Shopify Mode
```
1. Click extension icon
2. Check "🏪 Shopify Mode"
3. Should stay checked ✅
```

### Step 2: Test on Shopify Site
```
1. Visit https://www.gymshark.com
2. Click "Start Capture"
3. Click hero section
4. Paste code
5. Scroll to bottom → Should see Shopify comment:
   /*
    * 🏪 SHOPIFY SECTION DATA
    * Shop: gymshark.com
    * ...
    */
```

### Expected Results:
- ✅ Shopify data in comments
- ✅ Section IDs captured
- ✅ Product info (if on product page)
- ✅ Theme name

---

## Test 3: Media Query Toggle (30 seconds)

### Step 1: With Media Queries ON (default)
```
1. Keep "📱 Include Media Queries" CHECKED
2. Visit any responsive site (e.g., tailwindui.com)
3. Capture any element
4. Paste code
5. Look for @media in <style> tag → Should exist ✅
```

### Step 2: With Media Queries OFF
```
1. UNCHECK "📱 Include Media Queries"
2. Capture same element
3. Paste code
4. Look for @media in <style> tag → Should NOT exist ✅
5. File size should be smaller ✅
```

---

## Test 4: Settings Persistence (30 seconds)

```
1. Check both boxes
2. Close popup
3. Reopen popup
4. Both boxes should still be checked ✅
5. Close browser
6. Reopen browser + extension
7. Both boxes should STILL be checked ✅
```

---

## Common Issues

### Issue: Shopify checkbox doesn't work
**Fix:** Make sure you're on an actual Shopify site (gymshark.com, allbirds.com, shopify.com)

### Issue: No Shopify data in output
**Fix:** Element might not be inside a Shopify section. Try capturing a larger parent element.

### Issue: Media queries still appear when unchecked
**Fix:** Clear browser cache, reload extension, try again

---

## What to Look For

### ✅ Shopify Mode Working:
- Console log: "🏪 Shopify site detected!"
- Comment block at bottom of code
- Section IDs, product info, theme name

### ✅ Media Queries Working:
- When ON: `@media (max-width: 768px) { ... }` in CSS
- When OFF: No `@media` rules in CSS

### ✅ Settings Working:
- Checkboxes remember state
- Persist across popup close/open
- Persist across browser restart

---

## Console Logs to Check

Open DevTools (F12) → Console:

**With Shopify Mode ON:**
```
🏪 Shopify site detected!
✅ Extracted CSS: 15000 characters
✅ React JSX conversion complete!
   Code length: 25000
   Shopify data included
```

**With Media Queries OFF:**
```
✅ Extracted CSS: 8000 characters (smaller!)
```

---

## Ready to Use!

If all 4 tests pass:
- ✅ Extension working perfectly
- ✅ Shopify detection working
- ✅ Media query toggle working
- ✅ Settings persisting

**Start capturing!** 🚀
