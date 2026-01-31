/**
 * Generates runnable code and detects the appropriate environment.
 */
export function generateCodeWrapper(rawInput: string): { code: string; template: 'react' | 'static' | 'vanilla' } {
  const trimmed = rawInput.trim();

  // 1. Detect React
  const isReact =
    trimmed.startsWith('import') ||
    trimmed.includes('export default function') ||
    trimmed.includes('className='); // Strong hint for React JSX

  if (isReact) {
    return {
      template: 'react',
      code: rawInput // Assume user pasted valid component code
    };
  }

  // 2. Detect HTML (Static/Vanilla)
  // If it has <html>, <body>, or just a bunch of <div>s without imports
  const isHtml = /<[a-z!][\s\S]*>/i.test(trimmed);

  if (isHtml) {
    // If it has <script> tags, treat as vanilla JS project
    if (trimmed.includes('<script')) {
      return {
        template: 'vanilla',
        code: `
import "./styles.css";

document.getElementById("app").innerHTML = \`
${escapeBackticks(trimmed)}
\`;
        `
      };
    }

    // Pure HTML/CSS
    return {
      template: 'static',
      code: trimmed
    };
  }

  // 3. Fallback / Plain Text
  // If it's just JS code without imports, wrap it for Vanilla
  return {
    template: 'vanilla',
    code: `import "./styles.css";

console.log("Running Code");

// Pasted Code:
${trimmed}
`
  };
}

// Helper to escape backticks for template literals
function escapeBackticks(str: string): string {
  return str.replace(/`/g, '\\`').replace(/\${/g, '\\${');
}
