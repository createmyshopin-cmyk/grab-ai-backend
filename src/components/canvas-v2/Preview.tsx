'use client';

import React, { useMemo, memo } from 'react';

interface PreviewProps {
  code: string;
  type: 'html' | 'react' | 'vanilla';
  width?: number;
  height?: number;
}

/**
 * Preview Component - Renders code in a sandboxed iframe
 * 
 * - HTML: Direct srcdoc rendering
 * - React: Inline Babel transpilation with React CDN
 * - Vanilla: Plain JS execution
 */
function Preview({ code, type, width = 500, height = 300 }: PreviewProps) {
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

  return (
    <iframe
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
</body>
</html>`;
}

/**
 * Generate React preview with inline Babel transpilation
 */
function generateReactPreview(code: string): string {
  let processedCode = code.trim();

  // Remove import statements (CDN handles React)
  processedCode = processedCode
    .replace(/^import\s+.*?from\s+['"]react['"];?\s*$/gm, '')
    .replace(/^import\s+.*?from\s+['"]react-dom['"];?\s*$/gm, '')
    .replace(/^import\s+.*?from\s+['"]framer-motion['"];?\s*$/gm, '')
    .replace(/^import\s+.*?from\s+['"]react\/jsx-runtime['"];?\s*$/gm, '')
    .replace(/^import\s+React.*?;?\s*$/gm, '')
    .trim();

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
    // Expose Framer Motion globals
    const { motion, AnimatePresence } = window.Motion || {};
    
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
</body>
</html>`;
}

// Memoize to prevent unnecessary re-renders
export default memo(Preview);
