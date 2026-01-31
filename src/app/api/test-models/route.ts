import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '');

export async function GET(req: NextRequest) {
    try {
        // Try to list models
        const models = await genAI.listModels();
        
        return NextResponse.json({ 
            models: models,
            apiKey: process.env.GOOGLE_GEMINI_API_KEY ? 'configured' : 'missing'
        });
    } catch (error: any) {
        console.error('Test Models Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to list models' },
            { status: 500 }
        );
    }
}
