import { db } from '$lib/server/db';
import { navLinks, socialLinks } from '$lib/server/db/schema';
import { eq, asc } from 'drizzle-orm';
import { error, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { logAuditEvent } from '$lib/server/audit-log';

/**
 * Load nav links and social links for the current site.
 */
export const load: PageServerLoad = async (event) => {
	const { site } = event.locals;

	if (!site) {
		return { navLinks: [], socialLinks: [] };
	}

	// Feature flag guard: at least one link feature must be enabled
	const ff = event.locals.siteSettings?.featureFlags;
	if (ff?.navLinks === false && ff?.socialLinks === false) {
		throw error(403, 'The Links feature is disabled for this site.');
	}

	const navRows = await db
		.select()
		.from(navLinks)
		.where(eq(navLinks.siteId, site.id))
		.orderBy(asc(navLinks.position), asc(navLinks.sortOrder));

	const socialRows = await db
		.select()
		.from(socialLinks)
		.where(eq(socialLinks.siteId, site.id))
		.orderBy(asc(socialLinks.sortOrder));

	return {
		navLinks: navRows,
		socialLinks: socialRows
	};
};

/**
 * Named form actions for CRUD operations on nav links and social links.
 */
export const actions: Actions = {
	// ─── Nav Links ────────────────────────────────────────────────────────

	createNavLink: async (event) => {
		const { site } = event.locals;
		if (!site) return { success: false, error: 'No site context found.' };

		const formData = await event.request.formData();
		const label = formData.get('label')?.toString().trim();
		const url = formData.get('url')?.toString().trim();
		const position = formData.get('position')?.toString().trim() ?? 'header';
		const sortOrder = parseInt(formData.get('sortOrder')?.toString() ?? '0', 10) || 0;
		const isExternal = formData.get('isExternal') === 'on';

		if (!label || !url) {
			return { success: false, error: 'Label and URL are required.', action: 'createNavLink' };
		}

		if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('/')) {
			return { success: false, error: 'URL must start with http://, https://, or /.', action: 'createNavLink' };
		}

		try {
			const [created] = await db
				.insert(navLinks)
				.values({
					siteId: site.id,
					label,
					url,
					position,
					sortOrder,
					isExternal
				})
				.returning({ id: navLinks.id });

			if (created) {
				logAuditEvent({
					siteId: site.id,
					userId: event.locals.user?.discordId ?? 'unknown',
					userEmail: event.locals.user?.email,
					action: 'create',
					entityType: 'link',
					entityId: created.id,
					details: JSON.stringify({ label, url, position })
				});
			}

			return { success: true, action: 'createNavLink' };
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Failed to create nav link.';
			return { success: false, error: message, action: 'createNavLink' };
		}
	},

	updateNavLink: async (event) => {
		const { site } = event.locals;
		if (!site) return { success: false, error: 'No site context found.' };

		const formData = await event.request.formData();
		const id = formData.get('id')?.toString();
		const label = formData.get('label')?.toString().trim();
		const url = formData.get('url')?.toString().trim();
		const position = formData.get('position')?.toString().trim() ?? 'header';
		const sortOrder = parseInt(formData.get('sortOrder')?.toString() ?? '0', 10) || 0;
		const isExternal = formData.get('isExternal') === 'on';

		if (!id) return { success: false, error: 'Link ID is required.', action: 'updateNavLink' };
		if (!label || !url) {
			return { success: false, error: 'Label and URL are required.', action: 'updateNavLink' };
		}

		if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('/')) {
			return { success: false, error: 'URL must start with http://, https://, or /.', action: 'updateNavLink' };
		}

		try {
			await db
				.update(navLinks)
				.set({ label, url, position, sortOrder, isExternal, updatedAt: new Date() })
				.where(eq(navLinks.id, id));

			logAuditEvent({
				siteId: site.id,
				userId: event.locals.user?.discordId ?? 'unknown',
				userEmail: event.locals.user?.email,
				action: 'update',
				entityType: 'link',
				entityId: id,
				details: JSON.stringify({ label, url, position })
			});

			return { success: true, action: 'updateNavLink' };
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Failed to update nav link.';
			return { success: false, error: message, action: 'updateNavLink' };
		}
	},

	deleteNavLink: async (event) => {
		const { site } = event.locals;
		if (!site) return { success: false, error: 'No site context found.' };

		const formData = await event.request.formData();
		const id = formData.get('id')?.toString();

		if (!id) return { success: false, error: 'Link ID is required.', action: 'deleteNavLink' };

		try {
			// Verify siteId matches before deleting
			const [existing] = await db
				.select({ id: navLinks.id })
				.from(navLinks)
				.where(eq(navLinks.id, id))
				.limit(1);

			if (!existing) {
				return { success: false, error: 'Link not found.', action: 'deleteNavLink' };
			}

			await db.delete(navLinks).where(eq(navLinks.id, id));

			logAuditEvent({
				siteId: site.id,
				userId: event.locals.user?.discordId ?? 'unknown',
				userEmail: event.locals.user?.email,
				action: 'delete',
				entityType: 'link',
				entityId: id
			});

			return { success: true, action: 'deleteNavLink' };
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Failed to delete nav link.';
			return { success: false, error: message, action: 'deleteNavLink' };
		}
	},

	// ─── Social Links ─────────────────────────────────────────────────────

	createSocialLink: async (event) => {
		const { site } = event.locals;
		if (!site) return { success: false, error: 'No site context found.' };

		const formData = await event.request.formData();
		const platform = formData.get('platform')?.toString().trim();
		const label = formData.get('label')?.toString().trim() || null;
		const url = formData.get('url')?.toString().trim();
		const sortOrder = parseInt(formData.get('sortOrder')?.toString() ?? '0', 10) || 0;

		if (!platform || !url) {
			return { success: false, error: 'Platform and URL are required.', action: 'createSocialLink' };
		}

		if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('/')) {
			return { success: false, error: 'URL must start with http://, https://, or /.', action: 'createSocialLink' };
		}

		try {
			const [created] = await db
				.insert(socialLinks)
				.values({
					siteId: site.id,
					platform,
					label,
					url,
					sortOrder
				})
				.returning({ id: socialLinks.id });

			if (created) {
				logAuditEvent({
					siteId: site.id,
					userId: event.locals.user?.discordId ?? 'unknown',
					userEmail: event.locals.user?.email,
					action: 'create',
					entityType: 'link',
					entityId: created.id,
					details: JSON.stringify({ platform, label, url })
				});
			}

			return { success: true, action: 'createSocialLink' };
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Failed to create social link.';
			return { success: false, error: message, action: 'createSocialLink' };
		}
	},

	updateSocialLink: async (event) => {
		const { site } = event.locals;
		if (!site) return { success: false, error: 'No site context found.' };

		const formData = await event.request.formData();
		const id = formData.get('id')?.toString();
		const platform = formData.get('platform')?.toString().trim();
		const label = formData.get('label')?.toString().trim() || null;
		const url = formData.get('url')?.toString().trim();
		const sortOrder = parseInt(formData.get('sortOrder')?.toString() ?? '0', 10) || 0;

		if (!id) return { success: false, error: 'Link ID is required.', action: 'updateSocialLink' };
		if (!platform || !url) {
			return { success: false, error: 'Platform and URL are required.', action: 'updateSocialLink' };
		}

		if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('/')) {
			return { success: false, error: 'URL must start with http://, https://, or /.', action: 'updateSocialLink' };
		}

		try {
			await db
				.update(socialLinks)
				.set({ platform, label, url, sortOrder, updatedAt: new Date() })
				.where(eq(socialLinks.id, id));

			logAuditEvent({
				siteId: site.id,
				userId: event.locals.user?.discordId ?? 'unknown',
				userEmail: event.locals.user?.email,
				action: 'update',
				entityType: 'link',
				entityId: id,
				details: JSON.stringify({ platform, label, url })
			});

			return { success: true, action: 'updateSocialLink' };
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Failed to update social link.';
			return { success: false, error: message, action: 'updateSocialLink' };
		}
	},

	deleteSocialLink: async (event) => {
		const { site } = event.locals;
		if (!site) return { success: false, error: 'No site context found.' };

		const formData = await event.request.formData();
		const id = formData.get('id')?.toString();

		if (!id) return { success: false, error: 'Link ID is required.', action: 'deleteSocialLink' };

		try {
			// Verify site ownership before deleting
			const [existing] = await db
				.select({ id: socialLinks.id, siteId: socialLinks.siteId })
				.from(socialLinks)
				.where(eq(socialLinks.id, id))
				.limit(1);

			if (!existing) {
				return { success: false, error: 'Link not found.', action: 'deleteSocialLink' };
			}

			if (existing.siteId !== site.id) {
				return { success: false, error: 'You do not have permission to delete this link.', action: 'deleteSocialLink' };
			}

			await db.delete(socialLinks).where(eq(socialLinks.id, id));

			logAuditEvent({
				siteId: site.id,
				userId: event.locals.user?.discordId ?? 'unknown',
				userEmail: event.locals.user?.email,
				action: 'delete',
				entityType: 'link',
				entityId: id
			});

			return { success: true, action: 'deleteSocialLink' };
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Failed to delete social link.';
			return { success: false, error: message, action: 'deleteSocialLink' };
		}
	}
};
