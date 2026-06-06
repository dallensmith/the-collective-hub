# Identity Adaptation Plan: The Web Cooperative → The Collective Hub

> **Goal:** Rewrite all project identity files from "The Web Cooperative" (marketing agency for small businesses) to "The Collective Hub" (multi-tenant SvelteKit template system for theater/community landing pages).

---

## Table of Contents

1. [AGENTS.md — Master Rewrite](#1-agentsmd--master-rewrite)
2. [.github/copilot-instructions.md — Rewrite](#2-githubcopilot-instructionsmd--rewrite)
3. [.github/instructions/ — Instruction Files](#3-githubinstructions--instruction-files)
4. [.github/prompts/ — Prompt Templates](#4-githubprompts--prompt-templates)
5. [.github/workflows/ — CI/CD Workflows](#5-githubworkflows--cicd-workflows)
6. [Summary: Files to Create vs Keep vs Delete](#6-summary-files-to-create-vs-keep-vs-delete)
7. [Execution Order](#7-execution-order)

---

## 1. AGENTS.md — Master Rewrite

**Action:** Full rewrite (~90% new content, ~10% salvageable structure)

### Section-by-Section Plan

| Section | Current (The Web Cooperative) | Target (The Collective Hub) |
|---------|------------------------------|-----------------------------|
| **Title** | "The Web Cooperative — AI Agent Instructions" | "The Collective Hub — AI Agent Instructions" |
| **Section 1: Project Identity** | Marketing help for small businesses: jargon-free, practical | Multi-tenant SvelteKit website template system for launching branded landing pages for online theater hosts, watch-party communities, and Discord communities. One codebase → multiple deployed sites → one shared database + CDN. |
| **Section 2: Services Offered** | 7 subsections of marketing services (strategy, SEO, ads, AI automation, etc.) | Replace with **Platform Capabilities** covering: multi-deployment model, site resolution, admin panel, public site rendering, CDN/assets, auth/roles, events/scheduling, theming/branding |
| **Section 3: Target Audience** | Small business owners, local service providers | Replace with **three personas**: David (system maintainer), Site Owners (theater hosts), Site Visitors (community members) — each with distinct needs and access levels |
| **Section 4: Project Structure** | Old `src/` structure with EspoCRM, marketing components | Update directory tree to match actual codebase — reflect `hooks.server.ts`, `site-resolver.ts`, `db/` schema, admin routes, asset management, CDN helpers |
| **Section 5: How AI Agents Should Operate** | Marketing-focused: write for small biz owners, budget-conscious, content generation principles | **Rewrite for development context:** Follow architecture patterns (siteId scoping, multi-tenant queries), respect phase roadmap (Phase 1 first), never write site-specific conditionals, prefer JSON settings over migrations, maintain Docker/Coolify compatibility |
| **Section 6: Hard Rules** | 9 marketing rules (no jargon, budget-conscious, templates, etc.) | **Replace with 10 dev-hard-rules:** (1) Always filter by `siteId`, (2) Store CDN keys not URLs, (3) One deployment runs migrations, (4) No site-specific conditionals, (5) Never commit `.env`, (6) Use `$lib` aliases not relative imports, (7) Co-locate tests, (8) No `svelte-ignore` comments, (9) Prefer additive migrations, (10) Respect the phase roadmap |
| **Section 7: File Reference Index** | All marketing files + old tech references | Update to reference: new instructions, prompt templates, docs/, schema files, auth helpers, CDN utilities |
| **Section 8: Mode Responsibilities** | Marketing-focused mode descriptions | **Rewrite for dev context:** Architect plans multi-tenant architecture; Code builds SvelteKit routes, DB queries, admin pages; Debug troubleshoots multi-deploy issues, migration conflicts; Ask answers SvelteKit/Drizzle/Postgres questions |

### Specific Content Changes

- **Line 1-5**: Update `AGENTS.md` header with Collective Hub project config (add Drizzle, Better Auth, PostgreSQL to add-ons)
- **Line 9**: `# The Collective Hub — AI Agent Instructions`
- **Line 17-32**: Complete rewrite of project identity with multi-tenant description
- **Line 36-127**: Replace "Services Offered" with "Platform Capabilities" — describe the system's features (site resolution, admin panel, auth, CDN, events, theming)
- **Line 130-148**: Replace target audience with the three personas
- **Line 152-227**: Update project structure to match actual codebase (verified from `src/` listing)
- **Line 235-248**: Keep tech stack instruction references but update file references
- **Line 252-281**: Rewrite "How AI Agents Should Operate" for development — focus on architecture patterns, not marketing
- **Line 286-301**: Replace hard rules with multi-tenant development rules
- **Line 306-341**: File reference — remove all marketing file references, add new instruction/prompt files
- **Line 344-355**: Mode responsibilities — rewrite for platform development

### Attachments to File

Add link to key documentation:
- [`docs/00-project-brief.md`](docs/00-project-brief.md) — Project overview
- [`docs/01-architecture-plan.md`](docs/01-architecture-plan.md) — Architecture decisions
- [`docs/02-database-plan.md`](docs/02-database-plan.md) — Schema documentation
- [`docs/04-environment-variables.md`](docs/04-environment-variables.md) — Env var reference
- [`docs/09-risks-and-rules.md`](docs/09-risks-and-rules.md) — Critical risks to avoid

---

## 2. .github/copilot-instructions.md — Rewrite

**Action:** Full rewrite (~95% new content)

| Current | Target |
|---------|--------|
| The Web Cooperative — Copilot Instructions | The Collective Hub — Copilot Instructions |
| Marketing-focused overview and file structure | Multi-tenant platform overview, architecture principles, key file references |
| References to marketing instruction files | References to dev instruction files (multi-tenant architecture, DB schema, auth, deployment) |
| "When asked to..." table for marketing tasks | "When working on..." table for dev tasks (admin pages, API routes, DB queries, auth, assets) |

---

## 3. .github/instructions/ — Instruction Files

### 3A. Tech Instructions to KEEP (with minor updates)

These files are mostly project-agnostic and need only `applyTo` description updates and path fixes.

#### [`bits-ui.instructions.md`](.github/instructions/bits-ui.instructions.md) — Minor Update
- **Description**: Change "The Web Cooperative website" → "The Collective Hub platform"
- **Content**: Already generic — keep as-is. Just update the `description` frontmatter line.
- **Changes**: ~2 lines

#### [`components.instructions.md`](.github/instructions/components.instructions.md) — Minor Update
- **Description**: Change "The Web Cooperative website" → "The Collective Hub platform"
- **Folder structure**: Keep `ui/` and `layout/` pattern, but add note about admin components living in `src/routes/admin/`
- **Changes**: ~3 lines (description, add admin component note)

#### [`icons.instructions.md`](.github/instructions/icons.instructions.md) — Minor Update
- **Description**: Change "The Web Cooperative website" → "The Collective Hub platform"
- **Content**: Already generic — keep as-is
- **Changes**: ~1 line

#### [`svelte-ts.instructions.md`](.github/instructions/svelte-ts.instructions.md) — No Changes
- Already completely generic (no project-specific references)
- **Changes**: None

#### [`svelte5.instructions.md`](.github/instructions/svelte5.instructions.md) — Minor Update
- **Description**: Change "The Web Cooperative website" → "The Collective Hub platform"
- **Content**: Already generic — keep as-is
- **Changes**: ~1 line

#### [`tailwindcss.instructions.md`](.github/instructions/tailwindcss.instructions.md) — Minor Update
- **Description**: Change "The Web Cooperative website" → "The Collective Hub platform"
- **Path reference**: Update layout.css path if needed (currently references `src/routes/layout.css`)
- **Changes**: ~2 lines

#### [`testing.instructions.md`](.github/instructions/testing.instructions.md) — Moderate Update
- **Description**: Change "The Web Cooperative website" → "The Collective Hub platform"
- **Add**: Section on testing with multi-tenant context (mocking `locals.site`, `locals.siteSettings`, `siteId` filtering)
- **Add**: Note about testing admin auth guards
- **Keep**: All existing patterns (Vitest browser/node split, `expect.element`, co-location, requireAssertions)
- **Changes**: ~15-20 lines added

#### [`server-ts.instructions.md`](.github/instructions/server-ts.instructions.md) — Significant Update
- **Description**: Change from "The Web Cooperative website... EspoCRM API client" → "The Collective Hub platform... Drizzle schema, site resolver, auth patterns"
- **Replace Section "EspoCRM API Client"** with **"Drizzle Database Patterns"**:
  - Import `db` from `$lib/server/db`
  - Always filter by `siteId` from `locals`
  - Use `eq`, `and`, `desc` from `drizzle-orm`
  - Pattern: `const { site } = locals; const items = await db.select().from(table).where(eq(table.siteId, site.id));`
- **Replace Section "Form Actions"** with **"Admin Form Actions"**:
  - Auth guard first: `if (!locals.user) throw redirect(302, '/login');`
  - Validate before write
  - Use `fail` for validation errors
- **Add Section "Site Context Access"**:
  - `locals.site` — site record
  - `locals.siteSettings` — parsed settings JSON
  - `locals.user` — authenticated user (or null)
  - `locals.membership` — user's role for this site (or null)
- **Keep**: Env var rules (still valid), module sections
- **Changes**: ~50% of file rewritten

### 3B. [`docs-workflow.instructions.md`](.github/instructions/docs-workflow.instructions.md) — Complete Rewrite

Current: Legal documents workflow (master services agreement, privacy policy, etc.)
Target: Development documentation workflow

**New Content:**
- **Document Inventory**: Reference the docs/ folder files (00-09)
- **Source of Truth**: The docs/ `.md` files are authoritative
- **Update Workflow**: How to update architecture docs when decisions change
- **Phase Tracking**: How to mark phase deliverables as complete in roadmap
- **Template**: Standard doc format (title, purpose, decisions, risks)

### 3C. Marketing Instructions to REPLACE (9 files → 9 new dev instruction files)

| # | Old File | New File | Purpose |
|---|----------|----------|---------|
| 1 | `brand-voice.instructions.md` | `multi-tenant-architecture.instructions.md` | Site resolution, data scoping, deployment model, env vars |
| 2 | `copywriting.instructions.md` | `database-schema.instructions.md` | All tables, relationships, indexes, migration strategy |
| 3 | `seo.instructions.md` | `auth-and-roles.instructions.md` | Better Auth, Discord OAuth, role system, super admin |
| 4 | `local-seo.instructions.md` | `deployment-guide.instructions.md` | Coolify multi-deploy, Docker, migration runner, env setup |
| 5 | `social-media.instructions.md` | `admin-panel.instructions.md` | Admin layout, auth guards, form patterns, admin pages |
| 6 | `ad-copy.instructions.md` | `cdn-and-assets.instructions.md` | CDN helpers, image upload, webp conversion, URL construction |
| 7 | `ai-automation.instructions.md` | `public-site-theming.instructions.md` | SSR-only landing page, CSS custom properties, theme presets |
| 8 | `business-ops.instructions.md` | `api-route-patterns.instructions.md` | API route conventions, asset upload, event CRUD, validation |
| 9 | `tech-help.instructions.md` | `testing-multi-tenant.instructions.md` | Multi-tenant test patterns, mocking site context, auth testing |

#### New File Details

##### 1. [`multi-tenant-architecture.instructions.md`](.github/instructions/multi-tenant-architecture.instructions.md)

**Content:**
- Overview: One codebase, multiple Coolify deployments, one database + CDN
- Site resolution flow: `env.SITE_SLUG` → `hooks.server.ts` → `site-resolver.ts` → `locals.site`
- Data scoping rule: Every table has `siteId`, every query filters by it
- Deployment model diagram: Git repo → multiple Coolify deployments
- Migration safety: `RUN_MIGRATIONS` flag, exactly one deployment runs migrations
- Environment variable conventions (shared vs per-site)
- Risk reminders: No site-specific conditionals, no hardcoded CDN URLs

##### 2. [`database-schema.instructions.md`](.github/instructions/database-schema.instructions.md)

**Content:**
- Table reference: `sites`, `users`, `memberships`, `siteSettings`, `assets`, `navLinks`, `socialLinks`, `events`
- ER diagram (Mermaid)
- Key patterns: UUID PKs, snake_case columns, timestamps on every table
- Indexing rules: `siteId` indexed on every table, unique constraints
- JSON settings pattern: `siteSettings.settings` is a JSONB column
- Migration strategy: Additive only, one deployment runs migrations
- Drizzle patterns: How to write queries, schema definitions, typed inserts

##### 3. [`auth-and-roles.instructions.md`](.github/instructions/auth-and-roles.instructions.md)

**Content:**
- Better Auth with Discord OAuth setup
- Auth flow: Login → Discord redirect → callback → session creation
- Owner bootstrap: `OWNER_DISCORD_ID` env var
- Super admin: `SUPER_ADMIN_DISCORD_IDS` env var, cross-site access
- Role hierarchy: `owner` > `admin` > `editor`
- Auth guard patterns in `+layout.server.ts`
- `locals.user`, `locals.membership` — checking access in server code

##### 4. [`deployment-guide.instructions.md`](.github/instructions/deployment-guide.instructions.md)

**Content:**
- Coolify setup: One Git repo, multiple deployments
- Dockerfile build process
- Environment variable configuration per deployment
- Migration runner: Which deployment runs migrations, deploy order
- CDN storage configuration
- Adding a new site: Create DB row → deploy with new `SITE_SLUG` → set `OWNER_DISCORD_ID`
- Troubleshooting common deployment issues

##### 5. [`admin-panel.instructions.md`](.github/instructions/admin-panel.instructions.md)

**Content:**
- Admin route structure: `src/routes/admin/`
- Auth guard pattern in `+layout.server.ts`
- Admin layout shell with navigation
- Form action patterns: validate, save, redirect with flash
- Admin pages: settings, branding, homepage editor, links, events, assets
- Svelte 5 patterns in admin forms (two-way binding, `$bindable`, event handlers)

##### 6. [`cdn-and-assets.instructions.md`](.github/instructions/cdn-and-assets.instructions.md)

**Content:**
- CDN helper at `$lib/server/cdn.ts`
- URL construction: `CDN_BASE_URL + cdnKey`
- Upload flow: accept file → validate type/size → convert to webp (sharp) → upload to CDN → store record in `assets` table
- `cdnKey` convention: `sites/{siteSlug}/{type}/{filename}`
- Asset library browsing patterns
- Never store full URLs, only keys

##### 7. [`public-site-theming.instructions.md`](.github/instructions/public-site-theming.instructions.md)

**Content:**
- Public site: SSR-only single page, no client-side routing beyond initial load
- Section structure: `Hero → About → Events → Social Links → Footer`
- Theme system: CSS custom properties generated from `siteSettings.theme`
- Preset support: dark, light, custom presets
- Dynamic branding: logo, background image, favicon from CDN
- Layout presets (single layout for V1)

##### 8. [`api-route-patterns.instructions.md`](.github/instructions/api-route-patterns.instructions.md)

**Content:**
- SvelteKit `+server.ts` conventions
- API route structure: `src/routes/api/`
- Asset upload endpoint: multipart form, file validation, sharp conversion
- Event CRUD: list, create, update, delete with site scoping
- Form action alternatives (prefer form actions over API for admin)
- Authentication checks in API routes
- Response format conventions

##### 9. [`testing-multi-tenant.instructions.md`](.github/instructions/testing-multi-tenant.instructions.md)

**Content:**
- Testing with multi-tenant context: mocking `locals`
- Mocking the database: Drizzle mock patterns with `vi.hoisted`
- Testing auth guards: mock `locals.user`, `locals.membership`
- Testing site resolution: mock `getSiteBySlug` return values
- Testing admin form actions: `POST` to route, check redirects
- Testing API routes: mock file upload, verify CDN interaction
- Coverage targets for multi-tenant code paths

---

## 4. .github/prompts/ — Prompt Templates

### 4A. Tech Prompts to KEEP (with updates)

#### [`generate-api-test.prompt.md`](.github/prompts/generate-api-test.prompt.md) — Moderate Update
- **Description**: Already mentions "SvelteKit API handler"
- **Change**: Replace "The Web Cooperative project" → "The Collective Hub project"
- **Mocking patterns**: Update from generic to Collective Hub patterns (mock `$lib/server/db`, `$lib/server/cdn`, `$lib/server/auth`)
- **Add**: Multi-tenant test patterns (mock `locals.site`, test site-scoped queries)
- **Changes**: ~10-15 lines

#### [`generate-component-test.prompt.md`](.github/prompts/generate-component-test.prompt.md) — Minor Update
- **Description**: Replace "The Web Cooperative" → "The Collective Hub"
- **Content**: Likely already generic — verify and update project name references
- **Changes**: ~2-3 lines

#### [`new-route.prompt.md`](.github/prompts/new-route.prompt.md) — Moderate Update
- **Description**: Replace "The Web Cooperative website" → "The Collective Hub platform"
- **Auth guard pattern**: Update to use Collective Hub's `locals.site` and `locals.membership`
- **Load function template**: Add site-scoped query pattern
- **Add**: Note about admin routes vs public routes
- **Changes**: ~15 lines

#### [`test-coverage.prompt.md`](.github/prompts/test-coverage.prompt.md) — Moderate Update
- **Description**: Replace "The Web Cooperative" → "The Collective Hub"
- **Coverage targets**: Adjust for multi-tenant code paths
- **Focus areas**: Admin routes, API routes, site resolver, auth logic, DB queries
- **Changes**: ~10 lines

### 4B. Marketing Prompts to REPLACE (5 files → 5 new dev prompts)

| # | Old File | New File | Purpose |
|---|----------|----------|---------|
| 1 | `competitor-analysis.prompt.md` | `generate-admin-page.prompt.md` | Scaffold new admin page with auth guard, form, and save pattern |
| 2 | `generate-ad-copy.prompt.md` | `generate-db-migration.prompt.md` | Scaffold Drizzle migration for schema changes |
| 3 | `generate-seo-content.prompt.md` | `generate-api-endpoint.prompt.md` | Scaffold API route with auth, validation, site scoping |
| 4 | `generate-website-copy.prompt.md` | `generate-svelte-component.prompt.md` | Scaffold Svelte component with runes, Tailwind, snippets |
| 5 | `social-media-content.prompt.md` | `generate-seed-data.prompt.md` | Scaffold seed script for local dev and new site setup |

#### New Prompt Details

##### 1. [`generate-admin-page.prompt.md`](.github/prompts/generate-admin-page.prompt.md)

**Content:**
```markdown
Scaffold a new admin page for The Collective Hub at path `admin/{section}/`.

## What to create

### 1. `+page.server.ts`
- Auth guard: verify `locals.user` and `locals.membership` role
- Load current settings/data from DB scoped by `locals.site.id`
- Form actions: validate, save to DB, redirect with success message

### 2. `+page.svelte`
- Import types from `./$types`
- Use Svelte 5 runes: `$props()`, `$state()`, `$derived()`
- Form with Tailwind styling
- Save/cancel buttons
```

##### 2. [`generate-db-migration.prompt.md`](.github/prompts/generate-db-migration.prompt.md)

**Content:**
```markdown
Generate a Drizzle migration for The Collective Hub.

## Rules
- Additive changes only (new tables, new columns)
- Every new table must have a `siteId` foreign key
- Every new table must have UUID PK, createdAt, updatedAt
- Use `drizzle-kit generate` to create the SQL migration
- Update schema.ts first, then run generation
```

##### 3. [`generate-api-endpoint.prompt.md`](.github/prompts/generate-api-endpoint.prompt.md)

**Content:**
```markdown
Scaffold a SvelteKit API endpoint for The Collective Hub at `api/{resource}/`.

## What to create

### `+server.ts`
- Import `db` from `$lib/server/db`
- Access `locals.site` for site scoping
- All queries filter by `siteId`
- Auth check: `if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 })`
- Validate request body with Zod or manual checks
- Return `json()` responses
```

##### 4. [`generate-svelte-component.prompt.md`](.github/prompts/generate-svelte-component.prompt.md)

**Content:**
```markdown
Scaffold a Svelte 5 component for The Collective Hub.

## Conventions
- PascalCase filename
- `$lib/components/` path for shared components
- Route-level components stay in route directory
- Use `$props()` with inline type
- Use snippets over slots for composition
- Tailwind CSS for styling
- Lucide icons from `@lucide/svelte`
- No `svelte-ignore` comments
```

##### 5. [`generate-seed-data.prompt.md`](..github/prompts/generate-seed-data.prompt.md)

**Content:**
```markdown
Generate a seed script for The Collective Hub.

## What to create in `scripts/seed.mjs`

### Site Record
- Insert a site row with slug matching `SITE_SLUG` env var
- Name, isActive=true

### Site Settings
- Insert siteSettings row with default branding, theme, homepage JSON

### Default Data
- Optional default navLinks, socialLinks, sample events
- Only if the phase requires it
```

---

## 5. .github/workflows/ — CI/CD Workflows

### [`ci-web.yml`](.github/workflows/ci-web.yml) — Moderate Update

**Changes:**
1. **Title**: "CI" → "CI - The Collective Hub" (cosmetic)
2. **Env vars**: Add Collective Hub-specific stubs for build:
   - `SITE_SLUG=ci-test` (needed for build)
   - `OWNER_DISCORD_ID=000000000000000000` (stub)
   - `CDN_BASE_URL=http://cdn.example.com` (stub)
3. **Trigger paths**: Already correct (src/, package.json, etc.)
4. **Steps**: Add Docker build test stage:
   ```yaml
   - name: Build Docker image
     run: docker build -t collective-hub-ci .
   ```
5. **Coverage**: Already using vitest, keep as-is
6. **Markdown validation**: Keep but update config to exclude old marketing files

### [`release.yml`](.github/workflows/release.yml) — Minor Update

**Changes:**
1. **Line 63**: Change `## The Web Cooperative — ${{ steps.resolve.outputs.tag }}` → `## The Collective Hub — ${{ steps.resolve.outputs.tag }}`
2. **Tag prefix**: Optionally change `content/*` to `release/*` for conventional release tags (or keep `release/*` — discuss with David)

---

## 6. Summary: Files to Create vs Keep vs Delete

### Files to CREATE (new content, no existing version useful)

| # | File Path |
|---|-----------|
| 1 | `.github/instructions/multi-tenant-architecture.instructions.md` |
| 2 | `.github/instructions/database-schema.instructions.md` |
| 3 | `.github/instructions/auth-and-roles.instructions.md` |
| 4 | `.github/instructions/deployment-guide.instructions.md` |
| 5 | `.github/instructions/admin-panel.instructions.md` |
| 6 | `.github/instructions/cdn-and-assets.instructions.md` |
| 7 | `.github/instructions/public-site-theming.instructions.md` |
| 8 | `.github/instructions/api-route-patterns.instructions.md` |
| 9 | `.github/instructions/testing-multi-tenant.instructions.md` |
| 10 | `.github/prompts/generate-admin-page.prompt.md` |
| 11 | `.github/prompts/generate-db-migration.prompt.md` |
| 12 | `.github/prompts/generate-api-endpoint.prompt.md` |
| 13 | `.github/prompts/generate-svelte-component.prompt.md` |
| 14 | `.github/prompts/generate-seed-data.prompt.md` |

### Files to REWRITE (existing file, >70% new content)

| # | File Path | New Content % |
|---|-----------|---------------|
| 1 | `AGENTS.md` | ~90% |
| 2 | `.github/copilot-instructions.md` | ~95% |
| 3 | `.github/instructions/docs-workflow.instructions.md` | ~95% |
| 4 | `.github/instructions/server-ts.instructions.md` | ~50% (keep env var rules, replace EspoCRM sections) |

### Files to UPDATE (existing file, <30% new content)

| # | File Path | Changes |
|---|-----------|---------|
| 1 | `.github/instructions/bits-ui.instructions.md` | Update description line only |
| 2 | `.github/instructions/components.instructions.md` | Update description, add admin component note |
| 3 | `.github/instructions/icons.instructions.md` | Update description line |
| 4 | `.github/instructions/svelte5.instructions.md` | Update description line |
| 5 | `.github/instructions/tailwindcss.instructions.md` | Update description, path references |
| 6 | `.github/instructions/testing.instructions.md` | Add multi-tenant testing section |
| 7 | `.github/prompts/generate-api-test.prompt.md` | Update project name, mock patterns |
| 8 | `.github/prompts/generate-component-test.prompt.md` | Update project name |
| 9 | `.github/prompts/new-route.prompt.md` | Update auth guard, add site-scoped patterns |
| 10 | `.github/prompts/test-coverage.prompt.md` | Update project name, coverage targets |
| 11 | `.github/workflows/ci-web.yml` | Add build env stubs, Docker build test |
| 12 | `.github/workflows/release.yml` | Update release title |

### Files to DELETE (no longer relevant)

None — the old marketing files (`brand-voice.instructions.md`, `seo.instructions.md`, etc.) are being replaced by new files with different names. The old files must be **removed** to avoid confusion. This is a delete-then-create operation for 9 instructions + 5 prompts = 14 files to delete.

### Files to KEEP AS-IS

| # | File Path | Reason |
|---|-----------|--------|
| 1 | `.github/instructions/svelte-ts.instructions.md` | Already generic, no project references |

---

## 7. Execution Order

The work should be done in this order, grouped by dependency:

### Phase A: Foundation (parallel-safe)
1. Delete 9 old marketing instruction files
2. Delete 5 old marketing prompt files
3. Create 9 new instruction files (all independent, can be done in parallel)
4. Create 5 new prompt files (all independent, can be done in parallel)

### Phase B: Updates (depends on Phase A for context)
5. Update `server-ts.instructions.md` — needs to know new instruction file names for cross-references
6. Update `testing.instructions.md` — add multi-tenant patterns
7. Update 4 tech prompts (api-test, component-test, new-route, test-coverage)
8. Update `docs-workflow.instructions.md`

### Phase C: Master files (depends on Phase B for file references)
9. Rewrite `AGENTS.md` — references all instruction and prompt files
10. Rewrite `.github/copilot-instructions.md` — references all instruction files

### Phase D: CI/CD (independent)
11. Update `ci-web.yml`
12. Update `release.yml`

### Phase E: Cleanup
13. Run `svelte-check` to verify no broken imports
14. Run `vitest` to verify tests still pass
15. Verify markdown links are valid using `markdown-link-check`

---

## Appendix: File Content Comparison

### Old vs New: Brand Voice → Multi-Tenant Architecture

**Old (brand-voice.instructions.md):**
```
# Brand Voice & Tone Guidelines
## Voice Characteristics
- Direct, Honest, Practical, Plain language, Authoritative but approachable
## Tone Ladder
- Educational, Direct feedback, Supportive, Firm, Casual
```

**New (multi-tenant-architecture.instructions.md):**
```
# Multi-Tenant Architecture
## Site Resolution Flow
- env.SITE_SLUG → hooks.server.ts → site-resolver.ts → locals.site
## Data Scoping
- Every table has siteId, every query filters by it
## Deployment Model
- Git repo → multiple Coolify deployments → same Docker image
## Migration Safety
- RUN_MIGRATIONS flag, exactly one deployment runs migrations
## Environment Variables
- Shared vs per-site variable classification
```

### Old vs New: Copywriting → Database Schema

**Old (copywriting.instructions.md):**
```
# Copywriting Best Practices
- PAS formula, AIDA formula
- Feature-to-benefit mapping
- Headline templates, CTA formulas
```

**New (database-schema.instructions.md):**
```
# Database Schema
## Tables
- sites, users, memberships, siteSettings, assets, navLinks, socialLinks, events
## ER Diagram (Mermaid)
## Indexing Strategy
## Migration Patterns
## Query Examples
```

### Old vs New: SEO → Auth & Roles

**Old (seo.instructions.md):**
```
# SEO Content & Strategy Guidelines
- Keyword research
- On-page optimization
- Content structuring
```

**New (auth-and-roles.instructions.md):**
```
# Authentication & Roles
## Better Auth with Discord OAuth
## Auth Flow: Login → Callback → Session
## Owner Bootstrap (OWNER_DISCORD_ID)
## Super Admin (SUPER_ADMIN_DISCORD_IDS)
## Role Hierarchy: owner > admin > editor
## Auth Guard Patterns
```

---

> **End of Plan**
>
> This plan covers 35 files total: 14 new, 4 rewritten, 12 updated, 1 kept as-is, and 14 deleted.
