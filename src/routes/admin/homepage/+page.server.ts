import { db } from '$lib/server/db';
import { siteSettings } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { error, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { SiteSettingsData } from '$lib/shared/types';

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
 * Form action: saves homepage content into siteSettings.settings.homepage JSON.
 * All fields are optional. If primaryButtonLink is provided, it must start with
 * http://, https://, or /.
 */
export const actions: Actions = {
	default: async (event) => {
		const { site } = event.locals;

		if (!site) {
			return { success: false, error: 'No site context found.' };
		}

		const formData = await event.request.formData();

		const heroTitle = formData.get('heroTitle')?.toString().trim() ?? '';
		const heroSubtitle = formData.get('heroSubtitle')?.toString().trim() ?? '';
		const aboutText = formData.get('aboutText')?.toString().trim() ?? '';
		const primaryButtonText = formData.get('primaryButtonText')?.toString().trim() ?? '';
		const primaryButtonLink = formData.get('primaryButtonLink')?.toString().trim() ?? '';
		const showNextEvent = formData.get('showNextEvent') === 'on';
		const showSchedule = formData.get('showSchedule') === 'on';

		// Validate primaryButtonLink if provided
		if (
			primaryButtonLink &&
			!primaryButtonLink.startsWith('http://') &&
			!primaryButtonLink.startsWith('https://') &&
			!primaryButtonLink.startsWith('/')
		) {
			return {
				success: false,
				error: 'Primary button link must start with http://, https://, or /.',
				field: 'primaryButtonLink'
			};
		}

		try {
			// Read current settings to preserve other keys (branding, theme, layout)
			const [row] = await db
				.select({ settings: siteSettings.settings })
				.from(siteSettings)
				.where(eq(siteSettings.siteId, site.id))
				.limit(1);

			const currentSettings = (row?.settings ?? {}) as Record<string, unknown>;
			const currentHomepage = (currentSettings.homepage ?? {}) as Record<string, unknown>;

			// Merge homepage settings
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

			// Build final settings object preserving all other keys
			const updatedSettings = {
				...currentSettings,
				homepage
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
			const message = err instanceof Error ? err.message : 'Failed to save homepage settings.';
			return { success: false, error: message };
		}
	}
};
