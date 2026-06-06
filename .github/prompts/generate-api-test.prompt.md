---
description: 'Generate Vitest server tests for SvelteKit +server.ts API routes in The Collective Hub. Covers multi-tenant mocking, Drizzle database mocking, Better Auth / Discord OAuth mocking, form action testing, and API route test patterns.'
agent: 'agent'
---

Generate Vitest server tests for a SvelteKit API route (`+server.ts`) in The Collective Hub.

Follow all testing conventions in:
- [testing-multi-tenant.instructions.md](.github/instructions/testing-multi-tenant.instructions.md)
- [testing.instructions.md](.github/instructions/testing.instructions.md)
- [api-route-patterns.instructions.md](.github/instructions/api-route-patterns.instructions.md)
- [server-ts.instructions.md](.github/instructions/server-ts.instructions.md)

## What to Create

### Test file placement

Place the test file next to the source, dropping the `+` prefix:

| Source file | Test file |
| ----------- | --------- |
| `src/routes/api/contact/+server.ts` | `src/routes/api/contact/server.test.ts` |
| `src/routes/api/events/+server.ts` | `src/routes/api/events/server.test.ts` |
| `src/routes/admin/settings/+page.server.ts` | `src/routes/admin/settings/page.server.test.ts` |

> SvelteKit errors on `+server.test.ts` at build time, so drop the `+` prefix for route test files.

### Basic test template

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './+server';
import type { RequestEvent } from '@sveltejs/kit';

// --- MOCKS ---

const { mockSelect, mockInsert, mockUpdate, mockDelete } = vi.hoisted(() => ({
    mockSelect: vi.fn(),
    mockInsert: vi.fn(),
    mockUpdate: vi.fn(),
    mockDelete: vi.fn(),
}));

vi.mock('$lib/server/db', () => ({
    db: {
        select: mockSelect,
        insert: mockInsert,
        update: mockUpdate,
        delete: mockDelete,
    },
}));

// --- HELPERS ---

const mockSite = {
    id: 'test-site-uuid',
    slug: 'test-site',
    name: 'Test Site',
    isActive: true,
};

function createMockLocals(overrides: Partial<App.Locals> = {}): App.Locals {
    return {
        site: mockSite,
        siteSlug: 'test-site',
        siteSettings: null as any,
        user: { id: 'user-uuid', discordId: '12345', discordUsername: 'testuser' },
        membership: { id: 'membership-uuid', siteId: mockSite.id, userId: 'user-uuid', role: 'owner' },
        ...overrides,
    } as App.Locals;
}

function createRequestEvent(method: string, overrides: Partial<RequestEvent> = {}): RequestEvent {
    return {
        request: new Request(`http://localhost/api/resource`, { method }),
        locals: createMockLocals(),
        params: {},
        url: new URL(`http://localhost/api/resource`),
        ...overrides,
    } as unknown as RequestEvent;
}

// --- TESTS ---

describe('POST /api/resource', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('returns 401 when unauthenticated', async () => {
        const event = createRequestEvent('POST', {
            locals: createMockLocals({ user: null, membership: null }),
        });

        const response = await POST(event);
        expect(response.status).toBe(401);

        const body = await response.json();
        expect(body).toHaveProperty('error');
    });

    it('returns 400 for invalid input', async () => {
        const formData = new FormData();
        // Missing required field
        formData.append('name', '');

        const event = createRequestEvent('POST', {
            request: new Request('http://localhost/api/resource', {
                method: 'POST',
                body: formData,
            }),
        });

        const response = await POST(event);
        expect(response.status).toBe(400);
    });

    it('creates a resource successfully', async () => {
        const createdResource = { id: 'new-uuid', siteId: mockSite.id, name: 'Test Resource' };
        mockInsert.mockReturnValue({ values: vi.fn().mockReturnValue({ returning: vi.fn().mockResolvedValue([createdResource]) }) });

        const formData = new FormData();
        formData.append('name', 'Test Resource');

        const event = createRequestEvent('POST', {
            request: new Request('http://localhost/api/resource', {
                method: 'POST',
                body: formData,
            }),
        });

        const response = await POST(event);
        expect(response.status).toBe(201);

        const body = await response.json();
        expect(body.data).toEqual(createdResource);
    });
});
```

### Testing different auth roles

When testing role-based access, use the `membership.role` field:

```ts
it('allows owner to create resource', async () => {
    const event = createRequestEvent('POST', {
        locals: createMockLocals({
            membership: { id: 'm-uuid', siteId: mockSite.id, userId: 'user-uuid', role: 'owner' },
        }),
    });
    // expect 201
});

it('allows admin to create resource', async () => {
    const event = createRequestEvent('POST', {
        locals: createMockLocals({
            membership: { id: 'm-uuid', siteId: mockSite.id, userId: 'user-uuid', role: 'admin' },
        }),
    });
    // expect 201
});

it('rejects editor from creating resource', async () => {
    const event = createRequestEvent('POST', {
        locals: createMockLocals({
            membership: { id: 'm-uuid', siteId: mockSite.id, userId: 'user-uuid', role: 'editor' },
        }),
    });
    // expect 403
});

it('allows super admin from any site', async () => {
    // Super admins are identified by SUPER_ADMIN_DISCORD_IDS env var
    // Mock the env check or auth module to return super admin status
    const event = createRequestEvent('POST', {
        locals: createMockLocals({
            user: { id: 'super-uuid', discordId: '999999999999999999', discordUsername: 'superadmin' },
            membership: null, // super admins may not have a membership
        }),
    });
    // expect 201 if super admin bypass is implemented
});
```

### Testing site-scoped queries

Verify that API routes filter by `locals.site.id`:

```ts
it('queries scoped to current site', async () => {
    const mockWhere = vi.fn();
    mockSelect.mockReturnValue({
        from: vi.fn().mockReturnValue({
            where: mockWhere.mockResolvedValue([]),
            orderBy: vi.fn().mockResolvedValue([]),
        }),
    });

    const response = await GET(createRequestEvent('GET'));

    expect(mockWhere).toHaveBeenCalled();
    // The where clause should include eq(table.siteId, mockSite.id)
});
```

### Testing JSON API endpoints

For endpoints accepting JSON body instead of FormData:

```ts
it('accepts JSON body', async () => {
    const payload = { name: 'Test', description: 'Description' };

    const event = createRequestEvent('POST', {
        request: new Request('http://localhost/api/resource', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        }),
    });

    const response = await POST(event);
    expect(response.status).toBe(201);
});
```

### Testing error responses

```ts
it('returns 404 when resource not found', async () => {
    mockSelect.mockReturnValue({
        from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([]),
        }),
    });

    const response = await GET(createRequestEvent('GET'));
    expect(response.status).toBe(404);
});

it('returns 500 on database error', async () => {
    mockSelect.mockImplementation(() => {
        throw new Error('Database connection failed');
    });

    const response = await GET(createRequestEvent('GET'));
    expect(response.status).toBe(500);

    const body = await response.json();
    expect(body.error).toBe('Internal server error');
});
```

## File placement rules

| Source file | Test file |
| ----------- | --------- |
| `src/routes/api/{resource}/+server.ts` | `src/routes/api/{resource}/server.test.ts` |
| `src/routes/admin/{section}/+page.server.ts` | `src/routes/admin/{section}/page.server.test.ts` |

> Always drop the `+` prefix from route filenames when creating test files.

## Key patterns to follow

1. **Mock the database** with `vi.hoisted()` and `vi.mock('$lib/server/db')` — never connect to a real database
2. **Mock site context** via `locals.site`, `locals.siteSlug`, `locals.siteSettings`
3. **Test auth states** — unauthenticated, owner, admin, editor, super admin
4. **Test site scoping** — verify queries filter by `locals.site.id`
5. **Test request validation** — missing fields, invalid types, empty bodies
6. **Test response formats** — success JSON, error JSON, redirects
7. **Use `createMockLocals()`** helper for consistent locals mocking
8. **Use `createRequestEvent()`** helper for consistent RequestEvent construction
9. **Reset mocks** in `beforeEach` to prevent test pollution
