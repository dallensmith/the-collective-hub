import type { PageServerLoad } from './$types';
import { getCdnUrl } from '$lib/server/cdn';
import { db } from '$lib/server/db';
import { navLinks, socialLinks, events } from '$lib/server/db/schema';
import { eq, asc, and, gte } from 'drizzle-orm';

/**
 * Homepage server load — flattens site settings into simple props.
 *
 * Most data originates from the root layout server (+layout.server.ts).
 * This loader calls event.parent() to access that cached data for
 * branding/theme/homepage info. Nav links and social links are queried
 * directly from the database since they aren't in layout data.
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

	// ─── Feature flags ──────────────────────────────────────────────────
	const featureFlags = siteSettings?.featureFlags;

	// Query nav links and social links for the current site (respect feature flags)
	let navLinkRows: typeof navLinks.$inferSelect[] = [];
	let socialLinkRows: typeof socialLinks.$inferSelect[] = [];

	if (site) {
		// Only load nav links if the feature flag is not explicitly disabled
		if (featureFlags?.navLinks !== false) {
			navLinkRows = await db
				.select()
				.from(navLinks)
				.where(eq(navLinks.siteId, site.id))
				.orderBy(asc(navLinks.position), asc(navLinks.sortOrder));
		}

		// Only load social links if the feature flag is not explicitly disabled
		if (featureFlags?.socialLinks !== false) {
			socialLinkRows = await db
				.select()
				.from(socialLinks)
				.where(eq(socialLinks.siteId, site.id))
				.orderBy(asc(socialLinks.sortOrder));
		}
	}

	// ─── Events queries (respect feature flags) ─────────────────────────

	let nextEvent: typeof events.$inferSelect | null = null;
	let upcomingEvents: typeof events.$inferSelect[] = [];

	if (site && featureFlags?.events !== false) {
		const now = new Date();

		// Next upcoming published event
		const [next] = await db
			.select()
			.from(events)
			.where(
				and(
					eq(events.siteId, site.id),
					eq(events.isPublished, true),
					gte(events.startTime, now)
				)
			)
			.orderBy(asc(events.startTime))
			.limit(1);

		nextEvent = next ?? null;

		// Upcoming published events (next 6)
		upcomingEvents = await db
			.select()
			.from(events)
			.where(
				and(
					eq(events.siteId, site.id),
					eq(events.isPublished, true),
					gte(events.startTime, now)
				)
			)
			.orderBy(asc(events.startTime))
			.limit(6);
	}

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
		faviconUrl,
		navLinks: navLinkRows,
		socialLinks: socialLinkRows,
		nextEvent,
		upcomingEvents
	};
};
