'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import CodeBlock from '@/components/canvas-v2/CodeBlock';

interface Block {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  code: string;
  type: 'html' | 'react' | 'vanilla';
  name?: string;
  metadata?: any;
  suggestedKeywords?: string[];
}

interface CanvasState {
  blocks: Block[];
  viewport: {
    x: number;
    y: number;
    zoom: number;
  };
}

export default function SharedCanvasPage() {
  const params = useParams();
  const router = useRouter();
  const shareId = params.id as string;
  
  const [canvasState, setCanvasState] = useState<CanvasState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewport, setViewport] = useState({ x: 0, y: 0, zoom: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Load shared canvas data
  useEffect(() => {
    const loadSharedCanvas = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('shared_canvas')
          .select('data')
          .eq('id', shareId)
          .single();

        if (error) {
          console.error('Error loading shared canvas:', error);
          setError('Canvas not found');
          setLoading(false);
          return;
        }

        if (data?.data) {
          const state = data.data as CanvasState;
          setCanvasState(state);
          
          // Set initial viewport to match shared state
          if (state.viewport) {
            setViewport(state.viewport);
          }
        } else {
          setError('Invalid canvas data');
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error:', err);
        setError('Failed to load canvas');
        setLoading(false);
      }
    };

    if (shareId) {
      loadSharedCanvas();
    }
  }, [shareId]);

  // Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).closest('.canvas-layer')) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - viewport.x, y: e.clientY - viewport.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setViewport({
        ...viewport,
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  // Zoom handler
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY * -0.001;
    const newZoom = Math.max(0.1, Math.min(3, viewport.zoom + delta));
    
    // Zoom towards cursor position
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setViewport({
      x: x - (x - viewport.x) * (newZoom / viewport.zoom),
      y: y - (y - viewport.y) * (newZoom / viewport.zoom),
      zoom: newZoom,
    });
  };

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600 font-medium">Loading shared canvas...</p>
        </div>
      </div>
    );
  }

  if (error || !canvasState) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-600">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Canvas Not Found</h1>
          <p className="text-gray-600">{error || 'This shared canvas does not exist or has been removed.'}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-gray-50">
      {/* Header */}
      <header className="h-14 flex items-center justify-between px-6 bg-white border-b border-gray-200 shadow-sm z-50">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            <span className="font-medium">Back to Editor</span>
          </button>
          <div className="h-6 w-[1px] bg-gray-200"></div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-600">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
            </div>
            <div>
              <h1 className="text-sm font-bold text-gray-900">Shared Canvas</h1>
              <p className="text-xs text-gray-500">Read-only view</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 bg-gray-100 rounded-lg text-sm text-gray-600 font-medium">
            {canvasState.blocks.length} {canvasState.blocks.length === 1 ? 'Component' : 'Components'}
          </div>
          <div className="px-3 py-1.5 bg-gray-100 rounded-lg text-sm text-gray-600 font-mono">
            {Math.round(viewport.zoom * 100)}%
          </div>
        </div>
      </header>

      {/* Canvas */}
      <div
        className="flex-1 relative overflow-hidden cursor-grab active:cursor-grabbing select-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        {/* Grid Background */}
        <div
          className="canvas-layer absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle, #ddd 1px, transparent 1px)`,
            backgroundSize: `${24 * viewport.zoom}px ${24 * viewport.zoom}px`,
            backgroundPosition: `${viewport.x}px ${viewport.y}px`,
          }}
        />

        {/* Canvas Transform Layer */}
        <div
          className="absolute origin-top-left"
          style={{
            transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
            willChange: 'transform',
          }}
        >
          {/* Render Blocks */}
          {canvasState.blocks.map((block) => (
            <CodeBlock
              key={block.id}
              block={block}
              isSelected={false}
              zoom={viewport.zoom}
              onSelect={() => {}}
              onUpdate={() => {}}
              onRemove={() => {}}
              selectedBlockIds={[]}
            />
          ))}
        </div>

        {/* Watermark */}
        <div className="absolute bottom-6 right-6 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg px-4 py-2 border border-gray-200 pointer-events-none">
          <p className="text-xs text-gray-500 font-medium">
            Created with <span className="font-bold text-emerald-600">InfiniteCanvas</span>
          </p>
        </div>
      </div>
    </div>
  );
}
