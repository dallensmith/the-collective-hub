import { env } from '$env/dynamic/private';
import sharp from 'sharp';
import { randomUUID } from 'crypto';

// ─── Bunny CDN Configuration ─────────────────────────────────────────────────

interface CdnConfig {
	baseUrl: string;
	storageEndpoint: string;
	accessKey: string;
	bucket: string;
}

/**
 * Resolve CDN configuration from environment variables.
 * Returns null if any required variable is missing — does NOT throw at import time.
 */
function getConfig(): CdnConfig | null {
	const baseUrl = env.CDN_BASE_URL;
	const storageEndpoint = env.CDN_STORAGE_ENDPOINT;
	const accessKey = env.CDN_ACCESS_KEY;
	const bucket = env.CDN_BUCKET;

	if (!baseUrl || !storageEndpoint || !accessKey || !bucket) {
		return null;
	}

	return { baseUrl, storageEndpoint, accessKey, bucket };
}

/**
 * Require CDN configuration or throw with a descriptive message.
 * Used by mutation operations (upload, delete) where CDN is mandatory.
 */
function requireConfig(): CdnConfig {
	const config = getConfig();
	if (!config) {
		const missing: string[] = [];
		if (!env.CDN_BASE_URL) missing.push('CDN_BASE_URL');
		if (!env.CDN_STORAGE_ENDPOINT) missing.push('CDN_STORAGE_ENDPOINT');
		if (!env.CDN_ACCESS_KEY) missing.push('CDN_ACCESS_KEY');
		if (!env.CDN_BUCKET) missing.push('CDN_BUCKET');
		throw new Error(
			`CDN is not configured. Missing environment variables: ${missing.join(', ')}. ` +
			'Set them in your .env file or disable CDN-dependent features.'
		);
	}
	return config;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CdnUploadResult {
	cdnKey: string;
	cdnUrl: string;
	width: number;
	height: number;
	size: number;
	mimeType: string;
}

// ─── Key Generation ───────────────────────────────────────────────────────────

/**
 * Generate a CDN storage key for a new upload.
 * Format: sites/{siteSlug}/{type}/{uuid}.webp
 */
export function generateCdnKey(siteSlug: string, type: string): string {
	const id = randomUUID();
	return `sites/${siteSlug}/${type}/${id}.webp`;
}

// ─── Public URL ───────────────────────────────────────────────────────────────

/**
 * Build the public CDN URL for a stored file.
 * Returns an empty string if CDN is not configured.
 */
export function getCdnUrl(cdnKey: string): string {
	const config = getConfig();
	if (!config) return '';
	const normalizedBase = config.baseUrl.replace(/\/+$/, '');
	const normalizedKey = cdnKey.replace(/^\/+/, '');
	return `${normalizedBase}/${normalizedKey}`;
}

// ─── WebP Conversion ──────────────────────────────────────────────────────────

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

/**
 * Validate and convert an uploaded image buffer to webp.
 * Returns the webp buffer and image metadata.
 */
export async function convertToWebP(
	buffer: Buffer,
	originalMimeType: string
): Promise<{ webpBuffer: Buffer; width: number; height: number }> {
	if (!ALLOWED_TYPES.includes(originalMimeType)) {
		throw new Error(
			`Unsupported file type: ${originalMimeType}. Allowed: PNG, JPEG, WebP.`
		);
	}

	if (buffer.length > MAX_SIZE) {
		const sizeMB = (buffer.length / (1024 * 1024)).toFixed(1);
		throw new Error(`File too large: ${sizeMB}MB. Maximum size is 5MB.`);
	}

	const image = sharp(buffer);
	const metadata = await image.metadata();

	if (!metadata.width || !metadata.height) {
		throw new Error('Could not read image dimensions.');
	}

	const webpBuffer = await image.webp({ quality: 82 }).toBuffer();

	return {
		webpBuffer,
		width: metadata.width,
		height: metadata.height
	};
}

// ─── Upload ───────────────────────────────────────────────────────────────────

/**
 * Upload a buffer to Bunny CDN storage.
 * Returns the CDN key and public URL.
 */
export async function uploadToCdn(
	buffer: Buffer,
	siteSlug: string,
	type: string,
	originalMimeType: string
): Promise<CdnUploadResult> {
	const { storageEndpoint, accessKey, bucket } = requireConfig();

	// Convert to webp
	const { webpBuffer, width, height } = await convertToWebP(buffer, originalMimeType);

	// Generate key and upload
	const cdnKey = generateCdnKey(siteSlug, type);
	const normalizedEndpoint = storageEndpoint.replace(/\/+$/, '');
	const normalizedBucket = bucket.replace(/^\/+/, '');
	const uploadUrl = `${normalizedEndpoint}/${normalizedBucket}/${cdnKey}`;

	const response = await fetch(uploadUrl, {
		method: 'PUT',
		headers: {
			AccessKey: accessKey,
			'Content-Type': 'image/webp'
		},
		body: new Uint8Array(webpBuffer)
	});

	if (!response.ok) {
		const text = await response.text().catch(() => 'Unknown error');
		throw new Error(`CDN upload failed (${response.status}): ${text}`);
	}

	const cdnUrl = getCdnUrl(cdnKey);

	return {
		cdnKey,
		cdnUrl,
		width,
		height,
		size: webpBuffer.length,
		mimeType: 'image/webp'
	};
}

// ─── Delete ───────────────────────────────────────────────────────────────────

/**
 * Delete a file from Bunny CDN storage.
 */
export async function deleteFromCdn(cdnKey: string): Promise<void> {
	const { storageEndpoint, accessKey, bucket } = requireConfig();

	const normalizedEndpoint = storageEndpoint.replace(/\/+$/, '');
	const normalizedBucket = bucket.replace(/^\/+/, '');
	const deleteUrl = `${normalizedEndpoint}/${normalizedBucket}/${cdnKey}`;

	const response = await fetch(deleteUrl, {
		method: 'DELETE',
		headers: {
			AccessKey: accessKey
		}
	});

	if (!response.ok) {
		const text = await response.text().catch(() => 'Unknown error');
		throw new Error(`CDN delete failed (${response.status}): ${text}`);
	}
}

// ─── Sanity Check ─────────────────────────────────────────────────────────────

/**
 * Verify CDN connectivity at startup (optional).
 * Returns true if the CDN endpoint is reachable.
 */
export async function checkCdnConnectivity(): Promise<boolean> {
	try {
		const config = getConfig();
		if (!config) return false;
		const { storageEndpoint, accessKey } = config;
		// Simple HEAD or GET to the storage root to verify credentials
		const response = await fetch(storageEndpoint.replace(/\/+$/, ''), {
			method: 'GET',
			headers: { AccessKey: accessKey }
		});
		return response.ok || response.status === 404; // 404 means endpoint reachable, just no file
	} catch {
		return false;
	}
}
