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
			heroSecondaryCtaText: formData.get('heroSecondaryCtaText') as string,
			contentHeading: formData.get('contentHeading') as string,
			contentSubtitle: formData.get('contentSubtitle') as string,
			ctaHeading: formData.get('ctaHeading') as string,
			ctaText: formData.get('ctaText') as string,
			ctaButtonText: formData.get('ctaButtonText') as string,
			footerText: formData.get('footerText') as string
		};

		// Parse features from JSON hidden field (built by the client)
		const featuresRaw = formData.get('contentFeatures') as string;
		if (featuresRaw) {
			try {
				settings.contentFeatures = JSON.parse(featuresRaw);
			} catch {
				return fail(400, { error: 'Invalid feature data. Please try again.' });
			}
		}

		await updateSettings(settings);
		return { success: true };
	}
};
