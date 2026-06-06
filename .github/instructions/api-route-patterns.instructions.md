---
description: 'Use when creating or modifying SvelteKit API endpoints (+server.ts) for The Collective Hub. Covers route conventions, authentication, validation, site scoping, and response formats.'
applyTo: 'src/routes/api/**/*.server.ts'
---

# API Route Patterns

## Route Structure

API routes live under `src/routes/api/`:

```
src/routes/api/
    auth/
        [...betterAuth]/     ← Better Auth handles this
    assets/
        +server.ts           ← Upload endpoint (POST)
```

Additional API endpoints should follow this pattern.

## Conventions

### File Naming

- API handlers go in `+server.ts` files
- All HTTP methods are exported as named functions: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`
- Co-located test files drop the `+` prefix: `server.test.ts`

### Response Format

All API responses use SvelteKit's `json()` helper:

```ts
import { json } from '@sveltejs/kit';

// Success
return json({ data: result });

// Created
return json({ data: newResource }, { status: 201 });

// Error
return json({ error: 'Resource not found' }, { status: 404 });
```

## Authentication

All API routes (except public ones) must check authentication:

```ts
import { json } from '@sveltejs/kit';

export async function POST({ locals, request }) {
    if (!locals.user) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Site scoping: always use locals.site.id
    const siteId = locals.site.id;

    // ... handler logic
}
```

## Site Scoping

Every API route that touches site-owned data must filter by `locals.site.id`:

```ts
import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { events } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET({ locals, url }) {
    const siteId = locals.site.id;

    const items = await db
        .select()
        .from(events)
        .where(
            and(
                eq(events.siteId, siteId),
                eq(events.isPublished, true)
            )
        )
        .orderBy(events.startTime);

    return json({ data: items });
}
```

## Validation

Validate request data on the server. Never trust client-provided data:

```ts
import { json } from '@sveltejs/kit';

export async function POST({ locals, request }) {
    if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { title, startTime } = body;

    // Manual validation
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
        return json({ error: 'Title is required' }, { status: 400 });
    }

    if (!startTime || isNaN(Date.parse(startTime))) {
        return json({ error: 'Valid start time is required' }, { status: 400 });
    }

    // ... proceed with valid data
}
```

For complex validation, consider using [Zod](https://zod.dev/) (add when validation complexity warrants it):

```ts
import { z } from 'zod';

const eventSchema = z.object({
    title: z.string().min(1).max(200),
    description: z.string().max(2000).optional(),
    startTime: z.string().datetime(),
    eventType: z.enum(['screening', 'watch_party', 'meetup', 'other']).optional(),
});

const result = eventSchema.safeParse(body);
if (!result.success) {
    return json({ error: result.error.flatten() }, { status: 400 });
}
```

## Asset Upload Endpoint

The asset upload endpoint is the primary use case for API routes (most admin mutations use form actions instead). See [`cdn-and-assets.instructions.md`](cdn-and-assets.instructions.md) for the full upload pattern.

## Form Actions vs API Routes

| Concern | Use Form Actions | Use API Routes |
|---------|-----------------|----------------|
| Admin data mutations (settings, branding, content) | ✅ Form actions in `+page.server.ts` | ❌ |
| File uploads | ❌ | ✅ `+server.ts` (multipart) |
| External API proxies | ❌ | ✅ `+server.ts` |
| Third-party webhooks | ❌ | ✅ `+server.ts` |

**Rule of thumb:** If the request comes from an admin page form, use form actions. If it comes from an external system or involves file upload, use API routes.

## Error Handling

```ts
import { json } from '@sveltejs/kit';

// 400 — Bad Request (validation)
return json({ error: 'Invalid input' }, { status: 400 });

// 401 — Unauthorized (not logged in)
return json({ error: 'Authentication required' }, { status: 401 });

// 403 — Forbidden (wrong role)
return json({ error: 'Insufficient permissions' }, { status: 403 });

// 404 — Not Found
return json({ error: 'Resource not found' }, { status: 404 });

// 500 — Server Error
try {
    // risky operation
} catch (err) {
    console.error('Failed to process request:', err);
    return json({ error: 'Internal server error' }, { status: 500 });
}
```
