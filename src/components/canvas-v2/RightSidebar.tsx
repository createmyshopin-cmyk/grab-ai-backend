'use client';

import React, { useState, useCallback } from 'react';
import { Block } from './types';
import ComponentInfo from './ComponentInfo';

interface RightSidebarProps {
    selectedBlock: Block | null;
    onUpdateBlock: (updates: Partial<Block>) => void;
}

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export default function RightSidebar({ selectedBlock, onUpdateBlock }: RightSidebarProps) {
    const [activeTab, setActiveTab] = useState('Chat');
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    const handleSendMessage = useCallback(async () => {
        if (!input.trim() || !selectedBlock || isLoading) return;

        const userMessage = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setIsLoading(true);

        try {
            const response = await fetch('/api/edit/component', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code: selectedBlock.code,
                    instruction: userMessage,
                }),
            });

            const data = await response.json();

            if (data.error) {
                setMessages(prev => [...prev, { role: 'assistant', content: `❌ Error: ${data.error}` }]);
            } else if (data.code) {
                // Update the block with new code
                onUpdateBlock({ code: data.code });
                setMessages(prev => [...prev, { role: 'assistant', content: '✅ Component updated successfully!' }]);
            }
        } catch (error: any) {
            setMessages(prev => [...prev, { role: 'assistant', content: `❌ Error: ${error.message}` }]);
        } finally {
            setIsLoading(false);
        }
    }, [input, selectedBlock, isLoading, onUpdateBlock]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleShopifyExport = useCallback(async () => {
        if (!selectedBlock || isExporting) return;

        setIsExporting(true);

        try {
            const response = await fetch('/api/export/shopify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code: selectedBlock.code,
                    componentName: selectedBlock.name || 'component',
                }),
            });

            const data = await response.json();

            if (data.error) {
                alert(`Export failed: ${data.error}`);
                return;
            }

            // Trigger file download
            const blob = new Blob([data.liquidCode], { type: 'text/plain' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = data.filename || 'section.liquid';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            // Show success message
            setMessages(prev => [...prev, { 
                role: 'assistant', 
                content: `✅ Exported as ${data.filename}! Upload to your theme's sections/ folder.` 
            }]);
        } catch (error: any) {
            alert(`Export failed: ${error.message}`);
        } finally {
            setIsExporting(false);
        }
    }, [selectedBlock, isExporting]);

    return (
        <div className="w-[340px] h-full bg-white border-l border-gray-200 flex flex-col shadow-sm z-50 shrink-0">
            {/* HEADER */}
            <div className="h-14 border-b border-gray-100 flex items-center justify-between px-4">
                <h2 className="text-sm font-semibold text-gray-800">
                    {selectedBlock?.name || 'Edit Component'}
                </h2>
                <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded uppercase tracking-wide">
                    AI
                </span>
            </div>

            {/* TABS */}
            <div className="flex items-center justify-between px-4 border-b border-gray-100">
                <div className="flex items-center">
                    {['Chat', 'Code', ...(selectedBlock?.metadata ? ['Info'] : [])].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`py-3 mr-6 text-sm font-medium border-b-2 transition-colors ${activeTab === tab
                                ? 'border-black text-black'
                                : 'border-transparent text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
                
                {/* Shopify Export Button */}
                <button
                    onClick={handleShopifyExport}
                    className={`px-3 py-1.5 text-white text-xs font-medium rounded-lg transition-colors shadow-sm flex items-center gap-1.5 ${
                        isExporting
                            ? 'bg-emerald-400 cursor-wait'
                            : 'bg-emerald-500 hover:bg-emerald-600'
                    }`}
                    disabled={!selectedBlock || isExporting}
                    title="Export component as Shopify Liquid section"
                >
                    {isExporting ? (
                        <>
                            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Converting...
                        </>
                    ) : (
                        <>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="7 10 12 15 17 10" />
                                <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                            Shopify
                        </>
                    )}
                </button>
            </div>

            {/* CONTENT AREA */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col">
                {activeTab === 'Chat' && (
                    <>
                        {messages.length === 0 ? (
                            /* Empty State */
                            <div className="flex-1 flex flex-col items-center justify-center text-center">
                                <div className="w-16 h-16 mb-4 text-emerald-800">
                                    <svg viewBox="0 0 100 100" fill="currentColor" className="drop-shadow-sm">
                                        <path d="M20 30 Q 30 10, 50 30 T 80 30" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
                                        <rect x="55" y="55" width="25" height="25" rx="4" stroke="currentColor" strokeWidth="8" fill="none" transform="rotate(15 67.5 67.5)" />
                                        <circle cx="35" cy="65" r="12" stroke="currentColor" strokeWidth="8" fill="none" />
                                    </svg>
                                </div>

                                <h3 className="text-gray-900 font-medium mb-2">What should we edit?</h3>
                                <p className="text-gray-400 text-xs max-w-[200px] mb-6">
                                    Describe changes in plain English. I'll modify your component.
                                </p>

                                {/* Suggestion Chips */}
                                <div className="flex flex-col gap-2 w-full px-2">
                                    {(selectedBlock?.suggestedKeywords && selectedBlock.suggestedKeywords.length > 0
                                        ? selectedBlock.suggestedKeywords
                                        : [
                                            'Make it more modern looking',
                                            'Change colors to blue theme',
                                            'Add a hover animation',
                                            'Make the button rounded'
                                        ]
                                    ).map((suggestion) => (
                                        <button
                                            key={suggestion}
                                            className={`px-4 py-2 bg-white border rounded-full text-xs text-center shadow-sm transition-all
                                                ${selectedBlock?.suggestedKeywords?.includes(suggestion)
                                                    ? 'border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 hover:border-emerald-300'
                                                    : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                                                }`}
                                            onClick={() => setInput(suggestion)}
                                        >
                                            {suggestion}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            /* Messages */
                            <div className="flex-1 space-y-3">
                                {messages.map((msg, i) => (
                                    <div
                                        key={i}
                                        className={`p-3 rounded-xl text-sm ${msg.role === 'user'
                                            ? 'bg-gray-900 text-white ml-8'
                                            : 'bg-gray-100 text-gray-800 mr-8'
                                            }`}
                                    >
                                        {msg.content}
                                    </div>
                                ))}
                                {isLoading && (
                                    <div className="bg-gray-100 text-gray-500 p-3 rounded-xl mr-8 flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-gray-300 border-t-emerald-500 rounded-full animate-spin" />
                                        Thinking...
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}

                {activeTab === 'Code' && selectedBlock && (
                    <pre className="flex-1 bg-gray-900 text-green-400 p-4 rounded-lg text-xs overflow-auto font-mono">
                        {selectedBlock.code}
                    </pre>
                )}

                {activeTab === 'Info' && selectedBlock && (
                    <ComponentInfo block={selectedBlock} />
                )}
            </div>

            {/* INPUT AREA */}
            <div className="p-4 bg-white border-t border-gray-100">
                <div className="relative bg-gray-50 rounded-xl border border-gray-200 p-2 focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Describe the change you want..."
                        className="w-full bg-transparent text-sm text-gray-800 placeholder-gray-400 resize-none outline-none h-12 p-1"
                        disabled={isLoading}
                    />

                    <div className="flex items-center justify-between mt-1">
                        <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-colors">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                <circle cx="8.5" cy="8.5" r="1.5" />
                                <polyline points="21 15 16 10 5 21" />
                            </svg>
                        </button>

                        <button
                            onClick={handleSendMessage}
                            disabled={!input.trim() || isLoading}
                            className={`p-1.5 rounded-lg transition-colors ${input.trim() && !isLoading
                                ? 'bg-emerald-500 text-white shadow-sm hover:bg-emerald-600'
                                : 'bg-gray-200 text-gray-400'
                                }`}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="12" y1="19" x2="12" y2="5" />
                                <polyline points="5 12 12 5 19 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
