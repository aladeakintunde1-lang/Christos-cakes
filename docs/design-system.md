# Christos Cakes — Design System
Version 1.0 | 2026-03-29

## 1. BRAND IDENTITY
VISUAL TONE:
  Luxury — High-end feel with elegant typography and spacious layouts.
  Minimal — Clean interfaces that let the cake imagery shine.
  Elegant — Refined color palette and soft animations.
  Soft — Gentle pinks and whites for a welcoming, boutique atmosphere.

BRAND POSITIONING:
  Bespoke luxury cake boutique catering to high-end events.

## 2. COLOR PALETTE

```css
:root {
  --color-primary:        #be185d; /* Pink/Rose */
  --color-primary-dark:   #9d174d;
  --color-primary-light:  #fdf2f8;
  --color-accent:         #be185d;
  --color-accent-dark:    #9d174d;
  --color-background:     #fffafa; /* Soft White */
  --color-surface:        #ffffff;
  --color-surface-alt:    #f5f5f4;
  --color-surface-raised: #ffffff;
  --color-text-primary:   #1c1917; /* Luxury Ink */
  --color-text-secondary: #44403c;
  --color-text-muted:     #78716c;
  --color-text-inverse:   #ffffff;
  --color-text-link:      #be185d;
  --color-text-link-hover:#9d174d;
  --color-border:         #e7e5e4;
  --color-border-strong:  #d6d3d1;
  --color-border-focus:   #be185d;
  --color-success:        #10b981;
  --color-success-light:  #ecfdf5;
  --color-warning:        #f59e0b;
  --color-warning-light:  #fffbeb;
  --color-error:          #ef4444;
  --color-error-light:    #fef2f2;
  --color-info:           #3b82f6;
  --color-info-light:     #eff6ff;
  
  /* Brand Specific */
  --color-luxury-bg: #fffafa;
  --color-luxury-ink: #1c1917;
  --color-luxury-accent: #be185d;
  --color-luxury-muted: #78716c;
}
```

Contrast Table (WCAG AA — ≥4.5:1 normal, ≥3:1 large):
| Text | Background | Ratio | Pass? |
|---|---|---|---|
| --color-text-primary | --color-background | 14.5:1 | ✅ |
| --color-text-primary | --color-surface    | 15.8:1 | ✅ |
| --color-text-inverse | --color-primary    | 4.8:1 | ✅ |

Color Usage Rules:
  Primary: Used for buttons, accents, and key brand elements.
  Background: Soft white used for the main page background.
  Never: Avoid using high-contrast neon colors or heavy dark backgrounds.

## 3. TYPOGRAPHY

HEADING FONT: Playfair Display | Serif | Weights: 300, 400, 500, 600
BODY FONT: Inter | Sans-serif | Weights: 300, 400, 500, 600
MONO FONT: JetBrains Mono | Used for: Order IDs, technical data.

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Playfair+Display:wght@300;400;500;600&display=swap" rel="stylesheet">
```

```css
:root {
  --font-heading: 'Playfair Display', serif;
  --font-body:    'Inter', system-ui, sans-serif;
  --font-mono:    'JetBrains Mono', monospace;
  --weight-light:    300;
  --weight-regular:  400;
  --weight-medium:   500;
  --weight-semibold: 600;
  --weight-bold:     700;
  --text-xs:   0.75rem/1rem;
  --text-sm:   0.875rem/1.25rem;
  --text-base: 1rem/1.5rem;
  --text-lg:   1.125rem/1.75rem;
  --text-xl:   1.25rem/1.75rem;
  --text-2xl:  1.5rem/2rem;
  --text-3xl:  1.875rem/2.25rem;
  --text-4xl:  2.25rem/2.5rem;
}
```

Typography Rules:
  Min body text: 16px | Min interactive: 14px
  Line length: 60–75ch for body text.

## 4. SPACING & LAYOUT

```css
:root {
  --space-1: 4px;  --space-2: 8px;   --space-3: 12px;
  --space-4: 16px; --space-5: 20px;  --space-6: 24px;
  --space-8: 32px; --space-10: 40px; --space-12: 48px;
  --space-16: 64px; --space-20: 80px; --space-24: 96px;
  --radius-sm: 4px; --radius-md: 8px;
  --radius-lg: 12px; --radius-xl: 24px; --radius-full: 9999px;
  --shadow-xs: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-sm: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  --max-width-content: 1280px;
  --max-width-narrow:  800px;
  --max-width-wide:    1440px;
  --z-base: 0; --z-raised: 10; --z-overlay: 100;
  --z-modal: 200; --z-toast: 300; --z-tooltip: 400;
}
```

Grid: 12 columns | Gutter: 24px | Page padding: 16px (mobile), 32px (desktop)

## 5. RESPONSIVE BREAKPOINTS

```css
:root {
  --bp-sm: 640px; --bp-md: 768px; --bp-lg: 1024px; --bp-xl: 1280px;
}
```

APPROACH: Mobile-first.
NAVIGATION — Mobile: Bottom bar or hamburger menu | Desktop: Top horizontal bar.
MIN SUPPORTED WIDTH: 320px

## 6. COMPONENT PATTERNS

### Button
PRIMARY: bg --color-primary | text --color-text-inverse | radius --radius-md | font --weight-semibold --text-base
SECONDARY: bg --color-surface | text --color-text-primary | border 1px --color-border
GHOST: transparent | text --color-primary | no border

### Input
Default: bg --color-surface-alt | border 1px --color-border | radius --radius-sm | height 48px
Focus: border --color-border-focus | shadow 0 0 0 3px rgba(190, 24, 93, 0.1)

### Card
Default: bg --color-surface | border 1px --color-border | radius --radius-md | shadow --shadow-sm | padding 24px
Hover (interactive): shadow --shadow-md | border --color-border-strong | transition all 0.2s ease

### Badge / Tag
Default: bg --color-surface-alt | text --color-text-secondary | border 1px --color-border | radius --radius-full | font --text-xs --weight-medium

### Toast / Notification
Position: top-right | Max width: 320px | Dismiss: 4s
Success: bg --color-success-light | border-left 4px --color-success

### Modal
Backdrop: rgba(0, 0, 0, 0.5) | Panel: --color-surface-raised --shadow-lg --radius-lg
Max width: 600px | Close: top-right, always visible

## 7. ANIMATION & MOTION

```css
:root {
  --transition-fast: 150ms ease;
  --transition-base: 300ms ease;
  --transition-slow: 500ms ease;
}
```

Scroll reveal: opacity 0 → 1 | translateY(20px) → 0 | duration 800ms
Hover: transition all --transition-fast on all interactive elements

## 8. ICONOGRAPHY
LIBRARY: Lucide React
Default size: 24px | Stroke: 1.5px
ICON MAPPINGS:
  Order → ClipboardList
  Delivery → Truck
  Collection → Store
  Price → DollarSign
  Date → Calendar

## 9. DATA VISUALISATION
CHART LIBRARY: Recharts (if needed)

## 10. WRITING STYLE & MICROCOPY
VOICE: Direct, precise, human, luxury.
TENSE: Active / present.
PERSON: Second person ("Your order").
TERMINOLOGY: Use "Bespoke" instead of "Custom".

## 11. ACCESSIBILITY
TARGET: WCAG 2.1 AA
TOUCH TARGETS: min 44×44px

## 12. GOVERNANCE
Single source of truth. No value may appear in frontend code that is not defined here as a CSS custom property.
CHANGELOG:
  v1.0 — 2026-03-29 — Initial design system for Christos Cakes
