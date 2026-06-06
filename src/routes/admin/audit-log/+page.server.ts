import { db } from '$lib/server/db';
import { auditLog } from '$lib/server/db/schema';
import { eq, desc, and, count } from 'drizzle-orm';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

const VALID_ENTITY_TYPES = ['event', 'asset', 'link', 'branding', 'homepage', 'settings', 'team', 'site'] as const;
const DEFAULT_PER_PAGE = 50;

/**
 * Load audit log entries for the current site with pagination.
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

	// Pagination params
	const pageParam = parseInt(event.url.searchParams.get('page') ?? '1', 10);
	const perPageParam = parseInt(event.url.searchParams.get('perPage') ?? String(DEFAULT_PER_PAGE), 10);
	const page = isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;
	const perPage = isNaN(perPageParam) || perPageParam < 1 ? DEFAULT_PER_PAGE : Math.min(perPageParam, 100);

	// Base where clause
	const whereClause = entityTypeFilter
		? and(eq(auditLog.siteId, site.id), eq(auditLog.entityType, entityTypeFilter))
		: eq(auditLog.siteId, site.id);

	// Count total matching entries
	const [totalRow] = await db
		.select({ value: count() })
		.from(auditLog)
		.where(whereClause);

	const totalCount = totalRow?.value ?? 0;
	const totalPages = Math.max(1, Math.ceil(totalCount / perPage));
	const offset = (page - 1) * perPage;

	// Fetch paginated entries
	const entries = await db
		.select()
		.from(auditLog)
		.where(whereClause)
		.orderBy(desc(auditLog.createdAt))
		.limit(perPage)
		.offset(offset);

	return {
		entries,
		currentFilter: entityTypeFilter,
		page,
		perPage,
		totalCount,
		totalPages
	};
};
