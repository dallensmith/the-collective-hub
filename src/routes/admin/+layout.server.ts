import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

/**
 * Admin auth guard — runs on every /admin/* request.
 *
 * Checks:
 * 1. User is authenticated (locals.user exists)
 * 2. User has a membership for the current site
 * 3. User's membership role is one of: 'owner', 'admin', 'editor'
 *
 * If any check fails, redirects to /login with an error message.
 *
 * Returns user profile data (Discord avatar URL, username) for the top bar display.
 */
export const load: LayoutServerLoad = async (event) => {
	const { user, membership, site } = event.locals;

	// Not authenticated
	if (!user) {
		throw redirect(
			303,
			`/login?error=${encodeURIComponent('You must be logged in to access the admin panel.')}`
		);
	}

	// No site context (shouldn't happen if hooks.server.ts works)
	if (!site) {
		throw redirect(
			303,
			`/login?error=${encodeURIComponent('No site context found. Check your SITE_SLUG environment variable.')}`
		);
	}

	// Not a member
	if (!membership) {
		throw redirect(
			303,
			`/login?error=${encodeURIComponent('Your account is not a member of this site. Contact the site owner for access.')}`
		);
	}

	// Check role
	const allowedRoles = ['owner', 'admin', 'editor'];
	if (!allowedRoles.includes(membership.role)) {
		throw redirect(
			303,
			`/login?error=${encodeURIComponent('You do not have permission to access the admin panel. Required roles: owner, admin, or editor.')}`
		);
	}

	// Construct Discord avatar URL for the top bar
	const discordAvatarUrl = user.discordAvatar
		? `https://cdn.discordapp.com/avatars/${user.discordId}/${user.discordAvatar}.png`
		: `https://cdn.discordapp.com/embed/avatars/${(parseInt(user.discordId) >> 22) % 6}.png`;

	// User is authorized — return data for admin pages
	return {
		user: {
			...user,
			discordAvatarUrl
		},
		membership,
		site
	};
};
