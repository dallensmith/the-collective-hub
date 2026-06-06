## Project Configuration

- **Language**: TypeScript
- **Package Manager**: npm
- **Runtime**: Node.js 22
- **Framework**: SvelteKit 2.8.1 + Svelte 5
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM 0.45 (with Kysely 0.29 as query builder)
- **Auth**: Better Auth 1.6 (Discord OAuth)
- **Image processing**: sharp 0.34
- **Dev tools**: prettier, eslint, vitest, playwright, tailwindcss v4
- **Deployment**: Coolify (multi-deploy), Docker
- **CDN**: Bunny CDN or S3-compatible
- **Add-ons**: mcp

---

# The Collective Hub — AI Agent Instructions

> **Single entry point for all AI assistants (Cline, Roo Code, Continue.dev, etc.) working on this project.**

---

## 1. Project Identity

**The Collective Hub** — A reusable SvelteKit website template system for launching branded landing pages for online theater hosts, watch-party communities, and Discord communities. One codebase → multiple deployed sites → one shared database + CDN.

We help community organizers look professional online, show their events, attract new members, and build a home for their community — without needing to build a website from scratch.

| Resource | Link |
| -------- | ---- |
| This file | [`AGENTS.md`](AGENTS.md) |
| Project brief | [`docs/00-project-brief.md`](docs/00-project-brief.md) |
| Architecture plan | [`docs/01-architecture-plan.md`](docs/01-architecture-plan.md) |
| Database plan | [`docs/02-database-plan.md`](docs/02-database-plan.md) |
| Feature roadmap | [`docs/03-feature-roadmap.md`](docs/03-feature-roadmap.md) |
| Environment variables | [`docs/04-environment-variables.md`](docs/04-environment-variables.md) |
| Admin UX plan | [`docs/05-admin-ux-plan.md`](docs/05-admin-ux-plan.md) |
| Public site UX plan | [`docs/06-public-site-ux-plan.md`](docs/06-public-site-ux-plan.md) |
| Development plan | [`docs/07-development-plan.md`](docs/07-development-plan.md) |
| Open questions | [`docs/08-open-questions.md`](docs/08-open-questions.md) |
| Risks and rules | [`docs/09-risks-and-rules.md`](docs/09-risks-and-rules.md) |
| Multi-tenant architecture | [`multi-tenant-architecture.instructions.md`](.github/instructions/multi-tenant-architecture.instructions.md) |
| Database schema | [`database-schema.instructions.md`](.github/instructions/database-schema.instructions.md) |
| Auth & roles | [`auth-and-roles.instructions.md`](.github/instructions/auth-and-roles.instructions.md) |
| Deployment guide | [`deployment-guide.instructions.md`](.github/instructions/deployment-guide.instructions.md) |
| Admin panel | [`admin-panel.instructions.md`](.github/instructions/admin-panel.instructions.md) |
| CDN & assets | [`cdn-and-assets.instructions.md`](.github/instructions/cdn-and-assets.instructions.md) |
| Public site theming | [`public-site-theming.instructions.md`](.github/instructions/public-site-theming.instructions.md) |
| API route patterns | [`api-route-patterns.instructions.md`](.github/instructions/api-route-patterns.instructions.md) |
| Testing (multi-tenant) | [`testing-multi-tenant.instructions.md`](.github/instructions/testing-multi-tenant.instructions.md) |

---

## 2. Platform Capabilities

### Core Platform

- **Multi-deployment model**: Each Coolify deployment runs the same Docker image; differentiated only by `SITE_SLUG` env var
- **Data scoping**: Every table has `siteId` — multi-tenant from day one
- **Site resolution**: [`hooks.server.ts`](src/hooks.server.ts) → [`site-resolver.ts`](src/lib/server/site-resolver.ts) → `locals.site` for all downstream code
- **Auth**: Owner bootstrap via `OWNER_DISCORD_ID`; super admin via `SUPER_ADMIN_DISCORD_IDS`; roles: owner/admin/editor
- **CDN**: Database stores only CDN keys (paths); full URLs constructed via `CDN_BASE_URL` env var
- **Image processing**: Automatic webp conversion + optimization via sharp on upload

### Admin Panel

- **Settings**: Edit site name, tagline, and general configuration
- **Branding**: Upload logo, background image, favicon; select color theme
- **Homepage editor**: Hero title, subtitle, about text, CTA button text/link
- **Links manager**: Add/edit/delete/reorder nav links and social links
- **Events manager**: Create, edit, publish/unpublish events with timezone support
- **Asset library**: Browse, upload, and manage media files with CDN URL copying

### Public Site

- **SSR-only single landing page**: Hero → About → Events → Social Links → Footer
- **Theme-aware**: CSS custom properties generated from site settings (dark/light/custom presets)
- **Responsive**: Works on mobile and desktop without client JS
- **Accessible**: Proper heading hierarchy, alt text, sufficient contrast

### Infrastructure

- **Coolify multi-deploy**: One Git repo, multiple deployments, shared database
- **Docker containerized**: Multi-stage Dockerfile, deployed via Coolify
- **Migration safety**: One deployment runs migrations (`RUN_MIGRATIONS=true`); others skip
- **Shared CDN**: Single bucket, site-scoped paths (`sites/{siteSlug}/...`)

---

## 3. Target Audience

### David (System Maintainer)

- Deploys new sites, maintains the shared codebase, pushes updates
- Has super admin access across all sites via `SUPER_ADMIN_DISCORD_IDS`
- Needs: reliable deployment process, clean migration strategy, maintainable code

### Site Owners (Theater Hosts / Community Organizers)

- Log in via Discord, customize their site through the admin panel
- Non-technical but motivated — need a simple, intuitive admin UI
- Needs: change branding, edit content, manage events, upload images

### Site Visitors (Community Members & Newcomers)

- Visit the public landing page to learn about the community
- Want to see what the community is about, when events happen, how to join
- Needs: fast-loading page, clear info, easy access to Discord/social links

---

## 4. Project Structure

```
.roo/
  skills/                   ← Roo Code skills for scaffolding and automation
    admin-page/
    api-endpoint/
    db-migration/
    generate-api-test/
    generate-component-test/
    new-component/
    new-route/
    run-tests/
    test-coverage/
.github/
  instructions/             ← Development guidelines for The Collective Hub
    multi-tenant-architecture.instructions.md
    database-schema.instructions.md
    auth-and-roles.instructions.md
    deployment-guide.instructions.md
    admin-panel.instructions.md
    cdn-and-assets.instructions.md
    public-site-theming.instructions.md
    api-route-patterns.instructions.md
    testing-multi-tenant.instructions.md
    bits-ui.instructions.md
    components.instructions.md
    icons.instructions.md
    server-ts.instructions.md
    svelte-ts.instructions.md
    svelte5.instructions.md
    tailwindcss.instructions.md
    testing.instructions.md
  prompts/                  ← Scaffolding templates for routes, components, API, DB
    new-route.prompt.md
    generate-component-test.prompt.md
    generate-api-endpoint.prompt.md
    generate-admin-page.prompt.md
    generate-db-migration.prompt.md
    generate-svelte-component.prompt.md
    generate-seed-data.prompt.md
    test-coverage.prompt.md
  workflows/                ← CI/CD and release automation
docs/                         ← Architecture, database, roadmap, environment docs
 00-project-brief.md
 01-architecture-plan.md
 02-database-plan.md
 03-feature-roadmap.md
 04-environment-variables.md
 05-admin-ux-plan.md
 06-public-site-ux-plan.md
 07-development-plan.md
 08-open-questions.md
 09-risks-and-rules.md
drizzle/                      ← Drizzle migration files
scripts/
  seed.mjs                    ← Database seed script for local dev
src/
  app.d.ts                    ← App types, locals augmentation
  app.html                    ← HTML shell
  hooks.server.ts             ← Site resolver + auth + migration runner
  lib/
    server/
      auth.ts                 ← Better Auth configuration
      cdn.ts                  ← CDN URL helpers
      site-resolver.ts        ← Site loading by SITE_SLUG
      db/
        index.ts              ← Drizzle + postgres connection
        schema.ts             ← All table definitions
        seed.ts               ← Optional seed data
        migrate.ts            ← Migration runner
    shared/
      types.ts                ← Shared TypeScript types (SiteSettingsData, SiteContext, etc.)
  routes/
    +layout.server.ts         ← Root layout, loads site for all pages
    +layout.svelte            ← Root layout shell
    +page.server.ts           ← Public homepage data loading
    +page.svelte              ← Public homepage
    login/
      +page.svelte            ← Login page (Discord redirect)
    admin/
      +layout.server.ts       ← Admin auth guard
      +layout.svelte          ← Admin shell/nav
      +page.svelte            ← Admin dashboard
      settings/
        +page.server.ts       ← Site settings editor
        +page.svelte
      branding/
        +page.server.ts       ← Logo, colors, theme
        +page.svelte
      assets/
        +page.server.ts       ← Asset library
        +page.svelte
    api/
      assets/
        +server.ts            ← Upload endpoint
static/                       ← Favicon
```

> The [`.roo/skills/`](.roo/skills/) directory contains reusable skills for common development tasks — scaffolding admin pages, API endpoints, database migrations, components, routes, and generating tests. These are auto-detected by Roo Code when running in this project.

### Tech Stack Instructions

The repo includes development guidelines for the web application's tech stack:

| File | Purpose |
| ---- | ------- |
| [`multi-tenant-architecture.instructions.md`](.github/instructions/multi-tenant-architecture.instructions.md) | Site resolution, data scoping, deployment model, env vars |
| [`database-schema.instructions.md`](.github/instructions/database-schema.instructions.md) | All tables, relationships, indexes, migration strategy |
| [`auth-and-roles.instructions.md`](.github/instructions/auth-and-roles.instructions.md) | Better Auth, Discord OAuth, role system, super admin |
| [`deployment-guide.instructions.md`](.github/instructions/deployment-guide.instructions.md) | Coolify multi-deploy, Docker, migration runner, env setup |
| [`admin-panel.instructions.md`](.github/instructions/admin-panel.instructions.md) | Admin layout, auth guards, form patterns, admin pages |
| [`cdn-and-assets.instructions.md`](.github/instructions/cdn-and-assets.instructions.md) | CDN helpers, image upload, webp conversion, URL construction |
| [`public-site-theming.instructions.md`](.github/instructions/public-site-theming.instructions.md) | SSR-only landing page, CSS custom properties, theme presets |
| [`api-route-patterns.instructions.md`](.github/instructions/api-route-patterns.instructions.md) | API route conventions, asset upload, event CRUD, validation |
| [`testing-multi-tenant.instructions.md`](.github/instructions/testing-multi-tenant.instructions.md) | Multi-tenant test patterns, mocking site context, auth testing |
| [`bits-ui.instructions.md`](.github/instructions/bits-ui.instructions.md) | Component patterns for bits-ui library |
| [`components.instructions.md`](.github/instructions/components.instructions.md) | Svelte 5 component architecture and conventions |
| [`icons.instructions.md`](.github/instructions/icons.instructions.md) | Lucide icon usage guidelines |
| [`server-ts.instructions.md`](.github/instructions/server-ts.instructions.md) | SvelteKit server-side TypeScript patterns, Drizzle queries |
| [`svelte-ts.instructions.md`](.github/instructions/svelte-ts.instructions.md) | TypeScript conventions for Svelte projects |
| [`svelte5.instructions.md`](.github/instructions/svelte5.instructions.md) | Svelte 5 runes, snippets, and migrations |
| [`tailwindcss.instructions.md`](.github/instructions/tailwindcss.instructions.md) | Tailwind CSS v4 configuration and patterns |
| [`testing.instructions.md`](.github/instructions/testing.instructions.md) | Vitest + Playwright testing patterns |

> **Svelte 5 note:** `<svelte:component>` is deprecated. Use `{@const ComponentVar = ...}` in the template and render it as `<ComponentVar />` instead. See [`svelte5.instructions.md`](.github/instructions/svelte5.instructions.md#deprecated-apis) for details and migration examples.

---

## 5. How AI Agents Should Operate

This section defines how AI agents (Cline, Roo Code, Copilot, etc.) should work within this development context.

### Follow the Architecture

- **Always scope queries by `siteId`**. Every database query that touches site-owned data must filter by `siteId` from `locals.site`. Missing a `siteId` filter is the most common multi-tenant bug.
- **Respect the phase roadmap**. Phase 1 (Foundation) must be complete before Phase 2 starts. Don't build features from Phase 3+ before the core works. See [`docs/03-feature-roadmap.md`](docs/03-feature-roadmap.md).
- **Use the correct env pattern**. Server-side secret env vars use `$env/dynamic/private`. Never import private env modules from client-side code.
- **Store CDN keys, not URLs**. Database fields like `cdnKey` store paths (e.g., `sites/bad-movies-theater/logo.webp`), never full URLs. Use the `cdnUrl()` helper from [`src/lib/server/cdn.ts`](src/lib/server/cdn.ts) to construct full URLs.

### Stay On-Architecture

- **No site-specific conditionals**. Never write `if (site.slug === 'bad-movies-theater')`. All customization comes from database settings (branding, theme, homepage content).
- **Prefer JSON settings over migrations**. Adding a setting to the `siteSettings.settings` JSON column requires no database migration. Only create new tables/tables for structured data that needs indexes, foreign keys, or complex queries.
- **One layout in V1**. Don't create multiple layout options. One clean, flexible layout that adapts to content is better than three half-baked options.
- **Additive migrations only**. In production, always use additive changes (new columns, new tables). Avoid renames or destructive operations.

### Development Principles

- **Code for the shared codebase**. Every feature should work for all sites. If a feature is only useful for one site, reconsider whether it belongs in the shared codebase.
- **Keep the admin panel simple**. The admin exists to serve the public page. Don't build complex admin UIs before the public rendering works.
- **Security is everyone's responsibility**. Sanitize file uploads, validate all form input server-side, never expose private env vars to the client, protect against XSS in rendered content.
- **Test the boundary conditions**. Test with no data (empty site), test with missing settings, test with inactive sites, test with various role levels.

### When Creating Templates

- Use clear `[placeholders]` for variables that the developer must customize
- Include a brief example filled out so they see the expected pattern
- Reference the relevant instruction file for detailed conventions

---

## 6. Hard Rules (Non-Negotiable)

1. **Always filter by `siteId`.** Every Drizzle query on site-owned data must include a `siteId` filter. Missing this is the most common multi-tenant bug and causes data leaks between sites.

2. **Store CDN keys, not full URLs.** Database fields store paths like `sites/{slug}/logo.webp`. The `cdnUrl()` helper constructs full URLs using `CDN_BASE_URL`. Never store a full URL in the database.

3. **One deployment runs migrations.** Only the deployment with `RUN_MIGRATIONS=true` runs database migrations. Deploy this one first when schema changes are included in a release.

4. **No site-specific conditional logic.** Never write `if (site.slug === 'some-site')`. All per-site differences come from database settings. If a site genuinely needs a unique feature, build it as a configurable option for all sites.

5. **Never commit `.env` files.** Environment variables are configured per-deployment in Coolify. The `.env` file is in `.gitignore` and must never be committed.

6. **Use `$lib` aliases, not relative paths.** Always import from `$lib/server/db`, `$lib/components/`, etc. Never use relative imports like `../../lib/server/db`.

7. **Co-locate tests.** Test files go next to the source they test. Server tests use `.test.ts`, browser component tests use `.svelte.test.ts`.

8. **No `svelte-ignore` suppression comments.** All accessibility and type issues must be fixed properly. Never hide a warning behind a suppression comment.

9. **Prefer additive migrations.** In production, add new columns and tables. Avoid destructive operations (ALTER DROP, RENAME). JSON settings columns reduce migration frequency.

10. **Respect the phase roadmap.** Phase 1 must be fully working (public site + admin login + settings save) before Phase 2. A working simple site is more valuable than a half-built complex one.

---

## 7. File Reference Index

| File | Purpose |
| ---- | ------- |
| [`AGENTS.md`](AGENTS.md) | This file — master instructions for all AI agents working on The Collective Hub project |
| [`.github/copilot-instructions.md`](.github/copilot-instructions.md) | Copilot-specific instructions for development tasks |
| [`docs/00-project-brief.md`](docs/00-project-brief.md) | Project overview — what The Collective Hub is and who it's for |
| [`docs/01-architecture-plan.md`](docs/01-architecture-plan.md) | Technical architecture — stack, site resolution, deployment model |
| [`docs/02-database-plan.md`](docs/02-database-plan.md) | Database schema — all tables, relationships, migration strategy |
| [`docs/03-feature-roadmap.md`](docs/03-feature-roadmap.md) | Development phases and feature priorities across the roadmap |
| [`docs/04-environment-variables.md`](docs/04-environment-variables.md) | Environment variable reference — shared vs per-site |
| [`docs/05-admin-ux-plan.md`](docs/05-admin-ux-plan.md) | Admin panel user experience design and layout |
| [`docs/06-public-site-ux-plan.md`](docs/06-public-site-ux-plan.md) | Public site user experience and page structure |
| [`docs/07-development-plan.md`](docs/07-development-plan.md) | Step-by-step development plan and implementation order |
| [`docs/08-open-questions.md`](docs/08-open-questions.md) | Open design questions and pending decisions |
| [`docs/09-risks-and-rules.md`](docs/09-risks-and-rules.md) | Critical risks and design pitfalls to avoid |
| [`.github/instructions/multi-tenant-architecture.instructions.md`](.github/instructions/multi-tenant-architecture.instructions.md) | Site resolution flow, data scoping, deployment model |
| [`.github/instructions/database-schema.instructions.md`](.github/instructions/database-schema.instructions.md) | All tables, relationships, Drizzle query patterns |
| [`.github/instructions/auth-and-roles.instructions.md`](.github/instructions/auth-and-roles.instructions.md) | Better Auth, Discord OAuth, roles, auth guards |
| [`.github/instructions/deployment-guide.instructions.md`](.github/instructions/deployment-guide.instructions.md) | Coolify multi-deploy, Docker, migration runner |
| [`.github/instructions/admin-panel.instructions.md`](.github/instructions/admin-panel.instructions.md) | Admin routes, auth guards, form actions |
| [`.github/instructions/cdn-and-assets.instructions.md`](.github/instructions/cdn-and-assets.instructions.md) | CDN helpers, upload flow, sharp processing |
| [`.github/instructions/public-site-theming.instructions.md`](.github/instructions/public-site-theming.instructions.md) | SSR page, CSS custom properties, theme system |
| [`.github/instructions/api-route-patterns.instructions.md`](.github/instructions/api-route-patterns.instructions.md) | API route conventions, validation, site scoping |
| [`.github/instructions/testing-multi-tenant.instructions.md`](.github/instructions/testing-multi-tenant.instructions.md) | Multi-tenant test patterns, mocking, auth testing |
| [`.github/instructions/bits-ui.instructions.md`](.github/instructions/bits-ui.instructions.md) | Bits UI headless component patterns |
| [`.github/instructions/components.instructions.md`](.github/instructions/components.instructions.md) | Svelte 5 component architecture |
| [`.github/instructions/icons.instructions.md`](.github/instructions/icons.instructions.md) | Lucide icon usage guidelines |
| [`.github/instructions/server-ts.instructions.md`](.github/instructions/server-ts.instructions.md) | SvelteKit server-side TypeScript patterns |
| [`.github/instructions/svelte-ts.instructions.md`](.github/instructions/svelte-ts.instructions.md) | Svelte 5 .svelte.ts reactive module patterns |
| [`.github/instructions/svelte5.instructions.md`](.github/instructions/svelte5.instructions.md) | Svelte 5 runes, snippets, migrations |
| [`.github/instructions/tailwindcss.instructions.md`](.github/instructions/tailwindcss.instructions.md) | Tailwind CSS v4 configuration |
| [`.github/instructions/testing.instructions.md`](.github/instructions/testing.instructions.md) | Vitest + Playwright base testing patterns |
| [`.github/prompts/new-route.prompt.md`](.github/prompts/new-route.prompt.md) | Scaffold new SvelteKit routes with auth + site-scoped queries |
| [`.github/prompts/generate-component-test.prompt.md`](.github/prompts/generate-component-test.prompt.md) | Generate Vitest browser component tests |
| [`.github/prompts/test-coverage.prompt.md`](.github/prompts/test-coverage.prompt.md) | Analyse coverage gaps and generate missing tests |
| [`.github/prompts/generate-admin-page.prompt.md`](.github/prompts/generate-admin-page.prompt.md) | Scaffold admin page with auth guard + form |
| [`.github/prompts/generate-db-migration.prompt.md`](.github/prompts/generate-db-migration.prompt.md) | Scaffold Drizzle migration for schema changes |
| [`.github/prompts/generate-api-endpoint.prompt.md`](.github/prompts/generate-api-endpoint.prompt.md) | Scaffold API route with auth + site scoping |
| [`.github/prompts/generate-svelte-component.prompt.md`](.github/prompts/generate-svelte-component.prompt.md) | Scaffold Svelte 5 component with runes + Tailwind |
| [`.github/prompts/generate-seed-data.prompt.md`](.github/prompts/generate-seed-data.prompt.md) | Scaffold seed script for local dev |
| [`.github/workflows/`](.github/workflows/) | CI/CD and release automation |
| [`src/lib/server/site-resolver.ts`](src/lib/server/site-resolver.ts) | Site loading by SITE_SLUG — core multi-tenant logic |
| [`src/lib/server/auth.ts`](src/lib/server/auth.ts) | Better Auth with Discord OAuth configuration |
| [`src/lib/server/cdn.ts`](src/lib/server/cdn.ts) | CDN URL construction helpers |
| [`src/lib/server/db/schema.ts`](src/lib/server/db/schema.ts) | All Drizzle table definitions |
| [`src/lib/server/db/index.ts`](src/lib/server/db/index.ts) | Drizzle + postgres connection |
| [`src/lib/shared/types.ts`](src/lib/shared/types.ts) | SiteSettingsData, SiteContext, shared types |
| [`scripts/seed.mjs`](scripts/seed.mjs) | Database seed script for local dev |
| [`Dockerfile`](Dockerfile) | Multi-stage Docker build |
| [`docker-compose.yml`](docker-compose.yml) | Local development with Postgres |

---

## 8. Mode Responsibilities

This section maps AI agent operating modes to development tasks within The Collective Hub context.

| Mode | How It's Used Here |
| ---- | ------------------ |
| **🪃 Orchestrator** | Breaks down multi-tenant features into discrete tasks; coordinates site resolution, auth integration, admin panel work, and CDN setup; delegates research, implementation, and review stages across phases |
| **🏗️ Architect** | Plans technical architecture for multi-tenant features: site resolution flow, database schema additions, admin panel structure, deployment strategy, CDN integration patterns; creates technical specifications for new features |
| **💻 Code** | Builds and maintains the SvelteKit platform; implements Drizzle queries, admin form actions, public site rendering, auth guards, CDN upload flows; writes Vitest tests with multi-tenant mocking patterns |
| **❓ Ask** | Answers development questions about the codebase; explains multi-tenant architecture patterns (e.g., "how does site resolution work?"); provides recommendations on Drizzle queries, SvelteKit patterns, Postgres optimization |
| **🪲 Debug** | Troubleshoots multi-tenant issues (data leaks between sites, wrong site context, auth failures); diagnoses deployment problems (migration conflicts, env var misconfiguration, CDN URL issues); investigates database query performance |

---

> **For new AI agents**: Start by reading the relevant instruction file linked in [Section 7](#7-file-reference-index) above based on your task. When in doubt about architecture or patterns, review the multi-tenant architecture guidelines in [`multi-tenant-architecture.instructions.md`](.github/instructions/multi-tenant-architecture.instructions.md) and the risks document in [`docs/09-risks-and-rules.md`](docs/09-risks-and-rules.md). The core philosophy of this project is simple: one codebase, multiple sites, no data leaks, maintainable by one person.
