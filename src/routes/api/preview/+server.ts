import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { generatePreviewToken } from '$lib/server/preview-token';
import { dev } from '$app/environment';

/**
 * Preview cookie API endpoint.
 *
 * POST — Sets the `ct_preview` httpOnly cookie with a signed HMAC token.
 *        Requires the user to be authenticated and authorized for the current site.
 * DELETE — Clears the `ct_preview` cookie, ending preview mode.
 */

export const POST: RequestHandler = async (event) => {
	const { user, membership, site, isSuperAdmin } = event.locals;

	// Must be authenticated
	if (!user) {
		return json({ success: false, error: 'Authentication required.' }, { status: 401 });
	}

	// Must have site context
	if (!site) {
		return json({ success: false, error: 'No site context.' }, { status: 400 });
	}

	// Must be authorized: super admin OR site member with role owner/admin/editor
	const isAuthorized =
		isSuperAdmin ||
		(membership && ['owner', 'admin', 'editor'].includes(membership.role));

	if (!isAuthorized) {
		return json(
			{ success: false, error: 'You do not have permission to preview this site.' },
			{ status: 403 }
		);
	}

	try {
		const token = generatePreviewToken(site.id, user.id);

		event.cookies.set('ct_preview', token, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: !dev,
			maxAge: 3600 // 1 hour, matching token expiry
		});

		return json({ success: true });
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Failed to enable preview mode.';
		return json({ success: false, error: message }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async () => {
	// We can't read cookies in a DELETE handler directly through event.cookies.get,
	// but we can clear the cookie regardless — it's harmless if it doesn't exist.
	return json(
		{ success: true },
		{
			headers: {
				'Set-Cookie':
					'ct_preview=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0'
			}
		}
	);
};
