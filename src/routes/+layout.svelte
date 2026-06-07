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

	// Build CSS variable string from active theme colors — overrides baseline default-dark.css
	let themeCss = $derived(
		theme
			? `:root { ${Object.entries(theme.colors)
					.map(([key, val]) => `--theme-${key}: ${val};`)
					.join(' ')} }`
			: ''
	);

	async function handleLogout() {
		await authClient.signOut();
		goto('/');
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	{#if themeCss}
		<style>{themeCss}</style>
	{/if}
</svelte:head>

<!-- Header / Nav -->
<nav
	class="sticky top-0 z-50 flex items-center justify-between border-b border-border bg-header-bg px-6 py-3 text-header-text backdrop-blur-md"
>
	<a href="/" class="text-lg font-bold tracking-tight">{siteName}</a>
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
				<span class="text-sm font-medium">{user?.name || 'User'}</span>
			</div>
			{#if isAuthorized}
				<a href="/admin" class="text-sm font-medium transition">
					Admin
				</a>
			{/if}
			<button
				onclick={handleLogout}
				class="cursor-pointer text-sm font-medium transition"
			>
				Logout
			</button>
		{:else}
			<a href="/login" class="text-sm font-medium transition">
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
<footer class="bg-footer-bg text-footer-text">
	<div class="mx-auto flex max-w-5xl flex-col items-center gap-2 px-6 py-8 text-center text-sm sm:flex-row sm:justify-between">
		<span class="font-medium">{siteName}</span>
		<span>Built with SvelteKit + Better Auth</span>
	</div>
	<div class="border-t border-border px-6 py-3 text-center text-xs">
		{footerText}
	</div>
</footer>
