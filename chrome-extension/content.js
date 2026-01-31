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
  
  showNotification('Selection Mode Active', 'Hover over an element and click to capture');
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
  
  // Capture the element
  captureElement(selectedElement);
  
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
 * Capture element and all its properties
 */
async function captureElement(element) {
  showNotification('Capturing...', 'Analyzing element structure and styles');
  
  try {
    // Get computed styles
    const computedStyle = window.getComputedStyle(element);
    
    // Capture data with robust error handling for each section
    const capturedData = {
      // HTML Structure
      html: element.outerHTML,
      innerHTML: element.innerHTML,
      tagName: element.tagName.toLowerCase(),
      
      // Classes and IDs
      className: element.className || '',
      id: element.id || '',
      
      // Computed Styles (safe)
      styles: safeExtract(() => extractAllStyles(element, computedStyle), {}),
      
      // Layout Properties (safe)
      layout: safeExtract(() => extractLayoutProperties(element, computedStyle), {}),
      
      // Typography (safe)
      typography: safeExtract(() => extractTypography(element, computedStyle), {}),
      
      // Colors (safe)
      colors: safeExtract(() => extractColors(element, computedStyle), {}),
      
      // Images (safe)
      images: safeExtract(() => extractImages(element), []),
      
      // Text Content (safe)
      textContent: safeExtract(() => extractTextContent(element), { allText: '', textNodes: [], headings: [] }),
      
      // Responsive Breakpoints (safe - this was causing the error)
      responsive: await safeExtract(() => extractResponsiveStyles(element), {
        currentViewport: { width: window.innerWidth, height: window.innerHeight },
        currentStyles: {},
        mediaQueries: []
      }),
      
      // Animations (safe)
      animations: safeExtract(() => extractAnimations(element, computedStyle), {}),
      
      // Dimensions
      dimensions: {
        width: element.offsetWidth,
        height: element.offsetHeight,
        scrollWidth: element.scrollWidth,
        scrollHeight: element.scrollHeight,
        boundingRect: element.getBoundingClientRect()
      },
      
      // Children count
      childrenCount: element.children.length,
      
      // Page URL
      pageUrl: window.location.href,
      
      // Timestamp
      timestamp: new Date().toISOString()
    };
    
    console.log('Capture successful, sending to background...', capturedData);
    
    // Send to background script for processing
    chrome.runtime.sendMessage({
      action: 'elementCaptured',
      data: capturedData
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Failed to send to background:', chrome.runtime.lastError);
        showNotification('Capture Failed', 'Could not communicate with extension');
      } else {
        console.log('Successfully sent to background');
      }
    });
    
    showNotification('Capture Complete!', 'Processing React component...');
    
  } catch (error) {
    console.error('Capture error:', error);
    showNotification('Capture Failed', error.message);
  }
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
