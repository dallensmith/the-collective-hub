---
description: "Use when writing or editing tests for The Collective Hub. Covers the two Vitest project environments (client browser tests and server node tests), e2e Playwright tests, file naming conventions, and the requireAssertions rule."
applyTo: "src/**/*.test.ts", "src/**/*.spec.ts", "src/**/*.e2e.ts", "src/**/*.svelte.test.ts", "src/**/*.svelte.spec.ts"
---

# Testing Rules

## Two Test Environments

This project uses a split Vitest config with two projects. Use the correct file extension to target the right runner:

| Environment          | File pattern                            | Runner                          | Use for                                                  |
| -------------------- | --------------------------------------- | ------------------------------- | -------------------------------------------------------- |
| **Client** (browser) | `*.svelte.test.ts` / `*.svelte.spec.ts` | Playwright (Chromium, headless) | Svelte component tests, DOM interaction                  |
| **Server** (Node)    | `*.test.ts` / `*.spec.ts`               | Node                            | Server logic, load functions, utilities, EspoCRM API client |

> The client project **excludes** `src/lib/server/**` — never write browser tests for server modules.

## File Placement

Co-locate test files with the code they test:

```
src/lib/components/ui/ServiceCard.svelte
src/lib/components/ui/ServiceCard.svelte.test.ts   ← client test

src/lib/server/db/queries.ts
src/lib/server/db/queries.test.ts                  ← server test
```

## requireAssertions

`requireAssertions` is enabled globally in [`vitest.config.ts`](vitest.config.ts) via `expect: { requireAssertions: true }` — **every `it` block must have at least one `expect()`**:

```ts
// ✅
it('returns formatted text', () => {
	expect(formatText('hello')).toBe('Hello');
});

// ❌ — will fail at runtime even if no error thrown
it('does something', () => {
	formatText('hello');
});
```

## `expect.element()` DOM Assertions (Auto-Retry) — v3-Compatible Alternative

The `expect.element()` method is available when using `vitest/browser` (import `page` from `vitest/browser` and query via `page.getByText(...)`, `page.getByRole(...)`, etc.). It **automatically retries** the assertion until it passes or the timeout is reached — this handles async rendering and DOM updates without manual waiting:

```ts
import { page } from 'vitest/browser';

// Auto-retries until the element matches or timeout
await expect.element(page.getByText('Success')).toBeVisible();
```

This API is a v3-compatible alternative to [`@testing-library/svelte`](#client-component-tests-sveltetestts) queries. The primary recommended approach is `@testing-library/svelte`, but `expect.element()` remains valid for cases where you prefer the Playwright-like query syntax.

- `expect.element()` is available from `vitest` directly (no extra import needed beyond `page`)
- The retry behavior mirrors Playwright's built-in auto-waiting
- All component tests using this API should be `async` to support `await expect.element(...)`
- See the [Client Component Tests](#client-component-tests-sveltetestts) section below for the primary `@testing-library/svelte` approach

## `expect.poll()` Async State Polling

`expect.poll()` allows retrying a custom assertion function until it passes or the timeout is reached. This is useful for polling async state changes, such as waiting for a value to reach an expected state:

```ts
// ✅ Retries getCount() every 50ms until it returns 5 or timeout
await expect.poll(() => getCount(), { timeout: 2000 }).toBe(5);
```

- The poll interval defaults to `50ms` and can be configured via `interval` in the options
- The overall timeout defaults to the test timeout and can be overridden per-poll
- Useful in both server and client tests when waiting for asynchronous side effects

## Client Component Tests (`.svelte.test.ts`)

This project uses `@testing-library/svelte` for rendering components and querying the DOM in browser-based tests (Vitest v3 + Playwright/Chromium). Do **not** use `vitest-browser-svelte` (that is a v4-only package).

### Rendering Components

Use `render` and `screen` from `@testing-library/svelte`:

```ts
import { render, screen } from '@testing-library/svelte';
import { expect, it } from 'vitest';
import Welcome from './Welcome.svelte';

it('renders greetings for host and guest', () => {
	render(Welcome, { props: { host: 'SvelteKit', guest: 'Vitest' } });
	expect(screen.getByRole('heading', { level: 1 })).toBeTruthy();
	expect(screen.getByText('Hello, Vitest!')).toBeTruthy();
});
```

> See the canonical example at [`src/lib/vitest-examples/Welcome.svelte.spec.ts`](../src/lib/vitest-examples/Welcome.svelte.spec.ts).

### Async DOM Assertions

For assertions that need to wait for async rendering or DOM updates, use `waitFor` from `@testing-library/svelte` or `vi.waitFor()` from Vitest. These retry the assertion until it passes or the timeout is reached:

```ts
import { render, screen, waitFor } from '@testing-library/svelte';
import { expect, it } from 'vitest';

it('shows success message after loading', async () => {
	render(MyComponent);
	await waitFor(() => {
		expect(screen.getByText('Success')).toBeTruthy();
	});
});
```

### Guidelines

- Prefer `@testing-library/svelte` queries (`screen.getByText`, `screen.getByRole`, etc.) over `document.querySelector`
- Do not import from `$lib/server/**` in client tests (the client project excludes these)
- All component tests should use `@testing-library/svelte` as the primary query API

## Server Tests (`.test.ts`)

Plain Vitest tests running in Node. Use for pure functions, server utilities, and EspoCRM API client logic:

```ts
import { describe, it, expect } from 'vitest';
import { formatServiceName } from './format';

describe('formatServiceName', () => {
	it('formats the service name correctly', () => {
		expect(formatServiceName('seo audit')).toBe('SEO Audit');
	});
});
```

### EspoCRM API Client Mocking

Server tests that depend on EspoCRM should mock the client:

```ts
import { describe, it, expect, vi } from 'vitest';

// Mock the EspoCRM client at module scope
const mockCreateLead = vi.fn();
vi.mock('$lib/server/espocrm', () => ({
  espocrm: {
    createLead: mockCreateLead,
    request: vi.fn()
  }
}));
```

Example test for the contact form:

```ts
import { POST } from './+server';
import { espocrm } from '$lib/server/espocrm';

describe('POST /api/contact', () => {
  it('creates a lead via EspoCRM on valid submission', async () => {
    mockCreateLead.mockResolvedValue({ status: 200, data: { id: 'abc123' } });

    const response = await POST({
      request: {
        json: () => ({ name: 'John', email: 'j@example.com', services: ['SEO'] })
      }
    } as any);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(mockCreateLead).toHaveBeenCalledWith({
      name: 'John',
      email: 'j@example.com',
      services: ['SEO']
    });
  });
});
```

The `{ spy: true }` option can be passed to `vi.mock()` to auto-spy on all exported functions of a module without overriding implementations:

```ts
// Automatically wraps every export in a vi.fn() spy — useful for
// asserting calls were made without replacing module behavior
vi.mock('$lib/server/email', { spy: true });
```

## E2E Tests (`.e2e.ts`)

End-to-end tests use Playwright directly (not Vitest). They run against the built preview server on port `4173`:

```ts
// src/routes/demo/playwright/page.svelte.e2e.ts
import { test, expect } from '@playwright/test';

test('homepage loads successfully', async ({ page }) => {
	await page.goto('/');
	await expect(page.locator('h1')).toBeVisible();
});
```

- File pattern: `**/*.e2e.{ts,js}` — picked up by `playwright.config.ts`
- Run with: `npx playwright test`
- Do not use `vitest` imports in `.e2e.ts` files — use `@playwright/test` only

## Reference Examples

The project includes reference examples demonstrating each test type. Use these as canonical patterns:

| Test type                 | File                                                                                                  | What it demonstrates                                                                                                  |
| ------------------------- | ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| **Client component test** | [`src/lib/vitest-examples/Welcome.svelte.spec.ts`](../src/lib/vitest-examples/Welcome.svelte.spec.ts) | Canonical Vitest browser component test — `render()` and `screen` from `@testing-library/svelte`, with `expect.element()` alternative |
| **Server unit test**      | [`src/lib/vitest-examples/greet.spec.ts`](../src/lib/vitest-examples/greet.spec.ts)                   | Simple unit test pattern — pure function testing with `describe`/`it`/`expect`                                        |
| **Playwright E2E test**   | [`src/routes/demo/playwright/page.svelte.e2e.ts`](../src/routes/demo/playwright/page.svelte.e2e.ts)   | Playwright E2E test pattern — `@playwright/test` imports, `page.goto`, `locator` assertions                           |

## Code Coverage

Coverage reporting is configured with [`@vitest/coverage-v8`](https://www.npmjs.com/package/@vitest/coverage-v8):

```bash
# Run tests with coverage
npx vitest --coverage
```

Coverage reports are output to the `coverage/` directory (gitignored). Thresholds and include/exclude patterns can be configured in [`vitest.config.ts`](vitest.config.ts).

## Running Tests

```bash
# All Vitest tests (both client and server)
npm run test

# Watch mode
npx vitest

# E2E only (requires build first)
npx playwright test
```

## Multi-Tenant Testing

The Collective Hub's multi-tenant architecture introduces additional testing concerns:

- **Mocking `locals`** — every test that touches server code needs a mock `locals` object with `site`, `user`, `membership`, `siteSettings`
- **Site-scoped queries** — verify that every query filters by `siteId`
- **Auth guards** — test unauthenticated, authenticated, and role-based access
- **Data isolation** — ensure one site's data never leaks into another

See [`testing-multi-tenant.instructions.md`](testing-multi-tenant.instructions.md) for detailed patterns and examples.

