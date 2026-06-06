<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { enhance } from '$app/forms';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	/** Current filter: 'all' | 'upcoming' | 'past' | 'drafts' */
	let activeFilter = $state<'all' | 'upcoming' | 'past' | 'drafts'>('all');

	/** Feedback message */
	let feedback = $state<{ type: 'success' | 'error'; message: string } | null>(null);

	/** Whether we're in the middle of a save operation */
	let saving = $state(false);

	// ─── Form state ────────────────────────────────────────────────────
	/** Show "Add Event" inline form? */
	let showAddForm = $state(false);
	/** ID of event being edited (null = not editing) */
	let editingId = $state<string | null>(null);
	/** ID of event being deleted (for confirmation) */
	let deletingId = $state<string | null>(null);

	// Handle form action feedback
	$effect(() => {
		if (form) {
			saving = false;
			if (form.success) {
				const actionLabel = getActionLabel(form.action as string);
				feedback = { type: 'success', message: `${actionLabel} saved.` };
				showAddForm = false;
				editingId = null;
				deletingId = null;
			} else if (form.error) {
				feedback = { type: 'error', message: form.error };
			}
		}
	});

	function getActionLabel(action: string | undefined): string {
		if (!action) return 'Event';
		if (action === 'create') return 'Event created';
		if (action === 'update') return 'Event updated';
		if (action === 'delete') return 'Event deleted';
		if (action === 'togglePublish') return 'Publish status toggled';
		return 'Event';
	}

	function handleEnhance() {
		saving = true;
		feedback = null;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		return ({ result }: any) => {
			saving = false;
			if (result.type === 'failure') {
				feedback = {
					type: 'error',
					message: (result.data?.error as string) ?? 'Failed to save.'
				};
			} else if (result.type === 'error') {
				feedback = {
					type: 'error',
					message: 'A network error occurred. Please try again.'
				};
			}
		};
	}

	function startEdit(id: string) {
		editingId = id;
		showAddForm = false;
	}

	function cancelEdit() {
		editingId = null;
	}

	// ─── Client-side filtering ──────────────────────────────────────────

	const now = new Date();

	function filteredEvents() {
		const all = data.events ?? [];
		switch (activeFilter) {
			case 'upcoming':
				return all.filter((e) => e.isPublished && new Date(e.startTime) >= now);
			case 'past':
				return all.filter((e) => e.isPublished && new Date(e.startTime) < now);
			case 'drafts':
				return all.filter((e) => !e.isPublished);
			default:
				return all;
		}
	}

	// ─── Helpers ────────────────────────────────────────────────────────

	/** Format an ISO date string for display in a table cell */
	function formatDate(isoStr: string): string {
		const d = new Date(isoStr);
		return d.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		});
	}

	/** Get badge class for event type */
	function eventTypeBadgeClass(type: string): string {
		const map: Record<string, string> = {
			screening: 'badge badge--screening',
			watch_party: 'badge badge--watch-party',
			meetup: 'badge badge--meetup',
			other: 'badge badge--other'
		};
		return map[type] ?? 'badge badge--other';
	}

	/** Human-readable event type label */
	function eventTypeLabel(type: string): string {
		const map: Record<string, string> = {
			screening: 'Screening',
			watch_party: 'Watch Party',
			meetup: 'Meetup',
			other: 'Other'
		};
		return map[type] ?? type;
	}

	/** Format ISO string for datetime-local input value */
	function toDatetimeLocal(isoStr: string | null | undefined): string {
		if (!isoStr) return '';
		const d = new Date(isoStr);
		if (isNaN(d.getTime())) return '';
		// Format as YYYY-MM-DDTHH:mm (local time)
		const pad = (n: number) => n.toString().padStart(2, '0');
		return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
	}

	/** Compute filter counts */
	function filterCounts() {
		const all = data.events ?? [];
		return {
			all: all.length,
			upcoming: all.filter((e) => e.isPublished && new Date(e.startTime) >= now).length,
			past: all.filter((e) => e.isPublished && new Date(e.startTime) < now).length,
			drafts: all.filter((e) => !e.isPublished).length
		};
	}
</script>

<svelte:head>
	<title>Events — Admin</title>
</svelte:head>

<div class="events-page">
	<h1 class="page-title">Events</h1>

	<!-- Discord Events Active Banner -->
	{#if data.discordEventsEnabled}
		<div class="discord-banner">
			<div class="discord-banner-icon">🎮</div>
			<div class="discord-banner-text">
				<strong>Events are managed in Discord.</strong>
				Your site is configured to pull scheduled events from Discord. Event creation, editing, and publishing happen in your Discord server.
				<a
					href="https://discord.com/events/{data.discordGuildId}"
					target="_blank"
					rel="noopener noreferrer"
					class="discord-banner-link"
				>
					View Events in Discord →
				</a>
			</div>
		</div>
	{:else}
		<p class="page-desc">Manage your site's event listings. Draft events are hidden from the public site.</p>
	{/if}

	<!-- Feedback message -->
	{#if feedback}
		<div
			class="feedback"
			class:feedback--success={feedback.type === 'success'}
			class:feedback--error={feedback.type === 'error'}
			role="alert"
		>
			{#if feedback.type === 'success'}✓{:else}⚠{/if}
			{feedback.message}
			<button class="feedback-close" onclick={() => (feedback = null)}>×</button>
		</div>
	{/if}

	<!-- Native Events UI — hidden when Discord events are active -->
	{#if !data.discordEventsEnabled}
	<!-- ═══════════════════════════════════════════════════════════ -->
	<!-- Filter Tabs -->
	<!-- ═══════════════════════════════════════════════════════════ -->
	<div class="tab-bar">
		<button
			class="tab-btn"
			class:tab-btn--active={activeFilter === 'all'}
			onclick={() => (activeFilter = 'all')}
		>
			All
			<span class="tab-count">{filterCounts().all}</span>
		</button>
		<button
			class="tab-btn"
			class:tab-btn--active={activeFilter === 'upcoming'}
			onclick={() => (activeFilter = 'upcoming')}
		>
			Upcoming
			<span class="tab-count">{filterCounts().upcoming}</span>
		</button>
		<button
			class="tab-btn"
			class:tab-btn--active={activeFilter === 'past'}
			onclick={() => (activeFilter = 'past')}
		>
			Past
			<span class="tab-count">{filterCounts().past}</span>
		</button>
		<button
			class="tab-btn"
			class:tab-btn--active={activeFilter === 'drafts'}
			onclick={() => (activeFilter = 'drafts')}
		>
			Drafts
			<span class="tab-count">{filterCounts().drafts}</span>
		</button>
	</div>

	<!-- ═══════════════════════════════════════════════════════════ -->
	<!-- Events List -->
	<!-- ═══════════════════════════════════════════════════════════ -->
	<div class="tab-content">
		<!-- Add Event Button -->
		{#if !showAddForm}
			<button class="add-btn" onclick={() => (showAddForm = true)} disabled={saving}>
				+ Add Event
			</button>
		{/if}

		<!-- Inline Add Form -->
		{#if showAddForm}
			<form
				method="POST"
				action="?/create"
				use:enhance={handleEnhance}
				class="inline-form"
			>
				<h3 class="inline-form-title">New Event</h3>
				<div class="inline-form-grid">
					<div class="form-group-sm form-group-sm--wide">
						<label for="evt-title" class="form-label-sm">Title *</label>
						<input
							type="text"
							id="evt-title"
							name="title"
							class="form-input-sm"
							required
							maxlength={200}
							placeholder="Movie Night"
						/>
					</div>
					<div class="form-group-sm">
						<label for="evt-type" class="form-label-sm">Event Type</label>
						<select id="evt-type" name="eventType" class="form-select-sm">
							<option value="screening">Screening</option>
							<option value="watch_party">Watch Party</option>
							<option value="meetup">Meetup</option>
							<option value="other">Other</option>
						</select>
					</div>
					<div class="form-group-sm">
						<label for="evt-start" class="form-label-sm">Start Time *</label>
						<input
							type="datetime-local"
							id="evt-start"
							name="startTime"
							class="form-input-sm"
							required
						/>
					</div>
					<div class="form-group-sm">
						<label for="evt-end" class="form-label-sm">End Time</label>
						<input
							type="datetime-local"
							id="evt-end"
							name="endTime"
							class="form-input-sm"
						/>
					</div>
					<div class="form-group-sm">
						<label for="evt-tz" class="form-label-sm">Timezone</label>
						<input
							type="text"
							id="evt-tz"
							name="timezone"
							class="form-input-sm"
							value="America/New_York"
							placeholder="America/New_York"
						/>
					</div>
					<div class="form-group-sm">
						<label for="evt-location" class="form-label-sm">Location</label>
						<input
							type="text"
							id="evt-location"
							name="location"
							class="form-input-sm"
							placeholder="Discord Stage"
						/>
					</div>
					<div class="form-group-sm">
						<label for="evt-link" class="form-label-sm">External Link</label>
						<input
							type="url"
							id="evt-link"
							name="externalLink"
							class="form-input-sm"
							placeholder="https://..."
						/>
					</div>
					<div class="form-group-sm">
						<label for="evt-img" class="form-label-sm">Image CDN Key</label>
						<input
							type="text"
							id="evt-img"
							name="imageCdnKey"
							class="form-input-sm"
							placeholder="optional"
						/>
					</div>
					<div class="form-group-sm">
						<label for="evt-desc" class="form-label-sm">Description</label>
						<textarea
							id="evt-desc"
							name="description"
							class="form-input-sm form-textarea-sm"
							rows="2"
							placeholder="Brief description..."
						></textarea>
					</div>
					<div class="form-group-sm checkbox-row">
						<label class="form-label-sm checkbox-label-sm">
							<input type="checkbox" name="isPublished" />
							<span>Published</span>
						</label>
					</div>
				</div>
				<p class="form-help-sm">
					Times are entered in your local timezone. They will be stored in UTC.
				</p>
				<div class="inline-form-actions">
					<button type="submit" class="save-btn-sm" disabled={saving}>
						{#if saving}<span class="spinner"></span>{/if}
						Add
					</button>
					<button type="button" class="cancel-btn-sm" onclick={() => (showAddForm = false)}>
						Cancel
					</button>
				</div>
			</form>
		{/if}

		<!-- Empty State -->
		{#if filteredEvents().length === 0 && !showAddForm}
			<div class="empty-state">
				<p>
					{#if activeFilter === 'all'}
						No events yet. Create your first event!
					{:else if activeFilter === 'upcoming'}
						No upcoming events.
					{:else if activeFilter === 'past'}
						No past events.
					{:else}
						No draft events.
					{/if}
				</p>
			</div>
		{:else}
			<div class="table-wrap">
				<table class="events-table">
					<thead>
						<tr>
							<th>Title</th>
							<th>Date/Time</th>
							<th>Type</th>
							<th>Status</th>
							<th>Actions</th>
						</tr>
					</thead>
					<tbody>
						{#each filteredEvents() as evt}
							{#if editingId === evt.id}
								<!-- ── Edit Row ────────────────────────── -->
								<tr class="edit-row">
									<td colspan="5">
										<form
											method="POST"
											action="?/update"
											use:enhance={handleEnhance}
											class="inline-form inline-form--edit"
										>
											<input type="hidden" name="id" value={evt.id} />
											<div class="inline-form-grid">
												<div class="form-group-sm form-group-sm--wide">
													<label class="form-label-sm" for="edit-title-{evt.id}">Title *</label>
													<input
														type="text"
														name="title"
														id="edit-title-{evt.id}"
														class="form-input-sm"
														required
														maxlength={200}
														value={evt.title}
													/>
												</div>
												<div class="form-group-sm">
													<label class="form-label-sm" for="edit-type-{evt.id}">Event Type</label>
													<select name="eventType" id="edit-type-{evt.id}" class="form-select-sm">
														<option value="screening" selected={evt.eventType === 'screening'}>Screening</option>
														<option value="watch_party" selected={evt.eventType === 'watch_party'}>Watch Party</option>
														<option value="meetup" selected={evt.eventType === 'meetup'}>Meetup</option>
														<option value="other" selected={evt.eventType === 'other'}>Other</option>
													</select>
												</div>
												<div class="form-group-sm">
													<label class="form-label-sm" for="edit-start-{evt.id}">Start Time *</label>
													<input
														type="datetime-local"
														name="startTime"
														id="edit-start-{evt.id}"
														class="form-input-sm"
														required
														value={toDatetimeLocal(evt.startTime)}
													/>
												</div>
												<div class="form-group-sm">
													<label class="form-label-sm" for="edit-end-{evt.id}">End Time</label>
													<input
														type="datetime-local"
														name="endTime"
														id="edit-end-{evt.id}"
														class="form-input-sm"
														value={toDatetimeLocal(evt.endTime)}
													/>
												</div>
												<div class="form-group-sm">
													<label class="form-label-sm" for="edit-tz-{evt.id}">Timezone</label>
													<input
														type="text"
														name="timezone"
														id="edit-tz-{evt.id}"
														class="form-input-sm"
														value={evt.timezone ?? 'America/New_York'}
													/>
												</div>
												<div class="form-group-sm">
													<label class="form-label-sm" for="edit-loc-{evt.id}">Location</label>
													<input
														type="text"
														name="location"
														id="edit-loc-{evt.id}"
														class="form-input-sm"
														value={evt.location ?? ''}
													/>
												</div>
												<div class="form-group-sm">
													<label class="form-label-sm" for="edit-link-{evt.id}">External Link</label>
													<input
														type="url"
														name="externalLink"
														id="edit-link-{evt.id}"
														class="form-input-sm"
														value={evt.externalLink ?? ''}
													/>
												</div>
												<div class="form-group-sm">
													<label class="form-label-sm" for="edit-img-{evt.id}">Image CDN Key</label>
													<input
														type="text"
														name="imageCdnKey"
														id="edit-img-{evt.id}"
														class="form-input-sm"
														value={evt.imageCdnKey ?? ''}
													/>
												</div>
												<div class="form-group-sm">
													<label class="form-label-sm" for="edit-desc-{evt.id}">Description</label>
													<textarea
														name="description"
														id="edit-desc-{evt.id}"
														class="form-input-sm form-textarea-sm"
														rows="2"
													>{evt.description ?? ''}</textarea>
												</div>
												<div class="form-group-sm checkbox-row">
													<label class="form-label-sm checkbox-label-sm">
														<input
															type="checkbox"
															name="isPublished"
															checked={evt.isPublished}
														/>
														<span>Published</span>
													</label>
												</div>
											</div>
											<div class="inline-form-actions">
												<button type="submit" class="save-btn-sm" disabled={saving}>
													{#if saving}<span class="spinner"></span>{/if}
													Save
												</button>
												<button type="button" class="cancel-btn-sm" onclick={cancelEdit}>
													Cancel
												</button>
											</div>
										</form>
									</td>
								</tr>
							{:else if deletingId === evt.id}
								<!-- ── Delete Confirmation ──────────────── -->
								<tr class="delete-row">
									<td colspan="5">
										<div class="delete-confirm">
											<span>Delete "{evt.title}"?</span>
											<form
												method="POST"
												action="?/delete"
												use:enhance={handleEnhance}
												class="delete-form-inline"
											>
												<input type="hidden" name="id" value={evt.id} />
												<button type="submit" class="btn-danger-sm" disabled={saving}>
													Sure?
												</button>
												<button
													type="button"
													class="cancel-btn-sm"
													onclick={() => (deletingId = null)}
												>
													Cancel
												</button>
											</form>
										</div>
									</td>
								</tr>
							{:else}
								<!-- ── Normal Row ───────────────────────── -->
								<tr>
									<td class="cell-title">{evt.title}</td>
									<td class="cell-date">{formatDate(evt.startTime)}</td>
									<td>
										<span class={eventTypeBadgeClass(evt.eventType)}>
											{eventTypeLabel(evt.eventType)}
										</span>
									</td>
									<td>
										{#if evt.isPublished}
											<span class="badge badge--published">Published</span>
										{:else}
											<span class="badge badge--draft">Draft</span>
										{/if}
									</td>
									<td class="cell-actions">
										<!-- Toggle Publish -->
										<form
											method="POST"
											action="?/togglePublish"
											use:enhance={handleEnhance}
											class="action-form-inline"
										>
											<input type="hidden" name="id" value={evt.id} />
											<button
												type="submit"
												class="action-btn"
												disabled={saving}
												title={evt.isPublished ? 'Unpublish' : 'Publish'}
											>
												{evt.isPublished ? '👁️' : '👁️‍🗨️'}
											</button>
										</form>
										<button
											class="action-btn"
											onclick={() => startEdit(evt.id)}
											disabled={saving}
											title="Edit"
										>
											✏️
										</button>
										<button
											class="action-btn action-btn--danger"
											onclick={() => (deletingId = evt.id)}
											disabled={saving}
											title="Delete"
										>
											🗑️
										</button>
									</td>
								</tr>
							{/if}
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
	{/if}
</div>

<style>
	.events-page {
		max-width: 900px;
	}

	.page-title {
		font-size: 1.5rem;
		font-weight: 700;
		margin: 0 0 0.25rem;
		color: #1a1a2e;
	}

	.page-desc {
		color: #666;
		margin: 0 0 1.5rem;
		font-size: 0.925rem;
	}

	/* ── Feedback ───────────────────────────────────────────────── */
	.feedback {
		padding: 0.7rem 1rem;
		border-radius: 6px;
		margin-bottom: 1.25rem;
		font-size: 0.875rem;
		font-weight: 500;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.feedback--success {
		background: #daf5e0;
		color: #1a6b30;
		border: 1px solid #a3d9b1;
	}

	.feedback--error {
		background: #fde8e8;
		color: #9b1c1c;
		border: 1px solid #f4b2b2;
	}

	.feedback-close {
		background: none;
		border: none;
		font-size: 1.25rem;
		cursor: pointer;
		color: inherit;
		opacity: 0.6;
		padding: 0 0.25rem;
		margin-left: auto;
	}

	.feedback-close:hover {
		opacity: 1;
	}

	/* ── Tab Bar ─────────────────────────────────────────────────── */
	.tab-bar {
		display: flex;
		gap: 0;
		border-bottom: 2px solid #e0e0e6;
		margin-bottom: 1.5rem;
	}

	.tab-btn {
		padding: 0.6rem 1.25rem;
		font-size: 0.9rem;
		font-weight: 500;
		color: #666;
		background: none;
		border: none;
		border-bottom: 2px solid transparent;
		margin-bottom: -2px;
		cursor: pointer;
		transition: color 0.15s, border-color 0.15s;
		display: flex;
		align-items: center;
		gap: 0.4rem;
		font-family: inherit;
	}

	.tab-btn:hover {
		color: #1a1a2e;
	}

	.tab-btn--active {
		color: #1a1a2e;
		border-bottom-color: #58a6ff;
		font-weight: 600;
	}

	.tab-count {
		background: #e0e0e6;
		color: #666;
		font-size: 0.7rem;
		font-weight: 600;
		padding: 0.1rem 0.45rem;
		border-radius: 10px;
		min-width: 1.4em;
		text-align: center;
	}

	.tab-btn--active .tab-count {
		background: #58a6ff;
		color: #fff;
	}

	/* ── Add Button ──────────────────────────────────────────────── */
	.add-btn {
		padding: 0.55rem 1.1rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: #1a7f37;
		background: #daf5e0;
		border: 1px solid #a3d9b1;
		border-radius: 6px;
		cursor: pointer;
		transition: background 0.15s;
		margin-bottom: 1rem;
		font-family: inherit;
	}

	.add-btn:hover {
		background: #c3edcc;
	}

	.add-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	/* ── Empty State ─────────────────────────────────────────────── */
	.empty-state {
		text-align: center;
		padding: 2.5rem 1rem;
		color: #888;
		font-size: 0.925rem;
	}

	/* ── Table ───────────────────────────────────────────────────── */
	.table-wrap {
		overflow-x: auto;
	}

	.events-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.875rem;
		background: #fff;
		border: 1px solid #e0e0e6;
		border-radius: 8px;
		overflow: hidden;
	}

	.events-table thead {
		background: #f5f5f7;
	}

	.events-table th {
		text-align: left;
		padding: 0.6rem 0.75rem;
		font-weight: 600;
		font-size: 0.8rem;
		color: #666;
		text-transform: uppercase;
		letter-spacing: 0.03em;
		border-bottom: 1px solid #e0e0e6;
		white-space: nowrap;
	}

	.events-table td {
		padding: 0.55rem 0.75rem;
		border-bottom: 1px solid #f0f0f3;
		color: #1a1a2e;
		vertical-align: middle;
	}

	.events-table tbody tr:last-child td {
		border-bottom: none;
	}

	.events-table tbody tr:hover {
		background: #fafafa;
	}

	.cell-title {
		font-weight: 500;
	}

	.cell-date {
		font-size: 0.8rem;
		color: #555;
		white-space: nowrap;
	}

	.cell-actions {
		white-space: nowrap;
		text-align: right;
	}

	/* ── Badges ──────────────────────────────────────────────────── */
	.badge {
		display: inline-block;
		font-size: 0.7rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		padding: 0.15rem 0.45rem;
		border-radius: 4px;
	}

	.badge--screening {
		background: #dbeafe;
		color: #1e40af;
	}

	.badge--watch-party {
		background: #ede9fe;
		color: #6b21a8;
	}

	.badge--meetup {
		background: #fef3c7;
		color: #92400e;
	}

	.badge--other {
		background: #f3f4f6;
		color: #374151;
	}

	.badge--published {
		background: #daf5e0;
		color: #1a6b30;
	}

	.badge--draft {
		background: #fef3c7;
		color: #92400e;
	}

	/* ── Action Buttons ──────────────────────────────────────────── */
	.action-form-inline {
		display: inline;
	}

	.action-btn {
		background: none;
		border: 1px solid #e0e0e6;
		border-radius: 5px;
		padding: 0.3rem 0.5rem;
		cursor: pointer;
		font-size: 0.85rem;
		transition: background 0.15s, border-color 0.15s;
		margin-left: 0.3rem;
	}

	.action-btn:hover {
		background: #f0f0f3;
		border-color: #d0d0d6;
	}

	.action-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.action-btn--danger:hover {
		background: #fde8e8;
		border-color: #f4b2b2;
	}

	/* ── Inline Form ─────────────────────────────────────────────── */
	.inline-form {
		background: #f9f9fb;
		border: 1px solid #e0e0e6;
		border-radius: 8px;
		padding: 1rem;
		margin-bottom: 1rem;
	}

	.inline-form--edit {
		margin: 0;
		border-radius: 6px;
	}

	.inline-form-title {
		font-size: 0.95rem;
		font-weight: 600;
		margin: 0 0 0.75rem;
		color: #1a1a2e;
	}

	.inline-form-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
		gap: 0.75rem;
		margin-bottom: 0.75rem;
	}

	.form-group-sm {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}

	.form-group-sm--wide {
		grid-column: span 2;
	}

	.form-label-sm {
		font-size: 0.75rem;
		font-weight: 600;
		color: #555;
		text-transform: uppercase;
		letter-spacing: 0.03em;
	}

	.form-input-sm {
		padding: 0.45rem 0.6rem;
		font-size: 0.85rem;
		border: 1px solid #d0d0d6;
		border-radius: 5px;
		background: #fff;
		color: #1a1a2e;
		transition: border-color 0.15s;
		box-sizing: border-box;
	}

	.form-input-sm:focus {
		outline: none;
		border-color: #58a6ff;
		box-shadow: 0 0 0 2px rgba(88, 166, 255, 0.15);
	}

	.form-select-sm {
		padding: 0.45rem 0.6rem;
		font-size: 0.85rem;
		border: 1px solid #d0d0d6;
		border-radius: 5px;
		background: #fff;
		color: #1a1a2e;
		cursor: pointer;
		box-sizing: border-box;
	}

	.form-select-sm:focus {
		outline: none;
		border-color: #58a6ff;
		box-shadow: 0 0 0 2px rgba(88, 166, 255, 0.15);
	}

	.form-textarea-sm {
		resize: vertical;
		min-height: 2.5em;
		font-family: inherit;
	}

	.checkbox-row {
		justify-content: flex-end;
	}

	.checkbox-label-sm {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		cursor: pointer;
		font-weight: 500;
		text-transform: none;
		letter-spacing: normal;
		font-size: 0.85rem;
	}

	.checkbox-label-sm input[type="checkbox"] {
		width: 16px;
		height: 16px;
		accent-color: #1a7f37;
	}

	.form-help-sm {
		font-size: 0.75rem;
		color: #888;
		margin: 0 0 0.75rem;
	}

	.inline-form-actions {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.save-btn-sm {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.45rem 1rem;
		font-size: 0.825rem;
		font-weight: 600;
		color: #fff;
		background: #1a7f37;
		border: none;
		border-radius: 5px;
		cursor: pointer;
		transition: background 0.15s;
		font-family: inherit;
	}

	.save-btn-sm:hover {
		background: #14682c;
	}

	.save-btn-sm:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}

	.cancel-btn-sm {
		padding: 0.45rem 0.9rem;
		font-size: 0.825rem;
		font-weight: 500;
		color: #666;
		background: #fff;
		border: 1px solid #d0d0d6;
		border-radius: 5px;
		cursor: pointer;
		transition: background 0.15s;
		font-family: inherit;
	}

	.cancel-btn-sm:hover {
		background: #f0f0f3;
	}

	.btn-danger-sm {
		padding: 0.45rem 0.9rem;
		font-size: 0.825rem;
		font-weight: 600;
		color: #fff;
		background: #e5534b;
		border: none;
		border-radius: 5px;
		cursor: pointer;
		transition: background 0.15s;
		font-family: inherit;
	}

	.btn-danger-sm:hover {
		background: #c93c34;
	}

	.btn-danger-sm:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}

	/* ── Delete Confirmation ─────────────────────────────────────── */
	.edit-row td,
	.delete-row td {
		padding: 0.5rem;
		background: #fafafa;
	}

	.delete-confirm {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: #9b1c1c;
		padding: 0.25rem 0;
	}

	.delete-form-inline {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	/* ── Spinner ─────────────────────────────────────────────────── */
	.spinner {
		display: inline-block;
		width: 12px;
		height: 12px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top-color: #fff;
		border-radius: 50%;
		animation: spin 0.6s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	/* ── Discord Banner ─────────────────────────────────────────── */
	.discord-banner {
		display: flex;
		align-items: flex-start;
		gap: 1rem;
		padding: 1rem 1.25rem;
		background: #eef2ff;
		border: 1px solid #c7d2fe;
		border-radius: 8px;
		margin-bottom: 1.5rem;
	}

	.discord-banner-icon {
		font-size: 1.5rem;
		flex-shrink: 0;
	}

	.discord-banner-text {
		font-size: 0.9rem;
		color: #3730a3;
		line-height: 1.5;
	}

	.discord-banner-text strong {
		display: block;
		margin-bottom: 0.25rem;
	}

	.discord-banner-link {
		display: inline-block;
		margin-top: 0.5rem;
		color: #4f46e5;
		font-weight: 600;
		text-decoration: none;
		font-size: 0.85rem;
	}

	.discord-banner-link:hover {
		text-decoration: underline;
	}

	/* ── Responsive ──────────────────────────────────────────────── */
	@media (max-width: 768px) {
		.inline-form-grid {
			grid-template-columns: 1fr;
		}

		.form-group-sm--wide {
			grid-column: span 1;
		}

		.tab-btn {
			padding: 0.5rem 0.75rem;
			font-size: 0.825rem;
		}

		.events-table th,
		.events-table td {
			padding: 0.45rem 0.5rem;
			font-size: 0.8rem;
		}
	}
</style>
