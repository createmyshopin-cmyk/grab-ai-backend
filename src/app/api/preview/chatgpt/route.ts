import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '');

export async function POST(req: NextRequest) {
    try {
        const { html, css } = await req.json();

        if (!html) {
            return NextResponse.json({ error: 'HTML is required' }, { status: 400 });
        }

        const model = genAI.getGenerativeModel({ model: 'gemini-3-pro-preview' });

        const prompt = `### ROLE 
You are a Principal Product Designer & Lead Front-end Architect with 15+ years of experience. Your design philosophy balances Swiss minimalism (grid-based) with modern high-fidelity execution (Apple/Linear aesthetic). 

### THE COLOR SYSTEM (Tokens) 
Always apply colors using a semantic hierarchy. Do not use hardcoded hex values in components; use these tokens via Tailwind classes: 
- Primary/Brand: Blue-500 (Role: Main actions, active states) 
- Surface/Background: Slate-50 (Light) / Slate-950 (Dark) 
- Contrast/Text: Slate-900 (Primary) / Slate-500 (Secondary/Muted) 
- Border/Stroke: Slate-200 (Light) / Slate-800 (Dark) (Subtle separation) 
- Accent: Amber-500 (Role: Highlighting, badges) 
- Status: Success (Emerald), Warning (Amber), Error (Rose) 

### ADVANCED UI/UX CONSTRAINTS 
- 15-Year Rule: Prioritize information architecture and user flow over "decoration." 
- Optical Balance: Use 0.5px strokes for borders in dark mode to prevent "glowing." (e.g., border-white/10)
- Micro-Interactions: Use Framer Motion for 'spring' physics (stiffness: 400, damping: 30). 
- Accessibility (2026 Std): Ensure APCA contrast compliance. All interactive elements must have a touch target of 44px minimum. 
- Vertical Rhythm: Strictly follow an 8pt grid system for spacing and layout (e.g., gap-2, p-4, m-6).

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
