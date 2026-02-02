'use client';

import React, { useMemo, memo } from 'react';

interface PreviewProps {
  code: string;
  type: 'html' | 'react' | 'vanilla';
  width?: number;
  height?: number;
  onContentResize?: (width: number, height: number) => void;
}

/**
 * Preview Component - Renders code in a sandboxed iframe
 * 
 * - HTML: Direct srcdoc rendering
 * - React: Inline Babel transpilation with React CDN
 * - Vanilla: Plain JS execution
 */
function Preview({ code, type, width = 500, height = 300, onContentResize }: PreviewProps) {
  const iframeRef = React.useRef<HTMLIFrameElement>(null);

  const srcdoc = useMemo(() => {
    switch (type) {
      case 'html':
        return generateHtmlPreview(code);
      case 'react':
        return generateReactPreview(code);
      case 'vanilla':
        return generateVanillaPreview(code);
      default:
        return generateHtmlPreview(code);
    }
  }, [code, type]);

  // Listen for size updates from iframe
  React.useEffect(() => {
    if (!onContentResize) return;

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'content-size') {
        onContentResize(event.data.width, event.data.height);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onContentResize]);

  return (
    <iframe
      ref={iframeRef}
      srcDoc={srcdoc}
      title="Code Preview"
      sandbox="allow-scripts allow-same-origin"
      style={{
        width: '100%',
        height: '100%',
        border: 'none',
        borderRadius: '0 0 8px 8px',
        backgroundColor: '#fff',
      }}
    />
  );
}

/**
 * Generate HTML preview - direct rendering
 */
function generateHtmlPreview(code: string): string {
  const trimmed = code.trim();

  // If it's a full HTML document, use as-is
  if (trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<html')) {
    return trimmed;
  }

  // Wrap partial HTML in a document
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow-x: hidden; }
    body { font-family: system-ui, -apple-system, sans-serif; -ms-overflow-style: none; scrollbar-width: none; }
    ::-webkit-scrollbar { display: none; }
  </style>
</head>
<body>
  ${trimmed}
  <script>
    // Report content size to parent
    function reportSize() {
      const width = Math.max(
        document.body.scrollWidth,
        document.body.offsetWidth,
        document.documentElement.scrollWidth,
        document.documentElement.offsetWidth
      );
      const height = Math.max(
        document.body.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.scrollHeight,
        document.documentElement.offsetHeight
      );
      window.parent.postMessage({ type: 'content-size', width, height }, '*');
    }
    
    // Report on load and when DOM changes
    window.addEventListener('load', reportSize);
    setTimeout(reportSize, 100);
    setTimeout(reportSize, 500);
    
    // Watch for DOM changes
    if (window.ResizeObserver) {
      new ResizeObserver(reportSize).observe(document.body);
    }
  </script>
</body>
</html>`;
}

/**
 * Generate React preview with inline Babel transpilation
 */
function generateReactPreview(code: string): string {
  let processedCode = code.trim();

  // Extract <style> tags and their content BEFORE removing them
  const extractedStyles: string[] = [];
  const styleTagRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  let styleMatch;
  
  while ((styleMatch = styleTagRegex.exec(processedCode)) !== null) {
    extractedStyles.push(styleMatch[1]);
  }

  // Remove 'use client' directive (not needed in preview)
  processedCode = processedCode
    .replace(/^['"]use client['"];?\s*\n?/gm, '')
    .trim();

  // Remove ALL import statements (CDN handles React)
  // More aggressive removal to catch all variations
  processedCode = processedCode
    .replace(/^import\s+[^;]+;?\s*$/gm, '')
    .replace(/^import\s+\{[^}]+\}\s+from\s+['"][^'"]+['"];?\s*$/gm, '')
    .replace(/^import\s+\*\s+as\s+\w+\s+from\s+['"][^'"]+['"];?\s*$/gm, '')
    .replace(/^import\s+React[^;]*;?\s*$/gm, '')
    .trim();

  // Clean up any remaining empty lines at the start
  processedCode = processedCode.replace(/^\s*\n+/, '');

  // Handle different export patterns
  // export default function App() {} -> function App() {}
  processedCode = processedCode.replace(/^export\s+default\s+function\s+(\w+)/gm, 'function $1');
  // export default App -> (remove, we'll call App at the end)
  processedCode = processedCode.replace(/^export\s+default\s+\w+\s*;?\s*$/gm, '');
  // export function App -> function App
  processedCode = processedCode.replace(/^export\s+function\s+/gm, 'function ');
  // const App = () => ... export default App
  processedCode = processedCode.replace(/^export\s+default\s+/gm, '');
  processedCode = processedCode.replace(/^export\s+/gm, '');

  // Detect component name
  let componentName = 'App';
  const funcMatch = processedCode.match(/function\s+(\w+)\s*\(/);
  const arrowMatch = processedCode.match(/(?:const|let)\s+(\w+)\s*=.*?=>/);

  if (funcMatch) {
    componentName = funcMatch[1];
  } else if (arrowMatch) {
    componentName = arrowMatch[1];
  } else if (!processedCode.includes('function ') && !processedCode.includes('=>')) {
    // If it's just JSX, wrap it in App component
    if (processedCode.includes('<') && processedCode.includes('>')) {
      processedCode = `function App() {\n  return (\n    ${processedCode}\n  );\n}`;
      componentName = 'App';
    }
  }

  // Fix font URLs in extracted styles
  const fixedStyles = extractedStyles.map(cssContent => {
    // Fix protocol-relative URLs (//domain.com → https://domain.com)
    let fixed = cssContent.replace(/url\(["']?\/\//g, 'url("https://');
    
    // Fix relative URLs that start with / (need to determine origin)
    // Extract any base URLs from the CSS to infer origin
    const originMatch = fixed.match(/https?:\/\/([^\/]+)/);
    const origin = originMatch ? `https://${originMatch[1]}` : '';
    
    if (origin) {
      // Fix relative URLs like /cdn/shop/... → https://domain.com/cdn/shop/...
      fixed = fixed.replace(/url\(["']?\/(cdn|assets|files|shop)/g, `url("${origin}/$1`);
    }
    
    // Ensure @import rules are at the top and properly formatted
    const imports: string[] = [];
    const otherRules: string[] = [];
    
    // Split by newlines and categorize
    fixed.split('\n').forEach(line => {
      if (line.trim().startsWith('@import')) {
        imports.push(line);
      } else {
        otherRules.push(line);
      }
    });
    
    // Reassemble with @import at top
    return [...imports, ...otherRules].join('\n');
  });

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script>
    // Initialize script loading tracker
    window.scriptsLoaded = {
      react: false,
      reactDOM: false,
      babel: false,
      tailwind: false,
      framerMotion: false
    };
    
    function handleScriptLoad(scriptName) {
      console.log('✅ Loaded:', scriptName);
      window.scriptsLoaded[scriptName] = true;
    }
    
    function handleScriptError(e, scriptName) {
      const src = e.target.src;
      console.error('❌ Failed to load:', src);
      window.scriptsLoaded[scriptName] = 'failed';
      const errDiv = document.createElement('div');
      errDiv.style = 'background: #fee2e2; color: #dc2626; padding: 8px; font-size: 12px; border-bottom: 1px solid #fca5a5; font-family: sans-serif;';
      errDiv.textContent = '⚠️ Network Error: Failed to load ' + src.split('/').slice(2).join('/');
      document.body.insertBefore(errDiv, document.body.firstChild);
    }
  </script>
  <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin onload="handleScriptLoad('react')" onerror="handleScriptError(event, 'react')"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin onload="handleScriptLoad('reactDOM')" onerror="handleScriptError(event, 'reactDOM')"></script>
  <script src="https://unpkg.com/@babel/standalone@7/babel.min.js" onload="handleScriptLoad('babel')" onerror="handleScriptError(event, 'babel')"></script>
  <script src="https://cdn.tailwindcss.com" onload="handleScriptLoad('tailwind')" onerror="handleScriptError(event, 'tailwind')"></script>
  <script src="https://unpkg.com/framer-motion@10.16.4/dist/framer-motion.js" onload="handleScriptLoad('framerMotion')" onerror="handleScriptError(event, 'framerMotion')"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow-x: hidden; }
    body { font-family: system-ui, -apple-system, sans-serif; -ms-overflow-style: none; scrollbar-width: none; }
    ::-webkit-scrollbar { display: none; }
    #root { width: 100%; height: 100%; }
    .error-display {
      padding: 1rem;
      background: #fee2e2;
      color: #dc2626;
      border-radius: 8px;
      font-family: monospace;
      white-space: pre-wrap;
      font-size: 12px;
      margin: 1rem;
    }
  </style>
  ${fixedStyles.length > 0 ? `
  <!-- Captured Component Styles (with fixed font URLs) -->
  <style>
    ${fixedStyles.join('\n')}
  </style>
  ` : ''}
  <script>
    // Suppress Babel "in-browser transformer" warning
    const originalWarn = console.warn;
    console.warn = function(...args) {
      if (args[0] && typeof args[0] === 'string' && args[0].includes('in-browser Babel transformer')) return;
      originalWarn.apply(console, args);
    };
  </script>
</head>
<body>
  <div id="root">
    <div style="display: flex; align-items: center; justify-content: center; min-height: 200px; color: #6b7280; font-size: 13px; padding: 20px;">
      <div style="text-align: center; max-width: 300px;">
        <div style="margin-bottom: 12px; font-size: 24px;">⏳</div>
        <div style="font-weight: 600; margin-bottom: 16px; color: #374151;">Loading libraries...</div>
        <div id="loading-status" style="font-size: 11px; color: #9ca3af; line-height: 1.8; text-align: left;">
          <div id="status-react">• React: <span style="color: #f59e0b;">Loading...</span></div>
          <div id="status-reactdom">• ReactDOM: <span style="color: #f59e0b;">Loading...</span></div>
          <div id="status-babel">• Babel: <span style="color: #f59e0b;">Loading...</span></div>
        </div>
        <div style="margin-top: 12px; font-size: 10px; color: #d1d5db;">Usually takes 2-5 seconds</div>
      </div>
    </div>
  </div>
  <script>
    // Update loading status UI
    function updateLoadingStatus() {
      const updateStatus = (id, loaded, name) => {
        const el = document.getElementById(id);
        if (!el) return;
        if (loaded === true) {
          el.innerHTML = \`• \${name}: <span style="color: #10b981;">✓ Loaded</span>\`;
        } else if (loaded === 'failed') {
          el.innerHTML = \`• \${name}: <span style="color: #ef4444;">✗ Failed</span>\`;
        }
      };
      
      updateStatus('status-react', window.scriptsLoaded?.react, 'React');
      updateStatus('status-reactdom', window.scriptsLoaded?.reactDOM, 'ReactDOM');
      updateStatus('status-babel', window.scriptsLoaded?.babel, 'Babel');
    }
    
    const statusInterval = setInterval(updateLoadingStatus, 200);
    setTimeout(() => clearInterval(statusInterval), 20000);
  </script>
  <script type="text/babel" data-presets="react">
    // Wait for dependencies
    function waitForDependencies() {
      return new Promise((resolve, reject) => {
        const maxWait = 15000;
        const startTime = Date.now();
        
        const checkInterval = setInterval(() => {
          const hasReact = typeof React !== 'undefined' && window.scriptsLoaded?.react === true;
          const hasReactDOM = typeof ReactDOM !== 'undefined' && window.scriptsLoaded?.reactDOM === true;
          const hasBabel = typeof Babel !== 'undefined' && window.scriptsLoaded?.babel === true;
          
          // Check for failed scripts
          const failed = [];
          if (window.scriptsLoaded?.react === 'failed') failed.push('React');
          if (window.scriptsLoaded?.reactDOM === 'failed') failed.push('ReactDOM');
          if (window.scriptsLoaded?.babel === 'failed') failed.push('Babel');
          
          if (failed.length > 0) {
            clearInterval(checkInterval);
            reject(new Error('Failed to load: ' + failed.join(', ')));
            return;
          }
          
          if (hasReact && hasReactDOM && hasBabel) {
            clearInterval(checkInterval);
            console.log('✅ All dependencies loaded');
            resolve();
          } else if (Date.now() - startTime > maxWait) {
            clearInterval(checkInterval);
            const missing = [];
            if (!hasReact) missing.push('React');
            if (!hasReactDOM) missing.push('ReactDOM');
            if (!hasBabel) missing.push('Babel');
            reject(new Error('Timeout: ' + missing.join(', ')));
          }
        }, 200);
      });
    }
    
    // Execute after dependencies load - WITH COMPREHENSIVE ERROR HANDLING
    waitForDependencies()
      .then(() => {
        console.log('🚀 Dependencies loaded, starting component execution...');
        
        try {
          const { useState, useEffect, useCallback, useMemo, useRef, memo, Fragment, createContext, useContext, useReducer } = React;
          const { motion, AnimatePresence } = window.Motion || { motion: {}, AnimatePresence: () => null };
          
          if (window.Motion && !motion.div) {
            Object.assign(motion, window.Motion.motion || {});
          }
          
          console.log('📝 Transpiling component code...');
          
          ${processedCode}
          
          console.log('✅ Component code transpiled successfully');
          console.log('🎯 Attempting to render component:', '${componentName}');
          console.log('🎯 Component exists?', typeof ${componentName});
          console.log('🎯 Component value:', ${componentName});
          
          if (typeof ${componentName} !== 'function') {
            throw new Error('Component "${componentName}" is not a function. Type: ' + typeof ${componentName});
          }
          
          const root = ReactDOM.createRoot(document.getElementById('root'));
          root.render(React.createElement(${componentName}));
          
          console.log('✅ Component rendered successfully!');
          
          // Clear loading screen after a brief delay to ensure render
          setTimeout(() => {
            console.log('🎨 Component should be visible now');
          }, 500);
          
        } catch (err) {
          console.error('❌ Component execution error:', err);
          console.error('❌ Error type:', err.constructor.name);
          console.error('❌ Error message:', err.message);
          console.error('❌ Stack trace:', err.stack);
          
          document.getElementById('root').innerHTML = 
            '<div class="error-display">' +
            '<strong style="font-size: 16px;">❌ Component Failed to Load</strong><br><br>' +
            '<strong>Component:</strong> ${componentName}<br>' +
            '<strong>Error:</strong> ' + err.message + '<br><br>' +
            '<details style="margin-top: 12px;">' +
            '<summary style="cursor: pointer; color: #3B82F6; font-weight: 600;">View Error Details</summary>' +
            '<pre style="font-size:10px;max-height:200px;overflow:auto;margin-top:8px;background:#F3F4F6;padding:8px;border-radius:4px;">' + 
            (err.stack || 'No stack trace available') + 
            '</pre>' +
            '</details>' +
            '<div style="margin-top: 16px; padding: 12px; background: #FEF3C7; border: 1px solid #FCD34D; border-radius: 8px; font-size: 12px; color: #92400E;">' +
            '<strong>💡 Common Fixes:</strong><br>' +
            '• The component may have syntax errors<br>' +
            '• Check browser console (F12) for details<br>' +
            '• Try capturing a simpler element first<br>' +
            '</div>' +
            '</div>';
        }
      })
      .catch((err) => {
        console.error('❌ Dependency loading error:', err);
        document.getElementById('root').innerHTML = 
          '<div class="error-display">' +
          '<strong style="font-size: 16px;">❌ Failed to Load Libraries</strong><br><br>' +
          '<strong>Error:</strong> ' + err.message + '<br><br>' +
          '<strong>⚡ Quick Fixes:</strong><br>' +
          '1. <strong>Refresh</strong> the page (Ctrl+R)<br>' +
          '2. Check <strong>internet connection</strong><br>' +
          '3. Disable <strong>ad blockers</strong><br>' +
          '4. Check <strong>browser console</strong> (F12)<br>' +
          '</div>';
      });
  </script>
  <script>
    // Report content size for auto-fit
    function reportSize() {
      document.body.offsetHeight; // Force reflow
      const root = document.getElementById('root');
      const width = Math.max(
        document.body.scrollWidth,
        document.body.offsetWidth,
        document.documentElement.scrollWidth,
        document.documentElement.offsetWidth,
        root ? root.scrollWidth : 0,
        root ? root.offsetWidth : 0
      );
      const height = Math.max(
        document.body.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.scrollHeight,
        document.documentElement.offsetHeight,
        root ? root.scrollHeight : 0,
        root ? root.offsetHeight : 0
      );
      
      window.parent.postMessage({ type: 'content-size', width, height }, '*');
    }
    
    reportSize();
    window.addEventListener('load', reportSize);
    setTimeout(reportSize, 100);
    setTimeout(reportSize, 500);
    setTimeout(reportSize, 1000);
    setTimeout(reportSize, 2000);
    
    if (window.ResizeObserver) {
      const observer = new ResizeObserver(reportSize);
      observer.observe(document.body);
      if (document.getElementById('root')) {
        observer.observe(document.getElementById('root'));
      }
    }
    
    if (window.MutationObserver) {
      new MutationObserver(reportSize).observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true
      });
    }
  </script>
</body>
</html>`;
}

/**
 * Generate Vanilla JS preview
 */
function generateVanillaPreview(code: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow-x: hidden; }
    body { font-family: system-ui, -apple-system, sans-serif; -ms-overflow-style: none; scrollbar-width: none; }
    ::-webkit-scrollbar { display: none; }
    #app { width: 100%; height: 100%; }
  </style>
</head>
<body>
  <div id="app"></div>
  <script>
    try {
      ${code}
    } catch (err) {
      document.getElementById('app').innerHTML = 
        '<div style="padding:1rem;background:#fee2e2;color:#dc2626;border-radius:8px;font-family:monospace;">Error: ' + err.message + '</div>';
    }
  </script>
  <script>
    // Report content size to parent
    function reportSize() {
      const width = Math.max(
        document.body.scrollWidth,
        document.body.offsetWidth,
        document.documentElement.scrollWidth,
        document.documentElement.offsetWidth
      );
      const height = Math.max(
        document.body.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.scrollHeight,
        document.documentElement.offsetHeight
      );
      window.parent.postMessage({ type: 'content-size', width, height }, '*');
    }
    
    window.addEventListener('load', reportSize);
    setTimeout(reportSize, 100);
    setTimeout(reportSize, 500);
    
    if (window.ResizeObserver) {
      new ResizeObserver(reportSize).observe(document.body);
    }
  </script>
</body>
</html>`;
}

// Memoize to prevent unnecessary re-renders
export default memo(Preview);
