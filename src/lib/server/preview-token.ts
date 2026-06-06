import { createHmac, timingSafeEqual } from 'node:crypto';
import { env } from '$env/dynamic/private';

/**
 * HMAC-signed preview token utility for preview mode.
 *
 * Token format: base64url(payload) + "." + base64url(HMAC-SHA256(payload, secret))
 *
 * The token encodes { siteId, userId, exp } and is stored in an httpOnly cookie
 * named `ct_preview`. The signature prevents forgery; expiry prevents indefinite use.
 */

interface PreviewTokenPayload {
	siteId: string;
	userId: string;
	exp: number; // Unix timestamp (seconds)
}

const TOKEN_EXPIRY_SECONDS = 3600; // 1 hour

/**
 * Get the secret used to sign preview tokens.
 * Uses BETTER_AUTH_SECRET (already required for auth) directly.
 */
function getPreviewSecret(): string {
	const secret = (env as Record<string, string | undefined>)['BETTER_AUTH_SECRET'];
	if (!secret) {
		throw new Error('BETTER_AUTH_SECRET is required for preview token signing.');
	}
	return secret;
}

/**
 * Generate a signed preview token for the given site and user.
 * Token expires after TOKEN_EXPIRY_SECONDS (1 hour).
 */
export function generatePreviewToken(siteId: string, userId: string): string {
	const secret = getPreviewSecret();

	const payload: PreviewTokenPayload = {
		siteId,
		userId,
		exp: Math.floor(Date.now() / 1000) + TOKEN_EXPIRY_SECONDS
	};

	const payloadJson = JSON.stringify(payload);
	const payloadB64 = Buffer.from(payloadJson, 'utf-8').toString('base64url');

	const hmac = createHmac('sha256', secret);
	hmac.update(payloadB64);
	const signature = hmac.digest('base64url');

	return `${payloadB64}.${signature}`;
}

/**
 * Verify and decode a preview token.
 * Returns the payload if the signature is valid and the token hasn't expired.
 * Returns null if the token is invalid, expired, or tampered with.
 */
export function verifyPreviewToken(token: string): PreviewTokenPayload | null {
	try {
		const secret = getPreviewSecret();
		const dotIndex = token.lastIndexOf('.');

		if (dotIndex === -1) return null;

		const payloadB64 = token.slice(0, dotIndex);
		const providedSignature = token.slice(dotIndex + 1);

		// Recompute the expected signature
		const hmac = createHmac('sha256', secret);
		hmac.update(payloadB64);
		const expectedSignature = hmac.digest('base64url');

		// Constant-time comparison to prevent timing attacks
		const providedBuf = Buffer.from(providedSignature, 'utf-8');
		const expectedBuf = Buffer.from(expectedSignature, 'utf-8');

		if (providedBuf.length !== expectedBuf.length) return null;
		if (!timingSafeEqual(providedBuf, expectedBuf)) return null;

		// Decode the payload
		const payloadJson = Buffer.from(payloadB64, 'base64url').toString('utf-8');
		const payload = JSON.parse(payloadJson) as PreviewTokenPayload;

		// Validate structure
		if (!payload.siteId || !payload.userId || typeof payload.exp !== 'number') {
			return null;
		}

		// Check expiry
		if (payload.exp < Math.floor(Date.now() / 1000)) {
			return null;
		}

		return payload;
	} catch {
		return null;
	}
}
