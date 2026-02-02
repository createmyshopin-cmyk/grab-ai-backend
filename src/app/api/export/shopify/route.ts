import { NextRequest, NextResponse } from 'next/server';
import { convertToShopifyLiquid } from '@/lib/shopifyConverter';

export async function POST(req: NextRequest) {
  try {
    const { code, componentName, useAi = false } = await req.json();

    if (!code) {
      return NextResponse.json({ error: 'Component code is required' }, { status: 400 });
    }

    // --- DETEERMINISTIC CONVERSION (NO AI) ---
    if (!useAi) {
      console.log('⚡ Converting to Shopify Liquid (Deterministic, No AI)...');
      const result = convertToShopifyLiquid(code, componentName || 'CustomSection');

      return NextResponse.json({
        liquidCode: result.liquid,
        filename: result.filename,
        method: 'rule-based'
      });
    }

    // --- AI CONVERSION (OPENROUTER) ---
    console.log('🤖 Converting to Shopify Liquid using AI (OpenRouter)...');

    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json({ error: 'OpenRouter API key not configured' }, { status: 500 });
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

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": "http://localhost:9003", // Site URL
        "X-Title": "Grab AI Canvas", // Site title
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "model": "deepseek/deepseek-r1-0528:free",
        "messages": [
          {
            "role": "user",
            "content": prompt
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const liquidCode = data.choices?.[0]?.message?.content || '';

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
      filename,
      method: 'ai'
    });
  } catch (error: any) {
    console.error('Shopify Export API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to convert to Shopify Liquid' },
      { status: 500 }
    );
  }
}
