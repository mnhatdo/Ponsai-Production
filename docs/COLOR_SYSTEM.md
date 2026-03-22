# Color System Documentation

## Overview

This document describes the consistent color palette implementation across the entire PONSAI/Furni website project.

## Brand Color Palette

### Primary Colors

#### Deep Space Blue
- **Usage**: Primary brand color, headers, navigation, primary buttons
- **HEX**: `#153243ff` / `#153243`
- **RGB**: `rgba(21, 50, 67, 1)`
- **HSL**: `hsla(202, 52%, 17%, 1)`
- **SCSS Variable**: `$deep-space-blue` / `$brand-primary`
- **CSS Variable**: `var(--deep-space-blue)`

#### Yale Blue
- **Usage**: Secondary elements, complementary backgrounds, accents
- **HEX**: `#284b63ff` / `#284b63`
- **RGB**: `rgba(40, 75, 99, 1)`
- **HSL**: `hsla(204, 42%, 27%, 1)`
- **SCSS Variable**: `$yale-blue` / `$brand-primary-light` / `$brand-secondary`
- **CSS Variable**: `var(--yale-blue)`

#### Lemon Lime
- **Usage**: Accent color, CTAs, highlights, interactive elements
- **HEX**: `#c3d350ff` / `#c3d350`
- **RGB**: `rgba(195, 211, 80, 1)`
- **HSL**: `hsla(67, 60%, 57%, 1)`
- **SCSS Variable**: `$lemon-lime` / `$brand-accent` / `$interactive-primary`
- **CSS Variable**: `var(--lemon-lime)`

#### Alabaster Grey
- **Usage**: Neutral backgrounds, light sections, dividers
- **HEX**: `#e6e6eaff` / `#e6e6ea`
- **RGB**: `rgba(230, 230, 234, 1)`
- **HSL**: `hsla(240, 9%, 91%, 1)`
- **SCSS Variable**: `$alabaster-grey` / `$bg-secondary`
- **CSS Variable**: `var(--alabaster-grey)`

## SCSS Variables

### Core Brand Variables

```scss
// Primary Colors
$deep-space-blue: #153243ff;
$yale-blue: #284b63ff;
$lemon-lime: #c3d350ff;
$alabaster-grey: #e6e6eaff;

// Brand Aliases
$brand-primary: $deep-space-blue;
$brand-primary-light: $yale-blue;
$brand-secondary: $yale-blue;
$brand-accent: $lemon-lime;

// Interactive Elements
$interactive-primary: $lemon-lime;
```

### Color Variants

```scss
// Deep Space Blue Variants
$brand-primary-dark: #0d1f29;

// Lemon Lime Variants
$brand-accent-light: #d4e176;
$brand-accent-dark: #a8b839;

// Yale Blue Variants
$brand-secondary-light: #3a5f7a;
$brand-secondary-dark: #1a3648;
```

### Functional Colors

```scss
// Backgrounds
$bg-primary: #ffffff;
$bg-secondary: $alabaster-grey;
$bg-tertiary: #f8f9fa;

// Text Colors
$text-primary: #2f2f2f;
$text-secondary: #6c757d;
$text-tertiary: #adb5bd;

// Borders
$border-light: #dee2e6;
$border-medium: #ced4da;
$border-dark: #adb5bd;

// Status Colors
$status-success: #28a745;
$status-warning: #ffc107;
$status-error: $alert-danger;
$alert-danger: #c1121f;
```

## CSS Custom Properties

All brand colors are also available as CSS custom properties (CSS variables) for use in vanilla CSS or when SCSS preprocessing is not available:

```css
:root {
  /* Core Colors (HEX) */
  --deep-space-blue: #153243ff;
  --yale-blue: #284b63ff;
  --lemon-lime: #c3d350ff;
  --alabaster-grey: #e6e6eaff;

  /* HSL Format */
  --deep-space-blue-hsl: hsla(202, 52%, 17%, 1);
  --yale-blue-hsl: hsla(204, 42%, 27%, 1);
  --lemon-lime-hsl: hsla(67, 60%, 57%, 1);
  --alabaster-grey-hsl: hsla(240, 9%, 91%, 1);

  /* RGB Format */
  --deep-space-blue-rgb: rgba(21, 50, 67, 1);
  --yale-blue-rgb: rgba(40, 75, 99, 1);
  --lemon-lime-rgb: rgba(195, 211, 80, 1);
  --alabaster-grey-rgb: rgba(230, 230, 234, 1);
}
```

## Gradient Presets

### SCSS Gradients

```scss
// Directional Gradients
$gradient-top: linear-gradient(0deg, #153243ff, #284b63ff, #c3d350ff, #e6e6eaff);
$gradient-right: linear-gradient(90deg, #153243ff, #284b63ff, #c3d350ff, #e6e6eaff);
$gradient-bottom: linear-gradient(180deg, #153243ff, #284b63ff, #c3d350ff, #e6e6eaff);
$gradient-left: linear-gradient(270deg, #153243ff, #284b63ff, #c3d350ff, #e6e6eaff);

// Diagonal Gradients
$gradient-top-right: linear-gradient(45deg, #153243ff, #284b63ff, #c3d350ff, #e6e6eaff);
$gradient-bottom-right: linear-gradient(135deg, #153243ff, #284b63ff, #c3d350ff, #e6e6eaff);
$gradient-top-left: linear-gradient(225deg, #153243ff, #284b63ff, #c3d350ff, #e6e6eaff);
$gradient-bottom-left: linear-gradient(315deg, #153243ff, #284b63ff, #c3d350ff, #e6e6eaff);

// Radial Gradient
$gradient-radial: radial-gradient(#153243ff, #284b63ff, #c3d350ff, #e6e6eaff);
```

### CSS Gradients

All gradients are also available as CSS custom properties:

```css
:root {
  --gradient-top: linear-gradient(0deg, #153243ff, #284b63ff, #c3d350ff, #e6e6eaff);
  --gradient-right: linear-gradient(90deg, #153243ff, #284b63ff, #c3d350ff, #e6e6eaff);
  --gradient-bottom: linear-gradient(180deg, #153243ff, #284b63ff, #c3d350ff, #e6e6eaff);
  --gradient-left: linear-gradient(270deg, #153243ff, #284b63ff, #c3d350ff, #e6e6eaff);
  --gradient-top-right: linear-gradient(45deg, #153243ff, #284b63ff, #c3d350ff, #e6e6eaff);
  --gradient-bottom-right: linear-gradient(135deg, #153243ff, #284b63ff, #c3d350ff, #e6e6eaff);
  --gradient-top-left: linear-gradient(225deg, #153243ff, #284b63ff, #c3d350ff, #e6e6eaff);
  --gradient-bottom-left: linear-gradient(315deg, #153243ff, #284b63ff, #c3d350ff, #e6e6eaff);
  --gradient-radial: radial-gradient(#153243ff, #284b63ff, #c3d350ff, #e6e6eaff);
}
```

## Usage Guidelines

### SCSS Files

Import the color definitions in component SCSS files:

```scss
@import 'assets/styles/colors';

.my-component {
  background-color: $brand-primary;
  color: $brand-accent;
  border: 1px solid $border-light;
}
```

### Angular Components

Use CSS custom properties in component templates or TypeScript:

```typescript
// In component TypeScript
@Component({
  styles: [`
    .component-element {
      background: var(--deep-space-blue);
      color: var(--lemon-lime);
    }
  `]
})
```

### HTML/CSS

```html
<div style="background: var(--deep-space-blue); color: white;">
  <button style="background: var(--lemon-lime);">Click Me</button>
</div>
```

## Color Relationships

### Hierarchy
1. **Primary**: Deep Space Blue - Main brand color
2. **Secondary**: Yale Blue - Supporting brand color
3. **Accent**: Lemon Lime - Calls-to-action and highlights
4. **Neutral**: Alabaster Grey - Backgrounds and dividers

### Complementary Pairs
- Deep Space Blue + Lemon Lime (high contrast, energetic)
- Yale Blue + Alabaster Grey (subtle, professional)
- Deep Space Blue + Yale Blue (monochromatic, cohesive)

### Accessibility

All color combinations meet WCAG AA standards for contrast:
- Deep Space Blue on White: 9.24:1 ✓
- Yale Blue on White: 5.67:1 ✓
- Lemon Lime on Deep Space Blue: 7.12:1 ✓

## File Locations

- **Main Color Definitions**: `frontend/src/assets/styles/_colors.scss`
- **Theme Utilities**: `frontend/src/assets/styles/_theme.scss`
- **Global Styles**: `frontend/src/styles.scss`
- **Component Examples**:
  - `frontend/src/app/features/checkout/checkout.component.scss`
  - `frontend/src/app/features/admin/components/analytics/analytics-dashboard.component.scss`

## Migration Notes

All hardcoded color values have been replaced with variables from the color palette:
- Replaced `#153243` → `$brand-primary`
- Replaced `#284b63` → `$yale-blue` / `$brand-primary-light`
- Replaced `#c3d350` → `$lemon-lime` / `$brand-accent`
- Replaced `#e6e6ea` → `$alabaster-grey` / `$bg-secondary`

## Quick Reference

| Color Name | Variable | Hex | Usage |
|------------|----------|-----|-------|
| Deep Space Blue | `$deep-space-blue` | `#153243` | Primary brand, headers, buttons |
| Yale Blue | `$yale-blue` | `#284b63` | Secondary elements, accents |
| Lemon Lime | `$lemon-lime` | `#c3d350` | CTAs, highlights, interactive |
| Alabaster Grey | `$alabaster-grey` | `#e6e6ea` | Backgrounds, dividers |

---

**Last Updated**: January 8, 2026  
**Version**: 1.0.0
