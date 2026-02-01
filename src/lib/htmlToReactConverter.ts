/**
 * HTML to React Converter
 * 
 * Uses html-to-react library for parsing + custom JSX string generation
 * Reference: https://github.com/aknuds1/html-to-react
 */

// HTML attribute to JSX attribute mapping
const HTML_TO_JSX_ATTRS: Record<string, string> = {
  'class': 'className',
  'for': 'htmlFor',
  'tabindex': 'tabIndex',
  'readonly': 'readOnly',
  'maxlength': 'maxLength',
  'minlength': 'minLength',
  'colspan': 'colSpan',
  'rowspan': 'rowSpan',
  'cellpadding': 'cellPadding',
  'cellspacing': 'cellSpacing',
  'frameborder': 'frameBorder',
  'allowfullscreen': 'allowFullScreen',
  'autocomplete': 'autoComplete',
  'autofocus': 'autoFocus',
  'autoplay': 'autoPlay',
  'enctype': 'encType',
  'formaction': 'formAction',
  'novalidate': 'noValidate',
  'crossorigin': 'crossOrigin',
  'datetime': 'dateTime',
  'srcset': 'srcSet',
  'usemap': 'useMap',
  'inputmode': 'inputMode',
  'contenteditable': 'contentEditable',
  'spellcheck': 'spellCheck',
  'hreflang': 'hrefLang',
  'httpequiv': 'httpEquiv',
  'accesskey': 'accessKey',
  'marginheight': 'marginHeight',
  'marginwidth': 'marginWidth',
  // SVG attributes
  'clip-path': 'clipPath',
  'fill-rule': 'fillRule',
  'clip-rule': 'clipRule',
  'stroke-width': 'strokeWidth',
  'stroke-linecap': 'strokeLinecap',
  'stroke-linejoin': 'strokeLinejoin',
  'font-family': 'fontFamily',
  'font-size': 'fontSize',
  'text-anchor': 'textAnchor',
  'dominant-baseline': 'dominantBaseline',
  'stop-color': 'stopColor',
  'stop-opacity': 'stopOpacity',
  'fill-opacity': 'fillOpacity',
  'stroke-opacity': 'strokeOpacity',
  'stroke-dasharray': 'strokeDasharray',
  'stroke-dashoffset': 'strokeDashoffset',
};

// Self-closing (void) HTML elements
const VOID_ELEMENTS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr'
]);

// Boolean attributes that don't need values
const BOOLEAN_ATTRS = new Set([
  'checked', 'disabled', 'selected', 'readonly', 'multiple',
  'hidden', 'required', 'autofocus', 'autoplay', 'controls',
  'loop', 'muted', 'default', 'defer', 'async', 'novalidate',
  'formnovalidate', 'open', 'reversed', 'scoped', 'seamless'
]);

export interface ConversionOptions {
  componentName?: string;
  indent?: number;
  preserveComments?: boolean;
  inlineStyles?: boolean;
}

export interface ConversionResult {
  code: string;
  componentName: string;
  elementCount: number;
  hasImages: boolean;
  hasStyles: boolean;
}

/**
 * Convert HTML string to React component code
 */
export function htmlToReactCode(
  html: string,
  options: ConversionOptions = {}
): ConversionResult {
  const {
    componentName = 'ConvertedComponent',
    indent = 2,
    preserveComments = false,
  } = options;

  // Parse HTML using DOMParser (works in browser and with jsdom in Node)
  let doc: Document;
  if (typeof window !== 'undefined') {
    const parser = new DOMParser();
    doc = parser.parseFromString(html, 'text/html');
  } else {
    // Server-side: use a simple regex-based approach
    return convertWithRegex(html, componentName);
  }

  const body = doc.body;
  const rootElement = body.firstElementChild;

  if (!rootElement) {
    return {
      code: generateEmptyComponent(componentName),
      componentName,
      elementCount: 0,
      hasImages: false,
      hasStyles: false,
    };
  }

  // Track statistics
  let elementCount = 0;
  let hasImages = false;
  let hasStyles = false;

  // Convert element to JSX string
  function elementToJsx(element: Element, depth: number): string {
    elementCount++;
    const spaces = ' '.repeat(depth * indent);
    const tagName = element.tagName.toLowerCase();

    // Check for images
    if (tagName === 'img') hasImages = true;

    // Build attributes
    const attrs = buildAttributes(element, depth);
    if (attrs.includes('style=')) hasStyles = true;

    // Self-closing elements
    if (VOID_ELEMENTS.has(tagName)) {
      return `${spaces}<${tagName}${attrs} />`;
    }

    // Get children
    const children: string[] = [];
    for (const child of element.childNodes) {
      if (child.nodeType === Node.ELEMENT_NODE) {
        children.push(elementToJsx(child as Element, depth + 1));
      } else if (child.nodeType === Node.TEXT_NODE) {
        const text = child.textContent?.trim();
        if (text) {
          children.push(`${' '.repeat((depth + 1) * indent)}${escapeJsxText(text)}`);
        }
      } else if (child.nodeType === Node.COMMENT_NODE && preserveComments) {
        const comment = child.textContent || '';
        children.push(`${' '.repeat((depth + 1) * indent)}{/* ${comment} */}`);
      }
    }

    // Empty element
    if (children.length === 0) {
      return `${spaces}<${tagName}${attrs} />`;
    }

    // Single text child - inline it
    if (children.length === 1 && !children[0].includes('<')) {
      const text = children[0].trim();
      return `${spaces}<${tagName}${attrs}>${text}</${tagName}>`;
    }

    // Multiple children
    return `${spaces}<${tagName}${attrs}>\n${children.join('\n')}\n${spaces}</${tagName}>`;
  }

  // Build JSX attributes string
  function buildAttributes(element: Element, depth: number): string {
    const attrs: string[] = [];
    const spaces = ' '.repeat((depth + 1) * indent);

    for (const attr of element.attributes) {
      let name = attr.name.toLowerCase();
      let value = attr.value;

      // Skip event handlers (onclick, etc.) for safety
      if (name.startsWith('on')) continue;

      // Convert HTML attr to JSX attr
      name = HTML_TO_JSX_ATTRS[name] || name;

      // Convert data-* and aria-* (keep as-is)
      if (!name.startsWith('data-') && !name.startsWith('aria-')) {
        // Convert kebab-case to camelCase for other attributes
        name = name.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
      }

      // Handle boolean attributes
      if (BOOLEAN_ATTRS.has(attr.name.toLowerCase())) {
        if (value === '' || value === attr.name.toLowerCase()) {
          attrs.push(`${name}={true}`);
          continue;
        }
      }

      // Handle style attribute
      if (name === 'style') {
        const styleObj = cssToStyleObject(value);
        if (Object.keys(styleObj).length > 0) {
          const styleStr = formatStyleObject(styleObj, depth + 1, indent);
          attrs.push(`style={${styleStr}}`);
        }
        continue;
      }

      // Regular attribute
      attrs.push(`${name}="${escapeAttributeValue(value)}"`);
    }

    if (attrs.length === 0) return '';
    if (attrs.length <= 3) return ' ' + attrs.join(' ');

    // Multi-line attributes for many attrs
    return '\n' + attrs.map(a => `${spaces}${a}`).join('\n') + '\n' + ' '.repeat(depth * indent);
  }

  const jsxContent = elementToJsx(rootElement, 2);

  const code = `import React from "react";

export default function ${componentName}() {
  return (
${jsxContent}
  );
}
`;

  return {
    code,
    componentName,
    elementCount,
    hasImages,
    hasStyles,
  };
}

/**
 * Convert CSS string to React style object
 */
function cssToStyleObject(css: string): Record<string, string | number> {
  const style: Record<string, string | number> = {};

  css.split(';').forEach(declaration => {
    const colonIndex = declaration.indexOf(':');
    if (colonIndex === -1) return;

    let prop = declaration.slice(0, colonIndex).trim();
    let value = declaration.slice(colonIndex + 1).trim();

    if (!prop || !value) return;

    // Skip CSS custom properties (--var-name)
    if (prop.startsWith('--')) return;
    
    // Skip vendor prefixes
    if (prop.startsWith('-webkit-') || prop.startsWith('-moz-') || prop.startsWith('-ms-')) return;

    // Convert CSS property to camelCase
    prop = prop.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());

    // Fix URL values (handle broken &quot; entities)
    if (value.includes('url(')) {
      value = value.replace(/&quot;?/g, "'");
      value = value.replace(/&amp;/g, '&');
    }

    // Convert numeric values
    if (/^-?\d+$/.test(value)) {
      style[prop] = parseInt(value, 10);
    } else if (/^-?\d+px$/.test(value) && ['width', 'height', 'top', 'left', 'right', 'bottom'].includes(prop)) {
      // Keep px for positioning properties as strings
      style[prop] = value;
    } else {
      style[prop] = value;
    }
  });

  return style;
}

/**
 * Format style object for JSX
 */
function formatStyleObject(
  style: Record<string, string | number>,
  depth: number,
  indent: number
): string {
  const entries = Object.entries(style);
  if (entries.length === 0) return '{}';

  const formatted = entries.map(([key, value]) => {
    if (typeof value === 'number') {
      return `${key}: ${value}`;
    }
    return `${key}: "${value}"`;
  });

  if (formatted.length <= 3) {
    return `{ ${formatted.join(', ')} }`;
  }

  const spaces = ' '.repeat(depth * indent);
  return `{\n${spaces}  ${formatted.join(`,\n${spaces}  `)}\n${spaces}}`;
}

/**
 * Escape text for JSX
 */
function escapeJsxText(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/{/g, '&#123;')
    .replace(/}/g, '&#125;');
}

/**
 * Escape attribute value
 */
function escapeAttributeValue(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Generate empty component
 */
function generateEmptyComponent(componentName: string): string {
  return `import React from "react";

export default function ${componentName}() {
  return (
    <div>
      {/* Empty component */}
    </div>
  );
}
`;
}

/**
 * Fallback: Convert using regex (for server-side or when DOMParser unavailable)
 */
function convertWithRegex(html: string, componentName: string): ConversionResult {
  let jsx = html;
  let hasImages = html.includes('<img');
  let hasStyles = html.includes('style=');

  // Convert class to className
  jsx = jsx.replace(/\sclass=/g, ' className=');

  // Convert for to htmlFor
  jsx = jsx.replace(/\sfor=/g, ' htmlFor=');

  // Convert other common attributes
  Object.entries(HTML_TO_JSX_ATTRS).forEach(([html, jsxAttr]) => {
    const regex = new RegExp(`\\s${html}=`, 'gi');
    jsx = jsx.replace(regex, ` ${jsxAttr}=`);
  });

  // Self-close void elements
  VOID_ELEMENTS.forEach(tag => {
    const regex = new RegExp(`<${tag}([^>]*?)(?<!/)>`, 'gi');
    jsx = jsx.replace(regex, `<${tag}$1 />`);
  });

  // Convert style strings to objects
  jsx = jsx.replace(/style="([^"]*)"/g, (match, styleStr) => {
    const styleObj = cssToStyleObject(styleStr);
    const formatted = formatStyleObject(styleObj, 0, 2);
    return `style={${formatted}}`;
  });

  // Convert boolean attributes
  BOOLEAN_ATTRS.forEach(attr => {
    const regex = new RegExp(`\\s(${attr})(?=[\\s>])`, 'gi');
    jsx = jsx.replace(regex, ` ${attr}={true}`);
  });

  // Indent JSX
  const lines = jsx.split('\n');
  const indentedJsx = lines.map(line => '    ' + line.trim()).filter(l => l.trim()).join('\n');

  const code = `import React from "react";

export default function ${componentName}() {
  return (
${indentedJsx}
  );
}
`;

  return {
    code,
    componentName,
    elementCount: (jsx.match(/<[a-z]/gi) || []).length,
    hasImages,
    hasStyles,
  };
}

/**
 * Quick conversion helper
 */
export function quickConvert(html: string, tagName: string = 'div'): string {
  const componentName = `Captured${tagName.charAt(0).toUpperCase() + tagName.slice(1)}Section`;
  const result = htmlToReactCode(html, { componentName });
  return result.code;
}
