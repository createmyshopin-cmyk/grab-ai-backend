/**
 * Shopify Liquid Converter (Rule-Based, No AI)
 * 
 * Specifically designed to handle "captured" React components which have:
 * 1. Deeply nested divs with inline styles
 * 2. Redundant style attributes (sometimes duplicate)
 * 3. A <style dangerouslySetInnerHTML={{ __html: ... }} /> block
 * 4. Predictable class names like 'shopify-section'
 */

interface ShopifySetting {
    type: 'text' | 'richtext' | 'image_picker' | 'color' | 'url';
    id: string;
    label: string;
    default: string;
}

export interface ShopifyExportResult {
    liquid: string;
    filename: string;
}

/**
 * Clean up a React component string and extract primary content
 */
function extractJsx(code: string): string {
    // Look for content inside return (...)
    const match = code.match(/return\s*\(\s*<>\s*([\s\S]*?)\s*<\/>\s*\);/);
    if (match) return match[1].trim();

    // Fallback for non-fragment returns
    const matchNoFrag = code.match(/return\s*\(\s*([\s\S]*?)\s*\);/);
    return matchNoFrag ? matchNoFrag[1].trim() : code;
}

/**
 * Extract CSS from dangerouslySetInnerHTML style tag
 */
function extractCss(code: string): string {
    const match = code.match(/__html:\s*`([\s\S]*?)`/);
    return match ? match[1].trim() : '';
}

/**
 * Main conversion function
 */
export function convertToShopifyLiquid(code: string, componentName: string = 'Section'): ShopifyExportResult {
    const rawJsx = extractJsx(code);
    const css = extractCss(code);

    let html = rawJsx;
    const settings: ShopifySetting[] = [];
    let settingCounter = 0;

    // 1. Remove the <style> tag from the HTML content
    html = html.replace(/<style[\s\S]*?\/>/g, '');

    // 2. Convert React-isms to HTML-isms
    html = html
        .replace(/className=/g, 'class=')
        .replace(/htmlFor=/g, 'for=')
        .replace(/dangerouslySetInnerHTML=\{\{[\s\S]*?\}\}/g, '');

    // 3. Handle double style attributes (common in captured components)
    // We'll merge them or just take the first one for simplicity in rule-based
    html = html.replace(/style=\{\{[\s\S]*?\}\}/g, (match) => {
        // Extract properties from style={{ ... }}
        const styleContent = match.match(/\{\{([\s\S]*?)\}\}/)?.[1] || '';
        const properties = styleContent.split(',').map(p => {
            const separatorIndex = p.indexOf(':');
            if (separatorIndex === -1) return '';

            const key = p.slice(0, separatorIndex).trim();
            const value = p.slice(separatorIndex + 1).trim();

            if (!key || !value) return '';
            // Convert camelCase to kebab-case
            const kebabKey = key.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
            // Clean value (remove quotes)
            const cleanValue = value.replace(/['"]/g, '');
            return `${kebabKey}: ${cleanValue};`;
        }).filter(Boolean).join(' ');

        return `style="${properties}"`;
    });

    // 4. Parameterize Content (H4, Span, P nodes with text)
    html = html.replace(/>([^<{]+?)</g, (match, innerText) => {
        const trimmed = innerText.trim();
        if (trimmed.length > 3 && !trimmed.includes('{') && !trimmed.includes('}')) {
            settingCounter++;
            const id = `text_${settingCounter}`;
            settings.push({
                type: trimmed.length > 50 ? 'richtext' : 'text',
                id,
                label: `Text content ${settingCounter}`,
                default: trimmed
            });
            return `>{{ section.settings.${id} }}<`;
        }
        return match;
    });

    // 5. Replace section ID with Liquid variable
    html = html.replace(/id="shopify-section-[^"]*"/g, 'id="shopify-section-{{ section.id }}"');

    // 6. Build final Liquid file content
    const liquidOutput = `
{%- style -%}
  .section-container-{{ section.id }} {
    padding-top: {{ section.settings.padding_top }}px;
    padding-bottom: {{ section.settings.padding_bottom }}px;
  }
  ${css.replace(/shopify-section-[^ ]*/g, 'section-{{ section.id }}')}
{%- endstyle -%}

<div class="section-container-{{ section.id }}">
  ${html.trim()}
</div>

{% schema %}
{
  "name": "${componentName}",
  "tag": "section",
  "class": "section",
  "settings": [
    {
      "type": "header",
      "content": "Content"
    },
    ${settings.map(s => JSON.stringify(s, null, 2)).join(',\n    ')},
    {
      "type": "header",
      "content": "Section Spacing"
    },
    {
      "type": "range",
      "id": "padding_top",
      "min": 0,
      "max": 100,
      "step": 4,
      "unit": "px",
      "label": "Top Padding",
      "default": 40
    },
    {
      "type": "range",
      "id": "padding_bottom",
      "min": 0,
      "max": 100,
      "step": 4,
      "unit": "px",
      "label": "Bottom Padding",
      "default": 40
    }
  ],
  "presets": [
    {
      "name": "${componentName}"
    }
  ]
}
{% endschema %}
`.trim();

    const filename = `${componentName.toLowerCase().replace(/\s+/g, '-')}.liquid`;

    return {
        liquid: liquidOutput,
        filename
    };
}
