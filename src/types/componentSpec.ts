/**
 * Component Specification - JSON schema for AI-generated components
 * Used as intermediate format between image analysis and code generation
 */

export interface ComponentSpec {
  // Basic Info
  componentName: string;
  description: string;
  
  // Layout Structure
  layout: {
    type: 'horizontal-carousel' | 'vertical-list' | 'grid' | 'hero' | 'form' | 'mixed';
    direction: 'row' | 'column';
    containerWidth: 'full' | 'contained' | 'fluid';
    maxWidth?: string; // e.g., 'max-w-7xl'
  };
  
  // Grid/Carousel Configuration
  structure: {
    itemCount: number;
    rows?: number;
    columns?: number; // desktop
    columnsTablet?: number; // md
    columnsMobile?: number; // sm
    gap: string; // e.g., 'gap-6'
    hasNavigation?: boolean;
    hasScrollSnap?: boolean;
  };
  
  // Design Tokens
  tokens: {
    colors: {
      primary: string;
      secondary: string;
      accent: string;
      background: string;
      text: string;
      [key: string]: string;
    };
    typography: {
      fontFamily: string;
      headingSizes: {
        h1: string;
        h2: string;
        h3: string;
      };
      bodySize: string;
      fontWeights: Record<string, number>;
    };
    spacing: {
      section: string; // e.g., 'py-16'
      container: string; // e.g., 'px-4'
      cardPadding: string; // e.g., 'p-8'
    };
    borderRadius: {
      card: string; // e.g., 'rounded-3xl'
      button: string; // e.g., 'rounded-lg'
      image: string; // e.g., 'rounded-full'
    };
  };
  
  // Elements (Detailed)
  elements: Element[];
  
  // Interactivity
  features: {
    hasCarousel?: boolean;
    hasHoverEffects?: boolean;
    hasAnimations?: boolean;
    hasFormValidation?: boolean;
    hasDarkMode?: boolean;
  };
  
  // Metadata
  metadata: {
    shopifyCompatible: boolean;
    responsive: boolean;
    accessibility: string[]; // ARIA features
    enhancements: string[];
  };
}

export interface Element {
  id: string;
  type: 'heading' | 'text' | 'image' | 'button' | 'card' | 'input' | 'icon' | 'container';
  position: {
    order: number; // render order
    parent?: string; // parent element ID
  };
  content: {
    text?: string;
    placeholder?: string;
    alt?: string;
    href?: string;
  };
  styling: {
    className: string;
    colors?: {
      background?: string;
      text?: string;
      border?: string;
    };
    dimensions?: {
      width?: string;
      height?: string;
    };
  };
  image?: {
    type: 'product' | 'hero' | 'avatar' | 'icon' | 'background';
    shape: 'square' | 'circle' | 'rounded' | 'rectangle';
    aspectRatio?: string;
    position: 'center' | 'top' | 'bottom';
    placeholderUrl: string; // use placeholder.com or similar
  };
  states?: {
    hover?: {
      transform?: string;
      colors?: Record<string, string>;
    };
    active?: {
      transform?: string;
    };
  };
}

/**
 * Validate ComponentSpec structure
 */
export function validateComponentSpec(spec: any): spec is ComponentSpec {
  return (
    spec &&
    typeof spec.componentName === 'string' &&
    spec.layout &&
    typeof spec.layout.type === 'string' &&
    ['horizontal-carousel', 'vertical-list', 'grid', 'hero', 'form', 'mixed'].includes(spec.layout.type) &&
    spec.structure &&
    typeof spec.structure.itemCount === 'number' &&
    spec.elements &&
    Array.isArray(spec.elements) &&
    spec.tokens &&
    spec.tokens.colors &&
    spec.metadata
  );
}
