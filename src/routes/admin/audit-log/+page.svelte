<script lang="ts">
	import type { PageData } from './$types';
	import { page } from '$app/stores';

	let { data }: { data: PageData } = $props();

	/** Current filter value derived from data */
	let currentFilter = $derived(data.currentFilter ?? '');

	/** Entity type filter options */
	const entityTypes = [
		{ value: '', label: 'All Types' },
		{ value: 'event', label: 'Event' },
		{ value: 'asset', label: 'Asset' },
		{ value: 'link', label: 'Link' },
		{ value: 'branding', label: 'Branding' },
		{ value: 'homepage', label: 'Homepage' },
		{ value: 'settings', label: 'Settings' },
		{ value: 'team', label: 'Team' }
	];

	/** Navigate with a new filter value */
	function applyFilter(value: string) {
		const url = new URL($page.url);
		if (value) {
			url.searchParams.set('filter', value);
		} else {
			url.searchParams.delete('filter');
		}
		window.location.href = url.toString();
	}

	/** Format a timestamp for display */
	function formatTimestamp(isoStr: string): string {
		const d = new Date(isoStr);
		return d.toLocaleString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			hour: 'numeric',
			minute: '2-digit',
			hour12: true
		});
	}

	/** Get CSS class for action badge */
	function actionBadgeClass(action: string): string {
		if (action === 'create') return 'badge badge--create';
		if (action === 'delete') return 'badge badge--delete';
		return 'badge badge--update';
	}

	/** Format entity type for display */
	function entityTypeLabel(type: string): string {
		return type.charAt(0).toUpperCase() + type.slice(1);
	}

	/** Try to parse and pretty-print details JSON */
	function formatDetails(details: string | null): string {
		if (!details) return '—';
		try {
			const obj = JSON.parse(details);
			return Object.entries(obj)
				.map(([k, v]) => `${k}: ${v}`)
				.join(', ');
		} catch {
			return details;
		}
	}
</script>

<svelte:head>
	<title>Audit Log — Admin</title>
</svelte:head>

<div class="audit-log-page">
	<div class="page-header">
		<h1 class="page-title">Audit Log</h1>
		<p class="page-subtitle">Track who changed what and when across your site.</p>
	</div>

	<!-- Filter Bar -->
	<div class="filter-bar">
		<label class="filter-label" for="entity-filter">Filter by entity:</label>
		<select
			id="entity-filter"
			class="filter-select"
			value={currentFilter}
			onchange={(e) => applyFilter((e.target as HTMLSelectElement).value)}
		>
			{#each entityTypes as et}
				<option value={et.value}>{et.label}</option>
			{/each}
		</select>
		<span class="filter-count">{data.entries.length} entr{data.entries.length === 1 ? 'y' : 'ies'}</span>
	</div>

	<!-- Audit Log Table -->
	{#if data.entries.length === 0}
		<div class="empty-state">
			<p>No audit log entries found{currentFilter ? ` for "${entityTypeLabel(currentFilter)}"` : ''}.</p>
		</div>
	{:else}
		<div class="table-wrapper">
			<table class="audit-table">
				<thead>
					<tr>
						<th>Timestamp</th>
						<th>User</th>
						<th>Action</th>
						<th>Entity Type</th>
						<th>Entity ID</th>
						<th>Details</th>
					</tr>
				</thead>
				<tbody>
					{#each data.entries as entry}
						<tr>
							<td class="cell-timestamp">{formatTimestamp(entry.createdAt)}</td>
							<td class="cell-user">
								<span class="user-identifier">{entry.userEmail ?? entry.userId}</span>
							</td>
							<td>
								<span class={actionBadgeClass(entry.action)}>{entry.action}</span>
							</td>
							<td>
								<span class="entity-type">{entityTypeLabel(entry.entityType)}</span>
							</td>
							<td class="cell-id">
								{#if entry.entityId}
									<code class="id-code">{entry.entityId.slice(0, 8)}…</code>
								{:else}
									<span class="text-muted">—</span>
								{/if}
							</td>
							<td class="cell-details">{formatDetails(entry.details)}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>

<style>
	/* ── Page Layout ─────────────────────────────────────────────── */
	.audit-log-page {
		max-width: 100%;
	}

	.page-header {
		margin-bottom: 1.5rem;
	}

	.page-title {
		font-size: 1.5rem;
		font-weight: 700;
		color: #1a1a2e;
		margin: 0 0 0.25rem;
	}

	.page-subtitle {
		font-size: 0.875rem;
		color: #888;
		margin: 0;
	}

	/* ── Filter Bar ──────────────────────────────────────────────── */
	.filter-bar {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 1.25rem;
		padding: 0.75rem 1rem;
		background: #fff;
		border: 1px solid #e0e0e6;
		border-radius: 8px;
	}

	.filter-label {
		font-size: 0.85rem;
		font-weight: 600;
		color: #555;
		white-space: nowrap;
	}

	.filter-select {
		padding: 0.4rem 0.75rem;
		font-size: 0.85rem;
		border: 1px solid #d0d0d6;
		border-radius: 5px;
		background: #fff;
		color: #1a1a2e;
		cursor: pointer;
		outline: none;
		min-width: 160px;
	}

	.filter-select:focus {
		border-color: #58a6ff;
		box-shadow: 0 0 0 2px rgba(88, 166, 255, 0.15);
	}

	.filter-count {
		font-size: 0.8rem;
		color: #999;
		margin-left: auto;
	}

	/* ── Empty State ─────────────────────────────────────────────── */
	.empty-state {
		padding: 2rem;
		background: #fff;
		border: 1px dashed #d0d0d6;
		border-radius: 8px;
		text-align: center;
	}

	.empty-state p {
		margin: 0;
		font-size: 0.875rem;
		color: #999;
	}

	/* ── Table ───────────────────────────────────────────────────── */
	.table-wrapper {
		background: #fff;
		border: 1px solid #e0e0e6;
		border-radius: 8px;
		overflow-x: auto;
	}

	.audit-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.85rem;
	}

	.audit-table thead {
		background: #f5f5f7;
		border-bottom: 1px solid #e0e0e6;
	}

	.audit-table th {
		padding: 0.65rem 0.9rem;
		text-align: left;
		font-weight: 600;
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: #888;
		white-space: nowrap;
	}

	.audit-table td {
		padding: 0.65rem 0.9rem;
		border-bottom: 1px solid #f0f0f3;
		color: #333;
		vertical-align: middle;
	}

	.audit-table tbody tr:last-child td {
		border-bottom: none;
	}

	.audit-table tbody tr:hover {
		background: #fafafc;
	}

	.cell-timestamp {
		white-space: nowrap;
		font-size: 0.8rem;
		color: #666;
	}

	.cell-user {
		white-space: nowrap;
	}

	.user-identifier {
		font-weight: 500;
		color: #1a1a2e;
	}

	.cell-id {
		font-size: 0.8rem;
	}

	.id-code {
		font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
		font-size: 0.75rem;
		background: #f0f0f3;
		padding: 0.1rem 0.35rem;
		border-radius: 3px;
		color: #555;
	}

	.cell-details {
		font-size: 0.8rem;
		color: #666;
		max-width: 280px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.text-muted {
		color: #bbb;
	}

	/* ── Entity Type Label ───────────────────────────────────────── */
	.entity-type {
		font-weight: 500;
		color: #444;
	}

	/* ── Action Badges ───────────────────────────────────────────── */
	.badge {
		display: inline-block;
		padding: 0.2rem 0.55rem;
		font-size: 0.7rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		border-radius: 4px;
		line-height: 1.3;
	}

	.badge--create {
		background: #d4edda;
		color: #155724;
	}

	.badge--update {
		background: #d1ecf1;
		color: #0c5460;
	}

	.badge--delete {
		background: #f8d7da;
		color: #721c24;
	}

	/* ── Responsive ──────────────────────────────────────────────── */
	@media (max-width: 768px) {
		.filter-bar {
			flex-wrap: wrap;
			gap: 0.5rem;
		}

		.filter-select {
			min-width: 0;
			flex: 1;
		}

		.filter-count {
			margin-left: 0;
		}

		.cell-details {
			max-width: 150px;
		}
	}
</style>
