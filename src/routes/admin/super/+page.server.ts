import { db } from '$lib/server/db';
import { sites, siteSettings, events, assets, navLinks, socialLinks, memberships, users } from '$lib/server/db/schema';
import { eq, desc, count, asc } from 'drizzle-orm';
import { error, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getCdnUrl } from '$lib/server/cdn';
import type { SiteSettingsData, FeatureFlags } from '$lib/shared/types';

/**
 * Super Admin Dashboard — cross-site management for the system maintainer.
 *
 * Guard: Only users whose Discord ID is in SUPER_ADMIN_DISCORD_IDS may access
 * this page. The flag is set by +layout.server.ts and stored in locals.isSuperAdmin.
 *
 * Load: Queries all sites with event/asset counts and settings presence.
 * Actions:
 *   - toggleActive: Flip a site's isActive flag by site ID.
 *   - createSite: Create a new site with validated name/slug and an empty settings row.
 */

// ─── Load ──────────────────────────────────────────────────────────────────────

export const load: PageServerLoad = async (event) => {
	if (!event.locals.isSuperAdmin) {
		throw error(403, 'Only super admins can access this page.');
	}

	// Query all sites, newest first (no siteId filter — cross-site view)
	const allSites = await db
		.select()
		.from(sites)
		.orderBy(desc(sites.createdAt));

	// For each site, fetch counts and settings presence
	const sitesWithStats = await Promise.all(
		allSites.map(async (site) => {
			const [eventCountRow] = await db
				.select({ count: count() })
				.from(events)
				.where(eq(events.siteId, site.id));

			const [assetCountRow] = await db
				.select({ count: count() })
				.from(assets)
				.where(eq(assets.siteId, site.id));

			const [settingsRow] = await db
				.select({ id: siteSettings.id })
				.from(siteSettings)
				.where(eq(siteSettings.siteId, site.id))
				.limit(1);

			return {
				id: site.id,
				slug: site.slug,
				name: site.name,
				isActive: site.isActive,
				createdAt: site.createdAt,
				updatedAt: site.updatedAt,
				eventCount: eventCountRow?.count ?? 0,
				assetCount: assetCountRow?.count ?? 0,
				hasSettings: !!settingsRow
			};
		})
	);

	return {
		sites: sitesWithStats
	};
};

// ─── Actions ───────────────────────────────────────────────────────────────────

export const actions: Actions = {
	/**
	 * Toggle a site's isActive flag.
	 * Accepts form data: siteId (uuid string).
	 */
	toggleActive: async (event) => {
		if (!event.locals.isSuperAdmin) {
			throw error(403, 'Only super admins can perform this action.');
		}

		const formData = await event.request.formData();
		const siteId = formData.get('siteId')?.toString();

		if (!siteId) {
			return { success: false, error: 'Site ID is required.', action: 'toggleActive' };
		}

		// Find the site by ID (not slug — super admin is cross-site)
		const [existing] = await db
			.select()
			.from(sites)
			.where(eq(sites.id, siteId))
			.limit(1);

		if (!existing) {
			return { success: false, error: 'Site not found.', action: 'toggleActive' };
		}

		try {
			await db
				.update(sites)
				.set({ isActive: !existing.isActive, updatedAt: new Date() })
				.where(eq(sites.id, siteId));

			return { success: true, action: 'toggleActive' };
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Failed to toggle site active status.';
			return { success: false, error: message, action: 'toggleActive' };
		}
	},

	/**
	 * Create a new site with an empty siteSettings row.
	 * Accepts form data: name (string), slug (string).
	 *
	 * Validation:
	 * - name is required
	 * - slug is required and must match /^[a-z0-9-]+$/
	 * - slug must be unique
	 */
	createSite: async (event) => {
		if (!event.locals.isSuperAdmin) {
			throw error(403, 'Only super admins can perform this action.');
		}

		const formData = await event.request.formData();
		const name = formData.get('name')?.toString().trim();
		const slug = formData.get('slug')?.toString().trim();

		// --- Validation ---

		if (!name) {
			return { success: false, error: 'Site name is required.', action: 'createSite', field: 'name' };
		}

		if (!slug) {
			return { success: false, error: 'Site slug is required.', action: 'createSite', field: 'slug' };
		}

		// Slug must be lowercase alphanumeric with hyphens only
		if (!/^[a-z0-9-]+$/.test(slug)) {
			return {
				success: false,
				error: 'Slug must contain only lowercase letters, numbers, and hyphens.',
				action: 'createSite',
				field: 'slug'
			};
		}

		// Slug must be unique
		const [existing] = await db
			.select({ id: sites.id })
			.from(sites)
			.where(eq(sites.slug, slug))
			.limit(1);

		if (existing) {
			return {
				success: false,
				error: `A site with slug "${slug}" already exists. Choose a different slug.`,
				action: 'createSite',
				field: 'slug'
			};
		}

		// --- Insert site + empty settings ---

		try {
			const [newSite] = await db
				.insert(sites)
				.values({ name, slug })
				.returning({ id: sites.id });

			if (!newSite) {
				return { success: false, error: 'Failed to create site.', action: 'createSite' };
			}

			// Insert an empty siteSettings row for the new site
			await db.insert(siteSettings).values({
				siteId: newSite.id,
				settings: {}
			});

			return { success: true, action: 'createSite', siteId: newSite.id };
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Failed to create site.';
			return { success: false, error: message, action: 'createSite' };
		}
	},

	/**
	 * Load full details for a selected site (drill-down).
	 * Accepts form data: siteId (uuid string).
	 *
	 * Returns comprehensive site information:
	 * - Site metadata (name, slug, isActive, dates)
	 * - All settings (parsed JSON from siteSettings)
	 * - Events (title, startTime, isPublished) sorted by startTime desc
	 * - Assets (filename, type, cdnKey) with CDN URLs
	 * - Nav links and social links
	 * - Members (username, role) joined with users table
	 */
	loadSiteDetails: async (event) => {
		if (!event.locals.isSuperAdmin) {
			throw error(403, 'Only super admins can perform this action.');
		}

		const formData = await event.request.formData();
		const siteId = formData.get('siteId')?.toString();

		if (!siteId) {
			return { success: false, error: 'Site ID is required.', action: 'loadSiteDetails' };
		}

		try {
			// Fetch the site
			const [site] = await db
				.select()
				.from(sites)
				.where(eq(sites.id, siteId))
				.limit(1);

			if (!site) {
				return { success: false, error: 'Site not found.', action: 'loadSiteDetails' };
			}

			// Fetch settings
			const [settingsRow] = await db
				.select({ settings: siteSettings.settings })
				.from(siteSettings)
				.where(eq(siteSettings.siteId, siteId))
				.limit(1);

			const parsedSettings = (settingsRow?.settings ?? {}) as Partial<SiteSettingsData>;

			// Fetch events
			const eventRows = await db
				.select({
					id: events.id,
					title: events.title,
					startTime: events.startTime,
					isPublished: events.isPublished
				})
				.from(events)
				.where(eq(events.siteId, siteId))
				.orderBy(desc(events.startTime))
				.limit(50);

			// Fetch assets with CDN URLs
			const assetRows = await db
				.select({
					id: assets.id,
					filename: assets.filename,
					type: assets.type,
					cdnKey: assets.cdnKey,
					mimeType: assets.mimeType,
					size: assets.size,
					createdAt: assets.createdAt
				})
				.from(assets)
				.where(eq(assets.siteId, siteId))
				.orderBy(desc(assets.createdAt))
				.limit(50);

			const assetsWithUrls = assetRows.map((a) => ({
				...a,
				cdnUrl: getCdnUrl(a.cdnKey)
			}));

			// Fetch nav links
			const navLinkRows = await db
				.select()
				.from(navLinks)
				.where(eq(navLinks.siteId, siteId))
				.orderBy(asc(navLinks.position), asc(navLinks.sortOrder));

			// Fetch social links
			const socialLinkRows = await db
				.select()
				.from(socialLinks)
				.where(eq(socialLinks.siteId, siteId))
				.orderBy(asc(socialLinks.sortOrder));

			// Fetch members (joined with users)
			const memberRows = await db
				.select({
					id: memberships.id,
					role: memberships.role,
					userId: users.id,
					discordUsername: users.discordUsername,
					discordId: users.discordId
				})
				.from(memberships)
				.innerJoin(users, eq(memberships.userId, users.id))
				.where(eq(memberships.siteId, siteId));

			return {
				success: true,
				action: 'loadSiteDetails',
				details: {
					site: {
						id: site.id,
						name: site.name,
						slug: site.slug,
						isActive: site.isActive,
						createdAt: site.createdAt,
						updatedAt: site.updatedAt
					},
					settings: parsedSettings,
					events: eventRows,
					assets: assetsWithUrls,
					navLinks: navLinkRows,
					socialLinks: socialLinkRows,
					members: memberRows
				}
			};
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Failed to load site details.';
			return { success: false, error: message, action: 'loadSiteDetails' };
		}
	},

	/**
	 * Save feature flags for a specific site.
	 * Accepts form data: siteId (uuid string), flag booleans.
	 *
	 * Each flag is submitted as 'flag_events', 'flag_navLinks', etc.
	 * 'on' means enabled; absence means disabled.
	 * Preserves all other settings keys when merging.
	 */
	saveFeatureFlags: async (event) => {
		if (!event.locals.isSuperAdmin) {
			throw error(403, 'Only super admins can perform this action.');
		}

		const formData = await event.request.formData();
		const siteId = formData.get('siteId')?.toString();

		if (!siteId) {
			return { success: false, error: 'Site ID is required.', action: 'saveFeatureFlags' };
		}

		try {
			// Read current settings
			const [row] = await db
				.select({ settings: siteSettings.settings })
				.from(siteSettings)
				.where(eq(siteSettings.siteId, siteId))
				.limit(1);

			const currentSettings = (row?.settings ?? {}) as Record<string, unknown>;

			// Build updated feature flags from form checkboxes
			const updatedFlags: FeatureFlags = {
				events: formData.get('flag_events') === 'on',
				navLinks: formData.get('flag_navLinks') === 'on',
				socialLinks: formData.get('flag_socialLinks') === 'on',
				branding: formData.get('flag_branding') === 'on',
				homepageEditor: formData.get('flag_homepageEditor') === 'on',
				assetLibrary: formData.get('flag_assetLibrary') === 'on'
			};

			const updatedSettings = {
				...currentSettings,
				featureFlags: updatedFlags
			};

			await db
				.insert(siteSettings)
				.values({
					siteId,
					settings: updatedSettings
				})
				.onConflictDoUpdate({
					target: siteSettings.siteId,
					set: {
						settings: updatedSettings,
						updatedAt: new Date()
					}
				});

			return { success: true, action: 'saveFeatureFlags' };
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Failed to save feature flags.';
			return { success: false, error: message, action: 'saveFeatureFlags' };
		}
	}
};
