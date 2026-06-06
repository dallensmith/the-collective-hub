import { db } from '$lib/server/db';
import { siteSettings, assets } from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getCdnUrl } from '$lib/server/cdn';
import { error, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { SiteSettingsData } from '$lib/shared/types';
import { saveDraft, publishDrafts, discardDrafts } from '$lib/server/settings-writer';
import { logAuditEvent } from '$lib/server/audit-log';

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

	// Feature flag guard: branding must be enabled
	if (event.locals.siteSettings?.featureFlags?.branding === false) {
		throw error(403, 'The Branding feature is disabled for this site.');
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
 * Build merged branding + theme settings from form data against published settings.
 */
async function buildMergedBrandingSettings(
	siteId: string,
	siteNameFallback: string,
	formData: FormData
): Promise<Record<string, unknown>> {
	const siteName = formData.get('siteName')?.toString().trim() ?? '';
	const tagline = formData.get('tagline')?.toString().trim() ?? '';
	const logoCdnKey = formData.get('logoCdnKey')?.toString().trim() || null;
	const backgroundCdnKey = formData.get('backgroundCdnKey')?.toString().trim() || null;
	const faviconCdnKey = formData.get('faviconCdnKey')?.toString().trim() || null;

	const themePreset = formData.get('themePreset')?.toString().trim() ?? 'dark';
	const accentColor = formData.get('accentColor')?.toString().trim() ?? '#e63946';
	const backgroundColor = formData.get('backgroundColor')?.toString().trim() ?? '#1a1a2e';
	const textColor = formData.get('textColor')?.toString().trim() ?? '#eaeaea';

	const validPresets = ['dark', 'light', 'custom'];
	const preset = validPresets.includes(themePreset)
		? (themePreset as 'dark' | 'light' | 'custom')
		: 'dark';

	const [row] = await db
		.select({ settings: siteSettings.settings })
		.from(siteSettings)
		.where(eq(siteSettings.siteId, siteId))
		.limit(1);

	const currentSettings = (row?.settings ?? {}) as Record<string, unknown>;
	const currentBranding = (currentSettings.branding ?? {}) as Record<string, unknown>;
	const currentTheme = (currentSettings.theme ?? {}) as Record<string, unknown>;
	const currentHomepage = currentSettings.homepage ?? {};
	const currentLayout = currentSettings.layout ?? {};

	const branding = {
		...currentBranding,
		siteName: siteName || (currentBranding.siteName as string) || siteNameFallback,
		tagline,
		logoCdnKey,
		backgroundCdnKey,
		faviconCdnKey
	};

	const theme = {
		...currentTheme,
		preset,
		accentColor,
		backgroundColor,
		textColor
	};

	return {
		...currentSettings,
		branding,
		theme,
		homepage: currentHomepage,
		layout: currentLayout
	};
}

export const actions: Actions = {
	/** Save branding changes as a draft — does not affect the live site. */
	saveDraft: async (event) => {
		const { site } = event.locals;
		if (!site) return { success: false, error: 'No site context found.' };

		try {
			const formData = await event.request.formData();
			const merged = await buildMergedBrandingSettings(site.id, site.name, formData);
			await saveDraft(site.id, merged as Partial<SiteSettingsData>);

			logAuditEvent({
				siteId: site.id,
				userId: event.locals.user?.discordId ?? 'unknown',
				userEmail: event.locals.user?.email,
				action: 'update',
				entityType: 'branding',
				details: 'Saved branding draft'
			});

			return { success: true, draftSaved: true };
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Failed to save draft.';
			return { success: false, error: message };
		}
	},

	/** Publish branding changes to the live site, clearing any drafts. */
	publish: async (event) => {
		const { site } = event.locals;
		if (!site) return { success: false, error: 'No site context found.' };

		try {
			const formData = await event.request.formData();
			const merged = await buildMergedBrandingSettings(site.id, site.name, formData);
			await publishDrafts(site.id, merged as Partial<SiteSettingsData>);

			logAuditEvent({
				siteId: site.id,
				userId: event.locals.user?.discordId ?? 'unknown',
				userEmail: event.locals.user?.email,
				action: 'update',
				entityType: 'branding',
				details: 'Published branding changes'
			});

			return { success: true, published: true };
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Failed to publish branding.';
			return { success: false, error: message };
		}
	},

	/** Discard all pending drafts for this site without publishing. */
	discardDrafts: async (event) => {
		const { site } = event.locals;
		if (!site) return { success: false, error: 'No site context found.' };

		try {
			await discardDrafts(site.id);
			return { success: true, draftsDiscarded: true };
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Failed to discard drafts.';
			return { success: false, error: message };
		}
	}
};
