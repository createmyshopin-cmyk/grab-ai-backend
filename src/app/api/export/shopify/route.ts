import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '');

export async function POST(req: NextRequest) {
    try {
        const { code, componentName } = await req.json();

        if (!code) {
            return NextResponse.json({ error: 'Component code is required' }, { status: 400 });
        }

        if (!process.env.GOOGLE_GEMINI_API_KEY) {
            return NextResponse.json({ error: 'Google Gemini API key not configured' }, { status: 500 });
        }

        const prompt = `You are an elite Shopify Theme Developer with 15+ years of experience. Convert the following React component into a production-ready Shopify Liquid Section.

### CRITICAL REQUIREMENTS

1. **Online Store 2.0 Standards:**
   - Use {% schema %} JSON block at the end
   - Include proper section settings (colors, spacing, toggles)
   - Use blocks for repeatable content
   - Provide sensible defaults for all settings

2. **Liquid Best Practices:**
   - Use {% liquid ... %} tags for logic blocks
   - Scope variables tightly
   - Add defensive checks ({% if image != blank %})
   - No nested loops
   - Use semantic HTML5 elements

3. **Styling Approach:**
   - Convert Tailwind classes to inline styles OR native Shopify CSS classes
   - Use CSS variables for theme colors: var(--color-text), var(--color-background)
   - Keep it simple and maintainable
   - Ensure mobile-responsive (use @media queries if needed)

4. **Theme Editor UX:**
   - Every setting must have a clear label and info text
   - Use appropriate input types (color, range, select, checkbox, text, richtext, image_picker)
   - Group related settings
   - Make it merchant-friendly

5. **Schema Structure:**
\`\`\`json
{
  "name": "Section Name",
  "tag": "section",
  "class": "section-class",
  "settings": [
    {
      "type": "text",
      "id": "heading",
      "label": "Heading",
      "default": "Default Heading"
    }
  ],
  "blocks": [
    {
      "type": "item",
      "name": "Item",
      "settings": []
    }
  ],
  "presets": [
    {
      "name": "Section Name",
      "blocks": []
    }
  ]
}
\`\`\`

6. **Output Format:**
   - Return ONLY the Liquid code
   - No markdown code fences
   - Include HTML structure + {% schema %} at the end
   - Add comments for complex logic

### REACT COMPONENT TO CONVERT:

\`\`\`jsx
${code}
\`\`\`

### OUTPUT (Liquid Section Only):
`;

        // Try Gemini 3.0 Pro Preview first, fallback to Gemini 2.5 Flash
        let model;
        let liquidCode = '';
        let modelUsed = '';
        
        try {
            // Primary: Gemini 3.0 Pro Preview (most advanced)
            model = genAI.getGenerativeModel({ model: 'gemini-3-pro-preview' });
            const result = await model.generateContent(prompt);
            const response = await result.response;
            liquidCode = response.text();
            modelUsed = 'Gemini 3.0 Pro Preview (gemini-3-pro-preview)';
            console.log(`✅ Using: ${modelUsed}`);
        } catch (error: any) {
            console.log(`⚠️ Gemini 3.0 Pro Preview failed: ${error.message}`);
            console.log('⏳ Trying fallback: Gemini 2.5 Flash...');
            
            try {
                // Fallback: Gemini 2.5 Flash (stable, fast)
                model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
                const result = await model.generateContent(prompt);
                const response = await result.response;
                liquidCode = response.text();
                modelUsed = 'Gemini 2.5 Flash (gemini-2.5-flash)';
                console.log(`✅ Using fallback: ${modelUsed}`);
            } catch (fallbackError: any) {
                throw new Error(`Both Gemini models failed. Primary: ${error.message} | Fallback: ${fallbackError.message}`);
            }
        }

        // Clean up any markdown artifacts
        const cleanedCode = liquidCode
            .replace(/```liquid/g, '')
            .replace(/```/g, '')
            .trim();

        // Generate filename
        const filename = componentName 
            ? `${componentName.toLowerCase().replace(/\s+/g, '-')}.liquid`
            : 'shopify-section.liquid';

        return NextResponse.json({ 
            liquidCode: cleanedCode,
            filename 
        });
    } catch (error: any) {
        console.error('Shopify Export API Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to convert to Shopify Liquid' },
            { status: 500 }
        );
    }
}
