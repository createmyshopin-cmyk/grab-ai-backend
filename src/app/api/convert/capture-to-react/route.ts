import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini with API key - Try multiple env var names
const apiKey = process.env.GOOGLE_API_KEY || 
               process.env.GOOGLE_GEMINI_API_KEY || 
               process.env.NEXT_PUBLIC_GOOGLE_API_KEY || 
               '';

if (!apiKey) {
    console.error('⚠️ GOOGLE_API_KEY not found in environment variables!');
} else {
    console.log('✅ Google API key loaded:', apiKey.substring(0, 10) + '...');
}

const genAI = new GoogleGenerativeAI(apiKey);

/**
 * Convert captured section data to React component using Google Gemini
 * Extension sends raw HTML/CSS/properties → This API converts to clean React
 */
export async function POST(req: NextRequest) {
    try {
        const { captureData } = await req.json();

        if (!captureData || !captureData.element) {
            return NextResponse.json(
                { error: 'Invalid capture data' },
                { status: 400 }
            );
        }

        console.log('📥 Converting captured section to React...');
        console.log('   Tag:', captureData.element.tag);
        console.log('   Source:', captureData.sourceUrl);

        // Build comprehensive prompt with all captured data - PIXEL PERFECT CLONE
        const prompt = `**CRITICAL: Create a PIXEL-PERFECT React clone that looks EXACTLY like the original. DO NOT simplify or reorganize!**

**ORIGINAL HTML (Parse and convert this EXACTLY):**
\`\`\`html
${captureData.element.html}
\`\`\`

**EXACT CAPTURED PROPERTIES:**

Element: <${captureData.element.tag}>
Classes: ${captureData.element.className || 'none'}
ID: ${captureData.element.id || 'none'}

**ALL LAYOUT PROPERTIES (USE INLINE STYLES FOR EXACT MATCH):**
- position: ${captureData.styles?.layout?.position || 'static'}
- display: ${captureData.styles?.layout?.display || 'block'}
- flexDirection: ${captureData.styles?.layout?.flexDirection || 'row'}
- justifyContent: ${captureData.styles?.layout?.justifyContent || 'flex-start'}
- alignItems: ${captureData.styles?.layout?.alignItems || 'stretch'}
- gap: ${captureData.styles?.layout?.gap || '0'}
- width: ${captureData.styles?.layout?.width || 'auto'}
- height: ${captureData.styles?.layout?.height || 'auto'}
- padding: ${captureData.styles?.layout?.padding || '0'}
- paddingTop: ${captureData.styles?.layout?.paddingTop || '0'}
- paddingRight: ${captureData.styles?.layout?.paddingRight || '0'}
- paddingBottom: ${captureData.styles?.layout?.paddingBottom || '0'}
- paddingLeft: ${captureData.styles?.layout?.paddingLeft || '0'}
- margin: ${captureData.styles?.layout?.margin || '0'}

**TYPOGRAPHY (EXACT):**
- fontFamily: "${captureData.styles?.typography?.fontFamily || 'inherit'}"
- fontSize: ${captureData.styles?.typography?.fontSize || '16px'}
- fontWeight: ${captureData.styles?.typography?.fontWeight || '400'}
- lineHeight: ${captureData.styles?.typography?.lineHeight || 'normal'}
- textAlign: ${captureData.styles?.typography?.textAlign || 'left'}

**COLORS (EXACT):**
- color: ${captureData.styles?.colors?.color || '#000'}
- backgroundColor: ${captureData.styles?.colors?.backgroundColor || 'transparent'}

**IMAGES (ALL OF THEM):**
${captureData.images?.length ? captureData.images.map((img: any, i: number) => 
`Image ${i+1}: src="${img.src}", alt="${img.alt || ''}", width=${img.width}px, height=${img.height}px`).join('\n') : 'No images'}

**TEXT CONTENT (ALL OF IT):**
${captureData.content?.text || 'No text'}

---

**STRICT RULES:**

1. **DO NOT SIMPLIFY** - Parse the original HTML and keep the EXACT same structure
2. **PRESERVE NESTING** - If there are 5 nested divs, keep 5 nested divs
3. **EXACT POSITIONING** - Use inline styles with position, top, left, etc. if present
4. **ALL IMAGES** - Include every single image with exact src URLs
5. **ALL TEXT** - Preserve all text content and hierarchy
6. **INLINE STYLES** - Use inline style object for all exact values above
7. **DIMENSIONS** - Set width: "${captureData.dimensions?.width}px", height: "${captureData.dimensions?.height}px"

**COMPONENT TEMPLATE:**
\`\`\`jsx
import React from "react";

export default function Captured${captureData.element.tag.charAt(0).toUpperCase() + captureData.element.tag.slice(1)}Section() {
  return (
    <${captureData.element.tag}
      style={{
        // CRITICAL: Use ALL captured properties as inline styles
        position: "${captureData.styles?.layout?.position || 'static'}",
        display: "${captureData.styles?.layout?.display || 'block'}",
        width: "${captureData.dimensions?.width}px",
        height: "${captureData.dimensions?.height}px",
        padding: "${captureData.styles?.layout?.padding || '0'}",
        backgroundColor: "${captureData.styles?.colors?.backgroundColor || 'transparent'}",
        color: "${captureData.styles?.colors?.color || '#000'}",
        fontFamily: "${captureData.styles?.typography?.fontFamily || 'inherit'}",
        fontSize: "${captureData.styles?.typography?.fontSize || '16px'}",
        // Add ALL other captured styles
      }}
    >
      {/* Parse original HTML children and convert to JSX */}
      {/* Keep EXACT same nesting */}
      {/* Include ALL images */}
      {/* Include ALL text */}
    </${captureData.element.tag}>
  );
}
\`\`\`

**OUTPUT REQUIREMENTS:**
- Return ONLY the React code
- Start with: import React from "react";
- NO markdown code blocks
- NO explanations
- Must look IDENTICAL to original when rendered`;

        // Check API key
        if (!apiKey) {
            throw new Error('Google API key not configured. Please set GOOGLE_API_KEY in .env.local');
        }

        // Use Gemini to convert - Try multiple models as fallback
        let code = '';
        let modelUsed = '';
        
        const modelsToTry = [
            'gemini-2.0-flash-exp',
            'gemini-1.5-flash',
            'gemini-1.5-pro'
        ];

        for (const modelName of modelsToTry) {
            try {
                console.log(`Trying model: ${modelName}`);
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent(prompt);
                code = result.response.text();
                modelUsed = modelName;
                console.log(`✅ Success with ${modelName}`);
                break;
            } catch (modelError: any) {
                console.log(`❌ ${modelName} failed:`, modelError.message);
                if (modelName === modelsToTry[modelsToTry.length - 1]) {
                    // Last model failed, throw error
                    throw new Error(`All models failed. Last error: ${modelError.message}`);
                }
                // Continue to next model
            }
        }

        if (!code) {
            throw new Error('Failed to generate code with any available model');
        }

        // Clean up the code
        code = code.replace(/```(tsx|jsx|javascript|typescript|js|ts)?\n?/gi, '').replace(/```/g, '').trim();

        // Ensure proper imports
        if (!code.includes('import React')) {
            code = `import React from "react";\n\n${code}`;
        }

        // Ensure export default
        if (!code.includes('export default')) {
            const functionMatch = code.match(/function\s+(\w+)/);
            if (functionMatch) {
                const funcName = functionMatch[1];
                if (!code.includes(`export default ${funcName}`)) {
                    code = code.replace(
                        `function ${funcName}`,
                        `export default function ${funcName}`
                    );
                }
            }
        }

        console.log('✅ Conversion successful!');
        console.log('   Model used:', modelUsed);
        console.log('   Code length:', code.length, 'characters');

        return NextResponse.json({
            success: true,
            code,
            metadata: {
                sourceUrl: captureData.sourceUrl,
                capturedTag: captureData.element.tag,
                capturedAt: captureData.capturedAt,
                convertedAt: new Date().toISOString(),
                modelUsed
            }
        });

    } catch (error: any) {
        console.error('❌ Conversion error:', error);
        return NextResponse.json(
            {
                error: error.message || 'Failed to convert capture to React',
                details: error.toString()
            },
            { status: 500 }
        );
    }
}

/**
 * Health check
 */
export async function GET() {
    const hasApiKey = !!apiKey;
    
    return NextResponse.json({
        status: hasApiKey ? 'ok' : 'error',
        message: hasApiKey 
            ? 'Capture to React conversion API ready' 
            : 'API key not configured',
        apiKeyConfigured: hasApiKey,
        availableModels: [
            'gemini-2.0-flash-exp',
            'gemini-1.5-flash',
            'gemini-1.5-pro'
        ],
        timestamp: new Date().toISOString()
    });
}
