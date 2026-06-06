---
agent: 'agent'
description: Analyse test coverage gaps for a file or directory and generate missing tests
---

You are performing test coverage analysis and generating missing tests for The Collective Hub project.

## Your task

The user has provided one or more source files or a directory to analyse. For each file:

1. Read the source file
2. Identify all exported functions, components, handlers, and branches that lack test coverage
3. Check whether a co-located test file already exists
4. Generate or extend the test file to cover the gaps

If the user has not specified a file, ask them to provide one before proceeding.

---

## Coverage analysis checklist

For each source file, enumerate all of the following that need tests:

### Server files (`*.server.ts`, `+server.ts`, `+page.server.ts`)

- [ ] Every exported `load` function — success path, unauthenticated redirect, DB error
- [ ] Every form `action` — valid input, `fail()` path, redirect path
- [ ] Every HTTP handler (`GET`, `POST`, `PATCH`, `DELETE`) — 2xx and 4xx/5xx paths
- [ ] Auth guard branches — unauthenticated (`locals.user` is null), insufficient role
- [ ] Query results — empty array, single result, multiple results

### Svelte components (`*.svelte`)

- [ ] Default render with required props
- [ ] Every `{#if}` branch (both true and false)
- [ ] Every `{#each}` branch — empty array, non-empty array
- [ ] User interactions — click, input, form submit
- [ ] Conditional class/style variations driven by props
- [ ] Slot/snippet presence and absence (note as limitation if not testable)

### Utility / library files (`*.ts`)

- [ ] Every exported function — happy path
- [ ] Edge cases: empty input, null/undefined, boundary values
- [ ] Error paths: thrown errors, returned error objects

---

## File placement rules

| Source file                                 | Test file                                          |
| ------------------------------------------- | -------------------------------------------------- |
| `src/lib/utils/format.ts`                   | `src/lib/utils/format.test.ts`                     |
| `src/lib/components/ui/ServiceCard.svelte`  | `src/lib/components/ui/ServiceCard.svelte.test.ts` |
| `src/routes/api/contact/+server.ts`         | `src/routes/api/contact/server.test.ts`            |
| `src/routes/(app)/services/+page.server.ts` | `src/routes/(app)/services/page.server.test.ts`    |

> **Drop the `+` prefix** for route test files — SvelteKit errors on `+server.test.ts` at build time.
> Server tests use `.test.ts`; component tests use `.svelte.test.ts`.

---

## Mocking rules

### Always mock the database

`vi.mock` is hoisted before `const` declarations. **Always use `vi.hoisted()`** for mock functions referenced inside `vi.mock` factories:

```ts
const { mockFindMany, mockInsert } = vi.hoisted(() => ({
	mockFindMany: vi.fn(),
	mockInsert: vi.fn()
}));

vi.mock('$lib/server/db', () => ({
	db: {
		query: {
			services: { findMany: mockFindMany, findFirst: vi.fn() }
		},
		insert: mockInsert
	}
}));
```

Reset mocks in `beforeEach`:

```ts
beforeEach(() => {
	vi.clearAllMocks();
});
```

### Create a mock RequestEvent for +server.ts handlers

```ts
function mockEvent(overrides: Partial<RequestEvent> = {}): RequestEvent {
	return {
		request: new Request('http://localhost/api/resource', { method: 'GET' }),
		locals: { user: { id: 'user-1', role: 'user' } },
		params: {},
		url: new URL('http://localhost/api/resource'),
		...overrides
	} as unknown as RequestEvent;
}
```

### Create a mock PageServerLoadEvent for load functions

```ts
function mockLoadEvent(overrides = {}) {
	return {
		locals: { user: { id: 'user-1', role: 'user' } },
		params: {},
		url: new URL('http://localhost/page'),
		...overrides
	} as any;
}
```

### Stub fetch for external API calls

```ts
vi.stubGlobal(
	'fetch',
	vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: [] }), { status: 200 }))
);
```

---

## Test structure

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

// mocks before imports that use them
const { mockFn } = vi.hoisted(() => ({ mockFn: vi.fn() }));
vi.mock('$lib/server/db', () => ({ db: { query: { table: { findMany: mockFn } } } }));

import { myFunction } from './myModule';

describe('myFunction', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('returns expected result for valid input', async () => {
		mockFn.mockResolvedValue([{ id: 1 }]);
		const result = await myFunction('valid');
		expect(result).toEqual({ id: 1 });
	});

	it('returns null when not found', async () => {
		mockFn.mockResolvedValue([]);
		const result = await myFunction('missing');
		expect(result).toBeNull();
	});
});
```

---

## requireAssertions rule

`expect.requireAssertions: true` is set globally. **Every `it` block must contain at least one `expect()`** or the test will fail even if no error is thrown.

---

## Coverage run command

After generating tests, remind the user they can check coverage with:

```sh
npm run test:run -- --coverage
```

The HTML report is written to `coverage/index.html`.

---

## Output format

For each source file analysed:

1. **Coverage gaps** — bullet list of untested functions/branches
2. **Test file path** — where the new/updated test file will go
3. **Generated test file** — full content, ready to save

If a test file already exists, show only the **new `it` blocks** to add, not the full file.
