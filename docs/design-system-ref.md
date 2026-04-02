# Design System Reference — Christos Cakes

## Quick-Reference Card

### Colors
-   `--color-primary`: `#be185d` (Pink/Rose)
-   `--color-background`: `#fffafa` (Soft White)
-   `--color-text-primary`: `#1c1917` (Luxury Ink)

### Typography
-   `--font-heading`: `'Playfair Display', serif`
-   `--font-body`: `'Inter', system-ui, sans-serif`
-   `--font-mono`: `'JetBrains Mono', monospace`

### Spacing
-   `--space-1`: `4px`
-   `--space-2`: `8px`
-   `--space-3`: `12px`
-   `--space-4`: `16px`
-   `--space-5`: `20px`
-   `--space-6`: `24px`

### Breakpoints
-   `--bp-sm`: `640px`
-   `--bp-md`: `768px`
-   `--bp-lg`: `1024px`
-   `--bp-xl`: `1280px`

## CSS Custom Properties
All visual values must be defined in `src/index.css` as CSS custom properties.

```css
:root {
  --color-primary: #be185d;
  --color-background: #fffafa;
  --color-text-primary: #1c1917;
  /* ... other properties ... */
}
```
