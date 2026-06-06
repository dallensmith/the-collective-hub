---
agent: 'agent'
description: Generate a Vitest browser component test for a Svelte 5 component
---

You are generating a Vitest browser component test for a Svelte 5 component in The Collective Hub project.

## Prerequisites

Before generating tests, confirm that `@testing-library/svelte` and `@vitest/browser` are installed. If not, tell the user to run:

```sh
npm install -D @testing-library/svelte @vitest/browser playwright
npx playwright install chromium
```

And that the vitest config needs a `client` project block added (describe what to add).

## Your task

Read the target `.svelte` component (provided by the user or open in the editor), then generate a co-located `*.svelte.test.ts` file.

## Rules

- File goes next to the source: `src/lib/components/ui/StatCard.svelte` → `src/lib/components/ui/StatCard.svelte.test.ts`
- Use `.svelte.test.ts` extension — this runs under Vitest's browser/Playwright environment
- Import `render`, `screen`, `fireEvent` (or `userEvent`) from `'@testing-library/svelte'`
- Import `describe`, `it`, `expect`, `vi` from `'vitest'`
- `requireAssertions` is enabled globally in [`vitest.config.ts`](vitest.config.ts) via `expect: { requireAssertions: true }` — **every `it` block must have at least one `expect()`**
- Never import from `$lib/server/**` — those modules are excluded from the browser environment
- Use Testing Library queries (`getByText`, `getByRole`, `getByLabelText`, etc.) — not `document.querySelector`

## Svelte 5 rendering

Svelte 5 components use runes. Props are passed as the `props` option:

```ts
import { render, screen } from '@testing-library/svelte';
import MyComponent from './MyComponent.svelte';

render(MyComponent, { props: { title: 'Hello', value: 42 } });
```

For components with snippet props, you may need to render wrapper markup — note this in the test as a limitation.

## Test structure

For each component, test:

1. **Renders with default/required props** — check the key text/elements appear
2. **Conditional rendering** — if the component has `{#if}` blocks, test both branches
3. **Prop variations** — test meaningful prop combinations (not exhaustive)
4. **User interaction** — if the component has buttons/inputs, test click/input events
5. **Accessibility** — check that interactive elements have appropriate roles/labels

```ts
import { render, screen, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, vi } from 'vitest';
import StatCard from './StatCard.svelte';

describe('StatCard', () => {
	it('renders the title and value', () => {
		render(StatCard, { props: { title: 'Movies', value: 42 } });

		expect(screen.getByText('Movies')).toBeInTheDocument();
		expect(screen.getByText('42')).toBeInTheDocument();
	});

	it('renders a loading state when value is undefined', () => {
		render(StatCard, { props: { title: 'Movies', value: undefined } });

		expect(screen.getByRole('status')).toBeInTheDocument();
	});
});
```

## What to analyze in the component

Read the `.svelte` file carefully:

- What props (`$props()`) does it accept? What are their types and defaults?
- What does the component render? What are the key visible elements?
- Are there conditional blocks (`{#if}`, `{#each}`) to test both branches of?
- Does it emit events or call callbacks passed as props?
- Does it use `$bindable()` for two-way binding?
- Does it fetch data or call server functions? If so, mock those.
- What ARIA roles or labels are present?

Generate a complete, focused test file. Keep tests small and single-purpose. Prefer `getByRole` over `getByText` for interactive elements.

## Project context

- Components live under `src/lib/components/` (ui/, layout/, auth/) or `src/routes/**/*.svelte`
- Icons use `@lucide/svelte` components
- Tailwind classes are not assertion targets — test behavior and text content
