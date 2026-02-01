/**
 * Direct HTML to React Converter
 * 
 * This converts HTML to React EXACTLY like htmltoreact.app
 * NO AI interpretation - just pure syntax conversion
 */

interface ConversionResult {
  code: string;
  componentName: string;
  styles: Record<string, string>;
}

/**
 * Convert captured element data directly to React component
 * NO AI - Direct conversion preserving ALL styles
 */
export function convertToReactDirect(captureData: any): ConversionResult {
  const html = captureData.element?.html || captureData.html || '';
  const styles = captureData.styles || {};
  const layout = captureData.layout || styles.layout || {};
  const typography = captureData.typography || styles.typography || {};
  const colors = captureData.colors || styles.colors || {};
  const dimensions = captureData.dimensions || {};
  
  // Generate component name
  const tag = captureData.element?.tag || captureData.tagName || 'div';
  const componentName = `Captured${tag.charAt(0).toUpperCase() + tag.slice(1)}Section`;
  
  // Build inline styles object from ALL captured computed styles
  const inlineStyles = buildInlineStyles(layout, typography, colors, dimensions, styles);
  
  // Convert HTML to JSX
  const jsxContent = htmlToJsx(html, inlineStyles);
  
  // Generate the React component code
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
    styles: inlineStyles
  };
}

/**
 * Build complete inline styles from captured data
 */
function buildInlineStyles(
  layout: Record<string, any>,
  typography: Record<string, any>,
  colors: Record<string, any>,
  dimensions: Record<string, any>,
  allStyles: Record<string, any>
): Record<string, string> {
  const styles: Record<string, string> = {};
  
  // Layout properties
  if (layout.display && layout.display !== 'block') styles.display = layout.display;
  if (layout.position && layout.position !== 'static') styles.position = layout.position;
  if (layout.top && layout.top !== 'auto') styles.top = layout.top;
  if (layout.right && layout.right !== 'auto') styles.right = layout.right;
  if (layout.bottom && layout.bottom !== 'auto') styles.bottom = layout.bottom;
  if (layout.left && layout.left !== 'auto') styles.left = layout.left;
  
  // Flexbox
  if (layout.flexDirection && layout.flexDirection !== 'row') styles.flexDirection = layout.flexDirection;
  if (layout.justifyContent && layout.justifyContent !== 'normal') styles.justifyContent = layout.justifyContent;
  if (layout.alignItems && layout.alignItems !== 'normal') styles.alignItems = layout.alignItems;
  if (layout.flexWrap && layout.flexWrap !== 'nowrap') styles.flexWrap = layout.flexWrap;
  if (layout.gap && layout.gap !== 'normal' && layout.gap !== '0px') styles.gap = layout.gap;
  
  // Grid
  if (layout.gridTemplateColumns && layout.gridTemplateColumns !== 'none') {
    styles.gridTemplateColumns = layout.gridTemplateColumns;
  }
  if (layout.gridTemplateRows && layout.gridTemplateRows !== 'none') {
    styles.gridTemplateRows = layout.gridTemplateRows;
  }
  
  // Spacing - use individual values for precision
  if (layout.paddingTop && layout.paddingTop !== '0px') styles.paddingTop = layout.paddingTop;
  if (layout.paddingRight && layout.paddingRight !== '0px') styles.paddingRight = layout.paddingRight;
  if (layout.paddingBottom && layout.paddingBottom !== '0px') styles.paddingBottom = layout.paddingBottom;
  if (layout.paddingLeft && layout.paddingLeft !== '0px') styles.paddingLeft = layout.paddingLeft;
  
  if (layout.marginTop && layout.marginTop !== '0px') styles.marginTop = layout.marginTop;
  if (layout.marginRight && layout.marginRight !== '0px') styles.marginRight = layout.marginRight;
  if (layout.marginBottom && layout.marginBottom !== '0px') styles.marginBottom = layout.marginBottom;
  if (layout.marginLeft && layout.marginLeft !== '0px') styles.marginLeft = layout.marginLeft;
  
  // Dimensions - use exact pixel values
  if (dimensions.width) styles.width = `${dimensions.width}px`;
  if (dimensions.height) styles.height = `${dimensions.height}px`;
  
  // If layout has width/height, prefer those
  if (layout.width && layout.width !== 'auto') styles.width = layout.width;
  if (layout.height && layout.height !== 'auto') styles.height = layout.height;
  if (layout.maxWidth && layout.maxWidth !== 'none') styles.maxWidth = layout.maxWidth;
  if (layout.minWidth && layout.minWidth !== 'auto') styles.minWidth = layout.minWidth;
  if (layout.maxHeight && layout.maxHeight !== 'none') styles.maxHeight = layout.maxHeight;
  if (layout.minHeight && layout.minHeight !== 'auto') styles.minHeight = layout.minHeight;
  
  // Overflow
  if (layout.overflow && layout.overflow !== 'visible') styles.overflow = layout.overflow;
  if (layout.overflowX && layout.overflowX !== 'visible') styles.overflowX = layout.overflowX;
  if (layout.overflowY && layout.overflowY !== 'visible') styles.overflowY = layout.overflowY;
  
  // Typography
  if (typography.fontFamily) styles.fontFamily = typography.fontFamily;
  if (typography.fontSize && typography.fontSize !== '16px') styles.fontSize = typography.fontSize;
  if (typography.fontWeight && typography.fontWeight !== '400') styles.fontWeight = typography.fontWeight;
  if (typography.fontStyle && typography.fontStyle !== 'normal') styles.fontStyle = typography.fontStyle;
  if (typography.lineHeight && typography.lineHeight !== 'normal') styles.lineHeight = typography.lineHeight;
  if (typography.letterSpacing && typography.letterSpacing !== 'normal') styles.letterSpacing = typography.letterSpacing;
  if (typography.textAlign && typography.textAlign !== 'start') styles.textAlign = typography.textAlign;
  if (typography.textTransform && typography.textTransform !== 'none') styles.textTransform = typography.textTransform;
  if (typography.textDecoration && typography.textDecoration !== 'none') styles.textDecoration = typography.textDecoration;
  if (typography.whiteSpace && typography.whiteSpace !== 'normal') styles.whiteSpace = typography.whiteSpace;
  
  // Colors
  if (colors.color && colors.color !== 'rgb(0, 0, 0)') styles.color = colors.color;
  if (colors.backgroundColor && colors.backgroundColor !== 'rgba(0, 0, 0, 0)' && colors.backgroundColor !== 'transparent') {
    styles.backgroundColor = colors.backgroundColor;
  }
  if (colors.borderColor && colors.borderColor !== 'rgb(0, 0, 0)') styles.borderColor = colors.borderColor;
  
  // Border
  if (allStyles.border && allStyles.border !== 'none') styles.border = allStyles.border;
  if (allStyles.borderRadius && allStyles.borderRadius !== '0px') styles.borderRadius = allStyles.borderRadius;
  if (allStyles.borderWidth && allStyles.borderWidth !== '0px') styles.borderWidth = allStyles.borderWidth;
  if (allStyles.borderStyle && allStyles.borderStyle !== 'none') styles.borderStyle = allStyles.borderStyle;
  
  // Box shadow
  if (allStyles.boxShadow && allStyles.boxShadow !== 'none') styles.boxShadow = allStyles.boxShadow;
  
  // Z-index
  if (allStyles.zIndex && allStyles.zIndex !== 'auto') styles.zIndex = allStyles.zIndex;
  
  // Opacity
  if (allStyles.opacity && allStyles.opacity !== '1') styles.opacity = allStyles.opacity;
  
  // Transform
  if (allStyles.transform && allStyles.transform !== 'none') styles.transform = allStyles.transform;
  
  // Background
  if (allStyles.backgroundImage && allStyles.backgroundImage !== 'none') {
    styles.backgroundImage = allStyles.backgroundImage;
  }
  if (allStyles.backgroundSize && allStyles.backgroundSize !== 'auto') styles.backgroundSize = allStyles.backgroundSize;
  if (allStyles.backgroundPosition && allStyles.backgroundPosition !== '0% 0%') {
    styles.backgroundPosition = allStyles.backgroundPosition;
  }
  if (allStyles.backgroundRepeat && allStyles.backgroundRepeat !== 'repeat') {
    styles.backgroundRepeat = allStyles.backgroundRepeat;
  }
  
  return styles;
}

/**
 * Convert HTML string to JSX string with inline styles
 */
function htmlToJsx(html: string, rootStyles: Record<string, string>): string {
  // Parse the HTML
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const element = doc.body.firstElementChild;
  
  if (!element) {
    // Fallback: Return the HTML as a div with dangerouslySetInnerHTML
    return `    <div dangerouslySetInnerHTML={{ __html: \`${escapeJsx(html)}\` }} />`;
  }
  
  // Convert the element tree to JSX
  return elementToJsx(element, 2, rootStyles);
}

/**
 * Convert a DOM element to JSX string
 */
function elementToJsx(
  element: Element, 
  indent: number = 0, 
  additionalStyles?: Record<string, string>
): string {
  const spaces = '  '.repeat(indent);
  const tagName = element.tagName.toLowerCase();
  
  // Handle self-closing tags
  const selfClosing = ['img', 'br', 'hr', 'input', 'meta', 'link', 'area', 'base', 'col', 'embed', 'param', 'source', 'track', 'wbr'];
  const isSelfClosing = selfClosing.includes(tagName);
  
  // Build attributes
  const attrs = buildAttributes(element, additionalStyles);
  
  if (isSelfClosing) {
    return `${spaces}<${tagName}${attrs} />`;
  }
  
  // Check if element has only text content
  if (element.children.length === 0 && element.textContent?.trim()) {
    const text = escapeJsx(element.textContent.trim());
    return `${spaces}<${tagName}${attrs}>${text}</${tagName}>`;
  }
  
  // Check if element is empty
  if (element.children.length === 0 && !element.textContent?.trim()) {
    return `${spaces}<${tagName}${attrs} />`;
  }
  
  // Build children
  const children: string[] = [];
  
  for (const child of element.childNodes) {
    if (child.nodeType === Node.TEXT_NODE) {
      const text = child.textContent?.trim();
      if (text) {
        children.push(`${spaces}  ${escapeJsx(text)}`);
      }
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      children.push(elementToJsx(child as Element, indent + 1));
    }
  }
  
  if (children.length === 0) {
    return `${spaces}<${tagName}${attrs} />`;
  }
  
  return `${spaces}<${tagName}${attrs}>\n${children.join('\n')}\n${spaces}</${tagName}>`;
}

/**
 * Build JSX attributes from element
 */
function buildAttributes(element: Element, additionalStyles?: Record<string, string>): string {
  const attrs: string[] = [];
  
  // Get computed styles for this element
  let computedStyles: Record<string, string> = {};
  
  // If this is the root element and we have additional styles, use them
  if (additionalStyles && Object.keys(additionalStyles).length > 0) {
    computedStyles = { ...additionalStyles };
  }
  
  // Get inline styles from the element
  const inlineStyle = element.getAttribute('style');
  if (inlineStyle) {
    const parsed = parseInlineStyle(inlineStyle);
    computedStyles = { ...computedStyles, ...parsed };
  }
  
  // Handle class -> className
  const className = element.getAttribute('class');
  if (className) {
    attrs.push(`className="${className}"`);
  }
  
  // Handle other attributes
  for (const attr of element.attributes) {
    const name = attr.name;
    const value = attr.value;
    
    // Skip class (handled above) and style (handled below)
    if (name === 'class' || name === 'style') continue;
    
    // Convert HTML attributes to JSX
    const jsxName = htmlAttrToJsx(name);
    
    // Handle boolean attributes
    if (value === '' || value === name) {
      attrs.push(jsxName);
    } else {
      attrs.push(`${jsxName}="${escapeJsx(value)}"`);
    }
  }
  
  // Add style object if we have styles
  if (Object.keys(computedStyles).length > 0) {
    const styleObj = formatStyleObject(computedStyles);
    attrs.push(`style={${styleObj}}`);
  }
  
  return attrs.length > 0 ? ' ' + attrs.join(' ') : '';
}

/**
 * Parse inline style string to object
 */
function parseInlineStyle(style: string): Record<string, string> {
  const styles: Record<string, string> = {};
  
  style.split(';').forEach(declaration => {
    const [prop, value] = declaration.split(':').map(s => s.trim());
    if (prop && value) {
      // Convert CSS property to camelCase
      const camelProp = prop.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
      styles[camelProp] = value;
    }
  });
  
  return styles;
}

/**
 * Format style object for JSX
 */
function formatStyleObject(styles: Record<string, string>): string {
  const entries = Object.entries(styles).map(([key, value]) => {
    // Handle numeric values
    if (/^\d+$/.test(value)) {
      return `${key}: ${value}`;
    }
    return `${key}: "${value}"`;
  });
  
  if (entries.length <= 3) {
    return `{ ${entries.join(', ')} }`;
  }
  
  return `{\n            ${entries.join(',\n            ')}\n          }`;
}

/**
 * Convert HTML attribute name to JSX
 */
function htmlAttrToJsx(attr: string): string {
  const conversions: Record<string, string> = {
    'for': 'htmlFor',
    'class': 'className',
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
    'formenctype': 'formEncType',
    'formmethod': 'formMethod',
    'formnovalidate': 'formNoValidate',
    'formtarget': 'formTarget',
    'marginheight': 'marginHeight',
    'marginwidth': 'marginWidth',
    'novalidate': 'noValidate',
    'usemap': 'useMap',
    'srcset': 'srcSet',
    'datetime': 'dateTime',
    'crossorigin': 'crossOrigin',
    'inputmode': 'inputMode',
  };
  
  return conversions[attr.toLowerCase()] || attr;
}

/**
 * Escape special characters for JSX
 */
function escapeJsx(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/{/g, '&#123;')
    .replace(/}/g, '&#125;');
}
