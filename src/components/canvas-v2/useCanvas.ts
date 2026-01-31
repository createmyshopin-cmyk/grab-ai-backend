'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
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

    // History State
    const [history, setHistory] = useState<Block[][]>([[]]);
    const [historyIndex, setHistoryIndex] = useState(0);

    // Helper to save history
    const saveSnapshot = useCallback(() => {
        setHistory(prev => {
            const newHistory = prev.slice(0, historyIndex + 1);
            // Only push if different from last state?
            // Simple check to avoid duplicates on clicks
            // Note: blocks is a dependency, so it's the current state
            // However, this callback captures 'blocks' from render scope?
            // No, we need to access the LATEST blocks. 
            // We can't access state inside setState easily unless we pass it.
            // So we rely on the component calling this with the new state, or we depend on 'blocks'.
            return newHistory;
        });
    }, [historyIndex]); // We need to fix this pattern.

    // Robust History Commit
    // Call this AFTER updating blocks state
    const commitHistory = useCallback((newBlocks: Block[]) => {
        setHistory(prev => {
            const currentHistory = prev.slice(0, historyIndex + 1);
            // Basic equality check to prevent dupes (optional but good)
            if (currentHistory.length > 0 && JSON.stringify(currentHistory[currentHistory.length - 1]) === JSON.stringify(newBlocks)) {
                return currentHistory;
            }
            return [...currentHistory, newBlocks];
        });
        setHistoryIndex(prev => prev + 1);
    }, [historyIndex]);

    const undo = useCallback(() => {
        if (historyIndex > 0) {
            const newIndex = historyIndex - 1;
            setBlocks(history[newIndex]);
            setHistoryIndex(newIndex);
        }
    }, [history, historyIndex]);

    const redo = useCallback(() => {
        if (historyIndex < history.length - 1) {
            const newIndex = historyIndex + 1;
            setBlocks(history[newIndex]);
            setHistoryIndex(newIndex);
        }
    }, [history, historyIndex]);


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
        
        const newBlocks = [...blocks, newBlock];
        setBlocks(newBlocks);
        setSelectedBlockId(newBlock.id);
        commitHistory(newBlocks);
        return newBlock.id;
    }, [blocks, commitHistory]);

    // Duplicate a block
    const duplicateBlock = useCallback((id: string) => {
        const blockToDuplicate = blocks.find(b => b.id === id);
        if (!blockToDuplicate) return;

        const newBlock: Block = {
            ...blockToDuplicate,
            id: generateId(),
            name: `${blockToDuplicate.name} (Copy)`,
            x: blockToDuplicate.x, 
            y: blockToDuplicate.y
        };
        const newBlocks = [...blocks, newBlock];
        setBlocks(newBlocks);
        commitHistory(newBlocks);
    }, [blocks, commitHistory]);

    // Update a block
    // Note: We do NOT commit history here to avoid spam during drag.
    // Consumer must call 'saveSnapshot' (commitHistory) on drag end.
    const updateBlock = useCallback((id: string, updates: Partial<Block>) => {
        setBlocks(prev => prev.map(block =>
            block.id === id ? { ...block, ...updates } : block
        ));
    }, []);

    // Remove a block
    const removeBlock = useCallback((id: string) => {
        const newBlocks = blocks.filter(block => block.id !== id);
        setBlocks(newBlocks);
        if (selectedBlockId === id) {
            setSelectedBlockId(null);
        }
        commitHistory(newBlocks);
    }, [blocks, selectedBlockId, commitHistory]);

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
        // Reset history on load? Or set initial?
        setHistory([state.blocks]);
        setHistoryIndex(0);
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
        // History
        undo,
        redo,
        commitHistory,
    };
}
