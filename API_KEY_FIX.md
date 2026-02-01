# 🔧 API Key Error - Fixed!

## Problem

```
[403 Forbidden] Method doesn't allow unregistered callers
```

**Cause:** Google API key not being passed to Gemini API correctly.

---

## ✅ Solution

### 1. Check API Key in .env.local

**File:** `c:\APP DEV\grab-ai-backend-main\.env.local`

**Should contain:**
```env
GOOGLE_API_KEY=AIzaSyB901w-pVRA5QkIst33FLQ9LFFLVtzx-s8
```

**If missing or wrong:**
1. Open `.env.local`
2. Add/update: `GOOGLE_API_KEY=AIzaSyB901w-pVRA5QkIst33FLQ9LFFLVtzx-s8`
3. Save file
4. Restart server: `Ctrl+C` then `npm run dev`

### 2. API Endpoint Updated

**Fixed `/api/convert/capture-to-react/route.ts`:**

- ✅ Reads API key from environment
- ✅ Shows clear error if key missing
- ✅ Tries multiple models as fallback:
  1. `gemini-2.0-flash-exp` (newest, fastest)
  2. `gemini-1.5-flash` (fallback)
  3. `gemini-1.5-pro` (final fallback)
- ✅ Logs which model succeeds
- ✅ Better error messages

---

## 🧪 Test API Key

### Method 1: Health Check

```
http://localhost:9003/api/convert/capture-to-react
```

**Should return:**
```json
{
  "status": "ok",
  "message": "Capture to React conversion API ready",
  "apiKeyConfigured": true,
  "availableModels": [
    "gemini-2.0-flash-exp",
    "gemini-1.5-flash",
    "gemini-1.5-pro"
  ]
}
```

**If error:**
```json
{
  "status": "error",
  "message": "API key not configured",
  "apiKeyConfigured": false
}
```

### Method 2: Check Server Console

**When server starts, look for:**
```
✅ API key loaded
✅ Gemini initialized
```

**Or:**
```
⚠️ GOOGLE_API_KEY not found in environment variables!
```

---

## 🚀 Complete Fix Steps

### Step 1: Verify .env.local

```bash
# Check if file exists
cd "C:\APP DEV\grab-ai-backend-main"
type .env.local
```

**Should show:**
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
GOOGLE_API_KEY=AIzaSyB901w-pVRA5QkIst33FLQ9LFFLVtzx-s8
NEXT_PUBLIC_GOOGLE_API_KEY=AIzaSyB901w-pVRA5QkIst33FLQ9LFFLVtzx-s8
ANTHROPIC_API_KEY=...
OPENAI_API_KEY=...
```

**If `GOOGLE_API_KEY` is missing:**
1. Open `.env.local` in editor
2. Add: `GOOGLE_API_KEY=AIzaSyB901w-pVRA5QkIst33FLQ9LFFLVtzx-s8`
3. Save

### Step 2: Restart Server

```bash
# Stop server (Ctrl+C)
# Start again
npm run dev
```

**Wait for:**
```
✓ Ready in 2s
Local: http://localhost:9003
```

### Step 3: Test Health Check

**Browser:**
```
http://localhost:9003/api/convert/capture-to-react
```

**Should see:** `"apiKeyConfigured": true`

### Step 4: Test Conversion

```
1. Capture element from website
2. Click extension → Click capture
3. Paste on canvas (Ctrl+V)
4. Should convert successfully!
```

---

## 📊 Expected Results

### Server Console (When Converting):
```
📥 Converting captured section to React...
   Tag: div
   Source: https://example.com/
Trying model: gemini-2.0-flash-exp
✅ Success with gemini-2.0-flash-exp
✅ Conversion successful!
   Model used: gemini-2.0-flash-exp
   Code length: 1,234 characters
```

### Canvas Console:
```
✨ Extension capture detected!
📤 Sending to AI...
✅ Conversion successful!
```

### Component Appears:
```javascript
import React from "react";

export default function CapturedDivSection() {
  return (
    <div className="...">
      {/* Converted content */}
    </div>
  );
}
```

---

## 🐛 Still Not Working?

### Check 1: API Key Valid?

**Test directly:**
```bash
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=AIzaSyB901w-pVRA5QkIst33FLQ9LFFLVtzx-s8" \
  -H 'Content-Type: application/json' \
  -d '{"contents":[{"parts":[{"text":"Hello"}]}]}'
```

**Should return JSON response, not 403**

### Check 2: Environment Loading?

**Add to API route temporarily:**
```typescript
console.log('API Key exists:', !!process.env.GOOGLE_API_KEY);
console.log('API Key preview:', process.env.GOOGLE_API_KEY?.substring(0, 10));
```

**Should show:**
```
API Key exists: true
API Key preview: AIzaSyB901
```

### Check 3: Restart Everything

```bash
# 1. Stop server (Ctrl+C)
# 2. Close all terminals
# 3. Open new terminal
cd "C:\APP DEV\grab-ai-backend-main"
npm run dev

# 4. Test health check
http://localhost:9003/api/convert/capture-to-react
```

---

## 📋 Checklist

- [ ] `.env.local` has `GOOGLE_API_KEY`
- [ ] API key is: `AIzaSyB901w-pVRA5QkIst33FLQ9LFFLVtzx-s8`
- [ ] Server restarted after adding key
- [ ] Health check shows `"apiKeyConfigured": true`
- [ ] No errors in server console
- [ ] Conversion works (paste on canvas)
- [ ] Component appears

---

## 🎉 After Fix

**Working flow:**
```
Capture element
    ↓
Copy from extension popup
    ↓
Paste on canvas (Ctrl+V)
    ↓
Canvas detects capture data
    ↓
API sends to Gemini ✅
    ↓
Gemini converts to React ✅
    ↓
Component appears! ✨
```

---

**Quick fix:**

1. Check `.env.local` has API key
2. Restart server
3. Test health check
4. Try conversion!

**API key error fixed!** 🚀
