# Environment Variables Document — The Collective Hub

## Overview

Environment variables are the only difference between deployments. Each Coolify deployment has its own set of env vars, but all deployments share the same database, CDN, and Discord OAuth app.

---

## Variable Reference

### Required for Every Deployment

| Variable | Example | Description | Shared or Per-Site? |
|----------|---------|-------------|---------------------|
| `SITE_SLUG` | `bad-movies-theater` | Identifies which site this deployment serves. Must match a `slug` in the `sites` table. | **Per-site** |
| `PUBLIC_SITE_URL` | `https://badmovies.example.com` | The public URL of this deployment. Used for auth callbacks, canonical URLs. | **Per-site** |
| `DATABASE_URL` | `postgresql://user:pass@host:5432/collective_hub` | Postgres connection string. | **Shared** (same for all) |
| `BETTER_AUTH_SECRET` | (generated) | Secret key for Better Auth session signing. | **Shared** (same for all) |
| `BETTER_AUTH_URL` | `https://badmovies.example.com` | Base URL for auth callbacks. Must match `PUBLIC_SITE_URL`. | **Per-site** |
| `DISCORD_CLIENT_ID` | `123456789012345678` | Discord OAuth application client ID. | **Shared** |
| `DISCORD_CLIENT_SECRET` | `abc123...` | Discord OAuth application client secret. | **Shared** |
| `OWNER_DISCORD_ID` | `123456789012345678` | Discord user ID of the site owner. Used to bootstrap ownership on first login. | **Per-site** |

### Required for CDN (Phase 1)

| Variable | Example | Description | Shared or Per-Site? |
|----------|---------|-------------|---------------------|
| `CDN_BASE_URL` | `https://cdn.example.com` | Base URL for constructing CDN URLs. | **Shared** |
| `CDN_STORAGE_ENDPOINT` | `https://ny.storage.bunnycdn.com` | Storage API endpoint. | **Shared** |
| `CDN_ACCESS_KEY` | `abc123...` | Storage access key. | **Shared** |
| `CDN_SECRET_KEY` | (S3 only) | Secret key for S3-compatible storage. | **Shared** |
| `CDN_BUCKET` | `collective-hub` | Bucket or storage zone name. | **Shared** |
| `CDN_REGION` | `us-east-1` | Region for S3-compatible storage. | **Shared** |

### Super Admin

| Variable | Example | Description | Shared or Per-Site? |
|----------|---------|-------------|---------------------|
| `SUPER_ADMIN_DISCORD_IDS` | `123456789,987654321` | Comma-separated Discord user IDs with cross-site super admin access. | **Shared** |

### Migration Control

| Variable | Example | Description | Shared or Per-Site? |
|----------|---------|-------------|---------------------|
| `RUN_MIGRATIONS` | `true` | Whether this deployment should run database migrations on startup. Only one deployment should have this set to `true`. | **Per-site** (only one `true`) |

### Optional

| Variable | Example | Description | Shared or Per-Site? |
|----------|---------|-------------|---------------------|
| `NODE_ENV` | `production` | Node environment. | **Per-site** (usually `production`) |
| `LOG_LEVEL` | `info` | Logging verbosity. | **Per-site** |
| `FEATURE_FLAGS` | `events:on` | Comma-separated feature flags (future). | **Per-site** |

---

## Example: Full Deployment Env File

### Deployment: bad-movies-theater (primary — runs migrations)

```env
# Site Identity
SITE_SLUG=bad-movies-theater
PUBLIC_SITE_URL=https://badmovies.example.com

# Database (shared)
DATABASE_URL=postgresql://hub_app:password@db.example.com:5432/collective_hub

# Auth (Better Auth)
BETTER_AUTH_SECRET=generated-secret-value-here
BETTER_AUTH_URL=https://badmovies.example.com

# Discord OAuth (shared)
DISCORD_CLIENT_ID=123456789012345678
DISCORD_CLIENT_SECRET=your-discord-client-secret

# Ownership Bootstrap
OWNER_DISCORD_ID=123456789012345678

# Super Admin
SUPER_ADMIN_DISCORD_IDS=111111111111111111

# Migration Control
RUN_MIGRATIONS=true

# CDN (shared)
CDN_BASE_URL=https://cdn.example.com
CDN_STORAGE_ENDPOINT=https://ny.storage.bunnycdn.com
CDN_ACCESS_KEY=your-bunny-access-key
CDN_BUCKET=collective-hub

# Optional
NODE_ENV=production
LOG_LEVEL=info
```

### Deployment: garbage-day (secondary — skips migrations)

```env
# Site Identity
SITE_SLUG=garbage-day
PUBLIC_SITE_URL=https://garbageday.example.com

# Database (shared — same value)
DATABASE_URL=postgresql://hub_app:password@db.example.com:5432/collective_hub

# Auth (Better Auth)
BETTER_AUTH_SECRET=generated-secret-value-here
BETTER_AUTH_URL=https://garbageday.example.com

# Discord OAuth (shared — same value)
DISCORD_CLIENT_ID=123456789012345678
DISCORD_CLIENT_SECRET=your-discord-client-secret

# Ownership Bootstrap
OWNER_DISCORD_ID=987654321098765432

# Super Admin (same value)
SUPER_ADMIN_DISCORD_IDS=111111111111111111

# Migration Control
RUN_MIGRATIONS=false

# CDN (shared — same values)
CDN_BASE_URL=https://cdn.example.com
CDN_STORAGE_ENDPOINT=https://ny.storage.bunnycdn.com
CDN_ACCESS_KEY=your-bunny-access-key
CDN_BUCKET=collective-hub

# Optional
NODE_ENV=production
LOG_LEVEL=info
```

---

## What's Shared vs Per-Site

```
Shared across ALL deployments:
├── DATABASE_URL              (one database)
├── BETTER_AUTH_SECRET        (same session signing key)
├── DISCORD_CLIENT_ID         (one Discord OAuth app)
├── DISCORD_CLIENT_SECRET
├── SUPER_ADMIN_DISCORD_IDS   (system maintainers)
├── CDN_BASE_URL              (one CDN bucket)
├── CDN_STORAGE_ENDPOINT
├── CDN_ACCESS_KEY
├── CDN_SECRET_KEY (if S3)
├── CDN_BUCKET
└── CDN_REGION (if S3)

Unique per deployment:
├── SITE_SLUG                 (which site this is)
├── PUBLIC_SITE_URL           (its domain)
├── BETTER_AUTH_URL           (must match PUBLIC_SITE_URL)
├── OWNER_DISCORD_ID          (who owns this site)
└── RUN_MIGRATIONS            (only one deployment = true)
```

---

## Notes & Warnings

### Discord OAuth: Shared App

All sites share one Discord OAuth application. This means:
- Users see the same app name when authorizing (e.g., "The Collective Hub")
- The OAuth redirect URL list must include every site's callback URL
- Discord has a limit on redirect URLs — manageable for a handful of sites
- If the system grows to many sites, each site may need its own Discord OAuth app, or a central auth domain pattern should be introduced

### Better Auth Secret

`BETTER_AUTH_SECRET` must be the same across all deployments because sessions are signed with it. This enables super admins to potentially navigate between site admin panels with a single session (future enhancement).

### Database Migrations — Automated but Coordinated

Migrations run automatically on app startup, but only on the deployment with `RUN_MIGRATIONS=true`. All other deployments skip migrations (`RUN_MIGRATIONS=false`). This means:

- **Exactly one deployment** is designated as the migration runner
- That deployment must be deployed first when schema changes are made
- If the migration runner is down, other deployments still work (they just can't run new migrations)
- Choose a stable, low-traffic deployment as the migration runner (or the super admin dashboard deployment)

### Super Admin Access

`SUPER_ADMIN_DISCORD_IDS` is a comma-separated list of Discord user IDs. Users matching these IDs bypass site-scoped membership checks and can access any site's admin panel. This is intended for David (system maintainer) and should be kept to a minimal, trusted set of IDs.

### Sensitive Values

All secrets (database URL, auth secrets, Discord secrets, CDN keys) must be stored securely in Coolify's environment variable management — never committed to the repository.
