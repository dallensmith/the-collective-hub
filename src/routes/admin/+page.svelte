<script lang="ts">
	import { authClient } from '$lib/client/auth';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	let user = $derived($page.data.user);

	async function handleLogout() {
		await authClient.signOut();
		goto('/');
	}
</script>

<section>
	<h1 class="mb-1 text-3xl font-bold">Welcome, {user?.name ?? 'User'}!</h1>
	<p class="mb-8 text-gray-600">Admin Dashboard</p>

	<div class="grid gap-6 md:grid-cols-2">
		<div class="rounded-xl border-2 border-dashed border-gray-300 p-6">
			<h2 class="mb-2 text-lg font-semibold">Site Settings</h2>
			<p class="text-sm text-gray-500">Coming soon</p>
		</div>
		<div class="rounded-xl border-2 border-dashed border-gray-300 p-6">
			<h2 class="mb-2 text-lg font-semibold">Events</h2>
			<p class="text-sm text-gray-500">Coming soon</p>
		</div>
	</div>

	<div class="mt-8">
		<button
			onclick={handleLogout}
			class="rounded-lg border border-gray-300 px-6 py-2 text-sm font-medium hover:bg-gray-50"
		>
			Logout
		</button>
	</div>
</section>
