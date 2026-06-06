# Project Brief — The Collective Hub

## What This Project Is

A reusable SvelteKit website template system that lets you launch simple, branded landing pages for online theater hosts, watch-party communities, bad movie groups, VR theater communities, Discord communities, and similar groups — all from one shared codebase.

One codebase. Multiple deployed websites. One database. One CDN.

## Who It's For

- **Primary user — David (system maintainer):** Deploys new sites, maintains the shared codebase, pushes updates that improve all sites at once. Has super admin access across all sites.
- **Site owners/admins:** Theater hosts, community organizers, watch-party runners. They log in via Discord, customize their site's branding and content through a simple admin panel.
- **Site visitors:** Community members and newcomers who want to see what the community is about, when events happen, and how to join.

## What Problem It Solves

Running multiple small community/theater websites usually means one of:
- A separate codebase per site (maintenance nightmare)
- A heavyweight SaaS platform (overkill for simple landing pages)
- A generic Linktree-style page (not customizable enough, doesn't feel owned)

The Collective Hub gives each community its own branded site without duplicating code or infrastructure.

## What the First Version Should Do

- Display a public homepage for a theater/community host
- Let the site owner log in via Discord
- Let the owner customize basic branding (name, logo, colors, tagline)
- Let the owner edit homepage content (intro text, button, links)
- Show basic event/schedule information
- Support multiple sites from one codebase using `SITE_SLUG`
- Share one Postgres database across all sites (data scoped by `siteId`)
- Share one CDN/storage bucket across all sites
- Full image upload flow with automatic webp conversion and optimization
- Asset library for browsing and managing uploaded files
- Super admin access for David across all sites via `SUPER_ADMIN_DISCORD_IDS`

## What It Should NOT Do Yet (Out of Scope for V1)

- Complex page builder or drag-and-drop editor
- User registration beyond admin login
- Comments, reviews, or community posts
- AI features, recommendations, or semantic search
- Per-site custom CSS or advanced theming
- Custom domain management UI (manual DNS/Coolify config is fine)
- Multi-owner invite system (single owner bootstrapped via env var)
- Recurring event schedules with complex timezone logic
- Super admin dashboard UI (super admin access exists, but the dedicated dashboard comes in Phase 4)

## Long-Term Vision

The system grows into a practical multi-tenant platform where:
- Any community host can have a full-featured site
- Owners can invite admins and editors
- Sites support events, schedules, content collections, and community features
- David has a full super admin dashboard for cross-site management
- The system remains maintainable by one person (David)
- Updates roll out to all sites from one codebase
- The architecture supports scaling to many sites without degradation

But version 1 intentionally starts small. A working, useful product beats an ambitious unfinished one.
