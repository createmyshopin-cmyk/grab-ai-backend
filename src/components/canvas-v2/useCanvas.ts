'use client';

import { useState, useCallback, useRef } from 'react';
import { Block, Viewport, CanvasState, Point } from './types';

// Generate unique IDs
const generateId = () => `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Detect code type from pasted text
export function detectCodeType(code: string): 'html' | 'react' | 'vanilla' {
    const trimmed = code.trim();

    // React detection
    if (
        trimmed.includes('import React') ||
        trimmed.includes('export default function') ||
        trimmed.includes('export default class') ||
        /className\s*=/.test(trimmed) ||
        /<[A-Z]/.test(trimmed) // JSX component tags
    ) {
        return 'react';
    }

    // Vanilla JS detection
    if (
        trimmed.includes('<script') ||
        /^(const|let|var|function)\s+\w+/m.test(trimmed) &&
        !/<[a-z]/i.test(trimmed)
    ) {
        return 'vanilla';
    }

    // Default to HTML
    return 'html';
}

export function useCanvas() {
    const [blocks, setBlocks] = useState<Block[]>([]);
    const [viewport, setViewport] = useState<Viewport>({ x: 0, y: 0, zoom: 1 });
    const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
    const [selectedBlockIds, setSelectedBlockIds] = useState<string[]>([]);

    // Ref for tracking drag state
    const dragRef = useRef<{
        isPanning: boolean;
        startX: number;
        startY: number;
        startViewportX: number;
        startViewportY: number;
    }>({ isPanning: false, startX: 0, startY: 0, startViewportX: 0, startViewportY: 0 });

    // Add a new block
    const addBlock = useCallback((code: string, position?: Point) => {
        const type = detectCodeType(code);
        const newBlock: Block = {
            id: generateId(),
            x: position?.x ?? 100,
            y: position?.y ?? 100,
            width: 500,
            height: 400,
            code,
            type,
            name: `Component ${blocks.length + 1}`,
        };
        setBlocks(prev => [...prev, newBlock]);
        setSelectedBlockId(newBlock.id);
        return newBlock.id;
    }, [blocks.length]); // creating dependency on length

    // Duplicate a block
    const duplicateBlock = useCallback((id: string) => {
        setBlocks(prev => {
            const blockToDuplicate = prev.find(b => b.id === id);
            if (!blockToDuplicate) return prev; // Should not happen

            const newBlock: Block = {
                ...blockToDuplicate,
                id: generateId(),
                name: `${blockToDuplicate.name} (Copy)`,
                x: blockToDuplicate.x, // Start at same position (will stay behind while original drags)
                y: blockToDuplicate.y
            };
            return [...prev, newBlock];
        });
    }, []);

    // Update a block
    const updateBlock = useCallback((id: string, updates: Partial<Block>) => {
        setBlocks(prev => prev.map(block =>
            block.id === id ? { ...block, ...updates } : block
        ));
    }, []);

    // Remove a block
    const removeBlock = useCallback((id: string) => {
        setBlocks(prev => prev.filter(block => block.id !== id));
        if (selectedBlockId === id) {
            setSelectedBlockId(null);
        }
    }, [selectedBlockId]);

    // Pan viewport
    const startPan = useCallback((clientX: number, clientY: number) => {
        dragRef.current = {
            isPanning: true,
            startX: clientX,
            startY: clientY,
            startViewportX: viewport.x,
            startViewportY: viewport.y,
        };
    }, [viewport]);

    const updatePan = useCallback((clientX: number, clientY: number) => {
        if (!dragRef.current.isPanning) return;

        const dx = clientX - dragRef.current.startX;
        const dy = clientY - dragRef.current.startY;

        setViewport(prev => ({
            ...prev,
            x: dragRef.current.startViewportX + dx,
            y: dragRef.current.startViewportY + dy,
        }));
    }, []);

    const endPan = useCallback(() => {
        dragRef.current.isPanning = false;
    }, []);

    // Zoom
    const handleZoom = useCallback((delta: number, centerX: number, centerY: number) => {
        setViewport(prev => {
            const zoomFactor = delta > 0 ? 0.9 : 1.1;
            const newZoom = Math.min(Math.max(prev.zoom * zoomFactor, 0.1), 5);

            // Zoom towards cursor position
            const zoomRatio = newZoom / prev.zoom;
            const newX = centerX - (centerX - prev.x) * zoomRatio;
            const newY = centerY - (centerY - prev.y) * zoomRatio;

            return { x: newX, y: newY, zoom: newZoom };
        });
    }, []);

    // Get canvas state for persistence
    const getState = useCallback((): CanvasState => ({
        blocks,
        viewport,
    }), [blocks, viewport]);

    // Load canvas state
    const loadState = useCallback((state: CanvasState) => {
        setBlocks(state.blocks);
        setViewport(state.viewport);
    }, []);

    // Screen to canvas coordinates
    const screenToCanvas = useCallback((screenX: number, screenY: number): Point => {
        return {
            x: (screenX - viewport.x) / viewport.zoom,
            y: (screenY - viewport.y) / viewport.zoom,
        };
    }, [viewport]);

    return {
        blocks,
        viewport,
        selectedBlockId,
        setSelectedBlockId,
        selectedBlockIds,
        setSelectedBlockIds,
        addBlock,
        updateBlock,
        removeBlock,
        duplicateBlock,
        startPan,
        updatePan,
        endPan,
        handleZoom,
        getState,
        loadState,
        screenToCanvas,
        isPanning: () => dragRef.current.isPanning,
    };
}
