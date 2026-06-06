---
description: 'Use when writing or editing Svelte components, reactive state, props, effects, or event handlers for The Collective Hub. Enforces Svelte 5 runes syntax and forbids legacy Svelte 4 patterns.'
applyTo: '**/*.svelte'
---

# Svelte 5 Rules

## Always Use Runes

| Need                  | Use                      | Never                             |
| --------------------- | ------------------------ | --------------------------------- |
| Local state           | `$state()`               | `let x = 1` (mutable)             |
| Computed value        | `$derived(expr)`         | `$: x = expr`                     |
| Side effects          | `$effect(() => { ... })` | `onMount` (unless cleanup needed) |
| Component props       | `let { x } = $props()`   | `export let x`                    |
| Two-way bindable prop | `$bindable()`            | —                                 |

```svelte
<script lang="ts">
	let { label, value = $bindable('') }: { label: string; value?: string } = $props();
	let upper = $derived(value.toUpperCase());
</script>
```

## Event Handlers

Use direct HTML event attributes — not `on:` directive syntax.

```svelte
<!-- ✅ -->
<button onclick={handleClick}>Click</button>
<input oninput={(e) => (search = e.currentTarget.value)} />

<!-- ❌ -->
<button on:click={handleClick}>Click</button>
```

## Composition: Snippets over Slots

```svelte
<!-- ✅ -->
{#snippet row(item)}
	<tr><td>{item.name}</td></tr>
{/snippet}
{@render row(movie)}

<!-- ❌ -->
<slot name="row" />
```

To accept snippets as props: `let { children } = $props()` + `{@render children()}`.

## Cross-Component State

- Prefer `setContext` / `getContext` for tree-scoped state
- Use `.svelte.ts` modules (with `$state` at module scope) for global/shared reactive state
- Avoid `svelte/store` (`writable`, `readable`, `derived`) in new code

## Always

- `<script lang="ts">` on every component
- Prefer `$derived` over `$effect` for computed values — `$effect` is for DOM/third-party side effects only

## Deprecated APIs

### `<svelte:component>` — Use component variables instead

`<svelte:component>` is **deprecated in Svelte 5**. Instead, assign a component constructor to a variable in the template using `{@const}` and render it directly as `<ComponentVar />`.

```svelte
<!-- ❌ Deprecated in Svelte 5 -->
<svelte:component this={iconMap[key]} size={12} />

<!-- ✅ Svelte 5 approach -->
{@const Icon = iconMap[key]}
{#if Icon}
	<Icon size={12} />
{/if}
```

The `{#if}` guard ensures the component only renders when the variable is truthy, which also matches the previous runtime-guard behavior of `<svelte:component>`.

## Code Quality

### No `svelte-ignore` Suppression

`svelte-ignore` comments must NOT be used to suppress svelte-check errors or warnings. All accessibility (a11y), type, and other issues flagged by `svelte-check` must be fixed properly — never hidden behind a suppression comment.
