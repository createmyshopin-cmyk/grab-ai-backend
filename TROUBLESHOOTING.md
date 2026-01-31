# Troubleshooting Screenshot to Code

## Error: "AI generated invalid component structure"

This error means the AI didn't generate a valid React component with an export statement.

### Quick Fixes

1. **Restart the Dev Server** (Most Important!)
   ```bash
   Ctrl + C
   npm run dev
   ```
   Wait for "✓ Ready" before trying again.

2. **Try Again**
   - Sometimes the AI has a hiccup
   - Upload the same image again
   - It usually works on the second try

3. **Check Your API Key**
   - Make sure `.env.local` has valid `GOOGLE_GEMINI_API_KEY`
   - Try testing the key: https://aistudio.google.com/app/apikey

### What's Happening Behind the Scenes

The new JSON architecture works in 2 phases:

**Phase 1: Image Analysis → JSON**
- AI looks at screenshot
- Creates structured JSON specification
- **Possible issue:** AI returns invalid JSON

**Phase 2: JSON → React Code**  
- AI converts JSON to React code
- **Possible issue:** AI forgets `export default function`
- **Auto-fix:** System tries to add export statement automatically

### Check the Server Logs

After uploading, look at your terminal where `npm run dev` is running:

#### ✅ SUCCESSFUL Upload
```
POST /api/generate/from-image

🔍 Phase 1: Analyzing screenshot structure...
📄 Phase 1 complete - JSON generated
✅ JSON validation passed
   Layout: horizontal-carousel
   Items: 4
   Elements: 9

⚙️  Phase 2: Generating React code from JSON...
📝 Phase 2 complete - Code generated
   Raw code length: 2847 characters
✅ Code generation complete
   Component: FlashCategoriesSection
   Layout preserved: horizontal-carousel

200 OK
```

#### ❌ FAILED Upload (Phase 1 - JSON Error)
```
POST /api/generate/from-image

🔍 Phase 1: Analyzing screenshot structure...
📄 Phase 1 complete - JSON generated
❌ JSON Parse Error: Unexpected token
AI returned (first 500 chars): Here is the JSON...

500 Error: AI generated invalid JSON format
```

**Fix:** Try uploading again. The AI sometimes returns text before the JSON.

#### ❌ FAILED Upload (Phase 2 - Code Error)
```
POST /api/generate/from-image

[... Phase 1 successful ...]

⚙️  Phase 2: Generating React code from JSON...
📝 Phase 2 complete - Code generated
   Raw code length: 342 characters
⚠️  No export statement found, attempting to fix...
✅ Fixed: Added export default

200 OK
```

**Fix:** The system auto-fixed it. Component should still work.

#### ❌ FAILED Upload (Phase 2 - Can't Fix)
```
⚙️  Phase 2: Generating React code from JSON...
📝 Phase 2 complete - Code generated
⚠️  No export statement found, attempting to fix...
❌ Invalid component structure generated
Generated code: import React from 'react'...

500 Error: AI generated invalid component structure
```

**Fix:** The AI returned incomplete code. Try uploading again.

### Common Issues

#### 1. API Key Not Set
**Error:** "Google Gemini API key not configured"

**Fix:**
```bash
# Check .env.local exists
ls .env.local

# Should contain:
GOOGLE_GEMINI_API_KEY=AIzaSyB901w...
```

#### 2. Rate Limit Hit
**Error:** "API rate limit reached"

**Fix:** Wait 30-60 seconds and try again.

#### 3. Image Too Large
**Error:** "Image file too large"

**Fix:** Resize image to under 10MB before uploading.

#### 4. Network Error
**Error:** "Network error" or "fetch failed"

**Fix:** 
- Check internet connection
- Check if Google AI services are accessible
- Try again in a few minutes

### Advanced Debugging

#### Check Generated JSON
After an upload attempt, check:
```
logs/component-specs/[ComponentName]_[timestamp].json
```

This shows exactly what the AI "saw" in Phase 1.

**What to look for:**
- `layout.type` - Should match your screenshot (horizontal-carousel, grid, etc.)
- `elements` - Should have all major elements listed
- `tokens.colors` - Should have colors from your design

#### Test API Directly

You can test the API endpoint directly:

```bash
curl -X POST http://localhost:9003/api/generate/from-image \
  -F "image=@path/to/screenshot.png"
```

Look at the response JSON to see what error occurred.

#### Check Browser Console

1. Open DevTools (F12)
2. Go to Console tab
3. Try uploading again
4. Look for red errors

Common console errors:
- `Failed to fetch` → Network/CORS issue
- `500 Internal Server Error` → Check server logs
- `SyntaxError` → Code parsing issue

### If Nothing Works

1. **Delete node_modules and reinstall:**
   ```bash
   rm -rf node_modules
   rm package-lock.json
   npm install
   npm run dev
   ```

2. **Clear Next.js cache:**
   ```bash
   rm -rf .next
   npm run dev
   ```

3. **Try a different screenshot:**
   - Use a simpler design first
   - Test with a basic layout (1-2 elements)
   - Once working, try complex designs

4. **Check API Quota:**
   - Go to: https://aistudio.google.com/app/apikey
   - Check if your API key is active
   - Verify you haven't hit daily limits

### Still Having Issues?

Check these files for problems:

1. `src/app/api/generate/from-image/route.ts` - API endpoint
2. `src/types/componentSpec.ts` - JSON schema
3. `src/components/canvas-v2/ImageUploadModal.tsx` - Upload UI
4. `.env.local` - API key configuration

### Success Indicators

When everything works, you should see:
- ✅ Terminal shows both phases completed
- ✅ Component appears on canvas
- ✅ No errors in browser console
- ✅ JSON file saved to logs/ folder
- ✅ Layout matches original screenshot

---

**Quick Restart Checklist:**
- [ ] Stop server (Ctrl + C)
- [ ] Start server (`npm run dev`)
- [ ] Wait for "✓ Ready"
- [ ] Try upload again
- [ ] Check terminal logs
- [ ] Check browser console
