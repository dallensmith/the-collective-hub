import { getSettings, updateSettings, type SiteSettings } from '$lib/server/settings';
import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async () => {
	const settings = await getSettings();
	return { settings };
};

export const actions: Actions = {
	default: async ({ request }) => {
		const formData = await request.formData();

		const settings: Partial<SiteSettings> = {
			siteName: formData.get('siteName') as string,
			heroHeading: formData.get('heroHeading') as string,
			heroSubtitle: formData.get('heroSubtitle') as string,
			heroCtaText: formData.get('heroCtaText') as string,
			heroCtaLink: formData.get('heroCtaLink') as string,
			ctaHeading: formData.get('ctaHeading') as string,
			ctaText: formData.get('ctaText') as string,
			ctaButtonText: formData.get('ctaButtonText') as string,
			ctaButtonLink: formData.get('ctaButtonLink') as string,
			footerText: formData.get('footerText') as string
		};

		// Handle features as JSON string from textarea
		const featuresRaw = formData.get('contentFeatures') as string;
		if (featuresRaw) {
			try {
				settings.contentFeatures = JSON.parse(featuresRaw);
			} catch {
				return fail(400, { error: 'Invalid JSON for features' });
			}
		}

		await updateSettings(settings);
		return { success: true };
	}
};
