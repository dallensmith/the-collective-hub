<script lang="ts">
	import type { PageData } from './$types';
	import { env } from '$env/dynamic/public';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Admin Dashboard — {data.site?.name ?? 'The Collective Hub'}</title>
</svelte:head>

<h2>Admin Dashboard</h2>

<p class="welcome-text">Welcome, <strong>{data.user?.discordUsername}</strong>! Your role is <strong>{data.membership?.role ?? 'Super Admin'}</strong>.</p>

{#if env.PUBLIC_SITE_URL}
	<p class="site-url-info">
		🌐 Your site is live at <a href={env.PUBLIC_SITE_URL} target="_blank" rel="noopener noreferrer">{env.PUBLIC_SITE_URL}</a>
	</p>
{/if}

<div class="quick-actions">
	<h3>Quick Actions</h3>
	<div class="quick-actions-grid">
		<a href="/admin/branding" class="quick-action-card">
			<span class="quick-action-icon">🎨</span>
			<span class="quick-action-label">Edit Branding</span>
			<span class="quick-action-desc">Customize your site's name, logo, and theme</span>
		</a>
		<a href="/admin/assets" class="quick-action-card">
			<span class="quick-action-icon">📁</span>
			<span class="quick-action-label">Manage Assets</span>
			<span class="quick-action-desc">Upload and manage images, files, and media</span>
		</a>
		<a href="/admin/settings" class="quick-action-card">
			<span class="quick-action-icon">⚙️</span>
			<span class="quick-action-label">Site Settings</span>
			<span class="quick-action-desc">Configure site-wide preferences and options</span>
		</a>
	</div>
</div>

<style>
	.welcome-text {
		font-size: 1rem;
		color: var(--color-text-secondary, #555);
		margin-bottom: 1rem;
	}

	.site-url-info {
		font-size: 0.9rem;
		margin-bottom: 2rem;
		padding: 0.625rem 1rem;
		background: var(--color-card-background, rgba(0,0,0,0.03));
		border: 1px solid var(--color-border, rgba(0,0,0,0.08));
		border-radius: 0.5rem;
	}

	.site-url-info a {
		color: var(--color-accent, #58a6ff);
		text-decoration: none;
		font-weight: 500;
	}

	.site-url-info a:hover {
		text-decoration: underline;
	}

	.quick-actions {
		margin-top: 1.5rem;
	}

	.quick-actions h3 {
		font-size: 1.1rem;
		font-weight: 600;
		margin-bottom: 0.75rem;
	}

	.quick-actions-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
		gap: 0.875rem;
	}

	.quick-action-card {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		padding: 1.125rem;
		background: var(--color-card-background, rgba(0,0,0,0.03));
		border: 1px solid var(--color-border, rgba(0,0,0,0.08));
		border-radius: 0.5rem;
		text-decoration: none;
		color: var(--color-text, inherit);
		transition: border-color 0.15s, background 0.15s;
	}

	.quick-action-card:hover {
		border-color: var(--color-accent, #58a6ff);
		background: var(--color-card-background, rgba(0,0,0,0.05));
	}

	.quick-action-icon {
		font-size: 1.4rem;
	}

	.quick-action-label {
		font-weight: 600;
		font-size: 0.95rem;
	}

	.quick-action-desc {
		font-size: 0.8rem;
		color: var(--color-text-secondary, #888);
		line-height: 1.35;
	}
</style>
