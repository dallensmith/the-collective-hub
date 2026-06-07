<script lang="ts">
	import { authClient } from '$lib/client/auth';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();

	let isAuthenticated = $derived($page.data.isAuthenticated as boolean);
	let isAuthorized = $derived($page.data.isAuthorized as boolean);
	let settings = $derived($page.data.settings);
	let theme = $derived($page.data.theme);
	let user = $derived($page.data.user);
	let siteName = $derived(settings?.siteName ?? 'My Community Hub');
	let footerText = $derived(settings?.footerText ?? '© 2026 My Community Hub. All rights reserved.');
	let themeColors = $derived(theme?.colors ?? null);

	async function handleLogout() {
		await authClient.signOut();
		goto('/');
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	{#if themeColors}
		<style>
			:root {
				--color-primary: {themeColors.primary};
				--color-primary-hover: {themeColors['primary-hover']};
				--color-bg: {themeColors.bg};
				--color-surface: {themeColors.surface};
				--color-text: {themeColors.text};
				--color-text-secondary: {themeColors['text-secondary']};
				--color-header-bg: {themeColors['header-bg']};
				--color-header-text: {themeColors['header-text']};
				--color-footer-bg: {themeColors['footer-bg']};
				--color-footer-text: {themeColors['footer-text']};
				--color-hero-bg: {themeColors['hero-bg']};
				--color-hero-bg-end: {themeColors['hero-bg-end']};
				--color-hero-text: {themeColors['hero-text']};
				--color-cta-bg: {themeColors['cta-bg']};
				--color-cta-text: {themeColors['cta-text']};
				--color-border: {themeColors.border};
			}
		</style>
	{/if}
</svelte:head>

<!-- Header / Nav -->
<nav
	class="sticky top-0 z-50 flex items-center justify-between border-b px-6 py-3 backdrop-blur-md"
	style="background: var(--color-header-bg); border-color: var(--color-border); color: var(--color-header-text)"
>
	<a href="/" class="text-lg font-bold tracking-tight" style="color: var(--color-header-text)">{siteName}</a>
	<div class="flex items-center gap-4">
		{#if isAuthenticated}
			<div class="flex items-center gap-3">
				{#if user?.image}
					<img
						src={user.image}
						alt={user.name || 'Avatar'}
						class="h-8 w-8 rounded-full"
					/>
				{/if}
				<span class="text-sm font-medium" style="color: var(--color-header-text)">{user?.name || 'User'}</span>
			</div>
			{#if isAuthorized}
				<a href="/admin" class="text-sm font-medium transition" style="color: var(--color-header-text)">
					Admin
				</a>
			{/if}
			<button
				onclick={handleLogout}
				class="cursor-pointer text-sm font-medium transition" style="color: var(--color-header-text)"
			>
				Logout
			</button>
		{:else}
			<a href="/login" class="text-sm font-medium transition" style="color: var(--color-header-text)">
				Login
			</a>
		{/if}
	</div>
</nav>

<!-- Main content -->
<main>
	{@render children()}
</main>

<!-- Footer -->
<footer style="background: var(--color-footer-bg); border-color: var(--color-border)">
	<div class="mx-auto flex max-w-5xl flex-col items-center gap-2 px-6 py-8 text-center text-sm sm:flex-row sm:justify-between" style="color: var(--color-footer-text)">
		<span class="font-medium" style="color: var(--color-footer-text)">{siteName}</span>
		<span>Built with SvelteKit + Better Auth</span>
	</div>
	<div class="border-t px-6 py-3 text-center text-xs" style="border-color: var(--color-border); color: var(--color-footer-text)">
		{footerText}
	</div>
</footer>
