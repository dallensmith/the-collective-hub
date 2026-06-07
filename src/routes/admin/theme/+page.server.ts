import { getSettings, updateSettings, getThemePreset } from '$lib/server/settings';
import { THEME_PRESETS } from '$lib/server/themes';
import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async () => {
	const settings = await getSettings();
	const currentTheme = getThemePreset(settings.themePreset);
	return {
		themes: THEME_PRESETS,
		currentTheme,
		currentThemeId: settings.themePreset,
		currentThemeMode: settings.themeMode
	};
};

export const actions: Actions = {
	default: async ({ request }) => {
		const formData = await request.formData();
		const themePreset = formData.get('themePreset') as string;
		const themeMode = formData.get('themeMode') as string;

		if (!THEME_PRESETS.find((t) => t.id === themePreset)) {
			return fail(400, { error: 'Invalid theme selection' });
		}

		if (themeMode !== 'light' && themeMode !== 'dark') {
			return fail(400, { error: 'Invalid color mode selection' });
		}

		await updateSettings({ themePreset, themeMode });
		return { success: true };
	}
};
