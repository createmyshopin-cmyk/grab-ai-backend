# 🔑 API Key Fix for Responsive Viewports

## 🐛 The Error

```
❌ Viewport conversion failed: "GEMINI_API_KEY not configured"
```

## 🔍 Root Cause

The API route `/api/convert/to-viewports` was looking for `GEMINI_API_KEY`, but your `.env.local` only had:
- `GOOGLE_GEMINI_API_KEY`
- `GOOGLE_API_KEY`
- `NEXT_PUBLIC_GOOGLE_API_KEY`

Next.js API routes **don't automatically read `NEXT_PUBLIC_*` variables** in the same way, so the API couldn't find the key.

---

## ✅ The Fix

### 1. Added Missing Variable
**File:** `.env.local`

**Added:**
```bash
GEMINI_API_KEY=AIzaSyB901w-pVRA5QkIst33FLQ9LFFLVtzx-s8
```

Now the API route will find it immediately!

### 2. Enhanced Error Checking
**File:** `src/app/api/convert/to-viewports/route.ts`

**Before:**
```typescript
if (!process.env.GEMINI_API_KEY) {
  return NextResponse.json(
    { error: 'GEMINI_API_KEY not configured' },
    { status: 500 }
  );
}
```

**After:**
```typescript
const apiKey = process.env.GEMINI_API_KEY || 
               process.env.GOOGLE_GEMINI_API_KEY || 
               process.env.GOOGLE_API_KEY;

if (!apiKey) {
  console.error('❌ No Gemini API key found!');
  console.error('   Checked: GEMINI_API_KEY, GOOGLE_GEMINI_API_KEY, GOOGLE_API_KEY');
  return NextResponse.json(
    { 
      error: 'GEMINI_API_KEY not configured',
      hint: 'Add GEMINI_API_KEY to .env.local and restart dev server'
    },
    { status: 500 }
  );
}

console.log('✅ Gemini API key found:', apiKey.substring(0, 10) + '...');
```

Now it:
- ✅ Checks 3 possible variable names
- ✅ Logs which one was found
- ✅ Shows helpful error message if none found

---

## 🚀 How to Apply

### Step 1: Restart Dev Server
**CRITICAL:** You must restart for `.env.local` changes to take effect!

```bash
# Stop current server (Ctrl+C in terminal)
# Then restart:
npm run dev
```

### Step 2: Check Console
You should see:
```
✅ Gemini API key found: AIzaSyB901...
```

### Step 3: Test Paste
```bash
1. Go to canvas (http://localhost:3000)
2. Paste your banner (Ctrl+V)
3. Watch for:
   "🎨 Generating responsive variants..."
4. Should create 3 blocks successfully!
```

---

## 📊 Environment Variables Explained

### Your `.env.local` Now Has:

```bash
# Primary key (for API routes)
GEMINI_API_KEY=AIzaSyB...           ← NEW! API routes use this

# Backup keys (fallbacks)
GOOGLE_GEMINI_API_KEY=AIzaSyB...    ← Fallback #1
GOOGLE_API_KEY=AIzaSyB...           ← Fallback #2

# Public key (for client-side code)
NEXT_PUBLIC_GOOGLE_API_KEY=AIzaSyB... ← Browser can access this
```

### Why Multiple Keys?

Different parts of the app look for different variable names:
- **API routes** prefer `GEMINI_API_KEY` or `GOOGLE_GEMINI_API_KEY`
- **Client code** uses `NEXT_PUBLIC_GOOGLE_API_KEY`
- **Legacy code** might use `GOOGLE_API_KEY`

Having all 4 ensures compatibility everywhere!

---

## 🔧 Verification Steps

### Check 1: Environment Variable Loaded
```bash
# In your API route console (terminal running npm run dev):
✅ Gemini API key found: AIzaSyB901...
```

### Check 2: API Route Accessible
```bash
# Test the endpoint:
curl -X POST http://localhost:3000/api/convert/to-viewports \
  -H "Content-Type: application/json" \
  -d '{"code":"test","sourceViewport":"desktop"}'

# Should return JSON (not 500 error)
```

### Check 3: Paste Works
```bash
# In browser:
1. Open canvas
2. Paste component
3. Check browser console (F12):
   🎨 Converting to responsive viewports...
   ✅ Responsive variants generated!
```

---

## 🐛 Still Not Working?

### Issue: "GEMINI_API_KEY not configured" persists

**Solution:**
```bash
# 1. Make SURE you restarted the dev server
Ctrl+C (stop)
npm run dev (start)

# 2. Check .env.local has the line:
GEMINI_API_KEY=AIzaSyB901w-pVRA5QkIst33FLQ9LFFLVtzx-s8

# 3. Check no typos (copy-paste from this file):
```

### Issue: "Invalid API key"

**Solution:**
```bash
# Your current key might be expired/invalid
# Get a new one from:
https://makersuite.google.com/app/apikey

# Then update ALL keys in .env.local to the new key
```

### Issue: API works but still shows fallback

**Solution:**
```bash
# Check browser console for actual error
# Could be:
- Network error (dev server not running)
- AI returned invalid JSON (model issue)
- Timeout (slow internet)
```

---

## 📝 Files Modified

```
✅ .env.local
   - Added GEMINI_API_KEY=AIzaSyB...

✅ src/app/api/convert/to-viewports/route.ts
   - Enhanced API key checking
   - Added fallback support
   - Better error logging

✅ API_KEY_FIX_VIEWPORTS.md
   - This documentation file
```

---

## 🎯 Expected Results After Fix

### Terminal (Dev Server):
```bash
$ npm run dev

> dev
> next dev

   ▲ Next.js 15.1.6
   - Local:        http://localhost:3000

 ✓ Starting...
 ✓ Ready in 2.3s
```

### When You Paste:

**Browser Console:**
```
⚡ Instant React code detected! Converting to responsive variants...
🎨 Converting to responsive viewports...
   Source: desktop
✅ Gemini API key found: AIzaSyB901...
📥 Raw AI Response: {
  "mobile": "import React...
✅ Responsive variants generated!
   Mobile: 1234 chars
   Tablet: 1456 chars
   Desktop: 1567 chars
```

**Canvas:**
```
[📱 Mobile]  [📱 Tablet]  [🖥️ Desktop]
   ↑            ↑            ↑
 Loading...  Loading...  Loading...
   ↓            ↓            ↓
 (2-3 seconds later)
   ↓            ↓            ↓
Optimized!  Optimized!  Optimized!
```

**Notifications:**
```
1. 🎨 "Generating responsive variants (Mobile, Tablet, Desktop)..."
2. ✨ "3 responsive variants created! (Mobile, Tablet, Desktop)"
```

---

## 🎊 Success Criteria

### ✅ Checklist:
```
✅ Dev server restarted
✅ Console shows: "✅ Gemini API key found..."
✅ No "GEMINI_API_KEY not configured" error
✅ Paste creates 3 blocks
✅ All 3 blocks have different layouts
✅ Mobile: compact, stacked
✅ Tablet: balanced
✅ Desktop: original layout
✅ Success notification appears
```

---

## 🚀 Quick Test Command

```bash
# 1. Stop dev server
Ctrl+C

# 2. Restart dev server
npm run dev

# 3. Wait for "Ready"
# Should see: ✓ Ready in 2.3s

# 4. Open browser
http://localhost:3000

# 5. Paste component
Ctrl+V

# 6. Success!
# Should see 3 blocks appear
```

---

**API key is now configured correctly!** 🔑✅

**Restart your dev server and test again!** 🚀

**Steps:**
1. Stop server: `Ctrl+C`
2. Start server: `npm run dev`
3. Wait for "Ready"
4. Paste in canvas
5. Watch 3 responsive variants appear! 📱📱🖥️
