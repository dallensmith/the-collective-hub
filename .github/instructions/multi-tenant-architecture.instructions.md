---
description: 'Use when understanding or modifying the multi-tenant architecture of The Collective Hub. Covers site resolution flow, data scoping rules, deployment model, migration safety, and environment variable conventions.'
applyTo: 'src/**/*.ts', 'src/**/*.svelte', 'docs/*.md'
---

# Multi-Tenant Architecture

## Overview

The Collective Hub is a **multi-tenant SvelteKit application**. One codebase powers multiple branded community/theater landing pages. Each deployment is differentiated only by its `SITE_SLUG` environment variable.

```
One Git Repo
    │
    ├── Coolify Deployment "bad-movies-theater"
    │   └── SITE_SLUG=bad-movies-theater
    │
    ├── Coolify Deployment "garbage-day"
    │   └── SITE_SLUG=garbage-day
    │
    └── Shared Infrastructure
        ├── PostgreSQL Database (all sites, scoped by siteId)
        └── CDN / Object Storage (all sites, scoped by path)
```

## Site Resolution Flow

Every request follows this path:

```
HTTP Request
    → hooks.server.ts (reads SITE_SLUG from env)
    → site-resolver.ts (queries DB for site + settings by slug)
    → event.locals.site / event.locals.siteSettings (attached for request lifetime)
    → App renders with site context
```

### Implementation

In [`src/hooks.server.ts`](src/hooks.server.ts):

```ts
const slug = env.SITE_SLUG;
const siteContext = await getSiteBySlug(slug);
event.locals.site = siteContext.site;
event.locals.siteSlug = slug;
event.locals.siteSettings = siteContext.settings;
```

In [`src/lib/server/site-resolver.ts`](src/lib/server/site-resolver.ts):

```ts
export async function getSiteBySlug(slug: string): Promise<SiteContext> {
    const [site] = await db.select().from(sites).where(eq(sites.slug, slug)).limit(1);
    // ...throws if not found
    const [settingsRow] = await db.select().from(siteSettings).where(eq(siteSettings.siteId, site.id)).limit(1);
    return { site, settings: (settingsRow?.settings ?? {}) };
}
```

### `locals` Typing

See [`src/app.d.ts`](src/app.d.ts) for the full `locals` type definition. Key properties:

| Property | Type | Description |
|----------|------|-------------|
| `locals.site` | `Site` | The current site record from the DB |
| `locals.siteSlug` | `string` | The `SITE_SLUG` env var value |
| `locals.siteSettings` | `SiteSettingsData` | Parsed settings JSON for the site |
| `locals.user` | `User \| null` | Authenticated user (or null for visitors) |
| `locals.membership` | `Membership \| null` | User's membership/role for this site |

## Data Scoping Rule

**Every site-owned record MUST include a `siteId` column.**

This applies to: `siteSettings`, `events`, `assets`, `navLinks`, `socialLinks`, `memberships`, and any future content types.

```sql
-- Always filter by siteId
SELECT * FROM events WHERE site_id = $currentSiteId ORDER BY start_time ASC;
```

In Drizzle:

```ts
const events = await db
    .select()
    .from(eventsTable)
    .where(
        and(
            eq(eventsTable.siteId, locals.site.id),
            eq(eventsTable.isPublished, true)
        )
    )
    .orderBy(asc(eventsTable.startTime));
```

**Consequences of this rule:**
- No cross-site data leaks
- Database is logically multi-tenant
- Future single-deployment/multi-domain model requires no schema changes

## Deployment Model

### Current: Multiple Coolify Deployments

Each Coolify deployment:
- Points to the same Git repo + branch
- Has its own set of environment variables
- Connects to the same database
- Uses the same CDN bucket
- Is completely isolated at the container level

### Future: Single Deployment / Multi-Domain (Optional)

If needed later, the system could switch to a single deployment that resolves the site by domain name instead of `SITE_SLUG`. The architecture supports this because all data is already scoped by `siteId`.

## Migration Safety

Multiple deployments sharing one database means migrations must be handled carefully:

- **Migrations run automatically on startup**, but only on the deployment with `RUN_MIGRATIONS=true`
- All other deployments (`RUN_MIGRATIONS=false`) skip migrations entirely
- **Exactly one deployment** must be designated the migration runner
- The migration runner must be deployed first when schema changes are included in a release
- This is enforced by convention (the `RUN_MIGRATIONS` flag), not by a distributed lock

```ts
// In hooks.server.ts — runs at module level, before any request
if (!building && env.RUN_MIGRATIONS === 'true') {
    await runMigrations();
}
```

## Environment Variables

Variables are classified as **shared** (same value for all deployments) or **per-site** (unique per deployment):

| Variable | Scope | Purpose |
|----------|-------|---------|
| `SITE_SLUG` | Per-site | Identifies which site this deployment serves |
| `PUBLIC_SITE_URL` | Per-site | Public URL, used for auth callbacks |
| `DATABASE_URL` | Shared | Postgres connection string |
| `BETTER_AUTH_SECRET` | Shared | Session signing key |
| `DISCORD_CLIENT_ID` | Shared | Discord OAuth app ID |
| `DISCORD_CLIENT_SECRET` | Shared | Discord OAuth app secret |
| `OWNER_DISCORD_ID` | Per-site | Discord user ID of the site owner |
| `SUPER_ADMIN_DISCORD_IDS` | Shared | Comma-separated super admin Discord IDs |
| `CDN_BASE_URL` | Shared | Base URL for CDN URLs |
| `RUN_MIGRATIONS` | Per-site (one `true`) | Whether this deployment runs migrations |

Full reference: [`docs/04-environment-variables.md`](docs/04-environment-variables.md)

## Key Risks

1. **Missing `siteId` on queries** — Use a query helper wrapper in Phase 2+ to enforce this at the type level
2. **Hardcoding CDN URLs** — Store only `cdnKey` paths in DB, construct full URLs with `CDN_BASE_URL`
3. **Site-specific conditionals** — Never write `if (site.slug === 'bad-movies-theater')`. All customization comes from DB settings
4. **Multiple migrations running** — Only one deployment should have `RUN_MIGRATIONS=true`

See [`docs/09-risks-and-rules.md`](docs/09-risks-and-rules.md) for the full risk assessment.
