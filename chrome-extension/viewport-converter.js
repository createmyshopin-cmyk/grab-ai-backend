/**
 * Client-Side Viewport Converter (No Server, No AI)
 * Works directly in the Chrome extension for instant viewport variants
 */

const VIEWPORT_RULES = {
  mobile: {
    flexDirection: {
      'flex-row': 'flex-col',
      'flex-row-reverse': 'flex-col-reverse',
    },
    spacing: {
      'p-8': 'p-3', 'p-6': 'p-3', 'p-4': 'p-2',
      'px-8': 'px-3', 'px-6': 'px-4', 'px-4': 'px-3',
      'py-8': 'py-3', 'py-6': 'py-4', 'py-4': 'py-3',
      'm-8': 'm-2', 'm-6': 'm-2', 'm-4': 'm-2',
    },
    text: {
      'text-6xl': 'text-3xl', 'text-5xl': 'text-2xl', 'text-4xl': 'text-xl',
      'text-3xl': 'text-lg', 'text-2xl': 'text-base', 'text-xl': 'text-base',
      'text-lg': 'text-sm',
    },
    width: {
      'w-1/2': 'w-full', 'w-1/3': 'w-full', 'w-1/4': 'w-full',
      'w-2/3': 'w-full', 'w-3/4': 'w-full',
    },
    gap: {
      'gap-8': 'gap-2', 'gap-6': 'gap-2', 'gap-4': 'gap-2',
    },
  },
  tablet: {
    flexDirection: { 'flex-col': 'flex-row' },
    spacing: {
      'p-8': 'p-5', 'p-6': 'p-4', 'p-2': 'p-3',
      'px-8': 'px-5', 'px-6': 'px-4',
      'py-8': 'py-5', 'py-6': 'py-4',
    },
    text: {
      'text-6xl': 'text-4xl', 'text-5xl': 'text-3xl',
      'text-4xl': 'text-2xl', 'text-xs': 'text-sm',
    },
    width: {
      'w-full': 'w-2/3', 'w-1/4': 'w-1/3',
    },
    gap: {
      'gap-2': 'gap-3', 'gap-8': 'gap-4', 'gap-6': 'gap-3',
    },
  },
  desktop: {
    flexDirection: {},
    spacing: {
      'p-3': 'p-6', 'p-2': 'p-4',
      'px-3': 'px-6', 'px-4': 'px-6',
      'py-3': 'py-6', 'py-4': 'py-6',
    },
    text: {
      'text-3xl': 'text-5xl', 'text-2xl': 'text-4xl',
      'text-xl': 'text-3xl', 'text-sm': 'text-base',
    },
    width: { 'w-full': 'w-3/4' },
    gap: { 'gap-2': 'gap-6', 'gap-3': 'gap-4' },
  },
};

function removeResponsivePrefixes(className) {
  return className.replace(/(sm:|md:|lg:|xl:|2xl:)/g, '');
}

function applyResponsiveClasses(code, viewport) {
  let transformed = code;

  // Remove all responsive prefixes
  transformed = transformed.replace(/className="([^"]*)"/g, (match, classes) => {
    const cleaned = classes.split(' ').map(removeResponsivePrefixes).join(' ');
    return `className="${cleaned}"`;
  });

  // Apply viewport-specific transformations
  const rules = VIEWPORT_RULES[viewport];
  Object.entries(rules).forEach(([category, mappings]) => {
    Object.entries(mappings).forEach(([from, to]) => {
      const regex = new RegExp(`(className="[^"]*\\b)${from}(\\b[^"]*)`, 'g');
      transformed = transformed.replace(regex, `$1${to}$2`);
    });
  });

  // Viewport-specific adjustments
  if (viewport === 'mobile') {
    transformed = transformed.replace(
      /(className="[^"]*)(max-w-\w+)([^"]*")/g,
      '$1max-w-full$3'
    );
  } else if (viewport === 'desktop') {
    transformed = transformed.replace(/(<div className=")/, '$1max-w-7xl mx-auto ');
  }

  return transformed;
}

function transformInlineStyles(code, viewport) {
  let transformed = code;

  if (viewport === 'mobile') {
    // Convert fixed widths to 100%
    transformed = transformed.replace(
      /style={{([^}]*width:\s*['"]?\d+px['"]?[^}]*)}}/g,
      (match, styles) => {
        const updated = styles.replace(/width:\s*['"]?\d+px['"]?/g, "width: '100%'");
        return `style={{${updated}}}`;
      }
    );

    // Reduce font sizes
    transformed = transformed.replace(/fontSize:\s*['"]?(\d+)px['"]?/g, (match, size) => {
      const newSize = Math.max(12, Math.floor(parseInt(size) * 0.7));
      return `fontSize: '${newSize}px'`;
    });
  } else if (viewport === 'tablet') {
    // Moderate font sizes
    transformed = transformed.replace(/fontSize:\s*['"]?(\d+)px['"]?/g, (match, size) => {
      const newSize = Math.floor(parseInt(size) * 0.85);
      return `fontSize: '${newSize}px'`;
    });
  }

  return transformed;
}

function addViewportComment(code, viewport) {
  const icon = viewport === 'mobile' ? '📱' : viewport === 'tablet' ? '📱' : '🖥️';
  const breakpoint =
    viewport === 'mobile' ? '320px - 767px' : viewport === 'tablet' ? '768px - 1023px' : '1024px+';

  const comment = `\n// ${icon} ${viewport.toUpperCase()} Variant (${breakpoint})\n// Auto-generated using rule-based transformations (no AI)\n`;

  return code.replace(/(import React from "react";)/, `$1${comment}`);
}

/**
 * Convert code to responsive viewport variants
 * @param {string} code - React component code
 * @returns {{mobile: string, tablet: string, desktop: string}}
 */
function convertToViewports(code) {
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

  // Desktop variant
  let desktop = code;
  desktop = applyResponsiveClasses(desktop, 'desktop');
  desktop = transformInlineStyles(desktop, 'desktop');
  desktop = addViewportComment(desktop, 'desktop');

  return { mobile, tablet, desktop };
}

// Export for use in content.js
if (typeof window !== 'undefined') {
  window.viewportConverter = { convertToViewports };
}
