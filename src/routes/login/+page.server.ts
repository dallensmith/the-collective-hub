import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { auth } from '$lib/server/auth';

/**
 * Login page server load — redirects already-authenticated users to /admin.
 *
 * If the user has an active Better Auth session, they don't need to see
 * the login page. Redirect them to /admin where the admin auth guard
 * will handle membership checks and show "access denied" if needed.
 */
export const load: PageServerLoad = async (event) => {
	const session = await auth.api.getSession({
		headers: event.request.headers
	});

	if (session) {
		throw redirect(302, '/admin');
	}

	return {};
};
