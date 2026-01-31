import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '');

export async function POST(req: NextRequest) {
    try {
        const { code, instruction } = await req.json();

        if (!code) {
            return NextResponse.json({ error: 'Component code is required' }, { status: 400 });
        }

        if (!instruction) {
            return NextResponse.json({ error: 'Instruction is required' }, { status: 400 });
        }

        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const prompt = `### ROLE & METHODOLOGY
You are an elite Frontend Architect using the "Code-Build-Refine" methodology.
1. ANALYZE: Understand the user's intent and the existing code structure.
2. BUILD: Apply changes using best-in-class React/Tailwind patterns.
3. REFINE: Self-correct for accessibility, performance, and visual polish (Swiss Minimalism).

### THE COLOR SYSTEM (Tokens) 
Always apply colors using a semantic hierarchy. Do not use hardcoded hex values; use these tokens via Tailwind classes: 
- Primary/Brand: Blue-500 (Role: Main actions, active states) 
- Surface/Background: Slate-50 (Light) / Slate-950 (Dark) 
- Contrast/Text: Slate-900 (Primary) / Slate-500 (Secondary/Muted) 
- Border/Stroke: Slate-200 (Light) / Slate-800 (Dark) 
- Accent: Amber-500 (Role: Highlighting, badges) 
- Status: Success (Emerald), Warning (Amber), Error (Rose) 

### ADVANCED UI/UX CONSTRAINTS 
- 15-Year Rule: Prioritize information architecture and user flow over "decoration." 
- Optical Balance: Use 0.5px strokes for borders in dark mode.
- **Intelligent Animation**: Automatically add Framer Motion animations (entry: fade-in/slide-up, interaction: hover scale/tap) to enhance delight. Use spring physics (stiffness: 400, damping: 30).
- Accessibility (2026 Std): Ensure APCA contrast compliance. 
- Vertical Rhythm: Strictly follow an 8pt grid system.

### RESPONSIVENESS & FLUIDITY
- **Mobile-First**: Build for mobile (default), then scale up using \`md:\`, \`lg:\` prefixes.
- **Fluid Container**: The component MUST fill its parent container (\`w-full h-full\` or \`min-h-screen\` if applicable) to support resizing.
- **Adaptive Layouts**: Use Flexbox/Grid to handle variable widths (Mobile: 402px, Tablet: 1133px, Desktop: 1440px) gracefully without horizontal scroll.
- **No Fixed Widths**: AVOID hardcoded widths like \`w-[600px]\`. Use \`w-full\`, \`max-w-*\`, or percentages to ensure elements fit strictly within the device bounds provided.

### STRUCTURE & INTERACTIVITY
- **Atomic Structure**: Avoid monolithic layouts. Use distinct HTML elements (\`div\`, \`button\`, \`input\`) for every logical part of the UI.
- **JavaScript Logic**: Implement FULL functional logic for UI patterns like Carousels, Sliders, Accordions, and Tabs using \`useState\` and \`useEffect\`.
- **Clickable & Interactive**: All actionable elements must have \`cursor-pointer\`, \`hover:\`, and \`active:\` states. Buttons must have \`onClick\` handlers (even if mock).
- **Separation of Concerns**: Ensure deeply nested layouts use proper Flexbox/Grid wrappers (\`div\`) to maintain responsiveness.

### TASK
Modify the React component below based on the user's request, adhering STRICTLY to the design system above.

CRITICAL RULES:
1. Return ONLY valid JSX code - no markdown, no explanations.
2. The component MUST start with "export default function".
3. Use Tailwind CSS classes for ALL styling.
4. Use inline SVG icons (Lucide/Heroicons style) directly in JSX. Do NOT import icon libraries.
5. Keep the component self-contained. Ensure ALL variables (variants, constants) are fully defined.
6. Do NOT include any text before or after the code.
7. Do NOT import 'react/jsx-runtime'. Use standard JSX.

CURRENT COMPONENT:
${code}

MODIFICATION REQUEST: ${instruction}

OUTPUT (React Component Code Only):`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let modifiedCode = response.text();

        // Aggressive cleanup
        modifiedCode = modifiedCode
            .replace(/```(javascript|jsx|typescript|tsx|js|ts)?\\n?/gi, '')
            .replace(/```/g, '')
            .trim();

        // Validate the code starts correctly
        if (!modifiedCode.includes('export default function')) {
            // Try to wrap if it looks like JSX
            if (modifiedCode.includes('return') && modifiedCode.includes('<')) {
                modifiedCode = `export default function Component() {\n  ${modifiedCode}\n}`;
            } else if (modifiedCode.startsWith('<')) {
                modifiedCode = `export default function Component() {\n  return (\n    ${modifiedCode}\n  );\n}`;
            }
        }

        // Final validation
        if (!modifiedCode.includes('export default function') && !modifiedCode.includes('function ')) {
            return NextResponse.json({
                error: 'AI returned invalid code. Please try again with a clearer instruction.'
            }, { status: 400 });
        }

        return NextResponse.json({ code: modifiedCode });
    } catch (error: any) {
        console.error('Gemini API Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to modify component' },
            { status: 500 }
        );
    }
}
