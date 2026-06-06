import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { sites, siteSettings } from '$lib/server/db/schema';
import type { SiteContext } from '$lib/shared/types';

/**
 * Load a site by its slug, including its settings.
 * Throws if no site matches — this is a hard failure because
 * every deployment MUST have a valid SITE_SLUG.
 */
export async function getSiteBySlug(slug: string): Promise<SiteContext> {
	const [site] = await db.select().from(sites).where(eq(sites.slug, slug)).limit(1);

	if (!site) {
		throw new Error(
			`Site not found for slug: "${slug}". Check your SITE_SLUG environment variable. ` +
				'Run `npm run db:seed` to create the default "local-dev" site, or insert a matching row into the sites table.'
		);
	}

	const [settingsRow] = await db
		.select()
		.from(siteSettings)
		.where(eq(siteSettings.siteId, site.id))
		.limit(1);

	return {
		site,
		settings: (settingsRow?.settings as SiteContext['settings']) ?? {}
	};
}
