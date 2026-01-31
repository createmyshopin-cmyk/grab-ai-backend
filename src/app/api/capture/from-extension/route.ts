import { NextRequest, NextResponse } from 'next/server';

/**
 * Production-ready API endpoint to receive captured components from Chrome Extension
 * Stores components in a queue that the canvas can consume
 */

// In-memory queue for real-time component delivery
// In production, use Redis or a database with pub/sub
const componentQueue: any[] = [];
const MAX_QUEUE_SIZE = 50;

export async function POST(req: NextRequest) {
    try {
        const data = await req.json();

        console.log('📥 Received from Chrome Extension:');
        console.log('   Component:', data.componentName);
        console.log('   Source:', data.metadata?.sourceUrl);
        console.log('   Code length:', data.code?.length, 'characters');

        // Validate data
        if (!data.code || !data.componentName) {
            return NextResponse.json(
                { error: 'Missing required fields: code and componentName' },
                { status: 400 }
            );
        }

        // Create component object
        const component = {
            id: Date.now().toString(),
            code: data.code,
            componentName: data.componentName,
            metadata: {
                ...data.metadata,
                receivedAt: new Date().toISOString(),
                addedToQueue: true
            }
        };

        // Add to queue (FIFO)
        componentQueue.unshift(component);
        
        // Limit queue size
        if (componentQueue.length > MAX_QUEUE_SIZE) {
            componentQueue.pop();
        }

        console.log('✅ Component added to queue. Queue size:', componentQueue.length);

        // Return success
        return NextResponse.json({
            success: true,
            message: 'Component captured and queued successfully',
            component: {
                id: component.id,
                componentName: component.componentName,
                queuePosition: 0,
                queueSize: componentQueue.length
            }
        });

    } catch (error: any) {
        console.error('❌ Extension capture API error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to process captured component' },
            { status: 500 }
        );
    }
}

/**
 * GET endpoint - Poll for new components
 */
export async function GET(req: NextRequest) {
    const url = new URL(req.url);
    const action = url.searchParams.get('action');
    
    if (action === 'poll') {
        // Return all queued components and clear the queue
        const components = [...componentQueue];
        componentQueue.length = 0; // Clear queue
        
        return NextResponse.json({
            success: true,
            components,
            count: components.length,
            timestamp: new Date().toISOString()
        });
    }
    
    // Health check
    return NextResponse.json({
        status: 'ok',
        message: 'Grab AI Extension API is running',
        queueSize: componentQueue.length,
        timestamp: new Date().toISOString()
    });
}
