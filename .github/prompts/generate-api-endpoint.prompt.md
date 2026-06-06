---
description: 'Scaffold a new SvelteKit API endpoint (+server.ts) for The Collective Hub. Generates route handler with auth, site scoping, and validation patterns.'
agent: 'agent'
---

Scaffold a new API endpoint at `api/{resource}/` for The Collective Hub.

Follow all conventions in:
- [api-route-patterns.instructions.md](.github/instructions/api-route-patterns.instructions.md)
- [auth-and-roles.instructions.md](.github/instructions/auth-and-roles.instructions.md)
- [server-ts.instructions.md](.github/instructions/server-ts.instructions.md)

## What to Create

### `+server.ts`

Determine the HTTP methods needed (GET, POST, PUT, PATCH, DELETE) based on the resource.

```ts
import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { eq, and } from 'drizzle-orm';
import { /* yourTable */ } from '$lib/server/db/schema';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals, url }) => {
    if (!locals.user) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const siteId = locals.site.id;

    const items = await db
        .select()
        .from(/* yourTable */)
        .where(eq(/* yourTable */.siteId, siteId))
        .orderBy(/* yourTable */.createdAt);

    return json({ data: items });
};

export const POST: RequestHandler = async ({ locals, request }) => {
    if (!locals.user) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    // Validate body...

    const [created] = await db
        .insert(/* yourTable */)
        .values({
            siteId: locals.site.id,
            // ... validated fields
        })
        .returning();

    return json({ data: created }, { status: 201 });
};
```

## Notes

- Always check `locals.user` before accessing `locals.site`
- Always filter queries by `locals.site.id`
- Return appropriate HTTP status codes (200, 201, 400, 401, 403, 404, 500)
- For file uploads, use multipart form data via `request.formData()` instead of `request.json()`
