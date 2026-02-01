/**
 * Grab AI - Content Script
 * Runs on every webpage to enable element selection and capture
 */

let isSelectionMode = false;
let hoveredElement = null;
let selectedElement = null;
let overlay = null;

// Initialize extension
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'startCapture') {
    startSelectionMode();
    sendResponse({ success: true });
  } else if (message.action === 'stopCapture') {
    stopSelectionMode();
    sendResponse({ success: true });
  }
  return true;
});

/**
 * Start element selection mode
 */
function startSelectionMode() {
  if (isSelectionMode) return;
  
  isSelectionMode = true;
  document.body.style.cursor = 'crosshair';
  
  // Create overlay
  createOverlay();
  
  // Add event listeners
  document.addEventListener('mouseover', handleMouseOver, true);
  document.addEventListener('mouseout', handleMouseOut, true);
  document.addEventListener('click', handleClick, true);
  document.addEventListener('keydown', handleKeyDown, true);
  
  showNotification('Selection Mode Active', 'Click an element to capture its section');
}

/**
 * Stop element selection mode
 */
function stopSelectionMode() {
  if (!isSelectionMode) return;
  
  isSelectionMode = false;
  document.body.style.cursor = '';
  
  // Remove overlay
  if (overlay) {
    overlay.remove();
    overlay = null;
  }
  
  // Remove event listeners
  document.removeEventListener('mouseover', handleMouseOver, true);
  document.removeEventListener('mouseout', handleMouseOut, true);
  document.removeEventListener('click', handleClick, true);
  document.removeEventListener('keydown', handleKeyDown, true);
  
  hoveredElement = null;
  selectedElement = null;
}

/**
 * Create selection overlay
 */
function createOverlay() {
  overlay = document.createElement('div');
  overlay.id = 'grab-ai-overlay';
  overlay.style.cssText = `
    position: absolute;
    pointer-events: none;
    border: 2px solid #3B82F6;
    background: rgba(59, 130, 246, 0.1);
    z-index: 999999;
    transition: all 0.1s ease;
  `;
  document.body.appendChild(overlay);
}

/**
 * Handle mouse over element
 */
function handleMouseOver(e) {
  if (!isSelectionMode) return;
  
  e.preventDefault();
  e.stopPropagation();
  
  hoveredElement = e.target;
  
  if (overlay && hoveredElement) {
    const rect = hoveredElement.getBoundingClientRect();
    overlay.style.top = `${rect.top + window.scrollY}px`;
    overlay.style.left = `${rect.left + window.scrollX}px`;
    overlay.style.width = `${rect.width}px`;
    overlay.style.height = `${rect.height}px`;
    overlay.style.display = 'block';
  }
}

/**
 * Handle mouse out of element
 */
function handleMouseOut(e) {
  if (!isSelectionMode) return;
  hoveredElement = null;
}

/**
 * Handle element click (capture)
 */
function handleClick(e) {
  if (!isSelectionMode) return;
  
  e.preventDefault();
  e.stopPropagation();
  
  selectedElement = e.target;
  const captureTarget = getCaptureTarget(selectedElement);
  
  // Capture the target (section/container when possible)
  captureElement(captureTarget);
  
  // Stop selection mode
  stopSelectionMode();
}

/**
 * Handle ESC key to cancel
 */
function handleKeyDown(e) {
  if (e.key === 'Escape' && isSelectionMode) {
    stopSelectionMode();
    showNotification('Capture Cancelled', 'Selection mode ended');
  }
}

/**
 * Pick the best capture target for dynamic sections
 * Prefers Shopify sections or obvious layout containers
 */
function getCaptureTarget(element) {
  if (!element) return element;

  // Shopify section wrapper by id or class
  const shopifySection = element.closest('[id^="shopify-section-"], .shopify-section, [data-section-id]');
  if (shopifySection) return shopifySection;

  // Common layout containers
  const layoutContainer = element.closest('section, main, header, footer, article, .container, .page-width, .wrapper, .content');
  if (layoutContainer) return layoutContainer;

  return element;
}

/**
 * Capture element and INSTANTLY convert to React - NO AI, NO SERVER!
 * Just like htmltoreact.app - pure browser-side conversion
 */
async function captureElement(element) {
  showNotification('Capturing...', 'Converting to React instantly...');
  
  try {
    // Step 1: Extract original CSS rules (including media queries) from the page
    const extractedCSS = extractOriginalCSS(element);
    console.log('✅ Extracted CSS rules:', extractedCSS.length, 'characters');
    
    // Step 2: Convert HTML with inline styles
    const htmlWithInlineStyles = convertToInlineStyles(element);
    
    // Step 3: INSTANT conversion to React (NO AI, NO SERVER!)
    const reactCode = convertHtmlToReact(htmlWithInlineStyles, element.tagName.toLowerCase(), extractedCSS);
    
    console.log('✅ Instant React conversion complete!');
    console.log('   Code length:', reactCode.length);
    
    // Step 3: Send React code to background for clipboard
    chrome.runtime.sendMessage({
      action: 'elementCaptured',
      data: {
        // The converted React code (ready to use!)
        reactCode: reactCode,
        
        // Original HTML for reference
        html: htmlWithInlineStyles,
        originalHtml: element.outerHTML,
        tagName: element.tagName.toLowerCase(),
        
        // Metadata
        className: element.className || '',
        id: element.id || '',
        dimensions: {
          width: element.offsetWidth,
          height: element.offsetHeight
        },
        pageUrl: window.location.href,
        timestamp: new Date().toISOString()
      }
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Failed to send to background:', chrome.runtime.lastError);
        showNotification('Capture Failed', 'Could not communicate with extension');
      } else {
        console.log('Successfully sent to background');
      }
    });
    
    showNotification('✅ React Code Ready!', 'Click extension to copy');
    
  } catch (error) {
    console.error('Capture error:', error);
    showNotification('Capture Failed', error.message);
  }
}

/**
 * Extract original CSS rules from the page's stylesheets
 * Including media queries for responsive behavior
 */
function extractOriginalCSS(element) {
  const classNames = new Set();
  const ids = new Set();
  
  // Collect all class names and IDs from element and its children
  function collectSelectors(el) {
    if (el.className && typeof el.className === 'string') {
      el.className.split(/\s+/).forEach(cls => {
        if (cls) classNames.add(cls);
      });
    }
    if (el.id) {
      ids.add(el.id);
    }
    // Process children
    for (const child of el.children || []) {
      collectSelectors(child);
    }
  }
  collectSelectors(element);
  
  console.log('Collecting CSS for classes:', [...classNames].slice(0, 10), '...');
  
  const cssRules = [];
  const mediaQueries = {};
  
  // Process all stylesheets
  for (const sheet of document.styleSheets) {
    try {
      // Skip cross-origin stylesheets
      if (!sheet.cssRules) continue;
      
      for (const rule of sheet.cssRules) {
        try {
          // Handle regular style rules
          if (rule.type === CSSRule.STYLE_RULE) {
            const selector = rule.selectorText;
            // Check if this rule matches any of our classes or IDs
            const matchesClass = [...classNames].some(cls => 
              selector.includes('.' + cls) || selector.includes('.' + cls + ' ') ||
              selector.includes('.' + cls + ':') || selector.includes('.' + cls + ',') ||
              selector.includes('.' + cls + '[') || selector.endsWith('.' + cls)
            );
            const matchesId = [...ids].some(id => selector.includes('#' + id));
            
            if (matchesClass || matchesId) {
              cssRules.push(rule.cssText);
            }
          }
          
          // Handle media queries
          if (rule.type === CSSRule.MEDIA_RULE) {
            const mediaCondition = rule.conditionText || rule.media.mediaText;
            
            for (const innerRule of rule.cssRules) {
              if (innerRule.type === CSSRule.STYLE_RULE) {
                const selector = innerRule.selectorText;
                const matchesClass = [...classNames].some(cls => 
                  selector.includes('.' + cls) || selector.includes('.' + cls + ' ') ||
                  selector.includes('.' + cls + ':') || selector.includes('.' + cls + ',') ||
                  selector.includes('.' + cls + '[') || selector.endsWith('.' + cls)
                );
                const matchesId = [...ids].some(id => selector.includes('#' + id));
                
                if (matchesClass || matchesId) {
                  if (!mediaQueries[mediaCondition]) {
                    mediaQueries[mediaCondition] = [];
                  }
                  mediaQueries[mediaCondition].push(innerRule.cssText);
                }
              }
            }
          }
        } catch (ruleError) {
          // Skip individual rule errors
        }
      }
    } catch (sheetError) {
      // Skip cross-origin stylesheet errors
      console.log('Skipping stylesheet:', sheetError.message);
    }
  }
  
  // Build final CSS string
  let finalCSS = '';
  
  // Add regular rules
  if (cssRules.length > 0) {
    finalCSS += '/* Original CSS rules */\n';
    finalCSS += cssRules.join('\n');
    finalCSS += '\n\n';
  }
  
  // Add media queries
  for (const [condition, rules] of Object.entries(mediaQueries)) {
    if (rules.length > 0) {
      finalCSS += `@media ${condition} {\n`;
      finalCSS += '  ' + rules.join('\n  ');
      finalCSS += '\n}\n\n';
    }
  }
  
  return finalCSS;
}

/**
 * Convert raw HTML to valid JSX string
 * Based on your htmlToJSX logic + extended fixes
 */
function htmlToJSX(htmlString) {
  let jsx = htmlString;

  // Normalize URLs for modern browsers/canvas renderers
  // - Convert protocol-relative URLs to https
  // - Strip trailing size descriptors (e.g. "740w") from src/href
  // - Decode basic entities in URLs
  jsx = jsx.replace(/\s(src|href)=["']([^"']+)["']/gi, (match, attr, url) => {
    let cleaned = url
      .replace(/&amp;/g, '&')
      .replace(/&quot;?/g, '"')
      .trim();

    // Strip any trailing descriptors like "740w" or "2x"
    const firstToken = cleaned.split(/\s+/)[0];
    let normalized = firstToken;

    if (normalized.startsWith('//')) {
      normalized = `https:${normalized}`;
    }

    return ` ${attr}="${normalized}"`;
  });

  // ===== STEP 0: REMOVE INVALID ATTRIBUTES (must be first!) =====
  jsx = jsx.replace(/\s[a-zA-Z0-9_-]+:[a-zA-Z0-9_-]*="[^"]*"/g, '');

  const invalidAttrs = [
    'reveal-on-scroll', 'ap-revealvisibility', 'attached-image',
    'reveal', 'ap-loaded', 'ap-object-loaded', 'data-srcset',
    'data-aos', 'data-aos-delay', 'data-aos-duration',
    'x-data', 'x-show', 'x-bind', 'x-on', 'x-ref',
    'v-if', 'v-for', 'v-bind', 'v-on', 'v-model',
    'ng-if', 'ng-for', 'ng-bind', 'ng-model',
  ];
  invalidAttrs.forEach(attr => {
    jsx = jsx.replace(new RegExp(`\\s${attr}="[^"]*"`, 'gi'), '');
    jsx = jsx.replace(new RegExp(`\\s${attr}(?=[\\s>])`, 'gi'), '');
  });

  jsx = jsx.replace(/\s(ap|x|v|ng)-[a-zA-Z0-9_-]+="[^"]*"/g, '');
  jsx = jsx.replace(/\s(ap|x|v|ng)-[a-zA-Z0-9_-]+(?=[\s>])/g, '');
  jsx = jsx.replace(/\s[a-zA-Z_][a-zA-Z0-9_-]*=""/g, '');

  // Custom elements -> div (React doesn't accept unknown tags)
  jsx = jsx.replace(/<([a-z]+-[a-z0-9-]+)(\s|>)/gi, (match, tagName, after) => {
    return `<div data-original-tag="${tagName}"${after}`;
  });
  jsx = jsx.replace(/<\/([a-z]+-[a-z0-9-]+)>/gi, '</div>');

  // class → className
  jsx = jsx.replace(/\sclass=/g, ' className=');
  // for → htmlFor
  jsx = jsx.replace(/\sfor=/g, ' htmlFor=');
  // tabindex → tabIndex
  jsx = jsx.replace(/\stabindex=/g, ' tabIndex=');
  // readonly → readOnly
  jsx = jsx.replace(/\sreadonly/gi, ' readOnly');
  // maxlength → maxLength
  jsx = jsx.replace(/\smaxlength=/g, ' maxLength=');
  // colspan → colSpan
  jsx = jsx.replace(/\scolspan=/g, ' colSpan=');
  // rowspan → rowSpan
  jsx = jsx.replace(/\srowspan=/g, ' rowSpan=');
  // autocomplete → autoComplete
  jsx = jsx.replace(/\sautocomplete=/g, ' autoComplete=');
  // autofocus → autoFocus
  jsx = jsx.replace(/\sautofocus/gi, ' autoFocus');

  // SVG attributes - convert to camelCase
  jsx = jsx.replace(/\sclip-path=/g, ' clipPath=');
  jsx = jsx.replace(/\sfill-rule=/g, ' fillRule=');
  jsx = jsx.replace(/\sclip-rule=/g, ' clipRule=');
  jsx = jsx.replace(/\sstroke-width=/g, ' strokeWidth=');
  jsx = jsx.replace(/\sstroke-linecap=/g, ' strokeLinecap=');
  jsx = jsx.replace(/\sstroke-linejoin=/g, ' strokeLinejoin=');
  jsx = jsx.replace(/\sfont-family=/g, ' fontFamily=');
  jsx = jsx.replace(/\sfont-size=/g, ' fontSize=');
  jsx = jsx.replace(/\stext-anchor=/g, ' textAnchor=');
  jsx = jsx.replace(/\sdominant-baseline=/g, ' dominantBaseline=');
  jsx = jsx.replace(/\sstop-color=/g, ' stopColor=');
  jsx = jsx.replace(/\sstop-opacity=/g, ' stopOpacity=');
  jsx = jsx.replace(/\sfill-opacity=/g, ' fillOpacity=');
  jsx = jsx.replace(/\sstroke-opacity=/g, ' strokeOpacity=');
  jsx = jsx.replace(/\sstroke-dasharray=/g, ' strokeDasharray=');
  jsx = jsx.replace(/\sstroke-dashoffset=/g, ' strokeDashoffset=');

  // Self-closing tags
  const selfClosingTags = ['img', 'input', 'br', 'hr', 'meta', 'link', 'area', 'base', 'col', 'embed', 'param', 'source', 'track', 'wbr'];
  selfClosingTags.forEach(tag => {
    const regex = new RegExp(`<${tag}([^>]*?)(?<!/)>`, 'gi');
    jsx = jsx.replace(regex, `<${tag}$1 />`);
  });

  // inline style to JSX style object
  jsx = jsx.replace(/style="([^"]*)"/g, (match, styleStr) => {
    const styleObj = convertStyleStringToObject(styleStr);
    return `style={${styleObj}}`;
  });

  // boolean attributes
  jsx = jsx.replace(/\s(checked|disabled|selected|required|multiple|hidden)(?=[\s>])/gi, (match, attr) => {
    return ` ${attr}={true}`;
  });

  // comments → JSX comments
  jsx = jsx.replace(/<!--(.*?)-->/gs, '{/* $1 */}');

  // final cleanup
  jsx = jsx.replace(/\s[a-zA-Z_][a-zA-Z0-9_-]*=""/g, '');

  return jsx;
}

/**
 * Build React components from HTML using data-component / public: props
 * Inspired by html-to-react-components
 */
function buildReactComponentBundle(html, fallbackComponentName) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div id="__root__">${html}</div>`, 'text/html');
  const container = doc.getElementById('__root__');

  const componentDefs = new Map();

  const nodes = Array.from(container.querySelectorAll('[data-component]'));
  if (nodes.length === 0) {
    return {
      rootJsx: htmlToJSX(container.innerHTML),
      componentsCode: '',
    };
  }

  const getDepth = (node) => {
    let depth = 0;
    let current = node;
    while (current && current !== container) {
      depth += 1;
      current = current.parentElement;
    }
    return depth;
  };

  const sanitizeName = (name) => {
    if (!name) return 'Component';
    const cleaned = name
      .replace(/[^a-zA-Z0-9 _-]/g, ' ')
      .trim()
      .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''));
    const pascal = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    return /^[A-Za-z]/.test(pascal) ? pascal : `Component${pascal}`;
  };

  const sanitizePropName = (name) => {
    const cleaned = name
      .replace(/[^a-zA-Z0-9 _-]/g, ' ')
      .trim()
      .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''));
    const camel = cleaned.charAt(0).toLowerCase() + cleaned.slice(1);
    return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(camel) ? camel : `prop${camel.charAt(0).toUpperCase()}${camel.slice(1)}`;
  };

  const applyPublicPropsToNode = (node) => {
    const props = {};
    const attrs = Array.from(node.attributes);
    attrs.forEach((attr) => {
      if (!attr.name.startsWith('public:')) return;
      const rawName = attr.name.slice('public:'.length);
      const propName = sanitizePropName(rawName);
      const propValue = attr.value;

      // Use prop value placeholder on the actual attribute
      node.setAttribute(rawName, `__PROP__${propName}__`);
      node.removeAttribute(attr.name);
      props[propName] = propValue;
    });
    return props;
  };

  const replaceWithPlaceholder = (node, componentName, props) => {
    const placeholder = doc.createElement('component-placeholder');
    placeholder.setAttribute('data-component-name', componentName);
    Object.entries(props).forEach(([key, val]) => {
      placeholder.setAttribute(`data-prop-${key}`, val);
    });
    node.replaceWith(placeholder);
  };

  // Process deepest nodes first
  nodes.sort((a, b) => getDepth(b) - getDepth(a)).forEach((node) => {
    const rawName = node.getAttribute('data-component');
    const componentName = sanitizeName(rawName);

    const clone = node.cloneNode(true);
    clone.removeAttribute('data-component');
    const publicProps = applyPublicPropsToNode(clone);

    let componentJsx = htmlToJSX(clone.outerHTML);
    componentJsx = componentJsx.replace(/="__PROP__([A-Za-z0-9_$]+)__"/g, '={$1}');
    componentJsx = formatJsx(componentJsx);

    if (!componentDefs.has(componentName)) {
      componentDefs.set(componentName, {
        jsx: componentJsx,
        props: Object.keys(publicProps),
      });
    }

    replaceWithPlaceholder(node, componentName, publicProps);
  });

  let rootJsx = htmlToJSX(container.innerHTML);
  rootJsx = rootJsx.replace(/<component-placeholder([^>]*)><\/component-placeholder>/gi, (match, attrs) => {
    const attrMap = {};
    attrs.replace(/([a-zA-Z0-9:_-]+)="([^"]*)"/g, (m, key, value) => {
      attrMap[key] = value;
      return '';
    });
    const name = attrMap['data-component-name'] || fallbackComponentName;
    const propEntries = Object.entries(attrMap)
      .filter(([key]) => key.startsWith('data-prop-'))
      .map(([key, value]) => {
        const propName = key.replace('data-prop-', '');
        if (value === '' || value === 'true') return `${propName}={true}`;
        return `${propName}="${value}"`;
      });
    const propsStr = propEntries.length ? ` ${propEntries.join(' ')}` : '';
    return `<${name}${propsStr} />`;
  });

  return {
    rootJsx,
    componentsCode: Array.from(componentDefs.entries())
      .map(([name, def]) => {
        const propsList = def.props.length ? `{ ${def.props.join(', ')} }` : '';
        const args = def.props.length ? propsList : '';
        return `const ${name} = (${args}) => (\n${def.jsx}\n);\n`;
      })
      .join('\n'),
  };
}

/**
 * INSTANT HTML to React conversion - NO AI, NO SERVER!
 * Pure JavaScript conversion like htmltoreact.app
 */
function convertHtmlToReact(html, tagName, extractedCSS = '') {
  // Generate component name
  const componentName = 'Captured' + tagName.charAt(0).toUpperCase() + tagName.slice(1) + 'Section';

  // Convert HTML to JSX (supports data-component / public: props)
  const { rootJsx, componentsCode } = buildReactComponentBundle(html, componentName);

  // Format the JSX with proper indentation
  const formattedJsx = formatJsx(rootJsx);
  
  // Escape backticks and special chars in extracted CSS
  const escapedCSS = extractedCSS.replace(/\\/g, '\\\\').replace(/\`/g, '\\`').replace(/\$/g, '\\$');
  
  // Build the React component - functional component that works perfectly
  const reactCode = `import React from "react";

${componentsCode}
export default function ${componentName}() {
  return (
    <>
${formattedJsx}
      <style
        dangerouslySetInnerHTML={{
          __html: \`
html {
  -webkit-font-smoothing: antialiased;
  box-sizing: border-box;
}
body {
  -webkit-font-smoothing: antialiased;
  margin: 0px;
  box-sizing: border-box;
}
${escapedCSS}
\`,
        }}
      />
    </>
  );
}`;

  return reactCode;
}

/**
 * Convert CSS style string to React style object string
 * FIXED: Properly handles URL values with colons
 */
function convertStyleStringToObject(styleStr) {
  if (!styleStr || !styleStr.trim()) return '{}';
  
  const styles = [];
  
  // Special handling: Extract and protect URL values first
  const urlPlaceholders = [];
  let protectedStr = styleStr.replace(/url\([^)]+\)/g, (match) => {
    urlPlaceholders.push(match);
    return `__URL_PLACEHOLDER_${urlPlaceholders.length - 1}__`;
  });
  
  // Split by semicolon and process each declaration
  protectedStr.split(';').forEach(declaration => {
    // Find first colon only (not colons in URLs)
    const colonIndex = declaration.indexOf(':');
    if (colonIndex === -1) return;
    
    let prop = declaration.slice(0, colonIndex).trim();
    let value = declaration.slice(colonIndex + 1).trim();

    // Decode basic entities in style values
    value = value.replace(/&quot;?/g, '"').replace(/&amp;/g, '&');
    
    if (!prop || !value) return;
    
    // Skip invalid properties (starting with - or --)
    if (prop.startsWith('-')) return;
    
    // Skip vendor prefixes
    if (prop.startsWith('webkit') || prop.startsWith('moz') || prop.startsWith('ms')) return;
    
    // Convert CSS property to camelCase
    prop = prop.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
    
    // Restore URL placeholders
    value = value.replace(/__URL_PLACEHOLDER_(\d+)__/g, (match, index) => {
      let url = urlPlaceholders[parseInt(index)];
      // Clean up URL - remove HTML entities
      url = url.replace(/&quot;/g, '');
      url = url.replace(/&amp;/g, '&');
      // Ensure URL is properly formatted
      url = url.replace(/url\(([^)]+)\)/, (m, innerUrl) => {
        // Remove any existing quotes and re-add single quotes
        innerUrl = innerUrl.replace(/['"]/g, '').trim();
        return `url('${innerUrl}')`;
      });
      return url;
    });
    
    // Skip empty/invalid values
    if (
      value === '"' ||
      value === '""' ||
      /rgb\(\s*,\s*,\s*\)/i.test(value)
    ) {
      return;
    }

    // Handle numeric values (without quotes)
    if (/^-?\d+$/.test(value)) {
      styles.push(`${prop}: ${value}`);
    } else {
      // Escape double quotes in value
      value = value.replace(/"/g, '\\"');
      styles.push(`${prop}: "${value}"`);
    }
  });
  
  if (styles.length === 0) return '{}';
  
  // Format based on number of styles
  if (styles.length <= 3) {
    return `{ ${styles.join(', ')} }`;
  }
  
  return `{\n            ${styles.join(',\n            ')}\n          }`;
}

/**
 * Format JSX with proper indentation
 */
function formatJsx(jsx) {
  // Simple formatting - add base indentation
  const lines = jsx.split('\n');
  const formatted = lines.map(line => {
    const trimmed = line.trim();
    if (!trimmed) return '';
    return '    ' + trimmed;
  }).filter(line => line);
  
  return formatted.join('\n');
}

/**
 * Clean invalid attributes from an element before conversion
 * Removes attributes that would cause React errors
 */
function cleanInvalidAttributes(el) {
  if (!el || !el.attributes) return;
  
  const attrsToRemove = [];
  
  for (let i = 0; i < el.attributes.length; i++) {
    const attr = el.attributes[i];
    const name = attr.name.toLowerCase();
    
    // Remove attributes with colons (invalid in JSX)
    if (name.includes(':')) {
      attrsToRemove.push(attr.name);
      continue;
    }
    
    // Remove custom framework attributes
    if (name.startsWith('ap-') || name.startsWith('x-') || 
        name.startsWith('v-') || name.startsWith('ng-')) {
      attrsToRemove.push(attr.name);
      continue;
    }
    
    // Remove specific invalid attributes
    const invalidNames = ['reveal-on-scroll', 'reveal', 'attached-image', 'data-srcset'];
    if (invalidNames.includes(name)) {
      attrsToRemove.push(attr.name);
      continue;
    }
    
    // Remove empty attributes (except boolean ones)
    const booleanAttrs = ['checked', 'disabled', 'selected', 'required', 'multiple', 'hidden', 'readonly', 'autofocus'];
    if (attr.value === '' && !booleanAttrs.includes(name)) {
      attrsToRemove.push(attr.name);
    }
  }
  
  // Remove the attributes
  attrsToRemove.forEach(name => el.removeAttribute(name));
}

/**
 * Convert element to HTML with all computed styles INLINED
 * This is the key to exact cloning like htmltoreact.app
 */
function convertToInlineStyles(element) {
  // Clone the element to avoid modifying the original
  const clone = element.cloneNode(true);
  
  // KEEP <link rel="stylesheet"> tags - they load external CSS with responsive rules!
  // Don't remove them, they're essential for responsive behavior
  
  // Remove inline <style> tags - will be handled separately with dangerouslySetInnerHTML
  const styleTags = clone.querySelectorAll('style');
  const inlineStyles = [];
  styleTags.forEach(tag => {
    inlineStyles.push(tag.textContent);
    tag.remove();
  });
  
  // Store inline styles to be added back properly in React
  clone._inlineStylesContent = inlineStyles.join('\n');
  
  // Remove <script> tags for safety
  const scriptTags = clone.querySelectorAll('script');
  scriptTags.forEach(tag => tag.remove());
  
  // Clean invalid attributes from all elements
  cleanInvalidAttributes(clone);
  clone.querySelectorAll('*').forEach(el => cleanInvalidAttributes(el));
  
  // Process the root element
  applyInlineStyles(clone, element);
  
  // Process all children (skip removed elements)
  const cloneChildren = clone.querySelectorAll('*');
  const originalChildren = element.querySelectorAll('*:not(style):not(script)');
  
  // Build a map of original elements for matching
  const originalMap = new Map();
  originalChildren.forEach((el, idx) => {
    originalMap.set(idx, el);
  });
  
  let originalIdx = 0;
  for (let i = 0; i < cloneChildren.length; i++) {
    const cloneChild = cloneChildren[i];
    const tagName = cloneChild.tagName.toLowerCase();
    
    // Skip if it's a style or script tag
    if (tagName === 'style' || tagName === 'script') continue;
    
    // Find matching original element
    if (originalIdx < originalChildren.length) {
      applyInlineStyles(cloneChild, originalChildren[originalIdx]);
      originalIdx++;
    }
  }
  
  return clone.outerHTML;
}

/**
 * Apply computed styles as inline styles to an element
 * OPTIMIZED: Only capture visually important styles, skip defaults
 * RESPONSIVE: Skip fixed width/height for containers, use max-width
 */
function applyInlineStyles(cloneEl, originalEl) {
  try {
    const computed = window.getComputedStyle(originalEl);
    const tagName = originalEl.tagName.toLowerCase();
    
    // SVG elements - only capture relevant styles
    const isSvgElement = ['svg', 'path', 'circle', 'rect', 'line', 'polygon', 'polyline', 
                          'ellipse', 'g', 'defs', 'clippath', 'use', 'text', 'tspan'].includes(tagName);
    
    // Skip styling for these SVG sub-elements entirely
    if (['g', 'defs', 'clippath', 'path', 'circle', 'rect', 'line', 'polygon', 'ellipse'].includes(tagName)) {
      return;
    }
    
    // Container elements - should NOT have fixed width/height (for responsive)
    // Also include custom elements (with hyphens) as they're usually wrappers
    const isCustomElement = tagName.includes('-');
    const isContainer = ['div', 'section', 'article', 'header', 'footer', 'main', 'nav', 'aside'].includes(tagName) || isCustomElement;
    
    // Text elements should also not have fixed width (let them wrap naturally)
    const isTextElement = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'a', 'li', 'td', 'th', 'label'].includes(tagName);
    
    // Elements that SHOULD keep their dimensions
    const keepDimensions = ['img', 'video', 'canvas', 'iframe', 'svg'].includes(tagName);
    
    // Properties based on element type
    let essentialProps;
    
    if (isSvgElement) {
      essentialProps = ['width', 'height'];
    } else if (isContainer || isTextElement) {
      // RESPONSIVE: Containers and text elements don't get fixed width/height
      essentialProps = [
        'display', 'position',
        'max-width', // Keep max-width for containers
        'flex-direction', 'justify-content', 'align-items', 'flex-wrap', 'gap',
        'padding', 'margin',
        'font-family', 'font-size', 'font-weight', 'line-height', 'text-align', 'color',
        'background-color', 'background-image', 'background-size', 'background-position',
        'border-radius',
        'box-shadow', 'opacity'
      ];
    } else {
      // Other elements (buttons, links, text elements, etc.)
      essentialProps = [
        'display', 'position',
        'width', 'height', 'max-width',
        'flex-direction', 'justify-content', 'align-items', 'gap',
        'padding', 'margin',
        'font-family', 'font-size', 'font-weight', 'line-height', 'text-align', 'color',
        'background-color', 'background-image',
        'border-radius',
        'box-shadow', 'opacity'
      ];
    }
    
    const styleValues = [];
    
    for (const prop of essentialProps) {
      const value = computed.getPropertyValue(prop);
      
      if (!value) continue;
      
      // Skip common defaults
      const defaults = {
        'display': ['inline', 'block', 'inline-block'],
        'position': ['static'],
        'width': ['auto'],
        'height': ['auto'],
        'max-width': ['none'],
        'flex-direction': ['row'],
        'justify-content': ['normal', 'flex-start', 'start'],
        'align-items': ['normal', 'stretch'],
        'flex-wrap': ['nowrap'],
        'gap': ['normal', '0px'],
        'padding': ['0px'],
        'margin': ['0px'],
        'font-weight': ['400', 'normal'],
        'line-height': ['normal'],
        'text-align': ['start', 'left'],
        'color': ['rgb(0, 0, 0)'],
        'background-color': ['rgba(0, 0, 0, 0)', 'transparent'],
        'background-image': ['none'],
        'background-size': ['auto'],
        'background-position': ['0% 0%'],
        'border-radius': ['0px'],
        'box-shadow': ['none'],
        'opacity': ['1']
      };
      
      if (defaults[prop] && defaults[prop].includes(value)) continue;
      
      // Skip display:block for block elements
      if (prop === 'display' && value === 'block' && 
          ['div', 'section', 'article', 'header', 'footer', 'main', 'nav', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName)) {
        continue;
      }
      
      // Skip display:inline for inline elements
      if (prop === 'display' && value === 'inline' && 
          ['span', 'a', 'strong', 'em', 'b', 'i'].includes(tagName)) {
        continue;
      }
      
      // Fix background-image URLs
      let cleanValue = value;
      if (prop === 'background-image' && value.includes('url(')) {
        cleanValue = value.replace(/&quot;/g, '').replace(/&amp;/g, '&');
        cleanValue = cleanValue.replace(/url\(([^)]+)\)/, (match, url) => {
          url = url.replace(/['"]/g, '').trim();
          return `url('${url}')`;
        });
      }
      
      styleValues.push(`${prop}: ${cleanValue}`);
    }
    
    // RESPONSIVE: Add width: 100% and max-width: 100% for images
    if (keepDimensions && tagName === 'img') {
      // Remove fixed width/height, add responsive rules
      const newStyles = styleValues.filter(s => !s.startsWith('width:') && !s.startsWith('height:'));
      newStyles.push('width: 100%');
      newStyles.push('max-width: 100%');
      newStyles.push('height: auto');
      cloneEl.setAttribute('style', newStyles.join('; '));
      return;
    }
    
    // RESPONSIVE: SVG should have max-width
    if (tagName === 'svg') {
      styleValues.push('max-width: 100%');
      styleValues.push('height: auto');
    }
    
    if (styleValues.length > 0) {
      cloneEl.setAttribute('style', styleValues.join('; '));
    }
  } catch (e) {
    console.log('Could not apply styles to element:', e.message);
  }
}

/**
 * Extract computed styles for all child elements
 */
function extractAllChildStyles(element) {
  const childStyles = [];
  const children = element.querySelectorAll('*');
  
  for (let i = 0; i < children.length && i < 100; i++) { // Limit to 100 children
    const child = children[i];
    try {
      const computed = window.getComputedStyle(child);
      childStyles.push({
        index: i,
        tagName: child.tagName.toLowerCase(),
        className: child.className || '',
        styles: {
          display: computed.display,
          position: computed.position,
          width: computed.width,
          height: computed.height,
          padding: computed.padding,
          margin: computed.margin,
          color: computed.color,
          backgroundColor: computed.backgroundColor,
          fontSize: computed.fontSize,
          fontWeight: computed.fontWeight,
          fontFamily: computed.fontFamily
        }
      });
    } catch (e) {
      // Skip if can't get styles
    }
  }
  
  return childStyles;
}

/**
 * Safe extraction wrapper - returns default value if function throws
 */
function safeExtract(fn, defaultValue) {
  try {
    return fn();
  } catch (error) {
    console.log('Extraction skipped:', error.message);
    return defaultValue;
  }
}

/**
 * Extract all CSS styles
 */
function extractAllStyles(element, computedStyle) {
  const styles = {};
  
  // Get all computed style properties
  for (let i = 0; i < computedStyle.length; i++) {
    const prop = computedStyle[i];
    const value = computedStyle.getPropertyValue(prop);
    
    // Skip default values
    if (value && value !== 'none' && value !== 'auto' && value !== 'normal') {
      styles[prop] = value;
    }
  }
  
  return styles;
}

/**
 * Extract layout properties (flexbox, grid, positioning)
 */
function extractLayoutProperties(element, computedStyle) {
  return {
    display: computedStyle.display,
    position: computedStyle.position,
    top: computedStyle.top,
    right: computedStyle.right,
    bottom: computedStyle.bottom,
    left: computedStyle.left,
    
    // Flexbox
    flexDirection: computedStyle.flexDirection,
    justifyContent: computedStyle.justifyContent,
    alignItems: computedStyle.alignItems,
    flexWrap: computedStyle.flexWrap,
    gap: computedStyle.gap,
    
    // Grid
    gridTemplateColumns: computedStyle.gridTemplateColumns,
    gridTemplateRows: computedStyle.gridTemplateRows,
    gridGap: computedStyle.gridGap,
    
    // Spacing
    margin: computedStyle.margin,
    marginTop: computedStyle.marginTop,
    marginRight: computedStyle.marginRight,
    marginBottom: computedStyle.marginBottom,
    marginLeft: computedStyle.marginLeft,
    
    padding: computedStyle.padding,
    paddingTop: computedStyle.paddingTop,
    paddingRight: computedStyle.paddingRight,
    paddingBottom: computedStyle.paddingBottom,
    paddingLeft: computedStyle.paddingLeft,
    
    // Size
    width: computedStyle.width,
    height: computedStyle.height,
    maxWidth: computedStyle.maxWidth,
    maxHeight: computedStyle.maxHeight,
    minWidth: computedStyle.minWidth,
    minHeight: computedStyle.minHeight,
    
    // Overflow
    overflow: computedStyle.overflow,
    overflowX: computedStyle.overflowX,
    overflowY: computedStyle.overflowY
  };
}

/**
 * Extract typography properties
 */
function extractTypography(element, computedStyle) {
  return {
    fontFamily: computedStyle.fontFamily,
    fontSize: computedStyle.fontSize,
    fontWeight: computedStyle.fontWeight,
    fontStyle: computedStyle.fontStyle,
    lineHeight: computedStyle.lineHeight,
    letterSpacing: computedStyle.letterSpacing,
    textAlign: computedStyle.textAlign,
    textTransform: computedStyle.textTransform,
    textDecoration: computedStyle.textDecoration,
    whiteSpace: computedStyle.whiteSpace,
    wordSpacing: computedStyle.wordSpacing
  };
}

/**
 * Extract color properties
 */
function extractColors(element, computedStyle) {
  return {
    color: computedStyle.color,
    backgroundColor: computedStyle.backgroundColor,
    borderColor: computedStyle.borderColor,
    outlineColor: computedStyle.outlineColor,
    
    // Convert to hex if possible
    colorHex: rgbToHex(computedStyle.color),
    backgroundColorHex: rgbToHex(computedStyle.backgroundColor)
  };
}

/**
 * Extract all images from element
 */
function extractImages(element) {
  const images = [];
  
  // Direct img tags
  const imgTags = element.querySelectorAll('img');
  imgTags.forEach(img => {
    images.push({
      type: 'img',
      src: img.src,
      alt: img.alt,
      width: img.width,
      height: img.height,
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
      loading: img.loading,
      classList: Array.from(img.classList)
    });
  });
  
  // Background images
  const allElements = [element, ...element.querySelectorAll('*')];
  allElements.forEach(el => {
    const bgImage = window.getComputedStyle(el).backgroundImage;
    if (bgImage && bgImage !== 'none') {
      const urlMatch = bgImage.match(/url\(['"]?([^'"]+)['"]?\)/);
      if (urlMatch) {
        images.push({
          type: 'background',
          src: urlMatch[1],
          element: el.tagName.toLowerCase(),
          classList: Array.from(el.classList)
        });
      }
    }
  });
  
  return images;
}

/**
 * Extract text content with structure
 */
function extractTextContent(element) {
  const textNodes = [];
  
  // Get all text nodes
  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT,
    null,
    false
  );
  
  let node;
  while (node = walker.nextNode()) {
    const text = node.textContent.trim();
    if (text) {
      const parent = node.parentElement;
      textNodes.push({
        text: text,
        tagName: parent.tagName.toLowerCase(),
        className: parent.className,
        computedStyle: {
          fontSize: window.getComputedStyle(parent).fontSize,
          fontWeight: window.getComputedStyle(parent).fontWeight,
          color: window.getComputedStyle(parent).color
        }
      });
    }
  }
  
  // Headings
  const headings = [];
  element.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(heading => {
    headings.push({
      level: heading.tagName.toLowerCase(),
      text: heading.textContent.trim(),
      className: heading.className
    });
  });
  
  return {
    allText: element.textContent.trim(),
    textNodes: textNodes,
    headings: headings
  };
}

/**
 * Extract responsive styles (media queries)
 */
async function extractResponsiveStyles(element) {
  try {
    const breakpoints = {
      mobile: { width: 375, height: 667 },
      tablet: { width: 768, height: 1024 },
      desktop: { width: 1920, height: 1080 }
    };
    
    const responsiveData = {};
    
    // Get current computed styles as baseline
    const currentStyles = window.getComputedStyle(element);
    
    // Capture current viewport info
    responsiveData.currentViewport = {
      width: window.innerWidth,
      height: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio
    };
    
    responsiveData.currentStyles = {
      display: currentStyles.display,
      width: currentStyles.width,
      flexDirection: currentStyles.flexDirection,
      gridTemplateColumns: currentStyles.gridTemplateColumns
    };
    
    // Extract media query rules from stylesheets (may be empty due to CORS)
    responsiveData.mediaQueries = extractMediaQueries(element);
    
    return responsiveData;
  } catch (error) {
    // If any error occurs, return minimal responsive data
    return {
      currentViewport: {
        width: window.innerWidth,
        height: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio
      },
      currentStyles: {},
      mediaQueries: []
    };
  }
}

/**
 * Extract media queries from stylesheets
 */
function extractMediaQueries(element) {
  const mediaQueries = [];
  
  try {
    const sheets = document.styleSheets;
    
    for (let sheet of sheets) {
      try {
        // Skip external stylesheets that will cause CORS errors
        if (sheet.href && !sheet.href.startsWith(window.location.origin)) {
          continue; // Skip cross-origin stylesheets silently
        }
        
        const rules = sheet.cssRules || sheet.rules;
        if (!rules) continue;
        
        for (let rule of rules) {
          if (rule.type === CSSRule.MEDIA_RULE) {
            mediaQueries.push({
              media: rule.media.mediaText,
              rules: Array.from(rule.cssRules).map(r => r.cssText)
            });
          }
        }
      } catch (e) {
        // CORS or other access issues - skip silently
        // This is expected for external stylesheets
        continue;
      }
    }
  } catch (e) {
    // If any error occurs, return empty array instead of breaking
    console.log('Media query extraction skipped due to security restrictions');
  }
  
  return mediaQueries;
}

/**
 * Extract animations and transitions
 */
function extractAnimations(element, computedStyle) {
  return {
    transition: computedStyle.transition,
    transitionProperty: computedStyle.transitionProperty,
    transitionDuration: computedStyle.transitionDuration,
    transitionTimingFunction: computedStyle.transitionTimingFunction,
    transitionDelay: computedStyle.transitionDelay,
    
    animation: computedStyle.animation,
    animationName: computedStyle.animationName,
    animationDuration: computedStyle.animationDuration,
    animationTimingFunction: computedStyle.animationTimingFunction,
    animationDelay: computedStyle.animationDelay,
    animationIterationCount: computedStyle.animationIterationCount,
    animationDirection: computedStyle.animationDirection,
    animationFillMode: computedStyle.animationFillMode,
    
    transform: computedStyle.transform,
    transformOrigin: computedStyle.transformOrigin
  };
}

/**
 * Convert RGB to Hex
 */
function rgbToHex(rgb) {
  if (!rgb || rgb === 'transparent') return null;
  
  const match = rgb.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)$/);
  if (!match) return null;
  
  const r = parseInt(match[1]);
  const g = parseInt(match[2]);
  const b = parseInt(match[3]);
  
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

/**
 * Show notification to user
 */
function showNotification(title, message) {
  // Remove existing notification
  const existing = document.getElementById('grab-ai-notification');
  if (existing) existing.remove();
  
  const notification = document.createElement('div');
  notification.id = 'grab-ai-notification';
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: white;
    border: 2px solid #3B82F6;
    border-radius: 8px;
    padding: 16px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 9999999;
    max-width: 300px;
    animation: slideIn 0.3s ease;
  `;
  
  notification.innerHTML = `
    <div style="font-weight: bold; color: #1F2937; margin-bottom: 4px;">${title}</div>
    <div style="color: #6B7280; font-size: 14px;">${message}</div>
  `;
  
  document.body.appendChild(notification);
  
  // Auto remove after 3 seconds
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
`;
document.head.appendChild(style);
