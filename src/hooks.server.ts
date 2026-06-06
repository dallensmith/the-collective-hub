import type { Handle } from '@sveltejs/kit';
import { building } from '$app/environment';
import { env } from '$env/dynamic/private';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { auth } from '$lib/server/auth';
import { getSiteBySlug } from '$lib/server/site-resolver';

/**
 * Root server hook — runs on every request.
 *
 * Order of operations:
 * 1. Resolve the current site from SITE_SLUG env var → attach to event.locals
 * 2. Delegate to Better Auth's svelteKitHandler (handles /api/auth/* routes,
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

	// --- Auth (Better Auth SvelteKit handler) ---
	// svelteKitHandler intercepts /api/auth/* and handles OAuth flows.
	// For all other routes it calls resolve(event) transparently.
	return svelteKitHandler({ event, resolve, auth, building });
};
