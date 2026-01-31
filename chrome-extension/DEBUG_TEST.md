# 🔍 Extension Debug Test - Step by Step

## The Flow (What Should Happen)

```
1. USER CLICKS → "Start Capture" (popup.js)
   ↓
2. CONTENT SCRIPT → Injects blue highlight overlay (content.js)
   ↓
3. USER CLICKS → Highlighted element
   ↓
4. CONTENT SCRIPT → Captures all element data (content.js)
   ↓
5. CONTENT SCRIPT → Sends message to background (content.js line 208)
   ↓
6. BACKGROUND → Receives message (background.js line 8)
   ↓
7. BACKGROUND → Converts to React component (background.js line 23)
   ↓
8. BACKGROUND → Saves to Chrome storage (background.js line 26)
   ↓
9. POPUP → Loads from storage and displays (popup.js line 113)
   ↓
10. USER CLICKS → Capture item in popup
   ↓
11. POPUP → Copies React code to clipboard (popup.js line 156)
```

---

## 🧪 Test Each Step

### Step 1: Check Extension Console

This is the most important check!

1. **Open Chrome:** `chrome://extensions/`

2. **Find "Grab AI"**

3. **Click "service worker"** (under extension name)
   - Opens background script console
   - Keep this window open!

4. **Expected:** Console should be blank or show minimal logs

---

### Step 2: Check Content Script Injection

1. **Go to:** https://example.com/

2. **Open DevTools:** Press F12

3. **Go to Console tab**

4. **Click extension icon → Start Capture**

5. **Check console for:**
   ```
   ✓ No errors about Grab AI
   ✓ Should see selection mode activate
   ```

6. **Hover over heading**
   - Blue highlight should appear

---

### Step 3: Test Capture with Console Monitoring

**Keep BOTH consoles open:**
- Background script console (from Step 1)
- Page console (DevTools F12)

1. **Click highlighted element**

2. **Check page console for:**
   ```
   Capturing...
   (no errors)
   ```

3. **Check background console for:**
   ```
   Element captured: {html: "...", tagName: "...", ...}
   Auto-send disabled. Use "Copy Code" button...
   ```

4. **If you see "Element captured:"** ✅ Step 3 PASSED
   - Data is reaching background script!

5. **If you DON'T see "Element captured:"** ❌ Step 3 FAILED
   - Message not being sent from content script
   - See Fix #1 below

---

### Step 4: Check Storage After Capture

1. **Background console** (from Step 1)

2. **Type this command:**
   ```javascript
   chrome.storage.local.get('captures', (result) => {
     console.log('Stored captures:', result.captures);
   });
   ```

3. **Press Enter**

4. **Expected output:**
   ```javascript
   Stored captures: [
     {
       id: 1738368000000,
       data: { html: "...", tagName: "..." },
       component: {
         code: "'use client';\n\nimport React...",
         componentName: "CapturedH1...",
         metadata: { ... }
       },
       timestamp: "2026-01-31T..."
     }
   ]
   ```

5. **If you see the array with component.code:** ✅ Step 4 PASSED
   - React conversion IS working!
   - Storage IS working!

6. **If captures is empty or undefined:** ❌ Step 4 FAILED
   - React conversion or storage failing
   - See Fix #2 below

---

### Step 5: Check Popup Loading

1. **Click extension icon** (open popup)

2. **Check "Recent Captures" section**

3. **Expected:**
   - See capture item with component name
   - Shows URL

4. **If you see captures listed:** ✅ Step 5 PASSED

5. **If "No captures yet":** ❌ Step 5 FAILED
   - Popup not reading from storage
   - See Fix #3 below

---

### Step 6: Test Copy to Clipboard

1. **Click a capture item** in popup

2. **Expected:**
   - Green message: "✅ React code copied!"

3. **Test by pasting in Notepad:**
   - Open Notepad
   - Ctrl+V
   - Should see:
     ```javascript
     'use client';

     import React, { useState, useEffect } from 'react';
     import { motion } from 'framer-motion';

     export default function CapturedH1... () {
       return (
         <motion.h1
           ...
     ```

4. **If you see React code:** ✅ Step 6 PASSED
   - Everything works!

5. **If clipboard is empty or shows error:** ❌ Step 6 FAILED
   - Clipboard permission issue
   - See Fix #4 below

---

## 🔧 Fixes for Each Step

### Fix #1: Content Script Not Sending Message

**Issue:** Background console doesn't show "Element captured:"

**Cause:** Content script not loaded or blocked

**Solution:**

1. **Refresh the webpage** after loading extension
   ```
   Press F5 or Ctrl+R
   ```

2. **Try different website:**
   ```
   chrome:// pages = BLOCKED (won't work)
   file:// pages = BLOCKED (won't work)
   https://example.com = ALLOWED ✓
   https://tailwindcss.com = ALLOWED ✓
   ```

3. **Reload extension:**
   ```
   chrome://extensions/
   Click refresh icon under "Grab AI"
   Refresh webpage
   Try again
   ```

---

### Fix #2: React Conversion or Storage Failing

**Issue:** `chrome.storage.local.get('captures')` returns empty/undefined

**Cause:** Background script error in `convertToReactComponent()`

**Debug:**

1. **Background console** - look for red errors

2. **Check if there's an error in conversion:**
   ```javascript
   // In background console, manually test conversion:
   const testData = {
     tagName: 'div',
     layout: { display: 'flex', padding: '16px' },
     typography: { fontSize: '16px', fontWeight: '400' },
     colors: { colorHex: '#000000', backgroundColorHex: '#FFFFFF' },
     styles: { 'border-radius': '8px', 'box-shadow': 'none' },
     animations: { transition: 'none' },
     textContent: { allText: 'Test', headings: [] },
     images: [],
     responsive: { currentViewport: { width: 1920 } },
     dimensions: { width: 100, height: 50 },
     pageUrl: 'https://example.com',
     timestamp: new Date().toISOString()
   };
   
   // This should return a component object
   convertToReactComponent(testData).then(result => {
     console.log('Conversion result:', result);
   });
   ```

3. **If you see errors:** Share them with me!

---

### Fix #3: Popup Not Loading Captures

**Issue:** Popup shows "No captures yet" but storage has data

**Cause:** Popup script error

**Debug:**

1. **Right-click extension icon → Inspect popup**
   - Opens popup DevTools

2. **Check Console for errors**

3. **Manually check storage from popup console:**
   ```javascript
   chrome.storage.local.get('captures', (result) => {
     console.log('Captures:', result.captures);
   });
   ```

4. **If storage has data but popup doesn't show it:**
   - Possible HTML rendering issue
   - Check for JavaScript errors in popup console

---

### Fix #4: Clipboard Copy Failing

**Issue:** "Failed to copy" error or clipboard empty

**Cause:** Clipboard API permissions

**Solution A - Use Extension Popup Clipboard API:**

The extension popup should have clipboard access. If it's failing:

1. **Check popup console** (right-click icon → Inspect popup)
2. **Look for permission errors**

**Solution B - Display Code Instead:**

If clipboard persistently fails, we can show code in popup for manual copy:

Let me know if you want this fallback implemented.

---

## 🎯 Quick Diagnostic Commands

**Run these in background console to test each part:**

```javascript
// 1. Check if extension is receiving messages
chrome.runtime.onMessage.addListener((msg) => {
  console.log('MESSAGE RECEIVED:', msg);
});

// 2. Check storage
chrome.storage.local.get('captures', (result) => {
  console.log('STORAGE:', result);
  if (result.captures && result.captures.length > 0) {
    console.log('REACT CODE FROM FIRST CAPTURE:');
    console.log(result.captures[0].component.code);
  }
});

// 3. Clear storage (if needed to reset)
chrome.storage.local.clear(() => {
  console.log('Storage cleared');
});
```

---

## 📋 Checklist - Report Back

Please test and report:

- [ ] **Background console** - Do you see "Element captured: {..."? (yes/no)
- [ ] **Storage test** - Does `chrome.storage.local.get('captures')` return data? (yes/no)
- [ ] **Popup** - Do captures appear in "Recent Captures"? (yes/no)
- [ ] **Click capture** - Does it show "✅ React code copied!"? (yes/no)
- [ ] **Paste in Notepad** - Do you see React code with 'use client'; and imports? (yes/no)

**If any step fails, share:**
- Which step number failed
- Any error messages from console (background or page)
- Screenshots if helpful

---

## 🚀 Expected Working Example

When everything works:

1. **Click "Start Capture"**
   - Blue highlight appears

2. **Click element**
   - Notification: "Capture Complete!"
   - Background console: "Element captured: {..."

3. **Click extension icon**
   - See: "CapturedH1..." in Recent Captures

4. **Click capture item**
   - Message: "✅ React code copied!"

5. **Paste in Notepad**
   - See full React component with:
     - 'use client';
     - import React
     - import { motion } from 'framer-motion'
     - export default function CapturedH1...
     - Tailwind classes
     - Framer Motion animations

6. **Paste on Grab AI canvas**
   - Ctrl+V
   - Component appears!

---

**Start with Step 1 and work through each test!**

Let me know which step fails and what the console shows!
