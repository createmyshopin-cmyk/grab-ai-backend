'use client';

import React, { useState, useCallback, useRef } from 'react';
import { validateImageFile, compressImageIfNeeded } from '@/lib/imageUtils';

interface ImageUploadProps {
    onImageUploaded: (file: File) => Promise<void>;
    isProcessing?: boolean;
}

export default function ImageUpload({ onImageUploaded, isProcessing = false }: ImageUploadProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFile = useCallback(
        async (file: File) => {
            setError(null);
            setUploadProgress(0);

            try {
                // Validate file
                const validation = await validateImageFile(file);
                if (!validation.valid) {
                    setError(validation.error || 'Invalid image file');
                    return;
                }

                // Show preview
                const reader = new FileReader();
                reader.onload = (e) => {
                    setPreview(e.target?.result as string);
                };
                reader.readAsDataURL(file);

                // Compress if needed
                setUploadProgress(25);
                const compressedFile = await compressImageIfNeeded(file);
                setUploadProgress(50);

                // Upload
                setUploadProgress(75);
                await onImageUploaded(compressedFile);
                setUploadProgress(100);

                // Reset after short delay
                setTimeout(() => {
                    setPreview(null);
                    setUploadProgress(0);
                }, 2000);
            } catch (err: any) {
                setError(err.message || 'Failed to process image');
                setPreview(null);
                setUploadProgress(0);
            }
        },
        [onImageUploaded]
    );

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragging(false);

            const file = e.dataTransfer.files[0];
            if (file) {
                handleFile(file);
            }
        },
        [handleFile]
    );

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleFileInput = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (file) {
                handleFile(file);
            }
            // Reset input so same file can be selected again
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        },
        [handleFile]
    );

    const handleClick = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    return (
        <div className="w-full">
            <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={handleClick}
                className={`
                    border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer
                    ${
                        isDragging
                            ? 'border-blue-500 bg-blue-50 scale-[1.02]'
                            : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'
                    }
                    ${isProcessing ? 'opacity-50 pointer-events-none' : ''}
                    ${error ? 'border-rose-300 bg-rose-50' : ''}
                `}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    onChange={handleFileInput}
                    className="hidden"
                />

                {preview ? (
                    <div className="space-y-4">
                        <img
                            src={preview}
                            alt="Preview"
                            className="max-h-48 mx-auto rounded-lg shadow-md"
                        />
                        {uploadProgress > 0 && uploadProgress < 100 && (
                            <div className="space-y-2">
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${uploadProgress}%` }}
                                    />
                                </div>
                                <p className="text-sm text-gray-600">
                                    {uploadProgress < 50 ? 'Processing...' : 'Uploading...'} {uploadProgress}%
                                </p>
                            </div>
                        )}
                        {isProcessing && (
                            <div className="flex items-center justify-center gap-2 text-blue-600">
                                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                <p className="text-sm font-medium">AI analyzing design...</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex justify-center">
                            <svg
                                className={`w-16 h-16 ${error ? 'text-rose-400' : 'text-gray-400'}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-700 mb-1">
                                {error ? 'Upload failed' : 'Drop screenshot here or click to upload'}
                            </p>
                            <p className="text-xs text-gray-500">
                                PNG, JPG, WebP (max 10MB, min 200x200px)
                            </p>
                        </div>
                        {error && (
                            <div className="mt-2 p-2 bg-rose-100 border border-rose-200 rounded text-sm text-rose-700">
                                {error}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
