# The Collective Hub

> A reusable SvelteKit website template for launching branded landing pages for online theater hosts, watch-party communities, and similar groups. One codebase, multiple deployed websites, one shared database, one CDN.

## Features

- Public homepage for a theater/community host with event and schedule display
- Discord OAuth login for site owners and admins
- Admin panel for customizing branding (name, logo, colors, tagline)
- Homepage content editor (intro text, hero, buttons, links)
- Multi-site support from a single codebase using `SITE_SLUG` environment variable
- Shared PostgreSQL database with data scoped by `siteId` — logically multi-tenant
- Shared CDN/object storage bucket with per-site path namespacing
- Full image upload flow with automatic WebP conversion and optimization
- Asset library for browsing and managing uploaded files
- Super admin cross-site access via `SUPER_ADMIN_DISCORD_IDS`

## Tech Stack

| Layer | Choice | Notes |
|-------|--------|-------|
| Framework | SvelteKit | File-based routing, SSR, API routes |
| Language | TypeScript | Strict mode |
| Database | PostgreSQL 16 | Single shared instance for all sites |
| ORM | Drizzle ORM | Type-safe, SQL-first |
| Auth | Better Auth | Discord OAuth provider |
| CDN / Storage | Bunny CDN | Single bucket, site-scoped paths, auto WebP conversion |
| Image Processing | Sharp | Server-side resize and format conversion |
| Containerization | Docker | Multi-stage build, Node 22 Alpine |
| Deployment | Coolify | Multiple deployments from one Git repo |

## Getting Started

### Prerequisites

- Node.js 22+
- Docker (for local PostgreSQL)

### Setup

```bash
# 1. Clone and install
git clone <repo-url>
cd collective-terminal
npm install

# 2. Start PostgreSQL
docker compose up -d

# 3. Create your .env file
```

Create a `.env` file at the project root with these values for local development:

```env
DATABASE_URL=postgresql://hub_dev:hub_dev_password@localhost:5432/collective_hub
SITE_SLUG=local-dev
```

```bash
# 4. Create database tables
npm run db:push
```

> **Alternative:** Generate and run formal migrations instead of `db:push`:
> ```bash
> npm run db:generate
> npm run db:migrate
> ```

```bash
# 5. Seed the default "local-dev" site
npm run db:seed

# 6. Start the dev server
npm run dev
```

The app opens at [http://localhost:5173](http://localhost:5173).

> **Note:** Discord login will not work locally without a configured Discord OAuth application with `http://localhost:5173` in its redirect URL list. The site resolver and public homepage function without Discord auth.

## Environment Variables

### Required

| Variable | Example | Description |
|----------|---------|-------------|
| `SITE_SLUG` | `bad-movies-theater` | Identifies which site this deployment serves. Must match a `slug` in the `sites` table. |
| `PUBLIC_SITE_URL` | `https://badmovies.example.com` | Public URL of this deployment. Used for auth callbacks and canonical URLs. |
| `DATABASE_URL` | `postgresql://user:pass@host:5432/collective_hub` | PostgreSQL connection string. Same value across all deployments. |
| `BETTER_AUTH_SECRET` | *(generated)* | Secret key for session signing. Must be identical across all deployments. |
| `BETTER_AUTH_URL` | `https://badmovies.example.com` | Base URL for auth callbacks. Must match `PUBLIC_SITE_URL`. |
| `DISCORD_CLIENT_ID` | `123456789012345678` | Discord OAuth application client ID. Shared across all deployments. |
| `DISCORD_CLIENT_SECRET` | `abc123...` | Discord OAuth application client secret. Shared across all deployments. |
| `OWNER_DISCORD_ID` | `123456789012345678` | Discord user ID of the site owner. Bootstraps ownership on first login. Per-site. |

### CDN (Required for asset uploads)

| Variable | Example | Description |
|----------|---------|-------------|
| `CDN_BASE_URL` | `https://cdn.example.com` | Base URL for constructing public CDN URLs. |
| `CDN_STORAGE_ENDPOINT` | `https://ny.storage.bunnycdn.com` | Storage API endpoint. |
| `CDN_ACCESS_KEY` | `abc123...` | Storage access key (BunnyCDN password or S3 access key). |
| `CDN_BUCKET` | `collective-hub` | Bucket or storage zone name. |

### Optional

| Variable | Example | Description |
|----------|---------|-------------|
| `SUPER_ADMIN_DISCORD_IDS` | `123456789,987654321` | Comma-separated Discord user IDs with cross-site super admin access. |
| `RUN_MIGRATIONS` | `true` | Whether this deployment runs database migrations on startup. Only **one** deployment should have `true`. |
| `NODE_ENV` | `production` | Node environment (`development` or `production`). |
| `LOG_LEVEL` | `info` | Logging verbosity (`debug`, `info`, `warn`, `error`). |

### Shared vs Per-Site

**Shared** (same across all deployments): `DATABASE_URL`, `BETTER_AUTH_SECRET`, `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, `SUPER_ADMIN_DISCORD_IDS`, `CDN_*`

**Per-site** (unique per deployment): `SITE_SLUG`, `PUBLIC_SITE_URL`, `BETTER_AUTH_URL`, `OWNER_DISCORD_ID`, `RUN_MIGRATIONS`

## npm Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `vite dev` | Start the Vite dev server with HMR. |
| `build` | `vite build` | Build for production (output to `build/`). |
| `preview` | `vite preview` | Preview the production build locally. |
| `db:generate` | `drizzle-kit generate` | Generate SQL migration files from Drizzle schema changes. |
| `db:migrate` | `drizzle-kit migrate` | Apply pending SQL migrations to the database. |
| `db:push` | `drizzle-kit push` | Push schema changes directly to the database (no migration files). Convenient for early development. |
| `db:studio` | `drizzle-kit studio` | Open Drizzle Studio, a GUI for browsing and editing data. |
| `db:seed` | `tsx src/lib/server/db/seed.ts` | Insert the default `local-dev` site and its settings row. Idempotent — safe to run multiple times. |
| `check` | `svelte-kit sync && svelte-check` | Type-check the project with `svelte-check`. |
| `lint` | `eslint .` | Run ESLint across the project. |
| `format` | `prettier --write .` | Format all source files with Prettier. |

## Project Structure

```
.
├── src/
│   ├── app.d.ts                    # App types, locals augmentation
│   ├── app.html                    # HTML shell
│   ├── hooks.server.ts             # Site resolver, preview mode, auth, migration runner, deactivation guard
│   ├── lib/
│   │   ├── server/
│   │   │   ├── auth.ts             # Better Auth configuration (Discord OAuth)
│   │   │   ├── cdn.ts              # CDN URL helpers (BunnyCDN / S3)
│   │   │   ├── site-resolver.ts    # Site loading by SITE_SLUG (supports preview mode)
│   │   │   ├── preview-token.ts    # HMAC-signed preview token sign/verify
│   │   │   ├── settings-writer.ts  # Shared draft/publish/discard DB operations
│   │   │   ├── discord.ts          # Discord REST API client (Scheduled Events) + cache
│   │   │   ├── audit-log.ts        # Audit event logging utility
│   │   │   └── db/
│   │   │       ├── index.ts        # Drizzle + Postgres connection
│   │   │       ├── migrate.ts      # Automated migration runner
│   │   │       ├── schema.ts       # All table definitions (sites, users, memberships, siteSettings, assets, navLinks, socialLinks, events, auditLog)
│   │   │       └── seed.ts         # Local dev seed data
│   │   └── shared/
│   │       ├── types.ts            # Shared TypeScript types (SiteSettingsData, FeatureFlags, DiscordSettings, etc.)
│   │       └── timezone.ts         # Client-side timezone conversion utilities
│   └── routes/
│       ├── +layout.server.ts       # Root layout: site context, auth, owner bootstrap, super admin, preview refinement
│       ├── +layout.svelte          # Root layout: theme CSS variables, favicon
│       ├── +page.server.ts         # Public homepage data (branding, events, nav/social links, Discord events)
│       ├── +page.svelte            # Public homepage (hero, about, events, social links)
│       ├── login/
│       │   ├── +page.server.ts     # Login page loader
│       │   └── +page.svelte        # "Login with Discord" page
│       ├── admin/
│       │   ├── +layout.server.ts   # Admin auth guard, hasDrafts check
│       │   ├── +layout.svelte      # Admin shell (sidebar nav, top bar, preview controls)
│       │   ├── +page.server.ts     # Admin dashboard loader
│       │   ├── +page.svelte        # Admin dashboard (quick stats, links)
│       │   ├── branding/           # Logo, colors, theme editor (saveDraft/publish/discardDrafts)
│       │   ├── settings/           # Site name, tagline, Discord config editor
│       │   ├── homepage/           # Hero title, subtitle, about, CTA editor
│       │   ├── links/              # Nav links + social links CRUD manager
│       │   ├── events/             # Events CRUD manager (or "Managed in Discord" banner)
│       │   ├── assets/             # Asset library (upload, browse, copy CDN URL)
│       │   ├── team/               # Role management (add/remove admins and editors)
│       │   ├── super/              # Super admin dashboard (all sites, create, feature flags, clone)
│       │   └── audit-log/          # Audit log viewer (filterable by entity type)
│       └── api/
│           ├── assets/             # Asset upload API endpoint (webp conversion, validation)
│           └── preview/            # Preview cookie API (enable/disable preview mode)
├── drizzle/                        # Drizzle migration files (5 migrations)
├── scripts/
│   ├── clone-site.mjs              # Standalone site cloning script
│   └── seed.mjs                    # Seed script entry point
├── docs/                           # Project documentation (11 planning docs)
├── docker-compose.yml              # Local PostgreSQL
├── Dockerfile                      # Multi-stage production build (Node 22 Alpine)
├── drizzle.config.ts               # Drizzle Kit configuration
├── svelte.config.js                # SvelteKit configuration (Node adapter)
├── tsconfig.json
├── vite.config.ts
└── package.json
```

## Deployment

The project is deployed via **Coolify** with Docker. Each community site is a separate Coolify deployment pointing to the same Git repository and branch. Deployments are differentiated solely by environment variables — specifically `SITE_SLUG`.

```
Git Repo (main branch)
    │
    ├── Coolify Deployment "bad-movies-theater"
    │   └── Env: SITE_SLUG=bad-movies-theater
    │
    ├── Coolify Deployment "garbage-day"
    │   └── Env: SITE_SLUG=garbage-day
    │
    └── Coolify Deployment "future-site"
        └── Env: SITE_SLUG=future-site
```

Key deployment rules:

- All deployments share one PostgreSQL database and one CDN bucket.
- Exactly **one** deployment must have `RUN_MIGRATIONS=true`. All others set `RUN_MIGRATIONS=false`.
- The migration-runner deployment should be deployed first when schema changes are included in a release.
- Sensitive values (secrets, keys, connection strings) are stored in Coolify's environment variable management — never committed to the repository.
- The Dockerfile uses a multi-stage build (Node 22 Alpine) producing a small production image that runs [`build/index.js`](build/index.js).

## License

TBD
