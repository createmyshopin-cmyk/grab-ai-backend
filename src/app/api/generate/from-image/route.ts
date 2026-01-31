import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ComponentSpec, validateComponentSpec } from '@/types/componentSpec';
import { logComponentSpec } from '@/lib/specLogger';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '');

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const imageFile = formData.get('image') as File;

        if (!imageFile) {
            return NextResponse.json({ error: 'Image file is required' }, { status: 400 });
        }

        if (!process.env.GOOGLE_GEMINI_API_KEY) {
            return NextResponse.json({ error: 'Google Gemini API key not configured' }, { status: 500 });
        }

        // Convert image to base64
        const bytes = await imageFile.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64Image = buffer.toString('base64');
        const mimeType = imageFile.type;

        const model = genAI.getGenerativeModel({ model: 'gemini-3-pro-preview' });

        // ========================================
        // PHASE 1: Image Analysis → JSON Specification
        // ========================================
        console.log('🔍 Phase 1: Analyzing screenshot structure...');

        const analysisPrompt = `You are a UI/UX Design Analyzer with computer vision expertise and 15+ years of experience analyzing web designs.

### TASK
Analyze this screenshot in EXTREME DETAIL and output a structured JSON specification.

### ANALYSIS PROCESS

**STEP 1: IDENTIFY LAYOUT TYPE**
Look at the screenshot carefully:
- Are elements arranged HORIZONTALLY (side-by-side in a row)?
- Are elements arranged VERTICALLY (stacked top-to-bottom)?
- Is it a GRID (multiple rows and columns)?
- Is it a CAROUSEL with navigation arrows/dots?

**STEP 2: COUNT ELEMENTS**
- How many main items/cards are visible?
- How are they arranged? (1 row of 4? 2 rows of 2? Vertical stack?)

**STEP 3: EXTRACT EVERY ELEMENT**
For EACH visible element, document:
- Type (heading, text, image, button, card, container)
- Content (extract text, describe images)
- Colors (background, text, borders)
- Position (order in the layout)
- Size and dimensions
- Image details (shape, aspect ratio)

**STEP 4: DESIGN TOKENS**
Extract:
- All colors used (backgrounds, text, accents)
- Typography (font sizes, weights)
- Spacing patterns (padding, margins, gaps)
- Border radius styles

**STEP 5: INTERACTIVE FEATURES**
Identify:
- Navigation controls (arrows, dots)
- Hover effects
- Carousel/slider behavior
- Clickable elements

### OUTPUT FORMAT
Return ONLY valid JSON. NO markdown, NO explanations, NO code fences.
Just pure JSON matching this structure:

{
  "componentName": "ComponentName",
  "description": "Brief description",
  "layout": {
    "type": "horizontal-carousel | vertical-list | grid | hero | form",
    "direction": "row | column",
    "containerWidth": "contained",
    "maxWidth": "max-w-7xl"
  },
  "structure": {
    "itemCount": 4,
    "rows": 1,
    "columns": 4,
    "columnsTablet": 2,
    "columnsMobile": 1,
    "gap": "gap-8",
    "hasNavigation": true,
    "hasScrollSnap": true
  },
  "tokens": {
    "colors": {
      "primary": "blue-500",
      "background": "white",
      "card1": "red-500",
      "card2": "orange-500",
      "card3": "amber-400",
      "card4": "emerald-600"
    },
    "typography": {
      "fontFamily": "sans-serif",
      "headingSizes": { "h1": "text-4xl", "h2": "text-3xl", "h3": "text-xl" },
      "bodySize": "text-base",
      "fontWeights": { "bold": 700, "semibold": 600, "normal": 400 }
    },
    "spacing": {
      "section": "py-16",
      "container": "px-4",
      "cardPadding": "p-8"
    },
    "borderRadius": {
      "card": "rounded-3xl",
      "button": "rounded-lg",
      "image": "rounded-full"
    }
  },
  "elements": [
    {
      "id": "heading-1",
      "type": "heading",
      "position": { "order": 1, "parent": null },
      "content": { "text": "FLASH CATEGORIES PRODUCT" },
      "styling": {
        "className": "text-4xl font-bold text-center mb-12",
        "colors": { "text": "gray-900" }
      }
    },
    {
      "id": "card-1",
      "type": "card",
      "position": { "order": 2, "parent": "carousel" },
      "content": { "text": "CRISPY CHICKEN\\n16 PRODUCT" },
      "styling": {
        "className": "flex-shrink-0 w-80 snap-start",
        "colors": { "background": "red-500" }
      },
      "image": {
        "type": "product",
        "shape": "circle",
        "placeholderUrl": "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400"
      }
    }
  ],
  "features": {
    "hasCarousel": true,
    "hasHoverEffects": true,
    "hasAnimations": true
  },
  "metadata": {
    "shopifyCompatible": true,
    "responsive": true,
    "accessibility": ["ARIA labels", "Alt text", "Semantic HTML"],
    "enhancements": ["Mobile-first responsive", "Hover effects", "Smooth animations"]
  }
}

CRITICAL: Return ONLY the JSON object. Start with { and end with }. No other text.`;

        const analysisResult = await model.generateContent([
            analysisPrompt,
            {
                inlineData: {
                    data: base64Image,
                    mimeType: mimeType,
                },
            },
        ]);

        let jsonText = analysisResult.response.text();
        console.log('📄 Phase 1 complete - JSON generated');

        // Clean markdown artifacts from JSON
        jsonText = jsonText
            .replace(/```json\n?/gi, '')
            .replace(/```\n?/g, '')
            .trim();

        // Extract JSON if wrapped in text
        const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            jsonText = jsonMatch[0];
        }

        // Parse JSON
        let jsonSpec: ComponentSpec;
        try {
            jsonSpec = JSON.parse(jsonText);
        } catch (parseError: any) {
            console.error('❌ JSON Parse Error:', parseError.message);
            console.error('AI returned (first 500 chars):', jsonText.substring(0, 500));
            
            // Try to extract JSON from text if it's wrapped
            const jsonExtract = jsonText.match(/\{[\s\S]*\}/);
            if (jsonExtract) {
                try {
                    jsonSpec = JSON.parse(jsonExtract[0]);
                    console.log('✅ Recovered JSON from extracted text');
                } catch {
                    return NextResponse.json(
                        { 
                            error: 'AI generated invalid JSON format. This may be a temporary AI issue. Please try uploading again.',
                            details: parseError.message
                        },
                        { status: 500 }
                    );
                }
            } else {
                return NextResponse.json(
                    { 
                        error: 'AI response did not contain valid JSON. Please try uploading again.',
                        details: parseError.message
                    },
                    { status: 500 }
                );
            }
        }

        // Validate JSON structure
        if (!validateComponentSpec(jsonSpec)) {
            console.error('❌ Invalid JSON spec structure');
            return NextResponse.json(
                { error: 'Invalid component specification structure' },
                { status: 400 }
            );
        }

        console.log('✅ JSON validation passed');
        console.log(`   Layout: ${jsonSpec.layout.type}`);
        console.log(`   Items: ${jsonSpec.structure.itemCount}`);
        console.log(`   Elements: ${jsonSpec.elements.length}`);

        // Save JSON for debugging (async, don't wait)
        logComponentSpec(jsonSpec).catch(err => console.error('Logging failed:', err));

        // ========================================
        // PHASE 2: JSON Specification → React Code
        // ========================================
        console.log('⚙️  Phase 2: Generating React code from JSON...');

        const codeGenerationPrompt = `You are an expert React developer with 15+ years of experience.

### TASK
Convert this JSON specification into production-ready React code with perfect fidelity to the specification.

### JSON SPECIFICATION
${JSON.stringify(jsonSpec, null, 2)}

### CRITICAL REQUIREMENTS

**1. EXACT LAYOUT MATCH**
The JSON specifies layout type: "${jsonSpec.layout.type}"

${jsonSpec.layout.type === 'horizontal-carousel' ? `
YOU MUST create a HORIZONTAL CAROUSEL:
\`\`\`tsx
<div className="flex overflow-x-auto snap-x snap-mandatory ${jsonSpec.structure.gap} pb-4 scrollbar-hide">
  {categories.map((item, index) => (
    <div key={index} className="flex-shrink-0 w-80 md:w-96 snap-start">
      {/* Card content */}
    </div>
  ))}
</div>
\`\`\`
` : ''}

${jsonSpec.layout.type === 'grid' ? `
YOU MUST create a GRID:
\`\`\`tsx
<div className="grid grid-cols-${jsonSpec.structure.columnsMobile || 1} md:grid-cols-${jsonSpec.structure.columnsTablet || 2} lg:grid-cols-${jsonSpec.structure.columns || 4} ${jsonSpec.structure.gap}">
  {items.map((item, index) => (
    <div key={index}>
      {/* Grid item */}
    </div>
  ))}
</div>
\`\`\`
` : ''}

**2. REQUIRED IMPORTS**
Start with:
\`\`\`tsx
'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
\`\`\`

**3. USE DESIGN TOKENS FROM JSON**
- Colors: ${JSON.stringify(jsonSpec.tokens.colors)}
- Spacing: ${JSON.stringify(jsonSpec.tokens.spacing)}
- Border radius: ${JSON.stringify(jsonSpec.tokens.borderRadius)}
- Typography: ${JSON.stringify(jsonSpec.tokens.typography.headingSizes)}

**4. CREATE ALL ELEMENTS**
The JSON contains ${jsonSpec.elements.length} elements. Create each one in order:
${jsonSpec.elements.slice(0, 5).map((el, i) => {
    const content = el.content ? 
        (el.content.text || el.content.placeholder || el.content.alt || JSON.stringify(el.content).substring(0, 50)) : 
        'No content';
    return `
${i + 1}. ${el.type}: "${content}"
   - Order: ${el.position.order}
   - Style: ${el.styling ? el.styling.className : 'N/A'}
   ${el.image ? `- Image: ${el.image.shape} shape, ${el.image.type} type` : ''}`;
}).join('')}

**5. IMPLEMENT FEATURES**
${jsonSpec.features.hasCarousel ? '- ✅ Carousel with useState for current slide' : ''}
${jsonSpec.features.hasHoverEffects ? '- ✅ Hover effects (transform, colors)' : ''}
${jsonSpec.features.hasAnimations ? '- ✅ Framer Motion animations' : ''}
${jsonSpec.structure.hasNavigation ? '- ✅ Navigation controls (arrows/dots)' : ''}

**6. MOBILE-FIRST RESPONSIVE**
- Default (mobile): ${jsonSpec.structure.columnsMobile || 1} column
- Tablet (md:): ${jsonSpec.structure.columnsTablet || 2} columns
- Desktop (lg:): ${jsonSpec.structure.columns || 4} columns

**7. USE PLACEHOLDER IMAGES**
Use these placeholder services:
- Products: https://images.unsplash.com/photo-[relevant-id]?w=400
- Or: https://via.placeholder.com/400x300/[color]/ffffff

### OUTPUT FORMAT
Return ONLY the React component code.
NO markdown code fences.
NO explanations.
Just pure JSX code.

### REACT COMPONENT CODE:`;

        const codeResult = await model.generateContent(codeGenerationPrompt);
        let code = codeResult.response.text();
        console.log('📝 Phase 2 complete - Code generated');
        console.log('   Raw code length:', code.length, 'characters');

        // Clean markdown artifacts
        const originalCodeLength = code.length;
        code = code
            .replace(/```(tsx|jsx|javascript|typescript|js|ts)?\n?/gi, '')
            .replace(/```/g, '')
            .trim();
        
        if (originalCodeLength !== code.length) {
            console.log('   Cleaned markdown artifacts:', originalCodeLength, '→', code.length, 'chars');
        }

        // Ensure 'use client' directive
        if (!code.includes("'use client'") && !code.includes('"use client"')) {
            code = `'use client';\n\n${code}`;
        }

        // Ensure React imports
        if (!code.includes('import React') && !code.includes('from "react"') && !code.includes("from 'react'")) {
            const useClientMatch = code.match(/['"]use client['"];?\s*/);
            if (useClientMatch) {
                const insertPos = useClientMatch[0].length;
                code = code.slice(0, insertPos) + 
                       "\nimport React, { useState, useEffect } from 'react';\nimport { motion } from 'framer-motion';\n" +
                       code.slice(insertPos);
            } else {
                code = "'use client';\n\nimport React, { useState, useEffect } from 'react';\nimport { motion } from 'framer-motion';\n\n" + code;
            }
        }

        // Ensure motion import if motion is used
        if (code.includes('<motion.') && !code.includes("from 'framer-motion'") && !code.includes('from "framer-motion"')) {
            const reactImportMatch = code.match(/import .+ from ['"]react['"];?\s*/);
            if (reactImportMatch) {
                const insertPos = reactImportMatch.index! + reactImportMatch[0].length;
                code = code.slice(0, insertPos) + 
                       "import { motion } from 'framer-motion';\n" +
                       code.slice(insertPos);
            }
        }

        // Extract component name
        const componentNameMatch = code.match(/export default function (\w+)/);
        const componentName = componentNameMatch ? componentNameMatch[1] : jsonSpec.componentName;

        // Validate export statement
        if (!code.includes('export default function')) {
            console.warn('⚠️  No export statement found, attempting to fix...');
            
            // Try to fix common patterns
            if (code.includes('function ') && code.includes('return')) {
                // Find the function declaration
                const functionMatch = code.match(/function\s+(\w+)\s*\(/);
                if (functionMatch) {
                    code = code.replace(/function\s+(\w+)\s*\(/, 'export default function $1(');
                } else {
                    code = `export default ${code}`;
                }
                console.log('✅ Fixed: Added export default');
            } else if (code.includes('const ') && code.includes('=>')) {
                // Arrow function component
                const constMatch = code.match(/const\s+(\w+)\s*=\s*\(/);
                if (constMatch) {
                    const componentName = constMatch[1];
                    code = code.replace(/const\s+(\w+)\s*=/, `const ${componentName} =`);
                    code += `\n\nexport default ${componentName};`;
                    console.log('✅ Fixed: Added export for arrow function');
                }
            } else {
                console.error('❌ Invalid component structure generated');
                console.error('Generated code:', code.substring(0, 500));
                return NextResponse.json(
                    { 
                        error: 'AI generated invalid component structure. Code does not contain a valid React component. Please try uploading the image again.' 
                    },
                    { status: 500 }
                );
            }
        }

        // Final import validation
        const hasUseClient = code.includes("'use client'") || code.includes('"use client"');
        const hasReactImport = code.includes('import') && code.includes('react');
        
        if (!hasUseClient || !hasReactImport) {
            console.warn('⚠️  Missing imports, forcing addition');
            code = `'use client';\n\nimport React, { useState, useEffect } from 'react';\nimport { motion } from 'framer-motion';\n\n${code.replace(/^['"]use client['"];?\s*/g, '')}`;
        }

        console.log('✅ Code generation complete');
        console.log(`   Component: ${componentName}`);
        console.log(`   Layout preserved: ${jsonSpec.layout.type}`);

        // Return complete response
        return NextResponse.json({
            code,
            componentName,
            jsonSpec, // Include JSON for debugging
            metadata: {
                generatedFrom: 'screenshot' as const,
                jsonSpec: jsonSpec, // Store full JSON in metadata
                elements: jsonSpec.elements.map(e => ({
                    type: e.type,
                    position: { x: e.position.order, y: 0 },
                    suggestions: e.states ? ['Hover effects added'] : []
                })),
                colorPalette: Object.values(jsonSpec.tokens.colors).slice(0, 8),
                enhancements: jsonSpec.metadata.enhancements,
                shopifyCompatible: jsonSpec.metadata.shopifyCompatible
            }
        });

    } catch (error: any) {
        console.error('❌ Screenshot-to-Code API Error:', error);
        console.error('Error stack:', error.stack);
        
        // Provide helpful error messages
        let userMessage = 'Failed to generate code from screenshot. ';
        
        if (error.message?.includes('API key')) {
            userMessage += 'Please check your Google Gemini API key configuration.';
        } else if (error.message?.includes('quota') || error.message?.includes('limit')) {
            userMessage += 'API rate limit reached. Please wait a moment and try again.';
        } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
            userMessage += 'Network error. Please check your internet connection.';
        } else {
            userMessage += 'This may be a temporary issue. Please try again.';
        }
        
        return NextResponse.json(
            { 
                error: userMessage,
                details: error.message 
            },
            { status: 500 }
        );
    }
}
