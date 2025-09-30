# 🎨 RNUpdater Design System

A comprehensive design system built with CSS Modules and CSS Variables for easy theme customization and consistent styling.

## 📋 Table of Contents

- [Overview](#overview)
- [Color Palettes](#color-palettes)
- [Design Tokens](#design-tokens)
- [Theme Management](#theme-management)
- [Components](#components)
- [Usage Examples](#usage-examples)
- [Customization](#customization)

## 🌟 Overview

The RNUpdater Design System provides:

- **7 Color Palettes**: Blue, Purple, Green, Red, Yellow, Cyan, Gray
- **Comprehensive Design Tokens**: Spacing, Typography, Shadows, Transitions
- **Theme Management**: Light/Dark modes with system preference detection
- **CSS Modules**: Scoped, type-safe styling
- **Easy Customization**: Visual theme customizer with export/import

## 🎨 Color Palettes

### Available Palettes

| Palette    | Primary   | Secondary | Accent    | Description             |
| ---------- | --------- | --------- | --------- | ----------------------- |
| **Blue**   | `#3b82f6` | `#3b82f6` | `#3b82f6` | Professional blue theme |
| **Purple** | `#a855f7` | `#a855f7` | `#a855f7` | Creative purple theme   |
| **Green**  | `#22c55e` | `#22c55e` | `#22c55e` | Natural green theme     |
| **Red**    | `#ef4444` | `#ef4444` | `#ef4444` | Bold red theme          |
| **Yellow** | `#f59e0b` | `#f59e0b` | `#f59e0b` | Energetic yellow theme  |
| **Cyan**   | `#06b6d4` | `#06b6d4` | `#06b6d4` | Fresh cyan theme        |
| **Gray**   | `#737373` | `#737373` | `#737373` | Neutral gray theme      |

### Color Scale

Each palette includes a complete 11-shade scale:

```css
--primary-50:  /* Lightest */
--primary-100:
--primary-200:
--primary-300:
--primary-400:
--primary-500: /* Base color */
--primary-600:
--primary-700:
--primary-800:
--primary-900:
--primary-950: /* Darkest */
```

## 🎯 Design Tokens

### Spacing System

```css
--space-1: 0.25rem; /* 4px */
--space-2: 0.5rem; /* 8px */
--space-3: 0.75rem; /* 12px */
--space-4: 1rem; /* 16px */
--space-5: 1.25rem; /* 20px */
--space-6: 1.5rem; /* 24px */
--space-8: 2rem; /* 32px */
--space-10: 2.5rem; /* 40px */
--space-12: 3rem; /* 48px */
--space-16: 4rem; /* 64px */
--space-20: 5rem; /* 80px */
--space-24: 6rem; /* 96px */
```

### Typography

```css
/* Font Families */
--font-sans: "Inter", sans-serif;
--font-mono: "Fira Code", monospace;
--font-serif: "Charter", serif;

/* Font Sizes */
--text-xs: 0.75rem; /* 12px */
--text-sm: 0.875rem; /* 14px */
--text-base: 1rem; /* 16px */
--text-lg: 1.125rem; /* 18px */
--text-xl: 1.25rem; /* 20px */
--text-2xl: 1.5rem; /* 24px */
--text-3xl: 1.875rem; /* 30px */
--text-4xl: 2.25rem; /* 36px */

/* Font Weights */
--font-thin: 100;
--font-light: 300;
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
--font-extrabold: 800;
--font-black: 900;
```

### Border Radius

```css
--radius-sm: 0.125rem; /* 2px */
--radius-base: 0.25rem; /* 4px */
--radius-md: 0.375rem; /* 6px */
--radius-lg: 0.5rem; /* 8px */
--radius-xl: 0.75rem; /* 12px */
--radius-2xl: 1rem; /* 16px */
--radius-3xl: 1.5rem; /* 24px */
--radius-full: 9999px;
```

### Shadows

```css
--shadow-xs: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-sm: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
--shadow-base: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
--shadow-md: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
--shadow-lg: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
--shadow-xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
```

## 🎛️ Theme Management

### ThemeManager Class

```typescript
import { themeManager } from "../lib/theme-manager";

// Get current config
const config = themeManager.getConfig();

// Set theme mode
themeManager.setMode("dark");

// Set color palettes
themeManager.setPrimaryPalette("purple");
themeManager.setSecondaryPalette("green");
themeManager.setAccentPalette("cyan");

// Set custom colors
themeManager.setCustomColors({
  primary: "#ff6b6b",
  secondary: "#4ecdc4",
  accent: "#45b7d1",
});

// Subscribe to changes
const unsubscribe = themeManager.subscribe((config) => {
  console.log("Theme changed:", config);
});

// Export/Import
const configJson = themeManager.exportConfig();
themeManager.importConfig(configJson);
```

### Theme Customizer Component

```tsx
import { ThemeCustomizer } from "./components/theme-customizer";

function App() {
  return (
    <div>
      <ThemeCustomizer />
    </div>
  );
}
```

## 🧩 Components

### Button Component

```tsx
import { Button } from './ui/button-css-modules';

// Variants
<Button variant="default">Default</Button>
<Button variant="destructive">Destructive</Button>
<Button variant="outline">Outline</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>

// Sizes
<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>
<Button size="xl">Extra Large</Button>
<Button size="icon" iconOnly>Icon</Button>

// States
<Button loading>Loading</Button>
<Button disabled>Disabled</Button>
```

### Card Component

```tsx
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './ui/card-css-modules';

// Variants
<Card variant="default">Default Card</Card>
<Card variant="interactive">Interactive Card</Card>
<Card variant="bordered">Bordered Card</Card>
<Card variant="flat">Flat Card</Card>
<Card variant="elevated">Elevated Card</Card>

// States
<Card success>Success Card</Card>
<Card warning>Warning Card</Card>
<Card error>Error Card</Card>

// Padding
<Card padding="sm">Small Padding</Card>
<Card padding="md">Medium Padding</Card>
<Card padding="lg">Large Padding</Card>
<Card padding="none">No Padding</Card>
```

## 💡 Usage Examples

### Basic Theme Setup

```tsx
import { ThemeProvider } from "./components/theme-provider";
import { themeManager } from "./lib/theme-manager";

function App() {
  useEffect(() => {
    // Set initial theme
    themeManager.setMode("system");
    themeManager.setPrimaryPalette("blue");
  }, []);

  return (
    <ThemeProvider>
      <YourApp />
    </ThemeProvider>
  );
}
```

### Custom Color Override

```tsx
// Override specific colors
themeManager.setCustomColors({
  primary: "#ff6b6b",
  secondary: "#4ecdc4",
  background: "#f8f9fa",
  foreground: "#2d3748",
});
```

### CSS Module Usage

```tsx
import styles from "./component.module.css";

function MyComponent() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Title</h1>
      <p className={styles.description}>Description</p>
    </div>
  );
}
```

```css
/* component.module.css */
.container {
  padding: var(--space-4);
  background-color: var(--background);
  color: var(--foreground);
}

.title {
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  color: var(--text-primary);
}

.description {
  font-size: var(--text-base);
  color: var(--text-secondary);
  margin-top: var(--space-2);
}
```

## 🎨 Customization

### 1. Add New Color Palette

```typescript
// In theme-manager.ts
const paletteMap: Record<ColorPalette, Record<string, string>> = {
  // ... existing palettes
  orange: {
    "50": "255 247 237",
    "100": "255 237 213",
    "200": "254 215 170",
    "300": "253 186 116",
    "400": "251 146 60",
    "500": "249 115 22",
    "600": "234 88 12",
    "700": "194 65 12",
    "800": "154 52 18",
    "900": "124 45 18",
    "950": "67 20 7",
  },
};
```

### 2. Add New Design Token

```css
/* In design-tokens.css */
:root {
  --new-token: value;
}
```

### 3. Create Custom Component

```tsx
// CustomComponent.tsx
import styles from "./custom-component.module.css";

export function CustomComponent({ variant = "default" }) {
  return (
    <div className={`${styles.component} ${styles[variant]}`}>Content</div>
  );
}
```

```css
/* custom-component.module.css */
.component {
  /* Base styles using design tokens */
  padding: var(--space-4);
  border-radius: var(--radius-lg);
  background-color: var(--background);
  color: var(--foreground);
}

.default {
  border: 1px solid var(--border);
}

.special {
  background-color: var(--primary);
  color: var(--primary-foreground);
}
```

## 🚀 Benefits

- **Consistent Design**: All components follow the same design principles
- **Easy Theming**: Change entire app appearance with a few clicks
- **Type Safety**: Full TypeScript support for all design tokens
- **Performance**: CSS Modules are pre-compiled, no runtime overhead
- **Maintainable**: Clear separation of concerns and organized structure
- **Scalable**: Easy to add new components and design tokens
- **Accessible**: Built with accessibility in mind

## 📁 File Structure

```
src/renderer/
├── styles/
│   ├── variables.css          # Main theme variables
│   ├── design-tokens.css      # Design token definitions
│   ├── color-palettes.css     # Color palette definitions
│   ├── base.module.css        # Base CSS module styles
│   └── dark-theme.css         # Dark theme specific styles
├── components/
│   ├── ui/
│   │   ├── button-css-modules.tsx
│   │   ├── button.module.css
│   │   ├── card-css-modules.tsx
│   │   └── card.module.css
│   ├── theme-customizer.tsx
│   └── theme-switcher.tsx
├── lib/
│   └── theme-manager.ts       # Theme management system
└── screens/
    ├── main.tsx
    └── main.module.css
```

## 🎯 Next Steps

1. **Add More Components**: Create additional UI components using the design system
2. **Animation System**: Add animation tokens and utilities
3. **Responsive Design**: Add responsive design tokens
4. **Accessibility**: Enhance accessibility features
5. **Documentation**: Add Storybook for component documentation

---

**Happy Designing! 🎨✨**
