# Decision Register — The Collective Hub

All key architectural and product decisions made during planning. This document serves as the authoritative record of what was decided and why.

---

## Auth & Discord

| # | Decision | Rationale |
|---|----------|-----------|
| Q1 | **One shared Discord OAuth app** for all sites in V1 | Simpler to manage. Works for up to ~10 sites before Discord's redirect URL limit becomes an issue. Each site's callback URL is added to the Discord app's redirect list. Switch to per-site apps later if needed. |
| Q2 | **Defer central auth domain** | Not needed for V1. Architecture supports adding it later. |

## Sites & Domains

| # | Decision | Rationale |
|---|----------|-----------|
| Q3 | **Support both custom domains and subdomains** | The app doesn't care what the URL is — it uses `PUBLIC_SITE_URL` from env vars. DNS and Coolify routing are manual per site. Each site runs in its own Coolify container. |
| Q4 | **No Host header validation in V1** | Each site is in its own container. Trust the `SITE_SLUG` env var. Add Host validation if moving to single-deployment multi-domain later. |

## Roles & Permissions

| # | Decision | Rationale |
|---|----------|-----------|
| Q5 | **Defer admin invites to Phase 5** | V1 has one owner per site bootstrapped via `OWNER_DISCORD_ID`. David has cross-site access via `SUPER_ADMIN_DISCORD_IDS`. The `memberships` table supports multiple members from day one — just no UI for it yet. |
| Q6 | **Multi-site membership with different roles** | Already baked into the schema. A user can be owner of one site and editor of another. No special handling needed. |

## Super Admin

| # | Decision | Rationale |
|---|----------|-----------|
| — | **`SUPER_ADMIN_DISCORD_IDS` env var** for cross-site super admin access | Comma-separated Discord user IDs. David (system maintainer) can access any site's admin panel. These IDs bypass site-scoped membership checks. A dedicated super admin dashboard is planned for Phase 4. |

## Content & Customization

| # | Decision | Rationale |
|---|----------|-----------|
| Q7 | **Single `jsonb` column for theme/site settings** | Simpler than separate columns or key-value tables. No migrations needed when adding new settings. Settings are always loaded as a batch — no need to query individual settings in SQL. |
| Q8 | **Fixed homepage fields for V1** | Hero title, about text, CTA button, etc. stored in settings JSON. Covers 90% of what theater sites need. A flexible `homepageSections` table is defined in the database plan as a future upgrade. |
| Q9 | **Basic Markdown for long text fields** | About text and event descriptions support headings, bold, italic, links, lists. No raw HTML passthrough for safety. Short fields (hero title, button text) are plain text only. |
| Q10 | **Customization checklist confirmed as drafted** | Name/tagline/logo/colors/hero/CTA/nav/social/theme presets in V1. No custom CSS, no extra layout presets, no custom fonts, no custom pages beyond homepage. |

### V1 Customization Scope (Q10 Detail)

| Feature | V1? | Phase |
|---------|-----|-------|
| Site name, tagline | ✅ Yes | Phase 1 |
| Logo, background image | ✅ Yes | Phase 2 (from asset library) |
| Accent/background/text colors | ✅ Yes | Phase 2 |
| Hero title, subtitle, about text | ✅ Yes | Phase 2 |
| CTA button text and link | ✅ Yes | Phase 2 |
| Nav links | ✅ Yes | Phase 2 |
| Social links | ✅ Yes | Phase 2 |
| Theme presets (dark/light) | ✅ Yes | Phase 2 |
| Custom CSS | ❌ No | Future |
| Multiple layout presets | ❌ No | One flexible layout |
| Custom fonts | ❌ No | System stack + Inter |
| Per-page customization | ❌ No | Homepage only |
| Custom pages beyond homepage | ❌ No | Future |

## Events

| # | Decision | Rationale |
|---|----------|-----------|
| Q11 | **No recurring events in V1** | V1 events are one-off. The `isRecurring` boolean is a placeholder. Recurring events add significant complexity (RRULE parsing, occurrence generation, timezone math). |
| Q12 | **UTC storage + client-side timezone conversion** | All event times stored as `timestamptz` in UTC. Event's intended timezone stored as a string. Public site converts to visitor's local time using `Intl.DateTimeFormat`. |

## Assets & CDN

| # | Decision | Rationale |
|---|----------|-----------|
| Q13 | **Full upload flow from day one** | No manual URL pasting. Admin uploads images through the app. Assets table tracks all files. CDN integration is Phase 1, not deferred. |
| Q14 | **Auto webp conversion and optimization on upload** | All uploaded images are converted to webp and optimized before storage. Uses `sharp` or similar for processing. Consistent format, smaller files, better performance. |

## Database & Operations

| # | Decision | Rationale |
|---|----------|-----------|
| Q15 | **Automated migrations, gated by `RUN_MIGRATIONS` env var** | Exactly one deployment (the "primary") has `RUN_MIGRATIONS=true` and runs migrations on startup. All others skip. This avoids migration collisions while eliminating manual steps. |
| Q16 | **Backups handled externally by David** | Not a code concern. David manages Postgres backups separately. |
| — | **Shared database with `siteId` scoping** | Confirmed after discussion. One Postgres database, all tables scoped by `siteId`. Simpler than per-site tables/schemas/databases. Enables super admin cross-site queries. |

## Project Identity

| # | Decision | Rationale |
|---|----------|-----------|
| Q17 | **Project name: The Collective Hub** | Chosen by David. Used for repo name, package name, documentation references, CDN bucket name, database name, and public references (e.g., Discord OAuth app name). |
