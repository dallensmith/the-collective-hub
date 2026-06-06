import { db } from '$lib/server/db';
import { siteSettings } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { error, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { SiteSettingsData } from '$lib/shared/types';
import { saveDraft, publishDrafts, discardDrafts } from '$lib/server/settings-writer';
import { logAuditEvent } from '$lib/server/audit-log';

/**
 * Load current homepage settings from siteSettings.settings.homepage JSON.
 * Returns flattened props with sensible defaults.
 */
export const load: PageServerLoad = async (event) => {
	const { site } = event.locals;

	if (!site) {
		return {
			heroTitle: '',
			heroSubtitle: '',
			aboutText: '',
			primaryButtonText: '',
			primaryButtonLink: '',
			showNextEvent: true,
			showSchedule: true
		};
	}

	// Feature flag guard: homepageEditor must be enabled
	if (event.locals.siteSettings?.featureFlags?.homepageEditor === false) {
		throw error(403, 'The Homepage Editor feature is disabled for this site.');
	}

	const [row] = await db
		.select({ settings: siteSettings.settings })
		.from(siteSettings)
		.where(eq(siteSettings.siteId, site.id))
		.limit(1);

	const settings = (row?.settings ?? {}) as Partial<SiteSettingsData>;
	const homepage = settings.homepage;

	return {
		heroTitle: homepage?.heroTitle ?? '',
		heroSubtitle: homepage?.heroSubtitle ?? '',
		aboutText: homepage?.aboutText ?? '',
		primaryButtonText: homepage?.primaryButtonText ?? '',
		primaryButtonLink: homepage?.primaryButtonLink ?? '',
		showNextEvent: homepage?.showNextEvent ?? true,
		showSchedule: homepage?.showSchedule ?? true
	};
};

/**
 * Build merged homepage settings from form data against published settings.
 */
async function buildMergedHomepageSettings(
	siteId: string,
	formData: FormData
): Promise<Record<string, unknown>> {
	const heroTitle = formData.get('heroTitle')?.toString().trim() ?? '';
	const heroSubtitle = formData.get('heroSubtitle')?.toString().trim() ?? '';
	const aboutText = formData.get('aboutText')?.toString().trim() ?? '';
	const primaryButtonText = formData.get('primaryButtonText')?.toString().trim() ?? '';
	const primaryButtonLink = formData.get('primaryButtonLink')?.toString().trim() ?? '';
	const showNextEvent = formData.get('showNextEvent') === 'on';
	const showSchedule = formData.get('showSchedule') === 'on';

	const [row] = await db
		.select({ settings: siteSettings.settings })
		.from(siteSettings)
		.where(eq(siteSettings.siteId, siteId))
		.limit(1);

	const currentSettings = (row?.settings ?? {}) as Record<string, unknown>;
	const currentHomepage = (currentSettings.homepage ?? {}) as Record<string, unknown>;

	const homepage = {
		...currentHomepage,
		heroTitle,
		heroSubtitle,
		aboutText,
		primaryButtonText,
		primaryButtonLink,
		showNextEvent,
		showSchedule
	};

	return {
		...currentSettings,
		homepage
	};
}

/** Form validation shared by saveDraft and publish */
function validateHomepage(formData: FormData): { heroTitle: string; heroSubtitle: string; aboutText: string; primaryButtonText: string; primaryButtonLink: string; showNextEvent: boolean; showSchedule: boolean } | { error: string; field: string } {
	const primaryButtonLink = formData.get('primaryButtonLink')?.toString().trim() ?? '';

	if (
		primaryButtonLink &&
		!primaryButtonLink.startsWith('http://') &&
		!primaryButtonLink.startsWith('https://') &&
		!primaryButtonLink.startsWith('/')
	) {
		return {
			error: 'Primary button link must start with http://, https://, or /.',
			field: 'primaryButtonLink'
		};
	}

	const heroTitle = formData.get('heroTitle')?.toString().trim() ?? '';
	const heroSubtitle = formData.get('heroSubtitle')?.toString().trim() ?? '';
	const aboutText = formData.get('aboutText')?.toString().trim() ?? '';
	const primaryButtonText = formData.get('primaryButtonText')?.toString().trim() ?? '';
	const showNextEvent = formData.get('showNextEvent') === 'on';
	const showSchedule = formData.get('showSchedule') === 'on';

	return { heroTitle, heroSubtitle, aboutText, primaryButtonText, primaryButtonLink, showNextEvent, showSchedule };
}

export const actions: Actions = {
	/** Save homepage changes as a draft — does not affect the live site. */
	saveDraft: async (event) => {
		const { site } = event.locals;
		if (!site) return { success: false, error: 'No site context found.' };

		const formData = await event.request.formData();
		const validation = validateHomepage(formData);
		if ('error' in validation) return { success: false, ...validation };

		try {
			const merged = await buildMergedHomepageSettings(site.id, formData);
			await saveDraft(site.id, merged as Partial<SiteSettingsData>);

			logAuditEvent({
				siteId: site.id,
				userId: event.locals.user?.discordId ?? 'unknown',
				userEmail: event.locals.user?.email,
				action: 'update',
				entityType: 'homepage',
				details: 'Saved homepage draft'
			});

			return { success: true, draftSaved: true };
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Failed to save draft.';
			return { success: false, error: message };
		}
	},

	/** Publish homepage changes to the live site, clearing any drafts. */
	publish: async (event) => {
		const { site } = event.locals;
		if (!site) return { success: false, error: 'No site context found.' };

		const formData = await event.request.formData();
		const validation = validateHomepage(formData);
		if ('error' in validation) return { success: false, ...validation };

		try {
			const merged = await buildMergedHomepageSettings(site.id, formData);
			await publishDrafts(site.id, merged as Partial<SiteSettingsData>);

			logAuditEvent({
				siteId: site.id,
				userId: event.locals.user?.discordId ?? 'unknown',
				userEmail: event.locals.user?.email,
				action: 'update',
				entityType: 'homepage',
				details: 'Published homepage changes'
			});

			return { success: true, published: true };
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Failed to publish homepage.';
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
