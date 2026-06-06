# The Collective Hub — Copilot Instructions

## Project Overview

**The Collective Hub** is a reusable SvelteKit website template system for launching branded landing pages for online theater hosts, watch-party communities, and Discord communities. One codebase → multiple deployed sites → one shared database + CDN.

**Core philosophy**: One codebase, multiple sites, no data leaks, maintainable by one person.

---

## File Structure Reference

```
.github/
  instructions/                     ← Development guidelines for The Collective Hub
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
  prompts/                          ← Scaffolding templates for routes, components, API, DB
    new-route.prompt.md
    generate-component-test.prompt.md
    generate-api-endpoint.prompt.md
    generate-admin-page.prompt.md
    generate-db-migration.prompt.md
    generate-svelte-component.prompt.md
    generate-seed-data.prompt.md
    test-coverage.prompt.md
  workflows/                        ← CI/CD and release automation
docs/                                 ← Architecture, database, roadmap, environment docs
src/                                  ← SvelteKit application
```

---

## Key Files to Read When Working on Specific Tasks

| When working on... | Read this first |
| ------------------ | --------------- |
| Understanding site resolution, data scoping, deployment model | [`multi-tenant-architecture.instructions.md`](.github/instructions/multi-tenant-architecture.instructions.md) |
| Database queries, schema changes, migrations | [`database-schema.instructions.md`](.github/instructions/database-schema.instructions.md) |
| Authentication, Discord OAuth, role-based access | [`auth-and-roles.instructions.md`](.github/instructions/auth-and-roles.instructions.md) |
| Deploying a new site, Docker, Coolify setup | [`deployment-guide.instructions.md`](.github/instructions/deployment-guide.instructions.md) |
| Admin panel pages, auth guards, form actions | [`admin-panel.instructions.md`](.github/instructions/admin-panel.instructions.md) |
| CDN storage, image upload, asset management | [`cdn-and-assets.instructions.md`](.github/instructions/cdn-and-assets.instructions.md) |
| Public landing page, theming, CSS custom properties | [`public-site-theming.instructions.md`](.github/instructions/public-site-theming.instructions.md) |
| API route conventions, validation, site scoping | [`api-route-patterns.instructions.md`](.github/instructions/api-route-patterns.instructions.md) |
| Writing tests with multi-tenant mocking patterns | [`testing-multi-tenant.instructions.md`](.github/instructions/testing-multi-tenant.instructions.md) |
| SvelteKit server-side code, Drizzle queries, form actions | [`server-ts.instructions.md`](.github/instructions/server-ts.instructions.md) |
| Svelte 5 runes, snippets, component patterns | [`svelte5.instructions.md`](.github/instructions/svelte5.instructions.md) |
| Tailwind CSS v4 styling | [`tailwindcss.instructions.md`](.github/instructions/tailwindcss.instructions.md) |
| Vitest + Playwright testing patterns | [`testing.instructions.md`](.github/instructions/testing.instructions.md) |

---

## Multi-Tenant Guidelines

### Site Resolution Flow

```
Request → hooks.server.ts (reads SITE_SLUG) → site-resolver.ts (queries DB by slug)
    → locals.site / locals.siteSettings → app renders with site context
```

### Data Scoping Rule

**Every table that owns site data must have a `siteId` column. Every query must filter by it.**

```ts
// ✅ Always filter by siteId
const items = await db
    .select()
    .from(events)
    .where(and(eq(events.siteId, locals.site.id), eq(events.isPublished, true)));
```

### CDN Key Rule

**Store CDN keys (paths) in the database, never full URLs.**

```ts
// Database stores: "sites/bad-movies-theater/logo.webp"
// Use cdnUrl() to get the full URL:
const url = cdnUrl(settings.branding.logoCdnKey);
```

### Auth Flow

- `OWNER_DISCORD_ID` — bootstraps the site owner on first login
- `SUPER_ADMIN_DISCORD_IDS` — comma-separated, grants cross-site access
- Roles: `owner` > `admin` > `editor`

---

## Tech Stack Instructions

The web application is a **SvelteKit** project with TypeScript, PostgreSQL, Drizzle ORM, Better Auth, Tailwind CSS v4, Vitest, and Playwright. When generating or modifying code, read the relevant instruction file for detailed conventions.

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
| [`bits-ui.instructions.md`](.github/instructions/bits-ui.instructions.md) | Bits UI headless component patterns |
| [`components.instructions.md`](.github/instructions/components.instructions.md) | Svelte 5 component architecture |
| [`icons.instructions.md`](.github/instructions/icons.instructions.md) | Lucide icon usage guidelines |
| [`server-ts.instructions.md`](.github/instructions/server-ts.instructions.md) | SvelteKit server-side TypeScript patterns |
| [`svelte-ts.instructions.md`](.github/instructions/svelte-ts.instructions.md) | Svelte 5 .svelte.ts reactive module patterns |
| [`svelte5.instructions.md`](.github/instructions/svelte5.instructions.md) | Svelte 5 runes, snippets, migrations |
| [`tailwindcss.instructions.md`](.github/instructions/tailwindcss.instructions.md) | Tailwind CSS v4 configuration |
| [`testing.instructions.md`](.github/instructions/testing.instructions.md) | Vitest + Playwright base testing patterns |

---

## Hard Rules

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
