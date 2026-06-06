import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { siteSettings } from '$lib/server/db/schema';
import type { SiteSettingsData } from '$lib/shared/types';

/**
 * Shared draft/publish/discard DB operations used by all admin settings pages.
 *
 * Key behaviors:
 * - saveDraft merges form data against LIVE published settings (not prior drafts)
 *   to prevent accumulated cruft from repeated save-drafts without publish.
 * - publish copies draftSettings → settings, then clears draftSettings atomically.
 * - discardDrafts simply sets draftSettings to NULL.
 * - getMergedDraftSettings loads live settings, overlays drafts on top, and
 *   returns the merged result (what preview mode sees).
 */

/**
 * Save form data as a draft. Merges the provided partial settings against
 * the current LIVE published settings, then writes the result to draftSettings.
 * Does NOT touch the live `settings` column.
 */
export async function saveDraft(
	siteId: string,
	draftData: Partial<SiteSettingsData>
): Promise<void> {
	// Always read current PUBLISHED settings (not prior drafts)
	const [row] = await db
		.select({ settings: siteSettings.settings })
		.from(siteSettings)
		.where(eq(siteSettings.siteId, siteId))
		.limit(1);

	const currentSettings = (row?.settings ?? {}) as Record<string, unknown>;

	// Deep-merge draftData into currentSettings
	const merged = deepMerge(currentSettings, draftData as Record<string, unknown>);

	await db
		.insert(siteSettings)
		.values({
			siteId,
			settings: currentSettings as Record<string, unknown>,
			draftSettings: merged
		})
		.onConflictDoUpdate({
			target: siteSettings.siteId,
			set: {
				draftSettings: merged,
				updatedAt: new Date()
			}
		});
}

/**
 * Publish drafts: merge the provided form data against live settings,
 * write to `settings`, and clear `draftSettings` to NULL atomically.
 */
export async function publishDrafts(
	siteId: string,
	formData: Partial<SiteSettingsData>
): Promise<void> {
	// Merge form data against live published settings
	const [row] = await db
		.select({ settings: siteSettings.settings })
		.from(siteSettings)
		.where(eq(siteSettings.siteId, siteId))
		.limit(1);

	const currentSettings = (row?.settings ?? {}) as Record<string, unknown>;
	const merged = deepMerge(currentSettings, formData as Record<string, unknown>);

	await db
		.insert(siteSettings)
		.values({
			siteId,
			settings: merged,
			draftSettings: null
		})
		.onConflictDoUpdate({
			target: siteSettings.siteId,
			set: {
				settings: merged,
				draftSettings: null,
				updatedAt: new Date()
			}
		});
}

/**
 * Discard all drafts for a site by setting draftSettings to NULL.
 * The live `settings` column is not touched.
 */
export async function discardDrafts(siteId: string): Promise<void> {
	await db
		.update(siteSettings)
		.set({ draftSettings: null, updatedAt: new Date() })
		.where(eq(siteSettings.siteId, siteId));
}

/**
 * Load live settings, merge drafts on top, return the merged result.
 * Returns null if no settings row exists for the site.
 * This is what preview mode sees.
 */
export async function getMergedDraftSettings(
	siteId: string
): Promise<Record<string, unknown> | null> {
	const [row] = await db
		.select({
			settings: siteSettings.settings,
			draftSettings: siteSettings.draftSettings
		})
		.from(siteSettings)
		.where(eq(siteSettings.siteId, siteId))
		.limit(1);

	if (!row) return null;

	const live = (row.settings ?? {}) as Record<string, unknown>;
	const draft = row.draftSettings as Record<string, unknown> | null;

	if (!draft) return live;

	return deepMerge(live, draft);
}

/**
 * Simple deep merge: properties from `source` override those in `target`.
 * Nested objects are merged recursively. Arrays and primitives are replaced.
 */
function deepMerge(
	target: Record<string, unknown>,
	source: Record<string, unknown>
): Record<string, unknown> {
	const result = { ...target };

	for (const key of Object.keys(source)) {
		const sourceVal = source[key];
		const targetVal = result[key];

		if (
			sourceVal !== null &&
			typeof sourceVal === 'object' &&
			!Array.isArray(sourceVal) &&
			targetVal !== null &&
			typeof targetVal === 'object' &&
			!Array.isArray(targetVal)
		) {
			result[key] = deepMerge(
				targetVal as Record<string, unknown>,
				sourceVal as Record<string, unknown>
			);
		} else {
			result[key] = sourceVal;
		}
	}

	return result;
}
