import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '');

export async function POST(req: NextRequest) {
    try {
        const { html, css } = await req.json();

        if (!html) {
            return NextResponse.json({ error: 'HTML is required' }, { status: 400 });
        }

        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const prompt = `### ROLE & METHODOLOGY
You are an elite Frontend Architect using the "Code-Build-Refine" methodology.
1. ANALYZE: Understand the structure and intent of the provided HTML/CSS.
2. BUILD: Reconstruct it as a modern, interactive React component using Tailwind CSS.
3. REFINE: Ensure accessibility, semantic hierarchy, and polished interactions.

### THE COLOR SYSTEM (Tokens) 
Always apply colors using a semantic hierarchy. Do not use hardcoded hex values; use these tokens via Tailwind classes: 
- Primary/Brand: Blue-500 (Role: Main actions, active states) 
- Surface/Background: Slate-50 (Light) / Slate-950 (Dark) 
- Contrast/Text: Slate-900 (Primary) / Slate-500 (Secondary/Muted) 
- Border/Stroke: Slate-200 (Light) / Slate-800 (Dark) (Subtle separation) 
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
Convert the following HTML and CSS into a SINGLE, Production-Ready React Functional Component.

CRITICAL INSTRUCTIONS:
1. Use Tailwind CSS for ALL styling. 
2. Use inline SVG icons (Lucide/Heroicons style) directly in JSX. Do NOT import icon libraries.
3. Implement basic state for interactive elements (dropdowns, tabs, etc.).
4. Return ONLY the component code. No markdown. Ensure ALL variables are defined.


HTML:
${html}

CSS:
${css || ''}

OUTPUT (React Component Code Only):`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let code = response.text();

        // Clean up code markers
        code = code
            .replace(/```(javascript|jsx|typescript|tsx)?/g, '')
            .replace(/```/g, '')
            .trim();

        // Ensure export default
        if (!code.includes('export default')) {
            code = `export default function Component() {\n${code}\n}`;
        }

        return NextResponse.json({ code });
    } catch (error: any) {
        console.error('Gemini Preview API Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
