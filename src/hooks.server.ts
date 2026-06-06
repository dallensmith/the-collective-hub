import type { Handle } from '@sveltejs/kit';
import { building } from '$app/environment';
import { env } from '$env/dynamic/private';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { auth } from '$lib/server/auth';
import { getSiteBySlug } from '$lib/server/site-resolver';
import { runMigrations } from '$lib/server/db/migrate';

// ─── Migration Automation ────────────────────────────────────────────────────
//
// Runs database migrations on startup if RUN_MIGRATIONS=true.
// Only the designated migration-runner deployment sets this to true.
// All other deployments (RUN_MIGRATIONS=false or unset) skip migrations.
//
// This runs as a module-level initialization before the server accepts
// any requests. Migrations are skipped entirely during the Vite build
// phase (`building` is true).

if (!building) {
	const shouldRun = env.RUN_MIGRATIONS === 'true';

	if (shouldRun) {
		console.log('🚀 RUN_MIGRATIONS=true — running database migrations…');
		// Top-level await is fine here — Node.js supports it in ES modules,
		// and SvelteKit's server entry is an ES module.
		await runMigrations();
	} else {
		console.log('⏭️  RUN_MIGRATIONS is not "true" — skipping migrations.');
	}
}

// ─── Request Handler ─────────────────────────────────────────────────────────

/**
 * Root server hook — runs on every request.
 *
 * Order of operations:
 * 1. (Startup only) Run DB migrations if RUN_MIGRATIONS=true
 * 2. Resolve the current site from SITE_SLUG env var → attach to event.locals
 * 3. Delegate to Better Auth's svelteKitHandler (handles /api/auth/* routes,
 *    passes through for all other routes)
 */
export const handle: Handle = async ({ event, resolve }) => {
	// --- Site Resolution ---
	const slug = env.SITE_SLUG;
	if (!slug) {
		throw new Error(
			'SITE_SLUG environment variable is not set. Each deployment must specify its site slug.'
		);
	}

	const siteContext = await getSiteBySlug(slug);
	event.locals.site = siteContext.site;
	event.locals.siteSlug = slug;
	event.locals.siteSettings = siteContext.settings;

	// --- Deactivated Site Guard (503) ---
	// If the site is deactivated (isActive=false), block public access with a 503.
	// Admin paths (/admin/*) and the login page (/login) are allowed through so
	// that site owners/admins can still log in and reactivate the site.
	if (event.locals.site && !event.locals.site.isActive) {
		const pathname = event.url.pathname;
		const isAdminPath = pathname.startsWith('/admin');
		const isLoginPath = pathname.startsWith('/login');

		if (!isAdminPath && !isLoginPath) {
			const bg = event.locals.siteSettings?.theme?.backgroundColor ?? '#1a1a2e';
			const fg = event.locals.siteSettings?.theme?.textColor ?? '#eaeaea';
			const name = event.locals.site.name;

			return new Response(
				`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Site Unavailable — ${name}</title>
<style>
	* { margin: 0; padding: 0; box-sizing: border-box; }
	body {
		font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		background: ${bg};
		color: ${fg};
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		text-align: center;
		padding: 2rem;
	}
	.card {
		max-width: 480px;
	}
	h1 { font-size: 1.75rem; margin-bottom: 0.75rem; font-weight: 700; }
	p { font-size: 1rem; opacity: 0.7; line-height: 1.5; }
</style>
</head>
<body>
<div class="card">
	<h1>Site Unavailable</h1>
	<p>This site is currently deactivated. Please check back later.</p>
</div>
</body>
</html>`,
				{
					status: 503,
					headers: { 'Content-Type': 'text/html; charset=utf-8' }
				}
			);
		}
	}

	// --- Auth (Better Auth SvelteKit handler) ---
	// svelteKitHandler intercepts /api/auth/* and handles OAuth flows.
	// For all other routes it calls resolve(event) transparently.
	return svelteKitHandler({ event, resolve, auth, building });
};
