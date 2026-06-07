# AGENTS.md — Ask Mode

This file provides guidance for answering questions about this repository.

## Documentation Sources (Read These First)
- **[`.github/copilot-instructions.md`](.github/copilot-instructions.md)** — 10 hard multi-tenant rules, project overview, tech stack
- **[`.github/instructions/`](.github/instructions/)** — 16 detailed instruction files covering: multi-tenant architecture, database schema, auth/roles, deployment, admin panel, CDN/assets, public theming, API patterns, testing, components, icons, Svelte 5 patterns, Tailwind CSS, etc.
- **[`AGENTS.md`](AGENTS.md)** (project root) — Non-obvious gotchas and key commands
- **No `docs/` folder exists** at root — any reference to it in diagrams is aspirational

## Key Context for Answering Questions
- This is a **single-site template deployed per-owner with isolated database and CDN**, not a finished app — many features are documented but not yet implemented
- **Environment variables per deployment**: `DATABASE_URL`, `ORIGIN`, `BETTER_AUTH_SECRET`, `OWNER_DISCORD_ID`, `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, `DISCORD_BOT_TOKEN`
- **Project Research mode** (defined in `.roomodes`) is read-only — good for exploring the codebase
- **6 custom modes** are available: Mode Writer, Skill Writer, Documentation Writer, Project Research, Security Reviewer, DevOps
- Authentication is scaffolded with Better Auth but **only email/password is configured** — Discord OAuth is planned but not wired
- Phase roadmap documented in `.github/instructions/` — Phases 1-5 with ordering
- Tailwind CSS v4 uses `@import` syntax, not the classic `@tailwind` directives
