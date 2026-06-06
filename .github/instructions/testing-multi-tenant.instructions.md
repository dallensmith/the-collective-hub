---
description: 'Use when writing or editing tests for The Collective Hub. Covers multi-tenant test patterns, mocking site context, database mocking, auth testing, and coverage targets for multi-tenant code paths.'
applyTo: 'src/**/*.test.ts', 'src/**/*.spec.ts', 'src/**/*.svelte.test.ts'
---

# Testing: Multi-Tenant Patterns

> **Base testing rules** are covered in [`testing.instructions.md`](testing.instructions.md). This file covers patterns specific to testing multi-tenant code.

## Overview

The Collective Hub's multi-tenant architecture introduces testing concerns that don't exist in single-tenant apps:

1. **Site scoping** — every query must filter by `siteId`
2. **Auth state** — routes behave differently based on user role
3. **Site context** — `locals.site`, `locals.siteSettings` drive rendering
4. **Data isolation** — one site's data must never leak to another

## Mocking Site Context

### In Server Tests

When testing server code (load functions, form actions, API routes), mock the `locals` object:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSite = {
    id: 'test-site-uuid',
    slug: 'test-site',
    name: 'Test Site',
    isActive: true,
};

const mockSettings = {
    branding: { siteName: 'Test Site', tagline: 'Testing', logoCdnKey: null, backgroundCdnKey: null, faviconCdnKey: null },
    theme: { preset: 'dark' as const, accentColor: '#e63946', backgroundColor: '#1a1a2e', textColor: '#eaeaea' },
    homepage: { heroTitle: 'Welcome', heroSubtitle: '', aboutText: '', primaryButtonText: 'Join', primaryButtonLink: '', showNextEvent: true, showSchedule: true },
    layout: { preset: 'standard' as const },
};

function createMockLocals(overrides: Partial<App.Locals> = {}): App.Locals {
    return {
        site: mockSite,
        siteSlug: 'test-site',
        siteSettings: mockSettings,
        user: { id: 'user-uuid', discordId: '12345', discordUsername: 'testuser' },
        membership: { id: 'membership-uuid', siteId: mockSite.id, userId: 'user-uuid', role: 'owner' },
        ...overrides,
    } as App.Locals;
}
```

### Testing with Different Auth States

```ts
describe('admin page load', () => {
    it('redirects to login when unauthenticated', async () => {
        const locals = createMockLocals({ user: null, membership: null });
        // expect redirect(302, '/login')
    });

    it('allows access for authenticated owner', async () => {
        const locals = createMockLocals({ user: mockUser, membership: { ...mockMembership, role: 'owner' } });
        // expect data to load
    });

    it('allows access for admin', async () => {
        const locals = createMockLocals({ user: mockUser, membership: { ...mockMembership, role: 'admin' } });
        // expect data to load
    });

    it('redirects editor from settings page', async () => {
        const locals = createMockLocals({ user: mockUser, membership: { ...mockMembership, role: 'editor' } });
        // expect redirect(302, '/admin') or 403
    });
});
```

## Mocking the Database

Use `vi.hoisted()` with `vi.mock()` for Drizzle mocking:

```ts
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
```

### Testing Site-Scoped Queries

Verify that queries filter by `siteId`:

```ts
it('queries events scoped to current site', async () => {
    const mockWhere = vi.fn();
    mockSelect.mockReturnValue({
        from: vi.fn().mockReturnValue({
            where: mockWhere.mockResolvedValue([]),
            orderBy: vi.fn().mockResolvedValue([]),
        }),
    });

    // Call the function being tested
    await loadEvents({ siteId: mockSite.id });

    // Verify the where clause includes siteId
    expect(mockWhere).toHaveBeenCalled();
    const whereArgs = mockWhere.mock.calls[0][0];
    // whereArgs should contain eq(eventsTable.siteId, mockSite.id)
});
```

## Testing Auth Guards

### Server Load Functions

```ts
import { redirect } from '@sveltejs/kit';

it('throws redirect when user is not authenticated', async () => {
    const locals = createMockLocals({ user: null });

    try {
        await load({ locals, params: {}, url: new URL('http://test.com') } as any);
        expect.unreachable('Should have thrown redirect');
    } catch (e) {
        expect(e.status).toBe(302);
        expect(e.location).toBe('/login');
    }
});
```

### Form Actions

```ts
it('returns 401 fail for unauthenticated form submission', async () => {
    const locals = createMockLocals({ user: null });
    const request = new Request('http://test.com/admin/settings', { method: 'POST' });

    const result = await actions.default({ locals, request } as any);
    expect(result.status).toBe(401);
});
```

## Testing Data Isolation

Ensure one site's data doesn't leak into another:

```ts
it('only returns events for the current site', async () => {
    const siteAEvents = [{ id: 'event-1', siteId: 'site-a' }];
    const siteBEvents = [{ id: 'event-2', siteId: 'site-b' }];

    // Mock to return siteA events when filtering by site-a
    mockWhere.mockImplementation((...args) => {
        // Inspect args to ensure siteId filtering
        return siteAEvents;
    });

    const result = await loadEvents({ siteId: 'site-a' });
    expect(result).toHaveLength(1);
    expect(result[0].siteId).toBe('site-a');

    // No site-b events leaked
    expect(result.some((e: any) => e.siteId === 'site-b')).toBe(false);
});
```

## Testing Admin Form Actions

```ts
it('saves site settings correctly', async () => {
    const locals = createMockLocals();
    const formData = new FormData();
    formData.append('siteName', 'Updated Site Name');

    mockUpdate.mockResolvedValue([{ id: mockSite.id }]);

    const result = await actions.default({ locals, request: new Request('http://test.com/admin/settings', {
        method: 'POST',
        body: formData,
    }) } as any);

    expect(mockUpdate).toHaveBeenCalled();
    expect(result).toEqual({ success: true, message: 'Settings saved' });
});
```

## Testing API Routes

```ts
it('rejects unauthenticated upload', async () => {
    const locals = createMockLocals({ user: null });
    const request = new Request('http://test.com/api/assets', { method: 'POST' });

    const response = await POST({ locals, request } as any);
    expect(response.status).toBe(401);
});

it('validates file type', async () => {
    const locals = createMockLocals();
    const formData = new FormData();
    formData.append('file', new File(['not-an-image'], 'test.txt', { type: 'text/plain' }));

    const response = await POST({ locals, request: new Request('http://test.com/api/assets', {
        method: 'POST',
        body: formData,
    }) } as any);

    expect(response.status).toBe(400);
});
```

## Coverage Targets

Focus test coverage on multi-tenant code paths:

| Component | Target Coverage | Key Scenarios |
|-----------|----------------|---------------|
| Site resolver | 90%+ | Found, not found, inactive site |
| Auth guards | 90%+ | Unauthenticated, wrong role, super admin bypass |
| Admin form actions | 80%+ | Save success, validation failure, auth failure |
| API routes | 80%+ | CRUD operations, auth, site scoping |
| DB queries | 90%+ | Correct `siteId` filtering, ordering, null handling |
| Public page render | 70%+ | All theme presets, missing settings defaults |
