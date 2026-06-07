import { OWNER_DISCORD_ID, SUPERADMIN_DISCORD_IDS } from '$env/static/private';
import { getSettings, getThemePreset } from '$lib/server/settings';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	const user = locals.user;
	const session = locals.session;

	// Load settings (in parallel with auth check)
	const settings = getSettings();

	const isAuthenticated = !!(session && user);

	if (!isAuthenticated) {
		const resolvedSettings = await settings;
		const theme = getThemePreset(resolvedSettings.themePreset);
		return { isAuthenticated, isAuthorized: false, user: null, settings: resolvedSettings, theme };
	}

	const superAdminIds = SUPERADMIN_DISCORD_IDS.split(',').map((id) => id.trim());
	const discordId = user.discordId ?? '';
	const isAuthorized =
		discordId === OWNER_DISCORD_ID ||
		superAdminIds.includes(discordId);

	const resolvedSettings = await settings;
	const theme = getThemePreset(resolvedSettings.themePreset);
	return { isAuthenticated, isAuthorized, user, settings: resolvedSettings, theme };
};
