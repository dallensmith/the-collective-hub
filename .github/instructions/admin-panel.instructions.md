---
description: 'Use when building or modifying admin panel pages for The Collective Hub. Covers admin route structure, auth guards, form action patterns, layout conventions, and admin Svelte component patterns.'
applyTo: 'src/routes/admin/**/*.svelte', 'src/routes/admin/**/*.server.ts'
---

# Admin Panel

## Route Structure

Admin routes live under `src/routes/admin/`:

```
src/routes/admin/
    +layout.server.ts    ← Auth guard (redirects to /login if unauthenticated)
    +layout.svelte       ← Admin shell with navigation sidebar
    +page.svelte         ← Admin dashboard (overview)
    settings/
        +page.server.ts  ← Loads/saves site settings
        +page.svelte
    branding/
        +page.server.ts  ← Logo, colors, theme
        +page.svelte
    homepage/
        +page.server.ts  ← Hero text, about, CTA
        +page.svelte
    links/
        +page.server.ts  ← Nav links + social links
        +page.svelte
    events/
        +page.server.ts  ← Event CRUD
        +page.svelte
    assets/
        +page.server.ts  ← Asset library
        +page.svelte
```

## Auth Guard Pattern

Every admin server load must check authentication. This is centralized in the admin layout:

```ts
// src/routes/admin/+layout.server.ts
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
    if (!locals.user) {
        redirect(302, '/login');
    }

    // Optional: check minimum role for admin access
    // const roleLevel = { owner: 3, admin: 2, editor: 1 };
    // if ((roleLevel[locals.membership?.role ?? ''] ?? 0) < 2) {
    //     redirect(302, '/');
    // }

    return {
        user: locals.user,
        membership: locals.membership,
        settings: locals.siteSettings,
    };
};
```

## Form Action Patterns

Admin pages use SvelteKit form actions for data mutations. API routes (`+server.ts`) are reserved for asset uploads and external integrations.

### Standard Form Action

```ts
// +page.server.ts
import { fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { siteSettings } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
    if (!locals.user) redirect(302, '/login');
    return {
        settings: locals.siteSettings,
    };
};

export const actions: Actions = {
    default: async ({ locals, request }) => {
        if (!locals.user) return fail(401, { error: 'Unauthorized' });

        const form = await request.formData();
        const siteName = form.get('siteName') as string;

        if (!siteName || siteName.trim().length === 0) {
            return fail(400, { error: 'Site name is required' });
        }

        const updatedSettings = {
            ...locals.siteSettings,
            branding: {
                ...locals.siteSettings?.branding,
                siteName: siteName.trim(),
            },
        };

        await db
            .update(siteSettings)
            .set({ settings: updatedSettings })
            .where(eq(siteSettings.siteId, locals.site.id));

        return { success: true, message: 'Settings saved' };
    },
};
```

### Form Component

```svelte
<script lang="ts">
    import type { PageData } from './$types';
    let { data, form } = $props();
    let { settings } = data;

    let siteName = $state(settings?.branding?.siteName ?? '');
</script>

<form method="POST" class="space-y-4">
    <div>
        <label for="siteName" class="block text-sm font-medium">Site Name</label>
        <input
            id="siteName"
            name="siteName"
            type="text"
            bind:value={siteName}
            class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            required
        />
    </div>

    {#if form?.error}
        <p class="text-red-500 text-sm">{form.error}</p>
    {/if}
    {#if form?.success}
        <p class="text-green-500 text-sm">{form.message}</p>
    {/if}

    <button type="submit" class="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
        Save Changes
    </button>
</form>
```

## Admin Layout Shell

The admin layout provides consistent navigation:

```svelte
<script lang="ts">
    import type { LayoutData } from './$types';
    let { data, children } = $props();
    let { user } = data;
</script>

<div class="flex min-h-screen">
    <!-- Sidebar -->
    <nav class="w-64 bg-gray-900 text-white p-4">
        <div class="text-lg font-bold mb-6">{user.discordUsername}</div>
        <ul class="space-y-2">
            <li><a href="/admin" class="block p-2 hover:bg-gray-700 rounded">Dashboard</a></li>
            <li><a href="/admin/settings" class="block p-2 hover:bg-gray-700 rounded">Settings</a></li>
            <li><a href="/admin/branding" class="block p-2 hover:bg-gray-700 rounded">Branding</a></li>
            <li><a href="/admin/homepage" class="block p-2 hover:bg-gray-700 rounded">Homepage</a></li>
            <li><a href="/admin/links" class="block p-2 hover:bg-gray-700 rounded">Links</a></li>
            <li><a href="/admin/events" class="block p-2 hover:bg-gray-700 rounded">Events</a></li>
            <li><a href="/admin/assets" class="block p-2 hover:bg-gray-700 rounded">Assets</a></li>
        </ul>
    </nav>

    <!-- Main Content -->
    <main class="flex-1 p-8">
        {@render children()}
    </main>
</div>
```

## Admin Page Conventions

1. **Server load fetches current data** — always load from DB, don't rely on cached `locals`
2. **Form actions validate and save** — never trust client-side data without server validation
3. **Success/error feedback** — return `{ success: true, message: '...' }` or `fail(statusCode, { error: '...' })`
4. **Role-aware UI** — conditionally show/hide controls based on `membership.role`
5. **Optimistic updates** — not required for V1; simple form submit + reload is fine
6. **No client-side state management** — rely on `form` and `data` from SvelteKit's form actions
