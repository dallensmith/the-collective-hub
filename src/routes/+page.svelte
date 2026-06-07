<script lang="ts">
	import { authClient } from '$lib/client/auth';
	import { onMount } from 'svelte';

	let user = $state<{ id: string; name: string; email: string; image?: string | null } | null>(null);

	onMount(async () => {
		const { data: session } = await authClient.getSession();
		user = session?.user ?? null;
	});
</script>

<section class="mx-auto flex min-h-[80vh] max-w-2xl flex-col items-center justify-center px-4 text-center">
	<h1 class="mb-4 text-5xl font-bold tracking-tight">The Collective Hub</h1>
	<p class="mb-8 text-lg text-gray-600">Your community hub for screenings and events</p>
	<div class="flex gap-4">
		<a
			href="/admin"
			class="rounded-lg bg-black px-6 py-3 text-sm font-medium text-white hover:bg-gray-800"
		>
			View Admin
		</a>
		{#if user}
			<a
				href="/admin"
				class="rounded-lg border border-gray-300 px-6 py-3 text-sm font-medium hover:bg-gray-50"
			>
				Dashboard
			</a>
		{:else}
			<a
				href="/login"
				class="rounded-lg border border-gray-300 px-6 py-3 text-sm font-medium hover:bg-gray-50"
			>
				Login
			</a>
		{/if}
	</div>
</section>
