# ⚡ Quick Setup (5 Minutes)

Get your Chrome extension running in 5 minutes!

## Step 1: Create Icons (2 minutes)

### Option A: Use Online Generator (Easiest!)

1. Go to: https://icon.kitchen/
2. Choose "Emoji" tab
3. Search for: 🎯 (target) or 📸 (camera)
4. Click "Download"
5. Extract the ZIP
6. Copy these files to `chrome-extension/icons/`:
   - `icon-16.png`
   - `icon-48.png`
   - `icon-128.png`

### Option B: Manual Creation (5 minutes)

Using **Paint** (Windows):

1. Open Paint
2. Resize canvas: Image → Properties → 128x128 pixels
3. Fill with blue color (#3B82F6)
4. Add white text: "GRAB" (centered)
5. Save as: `icon-128.png`
6. Repeat for 48x48 and 16x16

Using **Online Tool**:

1. Go to: https://www.favicon-generator.org/
2. Upload any square image
3. Generate and download
4. Rename to: icon-16.png, icon-48.png, icon-128.png
5. Save to `chrome-extension/icons/`

## Step 2: Load Extension (1 minute)

1. Open Chrome
2. Go to: `chrome://extensions/`
3. Toggle "Developer mode" (top-right)
4. Click "Load unpacked"
5. Select folder: `c:\APP DEV\grab-ai-backend-main\chrome-extension`
6. ✅ Extension loaded!

## Step 3: Pin Extension (30 seconds)

1. Click puzzle icon (🧩) in Chrome toolbar
2. Find "Grab AI"
3. Click pin icon
4. ✅ Extension pinned!

## Step 4: Test It! (1 minute)

1. Go to: https://tailwindcss.com/
2. Click Grab AI extension icon
3. Click "Start Capture"
4. Hover over the hero section (blue highlight appears)
5. Click the hero section
6. ✅ Component captured!

## Step 5: Connect to Your App (30 seconds)

1. Start your Grab AI app:
   ```bash
   npm run dev
   ```

2. Capture any element from a website

3. Component appears on your canvas automatically!

---

## ✅ Checklist

- [ ] Icons created and saved to `/icons/` folder
- [ ] Extension loaded in Chrome
- [ ] Extension pinned to toolbar
- [ ] Test capture works
- [ ] Grab AI app running
- [ ] Components appearing on canvas

---

## 🎉 You're Ready!

Start capturing elements from:
- ✨ Apple.com (beautiful hero sections)
- 🛒 Amazon.com (product cards)
- 🎨 Dribbble.com (creative designs)
- 📱 Nike.com (responsive layouts)
- 🎥 Netflix.com (video cards)

Every element you capture becomes a production-ready React component!

---

## ⚠️ Troubleshooting

### Extension won't load
```
Error: "Manifest file is missing or unreadable"
→ Check: manifest.json is in the root of chrome-extension folder
```

### Icons not showing
```
Error: "Could not load icon 'icons/icon-16.png'"
→ Create icons in /icons/ folder (see Step 1)
```

### Can't start capture
```
Error: No response or "Selection Mode" not starting
→ Refresh the webpage and try again
→ Check extension has permissions for that site
```

---

**Need Help?** Check `CHROME_EXTENSION_GUIDE.md` for detailed docs!
