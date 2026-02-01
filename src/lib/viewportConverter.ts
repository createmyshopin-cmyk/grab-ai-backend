/**
 * Deterministic Viewport Converter (No AI)
 * Converts React components to responsive variants using rule-based transformations
 */

interface ViewportVariants {
  mobile: string;
  tablet: string;
  desktop: string;
}

interface TransformRules {
  // Tailwind class mappings for each viewport
  flexDirection: { [key: string]: string };
  spacing: { [key: string]: string };
  text: { [key: string]: string };
  width: { [key: string]: string };
  gap: { [key: string]: string };
}

const VIEWPORT_RULES: { [viewport: string]: TransformRules } = {
  mobile: {
    flexDirection: {
      'flex-row': 'flex-col',
      'flex-row-reverse': 'flex-col-reverse',
    },
    spacing: {
      'p-8': 'p-3',
      'p-6': 'p-3',
      'p-4': 'p-2',
      'px-8': 'px-3',
      'px-6': 'px-4',
      'px-4': 'px-3',
      'py-8': 'py-3',
      'py-6': 'py-4',
      'py-4': 'py-3',
      'm-8': 'm-2',
      'm-6': 'm-2',
      'm-4': 'm-2',
    },
    text: {
      'text-6xl': 'text-3xl',
      'text-5xl': 'text-2xl',
      'text-4xl': 'text-xl',
      'text-3xl': 'text-lg',
      'text-2xl': 'text-base',
      'text-xl': 'text-base',
      'text-lg': 'text-sm',
    },
    width: {
      'w-1/2': 'w-full',
      'w-1/3': 'w-full',
      'w-1/4': 'w-full',
      'w-2/3': 'w-full',
      'w-3/4': 'w-full',
    },
    gap: {
      'gap-8': 'gap-2',
      'gap-6': 'gap-2',
      'gap-4': 'gap-2',
    },
  },
  tablet: {
    flexDirection: {
      'flex-col': 'flex-row',
    },
    spacing: {
      'p-8': 'p-5',
      'p-6': 'p-4',
      'p-2': 'p-3',
      'px-8': 'px-5',
      'px-6': 'px-4',
      'py-8': 'py-5',
      'py-6': 'py-4',
    },
    text: {
      'text-6xl': 'text-4xl',
      'text-5xl': 'text-3xl',
      'text-4xl': 'text-2xl',
      'text-xs': 'text-sm',
    },
    width: {
      'w-full': 'w-2/3',
      'w-1/4': 'w-1/3',
    },
    gap: {
      'gap-2': 'gap-3',
      'gap-8': 'gap-4',
      'gap-6': 'gap-3',
    },
  },
  desktop: {
    flexDirection: {},
    spacing: {
      'p-3': 'p-6',
      'p-2': 'p-4',
      'px-3': 'px-6',
      'px-4': 'px-6',
      'py-3': 'py-6',
      'py-4': 'py-6',
    },
    text: {
      'text-3xl': 'text-5xl',
      'text-2xl': 'text-4xl',
      'text-xl': 'text-3xl',
      'text-sm': 'text-base',
    },
    width: {
      'w-full': 'w-3/4',
    },
    gap: {
      'gap-2': 'gap-6',
      'gap-3': 'gap-4',
    },
  },
};

/**
 * Remove responsive Tailwind prefixes (md:, lg:, xl:, etc.)
 */
function removeResponsivePrefixes(className: string): string {
  return className.replace(/(sm:|md:|lg:|xl:|2xl:)/g, '');
}

/**
 * Apply responsive Tailwind classes for specific viewport
 */
function applyResponsiveClasses(
  code: string,
  viewport: 'mobile' | 'tablet' | 'desktop'
): string {
  let transformed = code;

  // Step 1: Remove all responsive prefixes first
  transformed = transformed.replace(
    /className="([^"]*)"/g,
    (match, classes) => {
      const cleaned = classes
        .split(' ')
        .map(removeResponsivePrefixes)
        .join(' ');
      return `className="${cleaned}"`;
    }
  );

  // Step 2: Apply viewport-specific transformations
  const rules = VIEWPORT_RULES[viewport];

  Object.entries(rules).forEach(([category, mappings]) => {
    Object.entries(mappings).forEach(([from, to]) => {
      // Replace in className attributes
      const regex = new RegExp(
        `(className="[^"]*\\b)${from}(\\b[^"]*)`,
        'g'
      );
      transformed = transformed.replace(regex, `$1${to}$2`);
    });
  });

  // Step 3: Add viewport-specific container constraints
  if (viewport === 'mobile') {
    // Ensure max-width on mobile
    transformed = transformed.replace(
      /(className="[^"]*)(max-w-\w+)([^"]*")/g,
      '$1max-w-full$3'
    );
  } else if (viewport === 'desktop') {
    // Add max-width container for desktop if missing
    transformed = transformed.replace(
      /(<div className=")/,
      '$1max-w-7xl mx-auto '
    );
  }

  return transformed;
}

/**
 * Extract and transform inline styles for viewport
 */
function transformInlineStyles(
  code: string,
  viewport: 'mobile' | 'tablet' | 'desktop'
): string {
  let transformed = code;

  // Transform fixed widths
  if (viewport === 'mobile') {
    // Convert fixed widths to 100%
    transformed = transformed.replace(
      /style={{([^}]*width:\s*['"]?\d+px['"]?[^}]*)}}/g,
      (match, styles) => {
        const updated = styles.replace(
          /width:\s*['"]?\d+px['"]?/g,
          "width: '100%'"
        );
        return `style={{${updated}}}`;
      }
    );

    // Reduce font sizes
    transformed = transformed.replace(
      /fontSize:\s*['"]?(\d+)px['"]?/g,
      (match, size) => {
        const newSize = Math.max(12, Math.floor(parseInt(size) * 0.7));
        return `fontSize: '${newSize}px'`;
      }
    );
  } else if (viewport === 'tablet') {
    // Moderate font sizes
    transformed = transformed.replace(
      /fontSize:\s*['"]?(\d+)px['"]?/g,
      (match, size) => {
        const newSize = Math.floor(parseInt(size) * 0.85);
        return `fontSize: '${newSize}px'`;
      }
    );
  }

  return transformed;
}

/**
 * Standard viewport dimensions
 */
export const VIEWPORT_DIMENSIONS = {
  mobile: { width: 402, height: 874, label: 'Mobile' },
  tablet: { width: 1133, height: 744, label: 'Tablet' },
  desktop: { width: 1440, height: 1024, label: 'Browser' },
} as const;

/**
 * Add viewport-specific wrapper comments
 */
function addViewportComment(
  code: string,
  viewport: 'mobile' | 'tablet' | 'desktop'
): string {
  const dims = VIEWPORT_DIMENSIONS[viewport];
  const icon = viewport === 'mobile' ? '📱' : viewport === 'tablet' ? '📱' : '🖥️';

  const comment = `\n// ${icon} ${dims.label} Variant (${dims.width}px × ${dims.height}px)\n// Auto-generated using rule-based transformations (no AI)\n`;

  return code.replace(
    /(import React from "react";)/,
    `$1${comment}`
  );
}

/**
 * Convert code to responsive viewport variants (deterministic, no AI)
 */
export function convertToViewports(
  code: string,
  sourceViewport: 'desktop' | 'mobile' | 'tablet' = 'desktop'
): ViewportVariants {
  // Mobile variant
  let mobile = code;
  mobile = applyResponsiveClasses(mobile, 'mobile');
  mobile = transformInlineStyles(mobile, 'mobile');
  mobile = addViewportComment(mobile, 'mobile');

  // Tablet variant
  let tablet = code;
  tablet = applyResponsiveClasses(tablet, 'tablet');
  tablet = transformInlineStyles(tablet, 'tablet');
  tablet = addViewportComment(tablet, 'tablet');

  // Desktop variant (original with enhancements)
  let desktop = code;
  desktop = applyResponsiveClasses(desktop, 'desktop');
  desktop = transformInlineStyles(desktop, 'desktop');
  desktop = addViewportComment(desktop, 'desktop');

  return {
    mobile,
    tablet,
    desktop,
  };
}

/**
 * Extract media queries from CSS and create viewport-specific versions
 */
export function splitMediaQueries(css: string): {
  mobile: string;
  tablet: string;
  desktop: string;
  base: string;
} {
  const mobile: string[] = [];
  const tablet: string[] = [];
  const desktop: string[] = [];
  const base: string[] = [];

  // Split CSS by media queries
  const mediaQueryRegex = /@media[^{]+\{([\s\S]+?)\}\s*\}/g;
  let lastIndex = 0;

  let match;
  while ((match = mediaQueryRegex.exec(css)) !== null) {
    // Add non-media-query CSS to base
    if (match.index > lastIndex) {
      base.push(css.substring(lastIndex, match.index));
    }

    const query = match[0];
    const content = match[1];

    // Categorize by breakpoint
    if (query.includes('max-width') && query.includes('767px')) {
      mobile.push(content);
    } else if (
      query.includes('min-width') &&
      query.includes('768px') &&
      query.includes('max-width') &&
      query.includes('1023px')
    ) {
      tablet.push(content);
    } else if (query.includes('min-width') && query.includes('1024px')) {
      desktop.push(content);
    } else if (query.includes('min-width') && query.includes('768px')) {
      // Generic tablet+ query
      tablet.push(content);
      desktop.push(content);
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining CSS to base
  if (lastIndex < css.length) {
    base.push(css.substring(lastIndex));
  }

  return {
    mobile: base.join('\n') + '\n' + mobile.join('\n'),
    tablet: base.join('\n') + '\n' + tablet.join('\n'),
    desktop: base.join('\n') + '\n' + desktop.join('\n'),
    base: base.join('\n'),
  };
}
