# AGENTS.md — Architect Mode

This file provides guidance for architectural planning in this repository.

## Architectural Constraints (Non-Obvious)
- **Single template deployed per-site**: Each deployment is fully isolated with its own database + CDN. No shared infrastructure between deployments.
- **Site identity from `ORIGIN`** env var set per-deployment in Coolify — not from request hostname or multi-tenant resolution.
- **No multi-tenant data scoping needed** — each server only holds its own data.
- **Discord OAuth** (via Better Auth) is the authentication mechanism. `OWNER_DISCORD_ID` bootstraps the site owner.
- **Auth flow** will use Discord Authentication only (`emailAndPassword` currently enabled as placeholder).
- **CDN stores keys, not URLs**: Store CDN paths (e.g., `uploads/logo.png`) in the database. Full URLs are constructed by a helper at render time.
- **Migration strategy**: Prefer additive migrations (no destructive changes). One deployment instance runs migrations exclusively.

## Architecture Documentation
- Comprehensive architecture docs: [`.github/instructions/`](.github/instructions/) (16 files covering architecture, auth, DB, deployment, components, etc.) — note that some docs may reference multi-tenant patterns that are aspirational rather than reflective of the current architecture.
- Database schema: [`.github/instructions/database-schema.instructions.md`](.github/instructions/database-schema.instructions.md)
- Auth design: [`.github/instructions/auth-and-roles.instructions.md`](.github/instructions/auth-and-roles.instructions.md)
- Deployment model: [`.github/instructions/deployment-guide.instructions.md`](.github/instructions/deployment-guide.instructions.md)

## Current State vs Planned
| Feature | Status |
|---------|--------|
| SvelteKit 5 + Runes + TypeScript | ✅ Implemented |
| Tailwind CSS v4 | ✅ Implemented |
| Better Auth + Session hooks | ✅ Implemented (email/password only) |
| Drizzle ORM + PostgreSQL | ✅ Implemented (task table only) |
| Discord OAuth | ❌ Not wired (env vars exist) |
| Admin panel | ❌ Not implemented |
| Public landing pages | ❌ Not implemented |
| CDN integration | ❌ Not implemented |
| Per-deployment database setup | ❌ Not implemented |

## Key Architectural Notes
- `.github/instructions/` may reference multi-tenant patterns (shared DB, site resolution) — these are aspirational. The actual architecture is per-deployment isolation.
