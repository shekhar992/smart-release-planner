# Visual Polish, Brand Principles, and Craft Reference

Production-ready techniques for interfaces that feel intentional, refined, and
alive. Every technique here is immediately implementable. Copy the CSS, adapt
the values to your design system, and ship.

---

## 1. Brand Principles (Learn, Don't Copy)

Great interfaces share underlying principles. Study the principle, then express
it through YOUR brand's personality. Copying a brand's surface is plagiarism.
Absorbing its discipline is education.

### Restraint Over Decoration (from Linear)

Every element must earn its place. If removing it does not hurt the experience,
remove it.

**Core tenets:**
- Monochrome + one accent color creates sophistication faster than multiple
  colors ever will. Limit your palette and trust the constraint.
- Dense but organized beats sparse and empty. Information density is a feature
  when hierarchy is clear. Users of complex tools want to SEE data, not click
  through pages of whitespace.
- Dark themes feel premium when neutrals are slightly warm (not pure cool gray).
  Compare `#1a1a1a` (warm) to `#1a1a2e` (cool) -- warm feels intentional,
  cool feels generic.
- Keyboard shortcuts and fast interactions signal "this tool respects your
  time." Design for speed. Speed IS the luxury.
- Reduce borders, reduce shadows, reduce color. Then see what is still unclear.
  Add back only what is needed. This is the opposite of decoration -- it is
  discipline.

### Clarity Through Hierarchy (from Stripe)

One hero element per view. If everything is emphasized, nothing is.

**Core tenets:**
- Visual storytelling: animations and gradients convey "premium" WHEN they
  serve the brand narrative. Gratuitous animation is worse than none.
- Complex products need exceptionally clear navigation. The more powerful the
  tool, the simpler the wayfinding must be.
- Typography does 80% of the work. Get the type scale right and the design
  follows. Get it wrong and no amount of color or imagery saves it.
- Whitespace is not empty space -- it is the frame. Stripe uses generous
  whitespace to make dense financial content feel approachable.
- Color as a SYSTEM, not decoration. Every hue carries semantic meaning. Blues
  for navigation, greens for success, never arbitrary.

### Functional Minimalism (from Vercel/Geist)

Build for power users by removing friction, not features.

**Core tenets:**
- Monospace type in context signals precision and credibility. Use it for code,
  data, and technical values -- never for marketing copy.
- High contrast (black on white) with minimal color is a deliberate choice, not
  laziness. It removes subjective aesthetic decisions and foregrounds content.
- Speed is a design principle. If a page loads in 200ms it FEELS more
  trustworthy than the same content at 2 seconds. Performance is UX.
- System fonts load instantly and match platform expectations. Custom fonts are
  a trade-off, not a default.
- Every click that can be eliminated should be. Every page load that can be
  avoided should be. Friction is the enemy.

### Platform Craft (from Apple HIG)

Respect platform conventions. iOS users expect iOS patterns. Android users
expect Material patterns. Web users expect web patterns.

**Core tenets:**
- Consistent spacing rhythm creates unconscious trust. When the rhythm breaks,
  users feel something is wrong even if they cannot articulate what.
- Typography and whitespace create luxury without imagery. Apple proves that
  type at the right size with the right weight needs nothing else.
- Transitions mirror real-world physics: weight, momentum, spring. Elements
  do not teleport. They move with intention and settle with weight.
- Details compound. One perfect transition is forgettable. A hundred perfect
  transitions feel like quality.
- Native affordances (haptics, safe areas, dynamic type) are not optional --
  they are respect for the user's platform choice.

### The Anti-Pattern: Copying Brands

CRITICAL: Never replicate a brand's visual identity. This is the difference
between a designer who studies and one who traces.

**The extraction process:**
1. Identify the PRINCIPLE (density, clarity, speed, craft)
2. Strip away the brand's specific expression (their colors, their type, their
   specific radius values, their specific shadow style)
3. Re-express the principle through YOUR brand's color, type, and personality

**Translation examples:**

| Source Principle | New Context | Result |
|---|---|---|
| Linear's density | Children's education app | Organized play: dense grid of colorful activity cards with clear categories, playful icons, rounded corners |
| Stripe's clarity | Local bakery website | Warm but clean: generous whitespace, warm serif headings, one CTA per section, earthy palette |
| Vercel's minimalism | Fitness tracking app | Bold and focused: black/white base, one neon accent for active metrics, monospace for numbers, zero decoration |
| Apple's craft | Enterprise dashboard | Refined and reliable: consistent 8pt spacing, subtle animations on data updates, system font stack, muted palette with one data-highlight color |

The principle transfers. The surface never should.

---

## 2. Visual Polish Techniques

These are the details that separate professional interfaces from amateur ones.
Each technique includes production-ready CSS.

### Subtle Background Textures

Plain flat backgrounds can feel sterile. A barely-visible texture adds warmth
and physicality without competing with content.

```css
/* Noise texture overlay -- adds subtle grain to flat backgrounds.
   Use on hero sections, cards, or page backgrounds.
   The noise should be nearly invisible -- if you can clearly see it,
   the opacity is too high. */
.surface-with-texture {
  position: relative;
  background-color: var(--surface);
}
.surface-with-texture::after {
  content: "";
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  opacity: 0.03;
  pointer-events: none;
  z-index: 1;
}

/* Subtle gradient background -- adds depth to large surfaces.
   Works well on landing pages and hero sections.
   The gradient should feel like natural light, not a design choice. */
.surface-with-gradient {
  background:
    radial-gradient(
      ellipse 80% 50% at 50% -20%,
      rgba(120, 119, 198, 0.08),
      transparent
    ),
    var(--surface);
}
```

**When to use:** Hero sections, page backgrounds, card surfaces that feel too
flat. When NOT to use: small components, text-heavy areas, anywhere the texture
competes with content.

### Border Light Effect (Dark Themes)

In dark mode, subtle borders create the illusion of light catching an edge.
This single technique makes dark UIs feel three-dimensional.

```css
/* 1px border that catches light on dark surfaces.
   This is the single most impactful dark mode polish technique. */
.card-dark {
  background: var(--surface-elevated);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
}

/* Stronger variant for interactive elements */
.card-dark-interactive:hover {
  border-color: rgba(255, 255, 255, 0.1);
}

/* Top-only highlight for a pressed/embossed look */
.card-dark-top-lit {
  background: var(--surface-elevated);
  border: 1px solid transparent;
  border-top-color: rgba(255, 255, 255, 0.08);
  border-radius: 12px;
}
```

### Gradient Text for Hero Sections

Use sparingly. This is for hero headings and display text only -- never body
copy, never interactive elements, never more than one instance per viewport.

```css
/* Gradient text using background-clip.
   IMPORTANT: -webkit-background-clip is still needed for Safari. */
.gradient-text {
  background: linear-gradient(
    135deg,
    var(--text-primary) 0%,
    var(--accent) 50%,
    var(--text-primary) 100%
  );
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent; /* Fallback */
}

/* Animated gradient variant (use VERY sparingly) */
.gradient-text-animated {
  background: linear-gradient(
    270deg,
    var(--text-primary),
    var(--accent),
    var(--text-primary)
  );
  background-size: 200% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: gradient-shift 8s ease infinite;
}

@keyframes gradient-shift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}
```

### Staggered Animations

Multiple elements appearing simultaneously feels robotic. A stagger of
50-80ms between items feels natural and guided.

```css
/* Stagger entrance of multiple elements using animation-delay.
   The --stagger-index custom property controls per-item delay. */
.stagger-item {
  opacity: 0;
  transform: translateY(8px);
  animation: stagger-in 0.4s var(--ease-out) forwards;
  animation-delay: calc(var(--stagger-index, 0) * 60ms);
}

@keyframes stagger-in {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Usage in HTML:
   <div class="stagger-item" style="--stagger-index: 0">First</div>
   <div class="stagger-item" style="--stagger-index: 1">Second</div>
   <div class="stagger-item" style="--stagger-index: 2">Third</div>
*/

/* JavaScript-free alternative using nth-child */
.stagger-group > * {
  opacity: 0;
  transform: translateY(8px);
  animation: stagger-in 0.4s var(--ease-out) forwards;
}
.stagger-group > *:nth-child(1) { animation-delay: 0ms; }
.stagger-group > *:nth-child(2) { animation-delay: 60ms; }
.stagger-group > *:nth-child(3) { animation-delay: 120ms; }
.stagger-group > *:nth-child(4) { animation-delay: 180ms; }
.stagger-group > *:nth-child(5) { animation-delay: 240ms; }
.stagger-group > *:nth-child(6) { animation-delay: 300ms; }
```

### Colored Shadows

Gray shadows are technically correct but feel artificial. Tinting a shadow
with the element's background color makes it feel like the element is casting
light onto the surface below -- the way real objects do.

```css
/* Shadow tinted with the element's background color.
   This feels more natural because real-world shadows pick up
   color from the surfaces they pass through. */
.card-blue {
  background: #3b82f6;
  box-shadow:
    0 1px 2px rgba(59, 130, 246, 0.1),
    0 4px 12px rgba(59, 130, 246, 0.15);
}

.card-purple {
  background: #8b5cf6;
  box-shadow:
    0 1px 2px rgba(139, 92, 246, 0.1),
    0 4px 12px rgba(139, 92, 246, 0.15);
}

/* Generic version using CSS custom properties */
.card-colored-shadow {
  --shadow-color: var(--card-bg, #6366f1);
  box-shadow:
    0 1px 2px color-mix(in srgb, var(--shadow-color) 10%, transparent),
    0 4px 12px color-mix(in srgb, var(--shadow-color) 15%, transparent);
}
```

### Inner Shadows for Inputs

Inset shadows create a recessed, tactile feel that makes inputs feel like
physical fields you type INTO, rather than flat rectangles.

```css
/* Inset shadow for recessed feel on inputs */
.input-recessed {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.06);
  padding: 8px 12px;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.input-recessed:focus {
  border-color: var(--accent);
  box-shadow:
    inset 0 1px 2px rgba(0, 0, 0, 0.06),
    0 0 0 3px rgba(99, 102, 241, 0.15);
  outline: none;
}

/* Dark mode variant */
[data-theme="dark"] .input-recessed {
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.3);
}
```

### Micro-Gradients on Buttons

A barely-visible gradient from top to bottom gives buttons the illusion of
dimension -- as if light is hitting the top surface. This is the difference
between a button that feels clickable and one that feels like a colored
rectangle.

```css
/* Subtle top-to-bottom gradient for dimension.
   The gradient should be nearly imperceptible -- 2-4% lighter at top. */
.btn-primary {
  background: linear-gradient(
    to bottom,
    color-mix(in srgb, var(--accent) 92%, white),
    var(--accent)
  );
  color: white;
  border: none;
  border-radius: 8px;
  padding: 10px 20px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s var(--ease-out);
}

.btn-primary:hover {
  background: linear-gradient(
    to bottom,
    color-mix(in srgb, var(--accent) 85%, white),
    color-mix(in srgb, var(--accent) 95%, white)
  );
  box-shadow: 0 2px 8px color-mix(in srgb, var(--accent) 25%, transparent);
}

.btn-primary:active {
  background: linear-gradient(
    to bottom,
    var(--accent),
    color-mix(in srgb, var(--accent) 92%, black)
  );
  transform: translateY(0);
  box-shadow: none;
}
```

### Backdrop Blur Navigation

A sticky navigation bar with blur and transparency lets content scroll behind
it, maintaining context while keeping the nav always accessible.

```css
/* Sticky nav with blur and transparency */
.nav-blur {
  position: sticky;
  top: 0;
  z-index: 40;
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(12px) saturate(180%);
  -webkit-backdrop-filter: blur(12px) saturate(180%);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

/* Dark mode variant */
[data-theme="dark"] .nav-blur {
  background: rgba(17, 17, 17, 0.72);
  border-bottom-color: rgba(255, 255, 255, 0.06);
}
```

### Glass Morphism (When Appropriate)

Frosted glass works when there is meaningful content BEHIND the glass element.
It fails on solid backgrounds (you are blurring nothing) and on busy
backgrounds (the content becomes unreadable noise).

```css
/* Frosted glass effect */
.glass {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(16px) saturate(150%);
  -webkit-backdrop-filter: blur(16px) saturate(150%);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
}
```

**When it works:** Overlays on hero images, floating toolbars over content,
notification panels over dashboards, music player over album art.

**When it fails:** Cards on solid backgrounds (blur has no effect), dense text
content (readability suffers), small components (effect is too subtle to
notice), when used on every surface (it loses meaning).

### Smooth Focus Rings

Default browser focus rings are ugly but ESSENTIAL for accessibility. Replace
them with something that looks intentional while remaining clearly visible.

```css
/* Modern focus indicator that looks designed, not accidental.
   CRITICAL: never remove focus indicators. Style them. */
.focus-ring:focus-visible {
  outline: none;
  box-shadow:
    0 0 0 2px var(--surface),
    0 0 0 4px var(--accent);
  border-radius: inherit;
}

/* Alternative: offset outline (works on any shape) */
.focus-ring-outline:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

/* Dark mode: ensure ring is visible against dark surfaces */
[data-theme="dark"] .focus-ring:focus-visible {
  box-shadow:
    0 0 0 2px var(--surface-elevated),
    0 0 0 4px var(--accent-light);
}
```

### Selection Colors

Custom text selection colors are a micro-detail that signals craft. Match
your selection color to your brand accent.

```css
/* Custom text selection colors */
::selection {
  background: color-mix(in srgb, var(--accent) 25%, transparent);
  color: var(--text-primary);
}

::-moz-selection {
  background: color-mix(in srgb, var(--accent) 25%, transparent);
  color: var(--text-primary);
}
```

### Scroll Shadows (Content Overflow Indicators)

When content is scrollable, users need a visual cue. Scroll shadows at the
edges indicate "there is more content in this direction."

```css
/* Shadow that indicates scrollable content using
   background-attachment: local to move with content. */
.scroll-shadow-y {
  overflow-y: auto;
  background:
    /* Top shadow (visible when scrolled down) */
    linear-gradient(to bottom, var(--surface) 30%, transparent) center top,
    /* Bottom shadow (visible when more content below) */
    linear-gradient(to top, var(--surface) 30%, transparent) center bottom,
    /* Top shadow cover */
    radial-gradient(
      farthest-side at 50% 0,
      rgba(0, 0, 0, 0.08),
      transparent
    ) center top,
    /* Bottom shadow cover */
    radial-gradient(
      farthest-side at 50% 100%,
      rgba(0, 0, 0, 0.08),
      transparent
    ) center bottom;
  background-repeat: no-repeat;
  background-size: 100% 40px, 100% 40px, 100% 12px, 100% 12px;
  background-attachment: local, local, scroll, scroll;
}

/* Horizontal scroll variant */
.scroll-shadow-x {
  overflow-x: auto;
  background:
    linear-gradient(to right, var(--surface) 30%, transparent) left center,
    linear-gradient(to left, var(--surface) 30%, transparent) right center,
    radial-gradient(
      farthest-side at 0 50%,
      rgba(0, 0, 0, 0.08),
      transparent
    ) left center,
    radial-gradient(
      farthest-side at 100% 50%,
      rgba(0, 0, 0, 0.08),
      transparent
    ) right center;
  background-repeat: no-repeat;
  background-size: 40px 100%, 40px 100%, 12px 100%, 12px 100%;
  background-attachment: local, local, scroll, scroll;
}
```

---

## 3. Dark Mode Deep Dive

Dark mode is not a color inversion. It is a complete redesign of your light
and shadow system, color relationships, and contrast strategy.

### The Palette Shift

Do not invert. Redesign. In light mode, depth comes from shadows cast
downward. In dark mode, depth comes from surface lightness -- closer surfaces
are lighter.

**Background hierarchy (darkest back, lighter forward):**

| Layer | Role | Hex | Usage |
|---|---|---|---|
| Base | App background | `#0a0a0a` | Page canvas |
| Surface | Cards, panels | `#141414` | Primary containers |
| Elevated | Popovers, dropdowns | `#1c1c1c` | Floating elements |
| Overlay | Modals, dialogs | `#242424` | Top-level overlays |
| Highlight | Hover states | `#2a2a2a` | Interactive feedback |

**Neutral text scale for dark mode:**

| Token | Hex | Usage |
|---|---|---|
| `--text-primary` | `#f0f0f0` | Headlines, primary labels |
| `--text-secondary` | `#a0a0a0` | Body text, descriptions |
| `--text-tertiary` | `#6b6b6b` | Captions, timestamps |
| `--text-disabled` | `#454545` | Disabled labels |

Never use pure `#ffffff` for text on dark backgrounds. It creates excessive
contrast that causes eye strain. `#f0f0f0` or `#e8e8e8` is the maximum.

### Desaturation

Saturated colors vibrate against dark backgrounds because there is no bright
surrounding context to balance the intensity. The same `#3b82f6` blue that
looks clean on white looks electric and harsh on `#0a0a0a`.

**How much to desaturate:** reduce saturation by 10-20% and increase
lightness by 5-10%.

| Color | Light Mode | Dark Mode | Adjustment |
|---|---|---|---|
| Primary blue | `#3b82f6` | `#60a5fa` | +15% lightness, -10% saturation |
| Success green | `#22c55e` | `#4ade80` | +12% lightness, -8% saturation |
| Error red | `#ef4444` | `#f87171` | +10% lightness, -12% saturation |
| Warning amber | `#f59e0b` | `#fbbf24` | +8% lightness, -5% saturation |

Test by squinting at your screen. If any color "buzzes" or feels like it is
vibrating, it needs more desaturation.

### Elevation Without Shadows

In dark mode, shadows are nearly invisible against dark backgrounds. Instead,
use surface lightness to communicate elevation. Each layer is slightly lighter
than the one behind it.

**Surface elevation scale:**

| Level | Hex | Use Case |
|---|---|---|
| Level 0 (base) | `#0a0a0a` | Page background |
| Level 1 | `#141414` | Cards, sidebars |
| Level 2 | `#1c1c1c` | Raised cards, popovers |
| Level 3 | `#242424` | Modals, command palette |
| Level 4 | `#2c2c2c` | Tooltips, nested overlays |

The difference between levels should be subtle but perceptible: roughly
`+6` to `+10` in each RGB channel per level.

### Borders in Dark Mode

Solid colored borders look harsh in dark mode. Semi-transparent white borders
adapt to any background surface and create the light-catching edge effect.

```css
:root[data-theme="dark"] {
  --border-subtle:    rgba(255, 255, 255, 0.06); /* Dividers, separators */
  --border-default:   rgba(255, 255, 255, 0.10); /* Cards, inputs */
  --border-prominent: rgba(255, 255, 255, 0.15); /* Active states, focus */
  --border-strong:    rgba(255, 255, 255, 0.20); /* High-emphasis borders */
}
```

This approach works because the white at low opacity picks up the underlying
surface color, creating borders that feel native to each surface level.

### Testing Dark Mode

Dark mode must be tested in its actual usage context.

**Testing checklist:**
1. Test at night in a dim room -- that is when dark mode actually matters and
   when contrast problems become painful
2. Check contrast on ALL text levels (primary, secondary, tertiary, disabled)
   against ALL surface levels they might appear on
3. Verify shadows and borders are visible -- many are invisible on dark
   backgrounds
4. Ensure focus indicators are clearly visible (they often disappear)
5. Test with images and avatars -- photographs with dark edges bleed into dark
   backgrounds; add a subtle border or surface behind them
6. Test with user-generated content -- light-colored images and screenshots
   can be blinding on dark backgrounds
7. Verify that status colors (success, error, warning) are distinguishable
   from each other and from the background

### CSS Dark Mode Implementation

```css
/* Method 1: Using prefers-color-scheme (system preference) */
@media (prefers-color-scheme: dark) {
  :root {
    --surface: #0a0a0a;
    --surface-elevated: #141414;
    --text-primary: #f0f0f0;
    --text-secondary: #a0a0a0;
    --border: rgba(255, 255, 255, 0.1);
    --accent: #60a5fa;
  }
}

/* Method 2: Using data attribute toggle (user preference override) */
:root[data-theme="dark"] {
  --surface: #0a0a0a;
  --surface-elevated: #141414;
  --text-primary: #f0f0f0;
  --text-secondary: #a0a0a0;
  --border: rgba(255, 255, 255, 0.1);
  --accent: #60a5fa;
}

/* Method 3: Combined -- respect system, allow override */
:root {
  color-scheme: light dark;
  --surface: #ffffff;
  --text-primary: #111111;
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --surface: #0a0a0a;
    --text-primary: #f0f0f0;
  }
}

:root[data-theme="dark"] {
  --surface: #0a0a0a;
  --text-primary: #f0f0f0;
}

/* Transition between modes (apply to body or root) */
body {
  background-color: var(--surface);
  color: var(--text-primary);
  transition:
    background-color 0.3s ease,
    color 0.3s ease;
}

/* IMPORTANT: Disable transition on initial load to prevent flash.
   Add a class to body after first paint. */
body:not(.theme-ready) * {
  transition: none !important;
}
```

---

## 4. Motion Implementation

Motion communicates relationships, provides feedback, and guides attention.
Every animation must have a purpose. Decorative motion is noise.

### Easing Functions

```css
:root {
  /* Standard easings */
  --ease-out:    cubic-bezier(0.0, 0.0, 0.2, 1.0);   /* Entering elements */
  --ease-in:     cubic-bezier(0.4, 0.0, 1.0, 1.0);   /* Exiting elements */
  --ease-in-out: cubic-bezier(0.4, 0.0, 0.2, 1.0);   /* Repositioning */

  /* Expressive easings */
  --spring:      cubic-bezier(0.34, 1.56, 0.64, 1.0); /* Playful overshoot */
  --snap:        cubic-bezier(0.2, 1.4, 0.4, 1.0);    /* Quick snap */
  --gentle:      cubic-bezier(0.25, 0.1, 0.25, 1.0);  /* Subtle, smooth */

  /* Duration scale */
  --duration-instant:  100ms; /* Hover, active states */
  --duration-fast:     150ms; /* Toggles, small changes */
  --duration-normal:   250ms; /* Most transitions */
  --duration-slow:     400ms; /* Modals, large panels */
  --duration-slower:   600ms; /* Page-level transitions */
}
```

**When to use each easing:**
- `ease-out`: elements entering view (fast start, gentle landing)
- `ease-in`: elements leaving view (slow start, fast exit -- gets out of the way)
- `ease-in-out`: elements repositioning within view (smooth throughout)
- `spring`: playful interfaces, toggle switches, bouncy confirms
- `snap`: command palettes, quick actions, menus
- NEVER `linear` except for progress bars and loading spinners

### Skeleton Screen Animation

```css
/* Shimmer effect for loading placeholders.
   The gradient sweeps left to right to indicate loading activity. */
.skeleton {
  background: linear-gradient(
    90deg,
    var(--surface-elevated) 25%,
    color-mix(in srgb, var(--surface-elevated) 80%, white) 50%,
    var(--surface-elevated) 75%
  );
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s ease-in-out infinite;
  border-radius: 6px;
}

@keyframes skeleton-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* Usage: <div class="skeleton" style="width: 200px; height: 20px;"></div> */
```

### Fade-Up Entrance

```css
/* Content appearing with upward motion.
   The translateY distance should be small (8-16px).
   Large distances feel sluggish. */
.fade-up {
  opacity: 0;
  transform: translateY(12px);
  animation: fade-up 0.4s var(--ease-out) forwards;
}

@keyframes fade-up {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Variant: fade-down for dropdown menus */
.fade-down {
  opacity: 0;
  transform: translateY(-8px);
  animation: fade-down 0.2s var(--ease-out) forwards;
}

@keyframes fade-down {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### Button Interaction

```css
/* Hover lift + active press.
   The hover lifts the button slightly; the press pushes it back down.
   This creates a physical, tactile feel. */
.btn-interactive {
  transition:
    transform var(--duration-instant) var(--ease-out),
    box-shadow var(--duration-instant) var(--ease-out);
}

.btn-interactive:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.btn-interactive:active {
  transform: translateY(0px);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  transition-duration: 50ms;
}
```

### Modal Enter/Exit

```css
/* Scale + fade entrance, fade exit.
   Modals should feel like they emerge from the center,
   not slide in from an edge. */
.modal-overlay {
  opacity: 0;
  transition: opacity var(--duration-normal) var(--ease-out);
}
.modal-overlay.open {
  opacity: 1;
}

.modal-content {
  opacity: 0;
  transform: scale(0.95) translateY(8px);
  transition:
    opacity var(--duration-normal) var(--ease-out),
    transform var(--duration-normal) var(--ease-out);
}
.modal-content.open {
  opacity: 1;
  transform: scale(1) translateY(0);
}

/* Exit animation: faster, no scale change */
.modal-overlay.closing {
  opacity: 0;
  transition-timing-function: var(--ease-in);
  transition-duration: var(--duration-fast);
}
.modal-content.closing {
  opacity: 0;
  transform: translateY(4px);
  transition-timing-function: var(--ease-in);
  transition-duration: var(--duration-fast);
}
```

### Reduced Motion (REQUIRED)

This is not optional. Respect the user's system preference. Users who enable
reduced motion may have vestibular disorders where motion causes nausea,
dizziness, or seizures.

```css
/* Reduced motion: remove ALL non-essential animation.
   Keep opacity transitions (they convey state without motion).
   Remove all transforms, position changes, and decorative animation. */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }

  /* Preserve opacity-only transitions for state feedback */
  .fade-up,
  .fade-down,
  .stagger-item {
    opacity: 1;
    transform: none;
    animation: none;
  }

  /* Skeleton loading is functional, keep it but simplify */
  .skeleton {
    animation: skeleton-pulse 2s ease-in-out infinite;
  }

  @keyframes skeleton-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
}
```

### Performant Animation Rules

These are hard rules, not suggestions:

**ONLY animate these properties** (GPU-accelerated, no layout recalculation):
- `transform` (translate, scale, rotate)
- `opacity`
- `filter` (blur, brightness)

**NEVER animate these properties** (trigger layout reflow, cause jank):
- `width`, `height`
- `top`, `left`, `right`, `bottom`
- `margin`, `padding`
- `border-width`
- `font-size`

**`will-change` usage:**
- Apply only to elements you KNOW will animate
- Apply just before the animation starts, remove after
- Never apply to more than a handful of elements
- Never use `will-change: auto` as a catch-all
- Overuse creates MORE performance problems (each `will-change` element gets
  its own compositor layer, consuming GPU memory)

---

## 5. Responsive Design Patterns

### Container Widths

| Token | Max Width | Use For |
|---|---|---|
| `sm` | `640px` | Focused content: auth forms, settings panels |
| `md` | `768px` | Articles, blog posts, documentation |
| `lg` | `1024px` | Dashboards, multi-column layouts |
| `xl` | `1280px` | Complex apps, data-heavy views |
| `2xl` | `1536px` | Full-width dashboards, admin panels |

```css
.container       { width: 100%; margin-inline: auto; padding-inline: 16px; }
.container-sm    { max-width: 640px; }
.container-md    { max-width: 768px; }
.container-lg    { max-width: 1024px; }
.container-xl    { max-width: 1280px; }
.container-2xl   { max-width: 1536px; }

@media (min-width: 640px) {
  .container { padding-inline: 24px; }
}
@media (min-width: 1024px) {
  .container { padding-inline: 32px; }
}
```

### Breakpoints

| Name | Width | Target |
|---|---|---|
| `sm` | `640px` | Large phones, small tablets |
| `md` | `768px` | Tablets portrait |
| `lg` | `1024px` | Tablets landscape, small laptops |
| `xl` | `1280px` | Laptops, desktops |
| `2xl` | `1536px` | Large desktops, ultrawide |

### Responsive Behavior by Size

**Mobile (< 640px):**
- Single column layout, always
- Bottom navigation (thumb zone)
- Full-width buttons for primary actions
- No hover-dependent interactions (there is no hover on touch)
- Touch targets minimum 44x44px
- Stack horizontal layouts vertically
- Hide secondary information behind expandable sections

**Tablet (640-1024px):**
- Two columns where content supports it
- Adaptive density (somewhere between mobile and desktop)
- Side navigation becomes possible at 768px+
- Cards can sit side-by-side
- Consider both portrait and landscape orientations

**Desktop (> 1024px):**
- Multi-column layouts, sidebar navigation
- Hover states provide previews and secondary info
- Higher information density is expected
- Keyboard shortcuts become primary interaction mode
- Tooltips and contextual menus on hover

### Mobile-Specific Patterns

**Thumb zone:** On phones held one-handed, the bottom 40% of the screen is
the easiest to reach. Place primary actions there.

- Bottom sheets are better than modals (closer to thumb, easier to dismiss)
- Swipe gestures for list item actions (archive, delete, pin)
- Pull-to-refresh for content feeds
- Sticky headers with shadow-on-scroll for context
- Never rely on hover for essential interactions
- Tab bars with 4-5 items maximum

### Touch vs Pointer

```css
/* Pointer device: show hover states and fine interactions */
@media (hover: hover) and (pointer: fine) {
  .card:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }

  .tooltip-trigger:hover .tooltip {
    opacity: 1;
    visibility: visible;
  }
}

/* Touch device: larger targets, no hover dependency */
@media (pointer: coarse) {
  .btn, .link, .interactive {
    min-height: 44px;
    min-width: 44px;
  }

  /* Remove hover-triggered content on touch */
  .tooltip-trigger:hover .tooltip {
    opacity: 0;
    visibility: hidden;
  }
}
```

---

## 6. Icon Consistency Rules

Inconsistent icons are one of the fastest ways to make an interface feel
unprofessional. An icon set is a SYSTEM. Every icon must follow the same rules.

### Requirements for Icon Sets

Before using any icon set, verify these four properties are consistent across
EVERY icon:

1. **Stroke weight:** ALL icons share the same stroke weight. Choose 1.5px
   for refined/minimal or 2px for balanced/friendly. Never mix weights.
2. **Corner radius:** ALL icons share the same corner radius on internal
   shapes. If one icon has rounded joins, all do.
3. **Optical size:** ALL icons are designed for the same base size: 24px for
   standard, 20px for compact, 16px for inline. Do not scale icons designed
   for 24px down to 16px -- they lose clarity.
4. **Style:** ALL icons share the same style. Choose ONE:
   - Outline (stroke only) -- clean, modern, pairs with light typography
   - Solid (filled) -- bold, high-contrast, works well at small sizes
   - Duotone (fill + accent layer) -- decorative, not for functional UI
   - NEVER mix styles in the same context

### Icon Sizing

| Context | Size | Notes |
|---|---|---|
| Inline with body text | 16-18px | Optical alignment with text baseline |
| Inside buttons | 2px less than font size | 14px font = 12-16px icon |
| Navigation items | 20-24px | Consistent across all nav icons |
| List item leading | 20-24px | Align to text first-line baseline |
| Decorative/hero | 32-48px | Can use duotone or filled variants |
| Empty states | 48-64px | Often lighter weight or lower opacity |

**Gap between icon and label:** 6-8px. This is consistent everywhere in your
interface. Do not vary it per component.

### Icon Do-Nots

- Mixing outline and solid icons in the same toolbar, menu, or navigation
- Using icons WITHOUT text labels in primary navigation (icon-only nav requires
  learning -- labels require zero learning)
- Different stroke weights across the icon set (1.5px arrows next to 2px
  checkmarks look broken)
- Scaling icons non-uniformly (stretching icons distorts stroke widths)
- Coloring individual icons different colors in the same set (unless
  intentionally conveying semantic state like red for error)
- Using decorative icons for functional actions (a complex illustration as a
  button icon is confusing)

---

## 7. Dividers vs Spacing

The default should always be whitespace. Dividers are a tool of last resort --
they add visual noise and rarely improve clarity when spacing is correct.

### When to Use Whitespace (Preferred)

- Between related items in the same section (list items, form fields)
- Between cards in a grid or list
- Inside components (between icon and label, between title and description)
- Between sections when headings already create visual separation
- Anywhere the content type does NOT change fundamentally

If you think you need a divider, first try increasing the spacing by 50%. If
that creates sufficient separation, no divider is needed.

### When to Use Dividers

- Between fundamentally different content types (a navigation section above
  a content area -- different purposes require a hard boundary)
- In tables between rows, IF not using zebra striping (use one or the other)
- In navigation between groups (main nav items vs. settings vs. user menu)
- Between a sticky header and scrollable content (a 1px border or shadow
  communicates "this is fixed, that scrolls")
- In dense data views where spacing alone cannot create sufficient separation

### Divider Specifications

```css
/* Light mode dividers */
.divider {
  height: 1px;
  background: rgba(0, 0, 0, 0.06);
  border: none;
  margin: 0;
}

/* Dark mode dividers */
[data-theme="dark"] .divider {
  background: rgba(255, 255, 255, 0.06);
}

/* Full-bleed divider (edge to edge) */
.divider-full {
  margin-inline: 0;
}

/* Inset divider (with padding from edges) */
.divider-inset {
  margin-inline: 16px;
}

/* Inset to match content (e.g., after an icon + label layout) */
.divider-content-inset {
  margin-inline-start: 56px; /* icon width + gap + alignment */
  margin-inline-end: 16px;
}
```

**Divider rules:**
- Height: always 1px. Never thicker unless it is a deliberate section break.
- Color: low opacity. The divider should be the LEAST visible structural
  element on the page. If your eye is drawn to dividers, they are too strong.
- Never use colored dividers unless conveying semantic meaning (a red divider
  separating a danger zone, for example).
- Full-bleed dividers feel more structural. Inset dividers feel more like
  list separators. Choose based on the content relationship.
- Never combine dividers with heavy spacing. A divider WITH 32px of space
  above and below it creates a void. Dividers replace spacing, not supplement it.
  Use 8-16px around a divider, not more.
