'use client';

import React, { useState, useRef, useCallback, memo } from 'react';
import { Block } from './types';
import Preview from './Preview';

interface CodeBlockProps {
    block: Block;
    isSelected: boolean;
    zoom: number;
    onSelect: () => void;
    onUpdate: (updates: Partial<Block>) => void;
    onRemove: () => void;
    selectedBlockIds?: string[];
    onGroupMove?: (dx: number, dy: number) => void;
    onDuplicate?: () => void;
}

/**
 * CodeBlock - Matches the "Component Styles" reference
 * - Floating pill header
 * - Blue selection frame with handles
 * - Dimension badge
 */
function CodeBlock({
    block,
    isSelected,
    zoom,
    onSelect,
    onUpdate,
    onRemove,
    selectedBlockIds = [],
    onGroupMove,
    onDuplicate,
}: CodeBlockProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const dragRef = useRef({ startX: 0, startY: 0, startBlockX: 0, startBlockY: 0 });
    const resizeRef = useRef({ startX: 0, startY: 0, startW: 0, startH: 0, startBlockX: 0, startBlockY: 0 });

    // Handle drag start (from header)
    const handleDragStart = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        onSelect();

        // Handle duplication (Alt + Drag)
        if (e.altKey && onDuplicate) {
            onDuplicate();
            // Note: We continue dragging the *original* block, while duplicate is left behind
        }

        setIsDragging(true);
        dragRef.current = {
            startX: e.clientX,
            startY: e.clientY,
            startBlockX: block.x,
            startBlockY: block.y,
        };

        // Check if this block is part of a multi-selection
        const isGroupMove = selectedBlockIds.length > 1 && selectedBlockIds.includes(block.id);

        const handleDragMove = (moveEvent: MouseEvent) => {
            const dx = (moveEvent.clientX - dragRef.current.startX) / zoom;
            const dy = (moveEvent.clientY - dragRef.current.startY) / zoom;

            if (isGroupMove && onGroupMove) {
                // Move all selected blocks together
                onGroupMove(dx, dy);
            } else {
                // Move only this block
                onUpdate({
                    x: dragRef.current.startBlockX + dx,
                    y: dragRef.current.startBlockY + dy,
                });
            }
        };

        const handleDragEnd = () => {
            setIsDragging(false);
            window.removeEventListener('mousemove', handleDragMove);
            window.removeEventListener('mouseup', handleDragEnd);
        };

        window.addEventListener('mousemove', handleDragMove);
        window.addEventListener('mouseup', handleDragEnd);
    }, [block.x, block.y, block.id, zoom, onSelect, onUpdate, selectedBlockIds, onGroupMove]);

    // Handle resize start
    const handleResizeStart = useCallback((direction: 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w') => (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsResizing(true);
        resizeRef.current = {
            startX: e.clientX,
            startY: e.clientY,
            startW: block.width,
            startH: block.height,
            startBlockX: block.x, // Store initial positions relative to parent/canvas
            startBlockY: block.y
        };

        const handleResizeMove = (moveEvent: MouseEvent) => {
            const dx = (moveEvent.clientX - resizeRef.current.startX) / zoom;
            const dy = (moveEvent.clientY - resizeRef.current.startY) / zoom;

            let newW = resizeRef.current.startW;
            let newH = resizeRef.current.startH;
            let newX = resizeRef.current.startBlockX;
            let newY = resizeRef.current.startBlockY;

            // Horizontal resizing
            if (direction.includes('w')) { // Left side
                newW = Math.max(200, resizeRef.current.startW - dx);
                newX = resizeRef.current.startBlockX + (resizeRef.current.startW - newW);
            } else if (direction.includes('e')) { // Right side
                newW = Math.max(200, resizeRef.current.startW + dx);
            }

            // Vertical resizing
            if (direction.includes('n')) { // Top side
                newH = Math.max(150, resizeRef.current.startH - dy);
                newY = resizeRef.current.startBlockY + (resizeRef.current.startH - newH);
            } else if (direction.includes('s')) { // Bottom side
                newH = Math.max(150, resizeRef.current.startH + dy);
            }

            onUpdate({
                x: newX,
                y: newY,
                width: newW,
                height: newH,
            });
        };

        const handleResizeEnd = () => {
            setIsResizing(false);
            window.removeEventListener('mousemove', handleResizeMove);
            window.removeEventListener('mouseup', handleResizeEnd);
        };

        window.addEventListener('mousemove', handleResizeMove);
        window.addEventListener('mouseup', handleResizeEnd);
    }, [block.width, block.height, block.x, block.y, zoom, onUpdate]);


    const [isInteractive, setIsInteractive] = useState(false);
    const [showDeviceMenu, setShowDeviceMenu] = useState(false);
    const [isAutoFit, setIsAutoFit] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);

    const deviceOptions = [
        { name: 'Mobile', width: 402, height: 874, icon: '📱', iconType: 'mobile' },
        { name: 'Tablet', width: 1133, height: 744, icon: '📱', iconType: 'tablet' },
        { name: 'Browser', width: 1440, height: 1024, icon: '🖥️', iconType: 'browser' },
    ];

    const handleDeviceSelect = (width: number, height: number) => {
        onUpdate({ width, height });
        setShowDeviceMenu(false);
    };

    // Get current device info based on dimensions
    const getCurrentDevice = () => {
        const match = deviceOptions.find(
            d => d.width === block.width && d.height === block.height
        );
        return match || { name: 'Custom', icon: '📐', iconType: 'custom' };
    };

    // Format display name with dimensions
    const getDisplayName = () => {
        const device = getCurrentDevice();
        return `${device.icon} ${device.name} (${block.width}×${block.height})`;
    };

    // Parse dimensions from text input
    const handleNameChange = (value: string) => {
        // Try to extract dimensions like "1440×1024" or "1440 × 1024" or "1440x1024"
        const dimensionMatch = value.match(/(\d+)\s*[×x]\s*(\d+)/);
        
        if (dimensionMatch) {
            const newWidth = parseInt(dimensionMatch[1]);
            const newHeight = parseInt(dimensionMatch[2]);
            
            // Validate dimensions (minimum 200x150, maximum 4000x4000)
            if (newWidth >= 200 && newWidth <= 4000 && newHeight >= 150 && newHeight <= 4000) {
                onUpdate({ 
                    width: newWidth, 
                    height: newHeight 
                });
            }
        }
        
        // Also update the name if user typed a custom label
        // Extract just the name part (before dimensions)
        const nameMatch = value.match(/^([^(]+)/);
        if (nameMatch) {
            const customName = nameMatch[1].trim();
            if (customName && customName !== getDisplayName()) {
                onUpdate({ name: customName });
            }
        }
    };

    // Auto-fit: Measure iframe content and adjust dimensions
    const handleAutoFit = useCallback(() => {
        if (!contentRef.current) return;

        const iframe = contentRef.current.querySelector('iframe');
        if (!iframe) return;

        try {
            // Wait for iframe to load
            iframe.addEventListener('load', () => {
                try {
                    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
                    if (!iframeDoc) return;

                    // Get the actual rendered content size
                    const body = iframeDoc.body;
                    const html = iframeDoc.documentElement;

                    const contentWidth = Math.max(
                        body.scrollWidth,
                        body.offsetWidth,
                        html.clientWidth,
                        html.scrollWidth,
                        html.offsetWidth
                    );

                    const contentHeight = Math.max(
                        body.scrollHeight,
                        body.offsetHeight,
                        html.clientHeight,
                        html.scrollHeight,
                        html.offsetHeight
                    );

                    // Add some padding and enforce minimums
                    const newWidth = Math.max(300, Math.min(3000, contentWidth + 20));
                    const newHeight = Math.max(200, Math.min(2000, contentHeight + 20));

                    // Update dimensions
                    onUpdate({
                        width: newWidth,
                        height: newHeight
                    });
                } catch (e) {
                    console.warn('Auto-fit: Cannot access iframe content (CORS)', e);
                }
            });
        } catch (e) {
            console.error('Auto-fit error:', e);
        }
    }, [onUpdate]);

    // Toggle auto-fit
    const toggleAutoFit = useCallback(() => {
        const newAutoFit = !isAutoFit;
        setIsAutoFit(newAutoFit);
        
        if (newAutoFit) {
            handleAutoFit();
        }
    }, [isAutoFit, handleAutoFit]);

    // Monitor content changes and auto-fit when enabled
    React.useEffect(() => {
        if (isAutoFit) {
            const timer = setTimeout(() => {
                handleAutoFit();
            }, 500); // Debounce to avoid excessive updates

            return () => clearTimeout(timer);
        }
    }, [isAutoFit, block.code, handleAutoFit]);

    // Calculate inverse scale to keep UI elements constant size relative to screen
    const inverseZoom = 1 / zoom;
    const uiStyle = {
        transform: `scale(${inverseZoom})`,
        transformOrigin: 'bottom left',
    };

    // Scale handles from their center
    const handleStyle = {
        transform: `scale(${inverseZoom})`,
        transformOrigin: 'center',
    };

    const Handle = ({ className, onMouseDown, style }: { className: string, onMouseDown?: React.MouseEventHandler, style?: React.CSSProperties }) => (
        <div
            className={`absolute w-2.5 h-2.5 bg-white border border-blue-500 z-20 ${className}`}
            style={style}
            onMouseDown={onMouseDown}
        />
    );

    // Click outside listener could be added here, currently using simple onMouseLeave on the container for simplicity or toggle

    // Main container now handles DragStart
    return (
        <div
            className="absolute"
            data-block-id={block.id}
            style={{
                left: block.x,
                top: block.y,
                width: block.width,
                height: block.height,
                cursor: isInteractive ? 'default' : 'move', // 'move' cursor when not interactive
            }}
            onMouseDown={(e) => {
                // If not interactive, dragging anywhere moves it
                if (!isInteractive && !showDeviceMenu) {
                    handleDragStart(e);
                }
            }}
            onClick={(e) => {
                e.stopPropagation();
                onSelect();
                setShowDeviceMenu(false);
            }}
        >
            {/* ================= FLOATING HEADER (Pill) ================= */}
            {isSelected && (
                <div
                    className="absolute -top-14 left-0 h-11 bg-white rounded-full shadow-xl border border-gray-200 flex items-center px-4 gap-3 z-[60] select-none animate-in fade-in slide-in-from-bottom-2 duration-200"
                    style={{
                        minWidth: 'fit-content',
                        transform: `scale(${inverseZoom})`,
                        transformOrigin: 'bottom left',
                        marginBottom: `${10 * inverseZoom}px`,
                    }}
                    onMouseDown={(e) => {
                        // Header is a drag handle
                        e.stopPropagation();
                        setIsInteractive(false);
                        handleDragStart(e);
                    }}
                >
                    {/* DEVICE ICON (Toggle) */}
                    <div className="relative flex items-center">
                        <button
                            className={`flex items-center justify-center text-gray-500 hover:text-gray-900 transition-colors`}
                            onClick={(e) => { e.stopPropagation(); setShowDeviceMenu(!showDeviceMenu); }}
                            onMouseDown={(e) => e.stopPropagation()}
                            title="Change Device Size"
                        >
                            {getCurrentDevice().iconType === 'mobile' && (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect width="14" height="20" x="5" y="2" rx="2" ry="2" />
                                    <path d="M12 18h.01" />
                                </svg>
                            )}
                            {getCurrentDevice().iconType === 'tablet' && (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect width="16" height="20" x="4" y="2" rx="2" ry="2" />
                                    <path d="M12 18h.01" />
                                </svg>
                            )}
                            {getCurrentDevice().iconType === 'browser' && (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                                    <line x1="3" y1="9" x2="21" y2="9" />
                                </svg>
                            )}
                            {getCurrentDevice().iconType === 'custom' && (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                                </svg>
                            )}
                        </button>

                        {/* Dropdown Menu - Positioned below */}
                        {showDeviceMenu && (
                            <div
                                className="absolute top-full left-0 mt-3 w-48 bg-white rounded-xl shadow-xl border border-gray-200 py-1 flex flex-col z-[70] overflow-hidden"
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={(e) => e.stopPropagation()} // Prevent drag start when clicking menu
                                style={{ cursor: 'default' }}
                            >
                                {deviceOptions.map((device) => (
                                    <button
                                        key={device.name}
                                        className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 text-left group w-full"
                                        onClick={() => handleDeviceSelect(device.width, device.height)}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="text-base">{device.icon}</span>
                                            <span className="text-sm font-medium text-gray-700">{device.name}</span>
                                        </div>
                                        <span className="text-xs text-gray-400 font-mono">{device.width} × {device.height}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* COMPONENT NAME INPUT */}
                    <input
                        type="text"
                        value={getDisplayName()}
                        onChange={(e) => handleNameChange(e.target.value)}
                        onBlur={(e) => handleNameChange(e.target.value)}
                        className="bg-transparent text-[13px] font-bold text-gray-800 w-40 px-1 focus:outline-none focus:bg-gray-50 focus:ring-1 focus:ring-blue-500 rounded transition-colors"
                        onMouseDown={(e) => e.stopPropagation()}
                        onKeyDown={(e) => {
                            e.stopPropagation();
                            // Apply changes on Enter
                            if (e.key === 'Enter') {
                                handleNameChange(e.currentTarget.value);
                                e.currentTarget.blur();
                            }
                        }}
                        placeholder="Device (width×height)"
                        title="Click to edit device name and dimensions"
                    />

                    {/* SEPARATOR */}
                    <div className="w-[1px] h-5 bg-gray-200" />

                    {/* ACTION GROUP */}
                    <div className="flex items-center gap-3">
                        {/* Auto Fit Toggle */}
                        <button
                            className={`transition-colors ${isAutoFit ? 'text-green-500' : 'text-gray-400 hover:text-gray-600'}`}
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleAutoFit();
                            }}
                            onMouseDown={(e) => e.stopPropagation()}
                            title={isAutoFit ? "Auto-fit: ON (fits content)" : "Auto-fit: OFF (click to fit content)"}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                            </svg>
                        </button>

                        {/* Interaction Toggle (Sun/Spinner) */}
                        <button
                            className={`transition-colors ${isInteractive ? 'text-blue-500' : 'text-gray-400 hover:text-gray-600'}`}
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsInteractive(!isInteractive);
                            }}
                            onMouseDown={(e) => e.stopPropagation()}
                            title={isInteractive ? "Interactive Mode On" : "Enable Interaction"}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 2v4" /><path d="m16.2 7.8 2.9-2.9" /><path d="M18 12h4" /><path d="m16.2 16.2 2.9 2.9" /><path d="M12 18v4" /><path d="m4.9 19.1 2.9-2.9" /><path d="M2 12h4" /><path d="m4.9 4.9 2.9 2.9" />
                            </svg>
                        </button>

                        {/* Globe / Web (Placeholder) */}
                        <button
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                            title="Publish / Web"
                            onMouseDown={(e) => e.stopPropagation()}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="2" y1="12" x2="22" y2="12" />
                                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                            </svg>
                        </button>
                    </div>

                    {/* SEPARATOR */}
                    <div className="w-[1px] h-5 bg-gray-200" />

                    {/* MENU (Vertical Ellipsis) */}
                    <button
                        className="text-gray-500 hover:text-gray-900 transition-colors"
                        onClick={(e) => {
                            e.stopPropagation();
                            // Trigger native context menu programmatic if possible, or just custom logic
                            // For now, simpler to just map to remove for quick action or show menu
                            // The user requested 'more red delete button' earlier, but this menu replaces it.
                            // I'll make this specific button just trigger Remove for now or context menu?
                            // Better: Trigger the context menu at this location! 
                            // But I don't have access to openContextMenu from props nicely.
                            // I'll leave it as a Delete action for now since that was the primary button before, OR duplicate.
                            // Actually, let's make it a simple "Remove" for now to maintain parity, 
                            // or better, find a way to toggle options.
                            onRemove();
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        title="Options (Click to Delete)"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="1" />
                            <circle cx="12" cy="5" r="1" />
                            <circle cx="12" cy="19" r="1" />
                        </svg>
                    </button>
                </div>
            )}

            {/* ================= DIMENSION BADGE ================= */}
            {isSelected && isResizing && (
                <div
                    className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm z-30 pointer-events-none"
                    style={{
                        transform: `scale(${inverseZoom}) translate(-50%, 0)`, // Center correction with scale
                        transformOrigin: 'top center'
                    }}
                >
                    {Math.round(block.width)} × {Math.round(block.height)}
                </div>
            )}

            {/* ================= MAIN CONTENT ================= */}
            <div className={`w-full h-full relative group ${!isInteractive ? 'pointer-events-none' : ''}`}>

                {/* SELECTION / HOVER FRAME */}
                <div
                    className={`absolute -inset-[1px] border z-10 pointer-events-none transition-colors duration-200 ${isSelected ? 'border-blue-500' : 'border-transparent group-hover:border-blue-300'}`}
                    style={{
                        borderWidth: `${1 * inverseZoom}px`, // Scale border thickness!
                    }}
                />

                {/* RESIZE HANDLES (Corners & Edges) */}
                {isSelected && (
                    <div className="pointer-events-auto">

                        {/* --- INVISIBLE RESIZE ZONES (Full Edges) --- */}
                        {/* Top Zone */}
                        <div
                            className="absolute left-0 right-0 z-20 cursor-ns-resize"
                            style={{
                                height: `${12 * inverseZoom}px`,
                                top: `${-6 * inverseZoom}px`,
                            }}
                            onMouseDown={handleResizeStart('n')}
                        />
                        {/* Bottom Zone */}
                        <div
                            className="absolute left-0 right-0 z-20 cursor-ns-resize"
                            style={{
                                height: `${12 * inverseZoom}px`,
                                bottom: `${-6 * inverseZoom}px`,
                            }}
                            onMouseDown={handleResizeStart('s')}
                        />
                        {/* Left Zone */}
                        <div
                            className="absolute top-0 bottom-0 z-20 cursor-ew-resize"
                            style={{
                                width: `${12 * inverseZoom}px`,
                                left: `${-6 * inverseZoom}px`,
                            }}
                            onMouseDown={handleResizeStart('w')}
                        />
                        {/* Right Zone */}
                        <div
                            className="absolute top-0 bottom-0 z-20 cursor-ew-resize"
                            style={{
                                width: `${12 * inverseZoom}px`,
                                right: `${-6 * inverseZoom}px`,
                            }}
                            onMouseDown={handleResizeStart('e')}
                        />


                        {/* --- VISUAL HANDLES (Corners) --- */}
                        <Handle className="-top-1.5 -left-1.5 cursor-nwse-resize" style={handleStyle} onMouseDown={handleResizeStart('nw')} />
                        <Handle className="-top-1.5 -right-1.5 cursor-nesw-resize" style={handleStyle} onMouseDown={handleResizeStart('ne')} />
                        <Handle className="-bottom-1.5 -left-1.5 cursor-nesw-resize" style={handleStyle} onMouseDown={handleResizeStart('sw')} />
                        <Handle className="-bottom-1.5 -right-1.5 cursor-nwse-resize" style={handleStyle} onMouseDown={handleResizeStart('se')} />

                        {/* --- VISUAL HANDLES (Midpoints) --- */}
                        <Handle className="-top-1.5 left-1/2 -ml-1.5 cursor-ns-resize" style={handleStyle} onMouseDown={handleResizeStart('n')} />
                        <Handle className="-bottom-1.5 left-1/2 -ml-1.5 cursor-ns-resize" style={handleStyle} onMouseDown={handleResizeStart('s')} />
                        <Handle className="top-1/2 -mt-1.5 -left-1.5 cursor-ew-resize" style={handleStyle} onMouseDown={handleResizeStart('w')} />
                        <Handle className="top-1/2 -mt-1.5 -right-1.5 cursor-ew-resize" style={handleStyle} onMouseDown={handleResizeStart('e')} />
                    </div>
                )}

                {/* Content Container (Clip content) */}
                <div ref={contentRef} className="w-full h-full bg-white overflow-hidden relative">
                    {/* If not selected, show a subtle hover border maybe? */}
                    <div className="absolute inset-0 pointer-events-none border border-gray-100/50" />

                    <Preview
                        code={block.code}
                        type={block.type}
                        width={block.width}
                        height={block.height}
                        onContentResize={isAutoFit ? (width, height) => {
                            // Add padding and enforce limits
                            const newWidth = Math.max(300, Math.min(3000, width + 40));
                            const newHeight = Math.max(200, Math.min(2000, height + 40));
                            
                            // Only update if significantly different (avoid tiny fluctuations)
                            if (Math.abs(newWidth - block.width) > 10 || Math.abs(newHeight - block.height) > 10) {
                                onUpdate({ width: newWidth, height: newHeight });
                            }
                        } : undefined}
                    />
                    {/* Overlay for Drag when Not Interactive */}
                    {!isInteractive && (
                        <div className="absolute inset-0 z-20" style={{ cursor: 'move' }} />
                    )}
                </div>
            </div>
        </div>
    );
}

export default memo(CodeBlock);
