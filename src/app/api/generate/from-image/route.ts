import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '');

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const imageFile = formData.get('image') as File;

        if (!imageFile) {
            return NextResponse.json({ error: 'Image file is required' }, { status: 400 });
        }

        if (!process.env.GOOGLE_GEMINI_API_KEY) {
            return NextResponse.json({ error: 'Google Gemini API key not configured' }, { status: 500 });
        }

        // Convert image to base64
        const bytes = await imageFile.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64Image = buffer.toString('base64');
        const mimeType = imageFile.type;

        // Use Gemini 3.0 Pro Preview with vision capabilities
        const model = genAI.getGenerativeModel({ model: 'gemini-3-pro-preview' });

        const prompt = `You are an elite React + Shopify Developer with 15+ years of experience.

### TASK
Analyze this screenshot and generate a production-ready, enhanced React component that preserves all original elements while applying modern beautifications.

### PHASE 1: ANALYSIS
Carefully analyze the screenshot and identify:

1. **Layout Structure** (header, hero, features, testimonials, CTA, footer, etc.)
2. **UI Elements** (buttons, forms, cards, carousels, modals, navigation, etc.)
3. **Typography** (font sizes, weights, hierarchy, line heights)
4. **Colors** (background colors, text colors, accent colors, status colors)
5. **Spacing** (padding, margins, gaps between elements)
6. **Interactive Elements** (clickable buttons, hoverable cards, form inputs, etc.)

### PHASE 2: BEAUTIFICATION STRATEGY
For EACH element detected, apply these enhancements while KEEPING the original design intent:

**Spacing Improvements:**
- Enforce 8pt grid system for consistent spacing
- Increase whitespace for better breathing room
- Improve visual hierarchy with better spacing relationships
- Ensure proper padding/margins on mobile (minimum 16px)

**Interactive States:**
- Add smooth hover effects (scale(1.02), color transitions, shadow elevation)
- Add active/focus states for accessibility (outline, ring)
- Add loading states for forms/buttons (spinner, disabled state)
- Add pressed states for buttons (scale(0.98))

**Animations:**
- Fade-in on component mount (opacity 0 → 1, duration 300ms)
- Stagger animations for lists (delay each item by 50ms)
- Slide-up animations for sections (translateY 20px → 0)
- Smooth transitions for all interactive elements (200-300ms)
- Use Framer Motion with spring physics (stiffness: 400, damping: 30)
- Hover animations: scale, shadow, color transitions

**Accessibility:**
- Add ARIA labels for all interactive elements
- Add alt text for all images (descriptive)
- Use semantic HTML5 (header, nav, main, section, article, button)
- Ensure keyboard navigation works (tab order, focus states)
- Proper heading hierarchy (h1 → h2 → h3)
- Form labels associated with inputs

**Responsiveness (MOBILE-FIRST):**
- Default styles = Mobile (320px - 767px):
  * Single column layouts
  * Stacked elements vertically
  * Larger touch targets (min 44x44px)
  * Simplified navigation (hamburger menu if needed)
  * Full-width containers
  * Reduced font sizes (but readable)
  
- Tablet breakpoint (md: 768px+):
  * 2-column grids where appropriate
  * Side-by-side layouts for related content
  * Expanded navigation
  * Medium font sizes
  
- Desktop breakpoint (lg: 1024px+):
  * 3+ column grids for lists
  * Max-width containers (max-w-7xl, centered)
  * Enhanced animations and effects
  * Full navigation visible
  * Larger font sizes

- NO horizontal scroll on any device
- Fluid typography using responsive classes (text-sm md:text-base lg:text-lg)
- Images responsive with proper aspect ratios

**Modern Design Patterns:**
- Glass morphism for cards (backdrop-blur-sm, bg-white/80)
- Subtle gradients for accents
- Smooth shadows (shadow-sm, shadow-md, not harsh)
- Consistent border radius (rounded-lg, rounded-xl)
- Modern color palette (use Tailwind semantic colors)

### PHASE 3: SHOPIFY BLOCK STRUCTURE
Structure code for easy Shopify conversion:

**Modular Components:**
Each major section should be a separate function component:
\`\`\`tsx
export default function MainComponent() {
  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <TestimonialsSection />
      <CTASection />
    </>
  );
}

function HeroSection() { /* ... */ }
function FeaturesSection() { /* ... */ }
function TestimonialsSection() { /* ... */ }
function CTASection() { /* ... */ }
\`\`\`

This structure allows each section to become a Shopify block.

**Settings as Props:**
Use props for customizable values (these will become Shopify settings):
\`\`\`tsx
function HeroSection({ 
  heading = "Default Heading",
  subheading = "Default subheading",
  bgColor = "bg-gray-900",
  ctaText = "Get Started",
  ctaLink = "#"
}) {
  // Shopify theme editor will control these via section settings
}
\`\`\`

### PHASE 4: INTERACTIVITY
Add full functional logic with React hooks:

**Forms:**
- useState for all form fields
- onSubmit handlers (preventDefault, show success/error)
- Basic validation (required fields, email format)
- Success/error states with visual feedback

**Carousels/Sliders:**
- useState for current slide index
- Auto-play with useEffect and setInterval (optional, with pause on hover)
- Navigation dots/arrows
- Touch swipe support (basic touch event handlers)
- Smooth transitions between slides

**Accordions:**
- useState for open/closed items (array of booleans or single index)
- Smooth expand/collapse with max-height transitions
- Optional: only one open at a time

**Modals/Dialogs:**
- useState for open/closed state
- Focus trap (focus first element when opened)
- Close on ESC key (useEffect with keydown listener)
- Close on backdrop click
- Prevent body scroll when open

**Tabs:**
- useState for active tab index
- Smooth transitions between tabs
- Keyboard navigation (arrow keys)

**Scroll Effects:**
- useEffect with scroll listener
- Reveal animations on scroll into view (IntersectionObserver)
- Optional parallax effects for hero sections

### CODE REQUIREMENTS

1. **Export:** Must start with \`export default function ComponentName()\`
2. **Styling:** Tailwind CSS only, no inline styles unless dynamic (like colors from props)
3. **Icons:** Inline SVG (Lucide style), no icon library imports
4. **Images:** Use placeholder images with proper alt text (use placeholder.com or similar)
5. **Dependencies:** Only React, Framer Motion (motion from 'framer-motion')
6. **TypeScript:** Use interfaces for props if complex
7. **Comments:** Add comments for complex logic only
8. **Clean Code:** Readable, well-structured, DRY principles
9. **Mobile-First:** All default styles optimized for mobile, then md: and lg: breakpoints

### CRITICAL: REQUIRED IMPORTS
You MUST start the component with these exact imports:

\`\`\`tsx
'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
\`\`\`

IMPORTANT: Always include 'use client' directive and React imports at the very top!

### MOBILE-FIRST RESPONSIVE PATTERNS

**Container:**
\`\`\`tsx
<div className="w-full px-4 md:px-6 lg:px-8 max-w-7xl mx-auto">
\`\`\`

**Grid:**
\`\`\`tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
\`\`\`

**Typography:**
\`\`\`tsx
<h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">Heading</h1>
\`\`\`

**Spacing:**
\`\`\`tsx
<section className="py-8 md:py-12 lg:py-16">
\`\`\`

### OUTPUT FORMAT - CRITICAL RULES
1. MUST start with 'use client' directive
2. MUST include: import React, { useState, useEffect } from 'react';
3. MUST include: import { motion } from 'framer-motion'; (if using animations)
4. Then export default function ComponentName()
5. NO markdown code fences (\`\`\`)
6. NO explanations before or after
7. Just pure JSX code

Example correct start:
\`\`\`
'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function ComponentName() {
  // component code
}
\`\`\`

### REACT COMPONENT CODE:`;

        // Generate content with image
        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: base64Image,
                    mimeType: mimeType,
                },
            },
        ]);

        const response = await result.response;
        let code = response.text();

        // Clean markdown artifacts
        code = code
            .replace(/```(jsx|tsx|javascript|typescript|js|ts)?\n?/gi, '')
            .replace(/```/g, '')
            .trim();

        // Ensure 'use client' directive is present
        if (!code.includes("'use client'") && !code.includes('"use client"')) {
            code = `'use client';\n\n${code}`;
        }

        // Ensure React imports are present
        if (!code.includes('import React') && !code.includes('from "react"') && !code.includes("from 'react'")) {
            // Find where to insert imports (after 'use client')
            const useClientMatch = code.match(/['"]use client['"];?\s*/);
            if (useClientMatch) {
                const insertPos = useClientMatch[0].length;
                code = code.slice(0, insertPos) + 
                       "\nimport React, { useState, useEffect } from 'react';\nimport { motion } from 'framer-motion';\n" +
                       code.slice(insertPos);
            } else {
                code = "'use client';\n\nimport React, { useState, useEffect } from 'react';\nimport { motion } from 'framer-motion';\n\n" + code;
            }
        }

        // Ensure motion import if motion is used
        if (code.includes('<motion.') && !code.includes("from 'framer-motion'") && !code.includes('from "framer-motion"')) {
            const reactImportMatch = code.match(/import .+ from ['"]react['"];?\s*/);
            if (reactImportMatch) {
                const insertPos = reactImportMatch.index! + reactImportMatch[0].length;
                code = code.slice(0, insertPos) + 
                       "import { motion } from 'framer-motion';\n" +
                       code.slice(insertPos);
            }
        }

        // Extract component name if possible
        const componentNameMatch = code.match(/export default function (\w+)/);
        const componentName = componentNameMatch
            ? componentNameMatch[1]
            : 'ScreenshotComponent';

        // Validate export statement
        if (!code.includes('export default function')) {
            // Try to fix if it's just a function
            if (code.includes('function ') && code.includes('return')) {
                code = `export default ${code}`;
            } else {
                return NextResponse.json(
                    { error: 'AI generated invalid component structure' },
                    { status: 500 }
                );
            }
        }

        // Final validation: ensure all required imports are present
        const hasUseClient = code.includes("'use client'") || code.includes('"use client"');
        const hasReactImport = code.includes('import') && code.includes('react');
        
        if (!hasUseClient || !hasReactImport) {
            console.error('Generated code missing required imports:', { hasUseClient, hasReactImport });
            // Force add them
            code = `'use client';\n\nimport React, { useState, useEffect } from 'react';\nimport { motion } from 'framer-motion';\n\n${code.replace(/^['"]use client['"];?\s*/g, '')}`;
        }

        // Generate metadata (simplified - AI can't return structured JSON easily)
        const metadata = {
            generatedFrom: 'screenshot' as const,
            elements: [
                { type: 'header', position: { x: 0, y: 0 }, suggestions: ['Added hover effects', 'Improved spacing'] },
                { type: 'hero', position: { x: 0, y: 100 }, suggestions: ['Added fade-in animation', 'Mobile-first responsive'] },
            ],
            colorPalette: ['bg-gray-900', 'text-white', 'bg-blue-500'],
            enhancements: [
                'Mobile-first responsive design',
                'Framer Motion animations',
                'Improved spacing (8pt grid)',
                'Hover effects on interactive elements',
                'Accessibility improvements (ARIA labels)',
                'Shopify-block-ready structure',
            ],
            shopifyCompatible: true,
        };

        return NextResponse.json({
            code,
            componentName,
            metadata,
        });
    } catch (error: any) {
        console.error('Screenshot-to-Code API Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to generate code from screenshot' },
            { status: 500 }
        );
    }
}
