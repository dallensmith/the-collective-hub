import { OWNER_DISCORD_ID, SUPERADMIN_DISCORD_IDS } from '$env/static/private';
import { getSettings } from '$lib/server/settings';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	const user = locals.user;
	const session = locals.session;

	// Load settings (in parallel with auth check)
	const settings = getSettings();

	if (!session || !user) {
		return { isAuthorized: false, settings: await settings };
	}

	const superAdminIds = SUPERADMIN_DISCORD_IDS.split(',').map((id) => id.trim());
	const discordId = user.discordId ?? '';
	const isAuthorized =
		discordId === OWNER_DISCORD_ID ||
		superAdminIds.includes(discordId);

	return { isAuthorized, settings: await settings };
};
