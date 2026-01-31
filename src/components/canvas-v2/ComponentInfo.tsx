'use client';

import React from 'react';
import { Block } from './types';

interface ComponentInfoProps {
    block: Block;
}

export default function ComponentInfo({ block }: ComponentInfoProps) {
    if (!block.metadata) {
        return (
            <div className="p-4 text-sm text-gray-500 text-center">
                No metadata available for this component
            </div>
        );
    }

    const { metadata } = block;

    return (
        <div className="p-4 space-y-6">
            {/* Generation Source */}
            {metadata.generatedFrom && (
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        {metadata.generatedFrom === 'screenshot' && (
                            <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        )}
                        <h3 className="text-sm font-semibold text-gray-900">
                            Generated from {metadata.generatedFrom}
                        </h3>
                    </div>
                </div>
            )}

            {/* Shopify Compatibility */}
            {metadata.shopifyCompatible && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-sm font-medium text-emerald-800">Shopify Ready</span>
                    </div>
                    <p className="text-xs text-emerald-700 mt-1">
                        This component can be exported to Shopify Liquid format
                    </p>
                </div>
            )}

            {/* Detected Elements */}
            {metadata.elements && metadata.elements.length > 0 && (
                <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Detected Elements</h3>
                    <div className="space-y-2">
                        {metadata.elements.map((element, index) => (
                            <div key={index} className="p-2 bg-gray-50 rounded border border-gray-200">
                                <div className="text-xs font-medium text-gray-700 capitalize">
                                    {element.type}
                                </div>
                                {element.suggestions && element.suggestions.length > 0 && (
                                    <div className="mt-1 space-y-1">
                                        {element.suggestions.map((suggestion, sIndex) => (
                                            <div key={sIndex} className="flex items-start gap-1.5 text-xs text-gray-600">
                                                <svg className="w-3 h-3 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                                <span>{suggestion}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Applied Enhancements */}
            {metadata.enhancements && metadata.enhancements.length > 0 && (
                <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Applied Enhancements</h3>
                    <div className="space-y-1.5">
                        {metadata.enhancements.map((enhancement, index) => (
                            <div key={index} className="flex items-start gap-2 text-sm text-gray-700">
                                <svg className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span>{enhancement}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Color Palette */}
            {metadata.colorPalette && metadata.colorPalette.length > 0 && (
                <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Color Palette</h3>
                    <div className="flex flex-wrap gap-2">
                        {metadata.colorPalette.map((color, index) => {
                            // Extract hex color from Tailwind class if possible
                            const getColorValue = (colorClass: string) => {
                                // This is a simplified mapping - in production, you'd use a Tailwind color map
                                const colorMap: Record<string, string> = {
                                    'bg-gray-900': '#111827',
                                    'bg-gray-800': '#1f2937',
                                    'bg-blue-500': '#3b82f6',
                                    'bg-blue-600': '#2563eb',
                                    'text-white': '#ffffff',
                                    'text-gray-900': '#111827',
                                };
                                return colorMap[color] || '#6b7280';
                            };

                            const colorValue = getColorValue(color);

                            return (
                                <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded border border-gray-200">
                                    <div
                                        className="w-6 h-6 rounded border border-gray-300"
                                        style={{ backgroundColor: colorValue }}
                                    />
                                    <span className="text-xs text-gray-600 font-mono">{color}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
