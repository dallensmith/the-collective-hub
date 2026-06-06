---
description: 'Scaffold a new SvelteKit route with a server load function and Svelte 5 page component for The Collective Hub. Generates +page.server.ts (auth guard, site-scoped Drizzle query, typed return) and +page.svelte (runes, Tailwind layout).'
name: 'New Route'
argument-hint: "Route path and purpose (e.g. 'admin/events detail page' or 'public schedule page')"
agent: 'agent'
---

Scaffold a new SvelteKit route for: ${input}

Follow all conventions in:

- [multi-tenant-architecture.instructions.md](.github/instructions/multi-tenant-architecture.instructions.md)
- [auth-and-roles.instructions.md](.github/instructions/auth-and-roles.instructions.md)
- [svelte5.instructions.md](.github/instructions/svelte5.instructions.md)
- [server-ts.instructions.md](.github/instructions/server-ts.instructions.md)

## What to create

Determine the route path from the input (e.g. `admin/events` → `src/routes/admin/events/`).

### 1. `+page.server.ts`

```ts
import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { eq, and } from 'drizzle-orm';
import { /* yourTable */ } from '$lib/server/db/schema';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
    if (!locals.user) redirect(302, '/login');

    const siteId = locals.site.id;

    // Site-scoped query — always filter by siteId
    const items = await db
        .select()
        .from(/* yourTable */)
        .where(
            and(
                eq(/* yourTable */.siteId, siteId),
                // Add more filters as needed
            )
        )
        .orderBy(/* yourTable */.createdAt);

    return {
        items,
        settings: locals.siteSettings,
    };
};
```

- For **admin routes**, add a role check after the auth guard: `if (locals.membership?.role !== 'owner' && locals.membership?.role !== 'admin') redirect(302, '/admin');`
- For **public routes**, skip the auth guard entirely — just load data scoped by `siteId`
- Add `actions: Actions` only if the route has a form — skip it for read-only pages
- Use `fail` / `redirect` from `@sveltejs/kit` in actions per [server-ts.instructions.md](.github/instructions/server-ts.instructions.md)

### 2. `+page.svelte`

```svelte
<script lang="ts">
    import type { PageData } from './$types';
    let { data }: { data: PageData } = $props();
    let { items, settings } = data;
</script>

<div class="p-6">
    <h1 class="text-2xl font-bold"><!-- Page title --></h1>
    <!-- Render {items} here -->
</div>
```

- Use Svelte 5 runes throughout (`$props`, `$state`, `$derived`)
- Tailwind utility classes for layout (`p-6`, `flex`, `gap-4`, etc.)
- No `export let`, no `on:` directives, no `<slot>`

## After generating

List the files created and their paths. Ask if a form action should be added.
