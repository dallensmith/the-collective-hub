import type { Site } from '$lib/server/db/schema';

/** Branding configuration for a site */
export interface BrandingSettings {
	siteName: string;
	tagline: string;
	logoCdnKey: string | null;
	backgroundCdnKey: string | null;
	faviconCdnKey: string | null;
}

/** Theme configuration */
export interface ThemeSettings {
	preset: 'dark' | 'light' | 'custom';
	accentColor: string;
	backgroundColor: string;
	textColor: string;
}

/** Homepage content configuration */
export interface HomepageSettings {
	heroTitle: string;
	heroSubtitle: string;
	aboutText: string;
	primaryButtonText: string;
	primaryButtonLink: string;
	showNextEvent: boolean;
	showSchedule: boolean;
}

/** Layout configuration */
export interface LayoutSettings {
	preset: 'standard';
}

/** Full site settings shape stored in siteSettings.settings JSON */
export interface SiteSettingsData {
	branding: BrandingSettings;
	theme: ThemeSettings;
	homepage: HomepageSettings;
	layout: LayoutSettings;
}

/** User role within a site */
export type UserRole = 'owner' | 'admin' | 'editor';

/** Site context loaded for every request */
export interface SiteContext {
	site: Site;
	settings: SiteSettingsData;
}
