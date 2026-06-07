# AGENTS.md — Debug Mode

This file provides guidance to debug agents working in this repository.

## Known Placeholders & Scaffold State
- **Auth schema is a placeholder**: `src/lib/server/db/auth.schema.ts` shows "If you see this file, you have not run the auth:schema script yet" — run `npm run auth:schema` to generate
- **Discord OAuth not wired**: `src/lib/server/auth.ts` only has `emailAndPassword` enabled despite Discord env vars being defined in `.env.example`. If Discord auth fails, check the plugin isn't missing.
- **No app features exist yet**: Only demo pages, scaffold auth, and a `task` table. Issues may stem from unbuilt features.

## Debugging Gotchas
- **Database**: Requires Docker (run `npm run db:start`). `DATABASE_URL` env var must be set and point to the correct per-deployment database. Use `db:studio` to inspect with Drizzle Studio.
- **Session issues**: Check `hooks.server.ts` — `auth.api.getSession()` runs on every request. If auth fails, ensure Better Auth server is reachable and `ORIGIN` env var matches the deployment URL.
- **Build fails**: Run `npm run check` first for type errors. Runes mode may reject Svelte 4 syntax.
- **Playwright e2e failures**: Need `npm run build` first (Playwright config starts `preview` on port 4173). `test:e2e` runs `build && preview` automatically via config.
- **No `docs/` folder exists** — any debug documentation there is fictional
