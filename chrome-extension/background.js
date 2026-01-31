/**
 * Grab AI - Background Script
 * Handles captured data processing and React component generation
 */

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'elementCaptured') {
    handleElementCapture(message.data, sender.tab.id);
    sendResponse({ success: true });
  }
  return true;
});

/**
 * Process captured element data and generate React component
 */
async function handleElementCapture(capturedData, tabId) {
  console.log('✅ Element captured from content script');
  console.log('   Tag:', capturedData.tagName);
  console.log('   URL:', capturedData.pageUrl);
  console.log('   Size:', capturedData.dimensions?.width, 'x', capturedData.dimensions?.height);
  
  try {
    console.log('🔄 Converting to React component...');
    
    // Convert captured data to React component
    const reactComponent = await convertToReactComponent(capturedData);
    
    console.log('✅ React component generated:', reactComponent.componentName);
    console.log('   Code length:', reactComponent.code.length, 'characters');
    
    // Save to storage
    await saveCapture(capturedData, reactComponent);
    console.log('✅ Saved to Chrome storage');
    
    // Send to your Grab AI app
    await sendToGrabAI(reactComponent);
    
    // Notify user (with error handling)
    try {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon-48.png',
        title: 'Grab AI - Capture Complete',
        message: 'React component generated! Click extension to copy code.',
        priority: 2
      });
    } catch (notifError) {
      console.log('Notification failed (not critical):', notifError);
    }
    
    console.log('✅ Capture complete! Open popup to copy code.');
    
  } catch (error) {
    console.error('❌ Processing error:', error);
    console.error('   Stack:', error.stack);
    
    // Try to show error notification
    try {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon-48.png',
        title: 'Grab AI - Error',
        message: 'Failed to process captured element: ' + error.message,
        priority: 2
      });
    } catch (notifError) {
      console.error('Could not show error notification:', notifError);
    }
  }
}

/**
 * Convert captured data to React component code
 * Simplified approach similar to htmltoreact.app
 */
async function convertToReactComponent(data) {
  const componentName = generateComponentName(data.tagName);
  
  // Build Tailwind classes from captured styles
  const tailwindClasses = convertStylesToTailwind(data);
  
  // Generate responsive classes
  const responsiveClasses = generateResponsiveClasses(data);
  
  // Clean the HTML content and convert to JSX
  const jsxContent = convertHTMLToJSX(data);
  
  // Build clean component code (similar to htmltoreact.app)
  const code = `import React from "react";

export default function ${componentName}() {
  return (
    <${data.tagName}
      className="${tailwindClasses} ${responsiveClasses}"
      style={{
        ${generateInlineStyles(data)}
      }}
    >
      ${jsxContent}
    </${data.tagName}>
  );
}`;

  return {
    code,
    componentName,
    metadata: {
      generatedFrom: 'website-capture',
      sourceUrl: data.pageUrl,
      capturedAt: data.timestamp,
      originalTag: data.tagName,
      dimensions: data.dimensions,
      colorPalette: extractColorPalette(data),
      images: data.images,
      responsive: true,
      enhancements: [
        'Tailwind CSS styling',
        'Responsive design',
        'Inline styles for exact match',
        'Clean JSX structure'
      ],
      shopifyCompatible: true
    }
  };
}

/**
 * Convert HTML content to clean JSX
 */
function convertHTMLToJSX(data) {
  // Get text content or use innerHTML as fallback
  if (data.textContent && data.textContent.allText) {
    return data.textContent.allText.substring(0, 200);
  }
  
  // Try to get first heading
  if (data.textContent && data.textContent.headings && data.textContent.headings.length > 0) {
    return data.textContent.headings[0].text;
  }
  
  // Fallback to simple content
  return 'Captured Component Content';
}

/**
 * Generate inline styles from captured data
 */
function generateInlineStyles(data) {
  const styles = [];
  
  // Layout
  if (data.layout) {
    if (data.layout.width && data.layout.width !== 'auto') {
      styles.push(`width: "${data.layout.width}"`);
    }
    if (data.layout.height && data.layout.height !== 'auto') {
      styles.push(`height: "${data.layout.height}"`);
    }
  }
  
  // Colors
  if (data.colors) {
    if (data.colors.color && data.colors.color !== 'rgb(0, 0, 0)') {
      styles.push(`color: "${data.colors.color}"`);
    }
    if (data.colors.backgroundColor && data.colors.backgroundColor !== 'rgba(0, 0, 0, 0)') {
      styles.push(`backgroundColor: "${data.colors.backgroundColor}"`);
    }
  }
  
  // Typography
  if (data.typography) {
    if (data.typography.fontSize) {
      styles.push(`fontSize: "${data.typography.fontSize}"`);
    }
    if (data.typography.fontWeight && data.typography.fontWeight !== '400') {
      styles.push(`fontWeight: "${data.typography.fontWeight}"`);
    }
    if (data.typography.lineHeight) {
      styles.push(`lineHeight: "${data.typography.lineHeight}"`);
    }
  }
  
  // Border radius
  if (data.styles && data.styles['border-radius'] && data.styles['border-radius'] !== '0px') {
    styles.push(`borderRadius: "${data.styles['border-radius']}"`);
  }
  
  return styles.join(',\n        ');
}

/**
 * Generate component name from tag
 */
function generateComponentName(tagName) {
  const base = tagName.charAt(0).toUpperCase() + tagName.slice(1);
  const timestamp = Date.now().toString().slice(-4);
  return `Captured${base}${timestamp}`;
}

/**
 * Convert CSS styles to Tailwind classes
 */
function convertStylesToTailwind(data) {
  const classes = [];
  const layout = data.layout;
  const typography = data.typography;
  const colors = data.colors;
  
  // Display & Layout
  if (layout.display === 'flex') {
    classes.push('flex');
    if (layout.flexDirection === 'column') classes.push('flex-col');
    if (layout.justifyContent) classes.push(mapJustifyContent(layout.justifyContent));
    if (layout.alignItems) classes.push(mapAlignItems(layout.alignItems));
    if (layout.gap && layout.gap !== '0px') classes.push(mapGap(layout.gap));
  }
  
  if (layout.display === 'grid') {
    classes.push('grid');
    if (layout.gridTemplateColumns) {
      const cols = layout.gridTemplateColumns.split(' ').length;
      classes.push(`grid-cols-${cols}`);
    }
  }
  
  // Spacing
  if (layout.padding && layout.padding !== '0px') classes.push(mapSpacing('p', layout.padding));
  if (layout.margin && layout.margin !== '0px') classes.push(mapSpacing('m', layout.margin));
  
  // Typography
  if (typography.fontSize) classes.push(mapFontSize(typography.fontSize));
  if (typography.fontWeight) classes.push(mapFontWeight(typography.fontWeight));
  if (typography.textAlign && typography.textAlign !== 'start') classes.push(`text-${typography.textAlign}`);
  
  // Colors
  if (colors.backgroundColor && colors.backgroundColor !== 'rgba(0, 0, 0, 0)') {
    classes.push(mapBackgroundColor(colors.backgroundColorHex));
  }
  if (colors.color) classes.push(mapTextColor(colors.colorHex));
  
  // Borders
  const styles = data.styles;
  if (styles['border-radius'] && styles['border-radius'] !== '0px') {
    classes.push(mapBorderRadius(styles['border-radius']));
  }
  
  // Shadow
  if (styles['box-shadow'] && styles['box-shadow'] !== 'none') {
    classes.push('shadow-md');
  }
  
  // Overflow
  if (layout.overflow === 'hidden') classes.push('overflow-hidden');
  if (layout.overflowX === 'auto') classes.push('overflow-x-auto');
  if (layout.overflowY === 'auto') classes.push('overflow-y-auto');
  
  // Position
  if (layout.position === 'relative') classes.push('relative');
  if (layout.position === 'absolute') classes.push('absolute');
  if (layout.position === 'fixed') classes.push('fixed');
  
  // Animations
  if (data.animations.transition !== 'none') {
    classes.push('transition-all', 'duration-300', 'ease-in-out');
  }
  
  // Hover effects
  classes.push('hover:scale-105', 'hover:shadow-lg');
  
  return classes.join(' ');
}

/**
 * Generate responsive Tailwind classes
 */
function generateResponsiveClasses(data) {
  const classes = [];
  const viewport = data.responsive.currentViewport;
  
  // Mobile-first approach
  // Default styles are mobile, add breakpoints for larger screens
  
  // Tablet (md:)
  classes.push('md:p-6', 'md:text-base');
  
  // Desktop (lg:)
  classes.push('lg:p-8', 'lg:text-lg');
  
  // Extra large (xl:)
  classes.push('xl:max-w-7xl', 'xl:mx-auto');
  
  return classes.join(' ');
}

/**
 * Generate JSX content from captured HTML
 */
function generateJSXContent(data) {
  // For now, return placeholder content
  // In production, would parse innerHTML and convert to JSX
  
  if (data.textContent.headings.length > 0) {
    return data.textContent.headings[0].text;
  }
  
  if (data.textContent.allText) {
    return data.textContent.allText.substring(0, 100);
  }
  
  return 'Captured Component Content';
}

/**
 * Extract color palette
 */
function extractColorPalette(data) {
  const colors = new Set();
  
  if (data.colors.colorHex) colors.add(data.colors.colorHex);
  if (data.colors.backgroundColorHex) colors.add(data.colors.backgroundColorHex);
  
  return Array.from(colors).filter(c => c !== null);
}

/**
 * Tailwind mapping helpers
 */
function mapJustifyContent(value) {
  const map = {
    'flex-start': 'justify-start',
    'flex-end': 'justify-end',
    'center': 'justify-center',
    'space-between': 'justify-between',
    'space-around': 'justify-around',
    'space-evenly': 'justify-evenly'
  };
  return map[value] || '';
}

function mapAlignItems(value) {
  const map = {
    'flex-start': 'items-start',
    'flex-end': 'items-end',
    'center': 'items-center',
    'baseline': 'items-baseline',
    'stretch': 'items-stretch'
  };
  return map[value] || '';
}

function mapGap(value) {
  const px = parseInt(value);
  if (px <= 4) return 'gap-1';
  if (px <= 8) return 'gap-2';
  if (px <= 12) return 'gap-3';
  if (px <= 16) return 'gap-4';
  if (px <= 24) return 'gap-6';
  if (px <= 32) return 'gap-8';
  return 'gap-12';
}

function mapSpacing(prefix, value) {
  const px = parseInt(value);
  if (px <= 4) return `${prefix}-1`;
  if (px <= 8) return `${prefix}-2`;
  if (px <= 12) return `${prefix}-3`;
  if (px <= 16) return `${prefix}-4`;
  if (px <= 24) return `${prefix}-6`;
  if (px <= 32) return `${prefix}-8`;
  if (px <= 48) return `${prefix}-12`;
  return `${prefix}-16`;
}

function mapFontSize(value) {
  const px = parseInt(value);
  if (px <= 12) return 'text-xs';
  if (px <= 14) return 'text-sm';
  if (px <= 16) return 'text-base';
  if (px <= 18) return 'text-lg';
  if (px <= 20) return 'text-xl';
  if (px <= 24) return 'text-2xl';
  if (px <= 30) return 'text-3xl';
  return 'text-4xl';
}

function mapFontWeight(value) {
  const weight = parseInt(value);
  if (weight <= 300) return 'font-light';
  if (weight <= 400) return 'font-normal';
  if (weight <= 500) return 'font-medium';
  if (weight <= 600) return 'font-semibold';
  if (weight <= 700) return 'font-bold';
  return 'font-extrabold';
}

function mapBackgroundColor(hex) {
  if (!hex) return '';
  // Simplified - in production would map to closest Tailwind color
  return `bg-[${hex}]`;
}

function mapTextColor(hex) {
  if (!hex) return '';
  return `text-[${hex}]`;
}

function mapBorderRadius(value) {
  const px = parseInt(value);
  if (px <= 2) return 'rounded-sm';
  if (px <= 4) return 'rounded';
  if (px <= 6) return 'rounded-md';
  if (px <= 8) return 'rounded-lg';
  if (px <= 12) return 'rounded-xl';
  if (px <= 16) return 'rounded-2xl';
  return 'rounded-3xl';
}

/**
 * Save capture to Chrome storage
 */
async function saveCapture(capturedData, reactComponent) {
  const captures = await chrome.storage.local.get('captures') || { captures: [] };
  
  captures.captures = captures.captures || [];
  captures.captures.unshift({
    id: Date.now(),
    data: capturedData,
    component: reactComponent,
    timestamp: new Date().toISOString()
  });
  
  // Keep only last 50 captures
  if (captures.captures.length > 50) {
    captures.captures = captures.captures.slice(0, 50);
  }
  
  await chrome.storage.local.set({ captures: captures.captures });
}

/**
 * Send to Grab AI application (ENABLED - Production Mode)
 */
async function sendToGrabAI(reactComponent) {
  try {
    console.log('📤 Sending to Grab AI app...');
    
    const response = await fetch('http://localhost:9003/api/capture/from-extension', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(reactComponent)
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Sent to Grab AI successfully:', result);
      
      // Show success notification
      try {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon-48.png',
          title: 'Grab AI - Component Added!',
          message: `${reactComponent.componentName} added to canvas automatically!`,
          priority: 2
        });
      } catch (e) {
        console.log('Notification skipped');
      }
    } else {
      console.log('⚠️ Grab AI app responded with error:', response.status);
      throw new Error('Server responded with ' + response.status);
    }
  } catch (error) {
    console.log('⚠️ Grab AI app not running or connection failed:', error.message);
    console.log('💾 Component saved locally - use "Copy Code" in popup');
  }
}
