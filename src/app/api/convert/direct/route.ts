/**
 * Direct HTML to React Converter API
 * 
 * Uses html-to-react inspired conversion
 * Reference: https://github.com/aknuds1/html-to-react
 * NO AI interpretation - Pure syntax conversion
 */

import { NextRequest, NextResponse } from 'next/server';
import { htmlToReactCode } from '@/lib/htmlToReactConverter';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { captureData } = body;

    if (!captureData) {
      return NextResponse.json(
        { error: 'Missing captureData' },
        { status: 400 }
      );
    }

    console.log('📦 Direct conversion starting (html-to-react style)...');
    console.log('   Tag:', captureData.element?.tag || captureData.tagName);

    // Get HTML content - prefer inline styles version from extension
    const html = captureData.element?.html || captureData.html || '';
    
    if (!html) {
      return NextResponse.json(
        { error: 'No HTML content to convert' },
        { status: 400 }
      );
    }

    console.log('   HTML length:', html.length);
    console.log('   Has inline styles:', html.includes('style="'));

    // Generate component name
    const tag = (captureData.element?.tag || captureData.tagName || 'div').toLowerCase();
    const componentName = `Captured${tag.charAt(0).toUpperCase() + tag.slice(1)}Section`;

    // Use the improved html-to-react converter
    // Reference: https://github.com/aknuds1/html-to-react
    const conversionResult = htmlToReactCode(html, { componentName });

    console.log('✅ Direct conversion complete!');
    console.log('   Component:', conversionResult.componentName);
    console.log('   Elements:', conversionResult.elementCount);
    console.log('   Has images:', conversionResult.hasImages);
    console.log('   Has styles:', conversionResult.hasStyles);
    console.log('   Code length:', conversionResult.code.length, 'chars');

    return NextResponse.json({
      code: conversionResult.code,
      componentName: conversionResult.componentName,
      conversionType: 'direct-html-to-react',
      elementCount: conversionResult.elementCount,
      hasImages: conversionResult.hasImages,
      hasStyles: conversionResult.hasStyles
    });

  } catch (error: any) {
    console.error('❌ Direct conversion error:', error);
    return NextResponse.json(
      { error: error.message || 'Conversion failed' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Direct HTML to React converter ready',
    description: 'Uses html-to-react style conversion (no AI)',
    reference: 'https://github.com/aknuds1/html-to-react',
    timestamp: new Date().toISOString()
  });
}
