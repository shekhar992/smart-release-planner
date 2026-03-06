# UX Patterns, Flows, and Cross-Industry Inspiration Reference

Deep reference for interaction patterns, user flows, error handling, content design,
and cross-industry inspiration. Load this file when designing flows, handling edge
cases, or looking for proven patterns from outside your domain.

---

## 1. Cross-Industry Pattern Library

The best solutions to your UX challenge were often solved decades ago in an
unrelated industry. This table maps common design challenges to the industries
that cracked them.

| Your challenge | Learn from | Key insight |
|---|---|---|
| Complex checkout | Hotel check-in | Collect only what is essential at each stage. Hotels moved from 8-field forms to "swipe and sign." Ask the minimum, infer the rest. |
| Dense data display | Air traffic control | Consistent encoding (shape = type, color = status) and suppress unchanged data. Show what changed, dim what didn't. |
| User onboarding | Video game tutorials | Never start with a manual. Safe sandbox, one mechanic at a time, complexity only after mastery. Teach by doing. |
| Error handling | Medical devices | Three-tier urgency (advisory, caution, warning). Messages state what happened, what it means, what to do -- in that order. |
| Long forms | Conversation design | One question at a time, adapt based on answers. Show one group per step, skip irrelevant fields. |
| Notifications | Emergency alert systems | Strict urgency hierarchy: imminent threat, watch, advisory, informational. Most apps over-notify because they treat everything as equal. |
| Search and discovery | Library science | Faceted classification -- filter by multiple independent dimensions. Progressive filtering (broad to narrow) so users explore without exact terms. |
| Pricing pages | Restaurant menus | Anchor high (expensive steak makes mid-range feel reasonable), group by category, use hierarchy to guide the eye to the recommended option. |
| Empty states | Retail store design | Greet at the entrance with curated suggestions, not an empty shelf. Inspire a first action, show the populated state. |
| Settings/preferences | Car dashboards | Climate and volume are always one tap away. The 47 other settings live deeper. Surface 3-5 most-used, tuck the rest behind "Advanced." |
| Loading/waiting | Theme park queues | Perceived wait > actual wait. Provide entertainment, set expectations ("about 2 minutes"), show continuous progress. |
| Permissions/consent | Medical informed consent | Plain language, concrete consequences, separate required from optional, let users change their mind later. |
| Navigation | Airport wayfinding | Redundant coding (color + icon + text), progressive disclosure (terminal > gate > seat), consistent sign placement. |
| Collaboration | Operating rooms | Shared situational awareness: visible status boards, explicit roles, structured communication. Show who is doing what. |
| Undo/recovery | Word processors | Prefer undo over confirmation. "Are you sure?" trains users to click yes. A clear undo path gives confidence to act. |
| Progress tracking | Fitness apps | Streaks, milestones, personal bests. Show how far they have come (not just how far to go), celebrate completions. |
| Comparison/selection | Grocery shopping | Side by side, scanning key attributes (price, size, brand). Pin items, highlight differences, collapse identical attributes. |
| Feedback collection | Restaurant comment cards | Short (3-5 questions), specific, optional, available at the moment of experience. Time requests to the moment of value. |
| Multi-step wizards | Tax preparation software | Auto-save every answer, show a completion map, allow jumping to any section, handle dependencies gracefully. |
| Help/documentation | Museum audio guides | Contextual (triggered by location), optional, layered (brief overview + deeper detail), non-intrusive (pause and resume). |

**How to use this table:** Look at the "Learn from" column and ask: (1) what
constraints did they face that we also face? (2) what did they optimize for?
(3) what can we adapt into our context?

---

## 2. User Flow Patterns

### Onboarding Patterns

**Progressive onboarding (learn as you go)**
Teach features in context, the moment they become relevant. Do not front-load
a tutorial. User reaches the dashboard -- highlight one feature with a tooltip.
User creates their first item -- show what they can do next.
- Best for: complex products with many features
- Risk: users may miss features if they never reach the trigger
- Mitigation: add an optional "feature tour" in help settings

**Setup wizard (guided first-run)**
Walk new users through 3-5 essential steps before the main product. Collect only
what the product genuinely needs to function.
- Keep it under 5 steps and under 2 minutes
- Show progress (step 2 of 4), allow skipping on every step
- Pre-fill from available data (email domain, locale, timezone)
- Best for: products that need configuration before they are useful

**Empty state onboarding (the product teaches through use)**
The product itself, in its empty state, guides users to their first action.
- The empty state explains what belongs here
- A single primary CTA starts the first action
- Sample data or templates offer a shortcut
- Best for: creative tools, project management, content platforms

**Social proof onboarding (show what others have done)**
Show templates, examples, or case studies from real users during onboarding.
"Here is how Company X set up their workspace" is more motivating than a
feature list. Combine with template selection for fastest time-to-value.

**Checklist onboarding (clear progress, optional completion)**
Present a visible checklist of 5-7 setup tasks, completable in any order.
Mark tasks complete automatically when done in-product. Celebrate completion.
Persist the checklist but allow dismissal.

### Authentication Patterns

**Single field entry (email first, then method)**
Show one input: email. Detect whether the account exists and route to the right
method (password, magic link, SSO). Eliminates "sign in vs sign up" confusion.

**Magic link (passwordless)**
One-time login link via email. Best for low-frequency apps (monthly or less).
Offer resend after 30 seconds, show a "check spam" hint.

**Social login (OAuth)**
Google, Apple, GitHub, or domain-relevant providers. Always offer a non-social
fallback. Be explicit about data accessed ("We only read your name and email").

**Biometric (Face ID, fingerprint)**
Use device biometrics for return sessions after initial authentication. Always
offer a passcode fallback. Never as sole initial authentication.

**When to use which:**
| Scenario | Recommended pattern |
|---|---|
| First-time visitor, consumer app | Social login + email fallback |
| Returning user, mobile app | Biometric with passcode fallback |
| Low-frequency product | Magic link |
| Enterprise / SSO environment | Email-first routing to SSO |
| High-security context | Email + password + MFA |

### Search and Discovery

**Progressive filtering** -- Start with all results. Each filter reduces the set
with real-time count updates ("47 results" becomes "12 results"). Show active
filters as removable chips. Allow clearing all with one action.

**Faceted search** -- Filter by independent dimensions simultaneously (category +
price + rating). Disable options returning zero results. Sort facet options by
frequency, not alphabetically. Most-used facets open by default.

**Autocomplete** -- Suggest from three sources: (1) recent searches, (2) popular
searches, (3) category matches. Highlight matching portions. Keyboard navigable.

**No-results recovery** -- Never show just "No results found." Suggest spelling
corrections, offer related terms, show popular items, check if filters are too
restrictive and suggest loosening them.

**Search result layouts:**
| Layout | Best for |
|---|---|
| List | Text-heavy items, documents, emails |
| Grid | Visual items, products, images |
| Map | Location-based results |
| Table | Data-dense items needing comparison |
| Hybrid | Let users toggle between layouts |

### Checkout and Conversion

**Single-page vs multi-step:**
| Factor | Single-page | Multi-step |
|---|---|---|
| Best for | Few fields (< 8), simple products | Complex orders, multiple options |
| Abandonment | Lower for simple purchases | Lower for complex (less overwhelming) |
| Mobile | Can feel long scrolling | Works well with focused steps |
| Trust | All visible for transparency | Build trust progressively |

**Guest checkout** -- Always offer it. Forced account creation is the top cause of
cart abandonment. Offer account creation after purchase: "Save your details for
faster checkout next time."

**Trust signals at each step:**
- Cart: item images, clear pricing, return policy link
- Information: security badge, privacy statement near email field
- Payment: SSL indicator, accepted payment logos, encryption note
- Confirmation: order number, delivery estimate, support contact

**Cart abandonment recovery:**
1. Exit-intent: offer to save cart or email it
2. Email (1 hour): "You left something behind" with cart contents
3. Email (24 hours): add incentive if margin allows
4. Retargeting: specific abandoned items, not generic ads

**Post-purchase:** Confirmation page with timeline and next steps. Email with
tracking. Proactive status updates. Feedback request 3-7 days after delivery.

---

## 3. Error Handling Patterns

### Error Prevention

**Inline validation** -- Validate on blur, not on submit. Green check for valid,
red message for invalid. Never validate while the user is still typing. Password:
show strength meter while typing, validate rules on blur.

**Confirmation for destructive actions** -- Only for irreversible AND significant
consequences. Name the specific action: "Delete Project Alpha and all 47 tasks?"
not "Are you sure?" Require typing the item name for high-stakes deletions.

**Undo instead of "are you sure?"** -- Undo does not interrupt flow, trains
decisive behavior, handles accidents without overhead. Show a toast: "Item
deleted. Undo" with a 5-10 second window.

**Constrained inputs** -- Dates: date picker. Quantities: stepper for small ranges.
Phone: formatted with country selector. Currency: numeric with symbol. Yes/No:
toggle or radio, never a dropdown.

**Smart defaults** -- Country from IP/locale. Currency matching country. Timezone
from browser. Date format matching locale. Shipping: "same as billing."

### Error Recovery

**Preserve user input** -- Never clear a form on error. Keep all values, scroll to
the first error, and focus the problematic field.

**Specific error messages** -- Tie every message to the specific field and problem.
| Bad | Good |
|---|---|
| "Invalid input" | "Email must include an @ symbol" |
| "Error in form" | "Phone number must be 10 digits" |
| "Something went wrong" | "Could not save. Your connection may be down." |
| "Validation failed" | "Username taken. Try adding a number." |

**Suggest corrections** -- "Did you mean gmail.com?" for common email typos.
"No results for 'recieve'. Showing results for 'receive'." Fuzzy matching on
search queries.

**Offer escape routes** -- When an error blocks progress, provide alternatives:
save as draft, try a different method, contact support with reference code, go back.

**Internal logging** -- Full technical details for engineering. Plain language for
users. Include an error reference code so support can look it up.

### Error Message Hierarchy

**Level 1 -- Inline field error**
Red border, error icon, message below the field. For validation errors.
```
[ Email address          ] (red border)
  (!) Please enter a valid email address
```

**Level 2 -- Section error**
Colored banner at section top summarizing issues. For multiple related field errors.

**Level 3 -- Page-level error**
Toast or top banner. For save failures, network errors, permission issues.

**Level 4 -- System error (full-page)**
Dedicated error page with status, explanation, recovery actions, and status page
link. For 404, 500, maintenance, critical failures.

---

## 4. Empty State Patterns

### Types of Empty States

**First-time** -- User has not created anything yet. This is your biggest onboarding
opportunity. Explain what this space is for, show a populated preview, provide a
single CTA ("Create your first project"), offer a secondary path (import, template).

**No results** -- Search or filter returned nothing. Confirm what was searched
("No results for 'widget'"), suggest corrections, offer to broaden filters, provide
a browse or create path. Never blame the user.

**Cleared** -- User removed everything. Confirm positively ("All tasks completed"),
suggest the next action, keep tone encouraging.

**Error** -- Data failed to load. Explain without jargon, show retry, provide status
page link for persistent issues. Never show a blank screen with no explanation.

### What Great Empty States Include

Every empty state answers three questions:
1. What is this place? (one-line explanation)
2. Why is it empty? (context)
3. What should I do? (primary action)

The best also show a populated preview, offer templates to reduce "blank canvas"
anxiety, include a help link, and match the product's tone.

---

## 5. Loading Patterns

### Types of Loading

**Skeleton screens** -- Wireframe placeholders matching the incoming layout.
Animate with a subtle shimmer (left to right, 1.5-2s loop). Match the actual
content structure, not a generic loader. Best for known layouts (feeds, cards).

**Progressive loading** -- Render content as it arrives. Header first, then main
content, then secondary. Each section interactive independently. Load above-fold
content first, always.

**Optimistic updates** -- Assume success, update UI instantly, roll back on failure.
Best for low-failure actions (likes, toggles, saves, reorders). Roll back with a
clear message. Never use for financial or destructive actions.

**Prefetch** -- Predict what the user needs next. Prefetch the next page in lists,
preload linked content on hover (200ms delay), cache for instant back-navigation.

**Lazy loading** -- Defer below-fold content until scroll. Intersection Observer
with 200-400px root margin. Show placeholder until loaded. Never lazy-load
above-fold content.

### Perceived Performance

| Duration | Perception | What to show |
|---|---|---|
| 0-100ms | Instant | Nothing needed |
| 100-300ms | Slight delay | Subtle transition or animation |
| 300ms-1s | Noticeable | Skeleton screen or spinner |
| 1-4s | Uncomfortable | Skeleton + progress indicator |
| 4-10s | Frustrating | Progress bar with estimate |
| 10s+ | Unacceptable for UI | Background process + notification |

**Rules:** Show the page shell immediately. Add skeletons within 300ms. Fill content
progressively. Never block the full interface for one loading element. Use progress
bars (not spinners) for operations over 4 seconds. Bars never pause or jump backward.

---

## 6. Content Design Patterns

### Microcopy

**Button labels** -- Use verbs describing outcomes, not generic actions.
| Weak | Strong |
|---|---|
| Submit | Place order |
| OK | Save changes |
| Click here | Download report |
| Next | Continue to payment |
| Yes | Delete project |
| Cancel | Keep editing |

**Field labels** -- User's language, not database field names.
| Weak | Strong |
|---|---|
| Name | Full name |
| DOB | Date of birth |
| Addr1 | Street address |
| Qty | How many? |
| CC# | Card number |

**Help text** -- Below the input. Anticipates confusion, not restates the label.
- "We will only use this for shipping updates" (under email)
- "Must be at least 8 characters with one number" (under password)
- "This will appear on your public profile" (under display name)

**Placeholder text** -- Example values, never labels. Placeholders disappear on
focus and cannot be relied on for guidance.
| Bad | Good |
|---|---|
| "Enter your email" | "name@company.com" |
| "Search" | "Search by name, ID, or keyword" |
| "Type here" | "Describe the issue in a few sentences" |

### Writing for Interfaces

**Front-load key information** -- Most important words first. Users scan the first
2-3 words and move on. "Export your data" not "Click the button below to export."

**Active voice** -- Shorter, clearer, more direct. "You created a project" not
"A project was created." "This will delete the file" not "The file will be deleted."

**Be specific** -- Vague confirmations leave users uncertain. "3 files uploaded
to Project Alpha" not "Upload complete." "Notification preferences updated" not
"Settings saved."

**Avoid jargon** -- Unless your audience expects it. When in doubt, use plain
language with the technical term in parentheses: "version history (changelog)."

### Notification Copy

Every notification follows a three-part structure:

**Title: what happened (2-5 words)**
- "New comment on your post"
- "Payment received"
- "Build failed"

**Body: what to do about it (1 sentence)**
- "Alex left feedback on the homepage design."
- "The deploy to staging failed at step 3. Check the logs."

**Action: verb matching the resolution**
- "View comment" / "See receipt" / "View logs" / "Go to team"

**Urgency tiers:**
| Tier | Examples | Delivery | Visuals |
|---|---|---|---|
| Critical | Security breach, payment failure | Push + email + in-app | Red, persistent, requires action |
| Important | New assignment, deadline | Push + in-app | Accent color, badge, dismissible |
| Informational | Comment, team update | In-app only | Neutral, dot indicator, batched |
| Optional | Feature tip, suggestion | In-app feed only | Subdued, no badge, no push |

---

## 7. Quick Reference: Pattern Selection

**Modal vs drawer vs new page?**
- Modal: quick confirmation, single input, focused decision (< 3 fields)
- Drawer: secondary content, filters, details panel (keeps context visible)
- New page: complex forms, multi-step flows, full-screen content

**Toast vs banner vs inline?**
- Toast: transient feedback (saved, copied, sent) -- auto-dismiss 4-6 seconds
- Banner: persistent page-level status (maintenance, trial ending, errors)
- Inline: field-specific feedback (validation errors, help text)

**Confirm vs undo?**
- Confirm: irreversible AND high-consequence (delete account, send to 10K users)
- Undo: reversible OR low-consequence (delete item, move file, change setting)

**Spinner vs skeleton?**
- Spinner: unknown layout, action-triggered loading (file upload, form submit)
- Skeleton: known layout, page/section loading (feed, dashboard, profile)

**Dropdown vs radio vs segmented control?**
- Dropdown: 6+ options, limited space, infrequent selection
- Radio buttons: 2-5 options, enough space, all options should be visible
- Segmented control: 2-4 options representing views or modes, not data values
