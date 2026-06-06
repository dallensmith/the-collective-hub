import { db } from '$lib/server/db';
import { events, assets, navLinks, socialLinks, memberships, siteSettings, auditLog } from '$lib/server/db/schema';
import { eq, and, sql, count, desc } from 'drizzle-orm';
import { env } from '$env/dynamic/public';
import type { PageServerLoad } from './$types';

/**
 * Load quick stats for the admin dashboard.
 * All stats are scoped to the current site.
 */
export const load: PageServerLoad = async (event) => {
	const { site, membership, siteSettings: currentSiteSettings, isSuperAdmin } = event.locals;

	if (!site) {
		return {
			stats: {
				totalEvents: 0,
				publishedEvents: 0,
				upcomingEvents: 0,
				totalAssets: 0,
				totalNavLinks: 0,
				totalSocialLinks: 0,
				totalMembers: 0,
				hasSettings: false
			},
			siteUrl: env.PUBLIC_SITE_URL ?? null,
			isActive: false,
			featureFlags: {},
			currentUserRole: null,
			isSuperAdmin: false,
			recentActivity: []
		};
	}

	const now = new Date();

	// Run all count queries in parallel, plus recent audit activity
	const [
		[{ value: totalEvents }],
		[{ value: publishedEvents }],
		[{ value: upcomingEvents }],
		[{ value: totalAssets }],
		[{ value: totalNavLinks }],
		[{ value: totalSocialLinks }],
		[{ value: totalMembers }],
		[settingsRow],
		recentActivity
	] = await Promise.all([
		// All events (regardless of published status)
		db
			.select({ value: count() })
			.from(events)
			.where(eq(events.siteId, site.id)),
		// Published events only
		db
			.select({ value: count() })
			.from(events)
			.where(and(eq(events.siteId, site.id), eq(events.isPublished, true))),
		// Published + upcoming events
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
			.limit(1),
		// 5 most recent audit log entries for this site
		db
			.select()
			.from(auditLog)
			.where(eq(auditLog.siteId, site.id))
			.orderBy(desc(auditLog.createdAt))
			.limit(5)
	]);

	// Extract feature flags from site settings (default: all enabled if not configured)
	const featureFlags = (currentSiteSettings?.featureFlags as Record<string, boolean> | undefined) ?? {};

	return {
		stats: {
			totalEvents,
			publishedEvents,
			upcomingEvents,
			totalAssets,
			totalNavLinks,
			totalSocialLinks,
			totalMembers,
			hasSettings: !!settingsRow
		},
		siteUrl: env.PUBLIC_SITE_URL ?? null,
		isActive: site.isActive,
		featureFlags,
		currentUserRole: membership?.role ?? null,
		isSuperAdmin,
		recentActivity
	};
};
