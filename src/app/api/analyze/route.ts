import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '');

export async function POST(req: NextRequest) {
    try {
        const { code } = await req.json();

        if (!code) {
            return NextResponse.json({ error: 'Code is required' }, { status: 400 });
        }

        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const prompt = `### ROLE
You are a Principal Product Designer & Lead Front-end Architect. Analyze the code below based on a strict "Swiss Minimalism meets Apple Aesthetic" philosophy.

### TASK
Provide 4-6 sophisticated, actionable design refinement keywords or short phrases.
Focus on:
- "Optical Balance" (fixes for borders, alignment)
- "Micro-Interactions" (adding spring animations)
- "Semantic Colors" (using slate/zinc instead of gray)
- "Vertical Rhythm" (spacing fixes)
- "Glassmorphism/Neumorphism" (if applicable)

Avoid generic terms like "Fix CSS". Be specific to high-fidelity UI/UX.

Return ONLY a JSON array of strings. No markdown.

Code:
${code.substring(0, 3000)}
`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();

        // Clean up markdown if present
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();

        let keywords = [];
        try {
            keywords = JSON.parse(text);
        } catch (e) {
            console.error('Failed to parse keywords JSON', text);
            keywords = ['Enhance Visul Hierarchy', 'Refine Spacing', 'Modernize Colors'];
        }

        return NextResponse.json({ keywords });
    } catch (error: any) {
        console.error('Analyze API Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to analyze code' },
            { status: 500 }
        );
    }
}
