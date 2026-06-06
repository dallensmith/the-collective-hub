import { db } from '$lib/server/db';
import { auditLog } from '$lib/server/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

const VALID_ENTITY_TYPES = ['event', 'asset', 'link', 'branding', 'homepage', 'settings', 'team'] as const;

/**
 * Load audit log entries for the current site.
 * Only accessible to owners and admins (editors cannot view audit logs).
 */
export const load: PageServerLoad = async (event) => {
	const { site, membership, isSuperAdmin } = event.locals;

	if (!site) {
		throw error(400, 'No site context found.');
	}

	// Role check: only owners, admins, and super admins can view audit logs
	if (!isSuperAdmin) {
		if (!membership || !['owner', 'admin'].includes(membership.role)) {
			throw error(403, 'You do not have permission to view the audit log. Only owners and admins can access this page.');
		}
	}

	// Optional entityType filter from query string
	const filterParam = event.url.searchParams.get('filter');
	const entityTypeFilter = filterParam && VALID_ENTITY_TYPES.includes(filterParam as typeof VALID_ENTITY_TYPES[number])
		? (filterParam as typeof VALID_ENTITY_TYPES[number])
		: null;

	const entries = await db
		.select()
		.from(auditLog)
		.where(
			entityTypeFilter
				? and(eq(auditLog.siteId, site.id), eq(auditLog.entityType, entityTypeFilter))
				: eq(auditLog.siteId, site.id)
		)
		.orderBy(desc(auditLog.createdAt))
		.limit(100);

	return {
		entries,
		currentFilter: entityTypeFilter
	};
};
