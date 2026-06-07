import { OWNER_DISCORD_ID, SUPERADMIN_DISCORD_IDS } from '$env/static/private';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	const user = locals.user;
	const session = locals.session;

	if (!session || !user) {
		return { isAuthorized: false };
	}

	const superAdminIds = SUPERADMIN_DISCORD_IDS.split(',').map((id) => id.trim());
	const discordId = user.discordId ?? '';
	const isAuthorized =
		discordId === OWNER_DISCORD_ID ||
		superAdminIds.includes(discordId);

	return { isAuthorized };
};
