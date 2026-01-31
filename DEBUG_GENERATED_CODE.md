# Debug: How to Check Generated Code

## The Issue
You're still seeing "useState is not defined" error even after fixes.

## Why This Happens
1. **Dev server not restarted** - Old code is still running
2. **Code viewer showing old component** - Not the newly generated one
3. **Preview component stripping imports** - CDN setup issue

## How to Debug

### Step 1: Check if Changes Were Applied
```bash
# Stop the dev server (Ctrl+C in terminal)
# Then restart:
npm run dev
```

### Step 2: View the Actual Generated Code
1. After uploading screenshot and generation completes
2. Click the generated component on canvas
3. In RightSidebar, click the **"Code"** tab
4. You should see the EXACT code, including imports

**The code should start with:**
```javascript
'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function FlashCategoriesSection() {
  // component code
}
```

### Step 3: Check Browser Console
Open browser DevTools (F12) and look for:
- Any API errors when uploading
- The actual error stack trace
- Network tab: check `/api/generate/from-image` response

### Step 4: Verify API Response
Add this to check what the API returns:

In CanvasContainer.tsx, find `handleCodeGenerated` and add logging:
```typescript
const handleCodeGenerated = useCallback((data: {
    code: string;
    componentName: string;
    metadata: any;
}) => {
    // ADD THIS LINE TO DEBUG:
    console.log('Generated code:', data.code.substring(0, 200));
    
    // rest of the code...
}, []);
```

## Quick Fix: Manual Code Injection

If the API fix isn't working, try this manual fix in the generated code:

1. Click the component with error
2. Go to "Code" tab in RightSidebar
3. Use the AI chat to say: "Add the missing React imports at the top"
4. The AI will fix it for you

## Alternative: Direct Code Fix

If you want to manually fix a generated component:

1. Select the component
2. Click "Code" tab
3. Copy the code
4. Add these lines at the very top:
```javascript
'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
```
5. Use AI chat to update: "Replace the code with this: [paste fixed code]"

## Permanent Fix Applied

I've updated the code with these improvements:

### API Route (`/api/generate/from-image/route.ts`)
✅ More aggressive import validation
✅ Multiple fallback checks
✅ Forces imports even if AI forgets

### Preview Component (`Preview.tsx`)
✅ Better import stripping
✅ Enhanced React hooks exposure
✅ Framer Motion setup improved
✅ Error handling added

## Test Again

**IMPORTANT:** You MUST restart the dev server:
```bash
# Terminal with running dev server
Ctrl + C  # Stop server

# Then start again
npm run dev
```

**Then:**
1. Upload the screenshot AGAIN (fresh generation)
2. Check the "Code" tab to see if imports are present
3. Check console for any errors
4. If still fails, send me the code from the "Code" tab

## Expected Output

After proper restart and re-generation, the Code tab should show:
```javascript
'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function FlashCategoriesSection() {
  const [currentSlide, setCurrentSlide] = useState(0);
  
  // Full component code with all features
  return (
    <section>
      {/* Your component UI */}
    </section>
  );
}
```

## If Still Not Working

Send me:
1. Screenshot of the "Code" tab showing the generated code (first 50 lines)
2. Browser console errors (screenshot)
3. Confirmation that you restarted the dev server

I'll provide a more targeted fix!
