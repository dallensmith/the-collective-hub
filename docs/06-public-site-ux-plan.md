# Public Site UX Planning Document

## Design Principles

- **Simple landing page, not a full website.** The public site is a single page (with maybe an event detail modal or page). It tells visitors who the community is, what they do, when they meet, and how to join.
- **Content-driven by settings.** Everything on the page comes from the database (site settings, events, links). No hardcoded content.
- **Theme-aware.** The page renders with the site's branding settings: logo, colors, background image.
- **Fast and accessible.** Server-side rendered, minimal client JS, semantic HTML.
- **Mobile-responsive.** Many visitors will check on their phones.

---

## Homepage Layout

```
┌─────────────────────────────────────────────┐
│                  NAV BAR                     │
│  [Logo] Site Name    [Link1] [Link2] [Link3] │
├─────────────────────────────────────────────┤
│                                             │
│              HERO SECTION                    │
│        [Background Image Optional]          │
│                                             │
│        Site Name (large heading)            │
│        Tagline / Subtitle                   │
│        [Primary CTA Button]                 │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│            ABOUT / INTRO SECTION             │
│                                             │
│        About text (from settings)           │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│           NEXT EVENT SECTION                 │
│        (if showNextEvent is enabled)        │
│                                             │
│        "Next Event" heading                 │
│        Event card with:                     │
│          - Title                            │
│          - Date/Time                        │
│          - Description snippet              │
│          - [Event Link / Details]           │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│           UPCOMING SCHEDULE SECTION          │
│        (if showSchedule is enabled)         │
│                                             │
│        "Upcoming Events" heading            │
│        List of upcoming events:             │
│          - Date | Title | Type              │
│          - Each links to event or external  │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│            SOCIAL LINKS SECTION              │
│                                             │
│        [Discord] [Twitter] [YouTube] ...    │
│        Icon + label, opens in new tab       │
│                                             │
├─────────────────────────────────────────────┤
│                  FOOTER                      │
│        Footer nav links                     │
│        "Powered by The Collective Hub"      │
│        Copyright / site name                │
└─────────────────────────────────────────────┘
```

---

## Section Details

### Nav Bar

- **Position:** Sticky top (optional, can be static)
- **Content:**
  - Site logo (or site name text if no logo)
  - Site name (hidden if logo is present and preferred)
  - Nav links from database (header position), ordered by `sortOrder`
- **Mobile:** Hamburger menu collapses nav links into a drawer or dropdown
- **Behavior:** External links open in new tab with `rel="noopener noreferrer"`

### Hero Section

- **Background:** Site background image (if set) with overlay/gradient for text readability. Falls back to background color.
- **Content:**
  - Site name (large heading, `h1`)
  - Tagline/subtitle (`p` or `h2`)
  - Primary CTA button (if button text and link are set)
- **Button styling:** Uses accent color. Links to Discord invite, event page, or any URL set by admin.
- **If no hero content is set:** Section collapses or shows a minimal version with just the site name.

### About / Intro Section

- **Content:** About text from settings. Plain text or basic Markdown rendered to HTML.
- **If empty:** Section is hidden entirely.
- **Styling:** Clean typography, max-width for readability (~65ch).

### Next Event Section

- **Visibility:** Only shown if `showNextEvent` is enabled AND at least one published event exists with a future `startTime`.
- **Content:** A single event card showing the soonest upcoming event.
  - Event title
  - Date and time (displayed in visitor's local timezone via client-side JS)
  - Short description (truncated)
  - Event type badge/chip
  - Location (if set)
  - Link: "Event Details" → external link or internal event page
- **If no upcoming events:** Optionally show "No upcoming events — check back soon!" or hide section.

### Upcoming Schedule Section

- **Visibility:** Only shown if `showSchedule` is enabled.
- **Content:** List of upcoming published events (excluding the one shown in "Next Event" if duplicate).
- **List format:**
  - Date (short format)
  - Event title
  - Event type icon or badge
  - Optional: time, location
- **Max items:** Configurable, e.g., show next 5 events with a "View all events" link if more exist.
- **If no events:** Hide the section.

### Social Links Section

- **Visibility:** Shown if any social links exist in the database.
- **Content:** Row of icon+label links for each social platform.
- **Icons:** Simple SVG icons or icon font. Recognizable platform icons (Discord, Twitter/X, YouTube, Twitch, GitHub, etc.).
- **Behavior:** All open in new tab.

### Footer

- **Content:**
  - Footer-position nav links (if any)
  - Optional: "Powered by The Collective Hub" credit
  - Site name / copyright
- **Styling:** Subtle, smaller text, subdued colors.

---

## Theme Rendering

The site's theme settings are applied via CSS custom properties on the root element:

```css
:root {
  --color-accent: #e63946;
  --color-background: #1a1a2e;
  --color-text: #eaeaea;
  --color-text-secondary: #b0b0b0;
  --font-family: 'Inter', sans-serif;
  /* derived values generated from presets if needed */
}
```

**Theme Presets:**
- **Dark:** Dark background, light text, accent color applied
- **Light:** Light background, dark text, accent color applied
- **Custom:** Owner sets each color manually

Presets provide sensible defaults for derived colors (card backgrounds, borders, muted text) so the owner only needs to pick 3 colors.

---

## States

| State | Behavior |
|-------|----------|
| **Loading** | Server-rendered, so no loading spinner on initial load. Fast. |
| **Empty site (no settings)** | Show site name from `sites` table. Everything else gracefully hidden. |
| **No events** | Hide event sections. |
| **No branding set** | Use neutral default colors (dark theme as fallback). |
| **Error (data fetch fails)** | Show a minimal page with site name. Log error server-side. Don't crash. |
| **Site deactivated** (`isActive=false`) | Show a simple "Site is currently unavailable" page with HTTP 503. |

---

## Responsive Behavior

- **Desktop (≥1024px):** Full layout as designed. Multi-column where appropriate.
- **Tablet (768-1023px):** Same layout, adjusted spacing. Nav may collapse.
- **Mobile (<768px):** Single column. Hamburger nav. Stacked sections. Larger touch targets for buttons.

---

## Performance Targets

- Server-rendered HTML (SSR) — no client-side rendering for public pages
- Minimal JavaScript — only for timezone conversion, mobile nav toggle
- Images from CDN with proper `width`/`height` and `loading="lazy"` on below-fold images
- No client-side data fetching for public pages (all data loaded server-side)

---

## What to Avoid

- **Animation-heavy designs.** Subtle transitions are fine; scroll-triggered animations are not needed.
- **Over-complicated layouts.** One column of stacked sections works well and is easy to maintain.
- **Custom fonts that hurt performance.** System font stack or a single web font (Inter) is sufficient.
- **Client-side routing for public pages.** The homepage is one page. If event detail pages are added later, they should be server-rendered too.
- **Assuming content exists.** Every section must handle the "nothing configured yet" case gracefully.
