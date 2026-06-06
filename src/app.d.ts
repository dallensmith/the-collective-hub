// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { Site, Membership } from '$lib/server/db/schema';
import type { SiteSettingsData } from '$lib/shared/types';

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			site: Site | null;
			siteSlug: string;
			siteSettings: SiteSettingsData | null;
			user: {
				id: string;
				discordId: string;
				discordUsername: string;
				discordAvatar: string | null;
				email: string | null;
			} | null;
			membership: Membership | null;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
