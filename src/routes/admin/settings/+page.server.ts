import type { Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { SiteSettingsData } from '$lib/shared/types';
import { db } from '$lib/server/db';
import { siteSettings } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { saveDraft, publishDrafts, discardDrafts } from '$lib/server/settings-writer';
import { logAuditEvent } from '$lib/server/audit-log';

/**
 * Load current site name and tagline from the siteSettings JSON blob.
 * Falls back to the site's base name and empty tagline if no settings exist yet.
 */
export const load: PageServerLoad = async (event) => {
	const { site } = event.locals;

	if (!site) {
		return { siteName: '', tagline: '', discordGuildId: '', discordEventsEnabled: false };
	}

	const [row] = await db
		.select({ settings: siteSettings.settings })
		.from(siteSettings)
		.where(eq(siteSettings.siteId, site.id))
		.limit(1);

	const settings = (row?.settings ?? {}) as Partial<SiteSettingsData>;
	const branding = settings.branding;
	const discord = settings.discord;

	return {
		siteName: branding?.siteName || site.name,
		tagline: branding?.tagline || '',
		discordGuildId: discord?.guildId ?? '',
		discordEventsEnabled: discord?.eventsEnabled ?? false
	};
};

/**
 * Build merged settings from form data against the current published settings.
 * Returns the full SiteSettingsData object with branding + discord updated.
 */
async function buildMergedSettings(
	siteId: string,
	siteName: string,
	tagline: string,
	discordGuildId: string,
	discordEventsEnabled: boolean
): Promise<Record<string, unknown>> {
	const [row] = await db
		.select({ settings: siteSettings.settings })
		.from(siteSettings)
		.where(eq(siteSettings.siteId, siteId))
		.limit(1);

	const currentSettings = (row?.settings ?? {}) as Record<string, unknown>;
	const currentBranding = (currentSettings.branding ?? {}) as Record<string, unknown>;
	const currentDiscord = (currentSettings.discord ?? {}) as Record<string, unknown>;

	return {
		...currentSettings,
		branding: {
			...currentBranding,
			siteName,
			tagline
		},
		discord: {
			...currentDiscord,
			guildId: discordGuildId || null,
			eventsEnabled: discordEventsEnabled
		}
	};
}

/** Form validation shared by saveDraft and publish */
function validate(formData: FormData): { siteName: string; tagline: string; discordGuildId: string; discordEventsEnabled: boolean } | { error: string; field: string } {
	const siteName = formData.get('siteName')?.toString().trim() ?? '';
	const tagline = formData.get('tagline')?.toString().trim() ?? '';
	const discordGuildId = formData.get('discordGuildId')?.toString().trim() ?? '';
	const discordEventsEnabled = formData.get('discordEventsEnabled') === 'on';

	if (!siteName) {
		return { error: 'Site name is required.', field: 'siteName' };
	}

	return { siteName, tagline, discordGuildId, discordEventsEnabled };
}

export const actions: Actions = {
	/** Save changes as a draft — does not affect the live site. */
	saveDraft: async (event) => {
		const { site } = event.locals;
		if (!site) return { success: false, error: 'No site context found.' };

		const formData = await event.request.formData();
		const validation = validate(formData);
		if ('error' in validation) return { success: false, ...validation };

		try {
			const merged = await buildMergedSettings(site.id, validation.siteName, validation.tagline, validation.discordGuildId, validation.discordEventsEnabled);
			await saveDraft(site.id, merged as Partial<SiteSettingsData>);

			logAuditEvent({
				siteId: site.id,
				userId: event.locals.user?.discordId ?? 'unknown',
				userEmail: event.locals.user?.email,
				action: 'update',
				entityType: 'settings',
				details: JSON.stringify({ siteName: validation.siteName, tagline: validation.tagline })
			});

			return { success: true, draftSaved: true };
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Failed to save draft.';
			return { success: false, error: message };
		}
	},

	/** Publish changes immediately to the live site, clearing any drafts. */
	publish: async (event) => {
		const { site } = event.locals;
		if (!site) return { success: false, error: 'No site context found.' };

		const formData = await event.request.formData();
		const validation = validate(formData);
		if ('error' in validation) return { success: false, ...validation };

		try {
			const merged = await buildMergedSettings(site.id, validation.siteName, validation.tagline, validation.discordGuildId, validation.discordEventsEnabled);
			await publishDrafts(site.id, merged as Partial<SiteSettingsData>);

			logAuditEvent({
				siteId: site.id,
				userId: event.locals.user?.discordId ?? 'unknown',
				userEmail: event.locals.user?.email,
				action: 'update',
				entityType: 'settings',
				details: JSON.stringify({ siteName: validation.siteName, tagline: validation.tagline })
			});

			return { success: true, published: true };
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Failed to publish settings.';
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
