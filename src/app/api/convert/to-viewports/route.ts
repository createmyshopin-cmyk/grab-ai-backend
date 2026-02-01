import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY || 
  process.env.GOOGLE_GEMINI_API_KEY || 
  process.env.GOOGLE_API_KEY || 
  process.env.NEXT_PUBLIC_GOOGLE_API_KEY!
);

/**
 * POST /api/convert/to-viewports
 * 
 * Converts a React component to responsive variants (mobile, tablet, desktop)
 * Input: { code: string, sourceViewport?: 'desktop' | 'mobile' | 'tablet' }
 * Output: { mobile: string, tablet: string, desktop: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { code, sourceViewport = 'desktop' } = await request.json();

    if (!code) {
      return NextResponse.json(
        { error: 'Missing code parameter' },
        { status: 400 }
      );
    }

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

    console.log('🎨 Converting to responsive viewports...');
    console.log('   Source:', sourceViewport);
    console.log('   Code length:', code.length, 'chars');

    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash-exp', // Using latest experimental version
      generationConfig: {
        temperature: 0.4,
        topP: 0.9,
        topK: 40,
        maxOutputTokens: 8192, // Ensure enough space for 3 variants
      }
    });
    
    console.log('✅ Model initialized: gemini-2.0-flash-exp');

    const prompt = `You are a RESPONSIVE DESIGN EXPERT. Convert this React component to 3 VIEWPORT-OPTIMIZED variants.

## SOURCE COMPONENT (${sourceViewport.toUpperCase()}):
\`\`\`jsx
${code}
\`\`\`

## YOUR TASK:
Generate 3 variants optimized for different viewports. Each variant should be FULLY STANDALONE and ready to render.

### MOBILE (320px - 767px):
- **Stack everything vertically** (flex-col)
- **Full-width elements** (w-full)
- **Smaller text** (text-xs, text-sm, text-base)
- **Smaller spacing** (p-2, p-3, gap-2)
- **Hide complex elements** if needed
- **Touch-friendly buttons** (min-h-[44px])
- **Compact layout** (minimize whitespace)

### TABLET (768px - 1023px):
- **Hybrid layouts** (some rows, some cols)
- **Moderate sizing** (text-sm, text-base, text-lg)
- **Balanced spacing** (p-4, p-6, gap-3)
- **2-column grids** where appropriate
- **Medium padding** (comfortable but not excessive)

### DESKTOP (1024px+):
- **Horizontal layouts** (flex-row, grid)
- **Larger text** (text-base, text-lg, text-xl, text-2xl)
- **Generous spacing** (p-6, p-8, gap-4, gap-6)
- **Multi-column grids** (3-4 columns)
- **Full feature set** (all interactive elements)
- **Maximum width containers** (max-w-7xl)

## CRITICAL RULES:
1. **Preserve ALL content** - No text/images should be removed (only hidden if absolutely necessary)
2. **Maintain brand colors** - Keep exact background, text, and accent colors
3. **Keep all fonts** - Preserve font families, just adjust sizes
4. **Preserve styles** - Keep inline styles for colors, backgrounds, etc.
5. **Adjust ONLY layout** - Change flex direction, padding, font sizes, spacing
6. **NO external dependencies** - Only Tailwind CSS classes
7. **NO state/interactivity** - Keep components pure/static
8. **Keep component name** - Use original function name

## OUTPUT FORMAT:
Return ONLY a valid JSON object (no markdown, no explanation):

{
  "mobile": "FULL REACT CODE HERE",
  "tablet": "FULL REACT CODE HERE", 
  "desktop": "FULL REACT CODE HERE"
}

Each variant must:
- Start with \`import React from "react";\`
- Have a default export
- Include ALL styles (inline + Tailwind)
- Be syntactically valid JSX
- Render identically in content, just optimized for viewport

GENERATE NOW:`;

    console.log('🚀 Calling Gemini API...');
    
    const result = await model.generateContent(prompt);
    
    console.log('📥 Response received from Gemini');
    
    if (!result.response) {
      console.error('❌ No response from Gemini');
      return NextResponse.json(
        { error: 'No response from Gemini API' },
        { status: 500 }
      );
    }
    
    const responseText = result.response.text();
    console.log('📥 Response length:', responseText.length, 'chars');
    console.log('📥 First 300 chars:', responseText.substring(0, 300));

    // Extract JSON from response (handle markdown code blocks)
    let jsonText = responseText.trim();
    
    // Remove markdown code blocks if present
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```(?:json)?\s*\n/, '').replace(/\n```\s*$/, '');
    }

    // Parse the JSON
    let variants;
    try {
      variants = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError);
      console.error('   Raw text:', jsonText.substring(0, 500));
      
      return NextResponse.json(
        { 
          error: 'AI returned invalid JSON',
          details: parseError instanceof Error ? parseError.message : 'Parse failed',
          sample: jsonText.substring(0, 200)
        },
        { status: 500 }
      );
    }

    // Validate response structure
    if (!variants.mobile || !variants.tablet || !variants.desktop) {
      return NextResponse.json(
        { 
          error: 'AI response missing required viewport variants',
          received: Object.keys(variants)
        },
        { status: 500 }
      );
    }

    console.log('✅ Responsive variants generated!');
    console.log('   Mobile:', variants.mobile.length, 'chars');
    console.log('   Tablet:', variants.tablet.length, 'chars');
    console.log('   Desktop:', variants.desktop.length, 'chars');

    return NextResponse.json({
      mobile: variants.mobile,
      tablet: variants.tablet,
      desktop: variants.desktop,
      metadata: {
        sourceViewport,
        generatedAt: new Date().toISOString(),
        model: 'gemini-2.0-flash-exp'
      }
    });

  } catch (error: any) {
    console.error('❌ Viewport conversion error:', error);
    console.error('❌ Error type:', error?.constructor?.name);
    console.error('❌ Error message:', error?.message);
    console.error('❌ Error details:', JSON.stringify(error, null, 2).substring(0, 500));
    
    // Check for specific Gemini API errors
    if (error?.message?.includes('API key')) {
      return NextResponse.json(
        { 
          error: 'Invalid API key',
          message: 'Gemini API key is invalid or expired',
          hint: 'Get a new key from https://makersuite.google.com/app/apikey'
        },
        { status: 401 }
      );
    }
    
    if (error?.message?.includes('quota') || error?.message?.includes('limit')) {
      return NextResponse.json(
        { 
          error: 'API quota exceeded',
          message: 'Gemini API quota limit reached',
          hint: 'Wait a few minutes or check your quota at https://console.cloud.google.com/'
        },
        { status: 429 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Responsive conversion failed',
        message: error?.message || 'Unknown error',
        type: error?.constructor?.name || 'Error',
        details: error?.stack?.split('\n').slice(0, 3).join('\n')
      },
      { status: 500 }
    );
  }
}
