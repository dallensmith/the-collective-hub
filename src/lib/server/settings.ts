import { db } from './db/index';
import { siteSettings } from './db/schema';
import { eq } from 'drizzle-orm';
import { THEME_PRESETS, type ThemePreset } from './themes';

// --- Types ---

export type FeatureCard = {
	icon: string;
	title: string;
	description: string;
};

export type SiteSettings = {
	siteName: string;
	heroHeading: string;
	heroSubtitle: string;
	heroCtaText: string;
	heroSecondaryCtaText: string;
	contentHeading: string;
	contentSubtitle: string;
	contentFeatures: FeatureCard[];
	ctaHeading: string;
	ctaText: string;
	ctaButtonText: string;
	footerText: string;
	themePreset: string;
	themeMode: string;
};

// --- Defaults (template/dummy data for first-time setup) ---

export const DEFAULT_SETTINGS: SiteSettings = {
	siteName: 'My Community Hub',
	heroHeading: 'Your Community Hub for Screenings & Events',
	heroSubtitle:
		'A space to share, discover, and celebrate the films and shows that bring us together.',
	heroCtaText: 'Get Started',
	heroSecondaryCtaText: 'Learn More',
	contentHeading: 'Everything you need',
	contentSubtitle: 'Tools to build and manage your community hub.',
	contentFeatures: [
		{
			icon: '🎬',
			title: 'Screenings',
			description: 'Schedule and manage film screenings and watch parties with ease.'
		},
		{
			icon: '👥',
			title: 'Community',
			description: 'Bring people together around shared interests and memorable experiences.'
		},
		{
			icon: '⚙️',
			title: 'Easy Management',
			description: 'Simple admin tools to keep everything running smoothly.'
		}
	],
	ctaHeading: 'Ready to get started?',
	ctaText: 'Set up your community hub in minutes.',
	ctaButtonText: 'Login with Discord',
	footerText: '© 2026 My Community Hub. All rights reserved.',
	themePreset: 'default-dark',
	themeMode: 'light'
};

// --- Keys used in the siteSettings table ---
const KEYS = {
	SITE_NAME: 'siteName',
	HERO_HEADING: 'heroHeading',
	HERO_SUBTITLE: 'heroSubtitle',
	HERO_CTA_TEXT: 'heroCtaText',
	HERO_SECONDARY_CTA_TEXT: 'heroSecondaryCtaText',
	CONTENT_HEADING: 'contentHeading',
	CONTENT_SUBTITLE: 'contentSubtitle',
	CONTENT_FEATURES: 'contentFeatures',
	CTA_HEADING: 'ctaHeading',
	CTA_TEXT: 'ctaText',
	CTA_BUTTON_TEXT: 'ctaButtonText',
	FOOTER_TEXT: 'footerText',
	THEME_PRESET: 'themePreset',
	THEME_MODE: 'themeMode'
} as const;

// --- Functions ---

export async function getSettings(): Promise<SiteSettings> {
	const rows = await db.select().from(siteSettings);
	const map = new Map(rows.map((r) => [r.key, r.value]));

	const settings: SiteSettings = {
		siteName: (map.get(KEYS.SITE_NAME) as string) ?? DEFAULT_SETTINGS.siteName,
		heroHeading: (map.get(KEYS.HERO_HEADING) as string) ?? DEFAULT_SETTINGS.heroHeading,
		heroSubtitle: (map.get(KEYS.HERO_SUBTITLE) as string) ?? DEFAULT_SETTINGS.heroSubtitle,
		heroCtaText: (map.get(KEYS.HERO_CTA_TEXT) as string) ?? DEFAULT_SETTINGS.heroCtaText,
		heroSecondaryCtaText:
			(map.get(KEYS.HERO_SECONDARY_CTA_TEXT) as string) ?? DEFAULT_SETTINGS.heroSecondaryCtaText,
		contentHeading:
			(map.get(KEYS.CONTENT_HEADING) as string) ?? DEFAULT_SETTINGS.contentHeading,
		contentSubtitle:
			(map.get(KEYS.CONTENT_SUBTITLE) as string) ?? DEFAULT_SETTINGS.contentSubtitle,
		contentFeatures:
			(map.get(KEYS.CONTENT_FEATURES) as FeatureCard[]) ?? DEFAULT_SETTINGS.contentFeatures,
		ctaHeading: (map.get(KEYS.CTA_HEADING) as string) ?? DEFAULT_SETTINGS.ctaHeading,
		ctaText: (map.get(KEYS.CTA_TEXT) as string) ?? DEFAULT_SETTINGS.ctaText,
		ctaButtonText: (map.get(KEYS.CTA_BUTTON_TEXT) as string) ?? DEFAULT_SETTINGS.ctaButtonText,
		footerText: (map.get(KEYS.FOOTER_TEXT) as string) ?? DEFAULT_SETTINGS.footerText,
		themePreset: (map.get(KEYS.THEME_PRESET) as string) ?? DEFAULT_SETTINGS.themePreset,
		themeMode: (map.get(KEYS.THEME_MODE) as string) ?? DEFAULT_SETTINGS.themeMode
	};

	return settings;
}

export async function updateSetting(key: string, value: unknown): Promise<void> {
	await db
		.insert(siteSettings)
		.values({ key, value })
		.onConflictDoUpdate({ target: siteSettings.key, set: { value } });
}

export async function updateSettings(settings: Partial<SiteSettings>): Promise<void> {
	for (const [key, value] of Object.entries(settings)) {
		if (value !== undefined) {
			await updateSetting(key, value);
		}
	}
}

export function getThemePreset(id?: string): ThemePreset {
	return THEME_PRESETS.find((t) => t.id === id) ?? THEME_PRESETS[0];
}
