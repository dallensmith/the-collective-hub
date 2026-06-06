---
description: 'Use when writing or editing SvelteKit server modules for The Collective Hub: load functions, form actions, API routes, hooks, or any server-side logic. Enforces environment variable safety, Drizzle database patterns, site context access, and form action conventions.'
applyTo: 'src/**/*.server.ts'
---

# Server Module Rules

## Environment Variables

Always use SvelteKit's env modules — never `process.env` directly.

| Scope  | Module                 | When to use                                                                |
| ------ | ---------------------- | -------------------------------------------------------------------------- |
| Secret | `$env/dynamic/private` | Runtime env evaluation — convenient in development; this project's default |
| Secret | `$env/static/private`  | Build-time inlining — preferred for production (faster, fails at build)    |
| Public | `$env/dynamic/public`  | Runtime env evaluation — use when env changes without rebuild              |
| Public | `$env/static/public`   | Build-time inlining — preferred for production                             |

```ts
// ✅ (this project's convention — runtime evaluation)
import { env } from '$env/dynamic/private';
const dbUrl = env.DATABASE_URL;

// ✅ (production-optimised alternative — build-time inlining)
import { DATABASE_URL } from '$env/static/private';

// ❌
const url = process.env.DATABASE_URL;
```

> **Why this project uses `$env/dynamic/private`**: The `dynamic` variant evaluates environment variables at runtime, which is convenient during development and when deploying to platforms where env vars aren't available at build time (e.g., ephemeral preview deployments). For production deployments where all env vars are known at build time, `$env/static/private` is preferred because it inlines values and fails early at build time on missing variables.

**Never** import any `$env/*/private` module from:

- `.svelte` component files
- `+page.ts` or `+layout.ts` (run on both server and client)
- Any module that may be imported client-side

## Drizzle Database Patterns

### Import
```ts
import { db } from '$lib/server/db';
import { eq, and, desc, asc, gte, lte } from 'drizzle-orm';
import { sites, users, memberships, siteSettings, assets, navLinks, socialLinks, events } from '$lib/server/db/schema';
```

### Querying with Site Scope

All queries must filter by `siteId` from `locals.site`:

```ts
import { eq, and, asc } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { events } from '$lib/server/db/schema';

const upcomingEvents = await db
    .select()
    .from(events)
    .where(
        and(
            eq(events.siteId, locals.site.id),
            eq(events.isPublished, true),
            gte(events.startTime, new Date())
        )
    )
    .orderBy(asc(events.startTime));
```

### Inserting
```ts
const [newEvent] = await db
    .insert(events)
    .values({
        siteId: locals.site.id,
        title: 'Bad Movie Night',
        startTime: new Date('2025-06-15T20:00:00Z'),
        isPublished: false,
    })
    .returning();
```

### Updating

**Never forget to scope updates by `siteId`:**

```ts
await db
    .update(events)
    .set({ title: 'Updated Title', isPublished: true })
    .where(
        and(
            eq(events.id, eventId),
            eq(events.siteId, locals.site.id)  // CRITICAL — prevents cross-site writes
        )
    );
```

### Deleting
```ts
await db
    .delete(events)
    .where(
        and(
            eq(events.id, eventId),
            eq(events.siteId, locals.site.id)
        )
    );
```

## Site Context Access

Server modules have access to the current site through `locals`:

| Property | Type | Description |
|----------|------|-------------|
| `locals.site` | `Site` | Current site record (id, slug, name, isActive) |
| `locals.siteSlug` | `string` | The `SITE_SLUG` env var value |
| `locals.siteSettings` | `SiteSettingsData` | Parsed settings JSON (branding, theme, homepage, layout) |
| `locals.user` | `User \| null` | Authenticated user or null |
| `locals.membership` | `Membership \| null` | User's role for this site or null |

```ts
export const load: PageServerLoad = async ({ locals }) => {
    const siteId = locals.site.id;
    const settings = locals.siteSettings;
    const userRole = locals.membership?.role;

    // Use site context to scope queries
    const navLinks = await db
        .select()
        .from(navLinksTable)
        .where(eq(navLinksTable.siteId, siteId))
        .orderBy(navLinksTable.sortOrder);

    return { navLinks, settings };
};
```

## Form Actions

```ts
import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request, locals }) => {
		if (!locals.user) redirect(302, '/login');

		const data = await request.formData();
		const name = data.get('name');

		if (!name || typeof name !== 'string') {
			return fail(422, { name, error: 'Name is required' });
		}

		// mutate...
		redirect(303, '/dashboard');
	}
};
```

- Return `fail(status, data)` for validation/business errors (client sees `form` prop)
- Use `redirect(303, path)` after successful mutations
- Use `error(status, message)` from `@sveltejs/kit` for unexpected/fatal errors

## Types

Always annotate `load` and `actions` with generated types from `./$types`:

```ts
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => { ... };
export const actions: Actions = { ... };
```
