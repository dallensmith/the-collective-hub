import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { assets } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { uploadToCdn, deleteFromCdn } from '$lib/server/cdn';
import { logAuditEvent } from '$lib/server/audit-log';

/**
 * POST /api/assets — Upload a new image asset.
 *
 * Expects multipart/form-data with a "file" field.
 * Validates type (PNG/JPEG/WebP), max size (5MB), converts to webp,
 * uploads to Bunny CDN, and creates an asset record in the database.
 *
 * Returns JSON: { id, cdnKey, cdnUrl, filename, mimeType, width, height, size }
 */
export const POST: RequestHandler = async (event) => {
	const { site, user, membership } = event.locals;

	// Auth check: must be logged in with a membership
	if (!user || !membership) {
		error(401, 'You must be logged in as a site member to upload assets.');
	}

	if (!site) {
		error(400, 'No site context. Check SITE_SLUG.');
	}

	const formData = await event.request.formData();
	const file = formData.get('file');

	if (!(file instanceof File)) {
		error(400, 'No file provided. Send a file in the "file" field.');
	}

	// Read file buffer
	const arrayBuffer = await file.arrayBuffer();
	const buffer = Buffer.from(arrayBuffer);

	const originalMimeType = file.type || 'application/octet-stream';

	// Upload to CDN (validates, converts to webp)
	let result;
	try {
		result = await uploadToCdn(buffer, site.slug, 'uploads', originalMimeType);
	} catch (err) {
		const message = err instanceof Error ? err.message : 'CDN upload failed.';
		error(503, message);
	}

	// Create asset record in the database
	const [record] = await db
		.insert(assets)
		.values({
			siteId: site.id,
			uploadedByUserId: user.id,
			type: 'image',
			filename: file.name,
			mimeType: result.mimeType,
			size: result.size,
			cdnKey: result.cdnKey
		})
		.returning();

	// Log the asset upload to the audit trail
	logAuditEvent({
		siteId: site.id,
		userId: event.locals.user?.discordId ?? 'unknown',
		userEmail: event.locals.user?.email,
		action: 'create',
		entityType: 'asset',
		entityId: record.id,
		details: JSON.stringify({ filename: file.name, cdnKey: result.cdnKey, size: file.size })
	});

	return json({
		id: record.id,
		cdnKey: record.cdnKey,
		cdnUrl: result.cdnUrl,
		filename: record.filename,
		mimeType: record.mimeType,
		width: result.width,
		height: result.height,
		size: record.size
	});
};

/**
 * DELETE /api/assets?id=... — Delete an asset.
 *
 * Removes the file from CDN storage and deletes the database record.
 * Scoped to the current site for security.
 */
export const DELETE: RequestHandler = async (event) => {
	const { site, user, membership } = event.locals;

	if (!user || !membership) {
		error(401, 'You must be logged in as a site member to delete assets.');
	}

	if (!site) {
		error(400, 'No site context.');
	}

	const url = new URL(event.request.url);
	const assetId = url.searchParams.get('id');

	if (!assetId) {
		error(400, 'Missing asset "id" query parameter.');
	}

	// Find the asset record (scoped to the current site)
	const [record] = await db
		.select()
		.from(assets)
		.where(and(eq(assets.id, assetId), eq(assets.siteId, site.id)))
		.limit(1);

	if (!record) {
		error(404, 'Asset not found.');
	}

	// Delete from CDN
	try {
		await deleteFromCdn(record.cdnKey);
	} catch (err) {
		const message = err instanceof Error ? err.message : 'CDN delete failed.';
		error(503, message);
	}

	// Delete from database
	await db.delete(assets).where(eq(assets.id, assetId));

	return json({ success: true });
};
