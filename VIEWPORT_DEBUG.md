# 🔍 Viewport Conversion Debug Guide

## 🐛 Current Error

```
❌ Viewport conversion failed: "Responsive conversion failed"
```

This means:
- ✅ API key is found (good!)
- ✅ API route is accessible (good!)
- ❌ Something failed during AI conversion (needs investigation)

---

## 🔧 Enhanced Debugging

### Changes Made:

**1. Better Model Selection**
```typescript
// BEFORE (experimental):
model: 'gemini-2.0-flash-exp'

// AFTER (stable):
model: 'gemini-1.5-flash'
```

**2. Increased Output Limit**
```typescript
maxOutputTokens: 8192  // Enough for 3 full variants
```

**3. Enhanced Logging**
```typescript
✅ Model initialized: gemini-1.5-flash
🚀 Calling Gemini API...
📥 Response received from Gemini
📥 Response length: 1234 chars
📥 First 300 chars: {...}
```

**4. Better Error Messages**
```typescript
- API key errors → "Invalid API key"
- Quota errors → "API quota exceeded"
- Other errors → Full details logged
```

---

## 🚀 Next Steps

### Step 1: Restart Dev Server
```bash
# Stop server
Ctrl+C

# Restart server
npm run dev

# Wait for "Ready"
```

### Step 2: Check Terminal Logs
**Look for these logs when you paste:**

**Success Path:**
```bash
🎨 Converting to responsive viewports...
   Source: desktop
   Code length: 1234 chars
✅ Gemini API key found: AIzaSyB901...
✅ Model initialized: gemini-1.5-flash
🚀 Calling Gemini API...
📥 Response received from Gemini
📥 Response length: 5678 chars
📥 First 300 chars: {
  "mobile": "import React...
✅ Responsive variants generated!
   Mobile: 1234 chars
   Tablet: 1456 chars
   Desktop: 1567 chars
```

**Error Path (will show specific error):**
```bash
🎨 Converting to responsive viewports...
✅ Gemini API key found: AIzaSyB901...
✅ Model initialized: gemini-1.5-flash
🚀 Calling Gemini API...
❌ Viewport conversion error: [SPECIFIC ERROR]
❌ Error type: [ERROR TYPE]
❌ Error message: [DETAILED MESSAGE]
```

### Step 3: Test Again
```bash
1. Go to canvas (http://localhost:3000)
2. Paste component (Ctrl+V)
3. Watch terminal for logs
4. Report what error shows up
```

---

## 🔍 Common Issues & Solutions

### Issue 1: "Invalid API key"
**Logs show:**
```
❌ Error message: API key invalid
```

**Solution:**
```bash
# Get new API key from:
https://makersuite.google.com/app/apikey

# Update .env.local:
GEMINI_API_KEY=YOUR_NEW_KEY_HERE

# Restart dev server
```

### Issue 2: "API quota exceeded"
**Logs show:**
```
❌ Error message: quota exceeded
```

**Solution:**
```bash
# Wait 1 minute (free tier resets quickly)
# OR check quota at:
https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/quotas

# Then try again
```

### Issue 3: "Response timeout"
**Logs show:**
```
❌ Error message: timeout
```

**Solution:**
```bash
# Your internet might be slow
# Or code is too large
# Try with smaller component first
```

### Issue 4: "Invalid JSON"
**Logs show:**
```
❌ JSON parse error: Unexpected token
📥 First 300 chars: Here are the variants...
```

**Solution:**
```bash
# AI returned markdown instead of JSON
# The prompt needs adjustment
# This fix is already applied (using stable model)
```

### Issue 5: "Model not found"
**Logs show:**
```
❌ Error message: model not found
```

**Solution:**
```bash
# Gemini 2.0 not available in your region
# Already fixed (using gemini-1.5-flash)
```

---

## 📊 What Terminal Should Show

### Full Success Sequence:

```bash
# When you paste:

🎨 Converting to responsive viewports...
   Source: desktop
   Code length: 2345 chars

✅ Gemini API key found: AIzaSyB901...

✅ Model initialized: gemini-1.5-flash

🚀 Calling Gemini API...

# Wait 2-3 seconds...

📥 Response received from Gemini
📥 Response length: 6789 chars
📥 First 300 chars: {
  "mobile": "import React from \"react\";\n\nexport default function CapturedSection() {\n  return (\n    <div style={{\n      backgroundColor: \"rgb(214, 38, 65)\",\n      padding: \"20px\",\n      textAlign: \"center\"\n    }}>\n      <h4 style={{\n        fontFamily: \"recoleta\",\n        fontSize: \"24px\",

✅ Responsive variants generated!
   Mobile: 2134 chars
   Tablet: 2456 chars
   Desktop: 2567 chars
```

---

## 🧪 Test Cases

### Test 1: Simple Component
```bash
# Paste a simple div first:
<div>Hello World</div>

# Should convert quickly
# If this works, API is fine
```

### Test 2: Your Banner
```bash
# Paste your red banner
# More complex, takes longer
# If this fails, might be too large
```

### Test 3: Check API Directly
```bash
# Test API route with curl:
curl -X POST http://localhost:3000/api/convert/to-viewports \
  -H "Content-Type: application/json" \
  -d '{"code":"import React from \"react\"; export default function Test() { return <div>Test</div>; }","sourceViewport":"desktop"}'

# Should return JSON with mobile/tablet/desktop
```

---

## 📝 Debugging Checklist

```
✅ Dev server restarted
✅ Terminal is visible (to see logs)
✅ Browser console open (F12)
✅ Network tab open (to see API calls)

When you paste:
✅ Check terminal for logs
✅ Check browser console for errors
✅ Check Network tab for failed requests
✅ Note exact error message
```

---

## 🎯 Expected vs Actual

### Expected (Success):
```
Browser:
- Notification: "🎨 Generating..."
- 3 blocks appear
- Notification: "✨ 3 responsive variants created!"

Terminal:
- All ✅ logs
- No ❌ logs
- "Responsive variants generated!"
```

### Actual (Current Error):
```
Browser:
- Notification: "🎨 Generating..."
- 3 blocks stay as "Loading..."
- Notification: "⚠️ AI conversion failed. Using original code."

Terminal:
- ❌ Viewport conversion error: [NEED TO SEE THIS]
```

---

## 🚀 Action Items

### 1. Restart Dev Server
```bash
Ctrl+C
npm run dev
```

### 2. Paste Component
```bash
Canvas → Ctrl+V
```

### 3. Copy Terminal Output
```bash
# Find these lines in terminal:
❌ Viewport conversion error: ...
❌ Error type: ...
❌ Error message: ...

# Share the exact error message!
```

### 4. Share Error
Tell me what these terminal logs show:
- Error type?
- Error message?
- First 300 chars of response?

---

## 🔑 Quick API Key Test

### Test if your API key works:
```bash
# Run this in terminal:
curl -H "Content-Type: application/json" \
     -d '{"contents":[{"parts":[{"text":"Say hello"}]}]}' \
     -X POST "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=AIzaSyB901w-pVRA5QkIst33FLQ9LFFLVtzx-s8"

# Should return:
# {"candidates":[{"content":{"parts":[{"text":"Hello!..."}]}}]}

# If error:
# {"error":{"code":403,"message":"API key invalid"}}
```

---

**Next Step:**

1. **Restart dev server** (`Ctrl+C`, then `npm run dev`)
2. **Paste component** in canvas
3. **Check terminal** for detailed error logs
4. **Share the error message** you see in terminal

The enhanced logging will show us exactly what's failing!
