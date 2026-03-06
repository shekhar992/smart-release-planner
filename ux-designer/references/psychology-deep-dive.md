# UX Psychology & Motion Design Reference

## 1. Cognitive Load Theory

Working memory holds roughly 4 chunks of information at once (not 7 -- Miller's original number included long-term memory strategies). Every element on screen competes for one of those slots.

### Progressive Disclosure
Reveal complexity only when the user needs it. Show 3-5 primary actions upfront; nest the rest behind "More options", "Advanced", or contextual menus. Each screen should answer one question or complete one task.

### Sensible Defaults
Pre-fill forms with the statistically most common answer. Pre-select the recommended option. Default to the safest or most reversible choice. Users accept defaults 70-90% of the time -- treat defaults as design decisions, not afterthoughts.

### Chunking Rules
- Group related fields in sets of 3-5 items
- Use whitespace or dividers between groups (12-24px gaps)
- Label each group with a clear heading
- Phone numbers, card numbers, dates: break into segments (XXX) XXX-XXXX

### Recognition Over Recall
Show options instead of requiring typed input. Use dropdowns, toggles, and selectable cards over blank text fields. Display recent items, history, and suggestions. Never make users remember something from a previous screen.

### Consistency and Spatial Memory
Users memorize where things are. Keep navigation, CTAs, and key actions in the same position across every screen. Changing the location of a primary button between steps causes 40%+ more errors. Use a consistent component library and never vary interactive patterns without cause.

### Implementation Rules
1. Count the decisions on each screen. If more than 3, split or hide some.
2. Every form field must justify its existence. If you can derive it, calculate it, or default it, do so.
3. Labels go above inputs (not inside as placeholders -- placeholders vanish on focus).
4. Error messages appear next to the field, not in a banner at the top.
5. One primary CTA per screen. Secondary actions use lower visual weight.

---

## 2. Decision Architecture

### Default Bias
Most users accept whatever is pre-selected. Use this responsibly: default to the option that serves the user best, not the one that extracts the most revenue. Pre-check the recommended plan. Pre-fill shipping address from the last order.

### Anchoring
The first number or option a user sees sets their mental baseline. Show the premium tier first so the mid-tier looks reasonable. Display the original price before the sale price. Present the recommended option before alternatives.

### Choice Paralysis
Beyond 5-7 options, decision quality drops and abandonment rises. Mitigations:
- Highlight a recommended option
- Allow filtering and sorting
- Group options into categories (3-4 categories of 3-5 items each)
- Use progressive filtering: broad choice first, then narrow

### Decoy Effect
Adding a slightly worse option near your target option makes the target look better. A $10 small and $25 large sell poorly alone; add a $22 medium and the large looks like a deal. Use only when the "better" option genuinely serves the user.

### Social Proof
- "Most popular" badges increase selection by 15-30%
- "X people chose this today" creates momentum
- Star ratings and review counts near decision points
- Logos of known companies build credibility
- Position social proof adjacent to the CTA, not buried in footers

### Commitment Escalation
Get a small yes before asking for a big yes. Let users try before creating an account. Let them customize before asking for payment. Let them save a draft before requiring a commitment. Each micro-commitment increases the chance of the next one.

### Framing Effects
"95% success rate" outperforms "5% failure rate." "Save $50" outperforms "$50 off." Frame around gains for positive actions and losses for warnings. "You'll lose your progress" is more motivating than "Save your progress."

---

## 3. Attention & Scanning Patterns

### F-Pattern (Text-Heavy Pages)
Users scan horizontally across the top, then down the left side, making shorter horizontal scans. The first two content lines get the most attention. Front-load every paragraph with the key point. The first 3-5 words of every heading carry 80% of the scanning value.

### Z-Pattern (Visual/Marketing Pages)
Eyes move: top-left (logo) -> top-right (nav/CTA) -> diagonal to bottom-left -> across to bottom-right (primary CTA). Place your brand mark top-left, a secondary CTA top-right, supporting content center, and the primary conversion action bottom-right.

### Gutenberg Diagram (Balanced Layouts)
Divides the page into four quadrants. Top-left (primary optical area) and bottom-right (terminal area) get the most attention. Top-right and bottom-left are weak zones. Place critical information and CTAs along the top-left to bottom-right diagonal.

### Practical Rules
- Left-aligned text receives ~30% more fixation time than centered text
- 80% of viewing time is spent above the fold on initial load
- Headings function as landmarks: users jump between them, skipping body text
- Lists outperform paragraphs for scannability by 47%
- Bold key phrases within paragraphs to create scan-stop points
- One idea per paragraph. If a paragraph has two points, split it.

---

## 4. Trust & Credibility

### Visual Professionalism
Users judge credibility within 50ms based on visual design alone. Consistent spacing, professional typography, high-quality images, and polished micro-interactions signal competence. One misaligned element or pixelated image erodes trust disproportionately.

### Transparency
- Show total cost early (no surprise fees at checkout)
- Explain why you need sensitive data ("We need your phone for delivery updates")
- Show clear data usage policies in plain language near collection points
- Display security indicators (lock icons, SSL badges) near payment forms

### Consistency Builds Trust
Every inconsistency (different button styles, conflicting terminology, mismatched colors) creates a micro-doubt. Use one word for one concept throughout. If you say "Cart" on one page, never say "Bag" on another.

### Error Recovery Builds MORE Trust Than No Errors
Users who experience an error and get excellent recovery (clear message, easy fix, no lost data) rate the experience higher than users who never had an error at all. Auto-save everything. Let users undo. Preserve form data on back-navigation. Never show a blank form after a submission error.

### Social Proof Signals
- Customer count: "Trusted by 50,000+ teams"
- Client logos: 4-6 recognizable brands in a row
- Testimonials: real names, photos, specific results
- Third-party badges: security certifications, awards, press logos
- Place these near high-commitment points (pricing pages, checkout, signup)

### Progressive Trust
Ask for an email before asking for a credit card. Show value before requesting personal data. Let users browse before requiring login. Each trust threshold should deliver clear value in return.

### Speed = Trustworthiness
Pages loading in under 2 seconds are perceived as more trustworthy. Every additional second of load time increases bounce rate by ~7%. Skeleton screens and progressive loading make waits feel shorter.

---

## 5. Emotional States & Design Responses

| Emotional State | Design Response | Specific Tactics |
|---|---|---|
| **Anxious** | Reduce options, add reassurance, show progress | Show a progress bar. Use calming language ("You can change this later"). Display security badges. Limit form to essential fields only. Offer live chat. |
| **Frustrated** | Acknowledge the issue, offer escape routes | Say "Sorry, something went wrong" not "Error 500". Provide a clear back/retry button. Offer an alternative path (phone, email, chat). Never dead-end. |
| **Rushed** | Minimize steps, enable shortcuts, autofill | One-click actions. Express checkout. Autofill from saved data. Show estimated time ("Takes ~2 min"). Skip optional steps. |
| **Exploring** | Support browsing, show related content | Robust filtering and sorting. "Related items" and "You might also like." Breadcrumbs for easy backtracking. Save/wishlist/bookmark options. |
| **Committed** | Reduce friction, don't re-ask decisions | Pre-fill confirmed data. Skip confirmation screens for low-risk actions. Use inline editing. Auto-advance after selection. |
| **Confused** | Simplify, add context, show examples | Inline help tooltips. Example inputs inside fields ("e.g., john@email.com"). Contextual FAQ. Visual step indicators. Reduce options to 2-3. |
| **Delighted** | Don't interrupt, reward subtly | Subtle micro-animation on success. Avoid pop-ups during flow states. Let momentum continue. A small confetti animation, not a modal. |

---

## 6. Persuasion Patterns (Use Ethically)

### Core Principles
- **Scarcity**: "3 left in stock" or "Offer ends in 2 days." Only use with real scarcity -- fake urgency destroys trust permanently.
- **Authority**: Expert endorsements, certifications, "As featured in..." badges. Place near decision points.
- **Reciprocity**: Give value first (free tool, free trial, useful content) before asking for something.
- **Loss Aversion**: People feel losses ~2x stronger than gains. "Don't lose your saved items" outperforms "Keep your saved items." Frame cancellation around what they lose.
- **Endowment Effect**: Once users customize or invest time, they value the result more. Let them personalize before requiring commitment.
- **Peak-End Rule**: Users judge an experience by its peak moment and its end. Invest in a delightful success state and a satisfying completion screen.

### Ethical Boundaries
Never fabricate scarcity, reviews, or social proof. Never hide costs or make it harder to cancel than to subscribe. Never use dark patterns (confirmshaming, hidden opt-outs, misdirection). The test: would you be comfortable if the user understood exactly what you were doing? If not, don't do it.

---

## 7. Motion Design Theory

### The 5 Purposes of Motion
Every animation must serve at least one. If it doesn't, remove it.

1. **Orientation** -- Where am I? Where did this come from? (Page transitions, breadcrumb animations, slide-in panels that show spatial origin)
2. **Feedback** -- Did my action work? (Button press states, loading spinners, success checkmarks)
3. **Relationship** -- How are these elements connected? (Shared-element transitions, expand/collapse, parent-child animations)
4. **Focus** -- What should I look at now? (Attention-directing motion, pulsing indicators, scroll-triggered reveals)
5. **Delight** -- A moment of small joy. (Celebration confetti, playful hover states, Easter eggs. Use sparingly -- delight that interrupts becomes annoyance.)

### Timing Reference

| Interaction | Duration | Easing | Notes |
|---|---|---|---|
| Button press / tap | 80-120ms | ease-out | Instant feel. Scale to 0.96-0.98 on press. |
| Toggle switch | 150-200ms | ease-in-out | Slide thumb + color change simultaneously. |
| Tooltip appear | 150-200ms | ease-out | 300-500ms hover delay before triggering. |
| Tooltip dismiss | 100-150ms | ease-in | Faster out than in. |
| Dropdown open | 150-250ms | ease-out | Scale Y from 0.95 + fade. Origin at trigger. |
| Dropdown close | 100-200ms | ease-in | Slightly faster than open. |
| Modal open | 200-300ms | ease-out | Fade overlay 200ms + scale content from 0.95. |
| Modal close | 150-250ms | ease-in | Content fades first, then overlay. |
| Sidebar slide | 250-350ms | ease-out | Transform from off-screen. Lock body scroll. |
| Page transition | 300-500ms | ease-in-out | Cross-fade or shared-element morph. |
| Skeleton to content | 200-400ms | ease-out | Fade-up 8-12px + opacity. |
| Success celebration | 400-800ms | spring | Short and contained. Never block the user. |
| Toast notification | 200-300ms in, 150-200ms out | ease-out / ease-in | Slide + fade. Auto-dismiss 4-6s. |
| Progress bar | continuous | linear | Use linear for determinate progress. |
| Staggered list items | 40-80ms delay per item | ease-out | Cap total at 400-600ms. Max 8-10 items staggered. |
| Hover state | 100-150ms | ease-out | Color/shadow change. No layout shift. |

### Easing Functions

| Name | CSS Value | Use For |
|---|---|---|
| ease-out | `cubic-bezier(0.0, 0.0, 0.2, 1.0)` | Elements entering the screen. Fast start, gentle stop. |
| ease-in | `cubic-bezier(0.4, 0.0, 1.0, 1.0)` | Elements leaving the screen. Gentle start, fast exit. |
| ease-in-out | `cubic-bezier(0.4, 0.0, 0.2, 1.0)` | Repositioning, morphing, layout changes. |
| spring | `cubic-bezier(0.34, 1.56, 0.64, 1.0)` | Playful bounces, success states, toggle snaps. |
| snap | `cubic-bezier(0.2, 0.0, 0.0, 1.0)` | Snappy, decisive interactions. Switch flips, tab changes. |

### Performant CSS Properties
**GPU-accelerated (use these):**
- `transform` (translate, scale, rotate)
- `opacity`
- `filter` (blur, brightness)

**Trigger layout reflow (avoid animating these):**
- `width`, `height`, `top`, `left`, `right`, `bottom`
- `margin`, `padding`, `border-width`
- `font-size`, `line-height`

**Substitutions:**
- Instead of `width/height` -> use `transform: scale()`
- Instead of `top/left` -> use `transform: translate()`
- Instead of `margin` for spacing -> use `transform: translate()` or `gap` in flex/grid
- Instead of `border-width` -> use `box-shadow` or `outline`

### Animation Patterns (CSS)

**Skeleton Screen Shimmer:**
```css
.skeleton {
  background: linear-gradient(90deg, #e0e0e0 25%, #f0f0f0 50%, #e0e0e0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: 4px;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

**Fade-Up Entrance:**
```css
.fade-up {
  opacity: 0;
  transform: translateY(12px);
  animation: fadeUp 400ms cubic-bezier(0.0, 0.0, 0.2, 1.0) forwards;
}

@keyframes fadeUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

**Staggered List Items:**
```css
.stagger-item {
  opacity: 0;
  transform: translateY(8px);
  animation: fadeUp 300ms cubic-bezier(0.0, 0.0, 0.2, 1.0) forwards;
}

.stagger-item:nth-child(1) { animation-delay: 0ms; }
.stagger-item:nth-child(2) { animation-delay: 50ms; }
.stagger-item:nth-child(3) { animation-delay: 100ms; }
.stagger-item:nth-child(4) { animation-delay: 150ms; }
.stagger-item:nth-child(5) { animation-delay: 200ms; }
/* Cap at ~8 items; beyond that, use a batch fade */
```

**Button Press Feedback:**
```css
.btn {
  transition: transform 100ms cubic-bezier(0.0, 0.0, 0.2, 1.0),
              box-shadow 100ms cubic-bezier(0.0, 0.0, 0.2, 1.0);
}

.btn:active {
  transform: scale(0.97);
  box-shadow: none;
}
```

**Reduced Motion Support (REQUIRED):**
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```
Always include this. It is not optional. Roughly 30% of users on iOS have reduced motion enabled. Provide instantaneous state changes (opacity snaps are acceptable) instead of animated transitions for these users.

**Dark Mode Transition:**
```css
:root {
  --bg: #ffffff;
  --text: #111111;
  --surface: #f5f5f5;
}

[data-theme="dark"] {
  --bg: #111111;
  --text: #f0f0f0;
  --surface: #1e1e1e;
}

body {
  background-color: var(--bg);
  color: var(--text);
  transition: background-color 300ms cubic-bezier(0.4, 0.0, 0.2, 1.0),
              color 300ms cubic-bezier(0.4, 0.0, 0.2, 1.0);
}
```

---

## 8. Accessibility Quick Reference

### WCAG AA Requirements
- **Color contrast**: 4.5:1 for normal text, 3:1 for large text (18px+ bold or 24px+ regular), 3:1 for UI components and graphical objects.
- **Touch targets**: Minimum 44x44px (WCAG), 48x48dp (Material). Include padding in the tap area even if the visual element is smaller.
- **Focus indicators**: Visible focus ring on all interactive elements. Minimum 2px solid outline with 3:1 contrast against adjacent colors. Never `outline: none` without a visible replacement.
- **Text resizing**: Content must remain usable at 200% zoom. Use `rem`/`em` units, not `px` for font sizes.

### Keyboard Navigation
- All interactive elements reachable via Tab key
- Logical tab order matching visual layout (use `tabindex="0"` to add, avoid positive values)
- Escape closes modals, popovers, and dropdowns
- Enter/Space activates buttons and links
- Arrow keys navigate within components (tabs, menus, radio groups)
- Focus trap inside modals (Tab cycles within, does not escape behind)
- Skip-to-content link as the first focusable element on every page

### Screen Reader Patterns
- Use semantic HTML first: `<nav>`, `<main>`, `<header>`, `<footer>`, `<section>`, `<article>`, `<button>`, `<a>`
- `aria-label` for icon-only buttons: `<button aria-label="Close dialog">`
- `aria-live="polite"` for status updates (toast notifications, form validation results)
- `aria-live="assertive"` for urgent alerts only (errors that block progress)
- `aria-expanded="true/false"` on toggles that show/hide content
- `aria-hidden="true"` on decorative icons and images
- `role="alert"` for error messages that appear dynamically
- Never rely on color alone to convey information. Add icons, text, or patterns.

### Color & Contrast Tools
- WebAIM Contrast Checker (webaim.org/resources/contrastchecker)
- Chrome DevTools > Rendering > Emulate vision deficiencies
- Stark plugin for Figma
- axe DevTools browser extension for automated audits

---

## 9. Responsive Design Principles

### Breakpoint Strategy (Mobile First)
Design for the smallest screen first, then enhance. Standard breakpoints:

| Name | Min-Width | Typical Devices |
|---|---|---|
| xs (base) | 0 | Small phones |
| sm | 640px | Large phones, small tablets |
| md | 768px | Tablets portrait |
| lg | 1024px | Tablets landscape, small laptops |
| xl | 1280px | Desktops |
| 2xl | 1536px | Large desktops |

Write CSS mobile-first: base styles apply to all, then `@media (min-width: 768px)` adds complexity. Never hide critical content on mobile -- restructure or reflow instead.

### Touch vs. Pointer
- **Touch targets**: 48x48dp minimum with 8dp spacing between targets
- **Hover states**: Never put essential information behind hover (touch devices have no hover). Hover is an enhancement, not a requirement.
- **Swipe and gestures**: Always provide a visible button alternative. Gesture-only interactions are invisible and undiscoverable.
- **Input modes**: Use `inputmode="numeric"` for number fields, `inputmode="email"` for email, `inputmode="tel"` for phone. This controls the virtual keyboard.

### Mobile-Specific Patterns
- **Thumb zone**: Primary actions in the bottom 1/3 of the screen. Navigation bars at the bottom outperform top navigation on mobile for reachability.
- **Bottom sheet**: Preferred over modals on mobile. Users can swipe to dismiss. Content peeks from below.
- **Pull-to-refresh**: Use only on scrollable lists. Show a clear loading indicator. Threshold of ~60px pull distance before triggering.
- **Sticky headers**: Keep navigation and context visible on scroll, but limit to 48-56px height so they don't consume too much viewport.
- **Bottom navigation**: 3-5 items maximum. Use icons with labels. Highlight the active state. Never use hamburger menus for primary navigation on mobile.
- **Card-based layouts**: Stack vertically on mobile, grid on tablet/desktop. Cards should be full-width on screens below 640px.
- **Form optimization**: One column on mobile. Large input fields (48px height minimum). Auto-advance between fields where appropriate (verification codes). Show/hide password toggle.
