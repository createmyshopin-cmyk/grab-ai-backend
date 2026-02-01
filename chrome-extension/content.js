/**
 * PRODUCTION-READY: Universal HTML to React JSX Capture Extension
 * Captures ANY website section with ALL raw data (HTML, CSS, styles)
 * Converts to clean, canvas-compatible React JSX component
 */

let isSelectionMode = false;
let hoveredElement = null;
let selectedElement = null;
let overlay = null;
let breadcrumbBar = null;
let previewModal = null;

// Smart Parent Selector state
let elementHierarchy = [];
let currentHierarchyLevel = 0;

// Visual Preview state
let pendingCaptureElement = null;
let capturedScreenshot = null;

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
  
  showNotification('Capture Mode Active', 'Click any section to capture');
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
  
  // Remove breadcrumb
  if (breadcrumbBar) {
    breadcrumbBar.remove();
    breadcrumbBar = null;
  }
  
  // Remove event listeners
  document.removeEventListener('mouseover', handleMouseOver, true);
  document.removeEventListener('mouseout', handleMouseOut, true);
  document.removeEventListener('click', handleClick, true);
  document.removeEventListener('keydown', handleKeyDown, true);
  
  hoveredElement = null;
  elementHierarchy = [];
  currentHierarchyLevel = 0;
}

/**
 * Create visual overlay for selection
 */
function createOverlay() {
  overlay = document.createElement('div');
  overlay.id = 'grab-ai-overlay';
  overlay.style.cssText = `
    position: absolute;
    border: 3px solid #4CAF50;
    background: rgba(76, 175, 80, 0.1);
    pointer-events: none;
    z-index: 999999;
    transition: all 0.1s ease;
  `;
  document.body.appendChild(overlay);
  
  // Create breadcrumb bar for hierarchy navigation
  createBreadcrumbBar();
}

/**
 * Create breadcrumb bar showing element hierarchy
 */
function createBreadcrumbBar() {
  breadcrumbBar = document.createElement('div');
  breadcrumbBar.id = 'grab-ai-breadcrumb';
  breadcrumbBar.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.9);
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 13px;
    z-index: 1000000;
    pointer-events: none;
    display: none;
    max-width: 80%;
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
  `;
  document.body.appendChild(breadcrumbBar);
}

/**
 * Update overlay position
 */
function updateOverlay(element) {
  if (!overlay || !element) return;
  
  const rect = element.getBoundingClientRect();
  overlay.style.top = `${rect.top + window.scrollY}px`;
  overlay.style.left = `${rect.left + window.scrollX}px`;
  overlay.style.width = `${rect.width}px`;
  overlay.style.height = `${rect.height}px`;
  overlay.style.display = 'block';
}

/**
 * Handle mouse over element
 */
function handleMouseOver(e) {
  if (!isSelectionMode) return;
  
  // Ignore hover on preview modal
  if (previewModal && (e.target === previewModal || previewModal.contains(e.target))) {
    return;
  }
  
  e.stopPropagation();
  hoveredElement = e.target;
  
  // Build element hierarchy
  buildElementHierarchy(hoveredElement);
  currentHierarchyLevel = 0;
  
  // Update UI
  updateOverlay(elementHierarchy[currentHierarchyLevel]);
  updateBreadcrumb();
}

/**
 * Build element hierarchy from current element to body
 */
function buildElementHierarchy(element) {
  elementHierarchy = [];
  let current = element;
  
  // Traverse up to body (but not including body/html)
  while (current && current !== document.body && current !== document.documentElement) {
    elementHierarchy.push(current);
    current = current.parentElement;
  }
  
  // Add body as last option if we have elements
  if (elementHierarchy.length > 0 && document.body) {
    elementHierarchy.push(document.body);
  }
  
  // Auto-detect best capture level (section, container, card)
  autoDetectBestLevel();
}

/**
 * Auto-detect best capture level based on semantic containers
 */
function autoDetectBestLevel() {
  let bestLevel = 0;
  let bestScore = 0;
  
  // Score each level based on semantic value
  elementHierarchy.forEach((el, index) => {
    const score = calculateElementScore(el);
    
    if (score > bestScore) {
      bestScore = score;
      bestLevel = index;
    }
  });
  
  // Auto-select best level if it's not the first element
  if (bestLevel > 0 && bestScore >= 50) {
    currentHierarchyLevel = bestLevel;
    console.log('🎯 Auto-selected:', getElementName(elementHierarchy[bestLevel]), 'Score:', bestScore);
  }
}

/**
 * Calculate semantic score for element
 * Higher score = better capture target
 */
function calculateElementScore(element) {
  let score = 0;
  const tag = element.tagName.toLowerCase();
  const className = element.className || '';
  const id = element.id || '';
  
  // Semantic HTML tags (HIGH priority)
  if (tag === 'section') score += 100;
  if (tag === 'article') score += 90;
  if (tag === 'header') score += 80;
  if (tag === 'footer') score += 80;
  if (tag === 'aside') score += 70;
  if (tag === 'main') score += 95;
  if (tag === 'nav') score += 85;
  
  // Common container classes (MEDIUM-HIGH priority)
  const containerPatterns = [
    /\bcard\b/i,           // card, product-card, pricing-card
    /\bcontainer\b/i,      // container, main-container
    /\bwrapper\b/i,        // wrapper, page-wrapper
    /\bsection\b/i,        // hero-section, about-section
    /\bcomponent\b/i,      // component, ui-component
    /\bmodule\b/i,         // module, content-module
    /\bblock\b/i,          // block, feature-block
    /\bpanel\b/i,          // panel, info-panel
    /\bwidget\b/i,         // widget, sidebar-widget
    /\bbox\b/i,            // box, info-box
  ];
  
  containerPatterns.forEach(pattern => {
    if (pattern.test(className)) score += 60;
    if (pattern.test(id)) score += 55;
  });
  
  // Specific component types (HIGH priority)
  const componentPatterns = [
    /\bhero\b/i,           // hero, hero-section
    /\bbanner\b/i,         // banner, top-banner
    /\bproduct\b/i,        // product, product-card
    /\bpricing\b/i,        // pricing, pricing-table
    /\btestimonial\b/i,    // testimonial, testimonial-card
    /\bfeature\b/i,        // feature, feature-box
    /\bcta\b/i,            // cta, cta-section
    /\bgrid\b/i,           // grid, product-grid
    /\blist\b/i,           // list, item-list
    /\bcarousel\b/i,       // carousel, image-carousel
  ];
  
  componentPatterns.forEach(pattern => {
    if (pattern.test(className)) score += 80;
    if (pattern.test(id)) score += 75;
  });
  
  // Shopify-specific (VERY HIGH priority)
  const shopifyPatterns = [
    /\bshopify-section\b/i,
    /\bsection--/i,
    /\btemplate--/i,
    /\bpage-width\b/i,
  ];
  
  shopifyPatterns.forEach(pattern => {
    if (pattern.test(className)) score += 120;
  });
  
  // Data attributes (indicators of semantic meaning)
  if (element.hasAttribute('data-section-id')) score += 100;
  if (element.hasAttribute('data-section-type')) score += 100;
  if (element.hasAttribute('data-component')) score += 70;
  if (element.hasAttribute('data-module')) score += 70;
  
  // Size heuristics (reasonable component size)
  const rect = element.getBoundingClientRect();
  const width = rect.width;
  const height = rect.height;
  
  // Prefer elements with reasonable size (not too small, not whole page)
  if (width >= 200 && width <= 2000) score += 20;
  if (height >= 100 && height <= 1500) score += 20;
  
  // Penalize very small elements (buttons, icons)
  if (width < 100 || height < 50) score -= 30;
  
  // Penalize very large elements (likely whole page)
  if (width > 2500 || height > 2000) score -= 40;
  
  // Child count heuristics
  const childCount = element.children.length;
  
  // Prefer elements with a good number of children
  if (childCount >= 3 && childCount <= 20) score += 15;
  if (childCount >= 5 && childCount <= 15) score += 10; // Sweet spot
  
  // Penalize leaf elements (too granular)
  if (childCount === 0) score -= 20;
  
  // Penalize elements with too many children (too broad)
  if (childCount > 50) score -= 25;
  
  return score;
}

/**
 * Update breadcrumb bar showing hierarchy
 */
function updateBreadcrumb() {
  if (!breadcrumbBar || elementHierarchy.length === 0) return;
  
  breadcrumbBar.style.display = 'block';
  
  const current = elementHierarchy[currentHierarchyLevel];
  const elementName = getElementName(current);
  const elementScore = calculateElementScore(current);
  
  // Determine if this is a recommended capture level
  const isRecommended = elementScore >= 50;
  const recommendationIcon = isRecommended ? '⭐' : '';
  const recommendationText = isRecommended ? ' (Recommended)' : '';
  
  // Build breadcrumb HTML
  let html = '<div style="display: flex; flex-direction: column; gap: 8px;">';
  
  // Current selection with recommendation
  html += `<div style="display: flex; align-items: center; gap: 8px;">
    <span style="color: #4CAF50; font-weight: 600;">●</span>
    <span style="font-weight: 600;">${elementName}</span>
    ${isRecommended ? `<span style="color: #FCD34D; font-size: 12px;" title="Good capture target">${recommendationIcon}</span>` : ''}
    ${isRecommended ? `<span style="font-size: 10px; color: #10B981; background: rgba(16, 185, 129, 0.1); padding: 2px 6px; border-radius: 4px;">✓ Good target</span>` : ''}
  </div>`;
  
  // Show hierarchy (up to 4 levels)
  if (elementHierarchy.length > 1) {
    html += '<div style="font-size: 11px; opacity: 0.7; display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">';
    html += '<span style="white-space: nowrap;">↑/↓ to navigate:</span>';
    
    for (let i = 0; i < Math.min(5, elementHierarchy.length); i++) {
      const el = elementHierarchy[i];
      const name = getElementName(el);
      const score = calculateElementScore(el);
      const isCurrent = i === currentHierarchyLevel;
      const isGoodTarget = score >= 50;
      
      if (isCurrent) {
        html += `<span style="color: #4CAF50; font-weight: 600; white-space: nowrap;">${name}</span>`;
      } else if (isGoodTarget) {
        html += `<span style="opacity: 0.7; color: #FCD34D; white-space: nowrap;" title="Score: ${score}">${name}⭐</span>`;
      } else {
        html += `<span style="opacity: 0.5; white-space: nowrap;">${name}</span>`;
      }
      
      if (i < Math.min(4, elementHierarchy.length - 1)) {
        html += '<span style="opacity: 0.3;">→</span>';
      }
    }
    html += '</div>';
  }
  
  // Smart suggestions
  const suggestions = getSmartSuggestions();
  if (suggestions.length > 0) {
    html += '<div style="font-size: 10px; color: #93C5FD; margin-top: 4px;">';
    html += `💡 ${suggestions[0]}`;
    html += '</div>';
  }
  
  // Instructions
  html += '<div style="font-size: 10px; opacity: 0.6; margin-top: 4px; border-top: 1px solid rgba(255,255,255,0.2); padding-top: 6px;">';
  html += '↑/↓ Navigate • Click/Enter to Capture • ESC to Cancel';
  html += '</div>';
  
  html += '</div>';
  breadcrumbBar.innerHTML = html;
}

/**
 * Get smart suggestions based on current selection
 */
function getSmartSuggestions() {
  const suggestions = [];
  const current = elementHierarchy[currentHierarchyLevel];
  const tag = current.tagName.toLowerCase();
  const className = (current.className || '').toLowerCase();
  
  // Check if user is on a small element (button, link, etc.)
  if (['a', 'button', 'span', 'img'].includes(tag)) {
    suggestions.push('Press ↑ to select parent container');
  }
  
  // Check if there's a better target above
  for (let i = currentHierarchyLevel + 1; i < elementHierarchy.length; i++) {
    const el = elementHierarchy[i];
    const score = calculateElementScore(el);
    
    if (score >= 80) {
      const name = getElementName(el);
      suggestions.push(`Try ${name} (${i - currentHierarchyLevel} level${i - currentHierarchyLevel > 1 ? 's' : ''} up)`);
      break;
    }
  }
  
  // Check for specific patterns
  if (className.includes('card')) {
    suggestions.push('Card detected - good for product/content blocks');
  }
  
  if (className.includes('hero')) {
    suggestions.push('Hero section - perfect for landing pages');
  }
  
  if (className.includes('shopify-section')) {
    suggestions.push('Shopify section detected - ideal capture level');
  }
  
  return suggestions;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📦 DEPENDENCY SCANNING & CAPTURE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Scan element for all dependencies (CSS, JS, CDN, external links)
 */
async function scanElementDependencies(element) {
  const dependencies = {
    stylesheets: [],      // External CSS files
    scripts: [],          // External JS files
    inlineScripts: [],    // Inline <script> code
    inlineStyles: [],     // Inline <style> code
    cdnLibraries: [],     // Detected CDN libraries
    fonts: [],            // Font resources
    images: [],           // Image URLs
    videos: [],           // Video URLs
    iframes: [],          // Embedded iframes
    dataAttributes: {},   // Important data-* attributes
    eventListeners: [],   // Detected event listeners
    frameworks: [],       // Detected frameworks (React, Vue, Alpine, etc.)
    meta: {
      hasInteractivity: false,
      hasAnimations: false,
      hasForms: false,
      hasMedia: false
    }
  };
  
  console.log('🔍 Starting dependency scan...');
  
  // 1. Scan for stylesheets (within element and <head>)
  scanStylesheets(element, dependencies);
  
  // 2. Scan for scripts (within element and referenced)
  scanScripts(element, dependencies);
  
  // 3. Detect CDN libraries
  detectCDNLibraries(dependencies);
  
  // 4. Scan for fonts (already handled by extractWebFonts)
  const webFonts = extractWebFonts(element);
  dependencies.fonts = webFonts.fonts;
  
  // 5. Scan for media (images, videos)
  scanMedia(element, dependencies);
  
  // 6. Scan for iframes
  scanIframes(element, dependencies);
  
  // 7. Extract data attributes
  extractDataAttributes(element, dependencies);
  
  // 8. Detect event listeners
  detectEventListeners(element, dependencies);
  
  // 9. Detect frameworks
  detectFrameworks(element, dependencies);
  
  // 10. Analyze element capabilities
  analyzeElementCapabilities(element, dependencies);
  
  console.log('✅ Dependency scan complete:', dependencies);
  
  return dependencies;
}

/**
 * Scan for external stylesheets
 */
function scanStylesheets(element, dependencies) {
  // Check for <link rel="stylesheet"> within element
  const links = element.querySelectorAll('link[rel="stylesheet"]');
  links.forEach(link => {
    const href = link.href;
    if (href) {
      dependencies.stylesheets.push({
        href: href,
        media: link.media || 'all',
        type: 'external'
      });
    }
  });
  
  // Check for inline <style> tags within element
  const styles = element.querySelectorAll('style');
  styles.forEach(style => {
    dependencies.inlineStyles.push({
      content: style.textContent,
      type: 'inline'
    });
  });
  
  // Also check document <head> for relevant stylesheets
  document.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
    const href = link.href;
    if (href && !dependencies.stylesheets.some(s => s.href === href)) {
      dependencies.stylesheets.push({
        href: href,
        media: link.media || 'all',
        type: 'global',
        note: 'May affect this element'
      });
    }
  });
  
  console.log(`  📄 Found ${dependencies.stylesheets.length} stylesheets`);
}

/**
 * Scan for scripts (inline and external)
 */
function scanScripts(element, dependencies) {
  // Check for <script> tags within element
  const scripts = element.querySelectorAll('script');
  scripts.forEach(script => {
    if (script.src) {
      // External script
      dependencies.scripts.push({
        src: script.src,
        async: script.async,
        defer: script.defer,
        type: script.type || 'text/javascript',
        location: 'element'
      });
    } else if (script.textContent.trim()) {
      // Inline script
      dependencies.inlineScripts.push({
        content: script.textContent,
        type: script.type || 'text/javascript',
        location: 'element'
      });
    }
  });
  
  console.log(`  📜 Found ${dependencies.scripts.length} external scripts, ${dependencies.inlineScripts.length} inline scripts`);
}

/**
 * Detect common CDN libraries
 */
function detectCDNLibraries(dependencies) {
  const cdnPatterns = [
    { pattern: /jquery/, name: 'jQuery', category: 'Library' },
    { pattern: /bootstrap/, name: 'Bootstrap', category: 'Framework' },
    { pattern: /tailwind/, name: 'Tailwind CSS', category: 'CSS Framework' },
    { pattern: /alpine/, name: 'Alpine.js', category: 'Framework' },
    { pattern: /vue/, name: 'Vue.js', category: 'Framework' },
    { pattern: /react/, name: 'React', category: 'Framework' },
    { pattern: /gsap/, name: 'GSAP', category: 'Animation' },
    { pattern: /swiper/, name: 'Swiper', category: 'Carousel' },
    { pattern: /slick/, name: 'Slick Carousel', category: 'Carousel' },
    { pattern: /aos/, name: 'AOS (Animate On Scroll)', category: 'Animation' },
    { pattern: /fontawesome/, name: 'Font Awesome', category: 'Icons' },
    { pattern: /material-icons/, name: 'Material Icons', category: 'Icons' },
    { pattern: /lodash/, name: 'Lodash', category: 'Utility' },
    { pattern: /axios/, name: 'Axios', category: 'HTTP' },
    { pattern: /chart\.?js/, name: 'Chart.js', category: 'Charts' },
    { pattern: /moment/, name: 'Moment.js', category: 'Date/Time' },
    { pattern: /dayjs/, name: 'Day.js', category: 'Date/Time' },
    { pattern: /lottie/, name: 'Lottie', category: 'Animation' },
    { pattern: /three\.?js/, name: 'Three.js', category: '3D' },
    { pattern: /anime\.?js/, name: 'Anime.js', category: 'Animation' },
  ];
  
  // Check all scripts and stylesheets
  const allResources = [
    ...dependencies.scripts.map(s => s.src),
    ...dependencies.stylesheets.map(s => s.href)
  ];
  
  allResources.forEach(url => {
    if (!url) return;
    
    cdnPatterns.forEach(({ pattern, name, category }) => {
      if (pattern.test(url.toLowerCase())) {
        if (!dependencies.cdnLibraries.some(lib => lib.name === name)) {
          dependencies.cdnLibraries.push({
            name: name,
            category: category,
            url: url,
            detected: true
          });
        }
      }
    });
  });
  
  console.log(`  📚 Detected ${dependencies.cdnLibraries.length} CDN libraries`);
}

/**
 * Scan for media resources (images, videos)
 */
function scanMedia(element, dependencies) {
  // Images
  const images = element.querySelectorAll('img, [style*="background-image"]');
  images.forEach(img => {
    let src = null;
    
    if (img.tagName === 'IMG') {
      src = img.src || img.dataset.src; // Handle lazy loading
    } else {
      // Extract from background-image
      const style = img.style.backgroundImage;
      const match = style?.match(/url\(['"]?([^'"]+)['"]?\)/);
      if (match) src = match[1];
    }
    
    if (src && !dependencies.images.includes(src)) {
      dependencies.images.push(src);
    }
  });
  
  // Videos
  const videos = element.querySelectorAll('video, source');
  videos.forEach(video => {
    const src = video.src || video.dataset.src;
    if (src && !dependencies.videos.includes(src)) {
      dependencies.videos.push(src);
    }
  });
  
  console.log(`  🖼️ Found ${dependencies.images.length} images, ${dependencies.videos.length} videos`);
}

/**
 * Scan for iframes (embedded content)
 */
function scanIframes(element, dependencies) {
  const iframes = element.querySelectorAll('iframe');
  iframes.forEach(iframe => {
    dependencies.iframes.push({
      src: iframe.src,
      width: iframe.width,
      height: iframe.height,
      title: iframe.title || 'Embedded content',
      sandbox: iframe.sandbox.toString() || 'none'
    });
  });
  
  console.log(`  📺 Found ${dependencies.iframes.length} iframes`);
}

/**
 * Extract important data-* attributes
 */
function extractDataAttributes(element, dependencies) {
  // Important data attributes that might indicate functionality
  const importantAttributes = [
    'data-controller',     // Stimulus
    'data-action',         // Stimulus actions
    'data-target',         // Stimulus targets
    'data-alpine',         // Alpine.js
    'data-component',      // Generic component marker
    'data-module',         // Module identifier
    'data-section-id',     // Shopify section
    'data-section-type',   // Shopify section type
    'data-product-id',     // E-commerce
    'data-variant-id',     // E-commerce variants
    'data-cart',           // Shopping cart
    'data-toggle',         // Bootstrap toggle
    'data-bs-toggle',      // Bootstrap 5
    'x-data',              // Alpine.js
    'x-init',              // Alpine.js init
    'x-show',              // Alpine.js show
    'x-bind',              // Alpine.js bind
  ];
  
  importantAttributes.forEach(attr => {
    if (element.hasAttribute(attr)) {
      dependencies.dataAttributes[attr] = element.getAttribute(attr);
    }
  });
  
  // Also check descendants
  importantAttributes.forEach(attr => {
    const elements = element.querySelectorAll(`[${attr}]`);
    if (elements.length > 0) {
      if (!dependencies.dataAttributes[attr]) {
        dependencies.dataAttributes[attr] = [];
      }
      elements.forEach(el => {
        dependencies.dataAttributes[attr].push(el.getAttribute(attr));
      });
    }
  });
  
  console.log(`  🏷️ Found ${Object.keys(dependencies.dataAttributes).length} data attributes`);
}

/**
 * Detect event listeners (approximate)
 */
function detectEventListeners(element, dependencies) {
  // Check for inline event handlers
  const eventAttributes = [
    'onclick', 'onload', 'onmouseover', 'onmouseout',
    'onchange', 'onsubmit', 'onkeydown', 'onkeyup',
    'onfocus', 'onblur', 'oninput', 'onscroll'
  ];
  
  eventAttributes.forEach(attr => {
    if (element.hasAttribute(attr)) {
      dependencies.eventListeners.push({
        type: attr.replace('on', ''),
        method: 'inline',
        code: element.getAttribute(attr)
      });
    }
    
    // Check descendants
    const elements = element.querySelectorAll(`[${attr}]`);
    elements.forEach(el => {
      dependencies.eventListeners.push({
        type: attr.replace('on', ''),
        method: 'inline',
        code: el.getAttribute(attr),
        element: el.tagName
      });
    });
  });
  
  // Check for Alpine.js event handlers (using safe selector)
  try {
    // Check for x-on: directives (Alpine.js long form)
    const xOnElements = element.querySelectorAll('[x-on\\:click], [x-on\\:change], [x-on\\:submit], [x-on\\:input]');
    xOnElements.forEach(el => {
      dependencies.eventListeners.push({
        type: 'alpine',
        framework: 'Alpine.js',
        element: el.tagName
      });
    });
    
    // Check for @ shorthand (scan attributes manually to avoid selector issues)
    const allElements = element.querySelectorAll('*');
    allElements.forEach(el => {
      Array.from(el.attributes).forEach(attr => {
        if (attr.name.startsWith('@') || attr.name.startsWith('x-on:')) {
          dependencies.eventListeners.push({
            type: 'alpine',
            framework: 'Alpine.js',
            element: el.tagName,
            event: attr.name
          });
        }
      });
    });
  } catch (error) {
    console.warn('⚠️ Error detecting Alpine.js events:', error.message);
  }
  
  console.log(`  👂 Found ${dependencies.eventListeners.length} event listeners`);
}

/**
 * Detect frontend frameworks
 */
function detectFrameworks(element, dependencies) {
  // Vue.js
  if (element.hasAttribute('v-if') || 
      element.hasAttribute('v-for') || 
      element.hasAttribute('v-model') ||
      element.querySelector('[v-if], [v-for], [v-model]')) {
    dependencies.frameworks.push('Vue.js');
  }
  
  // Alpine.js
  if (element.hasAttribute('x-data') || 
      element.querySelector('[x-data]')) {
    dependencies.frameworks.push('Alpine.js');
  }
  
  // React (check for data-reactroot or _reactRootContainer)
  if (element.hasAttribute('data-reactroot') || 
      element._reactRootContainer ||
      element.querySelector('[data-reactroot]')) {
    dependencies.frameworks.push('React');
  }
  
  // Angular
  if (element.hasAttribute('ng-app') || 
      element.hasAttribute('ng-controller') ||
      element.querySelector('[ng-app], [ng-controller]')) {
    dependencies.frameworks.push('Angular');
  }
  
  // Stimulus
  if (element.hasAttribute('data-controller') ||
      element.querySelector('[data-controller]')) {
    dependencies.frameworks.push('Stimulus');
  }
  
  // Shopify Liquid (check for Shopify-specific classes)
  if (element.classList.contains('shopify-section') ||
      element.hasAttribute('data-section-id') ||
      element.querySelector('.shopify-section')) {
    dependencies.frameworks.push('Shopify Liquid');
  }
  
  console.log(`  ⚛️ Detected frameworks:`, dependencies.frameworks.join(', ') || 'None');
}

/**
 * Analyze element capabilities
 */
function analyzeElementCapabilities(element, dependencies) {
  // Has interactivity (buttons, forms, inputs)
  const interactiveElements = element.querySelectorAll('button, a, input, select, textarea, [onclick], [data-action]');
  dependencies.meta.hasInteractivity = interactiveElements.length > 0;
  
  // Has animations (CSS or JS)
  const animatedElements = element.querySelectorAll('[style*="animation"], [class*="animate"], [data-aos]');
  dependencies.meta.hasAnimations = animatedElements.length > 0 || 
                                    dependencies.cdnLibraries.some(lib => lib.category === 'Animation');
  
  // Has forms
  const forms = element.querySelectorAll('form, input, textarea');
  dependencies.meta.hasForms = forms.length > 0;
  
  // Has media
  dependencies.meta.hasMedia = dependencies.images.length > 0 || 
                               dependencies.videos.length > 0 ||
                               dependencies.iframes.length > 0;
  
  console.log('  📊 Capabilities:', dependencies.meta);
}

/**
 * Show visual preview modal with screenshot
 */
async function showVisualPreview(element) {
  try {
    // Store element for later capture
    pendingCaptureElement = element;
    
    // Request screenshot from background script
    showNotification('Preparing preview...', 'Capturing screenshot...');
    
    chrome.runtime.sendMessage({
      action: 'captureScreenshot',
      elementInfo: {
        rect: element.getBoundingClientRect(),
        scrollX: window.scrollX,
        scrollY: window.scrollY,
        tagName: element.tagName.toLowerCase(),
        className: element.className,
        id: element.id
      }
    }, (response) => {
      if (response && response.screenshot) {
        capturedScreenshot = response.screenshot;
        displayPreviewModal(element, response.screenshot);
      } else {
        // Fallback: proceed without preview
        console.log('Screenshot failed, proceeding without preview');
        confirmCapture();
      }
    });
    
  } catch (error) {
    console.error('Preview error:', error);
    // Fallback: proceed without preview
    confirmCapture();
  }
}

/**
 * Detect fonts used in element and its children
 */
function detectFontsInElement(element) {
  const customFonts = new Set();
  const googleFonts = new Set();
  const systemFonts = ['Arial', 'Helvetica', 'Times New Roman', 'Times', 'Courier New', 'Courier', 'Verdana', 'Georgia', 'Palatino', 'Garamond', 'Bookman', 'Comic Sans MS', 'Trebuchet MS', 'Impact', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'sans-serif', 'serif', 'monospace', 'cursive', 'fantasy'];
  
  // Check element and all children
  const allElements = [element, ...element.querySelectorAll('*')];
  
  allElements.forEach(el => {
    const computed = window.getComputedStyle(el);
    const fontFamily = computed.fontFamily;
    
    if (fontFamily) {
      // Split by comma and clean up
      const fonts = fontFamily.split(',').map(f => f.trim().replace(/['"]/g, ''));
      
      fonts.forEach(font => {
        // Skip system fonts
        if (systemFonts.some(sf => font.toLowerCase().includes(sf.toLowerCase()))) {
          return;
        }
        
        // Check if it's a Google Font (common ones)
        const googleFontList = [
          'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Oswald', 'Source Sans Pro',
          'Raleway', 'PT Sans', 'Merriweather', 'Poppins', 'Nunito', 'Playfair Display',
          'Ubuntu', 'Mukta', 'Rubik', 'Work Sans', 'Noto Sans', 'Fira Sans', 'Oxygen',
          'Plus Jakarta Sans', 'DM Sans', 'Space Grotesk', 'Manrope', 'Outfit'
        ];
        
        const isGoogleFont = googleFontList.some(gf => 
          font.toLowerCase() === gf.toLowerCase()
        );
        
        if (isGoogleFont) {
          googleFonts.add(font);
        } else if (font.length > 0) {
          // It's a custom font
          customFonts.add(font);
        }
      });
    }
  });
  
  // Also check for @font-face rules in stylesheets
  try {
    Array.from(document.styleSheets).forEach(sheet => {
      try {
        Array.from(sheet.cssRules || []).forEach(rule => {
          if (rule instanceof CSSFontFaceRule) {
            const fontFamilyMatch = rule.style.fontFamily.replace(/['"]/g, '');
            if (fontFamilyMatch && !systemFonts.includes(fontFamilyMatch)) {
              customFonts.add(fontFamilyMatch);
            }
          }
        });
      } catch (e) {
        // CORS or security error, skip
      }
    });
  } catch (e) {
    console.warn('Could not access stylesheets:', e);
  }
  
  return {
    customFonts: Array.from(customFonts).sort(),
    googleFonts: Array.from(googleFonts).sort()
  };
}

/**
 * Display preview modal with cropped screenshot
 */
async function displayPreviewModal(element, screenshotDataUrl) {
  // Remove existing modal
  if (previewModal) {
    previewModal.remove();
  }
  
  const rect = element.getBoundingClientRect();
  
  // Crop screenshot to element bounds
  const croppedImage = await cropScreenshotToElement(screenshotDataUrl, rect);
  
  // Detect fonts used in the element
  const fontsInfo = detectFontsInElement(element);
  console.log('🔤 Fonts detected for preview:', fontsInfo);
  
  // Create modal
  previewModal = document.createElement('div');
  previewModal.id = 'grab-ai-preview-modal';
  previewModal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.9);
    z-index: 10000000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    animation: fadeIn 0.2s ease;
  `;
  
  const elementName = getElementName(element);
  const classCount = element.className ? element.className.split(' ').filter(c => c).length : 0;
  const childCount = element.children ? element.children.length : 0;
  
  // Modal content
  const content = document.createElement('div');
  content.style.cssText = `
    background: white;
    border-radius: 16px;
    padding: 24px;
    max-width: 800px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 20px 60px rgba(0,0,0,0.5);
  `;
  
  content.innerHTML = `
    <div style="text-align: center;">
      <h2 style="margin: 0 0 8px; font-size: 24px; font-weight: 700; color: #1F2937; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
        📸 Confirm Capture
      </h2>
      <p style="margin: 0 0 20px; font-size: 14px; color: #6B7280;">
        Review the element before converting to React
      </p>
      
      <!-- Screenshot Preview -->
      <div style="margin-bottom: 20px; border-radius: 12px; overflow: hidden; border: 3px solid #10B981; background: #F3F4F6;">
        <img src="${croppedImage}" 
             alt="Element preview" 
             style="width: 100%; height: auto; max-height: 400px; object-fit: contain; display: block;">
      </div>
      
      <!-- Element Info -->
      <div style="background: #F9FAFB; border-radius: 12px; padding: 16px; margin-bottom: 20px; text-align: left;">
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; font-size: 13px;">
          <div>
            <span style="color: #6B7280; display: block; margin-bottom: 4px;">Element</span>
            <span style="font-weight: 600; color: #1F2937; font-family: monospace;">${elementName}</span>
          </div>
          <div>
            <span style="color: #6B7280; display: block; margin-bottom: 4px;">Size</span>
            <span style="font-weight: 600; color: #1F2937;">${Math.round(rect.width)} × ${Math.round(rect.height)} px</span>
          </div>
          ${classCount > 0 ? `
          <div>
            <span style="color: #6B7280; display: block; margin-bottom: 4px;">Classes</span>
            <span style="font-weight: 600; color: #1F2937;">${classCount} ${classCount === 1 ? 'class' : 'classes'}</span>
          </div>
          ` : ''}
          <div>
            <span style="color: #6B7280; display: block; margin-bottom: 4px;">Children</span>
            <span style="font-weight: 600; color: #1F2937;">${childCount} ${childCount === 1 ? 'element' : 'elements'}</span>
          </div>
        </div>
        
        ${element.id ? `
        <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #E5E7EB;">
          <span style="color: #6B7280; font-size: 12px;">ID: </span>
          <span style="font-weight: 600; color: #3B82F6; font-family: monospace; font-size: 12px;">#${element.id}</span>
        </div>
        ` : ''}
      </div>
      
      <!-- Fonts Info -->
      ${fontsInfo.customFonts.length > 0 || fontsInfo.googleFonts.length > 0 ? `
      <div style="background: #EFF6FF; border: 2px solid #3B82F6; border-radius: 12px; padding: 16px; margin-bottom: 20px; text-align: left;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
          <span style="font-size: 20px;">🔤</span>
          <h3 style="margin: 0; font-size: 15px; font-weight: 700; color: #1E40AF;">Custom Fonts Detected</h3>
        </div>
        
        ${fontsInfo.customFonts.length > 0 ? `
        <div style="margin-bottom: ${fontsInfo.googleFonts.length > 0 ? '12px' : '0'};">
          <div style="font-size: 12px; color: #6B7280; margin-bottom: 6px; font-weight: 600;">CUSTOM WEB FONTS:</div>
          <div style="display: flex; flex-wrap: wrap; gap: 6px;">
            ${fontsInfo.customFonts.map(font => `
              <span style="display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; background: white; border: 1px solid #BFDBFE; border-radius: 6px; font-size: 13px; font-weight: 500; color: #1E40AF;">
                <span style="font-size: 16px;">✨</span>
                <span style="font-family: '${font}', serif;">${font}</span>
              </span>
            `).join('')}
          </div>
        </div>
        ` : ''}
        
        ${fontsInfo.googleFonts.length > 0 ? `
        <div>
          <div style="font-size: 12px; color: #6B7280; margin-bottom: 6px; font-weight: 600;">GOOGLE FONTS:</div>
          <div style="display: flex; flex-wrap: wrap; gap: 6px;">
            ${fontsInfo.googleFonts.map(font => `
              <span style="display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; background: white; border: 1px solid #BFDBFE; border-radius: 6px; font-size: 13px; font-weight: 500; color: #1E40AF;">
                <span style="font-size: 16px;">🌐</span>
                <span style="font-family: '${font}', sans-serif;">${font}</span>
              </span>
            `).join('')}
          </div>
        </div>
        ` : ''}
        
        <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #BFDBFE; font-size: 11px; color: #6B7280; display: flex; align-items: center; gap: 4px;">
          <span>✓</span>
          <span>These fonts will be included in the capture</span>
        </div>
      </div>
      ` : ''}
      
      <!-- Actions -->
      <div style="display: flex; gap: 12px;">
        <button id="grab-ai-cancel-btn" style="
          flex: 1;
          padding: 14px 24px;
          background: #F3F4F6;
          color: #4B5563;
          border: none;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        ">
          ✗ Cancel
        </button>
        <button id="grab-ai-confirm-btn" style="
          flex: 2;
          padding: 14px 24px;
          background: linear-gradient(135deg, #10B981 0%, #059669 100%);
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        ">
          ✓ Looks Good! Capture Now
        </button>
      </div>
      
      <p style="margin-top: 12px; font-size: 11px; color: #9CA3AF;">
        💡 Tip: Use ↑/↓ before clicking to select parent/child elements
      </p>
    </div>
  `;
  
  previewModal.appendChild(content);
  document.body.appendChild(previewModal);
  
  // Add hover effects and active states
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    @keyframes buttonClick {
      0% { transform: scale(1); }
      50% { transform: scale(0.95); }
      100% { transform: scale(1); }
    }
    
    #grab-ai-cancel-btn {
      user-select: none;
    }
    
    #grab-ai-cancel-btn:hover {
      background: #E5E7EB !important;
      transform: translateY(-1px);
    }
    
    #grab-ai-cancel-btn:active {
      transform: translateY(0) !important;
      background: #D1D5DB !important;
      animation: buttonClick 0.2s ease;
    }
    
    #grab-ai-confirm-btn {
      user-select: none;
    }
    
    #grab-ai-confirm-btn:hover {
      transform: translateY(-2px) !important;
      box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4) !important;
    }
    
    #grab-ai-confirm-btn:active {
      transform: translateY(0) scale(0.98) !important;
      box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3) !important;
      animation: buttonClick 0.2s ease;
    }
    
    /* Prevent text selection in modal */
    #grab-ai-preview-modal * {
      user-select: none;
    }
    
    /* Make buttons clearly clickable */
    #grab-ai-cancel-btn,
    #grab-ai-confirm-btn {
      cursor: pointer !important;
      pointer-events: auto !important;
    }
  `;
  document.head.appendChild(style);
  
  // Event listeners with proper event handling
  document.getElementById('grab-ai-cancel-btn').addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    cancelCapture();
  }, true); // Use capture phase
  
  document.getElementById('grab-ai-confirm-btn').addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    confirmCapture();
  }, true); // Use capture phase
  
  // Close on outside click
  previewModal.addEventListener('click', (e) => {
    if (e.target === previewModal) {
      e.preventDefault();
      e.stopPropagation();
      cancelCapture();
    }
  });
  
  // Close on ESC (high priority handler)
  const escHandler = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      cancelCapture();
      document.removeEventListener('keydown', escHandler);
    }
  };
  document.addEventListener('keydown', escHandler, true); // Use capture phase for priority
}

/**
 * Crop screenshot to element bounds using canvas
 */
function cropScreenshotToElement(screenshotDataUrl, rect) {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas size to element size (with device pixel ratio)
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    // Load screenshot image
    const img = new Image();
    img.src = screenshotDataUrl;
    
    // Create a promise to wait for image load
    return new Promise((resolve) => {
      img.onload = () => {
        // Draw cropped portion
        ctx.drawImage(
          img,
          rect.left * dpr,
          rect.top * dpr,
          rect.width * dpr,
          rect.height * dpr,
          0,
          0,
          rect.width * dpr,
          rect.height * dpr
        );
        
        // Convert to data URL
        resolve(canvas.toDataURL('image/png'));
      };
      
      img.onerror = () => {
        // Fallback to original screenshot
        resolve(screenshotDataUrl);
      };
    });
  } catch (error) {
    console.error('Crop error:', error);
    return screenshotDataUrl; // Fallback
  }
}

/**
 * Confirm capture and proceed
 */
function confirmCapture() {
  console.log('✅ Confirm capture clicked');
  console.log('   Pending element:', pendingCaptureElement);
  
  // Store element reference before removing modal
  const elementToCapture = pendingCaptureElement;
  
  // Remove preview modal
  if (previewModal) {
    previewModal.remove();
    previewModal = null;
  }
  
  // Clear UI elements
  if (overlay) {
    overlay.style.display = 'none';
  }
  if (breadcrumbBar) {
    breadcrumbBar.style.display = 'none';
  }
  
  // Proceed with capture using stored reference
  if (elementToCapture) {
    console.log('🎯 Capturing element:', elementToCapture.tagName, elementToCapture.className);
    captureElement(elementToCapture);
    pendingCaptureElement = null;
    capturedScreenshot = null;
  } else {
    console.error('❌ No element to capture!');
    showNotification('Capture Failed', 'No element selected');
  }
  
  // Stop selection mode
  stopSelectionMode();
}

/**
 * Cancel capture
 */
function cancelCapture() {
  console.log('❌ Capture cancelled');
  
  // Remove preview modal
  if (previewModal) {
    previewModal.remove();
    previewModal = null;
  }
  
  // Clear pending
  pendingCaptureElement = null;
  capturedScreenshot = null;
  
  // Show overlay and breadcrumb again for continued selection
  if (overlay) {
    overlay.style.display = 'block';
  }
  if (breadcrumbBar && elementHierarchy.length > 0) {
    breadcrumbBar.style.display = 'block';
  }
  
  // Don't stop selection mode - user can try again
  showNotification('Capture Cancelled', 'Try selecting a different element');
}

/**
 * Get readable element name with semantic hints
 */
function getElementName(element) {
  const tag = element.tagName.toLowerCase();
  const className = element.className || '';
  const id = element.id || '';
  
  // Check for common semantic patterns
  const semanticPatterns = {
    'card': '🃏',
    'hero': '🎯',
    'section': '📦',
    'container': '📦',
    'product': '🛍️',
    'pricing': '💰',
    'testimonial': '💬',
    'cta': '👆',
    'banner': '🎪',
    'grid': '▦',
    'list': '📋',
    'nav': '🧭',
    'header': '⬆️',
    'footer': '⬇️',
  };
  
  let icon = '';
  for (const [pattern, emoji] of Object.entries(semanticPatterns)) {
    if (className.toLowerCase().includes(pattern) || id.toLowerCase().includes(pattern)) {
      icon = emoji + ' ';
      break;
    }
  }
  
  // Priority: id > meaningful class > tag
  if (id && id.length < 30) {
    return `${icon}<${tag}#${id}>`;
  }
  
  if (className && typeof className === 'string') {
    const classes = className.split(' ').filter(c => c && c.length < 25);
    
    // Find most meaningful class (container, card, section, etc.)
    const meaningfulClass = classes.find(c => 
      /card|section|container|hero|product|pricing|feature|banner/i.test(c)
    ) || classes[0];
    
    if (meaningfulClass) {
      const extra = classes.length > 1 ? `+${classes.length - 1}` : '';
      return `${icon}<${tag}.${meaningfulClass}${extra}>`;
    }
  }
  
  // Check for semantic elements
  if (['header', 'footer', 'nav', 'main', 'aside', 'section', 'article'].includes(tag)) {
    const tagIcon = semanticPatterns[tag] || '📄';
    return `${tagIcon} <${tag}>`;
  }
  
  return `<${tag}>`;
}

/**
 * Handle mouse out
 */
function handleMouseOut(e) {
  if (!isSelectionMode) return;
  e.stopPropagation();
}

/**
 * Handle element click (capture with preview)
 */
function handleClick(e) {
  if (!isSelectionMode) return;
  
  // Ignore clicks on the preview modal
  if (previewModal && (e.target === previewModal || previewModal.contains(e.target))) {
    return; // Let modal handle its own clicks
  }
  
  e.preventDefault();
  e.stopPropagation();
  
  // Use currently selected element from hierarchy
  selectedElement = elementHierarchy[currentHierarchyLevel] || e.target;
  const captureTarget = getCaptureTarget(selectedElement);
  
  // Show visual preview first
  showVisualPreview(captureTarget);
}

/**
 * Handle keyboard navigation
 */
function handleKeyDown(e) {
  if (!isSelectionMode) return;
  
  // If preview modal is open, let it handle ESC
  if (previewModal) {
    return;
  }
  
  // ESC to cancel selection mode
  if (e.key === 'Escape') {
    e.preventDefault();
    e.stopPropagation();
    stopSelectionMode();
    showNotification('Capture Cancelled', 'Selection mode ended');
    return;
  }
  
  // Arrow Up - move to parent
  if (e.key === 'ArrowUp') {
    e.preventDefault();
    e.stopPropagation();
    
    if (currentHierarchyLevel < elementHierarchy.length - 1) {
      currentHierarchyLevel++;
      updateOverlay(elementHierarchy[currentHierarchyLevel]);
      updateBreadcrumb();
    }
    return;
  }
  
  // Arrow Down - move to child
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    e.stopPropagation();
    
    if (currentHierarchyLevel > 0) {
      currentHierarchyLevel--;
      updateOverlay(elementHierarchy[currentHierarchyLevel]);
      updateBreadcrumb();
    }
    return;
  }
  
  // Enter - confirm capture of current selection (with preview)
  if (e.key === 'Enter') {
    e.preventDefault();
    e.stopPropagation();
    
    if (elementHierarchy[currentHierarchyLevel]) {
      selectedElement = elementHierarchy[currentHierarchyLevel];
      const captureTarget = getCaptureTarget(selectedElement);
      showVisualPreview(captureTarget);
    }
    return;
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
 * SIMPLE: Capture element and convert to React JSX
 * Captures HTML + CSS + FONTS, converts to React, copies to clipboard
 */
async function captureElement(element) {
  showNotification('Capturing...', 'Converting to React JSX...');
  
  try {
    // Get settings
    const settings = await chrome.storage.local.get(['shopifyMode', 'includeMediaQueries']);
    const isShopifyMode = settings.shopifyMode || false;
    const includeMediaQueries = settings.includeMediaQueries !== false;
    
    // Check if Shopify mode and detect Shopify
    let shopifyData = null;
    if (isShopifyMode) {
      shopifyData = detectShopify(element);
      if (shopifyData) {
        console.log('🏪 Shopify detected:', shopifyData);
      }
    }
    
    // Step 0: Scan for all dependencies (CSS, JS, CDN, etc.)
    showNotification('🔍 Scanning dependencies...', 'Analyzing CSS, JS, fonts, media...');
    let dependencies = null;
    try {
      dependencies = await scanElementDependencies(element);
      console.log('✅ Dependencies scanned:', dependencies);
    } catch (depError) {
      console.warn('⚠️ Dependency scan failed (continuing without dependencies):', depError);
      // Create empty dependencies object so capture can continue
      dependencies = {
        stylesheets: [],
        scripts: [],
        inlineScripts: [],
        inlineStyles: [],
        cdnLibraries: [],
        fonts: [],
        images: [],
        videos: [],
        iframes: [],
        dataAttributes: {},
        eventListeners: [],
        frameworks: [],
        meta: {
          hasInteractivity: false,
          hasAnimations: false,
          hasForms: false,
          hasMedia: false
        }
      };
    }
    
    // Step 1: Extract web fonts and typography
    const webFonts = extractWebFonts(element);
    console.log('✅ Extracted fonts:', webFonts.imports.length, 'imports,', webFonts.fontFaces.length, 'font-faces');
    
    // Step 2: Extract CSS rules (with or without media queries)
    const extractedCSS = extractAllCSS(element, includeMediaQueries);
    console.log('✅ Extracted CSS:', extractedCSS.length, 'characters');
    
    // Step 3: Clone element with ALL computed styles inline
    const htmlWithAllStyles = captureWithAllStyles(element);
    
    // Step 4: Convert to clean React JSX with fonts and optional Shopify data
    const reactCode = convertHtmlToReact(htmlWithAllStyles, element.tagName.toLowerCase(), extractedCSS, shopifyData, webFonts);
    
    console.log('✅ React JSX conversion complete!');
    console.log('   Code length:', reactCode.length);
    console.log('   Fonts included:', webFonts.imports.length + webFonts.fontFaces.length);
    if (shopifyData) {
      console.log('   Shopify data included');
    }
    
    // Step 5: Copy to clipboard DIRECTLY (more reliable than background)
    try {
      await navigator.clipboard.writeText(reactCode);
      console.log('✅ React code copied to clipboard!', reactCode.length, 'characters');
      
      const message = shopifyData ? 'Shopify section captured!' : 'React JSX Ready!';
      const depsMsg = dependencies.cdnLibraries.length > 0 
        ? ` (${dependencies.cdnLibraries.length} lib${dependencies.cdnLibraries.length > 1 ? 's' : ''} detected)` 
        : '';
      showNotification('✅ ' + message, 'Copied to clipboard - paste anywhere' + depsMsg);
      
    } catch (clipboardError) {
      console.warn('⚠️ Direct clipboard copy failed, using background fallback:', clipboardError);
      
      // Fallback: Try background script method
      try {
        await chrome.runtime.sendMessage({
          action: 'copyToClipboard',
          text: reactCode
        });
        
        showNotification('✅ Copied!', 'Paste on canvas (Ctrl+V)');
      } catch (bgError) {
        console.error('❌ Both clipboard methods failed:', bgError);
        showNotification('Copy Failed', 'Open extension popup to manually copy');
      }
    }
    
    // Step 6: Send to background for storage (optional, non-blocking)
    chrome.runtime.sendMessage({
      action: 'elementCaptured',
      data: {
        reactCode: reactCode,
        html: htmlWithAllStyles,
        originalHtml: element.outerHTML,
        tagName: element.tagName.toLowerCase(),
        className: element.className || '',
        id: element.id || '',
        dimensions: {
          width: element.offsetWidth,
          height: element.offsetHeight
        },
        pageUrl: window.location.href,
        timestamp: new Date().toISOString(),
        shopifyData: shopifyData,
        dependencies: dependencies // Include all dependencies
      }
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.log('Storage skipped (extension context), but clipboard succeeded');
      } else {
        console.log('Successfully saved to storage');
      }
    });
    
  } catch (error) {
    console.error('Capture error:', error);
    showNotification('Capture Failed', error.message);
  }
}

/**
 * Detect Shopify and extract section data
 */
function detectShopify(element) {
  // Check if Shopify site
  if (!window.Shopify && 
      !document.querySelector('[data-shopify]') &&
      !document.querySelector('script[src*="cdn.shopify.com"]')) {
    return null;
  }
  
  console.log('🏪 Shopify site detected!');
  
  const data = {
    isShopify: true,
    sections: [],
    product: null,
    theme: null,
    shopDomain: window.location.hostname
  };
  
  // Find all Shopify sections in/around the captured element
  let sections = element.querySelectorAll('[data-section-id], [data-section-type]');
  if (sections.length === 0) {
    // Check if element itself is a section
    const parentSection = element.closest('[data-section-id], [data-section-type]');
    if (parentSection) {
      sections = [parentSection];
    }
  }
  
  // Extract section metadata
  sections.forEach(section => {
    data.sections.push({
      id: section.getAttribute('data-section-id'),
      type: section.getAttribute('data-section-type'),
      settings: section.getAttribute('data-section-settings')
    });
  });
  
  // Product data from meta tags
  const productMeta = document.querySelector('meta[property="og:type"][content="product"]');
  if (productMeta) {
    data.product = {
      title: document.querySelector('meta[property="og:title"]')?.content,
      image: document.querySelector('meta[property="og:image"]')?.content,
      price: document.querySelector('meta[property="product:price:amount"]')?.content,
      currency: document.querySelector('meta[property="product:price:currency"]')?.content
    };
  }
  
  // Theme info
  const themeLink = Array.from(document.styleSheets).find(s => 
    s.href && s.href.includes('cdn.shopify.com/s/files')
  );
  if (themeLink) {
    const themeMatch = themeLink.href.match(/\/files\/([^\/]+)\//);
    if (themeMatch) {
      data.theme = themeMatch[1];
    }
  }
  
  return data.sections.length > 0 || data.product || data.theme ? data : null;
}

/**
 * Extract web fonts used by element and its children
 */
function extractWebFonts(element) {
  const fonts = {
    imports: new Set(),      // @import url(...)
    fontFaces: new Set(),    // @font-face rules
    families: new Set(),     // Font family names
    googleFonts: new Set()   // Google Fonts URLs
  };
  
  // Collect all font families used
  const elements = [element, ...element.querySelectorAll('*')];
  elements.forEach(el => {
    try {
      const computed = window.getComputedStyle(el);
      const fontFamily = computed.fontFamily;
      
      if (fontFamily && fontFamily !== 'inherit') {
        // Parse font family (can be multiple, comma-separated)
        fontFamily.split(',').forEach(family => {
          const cleaned = family.trim().replace(/['"]/g, '');
          if (cleaned && 
              cleaned !== 'inherit' && 
              !['serif', 'sans-serif', 'monospace', 'cursive', 'fantasy', 'system-ui'].includes(cleaned.toLowerCase())) {
            fonts.families.add(cleaned);
          }
        });
      }
    } catch (e) {
      // Skip if getComputedStyle fails
    }
  });
  
  console.log('🔤 Font families found:', Array.from(fonts.families));
  
  // Extract font rules from stylesheets
  for (const sheet of document.styleSheets) {
    try {
      if (!sheet.cssRules) continue;
      
      for (const rule of sheet.cssRules) {
        try {
          // @import rules (often for Google Fonts)
          if (rule.type === CSSRule.IMPORT_RULE) {
            const href = rule.href;
            if (href && (href.includes('fonts.googleapis.com') || href.includes('fonts.gstatic.com'))) {
              fonts.imports.add(`@import url('${href}');`);
              fonts.googleFonts.add(href);
              console.log('  ✓ Found Google Font import:', href);
            } else if (href && href.includes('font')) {
              fonts.imports.add(`@import url('${href}');`);
            }
          }
          
          // @font-face rules
          if (rule.type === CSSRule.FONT_FACE_RULE || rule.type === 5) {
            const fontFamily = rule.style.fontFamily?.replace(/['"]/g, '');
            
            // Only include if this font family is actually used
            if (fontFamily && fonts.families.has(fontFamily)) {
              fonts.fontFaces.add(rule.cssText);
              console.log('  ✓ Found @font-face:', fontFamily);
            }
          }
        } catch (ruleError) {
          // Skip inaccessible rules
        }
      }
    } catch (sheetError) {
      // Skip cross-origin stylesheets
    }
  }
  
  // Check for Google Fonts in <link> tags
  const linkTags = document.querySelectorAll('link[rel="stylesheet"]');
  linkTags.forEach(link => {
    const href = link.href;
    if (href && (href.includes('fonts.googleapis.com') || href.includes('fonts.gstatic.com'))) {
      fonts.imports.add(`@import url('${href}');`);
      fonts.googleFonts.add(href);
      console.log('  ✓ Found Google Font link:', href);
    }
  });
  
  return {
    imports: Array.from(fonts.imports),
    fontFaces: Array.from(fonts.fontFaces),
    families: Array.from(fonts.families),
    googleFonts: Array.from(fonts.googleFonts)
  };
}

/**
 * Check if CSS selector matches any of the captured classes or IDs
 */
function selectorMatchesElement(selector, classNames, ids) {
  if (!selector) return false;
  
  // Check class matches
  for (const cls of classNames) {
    // Match: .class, .class:hover, .class[attr], .class.other, div.class
    const classPattern = new RegExp(`\\.${cls}(?=[\\s:.,\\[>+~]|$)`, 'g');
    if (classPattern.test(selector)) return true;
  }
  
  // Check ID matches
  for (const id of ids) {
    const idPattern = new RegExp(`#${id}(?=[\\s:.,\\[>+~]|$)`, 'g');
    if (idPattern.test(selector)) return true;
  }
  
  return false;
}

/**
 * PRODUCTION: Extract ALL CSS rules from page
 * Includes: class rules, media queries, responsive CSS, animations, etc.
 */
function extractAllCSS(element, includeMediaQueries = true) {
  const classNames = new Set();
  const ids = new Set();
  const animationNames = new Set();
  
  // Collect ALL selectors from element tree
  function collectSelectors(el) {
    if (el.className && typeof el.className === 'string') {
      el.className.split(/\s+/).forEach(cls => {
        if (cls) classNames.add(cls);
      });
    }
    if (el.id) ids.add(el.id);
    
    // Check for animation-name in computed styles
    try {
      const computed = window.getComputedStyle(el);
      const animName = computed.animationName;
      if (animName && animName !== 'none') {
        animName.split(',').forEach(name => {
          animationNames.add(name.trim());
        });
      }
    } catch (e) {
      // Skip if getComputedStyle fails
    }
    
    for (const child of el.children || []) {
      collectSelectors(child);
    }
  }
  collectSelectors(element);
  
  console.log('Collecting CSS for', classNames.size, 'classes and', animationNames.size, 'animations');
  
  const cssRules = [];
  const mediaQueries = {};
  const keyframesRules = [];
  
  // Process ALL stylesheets on page
  for (const sheet of document.styleSheets) {
    try {
      if (!sheet.cssRules) continue;
      
      for (const rule of sheet.cssRules) {
        try {
          // Regular style rules
          if (rule.type === CSSRule.STYLE_RULE) {
            const selector = rule.selectorText;
            if (selectorMatchesElement(selector, classNames, ids)) {
              cssRules.push(rule.cssText);
              
              // Check if this rule uses animations
              const ruleText = rule.cssText.toLowerCase();
              const animMatch = ruleText.match(/animation(?:-name)?:\s*([^;}\s]+)/);
              if (animMatch) {
                const names = animMatch[1].split(',');
                names.forEach(name => animationNames.add(name.trim()));
              }
            }
          }
          
          // Keyframes/animations - CAPTURE THESE!
          if (rule.type === CSSRule.KEYFRAMES_RULE || rule.type === 7) {
            const keyframeName = rule.name;
            if (animationNames.has(keyframeName)) {
              keyframesRules.push(rule.cssText);
              console.log('  ✓ Captured @keyframes', keyframeName);
            }
          }
          
          // Media queries (responsive CSS) - only if enabled
          if (includeMediaQueries && rule.type === CSSRule.MEDIA_RULE) {
            const mediaCondition = rule.conditionText || rule.media.mediaText;
            
            for (const innerRule of rule.cssRules) {
              if (innerRule.type === CSSRule.STYLE_RULE) {
                const selector = innerRule.selectorText;
                if (selectorMatchesElement(selector, classNames, ids)) {
                  if (!mediaQueries[mediaCondition]) {
                    mediaQueries[mediaCondition] = [];
                  }
                  mediaQueries[mediaCondition].push(innerRule.cssText);
                  
                  // Check for animations in media queries too
                  const ruleText = innerRule.cssText.toLowerCase();
                  const animMatch = ruleText.match(/animation(?:-name)?:\s*([^;}\s]+)/);
                  if (animMatch) {
                    const names = animMatch[1].split(',');
                    names.forEach(name => animationNames.add(name.trim()));
                  }
                }
              }
              // Keyframes inside media queries
              else if (innerRule.type === CSSRule.KEYFRAMES_RULE || innerRule.type === 7) {
                const keyframeName = innerRule.name;
                if (animationNames.has(keyframeName)) {
                  if (!mediaQueries[mediaCondition]) {
                    mediaQueries[mediaCondition] = [];
                  }
                  mediaQueries[mediaCondition].push(innerRule.cssText);
                }
              }
            }
          }
        } catch (ruleError) {
          // Skip rule errors
        }
      }
    } catch (sheetError) {
      // Skip cross-origin stylesheets
      console.log('Skipping stylesheet:', sheetError.message);
    }
  }
  
  // Build final CSS
  let finalCSS = '';
  
  // Add keyframes first (animations need to be defined before use)
  if (keyframesRules.length > 0) {
    finalCSS += '/* Animations */\n';
    finalCSS += keyframesRules.join('\n\n') + '\n\n';
  }
  
  if (cssRules.length > 0) {
    finalCSS += '/* Original CSS rules */\n';
    finalCSS += cssRules.join('\n') + '\n\n';
  }
  
  // Add media queries
  for (const [condition, rules] of Object.entries(mediaQueries)) {
    if (rules.length > 0) {
      finalCSS += `@media ${condition} {\n`;
      finalCSS += '  ' + rules.join('\n  ');
      finalCSS += '\n}\n\n';
    }
  }
  
  console.log('✅ Extracted', cssRules.length, 'CSS rules,', keyframesRules.length, 'animations, and', Object.keys(mediaQueries).length, 'media queries');
  
  return finalCSS;
}

/**
 * PRODUCTION: Capture element with ALL computed styles inline
 * Ensures pixel-perfect reproduction on any platform
 */
function captureWithAllStyles(element) {
  const clone = element.cloneNode(true);
  
  // Keep external stylesheet links (for responsive CSS)
  // Remove inline style/script tags
  const styleTags = clone.querySelectorAll('style');
  styleTags.forEach(tag => tag.remove());
  
  const scriptTags = clone.querySelectorAll('script');
  scriptTags.forEach(tag => tag.remove());
  
  // Clean invalid attributes
  cleanInvalidAttributes(clone);
  
  // Apply computed styles to ALL elements
  applyComputedStylesToTree(element, clone);
  
  return clone.outerHTML;
}

/**
 * Apply computed styles to entire element tree
 * RESPONSIVE MODE: Only applies visual styles, preserves class-based responsive behavior
 */
function applyComputedStylesToTree(original, clone) {
  const originals = [original, ...original.querySelectorAll('*')];
  const clones = [clone, ...clone.querySelectorAll('*')];
  
  for (let i = 0; i < originals.length && i < clones.length; i++) {
    const orig = originals[i];
    const cln = clones[i];
    
    if (orig.nodeType !== 1 || cln.nodeType !== 1) continue;
    
    // Check if element already has inline styles from original HTML
    const hasOriginalInlineStyles = orig.hasAttribute('style');
    
    // If element has Tailwind/responsive classes, skip inline style injection
    // Let the extracted CSS and classes handle styling
    const classList = orig.className || '';
    const hasTailwind = /\b(sm:|md:|lg:|xl:|2xl:|max-|min-)/.test(classList);
    
    if (hasTailwind && !hasOriginalInlineStyles) {
      // Keep classes only, no inline styles
      continue;
    }
    
    const computed = window.getComputedStyle(orig);
    const styles = extractEssentialStyles(orig, computed);
    
    if (styles) {
      // Merge with original inline styles if they exist
      const originalStyles = orig.getAttribute('style') || '';
      const mergedStyles = originalStyles ? `${originalStyles}; ${styles}` : styles;
      cln.setAttribute('style', mergedStyles);
    }
  }
}

/**
 * Extract essential computed styles (RESPONSIVE-FRIENDLY)
 * Only captures visual styles, skips layout properties for responsive elements
 */
function extractEssentialStyles(element, computed) {
  const tagName = element.tagName.toLowerCase();
  const isSVG = element.namespaceURI === 'http://www.w3.org/2000/svg';
  const classList = element.className || '';
  
  // Check if element has Tailwind or responsive classes
  const hasTailwind = /\b(sm|md|lg|xl|2xl|max-|min-)/.test(classList);
  const hasResponsiveClasses = /\b(container|flex|grid|col-|row-)/.test(classList);
  
  // For elements with Tailwind/responsive classes, only capture visual styles
  // Skip layout properties to preserve responsive behavior
  const visualOnlyProps = [
    // Typography (visual) - ENHANCED
    'fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'lineHeight',
    'textAlign', 'textTransform', 'letterSpacing', 'textDecoration',
    'textShadow', 'textIndent', 'textOverflow', 'whiteSpace', 'wordSpacing',
    'fontVariant', 'fontStretch', 'fontSizeAdjust', 'fontKerning',
    'color',
    
    // Spacing (CRITICAL for layout!) - ADDED
    'padding', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
    'margin', 'marginTop', 'marginRight', 'marginBottom', 'marginLeft',
    
    // Background (visual)
    'backgroundColor', 'backgroundImage', 'backgroundSize', 'backgroundPosition',
    'backgroundRepeat',
    
    // Border (visual)
    'border', 'borderRadius', 'borderWidth', 'borderStyle', 'borderColor',
    'borderTop', 'borderRight', 'borderBottom', 'borderLeft',
    
    // Effects (visual)
    'opacity', 'boxShadow', 'cursor', 'visibility',
    
    // Animation properties (CRITICAL for marquee, carousels, etc.)
    'animation', 'animationName', 'animationDuration', 'animationTimingFunction',
    'animationDelay', 'animationIterationCount', 'animationDirection', 'animationFillMode',
    'animationPlayState', 'transform', 'transition'
  ];
  
  // For non-responsive elements, capture more properties
  const fullProps = isSVG 
    ? ['fill', 'stroke', 'strokeWidth', 'opacity']
    : [
      ...visualOnlyProps,
      // Only add layout for non-responsive elements
      'display', 'position', 'top', 'right', 'bottom', 'left',
      'width', 'height', 'maxWidth', 'maxHeight', 'minWidth', 'minHeight',
      'zIndex', 'overflow', 'overflowX', 'overflowY',
      'gap', 'rowGap', 'columnGap',
      'transform', 'transition',
      // Animation properties (CRITICAL for marquee, etc.)
      'animation', 'animationName', 'animationDuration', 'animationTimingFunction',
      'animationDelay', 'animationIterationCount', 'animationDirection', 'animationFillMode',
      'animationPlayState'
    ];
  
  // Choose which properties to capture based on element type
  const propsToCapture = (hasTailwind || hasResponsiveClasses) ? visualOnlyProps : fullProps;
  
  const styleValues = [];
  
  for (const prop of propsToCapture) {
    const value = computed.getPropertyValue(kebabCase(prop));
    
    // Don't skip 'none' for textDecoration (needed to remove underlines)
    if (!value) continue;
    if (value === 'auto' && prop !== 'margin' && prop !== 'marginTop' && prop !== 'marginRight' && prop !== 'marginBottom' && prop !== 'marginLeft') continue;
    if (value === 'normal' && prop !== 'lineHeight') continue;
    
    // Skip default values
    if (value === 'rgb(0, 0, 0)' && prop === 'color') continue;
    if (value === 'rgba(0, 0, 0, 0)' && prop === 'backgroundColor') continue;
    if (value === '0px' && !['top', 'left', 'padding', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'margin', 'marginTop', 'marginRight', 'marginBottom', 'marginLeft'].includes(prop)) continue;
    
    // Clean and normalize value
    let cleanValue = value;
    
    // Fix protocol-relative URLs
    if (/url\(["']?\/\//.test(cleanValue)) {
      cleanValue = cleanValue.replace(/url\(["']?\/\//g, 'url("https://');
    }
    
    // Skip invalid values
    if (/rgb\(\s*,\s*,\s*\)/.test(cleanValue)) continue;
    
    styleValues.push(`${kebabCase(prop)}: ${cleanValue}`);
  }
  
  // Force remove underline from links if textDecoration wasn't captured
  if (tagName === 'a' && !styleValues.some(s => s.includes('text-decoration'))) {
    styleValues.push('text-decoration: none');
  }
  
  return styleValues.length > 0 ? styleValues.join('; ') : '';
}

/**
 * Convert camelCase to kebab-case
 */
function kebabCase(str) {
  return str.replace(/([A-Z])/g, '-$1').toLowerCase();
}

/**
 * Clean invalid HTML attributes that break React
 */
function cleanInvalidAttributes(element) {
  const elements = [element, ...element.querySelectorAll('*')];
  
  for (const el of elements) {
    if (el.nodeType !== 1) continue;
    
    const attrsToRemove = [];
    
    for (const attr of el.attributes || []) {
      const name = attr.name;
      
      // Remove attributes with colons (except xmlns)
      if (name.includes(':') && !name.startsWith('xmlns')) {
        attrsToRemove.push(name);
        continue;
      }
      
      // Remove framework-specific attributes
      if (/^(ap|x|v|ng|data-aos|reveal)-/.test(name)) {
        attrsToRemove.push(name);
        continue;
      }
      
      // Remove empty attributes (except boolean ones)
      const booleanAttrs = ['checked', 'disabled', 'selected', 'required', 'multiple', 'hidden', 'readonly', 'autofocus'];
      if (attr.value === '' && !booleanAttrs.includes(name)) {
        attrsToRemove.push(name);
      }
    }
    
    attrsToRemove.forEach(name => el.removeAttribute(name));
  }
}

/**
 * PRODUCTION: Convert HTML to React JSX with FONTS
 */
function convertHtmlToReact(html, tagName, extractedCSS = '', shopifyData = null, webFonts = null) {
  const componentName = 'Captured' + tagName.charAt(0).toUpperCase() + tagName.slice(1) + 'Section';
  
  // Convert HTML to JSX
  const jsx = htmlToJSX(html);
  
  // Format JSX
  const formattedJsx = formatJsx(jsx);
  
  // Build font CSS
  let fontCSS = '';
  if (webFonts) {
    if (webFonts.imports.length > 0) {
      fontCSS += '/* Web Fonts */\n';
      fontCSS += webFonts.imports.join('\n') + '\n\n';
    }
    if (webFonts.fontFaces.length > 0) {
      fontCSS += '/* Custom Font Faces */\n';
      fontCSS += webFonts.fontFaces.join('\n\n') + '\n\n';
    }
  }
  
  // Escape CSS for template literal
  const escapedCSS = (fontCSS + extractedCSS).replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');
  
  // Build Shopify comment if data exists
  let shopifyComment = '';
  if (shopifyData && shopifyData.isShopify) {
    shopifyComment = `\n\n/*
 * 🏪 SHOPIFY SECTION DATA
 * 
 * Shop: ${shopifyData.shopDomain}
 * Theme: ${shopifyData.theme || 'Unknown'}
 * 
 * Sections: ${shopifyData.sections.length > 0 ? '\n' + shopifyData.sections.map(s => `   - ${s.type} (${s.id})`).join('\n') : 'None'}
 * ${shopifyData.product ? `\n * Product:\n *   - ${shopifyData.product.title}\n *   - Price: ${shopifyData.product.price} ${shopifyData.product.currency}` : ''}
 * 
 * Full Data:
 * ${JSON.stringify(shopifyData, null, 2).split('\n').map(line => ' * ' + line).join('\n')}
 */`;
  }
  
  // Build React component
  const reactCode = `import React from "react";

export default function ${componentName}() {
  return (
    <>
${formattedJsx}
      <style
        dangerouslySetInnerHTML={{
          __html: \`
html {
  box-sizing: border-box;
}
body {
  margin: 0px;
}
* {
  box-sizing: border-box;
}
${escapedCSS}
\`,
        }}
      />
    </>
  );
}${shopifyComment}`;

  return reactCode;
}

/**
 * Convert HTML to JSX
 */
function htmlToJSX(htmlString) {
  let jsx = htmlString;

  // Normalize URLs for modern browsers
  jsx = jsx.replace(/\s(src|href)=["']([^"']+)["']/gi, (match, attr, url) => {
    let cleaned = url
      .replace(/&amp;/g, '&')
      .replace(/&quot;?/g, '"')
      .trim();

    // Strip trailing descriptors like "740w"
    const firstToken = cleaned.split(/\s+/)[0];
    let normalized = firstToken;

    // Convert protocol-relative URLs
    if (normalized.startsWith('//')) {
      normalized = `https:${normalized}`;
    }

    return ` ${attr}="${normalized}"`;
  });

  // Remove invalid attributes
  jsx = jsx.replace(/\s[a-zA-Z0-9_-]+:[a-zA-Z0-9_-]*="[^"]*"/g, '');

  const invalidAttrs = [
    'reveal-on-scroll', 'ap-revealvisibility', 'attached-image',
    'reveal', 'ap-loaded', 'ap-object-loaded', 'data-srcset',
    'data-aos', 'data-aos-delay', 'data-aos-duration',
  ];
  invalidAttrs.forEach(attr => {
    jsx = jsx.replace(new RegExp(`\\s${attr}="[^"]*"`, 'gi'), '');
    jsx = jsx.replace(new RegExp(`\\s${attr}(?=[\\s>])`, 'gi'), '');
  });

  jsx = jsx.replace(/\s(ap|x|v|ng)-[a-zA-Z0-9_-]+="[^"]*"/g, '');
  jsx = jsx.replace(/\s(ap|x|v|ng)-[a-zA-Z0-9_-]+(?=[\s>])/g, '');
  jsx = jsx.replace(/\s[a-zA-Z_][a-zA-Z0-9_-]*=""/g, '');

  // Convert custom elements to div
  jsx = jsx.replace(/<([a-z]+-[a-z0-9-]+)(\s|>)/gi, (match, tagName, after) => {
    return `<div data-original-tag="${tagName}"${after}`;
  });
  jsx = jsx.replace(/<\/([a-z]+-[a-z0-9-]+)>/gi, '</div>');

  // HTML to JSX conversions
  jsx = jsx.replace(/\sclass=/g, ' className=');
  jsx = jsx.replace(/\sfor=/g, ' htmlFor=');
  jsx = jsx.replace(/\stabindex=/g, ' tabIndex=');
  jsx = jsx.replace(/\sreadonly/gi, ' readOnly');
  jsx = jsx.replace(/\smaxlength=/g, ' maxLength=');
  jsx = jsx.replace(/\scolspan=/g, ' colSpan=');
  jsx = jsx.replace(/\srowspan=/g, ' rowSpan=');
  jsx = jsx.replace(/\sautocomplete=/g, ' autoComplete=');
  jsx = jsx.replace(/\sautofocus/gi, ' autoFocus');

  // SVG attributes
  jsx = jsx.replace(/\sclip-path=/g, ' clipPath=');
  jsx = jsx.replace(/\sfill-rule=/g, ' fillRule=');
  jsx = jsx.replace(/\sstroke-width=/g, ' strokeWidth=');
  jsx = jsx.replace(/\sstroke-linecap=/g, ' strokeLinecap=');
  jsx = jsx.replace(/\sstroke-linejoin=/g, ' strokeLinejoin=');

  // Self-closing tags
  const selfClosingTags = ['img', 'input', 'br', 'hr', 'meta', 'link', 'area', 'base', 'col', 'embed', 'param', 'source', 'track', 'wbr'];
  selfClosingTags.forEach(tag => {
    const regex = new RegExp(`<${tag}([^>]*?)(?<!/)>`, 'gi');
    jsx = jsx.replace(regex, `<${tag}$1 />`);
  });

  // Convert inline styles to style objects
  jsx = jsx.replace(/style="([^"]*)"/g, (match, styleStr) => {
    const styleObj = convertStyleStringToObject(styleStr);
    return `style={${styleObj}}`;
  });

  // Boolean attributes
  jsx = jsx.replace(/\s(checked|disabled|selected|required|multiple|hidden)(?=[\s>])/gi, (match, attr) => {
    return ` ${attr}={true}`;
  });

  // Comments
  jsx = jsx.replace(/<!--(.*?)-->/gs, '{/* $1 */}');

  // Final cleanup
  jsx = jsx.replace(/\s[a-zA-Z_][a-zA-Z0-9_-]*=""/g, '');

  return jsx;
}

/**
 * Convert CSS style string to React style object
 */
function convertStyleStringToObject(styleStr) {
  if (!styleStr || !styleStr.trim()) return '{}';
  
  const styles = [];
  
  // Extract and protect URL values
  const urlPlaceholders = [];
  let protectedStr = styleStr.replace(/url\([^)]+\)/g, (match) => {
    urlPlaceholders.push(match);
    return `__URL_PLACEHOLDER_${urlPlaceholders.length - 1}__`;
  });
  
  protectedStr.split(';').forEach(declaration => {
    const colonIndex = declaration.indexOf(':');
    if (colonIndex === -1) return;
    
    let prop = declaration.slice(0, colonIndex).trim();
    let value = declaration.slice(colonIndex + 1).trim();

    // Decode entities
    value = value.replace(/&quot;?/g, '"').replace(/&amp;/g, '&');
    
    if (!prop || !value) return;
    
    // Skip invalid properties
    if (prop.startsWith('-')) return;
    if (prop.startsWith('webkit') || prop.startsWith('moz') || prop.startsWith('ms')) return;
    
    // Convert to camelCase
    prop = prop.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
    
    // Restore URLs
    value = value.replace(/__URL_PLACEHOLDER_(\d+)__/g, (match, index) => {
      let url = urlPlaceholders[parseInt(index)];
      url = url.replace(/&quot;/g, '');
      url = url.replace(/&amp;/g, '&');
      url = url.replace(/url\(([^)]+)\)/, (m, innerUrl) => {
        innerUrl = innerUrl.replace(/^["']|["']$/g, '');
        return `url('${innerUrl}')`;
      });
      return url;
    });
    
    // Skip invalid values
    if (
      value === '"' ||
      value === '""' ||
      /rgb\(\s*,\s*,\s*\)/i.test(value)
    ) {
      return;
    }
    
    // Format value
    if (/^-?\d+$/.test(value)) {
      styles.push(`${prop}: ${value}`);
    } else {
      value = value.replace(/"/g, '\\"');
      styles.push(`${prop}: "${value}"`);
    }
  });
  
  if (styles.length === 0) return '{}';
  
  return `{ ${styles.join(', ')} }`;
}

/**
 * Format JSX with proper indentation
 */
function formatJsx(jsx) {
  const lines = jsx.split('\n');
  let indentLevel = 3; // Start at component level
  const formatted = [];
  
  for (let line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    // Decrease indent for closing tags
    if (trimmed.startsWith('</')) {
      indentLevel = Math.max(3, indentLevel - 1);
    }
    
    // Add line with indent
    formatted.push('  '.repeat(indentLevel) + trimmed);
    
    // Increase indent for opening tags (not self-closing)
    if (trimmed.startsWith('<') && !trimmed.startsWith('</') && !trimmed.endsWith('/>')) {
      indentLevel++;
    }
  }
  
  return formatted.join('\n');
}

/**
 * Show notification to user
 */
function showNotification(title, message, options = {}) {
  // Remove existing notification
  const existing = document.getElementById('grab-ai-notification');
  if (existing) existing.remove();
  
  const isError = title.toLowerCase().includes('fail') || title.toLowerCase().includes('error');
  const isSuccess = title.includes('✅') || title.toLowerCase().includes('ready') || title.toLowerCase().includes('captured');
  
  const bgColor = isError ? '#EF4444' : isSuccess ? '#10B981' : '#4CAF50';
  
  const notification = document.createElement('div');
  notification.id = 'grab-ai-notification';
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${bgColor};
    color: white;
    padding: 16px 24px;
    border-radius: 12px;
    box-shadow: 0 6px 20px rgba(0,0,0,0.25);
    z-index: 10000000;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    max-width: 380px;
    animation: slideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  `;
  
  notification.innerHTML = `
    <div style="display: flex; align-items: start; gap: 12px;">
      <div style="flex: 1;">
        <div style="font-weight: 700; margin-bottom: 6px; font-size: 15px;">${title}</div>
        <div style="opacity: 0.95; line-height: 1.5;">${message}</div>
        ${options.showCopyTip ? `
          <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.2); font-size: 12px; opacity: 0.9;">
            💡 Tip: Open extension popup to manually copy
          </div>
        ` : ''}
      </div>
      <button id="grab-ai-close-notif" style="
        background: rgba(255,255,255,0.2);
        border: none;
        color: white;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        cursor: pointer;
        font-size: 16px;
        line-height: 1;
        padding: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.2s;
      ">×</button>
    </div>
  `;
  
  // Add animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from { 
        transform: translateX(400px) scale(0.9); 
        opacity: 0; 
      }
      to { 
        transform: translateX(0) scale(1); 
        opacity: 1; 
      }
    }
    @keyframes slideOut {
      from { 
        transform: translateX(0) scale(1); 
        opacity: 1; 
      }
      to { 
        transform: translateX(400px) scale(0.9); 
        opacity: 0; 
      }
    }
    #grab-ai-close-notif:hover {
      background: rgba(255,255,255,0.3) !important;
    }
  `;
  document.head.appendChild(style);
  
  document.body.appendChild(notification);
  
  // Close button
  document.getElementById('grab-ai-close-notif')?.addEventListener('click', () => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  });
  
  // Auto remove after duration
  const duration = options.duration || (isError ? 6000 : 4000);
  setTimeout(() => {
    if (notification.parentNode) {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }
  }, duration);
}

console.log('✅ Grab AI Extension loaded - Ready to capture!');
