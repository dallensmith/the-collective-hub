import type { PageServerLoad } from './$types';
import { getCdnUrl } from '$lib/server/cdn';

/**
 * Homepage server load — flattens site settings into simple props.
 *
 * All data originates from the root layout server (+layout.server.ts).
 * This loader calls event.parent() to access that cached data so we
 * make zero additional database queries here.
 *
 * Fallback chain for each prop ensures the page always has sensible
 * values, even when settings have never been configured by the owner.
 */
export const load: PageServerLoad = async (event) => {
	const parent = await event.parent();
	const { site, siteSettings, user, membership } = parent;

	const homepage = siteSettings?.homepage;
	const branding = siteSettings?.branding;

	// heroTitle: homepage.heroTitle → branding.siteName → site.name → 'My Site'
	const heroTitle = homepage?.heroTitle || branding?.siteName || site?.name || 'My Site';

	// heroSubtitle: homepage.heroSubtitle → branding.tagline → ''
	const heroSubtitle = homepage?.heroSubtitle || branding?.tagline || '';

	// aboutText: homepage.aboutText → ''
	const aboutText = homepage?.aboutText || '';

	// CTA
	const ctaText = homepage?.primaryButtonText || '';
	const ctaLink = homepage?.primaryButtonLink || '';

	// Show flags (use ?? so explicit false is respected)
	const showNextEvent = homepage?.showNextEvent ?? false;
	const showSchedule = homepage?.showSchedule ?? false;

	// Resolve branding asset CDN keys to full URLs
	const logoUrl = branding?.logoCdnKey ? getCdnUrl(branding.logoCdnKey) : null;
	const backgroundUrl = branding?.backgroundCdnKey ? getCdnUrl(branding.backgroundCdnKey) : null;
	const faviconUrl = branding?.faviconCdnKey ? getCdnUrl(branding.faviconCdnKey) : null;

	return {
		site,
		heroTitle,
		heroSubtitle,
		aboutText,
		ctaText,
		ctaLink,
		showNextEvent,
		showSchedule,
		user,
		membership,
		logoUrl,
		backgroundUrl,
		faviconUrl
	};
};
