import { NextRequest, NextResponse } from 'next/server';
import { convertToViewports } from '@/lib/viewportConverter';

/**
 * POST /api/convert/to-viewports-instant
 * 
 * Converts React component to responsive variants WITHOUT AI
 * Uses deterministic rule-based transformations (instant, reliable)
 * 
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

    console.log('⚡ Converting to viewports (NO AI, instant)...');
    console.log('   Source:', sourceViewport);
    console.log('   Code length:', code.length, 'chars');

    // Deterministic transformation (no AI, instant)
    const variants = convertToViewports(code, sourceViewport);

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
        method: 'rule-based (no AI)',
        processingTime: '< 10ms',
      },
    });
  } catch (error: any) {
    console.error('❌ Viewport conversion error:', error);

    return NextResponse.json(
      {
        error: 'Viewport conversion failed',
        message: error?.message || 'Unknown error',
        details: error?.stack?.split('\n').slice(0, 3).join('\n'),
      },
      { status: 500 }
    );
  }
}
