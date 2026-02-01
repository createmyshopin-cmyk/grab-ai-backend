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
      // Force reflow
      document.body.offsetHeight;
      
      const width = Math.max(
        document.body.scrollWidth,
        document.body.offsetWidth,
        document.documentElement.clientWidth,
        document.documentElement.scrollWidth,
        document.documentElement.offsetWidth
      );
      const height = Math.max(
        document.body.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.clientHeight,
        document.documentElement.scrollHeight,
        document.documentElement.offsetHeight
      );
      
      console.log('📊 Content size:', { width, height });
      window.parent.postMessage({ type: 'content-size', width, height }, '*');
    }
    
    // Report immediately and on various events
    reportSize();
    window.addEventListener('load', reportSize);
    window.addEventListener('DOMContentLoaded', reportSize);
    setTimeout(reportSize, 50);
    setTimeout(reportSize, 200);
    setTimeout(reportSize, 500);
    setTimeout(reportSize, 1000);
    
    // Watch for DOM changes
    if (window.ResizeObserver) {
      const observer = new ResizeObserver(reportSize);
      observer.observe(document.body);
      observer.observe(document.documentElement);
    }
    
    // Watch for mutations
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
    function handleScriptError(e) {
      const src = e.target.src;
      console.error('Failed to load:', src);
      const errDiv = document.createElement('div');
      errDiv.style = 'background: #fee2e2; color: #dc2626; padding: 8px; font-size: 12px; border-bottom: 1px solid #fca5a5; font-family: sans-serif;';
      errDiv.textContent = '⚠️ Network Error: Failed to load ' + src.split('/').slice(2).join('/');
      document.body.insertBefore(errDiv, document.body.firstChild);
    }
  </script>
  <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin onerror="handleScriptError(event)"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin onerror="handleScriptError(event)"></script>
  <script src="https://unpkg.com/@babel/standalone@7/babel.min.js" onerror="handleScriptError(event)"></script>
  <script src="https://cdn.tailwindcss.com" onerror="handleScriptError(event)"></script>
  <script src="https://unpkg.com/framer-motion@10.16.4/dist/framer-motion.js" onerror="handleScriptError(event)"></script>
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
  <div id="root"></div>
  <script type="text/babel" data-presets="react">
    // Make React hooks available globally
    const { useState, useEffect, useCallback, useMemo, useRef, memo, Fragment, createContext, useContext, useReducer } = React;
    
    // Expose Framer Motion globals  
    const { motion, AnimatePresence } = window.Motion || { motion: {}, AnimatePresence: () => null };
    
    // Add motion.div, motion.button, etc. if motion exists
    if (window.Motion && !motion.div) {
      Object.assign(motion, window.Motion.motion || {});
    }
    
    ${processedCode}
    
    try {
      const root = ReactDOM.createRoot(document.getElementById('root'));
      root.render(React.createElement(${componentName}));
    } catch (err) {
      document.getElementById('root').innerHTML = 
        '<div class="error-display">Render Error: ' + err.message + '</div>';
    }
  </script>
  <script>
    window.onerror = function(msg, url, line) {
      document.getElementById('root').innerHTML = 
        '<div class="error-display">Runtime Error: ' + msg + '</div>';
    };
  </script>
  <script>
    // Report content size to parent for auto-fit
    function reportSize() {
      // Force reflow to get accurate measurements
      document.body.offsetHeight;
      
      const root = document.getElementById('root');
      const width = Math.max(
        document.body.scrollWidth,
        document.body.offsetWidth,
        document.documentElement.clientWidth,
        document.documentElement.scrollWidth,
        document.documentElement.offsetWidth,
        root ? root.scrollWidth : 0,
        root ? root.offsetWidth : 0
      );
      const height = Math.max(
        document.body.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.clientHeight,
        document.documentElement.scrollHeight,
        document.documentElement.offsetHeight,
        root ? root.scrollHeight : 0,
        root ? root.offsetHeight : 0
      );
      
      console.log('📊 React content size:', { width, height });
      window.parent.postMessage({ type: 'content-size', width, height }, '*');
    }
    
    // Report immediately and on various events
    reportSize();
    window.addEventListener('load', reportSize);
    window.addEventListener('DOMContentLoaded', reportSize);
    setTimeout(reportSize, 50);
    setTimeout(reportSize, 200);
    setTimeout(reportSize, 500);
    setTimeout(reportSize, 1000);
    setTimeout(reportSize, 1500); // Extra delay for React rendering
    setTimeout(reportSize, 2000);
    
    // Watch for DOM changes on both body and root
    if (window.ResizeObserver) {
      const observer = new ResizeObserver(reportSize);
      observer.observe(document.body);
      observer.observe(document.documentElement);
      const root = document.getElementById('root');
      if (root) observer.observe(root);
    }
    
    // Watch for mutations
    if (window.MutationObserver) {
      const mutationObserver = new MutationObserver(reportSize);
      mutationObserver.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true
      });
      const root = document.getElementById('root');
      if (root) {
        mutationObserver.observe(root, {
          childList: true,
          subtree: true,
          attributes: true
        });
      }
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
      document.body.offsetHeight; // Force reflow
      
      const app = document.getElementById('app');
      const width = Math.max(
        document.body.scrollWidth,
        document.body.offsetWidth,
        document.documentElement.clientWidth,
        document.documentElement.scrollWidth,
        document.documentElement.offsetWidth,
        app ? app.scrollWidth : 0,
        app ? app.offsetWidth : 0
      );
      const height = Math.max(
        document.body.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.clientHeight,
        document.documentElement.scrollHeight,
        document.documentElement.offsetHeight,
        app ? app.scrollHeight : 0,
        app ? app.offsetHeight : 0
      );
      
      console.log('📊 Vanilla JS content size:', { width, height });
      window.parent.postMessage({ type: 'content-size', width, height }, '*');
    }
    
    reportSize();
    window.addEventListener('load', reportSize);
    window.addEventListener('DOMContentLoaded', reportSize);
    setTimeout(reportSize, 50);
    setTimeout(reportSize, 200);
    setTimeout(reportSize, 500);
    setTimeout(reportSize, 1000);
    
    if (window.ResizeObserver) {
      const observer = new ResizeObserver(reportSize);
      observer.observe(document.body);
      observer.observe(document.documentElement);
      const app = document.getElementById('app');
      if (app) observer.observe(app);
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

// Memoize to prevent unnecessary re-renders
export default memo(Preview);
