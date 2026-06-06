import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { getGuildRoles } from '$lib/server/discord';

/**
 * GET /api/discord/roles?guildId=...
 *
 * Proxies guild role listings from the Discord API for the admin role-mapping
 * dropdown. Requires site owner or admin membership (or super admin).
 *
 * Returns JSON: { roles: { id: string; name: string; color: number }[] }
 * Returns JSON with error note if the bot cannot access the guild.
 */
export const GET: RequestHandler = async (event) => {
	const { user, membership, site, isSuperAdmin } = event.locals;

	// Auth check
	if (!user) {
		error(401, 'Authentication required.');
	}
	if (!site) {
		error(400, 'No site context.');
	}

	const isAuthorized =
		isSuperAdmin || (membership && ['owner', 'admin'].includes(membership.role));
	if (!isAuthorized) {
		error(403, 'Only owners and admins can fetch guild roles.');
	}

	const guildId = event.url.searchParams.get('guildId');
	if (!guildId) {
		error(400, 'Missing guildId query parameter.');
	}

	try {
		const roles = await getGuildRoles(guildId);
		if (!roles) {
			return json({
				roles: [],
				error: 'Cannot fetch roles. Ensure the bot is in the server and has permissions.'
			});
		}
		return json({ roles });
	} catch (err) {
		console.error('[discord-roles-api] Failed:', err);
		error(502, 'Failed to fetch Discord roles.');
	}
};
