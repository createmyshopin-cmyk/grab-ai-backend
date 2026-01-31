'use client';

import React, { useState, useCallback, useEffect } from 'react';
import ImageUpload from './ImageUpload';

interface ImageUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCodeGenerated: (data: { code: string; componentName: string; metadata: any }) => void;
}

export default function ImageUploadModal({
    isOpen,
    onClose,
    onCodeGenerated,
}: ImageUploadModalProps) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Close on ESC key
    useEffect(() => {
        if (!isOpen) return;

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !isProcessing) {
                onClose();
            }
        };

        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [isOpen, isProcessing, onClose]);

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    const handleImageUploaded = useCallback(
        async (file: File) => {
            setIsProcessing(true);
            setError(null);

            try {
                const formData = new FormData();
                formData.append('image', file);

                const response = await fetch('/api/generate/from-image', {
                    method: 'POST',
                    body: formData,
                });

                const data = await response.json();

                if (data.error) {
                    throw new Error(data.error);
                }

                if (data.code) {
                    onCodeGenerated({
                        code: data.code,
                        componentName: data.componentName || 'ScreenshotComponent',
                        metadata: data.metadata || {},
                    });
                    onClose();
                } else {
                    throw new Error('No code generated');
                }
            } catch (err: any) {
                setError(err.message || 'Failed to generate code from screenshot');
                console.error('Screenshot upload error:', err);
            } finally {
                setIsProcessing(false);
            }
        },
        [onCodeGenerated, onClose]
    );

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
            onClick={(e) => {
                if (e.target === e.currentTarget && !isProcessing) {
                    onClose();
                }
            }}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

            {/* Modal */}
            <div className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900">Screenshot to Code</h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Upload a screenshot or design mockup to generate a React component
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isProcessing}
                        className="p-2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Close modal"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    <ImageUpload onImageUploaded={handleImageUploaded} isProcessing={isProcessing} />

                    {error && (
                        <div className="mt-4 p-4 bg-rose-50 border border-rose-200 rounded-lg">
                            <div className="flex items-start gap-3">
                                <svg
                                    className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-rose-800">Error</p>
                                    <p className="text-sm text-rose-700 mt-1">{error}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Info */}
                    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-start gap-3">
                            <svg
                                className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                            <div className="flex-1 text-sm text-blue-800">
                                <p className="font-medium mb-1">AI Enhancement Features:</p>
                                <ul className="list-disc list-inside space-y-1 text-blue-700">
                                    <li>Mobile-first responsive design</li>
                                    <li>Framer Motion animations</li>
                                    <li>Improved spacing and typography</li>
                                    <li>Hover effects and interactivity</li>
                                    <li>Accessibility improvements</li>
                                    <li>Shopify-block-ready structure</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
