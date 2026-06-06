<script lang="ts">
	import type { PageData } from './$types';
	import { page } from '$app/stores';
	import { createAuthClient } from 'better-auth/svelte';

	let { data }: { data: PageData } = $props();

	const authClient = createAuthClient();

	const siteName = $derived(data.site?.name ?? 'The Collective Hub');
	const errorMessage = $derived($page.url.searchParams.get('error'));

	/** Whether we are currently redirecting to Discord */
	let loggingIn = $state(false);

	async function handleDiscordLogin() {
		loggingIn = true;
		await authClient.signIn.social({
			provider: 'discord',
			callbackURL: '/'
		});
	}
</script>

<svelte:head>
	<title>Login — {siteName}</title>
</svelte:head>

<div class="login-container">
	<h1>Login</h1>
	<p>Sign in to manage {siteName}</p>

	{#if errorMessage}
		<div class="error-banner" role="alert">
			<span class="error-icon">⚠</span>
			<span class="error-text">{errorMessage}</span>
		</div>
	{/if}

	<button class="discord-btn" onclick={handleDiscordLogin} disabled={loggingIn}>
		{#if loggingIn}
			<span class="spinner"></span>
			Redirecting to Discord…
		{:else}
			<svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 127.14 96.36"
				width="24"
				height="24"
				fill="currentColor"
			>
				<path
					d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z"
				/>
			</svg>
			Login with Discord
		{/if}
	</button>

	<p class="help-text">
		You must be an approved member of this site to access the admin panel.
	</p>
</div>

<style>
	.login-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 60vh;
		text-align: center;
		padding: 2rem;
		font-family: system-ui, sans-serif;
	}

	h1 {
		font-size: 2rem;
		margin-bottom: 0.5rem;
	}

	p {
		color: #888;
		margin-bottom: 1.5rem;
		max-width: 400px;
	}

	.discord-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.875rem 2rem;
		background: #5865f2;
		color: white;
		border: none;
		border-radius: 0.5rem;
		font-size: 1.1rem;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.2s;
	}

	.discord-btn:hover:not(:disabled) {
		background: #4752c4;
	}

	.discord-btn:active:not(:disabled) {
		background: #3c45a5;
	}

	.discord-btn:disabled {
		opacity: 0.7;
		cursor: wait;
	}

	/* Simple CSS spinner */
	.spinner {
		display: inline-block;
		width: 18px;
		height: 18px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top-color: #fff;
		border-radius: 50%;
		animation: spin 0.6s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.error-banner {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		padding: 0.75rem 1.25rem;
		margin-bottom: 1.25rem;
		background: #fef2f2;
		border: 1px solid #fecaca;
		border-radius: 0.5rem;
		color: #991b1b;
		font-size: 0.9rem;
		max-width: 420px;
		width: 100%;
		box-sizing: border-box;
	}

	.error-icon {
		flex-shrink: 0;
		font-size: 1.1rem;
	}

	.error-text {
		text-align: left;
		line-height: 1.4;
	}

	.help-text {
		font-size: 0.85rem;
		color: #666;
		margin-top: 2rem;
	}
</style>
