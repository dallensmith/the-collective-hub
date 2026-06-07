# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Project Identity
- **The Collective Hub** is a **single SvelteKit template website** deployed per-site owner, each with their own database + CDN configuration. It is NOT a standalone app.
- Comprehensive architecture docs exist in [`.github/instructions/`](.github/instructions/) (16 files covering architecture, auth, DB, deployment, components, etc.) — note that some docs may reference multi-tenant patterns that are aspirational rather than reflective of the current architecture.
- Existing AI rules in [`.github/copilot-instructions.md`](.github/copilot-instructions.md) — read this first for hard rules about the codebase, though some multi-tenant references there may be aspirational.

## Non-Obvious Gotchas
- **Svelte 5 runes mode is FORCED ON** via `svelte.config.js` — Svelte 4 `$:` syntax will fail
- **Better Auth plugin order matters**: `sveltekitCookies(getRequestEvent)` MUST be the last plugin in the array
- **Each deployment is fully isolated** — own database, own CDN, own env vars. No shared infrastructure between deployments.
- **Site identity comes from `ORIGIN`** env var set per-deployment in Coolify — not from request hostname or multi-tenant resolution.
- **Discord OAuth is NOT yet configured** in `auth.ts` despite env vars being defined (only `emailAndPassword` enabled)
- **`requireAssertions: true`** enforced in Vitest config — every test MUST have assertions
- **E2E test pattern**: files must match `**/*.e2e.{ts,js}` (Playwright config)
- **Tailwind CSS v4 uses `@import 'tailwindcss'`** NOT `@tailwind` directives
- **Prettier uses TABS** (not spaces) — config is in `.prettierrc`
- **`.npmrc` has `engine-strict=true`** — wrong Node.js version will block installs
- **No `docs/` folder exists** at root despite being referenced in structure diagrams
- **`db:start` uses Docker Compose** for local PostgreSQL (`compose.yaml`)
- **SvelteKit adapter-auto** — adapter auto-detects environment (no platform lock-in)
- **`<body data-sveltekit-preload-data="hover">`** in `app.html` — preloads data on hover

## Key Commands
| Command | Purpose |
|---------|---------|
| `npm run dev` | Start dev server |
| `npm run test:unit` | Vitest (unit + browser component tests) |
| `npm run test:e2e` | Playwright (requires `build` + `preview`) |
| `npm run db:start` | Start PostgreSQL via Docker Compose |
| `npm run db:push` | Push schema to DB (dev) |
| `npm run db:generate` | Generate Drizzle migration |
| `npm run db:migrate` | Apply migrations |
| `npm run auth:schema` | Generate Better Auth schema tables |
| `npm run check` | Type-check with svelte-check |
| `npm run lint` | ESLint + Prettier check |
| `npm run format` | Prettier auto-format |

## Custom Modes (`.roomodes`)
6 custom modes: Mode Writer, Skill Writer, Documentation Writer, Project Research (read-only), Security Reviewer, DevOps. See `.roomodes` for details.
