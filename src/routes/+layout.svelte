<script lang="ts">
	import { onMount } from 'svelte';
	import { authClient } from '$lib/client/auth';
	import { goto } from '$app/navigation';
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();

	let user = $state<{ id: string; name: string; email: string; image?: string | null } | null>(null);

	onMount(async () => {
		const { data: session } = await authClient.getSession();
		user = session?.user ?? null;
	});

	async function handleLogout() {
		await authClient.signOut();
		user = null;
		goto('/');
	}
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<nav class="flex items-center justify-between border-b border-gray-200 px-6 py-3">
	<a href="/" class="text-lg font-bold">The Collective Hub</a>
	<div class="flex items-center gap-4">
		<a href="/admin" class="text-sm font-medium hover:underline">Admin</a>
		{#if user}
			<button onclick={handleLogout} class="cursor-pointer text-sm font-medium hover:underline">
				Logout
			</button>
		{:else}
			<a href="/login" class="text-sm font-medium hover:underline">Login</a>
		{/if}
	</div>
</nav>

{@render children()}
