import type { Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { SiteSettingsData, DiscordRoleMapping } from '$lib/shared/types';
import { db } from '$lib/server/db';
import { siteSettings } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { saveDraft, publishDrafts, discardDrafts, getMergedDraftSettings } from '$lib/server/settings-writer';
import { logAuditEvent } from '$lib/server/audit-log';
import { getGuild, getGuildRoles } from '$lib/server/discord';
import { env } from '$env/dynamic/private';

/**
 * Load current site name, tagline, Discord settings, and connection status.
 * Falls back to the site's base name and empty tagline if no settings exist yet.
 */
export const load: PageServerLoad = async (event) => {
	const { site } = event.locals;

	if (!site) {
		return {
			siteName: '',
			tagline: '',
			discordGuildId: '',
			discordEventsEnabled: false,
			discordGuildName: null,
			discordConnectionError: false,
			discordRoleSyncEnabled: false,
			discordRoleMappings: [] as DiscordRoleMapping[],
			discordGuildRoles: [] as { id: string; name: string; color: number }[]
		};
	}

	// Load merged settings (live + draft overlay) so the form shows WYSIWYG
	const mergedSettings = await getMergedDraftSettings(site.id);
	const settings = (mergedSettings ?? {}) as Partial<SiteSettingsData>;
	const branding = settings.branding;
	const discord = settings.discord;
	const discordGuildId = discord?.guildId ?? '';

	// Check Discord connection status if a guild ID is configured
	let discordGuildName: string | null = null;
	let discordConnectionError = false;
	let discordGuildRoles: { id: string; name: string; color: number }[] = [];

	if (discordGuildId) {
		if (!env.DISCORD_BOT_TOKEN?.trim()) {
			discordConnectionError = true;
		} else {
			try {
				const guild = await getGuild(discordGuildId);
				if (guild) {
					discordGuildName = guild.name;
				} else {
					discordConnectionError = true;
				}
			} catch {
				discordConnectionError = true;
			}

			// Fetch guild roles for the role sync dropdown (best-effort)
			try {
				const roles = await getGuildRoles(discordGuildId);
				if (roles) {
					discordGuildRoles = roles;
				}
			} catch {
				// Roles fetch is best-effort; don't block page load
			}
		}
	}

	return {
		siteName: branding?.siteName || site.name,
		tagline: branding?.tagline || '',
		discordGuildId,
		discordEventsEnabled: discord?.eventsEnabled ?? false,
		discordGuildName,
		discordConnectionError,
		discordRoleSyncEnabled: discord?.roleSyncEnabled ?? false,
		discordRoleMappings: discord?.roleMappings ?? [],
		discordGuildRoles
	};
};

/**
 * Build merged settings from form data against the current published settings.
 * Returns the full SiteSettingsData object with branding + discord updated.
 */
async function buildMergedSettings(
	siteId: string,
	siteName: string,
	tagline: string,
	discordGuildId: string,
	discordEventsEnabled: boolean,
	discordRoleSyncEnabled: boolean,
	discordRoleMappings: DiscordRoleMapping[]
): Promise<Record<string, unknown>> {
	const [row] = await db
		.select({ settings: siteSettings.settings })
		.from(siteSettings)
		.where(eq(siteSettings.siteId, siteId))
		.limit(1);

	const currentSettings = (row?.settings ?? {}) as Record<string, unknown>;
	const currentBranding = (currentSettings.branding ?? {}) as Record<string, unknown>;
	const currentDiscord = (currentSettings.discord ?? {}) as Record<string, unknown>;

	return {
		...currentSettings,
		branding: {
			...currentBranding,
			siteName,
			tagline
		},
		discord: {
			...currentDiscord,
			guildId: discordGuildId || null,
			eventsEnabled: discordEventsEnabled,
			roleSyncEnabled: discordRoleSyncEnabled,
			roleMappings: discordRoleMappings
		}
	};
}

/** Form validation shared by saveDraft and publish */
function validate(formData: FormData): {
	siteName: string;
	tagline: string;
	discordGuildId: string;
	discordEventsEnabled: boolean;
	discordRoleSyncEnabled: boolean;
	discordRoleMappings: DiscordRoleMapping[];
} | { error: string; field: string } {
	const siteName = formData.get('siteName')?.toString().trim() ?? '';
	const tagline = formData.get('tagline')?.toString().trim() ?? '';
	const discordGuildId = formData.get('discordGuildId')?.toString().trim() ?? '';
	const discordEventsEnabled = formData.get('discordEventsEnabled') === 'on';
	const discordRoleSyncEnabled = formData.get('discordRoleSyncEnabled') === 'on';

	// Parse role mappings from hidden JSON field
	let discordRoleMappings: DiscordRoleMapping[] = [];
	const roleMappingsRaw = formData.get('discordRoleMappings')?.toString().trim();
	if (roleMappingsRaw) {
		try {
			const parsed = JSON.parse(roleMappingsRaw);
			if (Array.isArray(parsed)) {
				discordRoleMappings = parsed.filter(
					(m: DiscordRoleMapping) => m.discordRoleId && m.siteRole
				);
			}
		} catch {
			// Invalid JSON — ignore and use empty array
		}
	}

	if (!siteName) {
		return { error: 'Site name is required.', field: 'siteName' };
	}

	return { siteName, tagline, discordGuildId, discordEventsEnabled, discordRoleSyncEnabled, discordRoleMappings };
}

export const actions: Actions = {
	/** Save changes as a draft — does not affect the live site. */
	saveDraft: async (event) => {
		const { site } = event.locals;
		if (!site) return { success: false, error: 'No site context found.' };

		const formData = await event.request.formData();
		const validation = validate(formData);
		if ('error' in validation) return { success: false, ...validation };

		try {
			const merged = await buildMergedSettings(
				site.id,
				validation.siteName,
				validation.tagline,
				validation.discordGuildId,
				validation.discordEventsEnabled,
				validation.discordRoleSyncEnabled,
				validation.discordRoleMappings
			);
			await saveDraft(site.id, merged as Partial<SiteSettingsData>);

			logAuditEvent({
				siteId: site.id,
				userId: event.locals.user?.discordId ?? 'unknown',
				userEmail: event.locals.user?.email,
				action: 'update',
				entityType: 'settings',
				details: JSON.stringify({ siteName: validation.siteName, tagline: validation.tagline })
			});

			return { success: true, draftSaved: true };
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Failed to save draft.';
			return { success: false, error: message };
		}
	},

	/** Publish changes immediately to the live site, clearing any drafts. */
	publish: async (event) => {
		const { site } = event.locals;
		if (!site) return { success: false, error: 'No site context found.' };

		const formData = await event.request.formData();
		const validation = validate(formData);
		if ('error' in validation) return { success: false, ...validation };

		try {
			const merged = await buildMergedSettings(
				site.id,
				validation.siteName,
				validation.tagline,
				validation.discordGuildId,
				validation.discordEventsEnabled,
				validation.discordRoleSyncEnabled,
				validation.discordRoleMappings
			);
			await publishDrafts(site.id, merged as Partial<SiteSettingsData>);

			logAuditEvent({
				siteId: site.id,
				userId: event.locals.user?.discordId ?? 'unknown',
				userEmail: event.locals.user?.email,
				action: 'update',
				entityType: 'settings',
				details: JSON.stringify({ siteName: validation.siteName, tagline: validation.tagline })
			});

			return { success: true, published: true };
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Failed to publish settings.';
			return { success: false, error: message };
		}
	},

	/** Discard all pending drafts for this site without publishing. */
	discardDrafts: async (event) => {
		const { site } = event.locals;
		if (!site) return { success: false, error: 'No site context found.' };

		try {
			await discardDrafts(site.id);
			return { success: true, draftsDiscarded: true };
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Failed to discard drafts.';
			return { success: false, error: message };
		}
	}
};
