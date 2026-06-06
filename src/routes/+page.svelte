<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

{#if data.site}
	<h1>{data.site.name}</h1>
{/if}

{#if data.siteSettings?.branding?.tagline}
	<p class="tagline">{data.siteSettings.branding.tagline}</p>
{/if}

{#if data.user}
	<p>Welcome, {data.user.discordUsername}!</p>
	{#if data.membership}
		<p>Role: {data.membership.role}</p>
		<a href="/admin">Admin Panel</a>
	{:else}
		<p>You are logged in but not a member of this site.</p>
	{/if}
	<a href="/api/auth/sign-out">Sign Out</a>
{:else}
	<p>Your site is running. <a href="/login">Login with Discord</a> to manage it.</p>
{/if}
