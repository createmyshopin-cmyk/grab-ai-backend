import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '');

export async function GET(req: NextRequest) {
    try {
        // Test endpoint to verify API key configuration
        const isConfigured = !!process.env.GOOGLE_GEMINI_API_KEY;
        
        return NextResponse.json({ 
            status: 'ok',
            apiKey: isConfigured ? 'configured' : 'missing',
            availableModels: [
                'gemini-3-pro-preview',
                'gemini-3-flash-preview',
                'gemini-2.0-flash-exp'
            ]
        });
    } catch (error: any) {
        console.error('Test Models Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to check configuration' },
            { status: 500 }
        );
    }
}
