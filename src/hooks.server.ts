import type { Handle } from '@sveltejs/kit';
import { building } from '$app/environment';
import { auth } from '$lib/server/auth';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { db } from '$lib/server/db';
import { account, user } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';

const handleBetterAuth: Handle = async ({ event, resolve }) => {
	const session = await auth.api.getSession({ headers: event.request.headers });

	if (session?.user) {
		// The session user from Better Auth's getSession() may have custom fields
		// (like discordId) at runtime but the base User type doesn't include them.
		const sessionUser = session.user as typeof session.user & { discordId?: string };

		// Sync discordId from the account table if not already set on the user
		if (!sessionUser.discordId) {
			try {
				const [discordAccount] = await db
					.select()
					.from(account)
					.where(
						and(
							eq(account.userId, sessionUser.id),
							eq(account.providerId, 'discord')
						)
					)
					.limit(1);

				if (discordAccount?.accountId) {
					await db
						.update(user)
						.set({ discordId: discordAccount.accountId })
						.where(eq(user.id, sessionUser.id));

					// Update the in-memory user object for this request
					sessionUser.discordId = discordAccount.accountId;
				}
			} catch (err) {
				console.error('Failed to sync discordId:', err);
			}
		}

		event.locals.session = session.session;
		event.locals.user = sessionUser;
	}

	return svelteKitHandler({ event, resolve, auth, building });
};

export const handle: Handle = handleBetterAuth;
