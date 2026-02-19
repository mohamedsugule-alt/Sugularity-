# Sugularity Design System Guide — Sprint 5

Premium luxury visual system with dark/light mode, accessibility, and motion.

---

## 🎨 Design Tokens

All tokens are defined in `styles/tokens.css`. **Never use raw colors in components.**

### Spacing Scale
| Token | Value | Use |
|-------|-------|-----|
| `--space-1` | 4px | Tight gaps |
| `--space-2` | 8px | Component padding |
| `--space-3` | 12px | Card padding |
| `--space-4` | 16px | Standard padding |
| `--space-6` | 24px | Section spacing |
| `--space-8` | 32px | Large gaps |
| `--space-12` | 48px | Page sections |

### Typography
```css
--font-sans: 'Inter', system-ui;
--font-mono: 'JetBrains Mono';
--text-xs: 0.75rem;   /* 12px - metadata */
--text-sm: 0.875rem;  /* 14px - labels */
--text-base: 1rem;    /* 16px - body */
--text-lg: 1.125rem;  /* 18px - subheads */
--text-xl: 1.25rem;   /* 20px - headers */
--text-2xl: 1.5rem;   /* 24px - section titles */
--text-3xl: 1.875rem; /* 30px - page titles */
```

### Border Radius
| Token | Value | Use |
|-------|-------|-----|
| `--radius-sm` | 6px | Badges, chips |
| `--radius-md` | 10px | Buttons, inputs |
| `--radius-lg` | 14px | Cards, panels |
| `--radius-xl` | 20px | Modals |
| `--radius-full` | 9999px | Pills, avatars |

### Elevation (Shadows)
| Token | Use |
|-------|-----|
| `--shadow-1` | Subtle depth |
| `--shadow-2` | Cards at rest |
| `--shadow-3` | Cards on hover |
| `--shadow-4` | Elevated modals |
| `--shadow-5` | Floating elements |

---

## 🌗 Theme System

Themes are managed by `ThemeProvider` in `components/providers/ThemeProvider.tsx`.

### Usage
```tsx
import { useTheme } from '@/components/providers/ThemeProvider';

function MyComponent() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  // theme: 'system' | 'light' | 'dark'
  // resolvedTheme: 'light' | 'dark' (computed)
}
```

### Theme Options
- **System** (default): Follows OS preference
- **Light**: Force light mode
- **Dark**: Force dark mode

### Color Usage
Always use semantic tokens:
```css
/* ✅ Correct */
color: var(--text-primary);
background: var(--bg-surface);

/* ❌ Wrong */
color: #18181B;
background: white;
```

### Key Semantic Colors
| Token | Light | Dark |
|-------|-------|------|
| `--bg-base` | #FAFAFA | #09090B |
| `--bg-surface` | #FFFFFF | #18181B |
| `--text-primary` | #18181B | #FAFAFA |
| `--text-muted` | #71717A | #A1A1AA |
| `--accent` | #8B5CF6 | #A78BFA |
| `--success` | #10B981 | #34D399 |
| `--warning` | #F59E0B | #FBBF24 |
| `--danger` | #EF4444 | #F87171 |

---

## ⚡ Motion System

Motion tokens in `styles/tokens.css`. Motion communicates state—not decoration.

### Durations
| Token | Value | Use |
|-------|-------|-----|
| `--duration-fast` | 150ms | Button states |
| `--duration-normal` | 250ms | Card transitions |
| `--duration-slow` | 400ms | Page transitions |

### Easing
| Token | Use |
|-------|-----|
| `--ease-standard` | General UI |
| `--ease-emphasized` | Modal enter |
| `--ease-spring` | Playful bounce |

### Reduce Motion
Automatically respected via `@media (prefers-reduced-motion: reduce)`.

---

## 🧩 Component Classes

Defined in `styles/components.css`. Use these instead of custom styles.

### Buttons
```html
<button class="btn btn-primary">Primary</button>
<button class="btn btn-secondary">Secondary</button>
<button class="btn btn-ghost">Ghost</button>
<button class="btn btn-danger">Destructive</button>

<!-- Sizes -->
<button class="btn btn-primary btn-sm">Small</button>
<button class="btn btn-primary btn-lg">Large</button>
```

### Inputs
```html
<input class="input" placeholder="Text input" />
<textarea class="input textarea">Multiline</textarea>
<select class="input select">...</select>
```

### Cards
```html
<div class="glass-panel">Glass card</div>
<div class="card">Solid card</div>
<div class="card card-raised">Elevated card</div>
```

### Badges
```html
<span class="badge badge-primary">Primary</span>
<span class="badge badge-success">Success</span>
<span class="badge badge-warning">Warning</span>
<span class="badge badge-danger">Danger</span>
<span class="badge badge-cold">Cold</span>
```

### Loading
```html
<!-- Skeleton -->
<div class="skeleton" style="height: 20px; width: 100%"></div>

<!-- Pulse -->
<div class="animate-pulse">Loading...</div>
```

---

## ♿ Accessibility

### Focus States
All interactive elements get visible focus rings:
```css
.focus-ring:focus-visible {
  box-shadow: 0 0 0 2px var(--bg-surface),
              0 0 0 4px var(--focus-ring);
}
```

### Contrast
- All text meets WCAG AA (4.5:1 ratio)
- Interactive elements meet 3:1 ratio
- Tested in both light and dark modes

### Screen Readers
- All buttons have descriptive labels
- Icons have `aria-hidden="true"` or descriptive `aria-label`
- Form inputs have associated labels

---

## 🖼️ Logo Assets

Place logo files in `public/`:
- `logo.png` — Full logo (current)
- `logo-dark.png` — Optional dark variant
- `icon.png` — 512x512 app icon

### Usage in Components
```tsx
import Image from 'next/image';

<Image src="/logo.png" alt="Sugularity" width={40} height={40} />
```

---

## 📱 Responsive Breakpoints

```css
/* Mobile-first */
@media (min-width: 768px) { /* Tablet */ }
@media (min-width: 1024px) { /* Desktop */ }
@media (min-width: 1280px) { /* Large desktop */ }
```

Touch targets: minimum 44x44px on mobile.

---

## ✅ Visual QA Checklist

- [ ] Contrast passes in both themes
- [ ] Focus rings visible
- [ ] Animations smooth (60fps)
- [ ] Reduce motion respected
- [ ] Typography hierarchy clear
- [ ] Spacing consistent
- [ ] No color hardcoding
- [ ] Logo displays correctly
