---
description: 'Use when creating, editing, or organizing Svelte components for The Collective Hub. Enforces folder structure, naming, prop typing, and composition conventions for src/lib/components/.'
applyTo: 'src/lib/components/**/*.svelte'
---

# Component Conventions

## Folder Structure

```
src/lib/components/
  ui/       ← Generic, reusable UI primitives (no business logic)
  layout/   ← Structural shell components (Header, Footer, Navigation)
```

Place new components in the most specific folder:

- If it's a general-purpose display or form element → `ui/`
- If it's a page-level structural shell → `layout/`
- Do **not** create new folders without a clear category need

## Naming

- Files: **PascalCase** — `SectionCard.svelte`, `StatusBadge.svelte`
- One component per file
- Name reflects what it **is**, not what it **does**: `StatCard` not `DisplayStat`

## Imports

Always import from the full `$lib/components/...` path — do not use relative paths from within `src/`:

```ts
// ✅
import SectionCard from '$lib/components/ui/SectionCard.svelte';

// ❌
import SectionCard from '../components/ui/SectionCard.svelte';
```

## Props

Type props inline using `$props<{...}>()` — do not use a separate `interface` or `type` alias unless it's shared across multiple components:

```svelte
<script lang="ts">
	let {
		title,
		description = undefined,
		children
	} = $props<{
		title: string;
		description?: string;
		children: Snippet;
	}>();
</script>
```

- Optional props must have a default value (`= undefined` or a real default)
- Use `Snippet` from `'svelte'` for composable markup slots
- Use `Snippet<[T]>` for typed render props (e.g., row renderers in `DataTable`)

## Composition: Snippets over Slots

Accept content via `Snippet` props. Common pattern:

```svelte
<!-- SectionCard: accepts children + optional headerAction -->
{#if headerAction}
	{@render headerAction()}
{/if}
{@render children()}
```

Named snippets in the consumer:

```svelte
{#snippet headerAction()}
	<button class="btn-ghost">Export</button>
{/snippet}

<SectionCard title="Movies" {headerAction}>
	<!-- body -->
</SectionCard>
```

> **Note on dynamic components:** In Svelte 5, `<svelte:component>` is deprecated. Use `{@const ComponentVar = ...}` in the template and render it as `<ComponentVar />` instead. See [`svelte5.instructions.md`](svelte5.instructions.md#deprecated-apis) for details.

### No `svelte-ignore` Suppression

`svelte-ignore` comments must NOT be used to suppress svelte-check errors or warnings. All accessibility and type issues must be fixed properly — never hidden behind a suppression comment.

## Admin Components

Admin-specific components live alongside their route pages in `src/routes/admin/` rather than in `src/lib/components/`. Shared admin UI patterns (form fields, buttons, layouts) should be placed in `src/lib/components/admin/` if reused across multiple admin pages.

## Current Component Inventory

| Component | Path | Description |
|-----------|------|-------------|
| Public site sections | [route-level](src/routes/) | Hero, About, Events, Social Links — defined in the route or as page-specific components |
| Layout components | [`$lib/components/layout/`](src/lib/components/layout/) | Header, Footer, Navigation |
| UI primitives | [`$lib/components/ui/`](src/lib/components/ui/) | Container, SectionHeading, buttons, cards |

> The component inventory evolves as the platform grows. When adding a new component, place it in the most specific folder: `ui/` for generic UI, `layout/` for structural shells, or a route directory for page-specific components.

## Visual Style

All components follow The Collective Hub theme system — see [`public-site-theming.instructions.md`](public-site-theming.instructions.md) for CSS custom property conventions and [`tailwindcss.instructions.md`](tailwindcss.instructions.md) for token and color usage.

Use CSS custom properties for theme-aware colors:
```svelte
<div
    class="rounded-lg p-4"
    style="background-color: var(--bg); color: var(--text);"
>
    <h2 style="color: var(--accent);">Section Title</h2>
    ...
</div>
```

- `rounded-lg` — standard border radius
- Use CSS custom properties for all colors (never hardcode)
- Use consistent spacing and alignment
