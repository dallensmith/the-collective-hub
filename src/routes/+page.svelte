<script lang="ts">
	import { page } from '$app/stores';

	let isAuthorized = $derived($page.data.isAuthorized as boolean);
</script>

<section class="mx-auto flex min-h-[80vh] max-w-2xl flex-col items-center justify-center px-4 text-center">
	<h1 class="mb-4 text-5xl font-bold tracking-tight">The Collective Hub</h1>
	<p class="mb-8 text-lg text-gray-600">Your community hub for screenings and events</p>
	<div class="flex gap-4">
		{#if isAuthorized}
			<a
				href="/admin"
				class="rounded-lg bg-black px-6 py-3 text-sm font-medium text-white hover:bg-gray-800"
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
