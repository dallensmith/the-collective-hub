---
description: 'Scaffold a new Svelte 5 component for The Collective Hub. Follows runes convention, snippets over slots, Tailwind CSS, and Lucide icons.'
agent: 'agent'
---

Scaffold a Svelte 5 component for The Collective Hub: ${input}

Follow all conventions in:
- [components.instructions.md](.github/instructions/components.instructions.md)
- [svelte5.instructions.md](.github/instructions/svelte5.instructions.md)
- [icons.instructions.md](.github/instructions/icons.instructions.md)
- [tailwindcss.instructions.md](.github/instructions/tailwindcss.instructions.md)

## Conventions

1. **PascalCase filename** — `TheComponent.svelte`
2. **Place in appropriate folder:**
   - `src/lib/components/ui/` — generic reusable UI primitives
   - `src/lib/components/layout/` — structural shell components
   - Route directory — page-specific components
3. **Use Svelte 5 runes**:
   - `$props()` for component props with inline type
   - `$state()` for local state
   - `$derived()` for computed values
   - `$effect()` for side effects (sparingly)
   - `$bindable()` for two-way bindings
4. **Snippets over slots** for composition patterns
5. **Tailwind CSS** for styling
6. **Lucide icons** from `@lucide/svelte` — import individual icons by name
7. **No `svelte-ignore` comments** — fix accessibility and type issues properly

## Example Component

```svelte
<script lang="ts">
    import { Heart } from '@lucide/svelte';

    let {
        title,
        description = '',
        liked = $bindable(false),
    }: {
        title: string;
        description?: string;
        liked?: boolean;
    } = $props();

    let count = $state(0);
    let doubled = $derived(count * 2);
</script>

<div class="rounded-lg border p-4">
    <div class="flex items-center gap-2">
        <h2 class="text-lg font-semibold">{title}</h2>
        <button
            onclick={() => (liked = !liked)}
            class="ml-auto"
            aria-label={liked ? 'Unlike' : 'Like'}
        >
            <Heart class={liked ? 'fill-red-500 text-red-500' : ''} />
        </button>
    </div>
    {#if description}
        <p class="mt-2 text-gray-600">{description}</p>
    {/if}
    <p class="mt-2">Count: {count} (doubled: {doubled})</p>
    <button onclick={() => count++} class="mt-2 rounded bg-blue-600 px-3 py-1 text-white">
        Increment
    </button>
</div>
```
