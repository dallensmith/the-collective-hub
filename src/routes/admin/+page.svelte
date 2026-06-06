<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Admin Dashboard — {data.site?.name ?? 'The Collective Hub'}</title>
</svelte:head>

<h2>Admin Dashboard</h2>
<p>Welcome, {data.user?.discordUsername}! Your role is <strong>{data.membership?.role}</strong>.</p>
<p>This is a placeholder — full admin pages will be added in upcoming steps.</p>
