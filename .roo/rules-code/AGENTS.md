# AGENTS.md — Code Mode

This file provides guidance to code agents working in this repository.

## Svelte 5 Runes (Mandatory)
- `compilerOptions.runes` is forced `true` in `svelte.config.js` — do NOT use `$:` declarations or Svelte 4 syntax
- Use `$props()`, `$state()`, `$derived()`, `$effect()` runes
- Layouts use `{@render children()}` snippet pattern (see `src/routes/+layout.svelte`)

## Testing Rules
- **Co-locate tests** in the same directory as the source file (Vitest config requires this)
- **`requireAssertions: true`** — every test MUST include at least one assertion
- **Client tests**: `src/**/*.svelte.{test,spec}.{js,ts}` (browser/Playwright)
- **Server tests**: `src/**/*.{test,spec}.{js,ts}` excluding svelte files (Node environment)
- **E2E tests**: `**/*.e2e.{ts,js}` (Playwright standalone)

## Better Auth
- `sveltekitCookies(getRequestEvent)` MUST be the last plugin in the auth config array
- Auth schema (`auth.schema.ts`) is auto-generated — run `npm run auth:schema` after auth config changes
- Session data populated in `hooks.server.ts` via `auth.api.getSession()` on every request

## Styling
- **Tailwind CSS v4** — use `@import 'tailwindcss'` not `@tailwind` directives
- **Prettier uses tabs** for indentation (`.prettierrc`), single quotes, no trailing commas, 100 print width
- CSS files automatically associated with Tailwind language mode (`.vscode/settings.json`)

## Database
- Always run `db:start` (Docker Compose) before working with the database locally
- After schema changes: `db:generate` → `db:migrate` (additive migrations preferred)
- Each deployment has its own isolated database — no cross-site concerns
