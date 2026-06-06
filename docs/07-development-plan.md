# Development Implementation Plan

## How to Use This

This is a step-by-step build order for Phase 1 and beyond. Each step lists what to build, what it depends on, and how to verify it works.

**Follow the order.** Each step builds on the previous one. Don't skip ahead.

---

## Phase 1: Foundation

### Step 1: Initialize SvelteKit Project

**What to do:**
- Create a new SvelteKit project with `create-svelte` (choose TypeScript, ESLint, Prettier)
- Set up the directory structure as outlined in the architecture plan
- Configure `svelte.config.js` with the Node adapter for production builds
- Create a basic `+page.svelte` that says "Hello World"
- Create a `Dockerfile` for production builds

**Depends on:** Nothing.

**Verify:** `npm run dev` starts. Browser shows "Hello World". `docker build` succeeds.

---

### Step 2: Set Up Postgres and Drizzle

**What to do:**
- Install `drizzle-orm`, `drizzle-kit`, and `postgres` (the npm package)
- Create `drizzle.config.ts`
- Create `src/lib/server/db/index.ts` with the Postgres connection
- Create `src/lib/server/db/schema.ts` with the `sites` table only (start simple)
- Run `drizzle-kit push` to create the table in Postgres
- Insert a test site row manually: `INSERT INTO sites (slug, name) VALUES ('test-site', 'Test Site');`

**Depends on:** Step 1. A running Postgres instance (local Docker or remote).

**Verify:** `drizzle-kit studio` shows the table. A simple script can query the test site.

---

### Step 3: Create Core Tables

**What to do:**
- Add all Phase 1 tables to `schema.ts`: `sites`, `users`, `memberships`, `siteSettings`
- Define types, enums, indexes, and foreign keys
- Run `drizzle-kit push` to create all tables
- Optionally create a seed script for a test site

**Depends on:** Step 2.

**Verify:** All tables exist in the database. Relationships are correct in Drizzle Studio.

---

### Step 4: Implement Site Resolver

**What to do:**
- Create `src/lib/server/site-resolver.ts`
- Export a function `getSiteBySlug(slug: string)` that queries the `sites` table and includes `siteSettings`
- In `src/hooks.server.ts`, read `SITE_SLUG` from env, call the resolver, attach site to `locals`
- Augment `app.d.ts` so `locals.site` is typed
- In `src/routes/+layout.server.ts`, load site data from locals and return it
- The homepage `+page.svelte` should display the site name

**Depends on:** Step 3.

**Verify:** Set `SITE_SLUG=test-site` in `.env`. Homepage shows "Test Site". Change the slug, restart, page breaks cleanly.

---

### Step 5: Set Up Better Auth with Discord

**What to do:**
- Install Better Auth and follow its SvelteKit setup guide
- Configure Discord OAuth provider
- Create `src/lib/server/auth.ts` with the Better Auth configuration
- Add the Better Auth API route: `src/routes/api/auth/[...betterAuth]/+server.ts`
- Create a `/login` page with a "Login with Discord" button
- On successful login, upsert the user into the `users` table

**Depends on:** Step 3 (users table must exist).

**Verify:** Visit `/login`, click the Discord button, authorize, get redirected back. User record appears in the `users` table.

---

### Step 6: Implement Owner Bootstrap

**What to do:**
- In the auth callback or post-login hook, check if `user.discordId === process.env.OWNER_DISCORD_ID`
- If match: upsert a membership row with role `owner` for the current site
- In `src/hooks.server.ts`, after auth, load the user's membership for the current site and attach to `locals`
- Create an admin auth guard: a `+layout.server.ts` in `/admin` that checks `locals.membership`

**Depends on:** Step 4 (site resolver), Step 5 (auth).

**Verify:** Log in with the Discord account matching `OWNER_DISCORD_ID`. Membership row with `owner` role appears. Navigate to `/admin` — accessible. Log in with a different Discord account — `/admin` redirects to `/login` with an error message.

---

### Step 7: Build Admin Layout

**What to do:**
- Create `src/routes/admin/+layout.svelte` with sidebar navigation and top bar
- Create `src/routes/admin/+layout.server.ts` with the auth guard
- Create a minimal `src/routes/admin/+page.svelte` dashboard

**Depends on:** Step 6.

**Verify:** Owner logs in, sees admin layout with nav sidebar. Non-owner cannot access.

---

### Step 8: Build Admin Settings Page

**What to do:**
- Create `src/routes/admin/settings/+page.svelte`
- Form fields: site name, tagline
- Load current values from `siteSettings.settings` JSON
- Create a form action (or API endpoint) that updates the JSON
- Add basic form validation and success/error feedback

**Depends on:** Step 7.

**Verify:** Owner can edit site name and tagline. Changes persist after reload. Public homepage reflects changes.

---

### Step 9: Build Public Homepage

**What to do:**
- Update `src/routes/+page.server.ts` to load site settings as a flat object
- Build `src/routes/+page.svelte` with sections:
  - Hero (site name, tagline, CTA button if configured)
  - About (text from settings if configured)
- Apply basic CSS styling with CSS custom properties (hardcode dark theme defaults for now)
- Handle empty states: sections hide when no content configured

**Depends on:** Step 4 (site resolver), Step 8 (settings exist).

**Verify:** Public homepage shows site name and content. Changing settings in admin updates the public page.

---

### Step 10: Add Theme CSS Variables

**What to do:**
- In the root layout, generate CSS custom properties from theme settings
- Fall back to sensible defaults if no theme configured
- Apply variables to the public homepage
- Admin panel can use a fixed theme (don't need the public theme in admin)

**Depends on:** Step 9.

**Verify:** Changing accent color in admin (once branding page is built) changes the public page's button color. Default theme looks clean.

---

### Step 11: Set Up CDN and Asset Upload

**What to do:**
- Configure CDN storage client (Bunny CDN or S3-compatible)
- Create `src/lib/server/cdn.ts` with upload, delete, and URL construction helpers
- Create an image upload API endpoint: `src/routes/api/assets/+server.ts`
- Implement webp conversion and optimization (using `sharp` or similar)
- File validation: accepted types (PNG, JPEG, WebP input), max size
- Auto-generate CDN keys: `sites/{siteSlug}/{type}/{uuid}.webp`
- Create asset records in the `assets` table on successful upload
- Create asset library page: `src/routes/admin/assets/+page.svelte`

**Depends on:** Step 4 (site resolver for siteSlug), Step 7 (admin layout).

**Verify:** Upload an image via admin. Asset record appears in database. File exists in CDN bucket. Asset library page shows uploaded files. Image is served correctly via CDN URL.

---

### Step 12: Set Up Migration Automation

**What to do:**
- Add `RUN_MIGRATIONS` env var check in app startup
- If `RUN_MIGRATIONS=true`, run `drizzle-kit migrate` on startup
- If `RUN_MIGRATIONS=false` (or unset), skip migrations entirely
- Log migration status on startup for observability
- Document which deployment is the migration runner

**Depends on:** Step 2 (Drizzle configured).

**Verify:** Start app with `RUN_MIGRATIONS=true` — migrations run. Start with `RUN_MIGRATIONS=false` — migrations are skipped. Both deployments work against the same database.

---

### Step 13: Implement Super Admin Access

**What to do:**
- Parse `SUPER_ADMIN_DISCORD_IDS` env var (comma-separated) on startup
- In the auth hook / membership check, compare user's Discord ID against the super admin list
- If match: bypass site-scoped membership checks, grant full admin access
- Attach super admin flag to `locals` for conditional UI (e.g., "View All Sites" link)

**Depends on:** Step 6 (owner bootstrap / membership logic).

**Verify:** Log in with a Discord ID in `SUPER_ADMIN_DISCORD_IDS`. Access any site's admin panel. Log in with a non-super-admin ID — restricted to their own site.

---

### Step 14: Admin Branding Page

**What to do:**
- Create `src/routes/admin/branding/+page.svelte`
- Color pickers for accent, background, text colors
- Theme preset dropdown (Dark, Light, Custom)
- Logo and background selectors: pick from asset library (uploaded in Step 11)

**Depends on:** Step 8 (settings save pattern), Step 11 (asset library).

**Verify:** Owner can change colors. Public page reflects changes immediately. Logo and background can be selected from uploaded assets.

---

### Step 15: Dockerize and Deploy

**What to do:**
- Finalize Dockerfile (multi-stage build for Node)
- Create `docker-compose.yml` for local testing with Postgres
- Set up first Coolify deployment (designate as migration runner: `RUN_MIGRATIONS=true`)
- Configure all environment variables in Coolify
- Deploy and verify public site is accessible

**Depends on:** Step 9 (working public site), Step 12 (migration automation).

**Verify:** Site is live at the configured URL. Login works. Admin works. Migrations ran on startup.

---

## Phase 2 Onward

Once Phase 1 is fully working, continue with:

1. Nav links + social links admin pages and public rendering
2. Homepage content editor (hero title, subtitle, about text, CTA)
3. Events: schema, admin CRUD, public render
4. Super admin dashboard (Phase 4)
5. Role management (Phase 5)

Detailed steps for Phases 2-5 should be written once Phase 1 is complete and any lessons learned are incorporated.

---

## Development Rules

- **One migration per schema change.** Don't batch unrelated changes into one migration.
- **Test with multiple SITE_SLUG values locally.** Use different `.env` files or a script that switches them.
- **Commit often.** Small, focused commits are easier to reason about.
- **Migrations run automatically on startup, gated by `RUN_MIGRATIONS`.** Only one deployment runs them. All others skip.
- **Keep the public site SSR-only.** No client-side data fetching for public pages.
- **Admin pages can use client-side interactivity.** Forms, file uploads, etc. can use Svelte's client-side features.
- **All uploaded images are converted to webp.** No raw user files stored on CDN.
