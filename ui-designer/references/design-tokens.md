# Design Tokens Reference

Complete token scales with production-ready values. Every spacing unit, type
size, color value, shadow, and radius you need to build a consistent interface.

Copy the CSS custom properties directly into your project. Adjust the semantic
values (primary color, font family) to match your brand, but keep the scales
and structure intact.

---

## 1. Spacing System

### The 8pt Grid

All spacing values are multiples of 8px. Use 4px increments only for fine-tuning
inside compact components (icon-to-text gaps, label-to-input distance). Never
use arbitrary values like 5px, 7px, 13px, or 15px. If a spacing value is not on
the grid, it is wrong.

### Complete Spacing Token Scale

| Token   | Value  | Use Case                                          |
|---------|--------|---------------------------------------------------|
| `3xs`   | 2px    | Hairline borders, subtle visual separators         |
| `2xs`   | 4px    | Icon-to-text gap, tight internal spacing           |
| `xs`    | 8px    | Related element gap, compact padding               |
| `sm`    | 12px   | Form field internal padding, small gaps            |
| `md`    | 16px   | Default padding, paragraph spacing                 |
| `lg`    | 24px   | Section padding, card internal spacing             |
| `xl`    | 32px   | Component separation, generous padding             |
| `2xl`   | 48px   | Section separation, hero internal padding          |
| `3xl`   | 64px   | Major section breaks, page-level spacing           |
| `4xl`   | 96px   | Hero/landing section vertical padding              |
| `5xl`   | 128px  | Full-bleed section separation                      |

### Spacing CSS Custom Properties

```css
:root {
  --space-3xs: 2px;
  --space-2xs: 4px;
  --space-xs: 8px;
  --space-sm: 12px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  --space-2xl: 48px;
  --space-3xl: 64px;
  --space-4xl: 96px;
  --space-5xl: 128px;
}
```

### The Internal <= External Rule

Padding inside a component must always be less than or equal to the gap between
that component and its neighbors. When internal spacing exceeds external spacing,
the eye cannot tell where one element ends and the next begins.

**Correct:**
```
Card padding: 16px
Gap between cards: 24px
```
The cards read as separate objects. Content belongs to its card.

**Wrong:**
```
Card padding: 32px
Gap between cards: 16px
```
The cards blur together. Content feels disconnected from its container. The
interface feels chaotic even if you cannot articulate why.

This rule applies everywhere: form labels closer to their input than to the
previous field. List item padding smaller than the gap between list items.
Sidebar section headings closer to their content than to the previous section.

### Proximity Guidelines

Spacing communicates relationship. Closer items are perceived as related.

| Relationship        | Distance   | Examples                                |
|---------------------|------------|-----------------------------------------|
| Tightly coupled     | 4-8px      | Label to input, icon to text            |
| Related items       | 8-16px     | List items, form fields within a group  |
| Loosely related     | 24-32px    | Card sections, sidebar groups           |
| Different sections  | 48-64px    | Page sections, content area breaks      |
| Major divisions     | 64-128px   | Hero to content, footer separation      |

**Critical rule:** Label-to-input gap (4-6px) must always be less than
field-to-field gap (16-24px). If the label is equidistant between two fields,
the user cannot tell which field it belongs to.

---

## 2. Typography System

### Type Scale Ratios

Choose one ratio for your project and generate all sizes from it. Never pick
font sizes by feel.

| Ratio | Name           | Best For                              |
|-------|----------------|---------------------------------------|
| 1.125 | Major Second   | Dense UIs, dashboards, data-heavy     |
| 1.200 | Minor Third    | Most web apps, balanced readability    |
| 1.250 | Major Third    | Marketing sites, editorial, blogs     |
| 1.333 | Perfect Fourth | Bold layouts, high-impact landing     |

### Complete Type Scale (1.200 ratio, 16px base)

| Role          | Size    | Weight | Line Height | Letter Spacing |
|---------------|---------|--------|-------------|----------------|
| Caption       | 11px    | 400    | 16px (1.45) | +0.02em        |
| Small         | 13px    | 400    | 20px (1.54) | +0.01em        |
| Body          | 16px    | 400    | 24px (1.5)  | 0              |
| Body Large    | 19px    | 400    | 28px (1.47) | 0              |
| Heading 5     | 23px    | 600    | 28px (1.22) | -0.01em        |
| Heading 4     | 28px    | 600    | 36px (1.29) | -0.02em        |
| Heading 3     | 33px    | 600    | 40px (1.21) | -0.02em        |
| Heading 2     | 40px    | 700    | 48px (1.2)  | -0.03em        |
| Heading 1     | 48px    | 700    | 56px (1.17) | -0.03em        |
| Display Small | 57px    | 700    | 64px (1.12) | -0.03em        |
| Display Large | 68px    | 800    | 76px (1.12) | -0.04em        |

All line heights snap to the 4px grid. Sizes are rounded to whole pixels.

### Line Height Rules

| Text Category              | Line Height Range | Sweet Spot |
|----------------------------|-------------------|------------|
| Body text (14-18px)        | 1.4x - 1.6x      | 1.5x       |
| Headings (20-48px)         | 1.1x - 1.3x      | 1.2x       |
| Display text (48px+)       | 1.0x - 1.15x     | 1.1x       |
| Captions/labels (< 14px)   | 1.4x - 1.5x      | 1.45x      |
| Single-line UI elements    | 1.0x             | 1.0x       |

Always snap the computed line height to the nearest 4px value. A 16px body at
1.5x line height gives 24px, which is already on the grid. A 23px heading at
1.22x gives 28.06px -- round to 28px.

### Letter Spacing Rules

| Text Size         | Letter Spacing    | Reason                          |
|-------------------|-------------------|---------------------------------|
| Small (< 14px)    | +0.01 to +0.03em | Opens up tight characters       |
| Body (14-18px)    | 0                 | Typeface default is optimized   |
| Large (20-40px)   | -0.01 to -0.02em | Tightens loose appearance       |
| Display (40px+)   | -0.03 to -0.04em | Prevents visual letter gaps     |
| ALL CAPS (any)    | +0.05 to +0.1em  | Counters uniform cap height     |

### Font Pairing Rules

- Maximum 2 typefaces per project (one for headings, one for body, or one for
  everything with weight variation).
- Weight variation is more effective than style variation. Use 400/600/700
  weights before reaching for a second typeface.
- Paired fonts should share a similar x-height so they feel balanced when set
  at the same size.
- Paired fonts should have different personalities (geometric + humanist,
  slab + sans-serif) to create clear visual distinction.

### Font Recommendations by Context

| Context           | Heading Font          | Body Font            | Fallback Stack                           |
|-------------------|-----------------------|----------------------|------------------------------------------|
| SaaS / Dashboard  | Inter                 | Inter                | system-ui, -apple-system, sans-serif     |
| Marketing Site    | Fraunces              | Inter                | Georgia, serif / system-ui, sans-serif   |
| Developer Tools   | JetBrains Mono        | Inter                | Menlo, Consolas, monospace               |
| Editorial / Blog  | Playfair Display      | Source Serif 4       | Georgia, serif                           |
| Modern Geometric  | Plus Jakarta Sans     | Plus Jakarta Sans    | system-ui, -apple-system, sans-serif     |
| Enterprise        | IBM Plex Sans         | IBM Plex Sans        | system-ui, -apple-system, sans-serif     |
| Fintech           | DM Sans               | DM Sans              | system-ui, -apple-system, sans-serif     |
| Healthcare        | Source Sans 3         | Source Sans 3        | system-ui, -apple-system, sans-serif     |

All recommended fonts are available on Google Fonts at no cost.

### Typography CSS Custom Properties

```css
:root {
  /* Font families */
  --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
  --font-serif: 'Source Serif 4', Georgia, serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', Menlo, Consolas, monospace;

  /* Font sizes */
  --text-caption: 11px;
  --text-sm: 13px;
  --text-base: 16px;
  --text-lg: 19px;
  --text-xl: 23px;
  --text-2xl: 28px;
  --text-3xl: 33px;
  --text-4xl: 40px;
  --text-5xl: 48px;
  --text-6xl: 57px;
  --text-7xl: 68px;

  /* Font weights */
  --font-regular: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;
  --font-extrabold: 800;

  /* Line heights (snapped to 4px grid) */
  --leading-caption: 16px;
  --leading-sm: 20px;
  --leading-base: 24px;
  --leading-lg: 28px;
  --leading-xl: 28px;
  --leading-2xl: 36px;
  --leading-3xl: 40px;
  --leading-4xl: 48px;
  --leading-5xl: 56px;
  --leading-6xl: 64px;
  --leading-7xl: 76px;

  /* Letter spacing */
  --tracking-tight: -0.03em;
  --tracking-snug: -0.01em;
  --tracking-normal: 0;
  --tracking-wide: +0.02em;
  --tracking-wider: +0.05em;
  --tracking-widest: +0.1em;
}
```

---

## 3. Color System

### The 60-30-10 Rule

Every interface follows this proportion:

- **60% dominant** -- background and canvas. Neutral colors. This is the air
  the interface breathes in.
- **30% secondary** -- cards, surfaces, sidebars. One step from the dominant.
  Creates depth and grouping.
- **10% accent** -- buttons, links, active states, CTAs. The color the eye is
  drawn to. This is where your brand lives.

**Light mode example:** white background (60%), light gray cards (30%), blue
primary buttons and links (10%).

**Dark mode example:** dark gray background (60%), slightly lighter gray
surfaces (30%), desaturated blue accent on interactive elements (10%).

If your accent color appears on more than roughly 10% of the viewport, the
interface will feel noisy. If it appears on less than 5%, the interface will
feel lifeless.

### Neutral Scale

A 10-step neutral palette for backgrounds, text, borders, and surfaces.

**Light Mode Neutrals:**

| Step | Hex       | Use Case                                   |
|------|-----------|--------------------------------------------|
| 50   | `#FAFAFA` | Page background, subtle tint               |
| 100  | `#F5F5F5` | Card background, secondary surface         |
| 200  | `#E5E5E5` | Borders, dividers, input borders           |
| 300  | `#D4D4D4` | Disabled borders, subtle outlines          |
| 400  | `#A3A3A3` | Placeholder text, disabled text            |
| 500  | `#737373` | Secondary text, captions, metadata         |
| 600  | `#525252` | Icons, tertiary text                       |
| 700  | `#404040` | Body text (primary)                        |
| 800  | `#262626` | Headings, high-emphasis text               |
| 900  | `#171717` | Maximum emphasis, near-black               |

**Dark Mode Neutrals:**

| Step | Hex       | Use Case                                   |
|------|-----------|--------------------------------------------|
| 50   | `#171717` | Page background, deepest surface           |
| 100  | `#1C1C1C` | Card background, secondary surface         |
| 200  | `#262626` | Elevated surface, sidebar background       |
| 300  | `#333333` | Borders, dividers, input borders           |
| 400  | `#525252` | Disabled text, placeholder text            |
| 500  | `#737373` | Secondary text, captions, metadata         |
| 600  | `#A3A3A3` | Icons, tertiary text                       |
| 700  | `#D4D4D4` | Body text (primary)                        |
| 800  | `#E5E5E5` | Headings, high-emphasis text               |
| 900  | `#FAFAFA` | Maximum emphasis, near-white               |

Never use pure `#000000` or `#FFFFFF`. Pure black is too harsh for text. Pure
white is too harsh for backgrounds. Off-values feel more natural.

### Primary Color Shade Generation

Generate a full shade range from your brand color. The 500-600 range is your
default interactive color. Light shades serve as backgrounds and tints. Dark
shades serve as text and hover states.

**Example: Blue primary (`#2563EB` as the 600 anchor)**

| Shade | Hex       | Use Case                                   |
|-------|-----------|--------------------------------------------|
| 50    | `#EFF6FF` | Tinted background, selected row highlight  |
| 100   | `#DBEAFE` | Hover background, subtle badge fill        |
| 200   | `#BFDBFE` | Active background, progress bar track      |
| 300   | `#93C5FD` | Decorative accents, chart fills            |
| 400   | `#60A5FA` | Hover state for links, secondary buttons   |
| 500   | `#3B82F6` | Default button fill, active link color     |
| 600   | `#2563EB` | Primary brand color, high-contrast button  |
| 700   | `#1D4ED8` | Hover state for primary button             |
| 800   | `#1E40AF` | Active/pressed state for primary button    |
| 900   | `#1E3A8A` | Text on light primary backgrounds          |
| 950   | `#172554` | High-contrast text on tinted backgrounds   |

### Semantic Colors

Each semantic category needs four variants: background, border, text, and icon.

**Success (Green)**

| Variant    | Light Mode  | Dark Mode   |
|------------|-------------|-------------|
| Background | `#F0FDF4`   | `#052E16`   |
| Border     | `#86EFAC`   | `#166534`   |
| Text       | `#166534`   | `#86EFAC`   |
| Icon       | `#22C55E`   | `#4ADE80`   |
| Solid      | `#16A34A`   | `#22C55E`   |

**Warning (Amber)**

| Variant    | Light Mode  | Dark Mode   |
|------------|-------------|-------------|
| Background | `#FFFBEB`   | `#451A03`   |
| Border     | `#FCD34D`   | `#92400E`   |
| Text       | `#92400E`   | `#FCD34D`   |
| Icon       | `#F59E0B`   | `#FBBF24`   |
| Solid      | `#D97706`   | `#F59E0B`   |

**Error (Red)**

| Variant    | Light Mode  | Dark Mode   |
|------------|-------------|-------------|
| Background | `#FEF2F2`   | `#450A0A`   |
| Border     | `#FCA5A5`   | `#991B1B`   |
| Text       | `#991B1B`   | `#FCA5A5`   |
| Icon       | `#EF4444`   | `#F87171`   |
| Solid      | `#DC2626`   | `#EF4444`   |

**Info (Blue)**

| Variant    | Light Mode  | Dark Mode   |
|------------|-------------|-------------|
| Background | `#EFF6FF`   | `#172554`   |
| Border     | `#93C5FD`   | `#1E40AF`   |
| Text       | `#1E40AF`   | `#93C5FD`   |
| Icon       | `#3B82F6`   | `#60A5FA`   |
| Solid      | `#2563EB`   | `#3B82F6`   |

### Color CSS Custom Properties

```css
:root {
  /* --- Light Mode (default) --- */

  /* Neutral */
  --color-neutral-50: #FAFAFA;
  --color-neutral-100: #F5F5F5;
  --color-neutral-200: #E5E5E5;
  --color-neutral-300: #D4D4D4;
  --color-neutral-400: #A3A3A3;
  --color-neutral-500: #737373;
  --color-neutral-600: #525252;
  --color-neutral-700: #404040;
  --color-neutral-800: #262626;
  --color-neutral-900: #171717;

  /* Primary */
  --color-primary-50: #EFF6FF;
  --color-primary-100: #DBEAFE;
  --color-primary-200: #BFDBFE;
  --color-primary-300: #93C5FD;
  --color-primary-400: #60A5FA;
  --color-primary-500: #3B82F6;
  --color-primary-600: #2563EB;
  --color-primary-700: #1D4ED8;
  --color-primary-800: #1E40AF;
  --color-primary-900: #1E3A8A;
  --color-primary-950: #172554;

  /* Semantic: Success */
  --color-success-bg: #F0FDF4;
  --color-success-border: #86EFAC;
  --color-success-text: #166534;
  --color-success-icon: #22C55E;
  --color-success-solid: #16A34A;

  /* Semantic: Warning */
  --color-warning-bg: #FFFBEB;
  --color-warning-border: #FCD34D;
  --color-warning-text: #92400E;
  --color-warning-icon: #F59E0B;
  --color-warning-solid: #D97706;

  /* Semantic: Error */
  --color-error-bg: #FEF2F2;
  --color-error-border: #FCA5A5;
  --color-error-text: #991B1B;
  --color-error-icon: #EF4444;
  --color-error-solid: #DC2626;

  /* Semantic: Info */
  --color-info-bg: #EFF6FF;
  --color-info-border: #93C5FD;
  --color-info-text: #1E40AF;
  --color-info-icon: #3B82F6;
  --color-info-solid: #2563EB;

  /* Surfaces and text (semantic aliases) */
  --color-bg-page: var(--color-neutral-50);
  --color-bg-card: #FFFFFF;
  --color-bg-elevated: #FFFFFF;
  --color-bg-muted: var(--color-neutral-100);
  --color-bg-subtle: var(--color-neutral-200);

  --color-text-primary: var(--color-neutral-800);
  --color-text-secondary: var(--color-neutral-500);
  --color-text-tertiary: var(--color-neutral-400);
  --color-text-inverse: #FFFFFF;

  --color-border-default: var(--color-neutral-200);
  --color-border-strong: var(--color-neutral-300);
  --color-border-muted: var(--color-neutral-100);
}

/* --- Dark Mode --- */
@media (prefers-color-scheme: dark) {
  :root {
    /* Neutral (inverted) */
    --color-neutral-50: #171717;
    --color-neutral-100: #1C1C1C;
    --color-neutral-200: #262626;
    --color-neutral-300: #333333;
    --color-neutral-400: #525252;
    --color-neutral-500: #737373;
    --color-neutral-600: #A3A3A3;
    --color-neutral-700: #D4D4D4;
    --color-neutral-800: #E5E5E5;
    --color-neutral-900: #FAFAFA;

    /* Primary (desaturated for dark mode) */
    --color-primary-50: #172554;
    --color-primary-100: #1E3A8A;
    --color-primary-200: #1E40AF;
    --color-primary-300: #1D4ED8;
    --color-primary-400: #2563EB;
    --color-primary-500: #3B82F6;
    --color-primary-600: #60A5FA;
    --color-primary-700: #93C5FD;
    --color-primary-800: #BFDBFE;
    --color-primary-900: #DBEAFE;
    --color-primary-950: #EFF6FF;

    /* Semantic: Success */
    --color-success-bg: #052E16;
    --color-success-border: #166534;
    --color-success-text: #86EFAC;
    --color-success-icon: #4ADE80;
    --color-success-solid: #22C55E;

    /* Semantic: Warning */
    --color-warning-bg: #451A03;
    --color-warning-border: #92400E;
    --color-warning-text: #FCD34D;
    --color-warning-icon: #FBBF24;
    --color-warning-solid: #F59E0B;

    /* Semantic: Error */
    --color-error-bg: #450A0A;
    --color-error-border: #991B1B;
    --color-error-text: #FCA5A5;
    --color-error-icon: #F87171;
    --color-error-solid: #EF4444;

    /* Semantic: Info */
    --color-info-bg: #172554;
    --color-info-border: #1E40AF;
    --color-info-text: #93C5FD;
    --color-info-icon: #60A5FA;
    --color-info-solid: #3B82F6;

    /* Surfaces and text (dark mode aliases) */
    --color-bg-page: var(--color-neutral-50);
    --color-bg-card: var(--color-neutral-100);
    --color-bg-elevated: var(--color-neutral-200);
    --color-bg-muted: var(--color-neutral-100);
    --color-bg-subtle: var(--color-neutral-200);

    --color-text-primary: var(--color-neutral-800);
    --color-text-secondary: var(--color-neutral-500);
    --color-text-tertiary: var(--color-neutral-400);
    --color-text-inverse: var(--color-neutral-50);

    --color-border-default: rgba(255, 255, 255, 0.1);
    --color-border-strong: rgba(255, 255, 255, 0.15);
    --color-border-muted: rgba(255, 255, 255, 0.06);
  }
}
```

### Contrast Requirements (WCAG AA)

| Element Type                              | Minimum Ratio |
|-------------------------------------------|---------------|
| Body text (any size)                      | 4.5:1         |
| Large text (18px+ regular, 14px+ bold)    | 3:1           |
| UI components and graphical objects       | 3:1           |
| Placeholder text                          | 4.5:1         |
| Disabled elements                         | No requirement |
| Decorative elements                       | No requirement |

Test every text-on-background combination. Use a contrast checker. Do not
eyeball it.

### Dark Mode Principles

1. **Do not invert.** Dark mode is a separate considered palette, not a
   mechanical inversion of light mode.
2. **Desaturate primary colors.** Saturated colors vibrate against dark
   backgrounds and cause visual fatigue. Reduce saturation by 10-20%.
3. **Elevation = lighter surfaces.** In light mode, higher elevation casts
   shadows. In dark mode, higher elevation means lighter surface color. A card
   is lighter than the page. A modal is lighter than the card.
4. **Text is off-white.** Use `#E5E5E5` to `#F5F5F5` for body text. Never
   pure `#FFFFFF`, which is too harsh at night.
5. **Borders are semi-transparent white.** Use `rgba(255, 255, 255, 0.1)` for
   default borders. This adapts to any surface color underneath.
6. **Test at night.** Open your dark mode interface in a dim room. If your eyes
   strain, the contrast is too high or a color is too saturated.

### Color Don'ts

- **More than 3 hues + neutrals.** Every additional hue adds cognitive load. If
  your palette has 5 hues, remove 2.
- **Pure saturated colors on large surfaces.** A saturated blue card background
  will dominate the hierarchy and fatigue the eye. Use the 50-100 shade range
  for large fills.
- **Color as the only differentiator.** Never rely solely on color to convey
  meaning. Add icons, labels, or patterns for colorblind accessibility.
- **Mixing warm and cool grays.** Pick one temperature and commit. Warm grays
  have a slight yellow/brown tint. Cool grays have a slight blue tint. Mixing
  them feels disjointed.
- **Same color for different meanings.** If blue means "primary action" and also
  "information alert," users cannot distinguish intent from status.

---

## 4. Elevation and Depth

### Shadow Scale

Each level increases blur radius, vertical offset, and spread. Use double
shadows (a large ambient + a small direct) for realistic depth.

```css
:root {
  --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05);
  --shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.1), 0 8px 10px rgba(0, 0, 0, 0.04);
  --shadow-2xl: 0 25px 50px rgba(0, 0, 0, 0.25);
  --shadow-inner: inset 0 2px 4px rgba(0, 0, 0, 0.06);
}
```

| Token       | Elevation | Use Case                                      |
|-------------|-----------|-----------------------------------------------|
| `shadow-xs` | Ground    | Subtle lift, default card border alternative   |
| `shadow-sm` | Low       | Cards at rest, dropdown triggers               |
| `shadow-md` | Medium    | Hovered cards, active dropdowns                |
| `shadow-lg` | High      | Popovers, tooltips, floating action buttons    |
| `shadow-xl` | Higher    | Modals, slide-over panels                      |
| `shadow-2xl`| Highest   | Full-screen overlays, command palettes          |
| `shadow-inner`| Inset  | Input fields, recessed containers              |

### Shadow Rules

1. **Higher elevation = larger blur + more offset + lighter opacity.** A card at
   rest uses `shadow-sm`. On hover, it rises to `shadow-md`. A modal floats at
   `shadow-xl`. The progression must be consistent.
2. **Elements rise on hover.** Interactive elements gain one shadow level on
   hover (`xs` to `sm`, `sm` to `md`). This communicates clickability.
3. **Light source is top-left.** All shadows fall down and slightly to the right.
   Never mix shadow directions.
4. **Dark mode: replace shadows with surface colors.** Shadows are nearly
   invisible on dark backgrounds. Use progressively lighter surface colors
   (`#1C1C1C` for cards, `#262626` for popovers, `#333333` for modals) instead
   of shadow values.
5. **Use sparingly.** If every element has a shadow, no element looks elevated.
   Reserve shadows for elements that genuinely float above the surface.

### Border Radius Scale

```css
:root {
  --radius-none: 0;
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-2xl: 24px;
  --radius-full: 9999px;
}
```

| Token        | Value   | Use Case                                     |
|--------------|---------|----------------------------------------------|
| `radius-none`| 0       | Tables, full-bleed images, code blocks       |
| `radius-sm`  | 4px     | Buttons, inputs, badges, tags                |
| `radius-md`  | 8px     | Cards, dropdowns, tooltips                   |
| `radius-lg`  | 12px    | Modals, large cards, image containers        |
| `radius-xl`  | 16px    | Hero cards, marketing blocks                 |
| `radius-2xl` | 24px    | Full-width banners, feature highlights       |
| `radius-full`| 9999px  | Avatars, pills, toggle thumbs, round buttons |

### Border Radius Personality

The radius you choose sets the tone for the entire product.

| Radius Range | Personality            | Products That Use This           |
|--------------|------------------------|----------------------------------|
| 0-4px        | Professional, editorial | Bloomberg, The NYT, Notion       |
| 8-12px       | Modern, friendly SaaS   | Linear, Vercel, Stripe           |
| 16px+        | Playful, consumer       | Spotify, Discord, Duolingo       |

Pick one style and commit. Mixing sharp and round within the same interface
creates visual tension.

**Nested radius rule:** When an element is inside a rounded container, its
radius must be smaller than the parent's radius minus the padding between them.

```
Parent radius: 12px
Padding: 8px
Child radius: 12 - 8 = 4px (or smaller)
```

If you give the child the same radius as the parent, the corners will not look
concentrically nested. They will look off.

---

## 5. Container and Layout Tokens

### Container Widths

| Token          | Width    | Use Case                                  |
|----------------|----------|-------------------------------------------|
| `container-xs` | 480px    | Auth forms, narrow modals, email templates |
| `container-sm` | 640px    | Blog content, focused reading              |
| `container-md` | 768px    | Documentation, article with sidebar        |
| `container-lg` | 1024px   | App content area, dashboard main panel     |
| `container-xl` | 1280px   | Full app layout, wide dashboard            |
| `container-2xl`| 1536px   | Marketing hero, edge-to-edge content       |

### Breakpoints

| Token    | Width    | Target                                     |
|----------|----------|--------------------------------------------|
| `sm`     | 640px    | Large phones in landscape                  |
| `md`     | 768px    | Tablets in portrait                        |
| `lg`     | 1024px   | Tablets in landscape, small laptops        |
| `xl`     | 1280px   | Standard desktops, laptops                 |
| `2xl`    | 1536px   | Large desktops, external monitors          |

### Layout CSS Custom Properties

```css
:root {
  /* Container widths */
  --container-xs: 480px;
  --container-sm: 640px;
  --container-md: 768px;
  --container-lg: 1024px;
  --container-xl: 1280px;
  --container-2xl: 1536px;

  /* Breakpoints (for reference -- use in @media queries) */
  --breakpoint-sm: 640px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 1024px;
  --breakpoint-xl: 1280px;
  --breakpoint-2xl: 1536px;

  /* Grid */
  --grid-columns: 12;
  --grid-gutter: var(--space-lg);

  /* Z-index scale */
  --z-base: 0;
  --z-dropdown: 100;
  --z-sticky: 200;
  --z-overlay: 300;
  --z-modal: 400;
  --z-popover: 500;
  --z-toast: 600;
  --z-tooltip: 700;
}
```

---

## 6. Complete Design Token CSS Template

Copy this entire block into your project. Replace the primary color, font
family, and border radius default to match your brand. Every other value is
ready for production.

```css
/* ==========================================================================
   DESIGN TOKENS
   Complete system for spacing, typography, color, elevation, and layout.
   Based on 8pt grid, 1.200 type ratio, WCAG AA contrast compliance.
   ========================================================================== */

:root {

  /* ---------- SPACING ---------- */
  --space-3xs: 2px;
  --space-2xs: 4px;
  --space-xs: 8px;
  --space-sm: 12px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  --space-2xl: 48px;
  --space-3xl: 64px;
  --space-4xl: 96px;
  --space-5xl: 128px;

  /* ---------- TYPOGRAPHY ---------- */

  /* Font families */
  --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
  --font-serif: 'Source Serif 4', Georgia, serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', Menlo, Consolas, monospace;

  /* Font sizes (1.200 ratio, 16px base) */
  --text-caption: 11px;
  --text-sm: 13px;
  --text-base: 16px;
  --text-lg: 19px;
  --text-xl: 23px;
  --text-2xl: 28px;
  --text-3xl: 33px;
  --text-4xl: 40px;
  --text-5xl: 48px;
  --text-6xl: 57px;
  --text-7xl: 68px;

  /* Font weights */
  --font-regular: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;
  --font-extrabold: 800;

  /* Line heights (snapped to 4px grid) */
  --leading-caption: 16px;
  --leading-sm: 20px;
  --leading-base: 24px;
  --leading-lg: 28px;
  --leading-xl: 28px;
  --leading-2xl: 36px;
  --leading-3xl: 40px;
  --leading-4xl: 48px;
  --leading-5xl: 56px;
  --leading-6xl: 64px;
  --leading-7xl: 76px;

  /* Letter spacing */
  --tracking-tight: -0.03em;
  --tracking-snug: -0.01em;
  --tracking-normal: 0;
  --tracking-wide: 0.02em;
  --tracking-wider: 0.05em;
  --tracking-widest: 0.1em;

  /* ---------- COLORS (Light Mode) ---------- */

  /* Neutral */
  --color-neutral-50: #FAFAFA;
  --color-neutral-100: #F5F5F5;
  --color-neutral-200: #E5E5E5;
  --color-neutral-300: #D4D4D4;
  --color-neutral-400: #A3A3A3;
  --color-neutral-500: #737373;
  --color-neutral-600: #525252;
  --color-neutral-700: #404040;
  --color-neutral-800: #262626;
  --color-neutral-900: #171717;

  /* Primary */
  --color-primary-50: #EFF6FF;
  --color-primary-100: #DBEAFE;
  --color-primary-200: #BFDBFE;
  --color-primary-300: #93C5FD;
  --color-primary-400: #60A5FA;
  --color-primary-500: #3B82F6;
  --color-primary-600: #2563EB;
  --color-primary-700: #1D4ED8;
  --color-primary-800: #1E40AF;
  --color-primary-900: #1E3A8A;
  --color-primary-950: #172554;

  /* Success */
  --color-success-bg: #F0FDF4;
  --color-success-border: #86EFAC;
  --color-success-text: #166534;
  --color-success-icon: #22C55E;
  --color-success-solid: #16A34A;

  /* Warning */
  --color-warning-bg: #FFFBEB;
  --color-warning-border: #FCD34D;
  --color-warning-text: #92400E;
  --color-warning-icon: #F59E0B;
  --color-warning-solid: #D97706;

  /* Error */
  --color-error-bg: #FEF2F2;
  --color-error-border: #FCA5A5;
  --color-error-text: #991B1B;
  --color-error-icon: #EF4444;
  --color-error-solid: #DC2626;

  /* Info */
  --color-info-bg: #EFF6FF;
  --color-info-border: #93C5FD;
  --color-info-text: #1E40AF;
  --color-info-icon: #3B82F6;
  --color-info-solid: #2563EB;

  /* Semantic surface aliases */
  --color-bg-page: var(--color-neutral-50);
  --color-bg-card: #FFFFFF;
  --color-bg-elevated: #FFFFFF;
  --color-bg-muted: var(--color-neutral-100);
  --color-bg-subtle: var(--color-neutral-200);

  /* Semantic text aliases */
  --color-text-primary: var(--color-neutral-800);
  --color-text-secondary: var(--color-neutral-500);
  --color-text-tertiary: var(--color-neutral-400);
  --color-text-inverse: #FFFFFF;
  --color-text-link: var(--color-primary-600);
  --color-text-link-hover: var(--color-primary-700);

  /* Semantic border aliases */
  --color-border-default: var(--color-neutral-200);
  --color-border-strong: var(--color-neutral-300);
  --color-border-muted: var(--color-neutral-100);
  --color-border-focus: var(--color-primary-500);

  /* ---------- ELEVATION ---------- */

  /* Shadows */
  --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05);
  --shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.1), 0 8px 10px rgba(0, 0, 0, 0.04);
  --shadow-2xl: 0 25px 50px rgba(0, 0, 0, 0.25);
  --shadow-inner: inset 0 2px 4px rgba(0, 0, 0, 0.06);

  /* Border radius */
  --radius-none: 0;
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-2xl: 24px;
  --radius-full: 9999px;

  /* ---------- LAYOUT ---------- */

  /* Container widths */
  --container-xs: 480px;
  --container-sm: 640px;
  --container-md: 768px;
  --container-lg: 1024px;
  --container-xl: 1280px;
  --container-2xl: 1536px;

  /* Grid */
  --grid-columns: 12;
  --grid-gutter: var(--space-lg);

  /* Z-index scale */
  --z-base: 0;
  --z-dropdown: 100;
  --z-sticky: 200;
  --z-overlay: 300;
  --z-modal: 400;
  --z-popover: 500;
  --z-toast: 600;
  --z-tooltip: 700;

  /* ---------- MOTION ---------- */

  /* Durations */
  --duration-instant: 50ms;
  --duration-fast: 100ms;
  --duration-normal: 200ms;
  --duration-slow: 300ms;
  --duration-slower: 500ms;

  /* Easings */
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in: cubic-bezier(0.55, 0.085, 0.68, 0.53);
  --ease-in-out: cubic-bezier(0.45, 0, 0.55, 1);
  --ease-spring: cubic-bezier(0.175, 0.885, 0.32, 1.275);

  /* ---------- FOCUS ---------- */
  --focus-ring: 0 0 0 2px var(--color-bg-page), 0 0 0 4px var(--color-primary-500);
}

/* ==========================================================================
   DARK MODE OVERRIDES
   ========================================================================== */

@media (prefers-color-scheme: dark) {
  :root {
    /* Neutral (dark) */
    --color-neutral-50: #171717;
    --color-neutral-100: #1C1C1C;
    --color-neutral-200: #262626;
    --color-neutral-300: #333333;
    --color-neutral-400: #525252;
    --color-neutral-500: #737373;
    --color-neutral-600: #A3A3A3;
    --color-neutral-700: #D4D4D4;
    --color-neutral-800: #E5E5E5;
    --color-neutral-900: #FAFAFA;

    /* Primary (desaturated) */
    --color-primary-50: #172554;
    --color-primary-100: #1E3A8A;
    --color-primary-200: #1E40AF;
    --color-primary-300: #1D4ED8;
    --color-primary-400: #2563EB;
    --color-primary-500: #3B82F6;
    --color-primary-600: #60A5FA;
    --color-primary-700: #93C5FD;
    --color-primary-800: #BFDBFE;
    --color-primary-900: #DBEAFE;
    --color-primary-950: #EFF6FF;

    /* Semantic (dark) */
    --color-success-bg: #052E16;
    --color-success-border: #166534;
    --color-success-text: #86EFAC;
    --color-success-icon: #4ADE80;
    --color-success-solid: #22C55E;

    --color-warning-bg: #451A03;
    --color-warning-border: #92400E;
    --color-warning-text: #FCD34D;
    --color-warning-icon: #FBBF24;
    --color-warning-solid: #F59E0B;

    --color-error-bg: #450A0A;
    --color-error-border: #991B1B;
    --color-error-text: #FCA5A5;
    --color-error-icon: #F87171;
    --color-error-solid: #EF4444;

    --color-info-bg: #172554;
    --color-info-border: #1E40AF;
    --color-info-text: #93C5FD;
    --color-info-icon: #60A5FA;
    --color-info-solid: #3B82F6;

    /* Surfaces (dark) */
    --color-bg-page: var(--color-neutral-50);
    --color-bg-card: var(--color-neutral-100);
    --color-bg-elevated: var(--color-neutral-200);
    --color-bg-muted: var(--color-neutral-100);
    --color-bg-subtle: var(--color-neutral-200);

    /* Text (dark) */
    --color-text-primary: var(--color-neutral-800);
    --color-text-secondary: var(--color-neutral-500);
    --color-text-tertiary: var(--color-neutral-400);
    --color-text-inverse: var(--color-neutral-50);
    --color-text-link: var(--color-primary-600);
    --color-text-link-hover: var(--color-primary-700);

    /* Borders (dark) */
    --color-border-default: rgba(255, 255, 255, 0.1);
    --color-border-strong: rgba(255, 255, 255, 0.15);
    --color-border-muted: rgba(255, 255, 255, 0.06);
    --color-border-focus: var(--color-primary-500);

    /* Shadows (dark mode: minimal, use surfaces instead) */
    --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.2);
    --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.2);
    --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.3), 0 2px 4px rgba(0, 0, 0, 0.2);
    --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.3), 0 4px 6px rgba(0, 0, 0, 0.2);
    --shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.3), 0 8px 10px rgba(0, 0, 0, 0.15);
    --shadow-2xl: 0 25px 50px rgba(0, 0, 0, 0.5);

    /* Focus (dark) */
    --focus-ring: 0 0 0 2px var(--color-bg-page), 0 0 0 4px var(--color-primary-500);
  }
}

/* ==========================================================================
   MANUAL DARK MODE CLASS (alternative to @media)
   Use .dark on <html> or <body> when you need a toggle instead of OS pref.
   ========================================================================== */

.dark {
  --color-neutral-50: #171717;
  --color-neutral-100: #1C1C1C;
  --color-neutral-200: #262626;
  --color-neutral-300: #333333;
  --color-neutral-400: #525252;
  --color-neutral-500: #737373;
  --color-neutral-600: #A3A3A3;
  --color-neutral-700: #D4D4D4;
  --color-neutral-800: #E5E5E5;
  --color-neutral-900: #FAFAFA;

  --color-primary-50: #172554;
  --color-primary-100: #1E3A8A;
  --color-primary-200: #1E40AF;
  --color-primary-300: #1D4ED8;
  --color-primary-400: #2563EB;
  --color-primary-500: #3B82F6;
  --color-primary-600: #60A5FA;
  --color-primary-700: #93C5FD;
  --color-primary-800: #BFDBFE;
  --color-primary-900: #DBEAFE;
  --color-primary-950: #EFF6FF;

  --color-success-bg: #052E16;
  --color-success-border: #166534;
  --color-success-text: #86EFAC;
  --color-success-icon: #4ADE80;
  --color-success-solid: #22C55E;

  --color-warning-bg: #451A03;
  --color-warning-border: #92400E;
  --color-warning-text: #FCD34D;
  --color-warning-icon: #FBBF24;
  --color-warning-solid: #F59E0B;

  --color-error-bg: #450A0A;
  --color-error-border: #991B1B;
  --color-error-text: #FCA5A5;
  --color-error-icon: #F87171;
  --color-error-solid: #EF4444;

  --color-info-bg: #172554;
  --color-info-border: #1E40AF;
  --color-info-text: #93C5FD;
  --color-info-icon: #60A5FA;
  --color-info-solid: #3B82F6;

  --color-bg-page: var(--color-neutral-50);
  --color-bg-card: var(--color-neutral-100);
  --color-bg-elevated: var(--color-neutral-200);
  --color-bg-muted: var(--color-neutral-100);
  --color-bg-subtle: var(--color-neutral-200);

  --color-text-primary: var(--color-neutral-800);
  --color-text-secondary: var(--color-neutral-500);
  --color-text-tertiary: var(--color-neutral-400);
  --color-text-inverse: var(--color-neutral-50);
  --color-text-link: var(--color-primary-600);
  --color-text-link-hover: var(--color-primary-700);

  --color-border-default: rgba(255, 255, 255, 0.1);
  --color-border-strong: rgba(255, 255, 255, 0.15);
  --color-border-muted: rgba(255, 255, 255, 0.06);
  --color-border-focus: var(--color-primary-500);

  --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.2);
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.2);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.3), 0 2px 4px rgba(0, 0, 0, 0.2);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.3), 0 4px 6px rgba(0, 0, 0, 0.2);
  --shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.3), 0 8px 10px rgba(0, 0, 0, 0.15);
  --shadow-2xl: 0 25px 50px rgba(0, 0, 0, 0.5);

  --focus-ring: 0 0 0 2px var(--color-bg-page), 0 0 0 4px var(--color-primary-500);
}
```
