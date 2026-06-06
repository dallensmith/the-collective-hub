import type { Site } from '$lib/server/db/schema';

/** Payload embedded in a signed preview cookie token */
export interface PreviewTokenPayload {
	siteId: string;
	userId: string;
	exp: number; // Unix timestamp (seconds)
}

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

/** Mapping from a Discord role ID to a site membership role */
export interface DiscordRoleMapping {
	discordRoleId: string;
	siteRole: 'owner' | 'admin' | 'editor';
}

/** Discord integration settings */
export interface DiscordSettings {
	guildId: string | null;
	eventsEnabled: boolean;
	roleSyncEnabled?: boolean;
	roleMappings?: DiscordRoleMapping[];
}

/** Feature flags controlling which features are enabled for a site */
export interface FeatureFlags {
	events?: boolean;          // Enable events feature
	navLinks?: boolean;        // Enable custom nav links
	socialLinks?: boolean;     // Enable social links
	branding?: boolean;        // Enable branding customization
	homepageEditor?: boolean;  // Enable homepage content editing
	assetLibrary?: boolean;    // Enable asset upload/library
	discordEvents?: boolean;   // Enable Discord event integration
}

/** Full site settings shape stored in siteSettings.settings JSON */
export interface SiteSettingsData {
	branding: BrandingSettings;
	theme: ThemeSettings;
	homepage: HomepageSettings;
	layout: LayoutSettings;
	featureFlags?: FeatureFlags;
	discord?: DiscordSettings;
}

/** User role within a site */
export type UserRole = 'owner' | 'admin' | 'editor';

/** Site context loaded for every request */
export interface SiteContext {
	site: Site;
	settings: SiteSettingsData;
}
