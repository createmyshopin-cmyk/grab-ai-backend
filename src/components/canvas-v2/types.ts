// Type definitions for Custom Canvas Engine

export interface Block {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    code: string;
    type: 'html' | 'react' | 'vanilla';
    name?: string; // Optional for backward compatibility
    suggestedKeywords?: string[]; // AI-detected keywords for refinement
}

export interface Viewport {
    x: number;
    y: number;
    zoom: number;
}

export interface CanvasState {
    blocks: Block[];
    viewport: Viewport;
}

export interface Point {
    x: number;
    y: number;
}
