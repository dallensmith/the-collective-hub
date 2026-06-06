import { db } from '$lib/server/db';
import { siteSettings, assets } from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getCdnUrl } from '$lib/server/cdn';
import type { Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { SiteSettingsData } from '$lib/shared/types';

/**
 * Load current branding and theme settings, plus the asset library for
 * logo/background selection.
 */
export const load: PageServerLoad = async (event) => {
	const { site } = event.locals;

	if (!site) {
		return {
			branding: null,
			theme: null,
			assetList: []
		};
	}

	const [row] = await db
		.select({ settings: siteSettings.settings })
		.from(siteSettings)
		.where(eq(siteSettings.siteId, site.id))
		.limit(1);

	const settings = (row?.settings ?? {}) as Partial<SiteSettingsData>;
	const branding = settings.branding ?? null;
	const theme = settings.theme ?? null;

	// Load assets for the logo/background picker
	const assetRows = await db
		.select()
		.from(assets)
		.where(eq(assets.siteId, site.id))
		.orderBy(desc(assets.createdAt))
		.limit(100);

	const assetList = assetRows.map((a) => ({
		id: a.id,
		filename: a.filename,
		cdnKey: a.cdnKey,
		cdnUrl: getCdnUrl(a.cdnKey),
		mimeType: a.mimeType
	}));

	return {
		branding,
		theme,
		assetList
	};
};

/**
 * Form action: saves branding and theme settings into the siteSettings JSON blob.
 * Preserves all other settings keys (homepage, layout) that may not exist yet.
 */
export const actions: Actions = {
	default: async (event) => {
		const { site } = event.locals;

		if (!site) {
			return { success: false, error: 'No site context found.' };
		}

		const formData = await event.request.formData();

		// --- Branding fields ---
		const siteName = formData.get('siteName')?.toString().trim() ?? '';
		const tagline = formData.get('tagline')?.toString().trim() ?? '';
		const logoCdnKey = formData.get('logoCdnKey')?.toString().trim() || null;
		const backgroundCdnKey = formData.get('backgroundCdnKey')?.toString().trim() || null;
		const faviconCdnKey = formData.get('faviconCdnKey')?.toString().trim() || null;

		// --- Theme fields ---
		const themePreset = formData.get('themePreset')?.toString().trim() ?? 'dark';
		const accentColor = formData.get('accentColor')?.toString().trim() ?? '#e63946';
		const backgroundColor = formData.get('backgroundColor')?.toString().trim() ?? '#1a1a2e';
		const textColor = formData.get('textColor')?.toString().trim() ?? '#eaeaea';

		// Validate theme preset
		const validPresets = ['dark', 'light', 'custom'];
		const preset = validPresets.includes(themePreset)
			? (themePreset as 'dark' | 'light' | 'custom')
			: 'dark';

		try {
			// Read current settings to preserve other keys
			const [row] = await db
				.select({ settings: siteSettings.settings })
				.from(siteSettings)
				.where(eq(siteSettings.siteId, site.id))
				.limit(1);

			const currentSettings = (row?.settings ?? {}) as Record<string, unknown>;
			const currentBranding = (currentSettings.branding ?? {}) as Record<string, unknown>;
			const currentTheme = (currentSettings.theme ?? {}) as Record<string, unknown>;
			const currentHomepage = currentSettings.homepage ?? {};
			const currentLayout = currentSettings.layout ?? {};

			// Merge branding
			const branding = {
				...currentBranding,
				siteName: siteName || (currentBranding.siteName as string) || site.name,
				tagline,
				logoCdnKey,
				backgroundCdnKey,
				faviconCdnKey
			};

			// Merge theme
			const theme = {
				...currentTheme,
				preset,
				accentColor,
				backgroundColor,
				textColor
			};

			// Build final settings object preserving homepage & layout
			const updatedSettings = {
				...currentSettings,
				branding,
				theme,
				homepage: currentHomepage,
				layout: currentLayout
			};

			// Upsert into siteSettings
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
			const message = err instanceof Error ? err.message : 'Failed to save branding settings.';
			return { success: false, error: message };
		}
	}
};
