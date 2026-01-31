/**
 * Image utility functions for validation and processing
 */

export interface ImageValidationResult {
    valid: boolean;
    error?: string;
    width?: number;
    height?: number;
    size?: number;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MIN_DIMENSION = 200; // Minimum 200x200px
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

/**
 * Validate image file before upload
 */
export function validateImageFile(file: File): Promise<ImageValidationResult> {
    return new Promise((resolve) => {
        // Check file type
        if (!ALLOWED_TYPES.includes(file.type)) {
            resolve({
                valid: false,
                error: `Invalid file type. Allowed: PNG, JPG, WebP`,
            });
            return;
        }

        // Check file size
        if (file.size > MAX_FILE_SIZE) {
            resolve({
                valid: false,
                error: `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
                size: file.size,
            });
            return;
        }

        // Check dimensions
        const img = new Image();
        const objectUrl = URL.createObjectURL(file);

        img.onload = () => {
            URL.revokeObjectURL(objectUrl);

            if (img.width < MIN_DIMENSION || img.height < MIN_DIMENSION) {
                resolve({
                    valid: false,
                    error: `Image too small. Minimum dimensions: ${MIN_DIMENSION}x${MIN_DIMENSION}px`,
                    width: img.width,
                    height: img.height,
                });
                return;
            }

            resolve({
                valid: true,
                width: img.width,
                height: img.height,
                size: file.size,
            });
        };

        img.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            resolve({
                valid: false,
                error: 'Invalid image file. Could not read image data.',
            });
        };

        img.src = objectUrl;
    });
}

/**
 * Compress image if needed (client-side compression)
 * Returns compressed File or original if compression not needed
 */
export async function compressImageIfNeeded(
    file: File,
    maxWidth: number = 1920,
    maxHeight: number = 1080,
    quality: number = 0.85
): Promise<File> {
    return new Promise((resolve) => {
        const img = new Image();
        const objectUrl = URL.createObjectURL(file);

        img.onload = () => {
            URL.revokeObjectURL(objectUrl);

            // Check if compression is needed
            if (img.width <= maxWidth && img.height <= maxHeight && file.size < 2 * 1024 * 1024) {
                // No compression needed
                resolve(file);
                return;
            }

            // Calculate new dimensions
            let width = img.width;
            let height = img.height;

            if (width > maxWidth) {
                height = (height * maxWidth) / width;
                width = maxWidth;
            }

            if (height > maxHeight) {
                width = (width * maxHeight) / height;
                height = maxHeight;
            }

            // Create canvas and compress
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                resolve(file);
                return;
            }

            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob(
                (blob) => {
                    if (!blob) {
                        resolve(file);
                        return;
                    }

                    const compressedFile = new File([blob], file.name, {
                        type: file.type,
                        lastModified: Date.now(),
                    });

                    resolve(compressedFile);
                },
                file.type,
                quality
            );
        };

        img.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            resolve(file); // Return original on error
        };

        img.src = objectUrl;
    });
}

/**
 * Convert File to base64 string
 */
export function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            // Remove data URL prefix
            const base64 = result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}
