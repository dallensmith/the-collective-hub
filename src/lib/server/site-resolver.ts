import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { sites, siteSettings } from '$lib/server/db/schema';
import type { SiteContext } from '$lib/shared/types';

/**
 * Load a site by its slug, including its settings.
 * Throws if no site matches — this is a hard failure because
 * every deployment MUST have a valid SITE_SLUG.
 *
 * When `opts.preview` is true, draftSettings is loaded and merged
 * on top of the published settings before returning. This allows
 * the preview mode to show unpublished changes.
 */
export async function getSiteBySlug(
	slug: string,
	opts?: { preview?: boolean }
): Promise<SiteContext> {
	const [site] = await db.select().from(sites).where(eq(sites.slug, slug)).limit(1);

	if (!site) {
		throw new Error(
			`Site not found for slug: "${slug}". Check your SITE_SLUG environment variable. ` +
				'Run `npm run db:seed` to create the default "local-dev" site, or insert a matching row into the sites table.'
		);
	}

	const [settingsRow] = await db
		.select({
			settings: siteSettings.settings,
			draftSettings: siteSettings.draftSettings
		})
		.from(siteSettings)
		.where(eq(siteSettings.siteId, site.id))
		.limit(1);

	const liveSettings = (settingsRow?.settings ?? {}) as Record<string, unknown>;
	const draftSettings = settingsRow?.draftSettings as Record<string, unknown> | null;

	// In preview mode, merge drafts on top of live settings
	const effectiveSettings =
		opts?.preview && draftSettings
			? deepMerge(liveSettings, draftSettings)
			: liveSettings;

	return {
		site,
		settings: effectiveSettings as unknown as SiteContext['settings']
	};
}

/**
 * Simple deep merge: properties from `source` override those in `target`.
 * Nested objects are merged recursively. Arrays and primitives are replaced.
 */
function deepMerge(
	target: Record<string, unknown>,
	source: Record<string, unknown>
): Record<string, unknown> {
	const result = { ...target };

	for (const key of Object.keys(source)) {
		const sourceVal = source[key];
		const targetVal = result[key];

		if (
			sourceVal !== null &&
			typeof sourceVal === 'object' &&
			!Array.isArray(sourceVal) &&
			targetVal !== null &&
			typeof targetVal === 'object' &&
			!Array.isArray(targetVal)
		) {
			result[key] = deepMerge(
				targetVal as Record<string, unknown>,
				sourceVal as Record<string, unknown>
			);
		} else {
			result[key] = sourceVal;
		}
	}

	return result;
}
