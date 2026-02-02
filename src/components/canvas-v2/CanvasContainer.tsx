'use client';

import React, { useCallback, useEffect, useRef, memo, useState } from 'react';
import { useCanvas, detectCodeType } from './useCanvas';
import CodeBlock from './CodeBlock';
import RightSidebar from './RightSidebar';
import ImageUploadModal from './ImageUploadModal';
import ViewportSelector from './ViewportSelector';
import { NotificationContainer } from './Notification';
import { useNotification } from '@/hooks/useNotification';
import { throttle } from 'lodash';
import { supabase } from '@/lib/supabaseClient';

// Icons as inline SVGs for zero dependencies
const Icons = {
    cursor: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 4l7.07 17 2.51-7.39L21 11.07z" />
        </svg>
    ),
    square: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
        </svg>
    ),
    circle: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
        </svg>
    ),
    line: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="5" y1="19" x2="19" y2="5" />
        </svg>
    ),
    pen: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 19l7-7 3 3-7 7-3-3z" />
            <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
        </svg>
    ),
    text: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 7V4h16v3M9 20h6M12 4v16" />
        </svg>
    ),
};

/**
 * CanvasContainer - Main infinite canvas with pan/zoom and paste handling
 */
function CanvasContainer() {
    const {
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
        isPanning,
    } = useCanvas();

    const containerRef = useRef<HTMLDivElement>(null);
    const lastMousePos = useRef({ x: 0, y: 0 });
    const [activeTool, setActiveTool] = useState('cursor');
    const [isSpacePressed, setIsSpacePressed] = useState(false);
    const isPanningState = useRef(false); // Ref for immediate access in handlers
    
    // Screenshot upload modal state
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    
    // Viewport selector modal state
    const [showViewportSelector, setShowViewportSelector] = useState(false);
    const [pendingCode, setPendingCode] = useState<string>('');
    
    // Share modal state
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [shareLink, setShareLink] = useState<string>('');
    const [isGeneratingLink, setIsGeneratingLink] = useState(false);
    
    const { notifications, showNotification, removeNotification } = useNotification();

    // ============== MARQUEE SELECTION STATE ==============
    const [selectionBox, setSelectionBox] = useState<{
        startX: number;
        startY: number;
        currentX: number;
        currentY: number;
    } | null>(null);

    // ============== GROUP MOVE STATE ==============
    const groupDragStartPositions = useRef<Map<string, { x: number; y: number }>>(new Map());

    // Handle group drag start - store all selected blocks' starting positions
    const handleGroupDragStart = useCallback(() => {
        const positions = new Map<string, { x: number; y: number }>();
        selectedBlockIds.forEach(id => {
            const block = blocks.find(b => b.id === id);
            if (block) {
                positions.set(id, { x: block.x, y: block.y });
            }
        });
        groupDragStartPositions.current = positions;
    }, [selectedBlockIds, blocks]);

    // Handle group move - apply delta to all selected blocks
    const handleGroupMove = useCallback((dx: number, dy: number) => {
        groupDragStartPositions.current.forEach((startPos, id) => {
            updateBlock(id, {
                x: startPos.x + dx,
                y: startPos.y + dy,
            });
        });
    }, [updateBlock]);

    // ============== VIEWPORT GENERATION ==============
    const generateViewportVariants = useCallback((selectedViewports: Array<'mobile' | 'tablet' | 'desktop'>) => {
        if (!pendingCode) return;

        setShowViewportSelector(false);

        const canvasPos = screenToCanvas(lastMousePos.current.x, lastMousePos.current.y);

        // Show loading notification
        const viewportLabels = selectedViewports.map(v => 
            v === 'mobile' ? 'Mobile (402×874)' : 
            v === 'tablet' ? 'Tablet (1133×744)' : 
            'Browser (1440×1024)'
        ).join(', ');

        showNotification({
            type: 'info',
            message: `🎨 Generating ${selectedViewports.length} variant${selectedViewports.length > 1 ? 's' : ''}: ${viewportLabels}...`,
            duration: 3000
        });

        // Create loading blocks
        const loadingCode = (viewport: string, dims: string) => `export default function Loading() {
  return (
    <div className="flex h-full flex-col items-center justify-center bg-gray-50 text-gray-400 font-mono text-sm space-y-3 animate-pulse">
      <div className="w-8 h-8 rounded-full border-2 border-gray-300 border-t-purple-500 animate-spin" />
      <p>📱 Generating ${viewport} (${dims})...</p>
    </div>
  );
}`;

        // Position blocks horizontally
        const spacing = 680;
        const blockIds: { [key: string]: string } = {};
        
        selectedViewports.forEach((viewport, index) => {
            const pos = { x: canvasPos.x - 500 + (index * spacing), y: canvasPos.y - 250 };
            const dims = viewport === 'mobile' ? '402×874' : viewport === 'tablet' ? '1133×744' : '1440×1024';
            const label = viewport === 'mobile' ? 'Mobile' : viewport === 'tablet' ? 'Tablet' : 'Browser';
            blockIds[viewport] = addBlock(loadingCode(label, dims), pos);
        });

        // Call instant viewport converter
        fetch('/api/convert/to-viewports-instant', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                code: pendingCode,
                sourceViewport: 'desktop'
            })
        })
        .then(res => res.json())
        .then(data => {
            if (data.mobile && data.tablet && data.desktop) {
                console.log('✅ Responsive variants generated!');
                
                // Update selected blocks
                selectedViewports.forEach((viewport) => {
                    const icon = viewport === 'mobile' ? '📱' : viewport === 'tablet' ? '📱' : '🖥️';
                    const label = viewport === 'mobile' ? 'Mobile' : viewport === 'tablet' ? 'Tablet' : 'Browser';
                    const dims = viewport === 'mobile' ? '402×874' : viewport === 'tablet' ? '1133×744' : '1440×1024';
                    
                    updateBlock(blockIds[viewport], {
                        code: data[viewport],
                        type: 'react',
                        name: `${icon} ${label} (${dims})`,
                        metadata: {
                            viewport,
                            responsive: true,
                            generatedFrom: 'viewport-conversion-instant'
                        }
                    });
                });

                showNotification({
                    type: 'success',
                    message: `⚡ ${selectedViewports.length} responsive variant${selectedViewports.length > 1 ? 's' : ''} created instantly!`,
                    duration: 4000
                });
            } else {
                console.error('❌ Viewport conversion failed:', data.error);
                
                // Fallback: Use original code
                selectedViewports.forEach((viewport) => {
                    const label = viewport === 'mobile' ? 'Mobile' : viewport === 'tablet' ? 'Tablet' : 'Browser';
                    updateBlock(blockIds[viewport], {
                        code: pendingCode,
                        type: 'react',
                        name: `${label} (Original)`,
                        metadata: { viewport, responsive: false, fallback: true }
                    });
                });

                showNotification({
                    type: 'warning',
                    message: 'Conversion failed. Using original code.',
                    duration: 4000
                });
            }
        })
        .catch(err => {
            console.error('❌ Network error:', err);
            
            // Fallback: Use original code
            selectedViewports.forEach((viewport) => {
                const label = viewport === 'mobile' ? 'Mobile' : viewport === 'tablet' ? 'Tablet' : 'Browser';
                updateBlock(blockIds[viewport], {
                    code: pendingCode,
                    type: 'react',
                    name: `${label} (Original)`,
                    metadata: { viewport, responsive: false, error: true }
                });
            });

            showNotification({
                type: 'error',
                message: 'Network error. Using original code.',
                duration: 4000
            });
        });

        setPendingCode('');
    }, [pendingCode, addBlock, updateBlock, screenToCanvas, showNotification]);

    // ============== STYLE CLEANUP UTILITY ==============
    const cleanupCapturedCode = useCallback((code: string): string => {
        console.log('🧹 Starting SMART cleanup - preserving colors...');
        console.log('📊 Original code length:', code.length, 'characters');
        
        let cleaned = code;
        
        // STEP 1: Extract IMPORTANT colors BEFORE removing (preserve the red background!)
        console.log('🎨 Extracting important colors before cleanup...');
        
        const extractedColors: Map<string, any> = new Map();
        
        // Extract backgroundColor (the red background!)
        const bgColorRegex = /backgroundColor:\s*"([^"]+)"/g;
        let bgMatch;
        while ((bgMatch = bgColorRegex.exec(code)) !== null) {
            const color = bgMatch[1];
            // Only preserve non-default colors (not white/transparent)
            if (color !== 'rgb(255, 255, 255)' && color !== 'transparent' && color !== 'rgba(0, 0, 0, 0)') {
                extractedColors.set('backgroundColor', color);
                console.log(`🎨 Extracted backgroundColor: ${color}`);
            }
        }
        
        // Extract text colors (white text on red background)
        const colorRegex = /color:\s*"(rgb\([^)]+\))"/g;
        let colorMatch;
        const textColors: string[] = [];
        while ((colorMatch = colorRegex.exec(code)) !== null) {
            const color = colorMatch[1];
            if (color === 'rgb(255, 255, 255)') {
                textColors.push(color);
                console.log(`🎨 Found white text: ${color}`);
            }
        }
        
        // Extract button background (yellow)
        const buttonBgRegex = /backgroundColor:\s*"rgb\(255,\s*203,\s*1\)"/;
        if (buttonBgRegex.test(code)) {
            extractedColors.set('buttonBg', 'rgb(255, 203, 1)');
            console.log('🎨 Found yellow button background');
        }
        
        // Extract background images
        let backgroundImageUrl = null;
        const bgImgMatch = code.match(/backgroundImage:\s*["']url\(['"]*([^'"()]+)['"]*\)["']/);
        if (bgImgMatch) {
            backgroundImageUrl = bgImgMatch[1];
            console.log('🖼️ Extracted background image:', backgroundImageUrl);
        }
        
        // STEP 2: Remove ALL inline style objects using PROPER BRACE MATCHING
        console.log('🗑️ Removing ALL bloated inline style objects...');
        const prevLength = cleaned.length;
        
        // Function to find and remove style={{...}} with proper brace matching
        function removeAllStyleObjects(str: string): string {
            let result = '';
            let i = 0;
            
            while (i < str.length) {
                // Look for " style={{"
                if (str.substring(i, i + 8) === ' style={{') {
                    // Found a style object, skip it entirely
                    i += 8; // Skip " style={{"
                    
                    let braceCount = 2; // Already have {{
                    
                    // Skip everything until we close both braces
                    while (i < str.length && braceCount > 0) {
                        if (str[i] === '{') braceCount++;
                        else if (str[i] === '}') braceCount--;
                        i++;
                    }
                    
                    // Successfully removed the style object
                    continue;
                }
                
                // Not a style object, keep the character
                result += str[i];
                i++;
            }
            
            return result;
        }
        
        cleaned = removeAllStyleObjects(cleaned);
        
        const removed = prevLength - cleaned.length;
        console.log(`   ✅ Removed ${removed} characters (${Math.round((removed/prevLength)*100)}% of code)`);
        console.log(`   ✅ New length: ${cleaned.length} characters`);
        
        // STEP 3: RE-ADD ONLY essential colors (minimal styles)
        console.log('✅ Re-adding ONLY essential styles...');
        
        // 1. Add RED BACKGROUND to section (the most important!)
        if (extractedColors.has('backgroundColor')) {
            const redBg = extractedColors.get('backgroundColor');
            cleaned = cleaned.replace(
                /<section className="([^"]*custom-collection-slider-section[^"]*)"/,
                `<section className="$1" style={{ backgroundColor: "${redBg}", padding: "50px" }}` 
            );
            console.log(`✅ Re-added red background: ${redBg}`);
        }
        
        // 2. Add WHITE text + padding to heading
        cleaned = cleaned.replace(
            /<h4 className="([^"]*section-title-2[^"]*)"/,
            '<h4 className="$1" style={{ color: "rgb(255, 255, 255)", backgroundColor: "rgb(214, 38, 65)", padding: "40px", textAlign: "center" }}'
        );
        
        // 3. Add WHITE text + large font to span in heading
        cleaned = cleaned.replace(
            /<span>([^<]*Protein Bars[^<]*)<\/span>/,
            '<span style={{ color: "rgb(255, 255, 255)", fontSize: "42px", fontFamily: "recoleta" }}>$1</span>'
        );
        
        // 4. Add WHITE text to ALL paragraphs
        // Handle both <p className="..."> and <p>
        cleaned = cleaned.replace(
            /<p>/g,
            '<p style={{ color: "rgb(255, 255, 255)" }}>'
        );
        cleaned = cleaned.replace(
            /<p className="([^"]*)"/g,
            '<p className="$1" style={{ color: "rgb(255, 255, 255)" }}'
        );
        
        // 5. Add WHITE text to ALL <b> tags
        cleaned = cleaned.replace(
            /<b>/g,
            '<b style={{ color: "rgb(255, 255, 255)" }}>'
        );
        
        // 6. Add YELLOW button styling
        cleaned = cleaned.replace(
            /<a href="([^"]*)">View All<\/a>/,
            '<a href="$1" style={{ backgroundColor: "rgb(255, 203, 1)", color: "rgb(53, 14, 4)", padding: "10px 40px", borderRadius: "6px", textDecoration: "none", display: "inline-block" }}>View All</a>'
        );
        
        // 7. Add background image if exists
        if (backgroundImageUrl && cleaned.includes('banner__content')) {
            cleaned = cleaned.replace(
                /className="([^"]*banner__content[^"]*?)"/,
                `className="$1" style={{ backgroundImage: "url('${backgroundImageUrl}')", backgroundSize: "cover", backgroundPosition: "center" }}`
            );
            console.log('✅ Re-added background image');
        }
        
        console.log('✅ Color re-addition complete!');
        
        // STEP 4: FALLBACK - If no specific patterns matched, add a wrapper with background
        if (extractedColors.has('backgroundColor') && !cleaned.includes('style={{')) {
            console.warn('⚠️ No specific patterns matched, adding fallback wrapper...');
            const redBg = extractedColors.get('backgroundColor');
            
            // Wrap the entire return content in a div with red background
            cleaned = cleaned.replace(
                /return \(\s*<>\s*/,
                `return (\n    <div style={{ backgroundColor: "${redBg}", minHeight: "200px", padding: "50px" }}>\n      <>`
            );
            cleaned = cleaned.replace(
                /<\/>\s*\);/,
                `</>\n    </div>\n  );`
            );
            console.log('✅ Added fallback wrapper with red background');
        }
        
        // STEP 5: Ensure component is properly structured
        if (!cleaned.includes('return')) {
            console.error('❌ Component has no return statement!');
        }
        
        console.log('✅ SMART Cleanup complete!');
        console.log('📊 Final code length:', cleaned.length, 'characters (was:', code.length, ')');
        console.log('📉 Reduced by:', removed, 'characters (' + Math.round((removed/code.length)*100) + '%)');
        console.log('🎨 Colors preserved: Red background, white text, yellow button');
        console.log('🚀 Component is now MUCH SMALLER and should render fast!');
        
        // Show first 500 chars of cleaned code for debugging
        if (cleaned.length > 500) {
            console.log('📝 First 500 chars of cleaned code:');
            console.log(cleaned.substring(0, 500) + '...');
        }
        
        return cleaned;
    }, []);

    // ============== PASTE HANDLER ==============
    const handlePaste = useCallback((e: ClipboardEvent) => {
        const text = e.clipboardData?.getData('text');
        if (!text) {
            console.log('❌ No text in clipboard');
            return;
        }

        const trimmed = text.trim();
        console.log('📋 Paste detected, length:', trimmed.length, 'chars');

        // PRIORITY 1: Check if it's READY React code from instant conversion
        // The extension now converts HTML→React instantly (no server needed!)
        if (trimmed.startsWith('import React from "react"') && 
            trimmed.includes('export default function Captured')) {
            e.preventDefault();
            e.stopPropagation();

            console.log('⚡ Instant React code detected! Cleaning up styles...');

            // Clean up the code to remove hidden elements and fix visibility
            const cleanedCode = cleanupCapturedCode(trimmed);

            // Show viewport selector modal with cleaned code
            setPendingCode(cleanedCode);
            setShowViewportSelector(true);
            return;
        }

        // PRIORITY 2: Check if it's raw capture data (fallback - older extension)
        let captureData = null;
        try {
            const parsed = JSON.parse(trimmed);
            if (parsed.type === 'grab-ai-capture' && parsed.version === '1.0') {
                captureData = parsed;
            }
        } catch (e) {
            // Not JSON, continue with normal flow
        }

        // Handle raw capture data from extension (fallback path)
        if (captureData) {
            e.preventDefault();
            e.stopPropagation();

            console.log('📦 Raw capture data detected, using server conversion');
            console.log('   Tag:', captureData.element?.tag);

            const canvasPos = screenToCanvas(lastMousePos.current.x, lastMousePos.current.y);
            const blockPos = { x: canvasPos.x - 300, y: canvasPos.y - 250 };

            // Show loading state - Direct conversion
            const loadingCode = `export default function Loading() {
  return (
    <div className="flex h-full flex-col items-center justify-center bg-gray-50 text-gray-400 font-mono text-sm space-y-3 animate-pulse">
      <div className="w-8 h-8 rounded-full border-2 border-gray-300 border-t-green-500 animate-spin" />
      <p>⚡ Converting to React...</p>
    </div>
  );
}`;

            const id = addBlock(loadingCode, blockPos);

            // Use DIRECT conversion (like htmltoreact.app - NO AI interpretation!)
            // This preserves exact styles and structure
            fetch('/api/convert/direct', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ captureData })
            })
                .then(res => res.json())
                .then(data => {
                    if (data.code) {
                        console.log('✅ Direct conversion successful!');
                        console.log('   Type:', data.conversionType);
                        updateBlock(id, {
                            code: data.code,
                            type: 'react',
                            metadata: {
                                generatedFrom: 'extension-capture-direct',
                                conversionType: data.conversionType || 'direct',
                                sourceUrl: captureData.sourceUrl,
                                capturedTag: captureData.element?.tag,
                                capturedAt: captureData.capturedAt,
                                styles: data.styles
                            }
                        });
                        showNotification({
                            type: 'success',
                            message: `✅ Direct conversion: ${captureData.element?.tag} → React (exact clone!)`,
                            duration: 3000
                        });
                    } else {
                        console.error('❌ Direct conversion failed:', data.error);
                        // Fallback: Show raw HTML with inline styles
                        const fallbackCode = `import React from "react";

export default function CapturedSection() {
  return (
    <div dangerouslySetInnerHTML={{ __html: \`${(captureData.element?.html || trimmed).replace(/`/g, '\\`')}\` }} />
  );
}`;
                        updateBlock(id, {
                            code: fallbackCode,
                            type: 'react'
                        });
                        showNotification({
                            type: 'warning',
                            message: 'Direct conversion failed. Using HTML fallback.',
                            duration: 4000
                        });
                    }
                })
                .catch(err => {
                    console.error('❌ Network error:', err);
                    // Fallback: Create basic React wrapper
                    const fallbackCode = `import React from "react";

export default function CapturedSection() {
  return (
    <div dangerouslySetInnerHTML={{ __html: \`${(captureData.element?.html || trimmed).replace(/`/g, '\\`')}\` }} />
  );
}`;
                    updateBlock(id, {
                        code: fallbackCode,
                        type: 'react'
                    });
                    showNotification({
                        type: 'error',
                        message: 'Network error. Using HTML fallback.',
                        duration: 4000
                    });
                });

            return; // Exit early after handling capture data
        }

        // Check if it looks like code (simple heuristic)
        const isCode =
            /<[a-z!/]/i.test(trimmed) ||
            /^(import|export|function|class|const|let|var)\b/m.test(trimmed) ||
            (trimmed.includes('=>') && trimmed.includes('{'));

        console.log('🔍 Is code?', isCode);
        if (!isCode) {
            console.log('⚠️ Not recognized as code, ignoring');
            return;
        }

        e.preventDefault();
        e.stopPropagation();

        console.log('🎯 Code paste detected');

        // Get position in canvas coordinates
        const canvasPos = screenToCanvas(lastMousePos.current.x, lastMousePos.current.y);
        const blockPos = { x: canvasPos.x - 300, y: canvasPos.y - 250 };
        console.log('📍 Canvas position:', canvasPos, '→ Block position:', blockPos);

        // Detect type using helper
        const type = detectCodeType(trimmed);
        console.log('📝 Detected type:', type);

        // If HTML, use AI to convert to React
        if (type === 'html') {
            const loadingCode = `export default function Loading() {
  return (
    <div className="flex h-full flex-col items-center justify-center bg-gray-50 text-gray-400 font-mono text-sm space-y-3 animate-pulse">
      <div className="w-8 h-8 rounded-full border-2 border-gray-300 border-t-blue-500 animate-spin" />
      <p>✨ Converting to React...</p>
    </div>
  );
}`;

            // Add loading block
            const id = addBlock(loadingCode, blockPos);

            // Trigger AI conversion
            fetch('/api/preview/chatgpt', {
                method: 'POST',
                body: JSON.stringify({ html: trimmed }),
                headers: { 'Content-Type': 'application/json' }
            })
                .then(res => res.json())
                .then(data => {
                    if (data.code) {
                        console.log('✨ AI Conversion success');
                        updateBlock(id, { code: data.code, type: 'react' });
                        // Analyze for keywords
                        fetch('/api/analyze', {
                            method: 'POST',
                            body: JSON.stringify({ code: data.code }),
                            headers: { 'Content-Type': 'application/json' }
                        })
                            .then(res => res.json())
                            .then(analysis => {
                                if (analysis.keywords) {
                                    updateBlock(id, { suggestedKeywords: analysis.keywords });
                                }
                            })
                            .catch(err => console.error('Analysis failed:', err));
                    } else {
                        console.error('AI Error:', data.error);
                        // Revert to HTML if failed
                        updateBlock(id, { code: trimmed, type: 'html' });
                    }
                })
                .catch(err => {
                    console.error('Network Error:', err);
                    updateBlock(id, { code: trimmed, type: 'html' });
                });
        } else if (type === 'react') {
            // It's already React code, just add it AND analyze it
            console.log('✅ Adding React block');
            const id = addBlock(trimmed, blockPos);
            console.log('✅ Block added with ID:', id);

            // Analyze for keywords
            fetch('/api/analyze', {
                method: 'POST',
                body: JSON.stringify({ code: trimmed }),
                headers: { 'Content-Type': 'application/json' }
            })
                .then(res => res.json())
                .then(analysis => {
                    if (analysis.keywords) {
                        updateBlock(id, { suggestedKeywords: analysis.keywords });
                    }
                })
                .catch(err => console.error('Analysis failed:', err));
        } else {
            // Plain text or unknown
            console.log('📄 Adding as plain text/vanilla');
            addBlock(text, blockPos);
        }
    }, [addBlock, updateBlock, screenToCanvas, cleanupCapturedCode]);

    // Track mouse position for paste placement AND update selection box
    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        lastMousePos.current = { x: e.clientX, y: e.clientY };

        if (isPanning()) {
            updatePan(e.clientX, e.clientY);
            return; // Stop processing other moves if panning
        }

        // Update selection box if active
        if (selectionBox) {
            const canvasPos = screenToCanvas(e.clientX, e.clientY);
            setSelectionBox(prev => prev ? { ...prev, currentX: canvasPos.x, currentY: canvasPos.y } : null);
        }
    }, [updatePan, isPanning, selectionBox, screenToCanvas]);

    // ============== PAN / SELECTION BOX HANDLERS ==============
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        // If Space is pressed, we ALWAYS start panning, regardless of target
        if (isSpacePressed) {
            startPan(e.clientX, e.clientY);
            isPanningState.current = true;
            return;
        }

        // Only start selection/pan if clicking on empty canvas (not a block)
        if (e.target === containerRef.current || (e.target as HTMLElement).closest('.canvas-layer')) {
            setSelectedBlockId(null);
            setSelectedBlockIds([]);

            // Start selection box (using canvas coordinates)
            const canvasPos = screenToCanvas(e.clientX, e.clientY);
            setSelectionBox({
                startX: canvasPos.x,
                startY: canvasPos.y,
                currentX: canvasPos.x,
                currentY: canvasPos.y,
            });
        }
    }, [setSelectedBlockId, setSelectedBlockIds, screenToCanvas, startPan, isSpacePressed]);

    const handleMouseUp = useCallback(() => {
        if (isPanningState.current) {
            endPan();
            isPanningState.current = false;
        }
        endPan(); // Ensure pan ends either way

        // If we have a selection box, find intersecting blocks
        if (selectionBox) {
            const minX = Math.min(selectionBox.startX, selectionBox.currentX);
            const maxX = Math.max(selectionBox.startX, selectionBox.currentX);
            const minY = Math.min(selectionBox.startY, selectionBox.currentY);
            const maxY = Math.max(selectionBox.startY, selectionBox.currentY);

            // Only select if the box has some size (not just a click)
            const boxWidth = maxX - minX;
            const boxHeight = maxY - minY;

            if (boxWidth > 5 || boxHeight > 5) {
                const intersecting = blocks.filter(block => {
                    // Check if block intersects with selection box
                    const blockRight = block.x + block.width;
                    const blockBottom = block.y + block.height;

                    return !(block.x > maxX || blockRight < minX || block.y > maxY || blockBottom < minY);
                });

                if (intersecting.length > 0) {
                    setSelectedBlockIds(intersecting.map(b => b.id));
                    // Also set single selection to first block for sidebar
                    if (intersecting.length === 1) {
                        setSelectedBlockId(intersecting[0].id);
                    }
                }
            }

            setSelectionBox(null);
        }
    }, [endPan, selectionBox, blocks, setSelectedBlockIds, setSelectedBlockId]);

    // ============== ZOOM HANDLER ==============
    const handleWheel = useCallback((e: React.WheelEvent) => {
        e.preventDefault();
        handleZoom(e.deltaY, e.clientX, e.clientY);
    }, [handleZoom]);

    // ============== CONTEXT MENU HANDLER ==============
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; type: 'canvas' | 'block'; blockId?: string } | null>(null);
    const [hasClipboardContent, setHasClipboardContent] = useState(false);

    // Check clipboard content when context menu opens
    const checkClipboard = useCallback(async () => {
        try {
            if (navigator.clipboard && navigator.clipboard.readText) {
                const text = await navigator.clipboard.readText();
                setHasClipboardContent(!!text && text.trim().length > 0);
            } else {
                setHasClipboardContent(false);
            }
        } catch (err) {
            // Permission denied or not available
            setHasClipboardContent(false);
        }
    }, []);

    const handleContextMenu = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        const target = e.target as HTMLElement;

        // Check clipboard content
        checkClipboard();

        // Check for block click
        const blockElement = target.closest('[data-block-id]');
        if (blockElement) {
            const blockId = blockElement.getAttribute('data-block-id') || undefined;
            setContextMenu({ x: e.clientX, y: e.clientY, type: 'block', blockId });
            if (blockId) setSelectedBlockId(blockId);
            return;
        }

        // Check if clicking on empty canvas or grid
        if (target === containerRef.current || target.closest('.canvas-layer')) {
            setContextMenu({ x: e.clientX, y: e.clientY, type: 'canvas' });
        } else {
            setContextMenu(null);
        }
    }, [setSelectedBlockId, checkClipboard]);

    // Close context menu on click anywhere
    const handleGlobalClick = useCallback(() => {
        if (contextMenu) setContextMenu(null);
    }, [contextMenu]);

    // ============== SHARE FUNCTIONALITY ==============
    const handleShare = useCallback(async () => {
        setIsShareModalOpen(true);
        setIsGeneratingLink(true);
        
        try {
            // Get current canvas state
            const state = getState();
            
            // Generate a unique share ID
            const shareId = `canvas-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            
            // Save to Supabase
            const { error } = await supabase
                .from('shared_canvas')
                .insert({
                    id: shareId,
                    data: state,
                    created_at: new Date().toISOString(),
                });
            
            if (error) {
                console.error('Share error:', error);
                showNotification({
                    type: 'error',
                    message: 'Failed to generate share link',
                    duration: 3000
                });
                setIsGeneratingLink(false);
                return;
            }
            
            // Generate shareable link
            const baseUrl = window.location.origin;
            const link = `${baseUrl}/shared/${shareId}`;
            setShareLink(link);
            setIsGeneratingLink(false);
            
            showNotification({
                type: 'success',
                message: '🔗 Share link generated!',
                duration: 2000
            });
            
        } catch (err) {
            console.error('Share error:', err);
            showNotification({
                type: 'error',
                message: 'Failed to generate share link',
                duration: 3000
            });
            setIsGeneratingLink(false);
        }
    }, [getState, showNotification]);

    // Copy share link to clipboard
    const handleCopyShareLink = useCallback(() => {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(shareLink)
                .then(() => {
                    showNotification({
                        type: 'success',
                        message: '✅ Link copied to clipboard!',
                        duration: 2000
                    });
                })
                .catch(() => {
                    showNotification({
                        type: 'error',
                        message: 'Failed to copy link',
                        duration: 2000
                    });
                });
        }
    }, [shareLink, showNotification]);

    // Handle code generated from screenshot
    const handleCodeGenerated = useCallback((data: {
        code: string;
        componentName: string;
        metadata: any;
    }) => {
        // Calculate center position on canvas
        const centerX = -viewport.x + (window.innerWidth / 2 / viewport.zoom) - 300;
        const centerY = -viewport.y + (window.innerHeight / 2 / viewport.zoom) - 200;
        
        // Add block with generated code
        const newBlockId = addBlock(data.code, { x: centerX, y: centerY });
        
        // Update with metadata
        updateBlock(newBlockId, {
            name: data.componentName,
            type: 'react',
            metadata: data.metadata
        });
        
        // Select and focus the new block
        setSelectedBlockId(newBlockId);
        
        // Show success notification
        showNotification({
            title: 'Component Generated!',
            message: `${data.metadata?.enhancements?.length || 0} enhancements applied`,
            type: 'success',
        });
    }, [viewport, addBlock, updateBlock, setSelectedBlockId, showNotification]);

    // Manual paste button handler with fallback
    const handleManualPaste = useCallback(async () => {
        try {
            // Check if clipboard API is available
            if (!navigator.clipboard || !navigator.clipboard.readText) {
                showNotification({
                    title: 'Use Ctrl+V Instead',
                    message: 'Click canvas and press Ctrl+V (or Cmd+V) to paste',
                    type: 'info',
                });
                return;
            }

            // Try to read from clipboard
            const text = await navigator.clipboard.readText();
            
            if (!text || text.trim().length === 0) {
                showNotification({
                    title: 'Clipboard Empty',
                    message: 'Copy code from Chrome extension first!',
                    type: 'error',
                });
                return;
            }

            // Trigger the existing paste handler by creating a synthetic paste event
            const fakeEvent = {
                preventDefault: () => {},
                stopPropagation: () => {},
                clipboardData: {
                    getData: (type: string) => type === 'text' ? text : ''
                }
            } as ClipboardEvent;
            
            handlePaste(fakeEvent);
            
            showNotification({
                title: 'Code Pasted!',
                message: 'Component added to canvas',
                type: 'success',
            });
            
        } catch (error: any) {
            console.error('Manual paste error:', error);
            
            // If clipboard permission denied, show helpful message
            if (error.name === 'NotAllowedError' || error.message?.includes('permission')) {
                showNotification({
                    title: 'Use Ctrl+V Instead',
                    message: 'Click canvas and press Ctrl+V (or Cmd+V) to paste',
                    type: 'info',
                });
            } else {
                showNotification({
                    title: 'Just Press Ctrl+V',
                    message: 'Use keyboard shortcut: Ctrl+V (Cmd+V on Mac)',
                    type: 'info',
                });
            }
        }
    }, [handlePaste, showNotification]);

    // Handle Action from context menu
    const handleContextMenuAction = useCallback((action: 'new' | 'delete' | 'duplicate' | 'copy' | 'refresh' | 'rename' | 'export' | 'paste') => {
        if (!contextMenu) return;

        const blockId = contextMenu.blockId;

        if (action === 'delete' && blockId) {
            removeBlock(blockId);
            setContextMenu(null);
            return;
        }

        if (action === 'duplicate' && blockId) {
            duplicateBlock(blockId);
            setContextMenu(null);
            return;
        }

        if (action === 'copy' && blockId) {
            const block = blocks.find(b => b.id === blockId);
            if (block && block.code) {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(block.code)
                        .then(() => console.log('Clipboard copy success'))
                        .catch(e => console.error('Clipboard failed', e));
                } else {
                    console.warn('Clipboard API not available');
                }
            }
            setContextMenu(null);
            return;
        }

        if (action === 'refresh' && blockId) {
            // Force update by setting a timestamp or toggling a dummy prop
            // For now, simpler: just close menu, user might use it to re-trigger something later
            setContextMenu(null);
            return;
        }

        if (action === 'paste') {
            // Store the context menu position before closing it
            const menuX = contextMenu.x;
            const menuY = contextMenu.y;
            setContextMenu(null);
            
            // Try to paste from clipboard
            if (navigator.clipboard && navigator.clipboard.readText) {
                navigator.clipboard.readText()
                    .then(text => {
                        if (text && text.trim()) {
                            console.log('📋 Context menu paste - clipboard has', text.length, 'characters');
                            console.log('📋 First 200 chars:', text.substring(0, 200));
                            
                            // Update last mouse position to context menu position
                            lastMousePos.current = { x: menuX, y: menuY };
                            
                            // Create synthetic paste event with all required methods
                            const fakeEvent = {
                                preventDefault: () => {},
                                stopPropagation: () => {},
                                clipboardData: {
                                    getData: (type: string) => type === 'text' ? text : ''
                                }
                            } as ClipboardEvent;
                            
                            // Call handlePaste - it will handle notifications internally
                            handlePaste(fakeEvent);
                            
                            // Only show success if it looks like code
                            const looksLikeCode = /<[a-z!/]/i.test(text.trim()) ||
                                /^(import|export|function|class|const|let|var)\b/m.test(text.trim()) ||
                                (text.includes('=>') && text.includes('{')) ||
                                text.trim().startsWith('import React') ||
                                text.includes('export default');
                            
                            if (looksLikeCode) {
                                showNotification({
                                    type: 'success',
                                    message: '✅ Code pasted at cursor position!',
                                    duration: 2000
                                });
                            } else {
                                showNotification({
                                    type: 'warning',
                                    message: '⚠️ Clipboard content may not be code',
                                    duration: 2000
                                });
                            }
                        } else {
                            showNotification({
                                type: 'error',
                                message: 'Clipboard is empty',
                                duration: 2000
                            });
                        }
                    })
                    .catch(err => {
                        console.error('Paste error:', err);
                        showNotification({
                            type: 'info',
                            message: 'Use Ctrl+V to paste instead',
                            duration: 2000
                        });
                    });
            } else {
                showNotification({
                    type: 'info',
                    message: 'Use Ctrl+V to paste',
                    duration: 2000
                });
            }
            return;
        }

        if (action === 'new') {
            const canvasPos = screenToCanvas(contextMenu.x, contextMenu.y);
            const blockPos = { x: canvasPos.x, y: canvasPos.y }; // Place exactly where clicked

            const defaultCode = `export default function Component() {
  return (
    <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col items-center text-center space-y-4">
      <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center text-xl font-bold">
        ✨
      </div>
      <div>
        <h2 className="text-xl font-bold text-gray-800">New Component</h2>
        <p className="text-gray-500 mt-1">Created from context menu!</p>
      </div>
      <button className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors">
        Action
      </button>
    </div>
  );
}`;
            addBlock(defaultCode, blockPos);
            setContextMenu(null);
        }

        // Catch-all for others for now
        setContextMenu(null);
    }, [contextMenu, screenToCanvas, addBlock, removeBlock, duplicateBlock, blocks, handlePaste, showNotification]);

    // Custom Mac Cursor Style (Black Arrow)
    const macCursorStyle = `url('data:image/svg+xml;utf8,<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5.5 2V19.5L9.75 15.25L13.5 23.5L16.5 22L12.5 14L19.5 14L5.5 2Z" fill="black" stroke="white" stroke-width="1.5"/></svg>') 2 2, default`;

    // ============== DOUBLE CLICK HANDLER ==============
    const handleDoubleClick = useCallback((e: React.MouseEvent) => {
        // Only trigger if clicking directly on canvas or grid
        if (e.target !== containerRef.current && !(e.target as HTMLElement).closest('.canvas-layer')) {
            return;
        }

        const canvasPos = screenToCanvas(e.clientX, e.clientY);
        // Center the new block around the click
        const blockPos = { x: canvasPos.x - 200, y: canvasPos.y - 150 };

        const defaultCode = `export default function Component() {
  return (
    <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col items-center text-center space-y-4">
      <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center text-xl font-bold">
        ✨
      </div>
      <div>
        <h2 className="text-xl font-bold text-gray-800">New Component</h2>
        <p className="text-gray-500 mt-1">Double-click to start building!</p>
      </div>
      <button className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors">
        Action
      </button>
    </div>
  );
}`;

        addBlock(defaultCode, blockPos);
    }, [addBlock, screenToCanvas]);

    // ============== SMART GUIDES & SNAPPING ==============
    const [guides, setGuides] = useState<{ x1: number, y1: number, x2: number, y2: number, label?: string, color?: string }[]>([]);

    const handleBlockUpdate = useCallback((id: string, updates: Partial<any>) => {
        // If not moving/resizing, just update
        if (updates.x === undefined && updates.y === undefined && updates.width === undefined && updates.height === undefined) {
            updateBlock(id, updates);
            return;
        }

        const activeBlock = blocks.find(b => b.id === id);
        if (!activeBlock) return;

        // Current candidate state
        let nextX = updates.x ?? activeBlock.x;
        let nextY = updates.y ?? activeBlock.y;
        const w = updates.width ?? activeBlock.width;
        const h = updates.height ?? activeBlock.height;

        const newGuides: { x1: number, y1: number, x2: number, y2: number, label?: string, color?: string }[] = [];
        const threshold = 5 / viewport.zoom; // Snapping distance
        const distanceThreshold = 50 / viewport.zoom; // Distance display threshold

        let snappedX = false;
        let snappedY = false;

        // Check against all other blocks
        for (const other of blocks) {
            if (other.id === id) continue;

            const check = (val1: number, val2: number) => Math.abs(val1 - val2) < threshold;

            // --- X-AXIS SNAPPING ---
            if (!snappedX && updates.x !== undefined) {
                // We align Left, Center, Right of Active to Left, Center, Right of Other
                const alignments = [
                    { v1: nextX, v2: other.x, type: 'left-left' }, // L-L
                    { v1: nextX, v2: other.x + other.width, type: 'left-right' }, // L-R
                    { v1: nextX + w, v2: other.x, type: 'right-left' }, // R-L
                    { v1: nextX + w, v2: other.x + other.width, type: 'right-right' }, // R-R
                    { v1: nextX + w / 2, v2: other.x + other.width / 2, type: 'center-center' }, // C-C
                ];

                for (const align of alignments) {
                    if (check(align.v1, align.v2)) {
                        const delta = align.v2 - align.v1;
                        nextX += delta; // Snap!
                        snappedX = true;

                        // Add Guide
                        const startY = Math.min(nextY, other.y) - 20;
                        const endY = Math.max(nextY + h, other.y + other.height) + 20;
                        newGuides.push({ x1: align.v2, y1: startY, x2: align.v2, y2: endY, color: '#ef4444' }); // Red for snap
                        break; // Only snap to one X line at a time
                    }
                }
            }

            // --- Y-AXIS SNAPPING ---
            if (!snappedY && updates.y !== undefined) {
                const alignments = [
                    { v1: nextY, v2: other.y, type: 'top-top' },
                    { v1: nextY, v2: other.y + other.height, type: 'top-bottom' },
                    { v1: nextY + h, v2: other.y, type: 'bottom-top' },
                    { v1: nextY + h, v2: other.y + other.height, type: 'bottom-bottom' },
                    { v1: nextY + h / 2, v2: other.y + other.height / 2, type: 'center-center' },
                ];

                for (const align of alignments) {
                    if (check(align.v1, align.v2)) {
                        const delta = align.v2 - align.v1;
                        nextY += delta; // Snap!
                        snappedY = true;

                        // Add Guide
                        const startX = Math.min(nextX, other.x) - 20;
                        const endX = Math.max(nextX + w, other.x + other.width) + 20;
                        newGuides.push({ x1: startX, y1: align.v2, x2: endX, y2: align.v2, color: '#ef4444' });
                        break;
                    }
                }
            }

            // --- DISTANCE GUIDES (GAPS) --- 
            // Show measurements when not strictly snapping but close, OR always show nearest gap?
            // Strategy: Check if object overlaps in one dimension, then show gap in the other.

            // 1. Horizontal Gaps (when vertically overlapping)
            // Vertical overlap check:
            const vertOverlap = Math.max(0, Math.min(nextY + h, other.y + other.height) - Math.max(nextY, other.y)) > 0;

            if (vertOverlap) {
                // Check Right Edge of Active -> Left Edge of Other
                const distRtoL = other.x - (nextX + w);

                // Smart Gap Snapping (if moving X)
                // Check if this gap matches other gaps? (Advanced) 
                // For now, simpler: visualization is key.

                if (distRtoL > 0 && distRtoL < 200) { // arbitrary max distance to show guide
                    const midY = nextY + h / 2;
                    newGuides.push({
                        x1: nextX + w, y1: midY,
                        x2: other.x, y2: midY,
                        label: `${Math.round(distRtoL)}`,
                        color: '#3b82f6' // Blue for distance
                    });
                }

                // Check Left Edge of Active -> Right Edge of Other
                const distLtoR = nextX - (other.x + other.width);
                if (distLtoR > 0 && distLtoR < 200) {
                    const midY = nextY + h / 2;
                    newGuides.push({
                        x1: other.x + other.width, y1: midY,
                        x2: nextX, y2: midY,
                        label: `${Math.round(distLtoR)}`,
                        color: '#3b82f6'
                    });
                }
            }

            // 2. Vertical Gaps (when horizontally overlapping)
            // Horizontal overlap check:
            const horizOverlap = Math.max(0, Math.min(nextX + w, other.x + other.width) - Math.max(nextX, other.x)) > 0;

            if (horizOverlap) {
                // Bottom of Active -> Top of Other
                const distBtoT = other.y - (nextY + h);
                if (distBtoT > 0 && distBtoT < 200) {
                    const midX = nextX + w / 2;
                    newGuides.push({
                        x1: midX, y1: nextY + h,
                        x2: midX, y2: other.y,
                        label: `${Math.round(distBtoT)}`,
                        color: '#3b82f6'
                    });
                }

                // Top of Active -> Bottom of Other
                const distTtoB = nextY - (other.y + other.height);
                if (distTtoB > 0 && distTtoB < 200) {
                    const midX = nextX + w / 2;
                    newGuides.push({
                        x1: midX, y1: other.y + other.height,
                        x2: midX, y2: nextY,
                        label: `${Math.round(distTtoB)}`,
                        color: '#3b82f6'
                    });
                }
            }

            // --- SIZE SNAPPING (Width/Height) ---
            const isResizing = updates.width !== undefined || updates.height !== undefined;

            if (isResizing) {
                // Snap Width
                if (updates.width !== undefined && Math.abs(w - other.width) < threshold) {
                    const snappedWidth = other.width;
                    // Adjust based on which "side" might be resizing? 
                    // Without resize-handle context, we assume simpler width override.
                    // If user drags Right Handle: X stays, W changes.
                    // If user drags Left Handle: X moves, W changes.
                    // CodeBlock updates X/W correctly. If we override W, we might need to adjust X if left-resizing?
                    // Heuristic: If X changed significantly, assume Left Resize.
                    const xChanged = Math.abs(nextX - activeBlock.x) > 1;

                    if (xChanged) {
                        // Resizing Left: Keep Right Edge constant
                        const currentRight = nextX + w;
                        nextX = currentRight - snappedWidth;
                    }
                    // Else Resizing Right: X is constant.

                    Object.assign(updates, { width: snappedWidth }); // Mutate updates for final call
                    // Guide
                    newGuides.push({
                        x1: nextX, y1: nextY - 15,
                        x2: nextX + snappedWidth, y2: nextY - 15,
                        label: `W: ${Math.round(snappedWidth)}`,
                        color: '#10b981' // Green for size match
                    });
                    // Vertical indicators
                    newGuides.push({ x1: nextX, y1: other.y, x2: nextX, y2: other.y + other.height, color: '#10b981' });
                    newGuides.push({ x1: nextX + snappedWidth, y1: other.y, x2: nextX + snappedWidth, y2: other.y + other.height, color: '#10b981' });
                }

                // Snap Height
                if (updates.height !== undefined && Math.abs(h - other.height) < threshold) {
                    const snappedHeight = other.height;
                    const yChanged = Math.abs(nextY - activeBlock.y) > 1;

                    if (yChanged) {
                        // Resizing Top
                        const currentBottom = nextY + h;
                        nextY = currentBottom - snappedHeight;
                    }

                    Object.assign(updates, { height: snappedHeight });
                    newGuides.push({
                        x1: nextX - 15, y1: nextY,
                        x2: nextX - 15, y2: nextY + snappedHeight,
                        label: `H: ${Math.round(snappedHeight)}`,
                        color: '#10b981'
                    });
                    // Horizontal indicators
                    newGuides.push({ x1: other.x, y1: nextY, x2: other.x + other.width, y2: nextY, color: '#10b981' });
                    newGuides.push({ x1: other.x, y1: nextY + snappedHeight, x2: other.x + other.width, y2: nextY + snappedHeight, color: '#10b981' });
                }
            }
        }

        setGuides(newGuides);
        updateBlock(id, { ...updates, x: nextX, y: nextY });

    }, [blocks, updateBlock, viewport.zoom]);

    // Clear guides on mouse up
    useEffect(() => {
        const handleGlobalMouseUp = () => setGuides([]);
        window.addEventListener('mouseup', handleGlobalMouseUp);
        return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
    }, []);

    // ============== EXTENSION INTEGRATION - Poll for new components ==============
    useEffect(() => {
        let pollInterval: NodeJS.Timeout;
        
        const pollForComponents = async () => {
            try {
                const response = await fetch('/api/capture/from-extension?action=poll');
                if (response.ok) {
                    const data = await response.json();
                    
                    if (data.components && data.components.length > 0) {
                        console.log(`📥 Received ${data.components.length} component(s) from extension`);
                        
                        // Add each component to canvas
                        data.components.forEach((component: any, index: number) => {
                            // Position components in a cascade pattern
                            const offsetX = 100 + (index * 50);
                            const offsetY = 100 + (index * 50);
                            
                            // Add block and then update with additional properties
                            const blockId = addBlock(component.code, { x: offsetX, y: offsetY });
                            
                            // Update with custom dimensions and metadata
                            updateBlock(blockId, {
                                width: 600,
                                height: 400,
                                name: component.componentName || `Component ${index + 1}`,
                                metadata: {
                                    generatedFrom: 'extension-capture',
                                    componentName: component.componentName,
                                    ...component.metadata
                                }
                            });
                            
                            showNotification({
                                type: 'success',
                                title: 'Component Added',
                                message: `✅ ${component.componentName} added from extension!`,
                                duration: 4000
                            });
                        });
                    }
                }
            } catch (error) {
                // Silently fail - extension might not be active
                console.log('Extension polling skipped (app may be offline)');
            }
        };
        
        // Poll every 2 seconds when tab is active
        if (document.visibilityState === 'visible') {
            pollInterval = setInterval(pollForComponents, 2000);
        }
        
        // Handle visibility changes
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                pollInterval = setInterval(pollForComponents, 2000);
            } else {
                clearInterval(pollInterval);
            }
        };
        
        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        return () => {
            clearInterval(pollInterval);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [addBlock, showNotification]);

    // ============== KEYBOARD SHORTCUTS ==============
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Delete selected block
            if ((e.key === 'Delete' || e.key === 'Backspace') && selectedBlockId) {
                if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
                    removeBlock(selectedBlockId);
                }
            }

            // Duplicate (Ctrl+D)
            if ((e.ctrlKey || e.metaKey) && (e.key === 'd' || e.key === 'D')) {
                e.preventDefault();
                // Prevent browser bookmark dialog
                e.stopPropagation();

                if (selectedBlockId) {
                    const currentBlocks = blocks; // Use blocks from hook directly, simpler than getState if available
                    const sourceBlock = currentBlocks.find(b => b.id === selectedBlockId);

                    if (sourceBlock) {
                        // Offset by 20px
                        const newPos = { x: sourceBlock.x + 20, y: sourceBlock.y + 20 };
                        const newId = addBlock(sourceBlock.code, newPos);

                        // Copy other properties (dimensions, type)
                        updateBlock(newId, {
                            width: sourceBlock.width,
                            height: sourceBlock.height,
                            type: sourceBlock.type
                        });

                        // Select the new block
                        setSelectedBlockId(newId);
                    }
                }
            }

            // Escape to deselect
            if (e.key === 'Escape') {
                setSelectedBlockId(null);
                setContextMenu(null);
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                setIsSpacePressed(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [selectedBlockId, removeBlock, setSelectedBlockId, addBlock, updateBlock, blocks]);

    // Separate effect for spacebar to ensure responsiveness and avoid stale closures for other keys
    useEffect(() => {
        const handleSpaceDown = (e: KeyboardEvent) => {
            if (e.code === 'Space' && !e.repeat) {
                // If user is typing in an input, ignore space
                if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
                    return;
                }
                e.preventDefault(); // Prevent scrolling
                setIsSpacePressed(true);
            }
        };
        window.addEventListener('keydown', handleSpaceDown);
        return () => window.removeEventListener('keydown', handleSpaceDown);
    }, []);

    // Keyboard shortcut: Cmd/Ctrl + U for screenshot upload
    useEffect(() => {
        const handleUploadShortcut = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'u') {
                e.preventDefault();
                setIsUploadModalOpen(true);
            }
        };
        window.addEventListener('keydown', handleUploadShortcut);
        return () => {
            window.removeEventListener('keydown', handleUploadShortcut);
        };
    }, []);

    // ============== PASTE LISTENER ==============
    useEffect(() => {
        window.addEventListener('paste', handlePaste, { capture: true });
        return () => window.removeEventListener('paste', handlePaste, { capture: true });
    }, [handlePaste]);

    // ============== CLIPBOARD MONITORING ==============
    useEffect(() => {
        // Check clipboard when user copies something
        const handleCopy = () => {
            setTimeout(() => checkClipboard(), 100); // Small delay to ensure clipboard is updated
        };

        const handleCut = () => {
            setTimeout(() => checkClipboard(), 100);
        };

        // Check clipboard when window gains focus (user might have copied elsewhere)
        const handleFocus = () => {
            checkClipboard();
        };

        window.addEventListener('copy', handleCopy);
        window.addEventListener('cut', handleCut);
        window.addEventListener('focus', handleFocus);

        // Initial check
        checkClipboard();

        return () => {
            window.removeEventListener('copy', handleCopy);
            window.removeEventListener('cut', handleCut);
            window.removeEventListener('focus', handleFocus);
        };
    }, [checkClipboard]);

    // ============== SUPABASE SYNC ==============
    useEffect(() => {
        const syncToSupabase = throttle(async () => {
            const state = getState();
            if (state.blocks.length === 0) return;

            console.log('💾 Saving to Supabase...');
            try {
                const { error } = await supabase
                    .from('canvas_data')
                    .upsert({
                        id: 'main-board-v2',
                        data: state,
                        updated_at: new Date().toISOString(),
                    });
                if (error) console.error('Supabase error:', error);
            } catch (e) {
                console.error('Sync failed:', e);
            }
        }, 3000, { leading: false, trailing: true });

        syncToSupabase();

        return () => syncToSupabase.cancel();
    }, [blocks, viewport, getState]);

    // Load state on mount
    useEffect(() => {
        const loadFromSupabase = async () => {
            try {
                const { data, error } = await supabase
                    .from('canvas_data')
                    .select('data')
                    .eq('id', 'main-board-v2')
                    .single();

                if (data?.data) {
                    console.log('📂 Loaded canvas state from Supabase');
                    loadState(data.data);
                }
            } catch (e) {
                console.log('No saved state found, starting fresh');
            }
        };

        loadFromSupabase();
    }, [loadState]);

    // Detect OS for shortcuts
    const [isMac, setIsMac] = useState(true);
    useEffect(() => {
        setIsMac(navigator.platform.toUpperCase().indexOf('MAC') >= 0);
    }, []);

    const cmdKey = isMac ? '⌘' : 'Ctrl+';

    // Dynamic cursor
    const cursorStyle = isSpacePressed
        ? (isPanning() ? 'grabbing' : 'grab')
        : (activeTool === 'cursor' ? macCursorStyle : 'crosshair');

    return (
        <div
            className="fixed inset-0 flex flex-col"
            style={{
                backgroundColor: '#f5f5f5',
                cursor: cursorStyle
            }}
        >
            {/* Panning Overlay to block interactions when space is held */}
            {isSpacePressed && (
                <div className="absolute inset-0 z-[60]" style={{ cursor: cursorStyle }} />
            )}

            {/* ============== TOP TOOLBAR ============== */}
            <header className="h-12 flex items-center justify-between px-4 bg-white border-b border-gray-200 z-50 shrink-0">
                {/* Left: Logo & Themes */}
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-gray-900 rounded flex items-center justify-center">
                            <span className="text-white text-xs font-bold">IC</span>
                        </div>
                    </div>
                    <button className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
                        Themes
                    </button>
                </div>

                {/* Right: Import & Share */}
                <div className="flex items-center gap-2">
                    <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md transition-colors">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M5.5 21a2.5 2.5 0 01-2.5-2.5V5.5A2.5 2.5 0 015.5 3h13A2.5 2.5 0 0121 5.5v7h-2v-7a.5.5 0 00-.5-.5h-13a.5.5 0 00-.5.5v13c0 .28.22.5.5.5h7v2h-7z" />
                        </svg>
                        Import from Figma
                    </button>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md transition-colors">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="2" y1="12" x2="22" y2="12" />
                            <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 014-10z" />
                        </svg>
                        Import from web
                    </button>
                    <button 
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors"
                        onClick={handleShare}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
                            <polyline points="16 6 12 2 8 6" />
                            <line x1="12" y1="2" x2="12" y2="15" />
                        </svg>
                        Share
                    </button>
                </div>
            </header>

            {/* CONTEXT MENU */}
            {contextMenu && (
                <div
                    className="absolute bg-white rounded-lg shadow-xl border border-gray-200 py-1.5 z-[100] animate-in fade-in zoom-in-95 duration-100 min-w-[160px]"
                    style={{ left: contextMenu.x, top: contextMenu.y }}
                >
                    {contextMenu.type === 'canvas' ? (
                        <>
                            <button
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 flex items-center gap-2"
                                onClick={() => handleContextMenuAction('new')}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                    <line x1="12" y1="8" x2="12" y2="16" />
                                    <line x1="8" y1="12" x2="16" y2="12" />
                                </svg>
                                New Component
                            </button>
                            <button
                                className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${
                                    hasClipboardContent 
                                        ? 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 cursor-pointer' 
                                        : 'text-gray-300 cursor-not-allowed opacity-50'
                                }`}
                                onClick={() => hasClipboardContent && handleContextMenuAction('paste')}
                                disabled={!hasClipboardContent}
                                title={hasClipboardContent ? 'Paste from clipboard' : 'Clipboard is empty'}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
                                    <path d="M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                                <span>Paste</span>
                                {!hasClipboardContent && (
                                    <span className="text-xs ml-auto">(empty)</span>
                                )}
                            </button>
                        </>
                    ) : (
                        <div className="flex flex-col">
                            <button
                                className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center justify-between group"
                                onClick={() => handleContextMenuAction('refresh')}
                            >
                                <span className="flex items-center gap-2">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 4v6h-6" /><path d="M1 20v-6h6" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></svg>
                                    Refresh
                                </span>
                                <span className="text-xs text-gray-400 group-hover:text-blue-400">{cmdKey}R</span>
                            </button>
                            <button
                                className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center justify-between group"
                                onClick={() => handleContextMenuAction('rename')}
                            >
                                <span className="flex items-center gap-2">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                    Rename
                                </span>
                            </button>

                            <div className="h-[1px] bg-gray-100 my-1.5" />

                            <button
                                className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center justify-between group"
                                onClick={() => handleContextMenuAction('copy')}
                            >
                                <span className="flex items-center gap-2">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                                    Copy
                                </span>
                                <span className="text-xs text-gray-400 group-hover:text-blue-400">{cmdKey}C</span>
                            </button>
                            <button
                                className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center justify-between group"
                                onClick={() => handleContextMenuAction('duplicate')}
                            >
                                <span className="flex items-center gap-2">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                                    Duplicate
                                </span>
                                <span className="text-xs text-gray-400 group-hover:text-blue-400">{cmdKey}D</span>
                            </button>

                            <div className="h-[1px] bg-gray-100 my-1.5" />

                            <button
                                className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center justify-between group"
                                onClick={() => handleContextMenuAction('export')}
                            >
                                <span className="flex items-center gap-2">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                                    Export as image
                                </span>
                            </button>

                            <div className="h-[1px] bg-gray-100 my-1.5" />

                            <button
                                className="w-full text-left px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 flex items-center justify-between group"
                                onClick={() => handleContextMenuAction('delete')}
                            >
                                <span className="flex items-center gap-2">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                                    Delete
                                </span>
                                <span className="text-xs text-red-300 group-hover:text-red-500">⌫</span>
                            </button>
                        </div>
                    )}
                </div>
            )}
            {/* ============== MAIN CONTENT (Canvas + Sidebar) ============== */}
            <div className="flex-1 flex overflow-hidden relative">

                {/* ============== CANVAS AREA ============== */}
                <div
                    ref={containerRef}
                    className={`w-full h-full bg-gray-50 relative overflow-hidden select-none`}
                    style={{
                        cursor: activeTool === 'cursor' ? macCursorStyle : 'crosshair',
                    }}
                    onMouseDown={(e) => {
                        handleGlobalClick();
                        handleMouseDown(e);
                    }}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onWheel={handleWheel}
                    onDoubleClick={handleDoubleClick}
                    onContextMenu={handleContextMenu}
                >
                    {/* Subtle dot grid background */}
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
                        {/* Render all blocks */}
                        {blocks.map((block) => (
                            <CodeBlock
                                key={block.id}
                                block={block}
                                isSelected={selectedBlockId === block.id || selectedBlockIds.includes(block.id)}
                                zoom={viewport.zoom}
                                onSelect={() => {
                                    setSelectedBlockId(block.id);
                                    // Initialize group drag if multi-selected
                                    if (selectedBlockIds.includes(block.id)) {
                                        handleGroupDragStart();
                                    }
                                }}
                                onUpdate={(updates) => handleBlockUpdate(block.id, updates)}
                                onRemove={() => removeBlock(block.id)}
                                selectedBlockIds={selectedBlockIds}
                                onGroupMove={handleGroupMove}
                                onDuplicate={() => duplicateBlock(block.id)}
                            />
                        ))}

                        {/* GUIDES OVERLAY (SVG) */}
                        <svg className="absolute inset-0 pointer-events-none overflow-visible" style={{ zIndex: 100 }}>
                            {guides.map((guide, i) => (
                                <g key={i}>
                                    <line
                                        x1={guide.x1}
                                        y1={guide.y1}
                                        x2={guide.x2}
                                        y2={guide.y2}
                                        stroke={guide.color || "red"}
                                        strokeWidth={1 / viewport.zoom}
                                        strokeDasharray={`${4 / viewport.zoom} ${2 / viewport.zoom}`}
                                    />
                                    {guide.label && (
                                        <g>
                                            <rect
                                                x={(guide.x1 + guide.x2) / 2 - 14 / viewport.zoom}
                                                y={(guide.y1 + guide.y2) / 2 - 8 / viewport.zoom}
                                                width={28 / viewport.zoom}
                                                height={16 / viewport.zoom}
                                                fill={guide.color || "#3b82f6"}
                                                rx={4 / viewport.zoom}
                                            />
                                            <text
                                                x={(guide.x1 + guide.x2) / 2}
                                                y={(guide.y1 + guide.y2) / 2}
                                                fill="white"
                                                fontSize={10 / viewport.zoom}
                                                textAnchor="middle"
                                                dominantBaseline="middle"
                                                fontWeight="bold"
                                            >
                                                {guide.label}
                                            </text>
                                        </g>
                                    )}
                                </g>
                            ))}

                            {/* SELECTION BOX */}
                            {selectionBox && (
                                <rect
                                    x={Math.min(selectionBox.startX, selectionBox.currentX)}
                                    y={Math.min(selectionBox.startY, selectionBox.currentY)}
                                    width={Math.abs(selectionBox.currentX - selectionBox.startX)}
                                    height={Math.abs(selectionBox.currentY - selectionBox.startY)}
                                    fill="rgba(59, 130, 246, 0.1)"
                                    stroke="#3b82f6"
                                    strokeWidth={1 / viewport.zoom}
                                    strokeDasharray={`${4 / viewport.zoom} ${2 / viewport.zoom}`}
                                />
                            )}
                        </svg>
                    </div>

                    {/* Instructions overlay (when empty) */}
                    {blocks.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="text-center space-y-3">
                                <div className="w-20 h-20 mx-auto rounded-2xl bg-white shadow-lg flex items-center justify-center border border-gray-200">
                                    <span className="text-3xl">📋</span>
                                </div>
                                <div className="text-gray-500 space-y-1">
                                    <p className="text-lg font-medium text-gray-700">Paste code to get started</p>
                                    <p className="text-sm">HTML, CSS, JavaScript, or React components</p>
                                    <p className="text-xs text-gray-400 mt-2">Ctrl+V anywhere on canvas</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* ============== BOTTOM TOOLBAR ============== */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50">
                    <div className="flex items-center gap-2 px-2 py-2 bg-white rounded-2xl shadow-xl border border-gray-100">
                        {[
                            { id: 'cursor', icon: Icons.cursor, label: 'Select' },
                            { id: 'square', icon: Icons.square, label: 'Rectangle' },
                            { id: 'circle', icon: Icons.circle, label: 'Ellipse' },
                            { id: 'line', icon: Icons.line, label: 'Line' },
                            { id: 'pen', icon: Icons.pen, label: 'Draw' },
                            { id: 'text', icon: Icons.text, label: 'Text' },
                        ].map((tool) => (
                            <button
                                key={tool.id}
                                onClick={() => setActiveTool(tool.id)}
                                className={`
                                w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200
                                ${activeTool === tool.id
                                        ? 'bg-emerald-500 text-white shadow-md scale-105'
                                        : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}
                            `}
                                title={tool.label}
                            >
                                {tool.icon}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ============== ZOOM CONTROLS ============== */}
                <div className="absolute bottom-6 left-4 flex items-center gap-2 z-50">
                    <button
                        onClick={() => handleZoom(100, window.innerWidth / 2, window.innerHeight / 2)}
                        className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow border border-gray-200 text-gray-600 hover:bg-gray-50 text-lg"
                    >
                        −
                    </button>
                    <div className="px-2 py-1 bg-white rounded-lg shadow border border-gray-200 text-sm text-gray-600 font-medium min-w-[50px] text-center">
                        {Math.round(viewport.zoom * 100)}%
                    </div>
                    <button
                        onClick={() => handleZoom(-100, window.innerWidth / 2, window.innerHeight / 2)}
                        className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow border border-gray-200 text-gray-600 hover:bg-gray-50 text-lg"
                    >
                        +
                    </button>
                    <button
                        className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow border border-gray-200 text-gray-600 hover:bg-gray-50"
                        title="Fit to screen"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3" />
                        </svg>
                    </button>
                </div>

                {/* ============== RIGHT SIDEBAR (Collapsible) ============== */}
                <div
                    className={`h-full transition-all duration-300 ease-in-out overflow-hidden shrink-0 ${selectedBlockId ? 'w-[340px] opacity-100' : 'w-0 opacity-0'
                        }`}
                >
                    <RightSidebar
                        selectedBlock={blocks.find(b => b.id === selectedBlockId) || null}
                        onUpdateBlock={(updates) => selectedBlockId && updateBlock(selectedBlockId, updates)}
                    />
                </div>
            </div>

                {/* Screenshot Upload Modal */}
                <ImageUploadModal
                    isOpen={isUploadModalOpen}
                    onClose={() => setIsUploadModalOpen(false)}
                    onCodeGenerated={handleCodeGenerated}
                />

                {showViewportSelector && (
                    <ViewportSelector
                        onConfirm={generateViewportVariants}
                        onCancel={() => {
                            setShowViewportSelector(false);
                            setPendingCode('');
                        }}
                    />
                )}

                {/* Share Modal */}
                {isShareModalOpen && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center animate-in fade-in duration-200">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-6 animate-in zoom-in-95 duration-200">
                            {/* Header */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-600">
                                            <circle cx="18" cy="5" r="3" />
                                            <circle cx="6" cy="12" r="3" />
                                            <circle cx="18" cy="19" r="3" />
                                            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                                            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900">Share Canvas</h2>
                                        <p className="text-sm text-gray-500">Anyone with the link can view</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setIsShareModalOpen(false);
                                        setShareLink('');
                                    }}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="18" y1="6" x2="6" y2="18" />
                                        <line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </button>
                            </div>

                            {/* Content */}
                            {isGeneratingLink ? (
                                <div className="flex flex-col items-center justify-center py-8 space-y-4">
                                    <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
                                    <p className="text-sm text-gray-500 font-medium">Generating share link...</p>
                                </div>
                            ) : shareLink ? (
                                <>
                                    {/* Link Preview */}
                                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
                                        <div className="flex items-center gap-2">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
                                                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                                                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                                            </svg>
                                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Share Link</span>
                                        </div>
                                        <div className="bg-white border border-gray-200 rounded-lg p-3 font-mono text-sm text-gray-700 break-all">
                                            {shareLink}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-3">
                                        <button
                                            onClick={handleCopyShareLink}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium"
                                        >
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                            </svg>
                                            Copy Link
                                        </button>
                                        <button
                                            onClick={() => window.open(shareLink, '_blank')}
                                            className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                                            title="Open in new tab"
                                        >
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                                <polyline points="15 3 21 3 21 9" />
                                                <line x1="10" y1="14" x2="21" y2="3" />
                                            </svg>
                                        </button>
                                    </div>

                                    {/* Info */}
                                    <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600 mt-0.5 flex-shrink-0">
                                            <circle cx="12" cy="12" r="10" />
                                            <line x1="12" y1="16" x2="12" y2="12" />
                                            <line x1="12" y1="8" x2="12.01" y2="8" />
                                        </svg>
                                        <p className="text-xs text-blue-700 leading-relaxed">
                                            This link will remain active and anyone with it can view your canvas. All components and their code will be visible.
                                        </p>
                                    </div>
                                </>
                            ) : null}
                        </div>
                    </div>
                )}

                {/* Floating Action Buttons */}
                <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-50">
                    {/* Paste from Clipboard Button */}
                    <button
                        onClick={handleManualPaste}
                        className="w-14 h-14 bg-green-500 text-white rounded-full shadow-lg hover:bg-green-600 active:scale-95 transition-all flex items-center justify-center group relative"
                        title="Paste Code (or just press Ctrl+V)"
                        aria-label="Paste code from clipboard"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <span className="absolute right-16 bg-gray-900 text-white text-xs px-3 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                            💡 Just press Ctrl+V!
                        </span>
                    </button>
                    
                    {/* Screenshot Upload Button */}
                    <button
                        onClick={() => setIsUploadModalOpen(true)}
                        className="w-14 h-14 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 active:scale-95 transition-all flex items-center justify-center group relative"
                        title="Upload Screenshot (Cmd/Ctrl + U)"
                        aria-label="Upload screenshot to generate component"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="absolute right-16 bg-gray-900 text-white text-xs px-3 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                            Screenshot (Ctrl+U)
                        </span>
                    </button>
                </div>

            {/* Notification Container */}
            <NotificationContainer notifications={notifications} onRemove={removeNotification} />
        </div>
    );
}

export default memo(CanvasContainer);
