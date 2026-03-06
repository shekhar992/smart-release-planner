# UI Component Library Reference

Production-ready specifications for every core component. All values are absolute and final. When designing, follow these specifications exactly unless a project-level override is documented.

---

## 1. Buttons

Buttons are the primary interactive elements. Consistent sizing, clear hierarchy, and complete state coverage are non-negotiable.

### 1.1 Sizing

| Size | Height | H Padding | V Padding | Font Size | Icon Size | Min Width | Border Radius |
|------|--------|-----------|-----------|-----------|-----------|-----------|---------------|
| xs   | 28px   | 8px       | 4px       | 12px      | 14px      | 56px      | 4px           |
| sm   | 32px   | 12px      | 6px       | 13px      | 16px      | 64px      | 6px           |
| md   | 36px   | 16px      | 8px       | 14px      | 18px      | 80px      | 6px           |
| lg   | 40px   | 20px      | 10px      | 15px      | 20px      | 96px      | 8px           |
| xl   | 48px   | 24px      | 12px      | 16px      | 22px      | 112px     | 8px           |

The `md` size is the default. Use `sm` in dense UI (tables, toolbars). Use `lg` or `xl` for hero CTAs and mobile touch targets. Never use `xs` for primary actions.

### 1.2 Hierarchy

Buttons follow a strict priority system. Breaking hierarchy causes decision paralysis.

1. **Primary** -- Solid fill with high-contrast text. One per section or viewport. Represents the single most important action (Save, Submit, Continue). Background uses the brand primary color at full opacity. Text is white or the highest-contrast token.
2. **Secondary** -- Outline border (1px solid) with transparent or subtle tinted background. Supports the primary action. Used for Cancel alongside Save, or alternative paths. Border color matches primary color at 40-60% opacity. Text matches the border color.
3. **Tertiary / Ghost** -- No border, no background in default state. Text-only appearance using the primary or neutral text color. Used for low-priority actions: Learn More, Skip, collapse/expand. Background appears only on hover (neutral at 6-10% opacity).
4. **Destructive** -- Red variant reserved exclusively for delete, remove, revoke, or other irreversible actions. Solid red fill for primary destructive. Red outline for secondary destructive. Never place a destructive button adjacent to a primary action without visual separation.

### 1.3 States

Every button must implement all six states. Omitting any state is a shipping blocker.

| State          | Visual Treatment                                                                 |
|----------------|----------------------------------------------------------------------------------|
| Default        | Base appearance as defined by hierarchy level. Full opacity. Cursor: pointer.    |
| Hover          | Background lightens 8-12% (light theme) or lightens 6-10% (dark theme). Transition: 150ms ease. |
| Active/Pressed | Background darkens 6-10% from default. Scale: 0.98. Transition: 50ms ease-in.   |
| Focus          | 2px solid ring offset 2px from the button edge. Ring color: primary at 50% opacity. Ring must pass 3:1 contrast against the background. Never remove focus styles. |
| Disabled       | Opacity: 0.4. Cursor: not-allowed. No hover/active response. Preserve layout dimensions. Tooltip explaining why disabled is recommended. |
| Loading        | Replace label with a 16-20px spinner centered in the button. Maintain button width to prevent layout shift. Disable pointer events. Spinner color matches the text color of that button variant. |

### 1.4 Icon Placement

- **Leading icon (left of label):** Gap between icon and label is 6px (xs/sm) or 8px (md/lg/xl). Use for semantic meaning: search icon on a Search button, plus icon on Add Item, download icon on Export.
- **Trailing icon (right of label):** Same gap values. Use to indicate behavior: chevron-right for forward navigation, external-link for new tab, chevron-down for dropdown.
- **Icon-only button:** Must include `aria-label` describing the action. Must show a tooltip on hover with 300ms delay. Use a square aspect ratio (height equals width). Common uses: close, menu, settings, overflow.

### 1.5 Button Groups and Spacing

- Related buttons (Save + Cancel): 8px gap between them.
- Unrelated buttons (Export alongside Delete): 16px gap or a visual divider.
- Destructive actions: Place on the opposite side of the row from safe actions. In a modal footer, Cancel goes left, destructive goes far right with 16px minimum separation from any other button.
- Stacked buttons (mobile): Full width, 8px vertical gap, primary on top.

---

## 2. Inputs and Form Fields

Form fields are where users provide data. Clarity, error prevention, and accessibility determine form completion rates.

### 2.1 Sizing

Input heights must match corresponding button heights so they sit on the same baseline in inline layouts.

| Size | Height | H Padding | V Padding | Font Size | Border Radius |
|------|--------|-----------|-----------|-----------|---------------|
| sm   | 32px   | 10px      | 6px       | 13px      | 6px           |
| md   | 36px   | 12px      | 8px       | 14px      | 6px           |
| lg   | 40px   | 14px      | 10px      | 15px      | 8px           |
| xl   | 48px   | 16px      | 12px      | 16px      | 8px           |

Default size is `md`. Use `lg` or `xl` for mobile-first layouts. Use `sm` in dense data tables or toolbar filters.

### 2.2 Anatomy

Every input field consists of these layers, top to bottom:

1. **Label** -- Always visible, always present. Font size: 13-14px. Font weight: 500 (medium). Color: neutral-700 (light theme) or neutral-300 (dark theme). Never rely on placeholder text as a label substitute.
2. **Optional indicator** -- Append the word "(optional)" in regular weight, muted color, after the label text. Do not use asterisks for required fields. If most fields are required, mark only the optional ones. If most are optional, mark the required ones with "(required)".
3. **Input container** -- 1px solid border, neutral-300 color. Background: white (light) or neutral-900 (dark). Contains the text value, placeholder, and any inline icons or actions.
4. **Leading icon or prefix** -- 18-20px icon, 8px gap to text. Used for context: search icon, currency symbol, URL prefix. Color: neutral-500.
5. **Trailing icon or action** -- Clear button (X, 16px) appears when field has a value. Password toggle (eye icon). Dropdown chevron for selects. Color: neutral-500, darkens on hover.
6. **Helper text** -- Appears below the input before any interaction. Font size: 12-13px. Color: neutral-500. Provides formatting hints, constraints, or examples: "Must be at least 8 characters."
7. **Error message** -- Replaces helper text on validation failure. Font size: 12-13px. Color: red-600. Prefixed with a 14px error icon. Text describes what went wrong and how to fix it: "Password must contain at least one number."
8. **Character count** -- Right-aligned below the input. Font size: 12px. Color: neutral-500, switches to red-600 when over limit. Format: "42 / 200".

### 2.3 Label Placement

Ranked by usability research (best to worst):

1. **Top-aligned** -- Label sits directly above the input. Fastest form completion time. Works on all screen sizes. Use this as the default for every form.
2. **Left-aligned** -- Label to the left of the input, right-aligned text within a fixed-width label column (80-160px). More compact vertically. Slower completion (eye has to scan left-right). Breaks on narrow screens. Use only in dense settings panels with experienced users.
3. **Floating labels** -- Label starts as placeholder inside the input, animates to a smaller label above the border on focus or fill. Looks clean but reduces touch target clarity and creates accessibility issues with screen readers. Use sparingly, never as the default.
4. **Placeholder-only** -- The label disappears when the user starts typing. Never use this pattern. Users forget what field they are filling. Violates WCAG. No exceptions.

### 2.4 States

| State     | Border Color   | Background       | Label Color   | Notes                                      |
|-----------|----------------|------------------|---------------|---------------------------------------------|
| Default   | neutral-300    | white / neutral-900 | neutral-700   | Resting state. Placeholder text at neutral-400. |
| Focused   | primary-500    | white / neutral-900 | primary-600   | 2px border or 1px border + 2px ring. Box-shadow ring is preferred to avoid layout shift. |
| Filled    | neutral-300    | white / neutral-900 | neutral-700   | Value is present. Clear button appears for clearable inputs. |
| Error     | red-500        | red-50 / red-950    | red-600       | Border turns red. Background gets a subtle red tint. Error message appears below. |
| Disabled  | neutral-200    | neutral-100 / neutral-800 | neutral-400 | Opacity: 0.6 on content. Cursor: not-allowed. Preserve field dimensions. |
| Read-only | neutral-200    | neutral-50 / neutral-850  | neutral-600 | No border change on focus. Text is selectable but not editable. Cursor: default. |

### 2.5 Spacing Rules

- Label to input gap: 4-6px.
- Input to helper or error text: 4px.
- Between consecutive form fields: 16-24px. This gap must always exceed the label-to-input gap so fields are visually grouped with their own labels, not the next field.
- Section break within a form (e.g., "Personal Info" to "Address"): 32-48px, with an optional horizontal rule or section heading.
- Form group to submit button: 24-32px.

### 2.6 Input Types

**Text input** -- Single line. Show a clear button (X) when filled. Max-length enforced with character count if set. Auto-complete attributes for name, email, address, phone.

**Textarea** -- Multi-line. Minimum height: 80px (3 lines). Resizable vertically by default (resize: vertical). Show character count if a limit exists. Auto-grow variant expands with content up to a max-height.

**Select / Dropdown** -- For fewer than 7 options, use a native select or a simple dropdown. For 7-15 options, use a custom dropdown with clear grouping. For more than 15 options, add a search/filter input at the top of the dropdown. Selected option shows in the trigger. Chevron-down icon on the right. Dropdown max-height: 280px with scroll.

**Checkbox** -- Box size: 18-20px. Border-radius: 3-4px. Gap between box and label text: 8px. Check icon: 12-14px, white on primary fill. Indeterminate state uses a horizontal dash. Vertical stacking preferred. Horizontal only when 2-3 short options exist.

**Radio** -- Circle size: 18-20px. Inner dot on selected: 8-10px. Gap to label: 8px. Always group with at least 2 options. Vertical stacking is the default. Use radio when only one option can be selected and the user needs to see all options at once. If more than 6 options, switch to a select dropdown.

**Toggle / Switch** -- Track size: 36-44px wide, 20-24px height. Thumb: 16-20px circle. Label sits to the left of the toggle, never to the right. Use for binary settings that take effect immediately (no form submission needed). On state: primary fill on track. Off state: neutral-300 fill on track.

**Date picker** -- For single dates, prefer a structured text input with format mask (MM/DD/YYYY) and a calendar icon that opens a calendar popover. For date ranges, use a dual-input with a calendar that supports range selection. Calendar popover: 280-320px wide. Today highlighted. Disabled dates grayed out.

**File upload** -- Provide a drop zone (dashed border, 120-160px height) plus a "Choose File" button. On file selection, display file name, size (formatted: "2.4 MB"), and a remove button. Show progress bar during upload. Accept attribute should restrict file types. Max file size communicated in helper text.

---

## 3. Cards

Cards group related content into a contained, scannable unit.

### 3.1 Anatomy

- **Container** -- Padding: 16-24px (use 16px for compact grids, 24px for feature cards). Border-radius: 8-12px. Background: white (light) or neutral-800 (dark).
- **Media area** -- Top of card for images or video. Full-bleed to card edges (no padding). Aspect ratio: 16:9 for landscape, 1:1 for profile/product. Border-radius matches card top corners.
- **Header** -- Title: 16-18px, font-weight 600. Subtitle: 13-14px, neutral-500. Optional badge or status dot. Optional overflow menu (three-dot icon, top-right).
- **Content area** -- Body text: 14px, neutral-600. Line-height: 1.5. Metadata: 12-13px, neutral-400. Tags: inline, 4-8px gaps.
- **Footer** -- Separated by a 1px divider or 16px top padding. Primary action button right-aligned. Secondary action or metadata left-aligned. Footer padding: 12-16px.

### 3.2 Variants

| Variant         | Shadow                | Border            | Use Case                              |
|-----------------|----------------------|-------------------|---------------------------------------|
| Default (elevated) | 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06) | None | Content on solid backgrounds. Default choice. |
| Outlined        | None                 | 1px solid neutral-200 | Content on surfaces that already have elevation. Lists, sidebars. |
| Interactive     | Elevates on hover: 0 4px 12px rgba(0,0,0,0.1) | None or subtle | Clickable cards linking to detail pages. Cursor: pointer. Transform: translateY(-2px) on hover, 200ms ease. |
| Selected        | Same as default      | 2px solid primary-500 | Multi-select scenarios. Background: primary-50 tint. Checkmark icon in top-right corner. |

### 3.3 Layout Rules

- **Grid gap exceeds internal padding.** If card padding is 16px, grid gap must be at least 20-24px. This prevents cards from visually merging.
- **Consistent padding** across all cards in the same view. Do not mix 16px and 24px padding cards in the same grid.
- **One purpose per card.** A card should answer one question: What is this item? Do not overload cards with multiple unrelated actions.
- **Action placement.** Actions belong in the footer or the header overflow menu. Never scatter buttons across the content area.
- **Clickable cards.** When the entire card surface is a click target, do not place other interactive elements (links, buttons) inside the card unless they have distinct actions. Nested interactive elements create ambiguous click targets.

### 3.4 Grid Layouts

- 1 column: width greater than 0px (mobile default).
- 2 columns: min-width 640px.
- 3 columns: min-width 960px.
- 4 columns: min-width 1280px.
- Card min-width: 260px. Card max-width: 400px in grids.

---

## 4. Tables and Data Display

Tables present structured data for scanning, comparison, and action.

### 4.1 Anatomy

- **Header row** -- Background: neutral-50 (light) or neutral-800 (dark). Font-weight: 600. Font-size: 12-13px. Text-transform: uppercase for short labels or sentence case for longer headers. Height: 40px. Sticky on vertical scroll (position: sticky, top: 0, z-index: 10).
- **Data rows** -- Height: 40-48px. Font-size: 14px. Alternating row backgrounds are optional (neutral-50 every other row). Border-bottom: 1px solid neutral-100.
- **Cell padding** -- Horizontal: 12-16px. Vertical: 8-12px. First cell left padding: 16-24px. Last cell right padding: 16-24px.
- **Checkbox column** -- Width: 48px. Centered checkbox. Header checkbox toggles select-all.
- **Action column** -- Right-aligned. Contains icon buttons (edit, delete, overflow). Width: auto, minimum 80px.
- **Expandable rows** -- Chevron icon in first column. Expanded content appears below the row with 16-24px padding and a subtle background tint.

### 4.2 Column Alignment

| Data Type       | Alignment     | Rationale                                |
|----------------|---------------|------------------------------------------|
| Text / Names    | Left          | Natural reading direction.               |
| Numbers         | Right         | Decimal points and digit columns align for comparison. |
| Currency        | Right         | Same as numbers. Include currency symbol. |
| Dates           | Left          | Treated as text. Use consistent format: "Feb 26, 2026" or "2026-02-26". |
| Status badges   | Left          | Read as labels with color-coded dots or pills. |
| Actions         | Right         | Convention. Keeps actions at the row edge. |
| Checkboxes      | Center        | Single element in the cell.              |

### 4.3 Interactive Features

**Sorting** -- Sortable column headers show a subtle arrow icon (12px). Unsorted: both arrows dimmed. Ascending: up arrow active. Descending: down arrow active. Click toggles between ascending, descending, and unsorted. Transition: 150ms.

**Row hover** -- Background shifts to neutral-50 (light) or neutral-750 (dark). Transition: 100ms ease.

**Row selection** -- Checkbox activates. Row background: primary-50 tint. Selected count shown above table: "3 of 24 selected" with bulk action buttons.

**Pagination** -- Placed below the table with 16px top margin. Shows rows per page selector (10, 25, 50, 100), current range ("1-25 of 142"), and page navigation buttons. Details in Section 5.5.

**Empty state** -- Centered in the table body area. Illustration or icon (48-64px), headline (16px, font-weight 600), description (14px, neutral-500), optional action button. Minimum height: 200px.

**Loading state** -- Skeleton rows matching the column layout. 3-5 skeleton rows. Shimmer animation. Header row remains static during loading.

### 4.4 Responsive Behavior

- **Below 768px:** Convert table to a card-based layout. Each row becomes a card. Column headers become labels within the card. Or use horizontal scroll with a sticky first column.
- **Priority columns:** Define which columns remain visible at each breakpoint. Name/title is always visible. Status is high priority. Timestamps are low priority. Actions collapse into an overflow menu.
- **Sticky first column:** When using horizontal scroll, the first column (usually name/identifier) stays fixed. Add a subtle right shadow to indicate scrollable content.

---

## 5. Navigation

Navigation structures define how users move through the application.

### 5.1 Top Navigation Bar

- **Height:** 48px (compact apps) to 64px (content-heavy apps).
- **Padding:** 16-24px horizontal.
- **Background:** white with 1px bottom border (light) or neutral-900 (dark).
- **Logo:** Left-aligned. Max-height: 28-32px. Linked to home.
- **Primary nav links:** Center-aligned or right of logo. Font-size: 14-15px. Font-weight: 500. Gap between links: 24-32px. Active link: font-weight 600, with a 2px bottom border in primary color or a subtle background pill.
- **User actions:** Far right. Profile avatar (32px circle), notification bell, settings icon. Gap: 8-12px.
- **Mobile breakpoint (below 768px):** Collapse primary nav into a hamburger menu icon (24px). Menu opens as a full-height sidebar from the left or a dropdown panel.

### 5.2 Sidebar Navigation

- **Expanded width:** 240-280px.
- **Collapsed width:** 64-72px (icons only, with tooltips on hover).
- **Background:** white with 1px right border (light) or neutral-900 (dark).
- **Nav item height:** 36-40px.
- **Nav item padding:** 8-12px horizontal, 4-6px vertical.
- **Nav item font-size:** 14px. Font-weight: 400 (default), 600 (active).
- **Active item:** Background: primary-50 or neutral-100. Left border: 3px solid primary-500 or full background highlight. Color: primary-700 or neutral-900.
- **Group headers:** Font-size: 11-12px. Text-transform: uppercase. Letter-spacing: 0.5-1px. Color: neutral-400. Margin-top: 16-24px before a new group.
- **Icons:** 20-24px, consistent stroke weight (1.5-2px). Aligned to the left, 10-12px gap to label text. Use the same icon set throughout.
- **Nested items:** Indented 24-32px from parent. No icon (or a smaller 16px icon). Font-size: 13-14px. Collapsible with a chevron on the parent item.
- **Collapse toggle:** Bottom of sidebar or in the header. Animated transition: 200-300ms ease.

### 5.3 Breadcrumbs

- **Font-size:** 13-14px.
- **Separator:** "/" or chevron-right icon (12px). Gap: 8px on each side of the separator. Color: neutral-400.
- **Link items:** Color: primary-600 or neutral-500. Underline on hover.
- **Current page (last item):** Not a link. Color: neutral-900 (light) or neutral-100 (dark). Font-weight: 500.
- **Truncation:** On mobile or when exceeding 4-5 levels, collapse middle items into a "..." that expands to a dropdown on click. Always show the first item (Home) and the last 1-2 items.

### 5.4 Tabs

- **Height:** 36-48px.
- **Horizontal padding per tab:** 12-16px.
- **Font-size:** 14px. Font-weight: 500 (default), 600 (active).
- **Active indicator:** 2-3px bottom border in primary color. Or a filled pill background (primary-50 with primary-700 text). Transition: 200ms ease.
- **Inactive tabs:** Color: neutral-500. Hover: neutral-700.
- **Gap between tabs:** 0px (tabs touch) with only the active indicator differentiating. Or 4-8px gap with pill style.
- **Scrollable tabs:** When tabs overflow, show horizontal scroll with fade-out gradient (40px wide) on the overflow edge. Scroll arrows optional.
- **Rules:** Tabs must never wrap to multiple lines. Content below tabs must not shift when switching. Use icon plus label, or label only. Icon-only tabs are prohibited because they lack clarity.

### 5.5 Pagination

- **Page button size:** 32-36px square. Border-radius: 6px.
- **Font-size:** 14px.
- **Active page:** Background: primary-500. Color: white. Font-weight: 600.
- **Inactive pages:** Background: transparent. Color: neutral-600. Hover: neutral-100 background.
- **Ellipsis:** Displayed when there are gaps between visible pages. Shows "..." as a static element.
- **Visible pages:** First page, last page, current page, and 1-2 pages on each side of current. Example for page 5 of 20: 1 ... 3 4 [5] 6 7 ... 20.
- **Previous/Next buttons:** Always visible. Disabled (opacity: 0.4, no pointer events) at the first and last pages respectively. Use arrow icons or "Prev"/"Next" labels.
- **Gap between elements:** 4px.

---

## 6. Modals and Overlays

Modals interrupt the user flow for focused tasks. Use sparingly.

### 6.1 Sizing

| Size | Max Width | Max Height       | Use Case                                      |
|------|-----------|------------------|-----------------------------------------------|
| sm   | 400px     | 80vh             | Confirmations, single-field input, alerts.     |
| md   | 480px     | 80vh             | Short forms, settings panels, option selection. |
| lg   | 640px     | 85vh             | Multi-field forms, content editing, previews.  |
| xl   | 960px     | 90vh             | Data tables, complex layouts, side-by-side.    |
| full | calc(100% - 64px) | calc(100% - 64px) | Immersive editing, media viewers.         |

### 6.2 Anatomy

- **Overlay backdrop:** Background: rgba(0, 0, 0, 0.5). Covers the entire viewport. z-index: 1000.
- **Modal container:** Centered horizontally and vertically. Background: white (light) or neutral-850 (dark). Border-radius: 12-16px. Box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15).
- **Header:** Height: 56-64px. Padding: 24px horizontal. Title: 18px, font-weight: 600. Close button: top-right, 20px icon, 36px click target, neutral-500 color.
- **Content area:** Padding: 0 24px. Scrollable (overflow-y: auto) when content exceeds max-height minus header and footer. Scroll shadow at top and bottom edges when scrolled.
- **Footer:** Padding: 16px 24px. Border-top: 1px solid neutral-100. Action buttons right-aligned. Cancel/secondary on the left side of the footer. Gap between buttons: 8px.
- **Overall padding (top/bottom):** Header has 24px top padding. Footer has 24px bottom padding before buttons.

### 6.3 Behavior

- **Focus trap:** Pressing Tab cycles through interactive elements inside the modal. Focus never escapes to the page behind.
- **Escape key:** Closes the modal unless it contains unsaved changes (then show a confirmation).
- **Overlay click:** Closes the modal for informational content. Disabled for critical actions (forms with data, confirmations).
- **Entry animation:** Scale from 95% to 100% combined with opacity 0 to 1. Duration: 200-300ms. Easing: ease-out.
- **Exit animation:** Opacity 1 to 0. Duration: 150-200ms. Easing: ease-in. No scale on exit (feels more decisive).
- **Body scroll lock:** The page behind the modal must not scroll while the modal is open.
- **Stacking:** Avoid stacking modals. If a second modal is needed, replace the first or use a nested confirmation within the same modal.

### 6.4 Sheets (Mobile Overlays)

**Bottom sheet** -- Slides up from the bottom of the viewport. Drag handle: 32px wide, 4px tall, centered, neutral-300 color, 8px from the top. Border-radius: 16px on top corners. Max-height: 90vh. Swipe down to dismiss. Use instead of modals on screens narrower than 640px.

**Side sheet** -- Slides in from the right edge. Width: 320-480px (or 85% on mobile). Close button: top-left (16px from edges). Use for supplementary content: detail panels, filters, settings.

---

## 7. Tooltips and Popovers

### 7.1 Tooltips

Tooltips provide brief, non-interactive explanations of UI elements.

- **Max width:** 240px.
- **Padding:** 6-8px horizontal, 4-6px vertical.
- **Font-size:** 12-13px. Line-height: 1.4.
- **Background:** neutral-900 (near-black). Opacity: 0.95.
- **Text color:** white.
- **Border-radius:** 4-6px.
- **Arrow:** 6px equilateral triangle pointing toward the trigger element.
- **Show delay:** 300ms after hover begins. Prevents tooltip flash on accidental hover.
- **Hide delay:** 100ms after hover leaves. Allows moving cursor to a nearby tooltip without flicker.
- **Animation:** Opacity 0 to 1, translateY(4px) to translateY(0). Duration: 150-200ms. Easing: ease-out.
- **Placement priority:** Top, then right, then bottom, then left. Auto-flip when near viewport edges. Maintain 8px minimum distance from viewport edge.
- **Rules:** Tooltips must not contain interactive elements (links, buttons). Keep text under 80 characters. If more content is needed, use a popover.

### 7.2 Popovers

Popovers are richer overlays that can hold interactive content.

- **Max width:** 320px. Min width: 200px.
- **Padding:** 12-16px.
- **Background:** white (light) or neutral-800 (dark).
- **Border:** 1px solid neutral-200.
- **Border-radius:** 8px.
- **Box-shadow:** 0 4px 16px rgba(0, 0, 0, 0.12).
- **Arrow:** 8px, matching background and border.
- **Dismiss:** Click outside, press Escape, or an explicit close button inside.
- **Animation:** Scale from 95% to 100% combined with opacity 0 to 1. Duration: 150-250ms. Easing: ease-out. Transform-origin matches arrow position.
- **Use cases:** Filter menus, user profile cards, color pickers, share menus, context menus.
- **Rules:** Popovers can contain form elements, links, and buttons. Max one popover visible at a time (opening a new one closes the previous). Popovers must not exceed 400px in height without scrolling.

---

## 8. Badges, Tags, and Status Indicators

### 8.1 Badges

Badges are compact labels conveying status, count, or category.

- **Height:** 20-24px.
- **Padding:** 4-8px horizontal. No vertical padding (height is fixed by line-height).
- **Font-size:** 11-12px. Font-weight: 600.
- **Border-radius:** Full (pill shape) -- set to half the height or 999px.
- **Text-transform:** Uppercase for single-word status labels. Sentence case for counts or longer text.
- **Dot variant:** 8-10px circle. No text. Positioned inline with a text label (8px gap). Used for online/offline indicators or unread markers.
- **Notification badge:** 18-20px circle, positioned at the top-right corner of an icon. Offset: -6px top, -6px right. Background: red-500. Text: white, 10-11px font.

### 8.2 Tags

Tags are user-generated or system-generated labels that can be added and removed.

- **Height:** 24-28px.
- **Padding:** 6-12px horizontal.
- **Font-size:** 12-13px. Font-weight: 500.
- **Border-radius:** 4-6px (slightly rounded) or full pill shape.
- **Background:** neutral-100 with neutral-700 text, or color-coded (primary-50 with primary-700 text).
- **Remove button:** X icon, 14-16px. Positioned inside the tag after the label. Gap: 4px. Hover: background darkens.
- **Spacing between tags:** 6-8px gap in a wrapping flex layout.

### 8.3 Status Colors

Apply these colors consistently across badges, dots, and any status-related UI:

| Status                  | Color Token   | Hex (light theme) | Usage                                    |
|------------------------|---------------|--------------------|------------------------------------------|
| Active / Success        | green-500     | #22C55E            | Online, completed, paid, approved.       |
| Warning / Attention     | yellow-500    | #EAB308            | Pending, expiring soon, needs review.    |
| Error / Critical        | red-500       | #EF4444            | Failed, overdue, declined, offline.      |
| Inactive / Neutral      | neutral-400   | #9CA3AF            | Disabled, archived, draft.               |
| Info / In Progress      | blue-500      | #3B82F6            | Processing, in review, new.              |

Always pair a color indicator with a text label. Never rely on color alone to convey status (colorblind accessibility).

---

## 9. Toast Notifications

Toasts provide non-blocking feedback about completed or failed actions.

### 9.1 Sizing and Position

- **Width:** 360-420px on desktop. calc(100% - 32px) on mobile (16px padding each side).
- **Position (desktop):** Fixed to the top-right corner. Offset: 16-24px from the top, 16-24px from the right.
- **Position (mobile):** Fixed to the top-center. Offset: 16px from the top.
- **Stacking:** Multiple toasts stack vertically with 8px gap. Newest on top. Maximum 3 visible at once; oldest dismissed first if exceeded.

### 9.2 Anatomy

- **Container:** Padding: 12-16px. Border-radius: 8px. Background: white with a left border accent (4px wide, variant color). Box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1).
- **Icon:** 20px. Left-aligned. Color matches variant.
- **Message:** Font-size: 14px. Color: neutral-800. One to two lines maximum.
- **Action link:** Optional text button (e.g., "Undo", "View"). Font-size: 14px. Font-weight: 600. Color: primary-600.
- **Close button:** X icon, 16px. Far right, vertically centered. Color: neutral-400. Always present.

### 9.3 Variants

| Variant  | Accent Color | Icon        | Auto-dismiss |
|----------|-------------|-------------|--------------|
| Success  | green-500   | check-circle | Yes, 4-6s    |
| Error    | red-500     | x-circle     | No (manual dismiss required) |
| Warning  | yellow-500  | alert-triangle | Yes, 6-8s |
| Info     | blue-500    | info-circle  | Yes, 4-6s    |

### 9.4 Animation

- **Entry (desktop):** Slide in from the right. TranslateX(100%) to translateX(0). Duration: 200-300ms. Easing: ease-out.
- **Entry (mobile):** Slide down from top. TranslateY(-100%) to translateY(0). Duration: 200-300ms. Easing: ease-out.
- **Exit:** Opacity 1 to 0, combined with translateX(20px). Duration: 150ms. Easing: ease-in.
- **Auto-dismiss timer:** Visible as a thin progress bar at the bottom of the toast (2px height, variant color, shrinking left to right). Pauses on hover.

---

## 10. Progress Indicators

Progress indicators communicate system status and reduce perceived wait time.

### 10.1 Progress Bar

- **Height:** 4-8px (4px for subtle inline progress, 8px for prominent file uploads or wizards).
- **Border-radius:** Full (equal to half the height).
- **Track background:** neutral-200 (light) or neutral-700 (dark).
- **Fill color:** primary-500 for standard progress. Green-500 at 100% (optional completion state).
- **Indeterminate:** Animated gradient or sliding highlight moving left to right. Duration: 1.5-2s, infinite loop. Use when completion percentage is unknown.
- **Label:** Positioned above the bar, left-aligned or centered. Font-size: 13-14px. Format: "42%" or "Step 2 of 5" or "Uploading... 2.4 MB / 10 MB".

### 10.2 Steps / Stepper

- **Step circle diameter:** 24-32px.
- **Circle content:** Step number (14px font) for upcoming steps. Check icon (16px) for completed steps.
- **Connector line:** 2px height, centered vertically on the circles. Color: primary-500 between completed steps, neutral-300 between upcoming steps.
- **Step states:**
  - Completed: Circle background primary-500, white check icon. Connector to next: primary-500.
  - Active: Circle border 2px solid primary-500, primary-500 step number, no fill or primary-50 fill. Connector to next: neutral-300.
  - Upcoming: Circle border 1px solid neutral-300, neutral-400 step number. Connector to next: neutral-300.
- **Step label:** Below the circle, centered. Font-size: 12-14px. Font-weight: 500 (active), 400 (others). Max-width: 100px. Truncate with ellipsis if longer.
- **Vertical variant:** Steps stack vertically. Connector becomes a vertical line (2px wide). Labels sit to the right of the circle with 12px gap. Use vertical for more than 5 steps or for steps with descriptions.

### 10.3 Skeleton Screens

- **Purpose:** Replace content with placeholder shapes during loading. Users perceive faster load times with skeletons than with spinners.
- **Shape matching:** Each skeleton element must approximate the dimensions and position of the real content. Text lines: 12-16px height rectangles at 60-80% of container width. Headings: taller rectangles (20-24px). Avatars: circles. Images: rectangles matching the aspect ratio.
- **Border-radius:** Match the real content's radius. Text: 4px. Avatars: 50%. Cards: 8-12px.
- **Background:** neutral-200 (light) or neutral-700 (dark).
- **Shimmer animation:** Linear gradient highlight sweeping left to right. Gradient: transparent to neutral-100 (20% opacity) to transparent. Duration: 1.5s. Easing: ease-in-out. Infinite loop.
- **Rules:** Never show a spinner and skeleton simultaneously. Skeleton screens replace the entire content area. Show the skeleton for a minimum of 300ms to avoid flash-of-skeleton for fast loads. Transition from skeleton to real content with a 150ms opacity fade.

---

## Appendix A: Spacing Scale

Use a consistent 4px base unit for all spacing decisions.

| Token | Value | Usage                                       |
|-------|-------|---------------------------------------------|
| 0     | 0px   | No spacing.                                 |
| 0.5   | 2px   | Tight inline gaps (icon to superscript).    |
| 1     | 4px   | Minimum gap. Label to input. Icon internal. |
| 1.5   | 6px   | Compact padding. Small badge internals.     |
| 2     | 8px   | Default inline gap. Button icon to text.    |
| 3     | 12px  | Input horizontal padding. Card dense.       |
| 4     | 16px  | Default component padding. Form field gap.  |
| 5     | 20px  | Button lg horizontal padding.               |
| 6     | 24px  | Card comfortable padding. Section gap.      |
| 8     | 32px  | Section break. Large component separation.  |
| 10    | 40px  | Page section separation.                    |
| 12    | 48px  | Major section break. Modal padding.         |
| 16    | 64px  | Page-level top/bottom margins.              |

## Appendix B: Transition Defaults

| Property                | Duration | Easing     | Usage                                      |
|------------------------|----------|------------|--------------------------------------------|
| Color and background    | 150ms    | ease       | Hover, focus, active state changes.        |
| Box-shadow and border   | 150ms    | ease       | Elevation changes, focus rings.            |
| Transform (scale, move) | 200ms    | ease-out   | Modal entry, card hover lift, button press.|
| Opacity (enter)         | 200ms    | ease-out   | Fade in. Tooltips, toasts, modals.         |
| Opacity (exit)          | 150ms    | ease-in    | Fade out. Faster exit feels responsive.    |
| Width and height        | 300ms    | ease-in-out| Sidebar collapse, accordion expand.        |
| Layout shift            | 200ms    | ease       | Content reflow from loading states.        |

Reduce all durations to 0ms when the user has `prefers-reduced-motion: reduce` enabled.

## Appendix C: Accessibility Checklist

- **Minimum touch target:** 44x44px on mobile, 36x36px on desktop. Applies to buttons, links, checkboxes, radio buttons, and all tappable elements.
- **Color contrast:** 4.5:1 minimum for normal text (below 18px). 3:1 minimum for large text (18px+ or 14px bold). 3:1 minimum for UI components and graphical objects (borders, icons, focus rings).
- **Focus indicators:** Visible on every interactive element. 2px solid ring with 2px offset. Must pass 3:1 contrast against adjacent colors. Never use `outline: none` without providing an alternative.
- **Status communication:** Never rely on color alone. Pair every color indicator with text, icon, or pattern. Error fields need both red border and an error message. Status badges need both colored dot and text label.
- **Screen reader labels:** All icon-only buttons require `aria-label`. All form fields require associated labels (explicit `for`/`id` or wrapping `label`). All images require `alt` text or `aria-hidden="true"` for decorative ones.
- **Keyboard navigation:** Tab order follows visual order. Enter or Space activates buttons. Arrow keys navigate within radio groups, tabs, and menus. Escape closes modals, popovers, and dropdowns.
- **Reduced motion:** Honor `prefers-reduced-motion`. Replace animations with instant state changes. Keep opacity transitions but remove movement (translate, scale).
