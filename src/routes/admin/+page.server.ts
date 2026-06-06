import { db } from '$lib/server/db';
import { events, assets, navLinks, socialLinks, memberships, siteSettings } from '$lib/server/db/schema';
import { eq, and, sql, count } from 'drizzle-orm';
import { env } from '$env/dynamic/public';
import type { PageServerLoad } from './$types';

/**
 * Load quick stats for the admin dashboard.
 * All stats are scoped to the current site.
 */
export const load: PageServerLoad = async (event) => {
	const { site, membership, isSuperAdmin } = event.locals;

	if (!site) {
		return {
			stats: {
				totalEvents: 0,
				upcomingEvents: 0,
				totalAssets: 0,
				totalNavLinks: 0,
				totalSocialLinks: 0,
				totalMembers: 0,
				hasSettings: false
			},
			siteUrl: env.PUBLIC_SITE_URL ?? null,
			isActive: false,
			currentUserRole: null,
			isSuperAdmin: false
		};
	}

	const now = new Date();

	// Run all count queries in parallel
	const [
		[{ value: totalEvents }],
		[{ value: upcomingEvents }],
		[{ value: totalAssets }],
		[{ value: totalNavLinks }],
		[{ value: totalSocialLinks }],
		[{ value: totalMembers }],
		[settingsRow]
	] = await Promise.all([
		db
			.select({ value: count() })
			.from(events)
			.where(and(eq(events.siteId, site.id), eq(events.isPublished, true))),
		db
			.select({ value: count() })
			.from(events)
			.where(
				and(
					eq(events.siteId, site.id),
					eq(events.isPublished, true),
					sql`${events.startTime} > ${now.toISOString()}`
				)
			),
		db
			.select({ value: count() })
			.from(assets)
			.where(eq(assets.siteId, site.id)),
		db
			.select({ value: count() })
			.from(navLinks)
			.where(eq(navLinks.siteId, site.id)),
		db
			.select({ value: count() })
			.from(socialLinks)
			.where(eq(socialLinks.siteId, site.id)),
		db
			.select({ value: count() })
			.from(memberships)
			.where(eq(memberships.siteId, site.id)),
		db
			.select({ id: siteSettings.id })
			.from(siteSettings)
			.where(eq(siteSettings.siteId, site.id))
			.limit(1)
	]);

	return {
		stats: {
			totalEvents,
			upcomingEvents,
			totalAssets,
			totalNavLinks,
			totalSocialLinks,
			totalMembers,
			hasSettings: !!settingsRow
		},
		siteUrl: env.PUBLIC_SITE_URL ?? null,
		isActive: site.isActive,
		currentUserRole: membership?.role ?? null,
		isSuperAdmin
	};
};
