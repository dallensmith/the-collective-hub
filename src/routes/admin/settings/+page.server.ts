import { db } from '$lib/server/db';
import { siteSettings } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { SiteSettingsData } from '$lib/shared/types';

/**
 * Load current site name and tagline from the siteSettings JSON blob.
 * Falls back to the site's base name and empty tagline if no settings exist yet.
 */
export const load: PageServerLoad = async (event) => {
	const { site } = event.locals;

	if (!site) {
		return { siteName: '', tagline: '' };
	}

	const [row] = await db
		.select({ settings: siteSettings.settings })
		.from(siteSettings)
		.where(eq(siteSettings.siteId, site.id))
		.limit(1);

	const settings = (row?.settings ?? {}) as Partial<SiteSettingsData>;
	const branding = settings.branding;

	return {
		siteName: branding?.siteName || site.name,
		tagline: branding?.tagline || ''
	};
};

/**
 * Form action: saves site name and tagline into the siteSettings JSON blob.
 * Preserves all other settings keys (theme, homepage, layout) that may not exist yet.
 */
export const actions: Actions = {
	default: async (event) => {
		const { site } = event.locals;

		if (!site) {
			return { success: false, error: 'No site context found.' };
		}

		const formData = await event.request.formData();
		const siteName = formData.get('siteName')?.toString().trim() ?? '';
		const tagline = formData.get('tagline')?.toString().trim() ?? '';

		// Validate: site name is required
		if (!siteName) {
			return { success: false, error: 'Site name is required.', field: 'siteName' };
		}

		try {
			// Read current settings to preserve other keys
			const [row] = await db
				.select({ settings: siteSettings.settings })
				.from(siteSettings)
				.where(eq(siteSettings.siteId, site.id))
				.limit(1);

			const currentSettings = (row?.settings ?? {}) as Record<string, unknown>;
			const currentBranding = (currentSettings.branding ?? {}) as Record<string, unknown>;

			// Merge: update branding.siteName and branding.tagline, preserve everything else
			const updatedSettings = {
				...currentSettings,
				branding: {
					...currentBranding,
					siteName,
					tagline
				}
			};

			// Upsert into siteSettings (insert if no row exists for this site, update if it does)
			await db
				.insert(siteSettings)
				.values({
					siteId: site.id,
					settings: updatedSettings
				})
				.onConflictDoUpdate({
					target: siteSettings.siteId,
					set: {
						settings: updatedSettings,
						updatedAt: new Date()
					}
				});

			return { success: true };
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Failed to save settings.';
			return { success: false, error: message };
		}
	}
};
