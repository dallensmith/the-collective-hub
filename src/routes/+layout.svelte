<script lang="ts">
	import { authClient } from '$lib/client/auth';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();

	let isAuthorized = $derived($page.data.isAuthorized as boolean);
	let settings = $derived($page.data.settings);
	let siteName = $derived(settings?.siteName ?? 'My Community Hub');
	let footerText = $derived(settings?.footerText ?? '© 2026 My Community Hub. All rights reserved.');

	async function handleLogout() {
		await authClient.signOut();
		goto('/');
	}
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<!-- Header / Nav -->
<nav
	class="sticky top-0 z-50 flex items-center justify-between border-b border-gray-200/80 bg-white/80 px-6 py-3 backdrop-blur-md"
>
	<a href="/" class="text-lg font-bold tracking-tight">{siteName}</a>
	<div class="flex items-center gap-4">
		{#if isAuthorized}
			<a href="/admin" class="text-sm font-medium text-gray-600 transition hover:text-gray-900">
				Admin
			</a>
			<button
				onclick={handleLogout}
				class="cursor-pointer text-sm font-medium text-gray-600 transition hover:text-gray-900"
			>
				Logout
			</button>
		{:else}
			<a href="/login" class="text-sm font-medium text-gray-600 transition hover:text-gray-900">
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
<footer class="border-t border-gray-200 bg-gray-50">
	<div class="mx-auto flex max-w-5xl flex-col items-center gap-2 px-6 py-8 text-center text-sm text-gray-500 sm:flex-row sm:justify-between">
		<span class="font-medium text-gray-700">{siteName}</span>
		<span>Built with SvelteKit + Better Auth</span>
	</div>
	<div class="border-t border-gray-200/60 px-6 py-3 text-center text-xs text-gray-400">
		{footerText}
	</div>
</footer>
