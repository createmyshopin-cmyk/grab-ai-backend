# Shopify Liquid Export Feature

## Overview
This feature converts React components to production-ready Shopify Liquid sections using Google Gemini 3.0 Pro Preview (with automatic fallback to Gemini 2.5 Flash if needed). It generates Online Store 2.0 compliant sections with proper schema, settings, and merchant-friendly customization options.

## How It Works

### 1. User Flow
1. Paste or create a React component on the canvas
2. Select the component
3. Click the green "Shopify" button in the right sidebar
4. AI converts React → Shopify Liquid
5. `.liquid` file downloads automatically
6. Upload to `sections/` folder in your Shopify theme

### 2. Technical Flow
```
React Component 
  ↓
API: /api/export/shopify
  ↓
Google Gemini 3.0 Pro Preview (fallback: Gemini 2.5 Flash)
  ↓
Shopify Liquid Section (.liquid)
  ↓
Browser Download
```

## What Gets Generated

### Shopify Section Structure
The exported `.liquid` file includes:

1. **HTML Structure** - Converted from React JSX
2. **Liquid Logic** - Loops, conditionals, variables
3. **Inline Styles or CSS** - Converted from Tailwind classes
4. **{% schema %}** - Theme editor settings (JSON)

### Example Output
```liquid
<section class="hero-section">
  {% if section.settings.show_heading %}
    <h1>{{ section.settings.heading }}</h1>
  {% endif %}
  
  {% for block in section.blocks %}
    <div class="item">
      {{ block.settings.text }}
    </div>
  {% endfor %}
</section>

<style>
  .hero-section {
    padding: {{ section.settings.padding }}px;
    background-color: {{ section.settings.bg_color }};
  }
</style>

{% schema %}
{
  "name": "Hero Section",
  "tag": "section",
  "class": "section-hero",
  "settings": [
    {
      "type": "text",
      "id": "heading",
      "label": "Heading",
      "default": "Welcome"
    },
    {
      "type": "color",
      "id": "bg_color",
      "label": "Background Color",
      "default": "#ffffff"
    },
    {
      "type": "range",
      "id": "padding",
      "label": "Padding",
      "min": 0,
      "max": 100,
      "step": 10,
      "default": 40
    }
  ],
  "blocks": [
    {
      "type": "item",
      "name": "Item",
      "settings": [
        {
          "type": "richtext",
          "id": "text",
          "label": "Text"
        }
      ]
    }
  ],
  "presets": [
    {
      "name": "Hero Section",
      "blocks": [
        { "type": "item" },
        { "type": "item" }
      ]
    }
  ]
}
{% endschema %}
```

## Conversion Rules

### 1. **Styling**
- Tailwind classes → Inline styles or native Shopify CSS
- Uses CSS variables for theme colors
- Mobile-responsive with media queries

### 2. **State Management**
- React `useState` → Liquid variables or JavaScript
- Props → Section settings in schema
- Event handlers → Vanilla JS or removed if not needed

### 3. **Components**
- Nested components → Liquid snippets or inline
- Repeating elements → `{% for %}` loops with blocks
- Conditional rendering → `{% if %}` statements

### 4. **Best Practices Applied**
- **Online Store 2.0 Standards**
  - JSON schema with settings and blocks
  - Proper presets for quick merchant setup
  
- **Merchant UX**
  - Clear labels and defaults
  - Appropriate input types (color picker, range slider, etc.)
  - Grouped settings for organization
  
- **Defensive Liquid**
  - Checks for blank values: `{% if image != blank %}`
  - Scoped variables with `{% liquid %}` blocks
  - No nested loops (performance)

## Using the Feature

### Prerequisites
- Google Gemini API key configured in `.env.local`
- Component selected on canvas
- Dev server running

### Steps
1. **Select a component** on the canvas
2. Click **"Shopify"** button (green, top-right of sidebar)
3. Wait for AI conversion (~5-10 seconds)
4. File downloads as `component-name.liquid`
5. Upload to your Shopify theme: `sections/component-name.liquid`

### Testing in Shopify
1. Upload the `.liquid` file to your theme
2. Go to theme editor
3. Add section from "Sections" panel
4. Customize using the Theme Editor settings
5. Preview and publish

## API Endpoint

### POST `/api/export/shopify`

**Request:**
```json
{
  "code": "export default function Hero() { ... }",
  "componentName": "Hero"
}
```

**Response:**
```json
{
  "liquidCode": "<section>...</section>\n\n{% schema %}...",
  "filename": "hero.liquid"
}
```

**Error Response:**
```json
{
  "error": "Google Gemini API key not configured"
}
```

## Configuration

### Environment Variables
```bash
GOOGLE_GEMINI_API_KEY=your_api_key_here
```

### AI Model
- **Primary Model:** `gemini-3-pro-preview` (Gemini 3.0 Pro Preview - Most Advanced)
- **Fallback Model:** `gemini-2.5-flash` (Gemini 2.5 Flash - Stable & Fast)
- **Features:** 2M token context, multimodal support, advanced reasoning, superior code generation
- **Use Case:** Production-grade Shopify Liquid conversion with highest quality output

## Troubleshooting

### Export Button Disabled
- **Cause:** No component selected
- **Solution:** Click on a component to select it

### "Google Gemini API key not configured"
- **Cause:** Missing API key in `.env.local`
- **Solution:** Add `GOOGLE_GEMINI_API_KEY=your_key` to `.env.local`

### "All Gemini models failed"
- **Cause:** API version compatibility or quota issues
- **Solution:** Check API key validity, ensure billing is enabled, verify quota limits

### "Failed to convert to Shopify Liquid"
- **Cause:** Invalid React code or AI error
- **Solution:** Ensure code is valid React; check server logs

### Downloaded File is Empty
- **Cause:** API returned error
- **Solution:** Check browser console and server logs

## Limitations

1. **Complex State Logic**
   - Heavy React state may not convert perfectly
   - May need manual JavaScript additions

2. **External Dependencies**
   - Framer Motion animations may not convert fully
   - External API calls need manual implementation

3. **Custom Hooks**
   - Custom React hooks won't convert
   - Use vanilla JS or Shopify Ajax API

4. **Advanced Patterns**
   - Context API, Redux → Manual implementation needed
   - HOCs, Render Props → Converted to simple components

## Best Practices

### For Best Results
1. **Keep components simple** - Single responsibility
2. **Use semantic HTML** - Proper tags (`<section>`, `<article>`)
3. **Inline styles or Tailwind** - Easier conversion
4. **Avoid complex state** - Use props instead
5. **Document props** - Helps AI understand intent

### Recommended Component Structure
```jsx
export default function ProductCard({ 
  title = "Product", 
  price = "$99",
  image = "/placeholder.jpg"
}) {
  return (
    <div className="product-card">
      <img src={image} alt={title} />
      <h3>{title}</h3>
      <p>{price}</p>
      <button>Add to Cart</button>
    </div>
  );
}
```

## Future Enhancements

- [ ] Direct Shopify theme API integration (auto-upload)
- [ ] Preview Liquid output before download
- [ ] Bulk export multiple components
- [ ] Theme kit integration
- [ ] Liquid code validation
- [ ] Custom schema templates
- [ ] Asset handling (images, fonts)

## Support

For issues or questions:
1. Check server logs: `terminals/438896.txt`
2. Verify API key is valid
3. Test with simple components first
4. Review Shopify Liquid documentation

## Resources

- [Shopify Liquid Reference](https://shopify.dev/docs/api/liquid)
- [Online Store 2.0 Sections](https://shopify.dev/themes/architecture/sections)
- [Section Schema Reference](https://shopify.dev/themes/architecture/sections/section-schema)
- [Google Gemini API Documentation](https://ai.google.dev/gemini-api/docs)
- [Gemini 2.0 Release Notes](https://ai.google.dev/gemini-api/docs/changelog)
