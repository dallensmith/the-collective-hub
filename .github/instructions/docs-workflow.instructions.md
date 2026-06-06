---
description: 'Use when maintaining project documentation in the docs/ directory. Covers guidelines for updating docs when code changes, keeping docs in sync with implementation, when to create new docs vs update existing ones, and the documentation review process for The Collective Hub.'
applyTo: 'docs/*.md'
---

# Documentation Workflow

> This instruction file covers conventions for maintaining the project documentation in [`docs/`](docs/). The Collective Hub's documentation is technical project documentation — architecture plans, database schemas, UX plans, environment variable references, and development roadmaps.

## Overview

The `docs/` directory contains the canonical technical reference for The Collective Hub:

| File | Purpose |
| ---- | ------- |
| [`00-project-brief.md`](docs/00-project-brief.md) | Project overview — what The Collective Hub is and who it's for |
| [`01-architecture-plan.md`](docs/01-architecture-plan.md) | Technical architecture — stack, site resolution, deployment model |
| [`02-database-plan.md`](docs/02-database-plan.md) | Database schema — all tables, relationships, migration strategy |
| [`03-feature-roadmap.md`](docs/03-feature-roadmap.md) | Feature phases — Phase 1 (Foundation) through Phase 4 |
| [`04-environment-variables.md`](docs/04-environment-variables.md) | Environment variable reference — shared vs per-site |
| [`05-admin-ux-plan.md`](docs/05-admin-ux-plan.md) | Admin panel UX — layout, navigation, settings pages |
| [`06-public-site-ux-plan.md`](docs/06-public-site-ux-plan.md) | Public site UX — hero, about, events, social links, footer |
| [`07-development-plan.md`](docs/07-development-plan.md) | Development workflow — git flow, Docker, testing, deployment |
| [`08-open-questions.md`](docs/08-open-questions.md) | Open questions — decisions deferred for later resolution |
| [`09-risks-and-rules.md`](docs/09-risks-and-rules.md) | Critical risks — migration conflicts, data leaks, deployment strategy |

## When to Update Documentation

### Code Changes That Require a Docs Update

Update the relevant `docs/*.md` file when making code changes that affect:

- **Database schema** — new tables, columns, indexes, or relationship changes → update [`02-database-plan.md`](docs/02-database-plan.md) and [`database-schema.instructions.md`](.github/instructions/database-schema.instructions.md)
- **Architecture** — site resolution flow, env vars, deployment model → update [`01-architecture-plan.md`](docs/01-architecture-plan.md) and [`04-environment-variables.md`](docs/04-environment-variables.md)
- **Environment variables** — new required env vars → update [`04-environment-variables.md`](docs/04-environment-variables.md) and the `.env` stub in [`ci-web.yml`](.github/workflows/ci-web.yml)
- **Admin panel** — new admin pages, changed settings flow → update [`05-admin-ux-plan.md`](docs/05-admin-ux-plan.md) and [`admin-panel.instructions.md`](.github/instructions/admin-panel.instructions.md)
- **Public site** — new sections, changed rendering logic → update [`06-public-site-ux-plan.md`](docs/06-public-site-ux-plan.md) and [`public-site-theming.instructions.md`](.github/instructions/public-site-theming.instructions.md)
- **Feature roadmap** — new features, changed priorities, phase shifts → update [`03-feature-roadmap.md`](docs/03-feature-roadmap.md)
- **Risks** — newly discovered risks or changed mitigations → update [`09-risks-and-rules.md`](docs/09-risks-and-rules.md)

### When to Update vs Create

| Situation | Action |
| --------- | ------ |
| A feature or configuration covered by an existing doc changes | **Update** the existing file |
| A new aspect of the project needs documentation that fits an existing doc | **Update** the existing file with a new section |
| A fundamentally new concern emerges that doesn't fit any existing doc | **Create** a new `docs/XX-topic.md` file and add it to the table in AGENTS.md and this file |
| A code change is purely internal refactoring with no architectural impact | **No docs update needed** |

## Documentation Standards

### Format

- All docs are Markdown (`.md`) files with GitHub-flavored Markdown
- Use ATX headings (`#`, `##`, `###`) — no Setext headings
- Include a table of contents for files longer than ~100 lines
- Use relative links to reference other docs and code files
- Code blocks should specify the language for syntax highlighting

### Cross-Referencing

- Reference tech stack instruction files in `.github/instructions/` where relevant
- Reference code paths with links to the actual file (e.g., [`site-resolver.ts`](src/lib/server/site-resolver.ts))
- Keep the file reference index in [`AGENTS.md`](AGENTS.md) up to date when adding new documentation

### Style

- Write for **David (system maintainer)** as the primary audience — assume technical competence but need clarity
- Be **specific and concise** — avoid marketing language, focus on technical accuracy
- Use **tables** for structured information (env vars, routes, schema columns)
- Use **bullet lists** for unordered items, **numbered lists** for sequential steps
- Include **example code** where it clarifies usage

## Documentation Review Process

### During Development

1. **Self-review**: When implementing a feature, check whether any `docs/*.md` files need updating
2. **Co-located changes**: Include documentation updates in the same PR/commit as the code change — never in a separate "update docs" pass
3. **Cross-reference check**: After updating a doc, verify all cross-references still resolve (file paths, section anchors)

### Before Merge

1. **Freshness check**: Does the doc still reflect the current state of the code?
2. **Accuracy check**: Are all code examples, SQL queries, and configuration snippets up to date?
3. **Completeness check**: Does the doc cover edge cases and error states, or just the happy path?
4. **Link check**: Do all relative links resolve correctly?

### Periodic Maintenance

- When adding a new feature from the roadmap ([`03-feature-roadmap.md`](docs/03-feature-roadmap.md)), review all docs that reference the affected system
- After a deployment involving schema changes, verify [`02-database-plan.md`](docs/02-database-plan.md) matches the actual database state
- When a risk in [`09-risks-and-rules.md`](docs/09-risks-and-rules.md) materializes or is mitigated, update it promptly

## Related Instruction Files

The following instruction files in `.github/instructions/` provide detailed conventions that complement the project documentation:

| File | Focus |
| ---- | ----- |
| [`multi-tenant-architecture.instructions.md`](.github/instructions/multi-tenant-architecture.instructions.md) | Site resolution, data scoping, deployment model |
| [`database-schema.instructions.md`](.github/instructions/database-schema.instructions.md) | All tables, relationships, migration strategy |
| [`auth-and-roles.instructions.md`](.github/instructions/auth-and-roles.instructions.md) | Better Auth, Discord OAuth, role system |
| [`deployment-guide.instructions.md`](.github/instructions/deployment-guide.instructions.md) | Coolify multi-deploy, Docker, migration runner |
| [`admin-panel.instructions.md`](.github/instructions/admin-panel.instructions.md) | Admin layout, auth guards, form patterns |
| [`cdn-and-assets.instructions.md`](.github/instructions/cdn-and-assets.instructions.md) | CDN helpers, image upload, webp conversion |
| [`public-site-theming.instructions.md`](.github/instructions/public-site-theming.instructions.md) | SSR landing page, CSS custom properties |
| [`api-route-patterns.instructions.md`](.github/instructions/api-route-patterns.instructions.md) | API route conventions, validation, site scoping |
| [`testing-multi-tenant.instructions.md`](.github/instructions/testing-multi-tenant.instructions.md) | Multi-tenant test patterns, mocking, auth testing |
| [`server-ts.instructions.md`](.github/instructions/server-ts.instructions.md) | Server-side TypeScript patterns, Drizzle queries |
