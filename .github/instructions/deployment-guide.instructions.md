---
description: 'Use when deploying a new site instance, setting up Coolify, configuring Docker, managing migrations, or troubleshooting deployment issues for The Collective Hub.'
applyTo: 'Dockerfile', 'docker-compose.yml', '.dockerignore', 'Coolify'
---

# Deployment Guide

## Deployment Model

The Collective Hub uses **multiple Coolify deployments** from a single Git repository. Each deployment runs the same Docker image but is configured with different environment variables — most importantly, a different `SITE_SLUG`.

```
Git Repo (main branch)
    │
    ├── Coolify Deployment "bad-movies-theater"
    │   ├── SITE_SLUG=bad-movies-theater
    │   ├── PUBLIC_SITE_URL=https://badmovies.example.com
    │   ├── OWNER_DISCORD_ID=... (site owner)
    │   └── RUN_MIGRATIONS=false
    │
    ├── Coolify Deployment "garbage-day"
    │   ├── SITE_SLUG=garbage-day
    │   ├── PUBLIC_SITE_URL=https://garbageday.example.com
    │   ├── OWNER_DISCORD_ID=... (site owner)
    │   └── RUN_MIGRATIONS=false
    │
    └── Coolify Deployment "primary" (migration runner)
        ├── SITE_SLUG=primary
        ├── PUBLIC_SITE_URL=https://primary.example.com
        ├── OWNER_DISCORD_ID=... (David's Discord ID)
        └── RUN_MIGRATIONS=true
```

## Docker

The project uses a multi-stage Docker build (see [`Dockerfile`](Dockerfile)):

```dockerfile
# Stage 1: Build
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production
FROM node:22-alpine AS runner
WORKDIR /app
COPY --from=builder /app/build build/
COPY --from=builder /app/node_modules node_modules/
COPY package.json .
EXPOSE 3000
CMD ["node", "build"]
```

### Local Development with Docker Compose

See [`docker-compose.yml`](docker-compose.yml) for local development setup, which includes:
- Postgres database container
- The SvelteKit app container
- Proper environment variables for local dev

```bash
docker compose up
```

## Adding a New Site

To add a new community/theater site:

1. **Insert a site row in the database:**
   ```sql
   INSERT INTO sites (slug, name) VALUES ('new-community', 'New Community');
   INSERT INTO site_settings (site_id, settings) VALUES (
       (SELECT id FROM sites WHERE slug = 'new-community'),
       '{"branding":{"siteName":"New Community","tagline":"Coming soon"},"theme":{"preset":"dark","accentColor":"#e63946","backgroundColor":"#1a1a2e","textColor":"#eaeaea"},"homepage":{"heroTitle":"Welcome","heroSubtitle":"","aboutText":"","primaryButtonText":"Join us on Discord","primaryButtonLink":"","showNextEvent":true,"showSchedule":true},"layout":{"preset":"standard"}}'
   );
   ```
   Or use the seed script pattern.

2. **Create a new Coolify deployment:**
   - Point to the same Git repo + branch
   - Set `SITE_SLUG=new-community`
   - Set `PUBLIC_SITE_URL=https://newcommunity.example.com`
   - Set `OWNER_DISCORD_ID` to the site owner's Discord user ID
   - Set `RUN_MIGRATIONS=false` (unless this is the designated migration runner)

3. **Configure DNS:** Point the domain to the Coolify deployment's IP/URL

## Environment Variables Per Deployment

Each deployment needs its own set of env vars. See [`docs/04-environment-variables.md`](docs/04-environment-variables.md) for the full reference.

**Rules:**
- Shared vars (`DATABASE_URL`, `DISCORD_CLIENT_ID`, `CDN_BASE_URL`) must be identical across all deployments
- Per-site vars (`SITE_SLUG`, `PUBLIC_SITE_URL`, `OWNER_DISCORD_ID`) are unique per deployment
- `RUN_MIGRATIONS=true` on exactly one deployment (the primary/migration runner)

## Migration Runner

The migration runner deployment is critical:

- It runs `RUN_MIGRATIONS=true` and executes schema migrations on startup
- It must be deployed **first** when schema changes are included in a release
- Other deployments should be deployed after the migration completes
- If the migration runner is down, other deployments still serve traffic (they just won't have schema changes)

## Coolify Configuration

In Coolify, each deployment:
- Uses the **same Git repository** and branch
- Has its own **unique environment variables**
- Can have its own **domain/SSL configuration**
- Is deployed independently (zero-downtime per deployment)

### Deploy Strategy

1. Deploy the migration runner first (`RUN_MIGRATIONS=true`)
2. Wait for it to be healthy (migrations complete)
3. Deploy other sites in any order
4. Each deployment is independent — one failing doesn't affect others

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| "Site not found" on load | No matching row in `sites` table for `SITE_SLUG` | Insert the site row or fix `SITE_SLUG` env var |
| Login redirects to wrong URL | `PUBLIC_SITE_URL` / `BETTER_AUTH_URL` mismatch | Ensure both match the deployment's actual URL |
| "Already exists" errors on deploy | Two deployments running migrations simultaneously | Check only one has `RUN_MIGRATIONS=true` |
| Images not loading | `CDN_BASE_URL` missing or wrong, or `cdnKey` starts with `/` | Ensure no leading slash on CDN keys |
| Auth callbacks failing | Discord OAuth redirect URI doesn't match deployment URL | Add the correct URL to Discord Developer Portal |
