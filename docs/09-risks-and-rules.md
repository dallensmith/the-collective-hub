# Risks & Things to Avoid

## Critical Risks

### Risk 1: Multiple Deployments Running Migrations Simultaneously

**Severity:** High — could corrupt the database.

**Why it's a risk:** With multiple Coolify deployments all pointing to the same database, if every deployment runs migrations on startup, they could conflict — two containers trying to create the same table at the same time.

**Mitigation:**
- Migrations run automatically on startup, but gated by `RUN_MIGRATIONS` env var
- **Exactly one deployment** has `RUN_MIGRATIONS=true` (the "primary" deployment)
- All other deployments set `RUN_MIGRATIONS=false` and skip migrations
- Deploy the primary first when schema changes are included
- This is enforced by convention, not by a lock — David must ensure only one deployment has the flag set to `true`

### Risk 2: Missing siteId Scope on Queries

**Severity:** High — data leaks between sites.

**Why it's a risk:** If a query forgets to filter by `siteId`, one site could display another site's events, settings, or assets. This is the most common multi-tenant bug.

**Mitigation:**
- All data access functions accept `siteId` as a required parameter
- Create a helper that wraps Drizzle queries and enforces `siteId`
- Review every query in code review for `siteId` filtering
- Consider a lint rule or type-level enforcement (e.g., branded types) later

### Risk 3: Hardcoding Full CDN URLs

**Severity:** Medium — painful CDN migration if the CDN provider changes.

**Why it's a risk:** If the database stores `https://cdn.example.com/sites/bad-movies/logo.webp` and you later switch CDN providers, every URL in the database needs updating.

**Mitigation:**
- Database stores only the CDN key/path (`sites/bad-movies-theater/logo.webp`)
- Application constructs full URLs using `CDN_BASE_URL` env var
- A single env var change switches all CDN URLs

### Risk 4: Overbuilding Before the Core Works

**Severity:** Medium — wasted effort, complexity without value.

**Why it's a risk:** It's tempting to build the fancy admin dashboard, the AI features, the perfect theming system before the basic site actually works end-to-end. This leads to a complex codebase that doesn't ship.

**Mitigation:**
- Follow the phases strictly
- Phase 1 must be fully working (public site + admin login + settings save) before anything else
- A working simple site is infinitely more valuable than a half-built complex one
- Ask "Can this wait until Phase X?" before building anything

### Risk 5: Per-Site Custom Code

**Severity:** Medium — maintenance nightmare.

**Why it's a risk:** If "Bad Movies Theater" needs something special and you add an `if (site.slug === 'bad-movies-theater')` in the code, that's the start of a slippery slope. Soon every site has special cases, and the "shared codebase" advantage is lost.

**Mitigation:**
- Never write site-specific conditional logic
- All customization comes from the database (settings, theme, content)
- If a site genuinely needs a unique feature, it should be built as a configurable feature for all sites, or that site should fork the codebase (last resort)

### Risk 6: Letting Site Owners Write Raw CSS/HTML

**Severity:** Medium — security and maintenance risk.

**Why it's a risk:** Allowing custom CSS or HTML opens XSS vectors (if not properly sanitized), breaks the design system, and makes future template updates unpredictable. A site owner could accidentally break their own site's layout.

**Mitigation:**
- No custom CSS field in V1
- No raw HTML in content fields — use Markdown with safe rendering
- If custom CSS is ever added (future phase), sandbox it (e.g., a per-site stylesheet loaded separately, not injected into the main app)
- Clearly document that custom CSS is an advanced/risky feature

---

## Design Pitfalls to Avoid

### Pitfall 1: Making the Admin Panel Too Complex Before the Public Page Works

The admin panel exists to serve the public page. If you spend weeks on a beautiful admin UI but the public site is a broken placeholder, priorities are wrong.

**Rule:** The public page must work before any admin page is considered complete.

### Pitfall 2: Building AI Features Before the Core Template Works

AI content suggestions, semantic search with pgvector, AI chatbots — these are exciting but useless if a site can't display a homepage with basic content.

**Rule:** No AI features until Phase 5+ and even then, only if the core template is stable and useful.

### Pitfall 3: Planning Too Many Layout Options

One clean, flexible layout that adapts to content is better than three half-baked layout options. Adding a second layout doubles the testing surface.

**Rule:** One layout in V1. Add a second only when there's a clear, proven need.

### Pitfall 4: Normalizing Settings Too Aggressively

A `siteSettings` table with 30 columns (one per setting) means a migration for every new setting. A `jsonb` column means adding a setting is zero-cost.

**Rule:** Settings go in JSON. Structured, relational data (events, links, assets) goes in normalized tables.

### Pitfall 5: Building for Scale That Doesn't Exist Yet

Planning for 1,000 sites when you have 3 leads to over-engineering. The architecture supports growth (multi-tenant from day one), but don't optimize for scale prematurely.

**Rule:** Architecture should not block growth; implementation should not optimize for it yet.

---

## Process Risks

### Risk 7: Skipping Documentation

**Severity:** Low now, high later.

**Why it's a risk:** When there's only one developer (David), documentation feels optional. But when you come back to the project after 6 months, or when a site owner asks how something works, missing documentation hurts.

**Mitigation:**
- These planning docs live in the repo
- Add a simple `README.md` with setup instructions
- Add code comments for non-obvious logic
- Keep a `CHANGELOG.md` once the project is live

### Risk 8: Super Admin Account Compromise

**Severity:** High — cross-site data breach.

**Why it's a risk:** A `SUPER_ADMIN_DISCORD_IDS` entry grants unrestricted access to all sites. If a super admin's Discord account is compromised, all sites are exposed.

**Mitigation:**
- Keep the super admin list minimal (ideally just David)
- Super admin Discord accounts should have 2FA enabled
- Consider adding a secondary verification step for super admin actions in a future phase
- Monitor for unusual super admin activity

---

## Summary Checklist

Before writing any code, confirm:

- [ ] Migrations are automated but gated by `RUN_MIGRATIONS` — only one deployment runs them
- [ ] Every query includes `siteId` filtering
- [ ] CDN keys stored in DB, not full URLs
- [ ] Phase 1 scope is locked — no feature creep
- [ ] No site-specific conditional code planned
- [ ] No raw CSS/HTML inputs for site owners
- [ ] Database backups are configured (handled externally by David)
- [ ] Project name decided: **The Collective Hub**
- [ ] Super admin Discord IDs are set and accounts have 2FA enabled
