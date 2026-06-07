import { db } from './db/index';
import { siteSettings } from './db/schema';
import { eq } from 'drizzle-orm';

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
	heroCtaLink: string;
	contentFeatures: FeatureCard[];
	ctaHeading: string;
	ctaText: string;
	ctaButtonText: string;
	ctaButtonLink: string;
	footerText: string;
};

// --- Defaults (template/dummy data for first-time setup) ---

export const DEFAULT_SETTINGS: SiteSettings = {
	siteName: 'My Community Hub',
	heroHeading: 'Your Community Hub for Screenings & Events',
	heroSubtitle:
		'A space to share, discover, and celebrate the films and shows that bring us together.',
	heroCtaText: 'Get Started',
	heroCtaLink: '/login',
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
	ctaButtonLink: '/login',
	footerText: '© 2026 My Community Hub. All rights reserved.'
};

// --- Keys used in the siteSettings table ---
const KEYS = {
	SITE_NAME: 'siteName',
	HERO_HEADING: 'heroHeading',
	HERO_SUBTITLE: 'heroSubtitle',
	HERO_CTA_TEXT: 'heroCtaText',
	HERO_CTA_LINK: 'heroCtaLink',
	CONTENT_FEATURES: 'contentFeatures',
	CTA_HEADING: 'ctaHeading',
	CTA_TEXT: 'ctaText',
	CTA_BUTTON_TEXT: 'ctaButtonText',
	CTA_BUTTON_LINK: 'ctaButtonLink',
	FOOTER_TEXT: 'footerText'
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
		heroCtaLink: (map.get(KEYS.HERO_CTA_LINK) as string) ?? DEFAULT_SETTINGS.heroCtaLink,
		contentFeatures:
			(map.get(KEYS.CONTENT_FEATURES) as FeatureCard[]) ?? DEFAULT_SETTINGS.contentFeatures,
		ctaHeading: (map.get(KEYS.CTA_HEADING) as string) ?? DEFAULT_SETTINGS.ctaHeading,
		ctaText: (map.get(KEYS.CTA_TEXT) as string) ?? DEFAULT_SETTINGS.ctaText,
		ctaButtonText: (map.get(KEYS.CTA_BUTTON_TEXT) as string) ?? DEFAULT_SETTINGS.ctaButtonText,
		ctaButtonLink: (map.get(KEYS.CTA_BUTTON_LINK) as string) ?? DEFAULT_SETTINGS.ctaButtonLink,
		footerText: (map.get(KEYS.FOOTER_TEXT) as string) ?? DEFAULT_SETTINGS.footerText
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
