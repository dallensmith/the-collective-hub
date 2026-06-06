---
description: 'Scaffold a new admin page for The Collective Hub. Generates +page.server.ts (auth guard, load data, form actions) and +page.svelte (Svelte 5, form, Tailwind).'
agent: 'agent'
---

Scaffold a new admin page at `admin/{section}/` for The Collective Hub.

Follow all conventions in:
- [admin-panel.instructions.md](.github/instructions/admin-panel.instructions.md)
- [auth-and-roles.instructions.md](.github/instructions/auth-and-roles.instructions.md)
- [svelte5.instructions.md](.github/instructions/svelte5.instructions.md)
- [server-ts.instructions.md](.github/instructions/server-ts.instructions.md)

## What to Create

### 1. `+page.server.ts`

```ts
import { fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { siteSettings } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
    if (!locals.user) redirect(302, '/login');

    // Load current data
    return {
        settings: locals.siteSettings,
        // Add more data as needed
    };
};

export const actions: Actions = {
    default: async ({ locals, request }) => {
        if (!locals.user) return fail(401, { error: 'Unauthorized' });

        const form = await request.formData();
        // const value = form.get('fieldName') as string;

        // Validate
        // if (!value) return fail(400, { error: 'Field is required' });

        // Save to DB (scoped by locals.site.id)
        // await db.update(siteSettings)...

        return { success: true, message: 'Saved' };
    },
};
```

### 2. `+page.svelte`

```svelte
<script lang="ts">
    import type { PageData } from './$types';
    let { data, form }: { data: PageData; form: import('./$types').ActionData | null } = $props();
</script>

<div class="max-w-2xl mx-auto p-6">
    <h1 class="text-2xl font-bold mb-6">Page Title</h1>

    <form method="POST" class="space-y-4">
        <!-- Form fields -->

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
</div>
```
