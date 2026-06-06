import { db } from '$lib/server/db';
import { assets } from '$lib/server/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getCdnUrl, deleteFromCdn } from '$lib/server/cdn';
import type { PageServerLoad, Actions } from './$types';

/**
 * Load all assets for the current site, newest first.
 * Computes the public CDN URL for each asset.
 */
export const load: PageServerLoad = async (event) => {
	const { site } = event.locals;

	if (!site) {
		return { assetList: [] };
	}

	const rows = await db
		.select()
		.from(assets)
		.where(eq(assets.siteId, site.id))
		.orderBy(desc(assets.createdAt))
		.limit(100);

	const assetList = rows.map((a) => ({
		id: a.id,
		filename: a.filename,
		mimeType: a.mimeType,
		size: a.size,
		cdnKey: a.cdnKey,
		cdnUrl: getCdnUrl(a.cdnKey),
		createdAt: a.createdAt
	}));

	return { assetList };
};

/**
 * Form action: delete an asset by id.
 */
export const actions: Actions = {
	delete: async (event) => {
		const { site } = event.locals;

		if (!site) {
			return { success: false, error: 'No site context.' };
		}

		const formData = await event.request.formData();
		const assetId = formData.get('assetId')?.toString();

		if (!assetId) {
			return { success: false, error: 'Missing asset ID.' };
		}

		// Find the asset (scoped to site)
		const [record] = await db
			.select()
			.from(assets)
			.where(and(eq(assets.id, assetId), eq(assets.siteId, site.id)))
			.limit(1);

		if (!record) {
			return { success: false, error: 'Asset not found.' };
		}

		// Delete from CDN (soft-fail: log but don't block)
		try {
			await deleteFromCdn(record.cdnKey);
		} catch (err) {
			console.error('CDN delete failed for', record.cdnKey, err);
		}

		// Delete from database
		await db.delete(assets).where(eq(assets.id, assetId));

		return { success: true };
	}
};
