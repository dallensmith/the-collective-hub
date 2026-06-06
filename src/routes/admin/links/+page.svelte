<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { enhance } from '$app/forms';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	/** Current active tab */
	let activeTab = $state<'nav' | 'social'>('nav');

	/** Feedback message */
	let feedback = $state<{ type: 'success' | 'error'; message: string } | null>(null);

	/** Whether we're in the middle of a save operation */
	let saving = $state(false);

	// ─── Nav Links state ──────────────────────────────────────────────
	/** Show "Add Nav Link" inline form? */
	let showAddNav = $state(false);
	/** ID of nav link being edited (null = not editing) */
	let editingNavId = $state<string | null>(null);
	/** ID of nav link being deleted (for confirmation) */
	let deletingNavId = $state<string | null>(null);

	// ─── Social Links state ──────────────────────────────────────────
	let showAddSocial = $state(false);
	let editingSocialId = $state<string | null>(null);
	let deletingSocialId = $state<string | null>(null);

	// Handle form action feedback
	$effect(() => {
		if (form) {
			saving = false;
			if (form.success) {
				// Determine which action succeeded for a better message
				const actionLabel = getActionLabel(form.action as string);
				feedback = { type: 'success', message: `${actionLabel} saved.` };
				// Close all forms
				showAddNav = false;
				editingNavId = null;
				deletingNavId = null;
				showAddSocial = false;
				editingSocialId = null;
				deletingSocialId = null;
			} else if (form.error) {
				feedback = { type: 'error', message: form.error };
			}
		}
	});

	function getActionLabel(action: string | undefined): string {
		if (!action) return 'Link';
		if (action.includes('Nav')) return 'Nav link';
		if (action.includes('Social')) return 'Social link';
		return 'Link';
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

	/** Start editing a nav link */
	function startEditNav(id: string) {
		editingNavId = id;
		showAddNav = false;
	}

	/** Cancel editing */
	function cancelEditNav() {
		editingNavId = null;
	}

	function startEditSocial(id: string) {
		editingSocialId = id;
		showAddSocial = false;
	}

	function cancelEditSocial() {
		editingSocialId = null;
	}

	/** Position badge styling */
	function positionBadgeClass(pos: string): string {
		return pos === 'header' ? 'badge badge--header' : 'badge badge--footer';
	}

	/** Platform emoji helper */
	function platformEmoji(platform: string): string {
		const map: Record<string, string> = {
			discord: '💬',
			twitter: '🐦',
			youtube: '▶️',
			twitch: '🎮',
			github: '🐙',
			instagram: '📷'
		};
		return map[platform.toLowerCase()] ?? '🔗';
	}
</script>

<svelte:head>
	<title>Links — Admin</title>
</svelte:head>

<div class="links-page">
	<h1 class="page-title">Links</h1>
	<p class="page-desc">Manage your site's navigation links and social media links.</p>

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

	<!-- ═══════════════════════════════════════════════════════════ -->
	<!-- Tab Bar -->
	<!-- ═══════════════════════════════════════════════════════════ -->
	<div class="tab-bar">
		<button
			class="tab-btn"
			class:tab-btn--active={activeTab === 'nav'}
			onclick={() => (activeTab = 'nav')}
		>
			Nav Links
			<span class="tab-count">{data.navLinks.length}</span>
		</button>
		<button
			class="tab-btn"
			class:tab-btn--active={activeTab === 'social'}
			onclick={() => (activeTab = 'social')}
		>
			Social Links
			<span class="tab-count">{data.socialLinks.length}</span>
		</button>
	</div>

	<!-- ═══════════════════════════════════════════════════════════ -->
	<!-- Nav Links Tab -->
	<!-- ═══════════════════════════════════════════════════════════ -->
	{#if activeTab === 'nav'}
		<div class="tab-content">
			<!-- Add Nav Link Button -->
			{#if !showAddNav}
				<button class="add-btn" onclick={() => (showAddNav = true)} disabled={saving}>
					+ Add Nav Link
				</button>
			{/if}

			<!-- Inline Add Form -->
			{#if showAddNav}
				<form
					method="POST"
					action="?/createNavLink"
					use:enhance={handleEnhance}
					class="inline-form"
				>
					<h3 class="inline-form-title">New Nav Link</h3>
					<div class="inline-form-grid">
						<div class="form-group-sm">
							<label for="nav-label" class="form-label-sm">Label *</label>
							<input
								type="text"
								id="nav-label"
								name="label"
								class="form-input-sm"
								required
								maxlength={100}
								placeholder="Home"
							/>
						</div>
						<div class="form-group-sm">
							<label for="nav-url" class="form-label-sm">URL *</label>
							<input
								type="text"
								id="nav-url"
								name="url"
								class="form-input-sm"
								required
								placeholder="/ or https://..."
							/>
						</div>
						<div class="form-group-sm">
							<label for="nav-position" class="form-label-sm">Position</label>
							<select id="nav-position" name="position" class="form-select-sm">
								<option value="header">Header</option>
								<option value="footer">Footer</option>
							</select>
						</div>
						<div class="form-group-sm">
							<label for="nav-sort" class="form-label-sm">Sort Order</label>
							<input
								type="number"
								id="nav-sort"
								name="sortOrder"
								class="form-input-sm"
								value="0"
							/>
						</div>
						<div class="form-group-sm checkbox-row">
							<label class="form-label-sm checkbox-label-sm">
								<input type="checkbox" name="isExternal" checked />
								<span>External</span>
							</label>
						</div>
					</div>
					<div class="inline-form-actions">
						<button type="submit" class="save-btn-sm" disabled={saving}>
							{#if saving}<span class="spinner"></span>{/if}
							Add
						</button>
						<button type="button" class="cancel-btn-sm" onclick={() => (showAddNav = false)}>
							Cancel
						</button>
					</div>
				</form>
			{/if}

			<!-- Nav Links Table -->
			{#if data.navLinks.length === 0 && !showAddNav}
				<div class="empty-state">
					<p>No nav links yet. Add your first one above.</p>
				</div>
			{:else}
				<div class="table-wrap">
					<table class="links-table">
						<thead>
							<tr>
								<th>Label</th>
								<th>URL</th>
								<th>Position</th>
								<th>Order</th>
								<th>Ext</th>
								<th>Actions</th>
							</tr>
						</thead>
						<tbody>
							{#each data.navLinks as link}
								{#if editingNavId === link.id}
									<!-- ── Edit Row ────────────────────────── -->
									<tr class="edit-row">
										<td colspan="6">
											<form
												method="POST"
												action="?/updateNavLink"
												use:enhance={handleEnhance}
												class="inline-form inline-form--edit"
											>
												<input type="hidden" name="id" value={link.id} />
												<div class="inline-form-grid">
													<div class="form-group-sm">
														<label class="form-label-sm" for="edit-nav-label-{link.id}">Label *</label>
														<input
															type="text"
															name="label"
															id="edit-nav-label-{link.id}"
															class="form-input-sm"
															required
															maxlength={100}
															value={link.label}
														/>
													</div>
													<div class="form-group-sm">
														<label class="form-label-sm" for="edit-nav-url-{link.id}">URL *</label>
														<input
															type="text"
															name="url"
															id="edit-nav-url-{link.id}"
															class="form-input-sm"
															required
															value={link.url}
														/>
													</div>
													<div class="form-group-sm">
														<label class="form-label-sm" for="edit-nav-position-{link.id}">Position</label>
														<select name="position" id="edit-nav-position-{link.id}" class="form-select-sm">
															<option value="header" selected={link.position === 'header'}>Header</option>
															<option value="footer" selected={link.position === 'footer'}>Footer</option>
														</select>
													</div>
													<div class="form-group-sm">
														<label class="form-label-sm" for="edit-nav-sort-{link.id}">Sort Order</label>
														<input
															type="number"
															name="sortOrder"
															id="edit-nav-sort-{link.id}"
															class="form-input-sm"
															value={link.sortOrder}
														/>
													</div>
													<div class="form-group-sm checkbox-row">
														<label class="form-label-sm checkbox-label-sm">
															<input
																type="checkbox"
																name="isExternal"
																checked={link.isExternal}
															/>
															<span>External</span>
														</label>
													</div>
												</div>
												<div class="inline-form-actions">
													<button type="submit" class="save-btn-sm" disabled={saving}>
														{#if saving}<span class="spinner"></span>{/if}
														Save
													</button>
													<button type="button" class="cancel-btn-sm" onclick={cancelEditNav}>
														Cancel
													</button>
												</div>
											</form>
										</td>
									</tr>
								{:else if deletingNavId === link.id}
									<!-- ── Delete Confirmation ──────────────── -->
									<tr class="delete-row">
										<td colspan="6">
											<div class="delete-confirm">
												<span>Delete "{link.label}"?</span>
												<form
													method="POST"
													action="?/deleteNavLink"
													use:enhance={handleEnhance}
													class="delete-form-inline"
												>
													<input type="hidden" name="id" value={link.id} />
													<button type="submit" class="btn-danger-sm" disabled={saving}>
														Sure?
													</button>
													<button
														type="button"
														class="cancel-btn-sm"
														onclick={() => (deletingNavId = null)}
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
										<td class="cell-label">{link.label}</td>
										<td class="cell-url" title={link.url}>
											{link.url.length > 40 ? link.url.slice(0, 40) + '…' : link.url}
										</td>
										<td>
											<span class={positionBadgeClass(link.position)}>
												{link.position}
											</span>
										</td>
										<td class="cell-order">{link.sortOrder}</td>
										<td class="cell-ext">
											{#if link.isExternal}
												<span class="ext-badge">↗</span>
											{/if}
										</td>
										<td class="cell-actions">
											<button
												class="action-btn"
												onclick={() => startEditNav(link.id)}
												disabled={saving}
												title="Edit"
											>
												✏️
											</button>
											<button
												class="action-btn action-btn--danger"
												onclick={() => (deletingNavId = link.id)}
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

	<!-- ═══════════════════════════════════════════════════════════ -->
	<!-- Social Links Tab -->
	<!-- ═══════════════════════════════════════════════════════════ -->
	{#if activeTab === 'social'}
		<div class="tab-content">
			{#if !showAddSocial}
				<button class="add-btn" onclick={() => (showAddSocial = true)} disabled={saving}>
					+ Add Social Link
				</button>
			{/if}

			<!-- Inline Add Form -->
			{#if showAddSocial}
				<form
					method="POST"
					action="?/createSocialLink"
					use:enhance={handleEnhance}
					class="inline-form"
				>
					<h3 class="inline-form-title">New Social Link</h3>
					<div class="inline-form-grid">
						<div class="form-group-sm">
							<label for="social-platform" class="form-label-sm">Platform *</label>
							<input
								type="text"
								id="social-platform"
								name="platform"
								class="form-input-sm"
								required
								maxlength={100}
								placeholder="discord"
							/>
						</div>
						<div class="form-group-sm">
							<label for="social-label" class="form-label-sm">Label</label>
							<input
								type="text"
								id="social-label"
								name="label"
								class="form-input-sm"
								maxlength={100}
								placeholder="Join our Discord"
							/>
						</div>
						<div class="form-group-sm">
							<label for="social-url" class="form-label-sm">URL *</label>
							<input
								type="text"
								id="social-url"
								name="url"
								class="form-input-sm"
								required
								placeholder="https://..."
							/>
						</div>
						<div class="form-group-sm">
							<label for="social-sort" class="form-label-sm">Sort Order</label>
							<input
								type="number"
								id="social-sort"
								name="sortOrder"
								class="form-input-sm"
								value="0"
							/>
						</div>
					</div>
					<p class="form-help-sm">
						Suggested platforms: discord, twitter, youtube, twitch, github, instagram
					</p>
					<div class="inline-form-actions">
						<button type="submit" class="save-btn-sm" disabled={saving}>
							{#if saving}<span class="spinner"></span>{/if}
							Add
						</button>
						<button type="button" class="cancel-btn-sm" onclick={() => (showAddSocial = false)}>
							Cancel
						</button>
					</div>
				</form>
			{/if}

			<!-- Social Links Table -->
			{#if data.socialLinks.length === 0 && !showAddSocial}
				<div class="empty-state">
					<p>No social links yet. Add your first one above.</p>
				</div>
			{:else}
				<div class="table-wrap">
					<table class="links-table">
						<thead>
							<tr>
								<th>Platform</th>
								<th>Label</th>
								<th>URL</th>
								<th>Order</th>
								<th>Actions</th>
							</tr>
						</thead>
						<tbody>
							{#each data.socialLinks as link}
								{#if editingSocialId === link.id}
									<!-- ── Edit Row ────────────────────────── -->
									<tr class="edit-row">
										<td colspan="5">
											<form
												method="POST"
												action="?/updateSocialLink"
												use:enhance={handleEnhance}
												class="inline-form inline-form--edit"
											>
												<input type="hidden" name="id" value={link.id} />
												<div class="inline-form-grid">
													<div class="form-group-sm">
														<label class="form-label-sm" for="edit-social-platform-{link.id}">Platform *</label>
														<input
															type="text"
															name="platform"
															id="edit-social-platform-{link.id}"
															class="form-input-sm"
															required
															maxlength={100}
															value={link.platform}
														/>
													</div>
													<div class="form-group-sm">
														<label class="form-label-sm" for="edit-social-label-{link.id}">Label</label>
														<input
															type="text"
															name="label"
															id="edit-social-label-{link.id}"
															class="form-input-sm"
															maxlength={100}
															value={link.label ?? ''}
														/>
													</div>
													<div class="form-group-sm">
														<label class="form-label-sm" for="edit-social-url-{link.id}">URL *</label>
														<input
															type="text"
															name="url"
															id="edit-social-url-{link.id}"
															class="form-input-sm"
															required
															value={link.url}
														/>
													</div>
													<div class="form-group-sm">
														<label class="form-label-sm" for="edit-social-sort-{link.id}">Sort Order</label>
														<input
															type="number"
															name="sortOrder"
															id="edit-social-sort-{link.id}"
															class="form-input-sm"
															value={link.sortOrder}
														/>
													</div>
												</div>
												<div class="inline-form-actions">
													<button type="submit" class="save-btn-sm" disabled={saving}>
														{#if saving}<span class="spinner"></span>{/if}
														Save
													</button>
													<button type="button" class="cancel-btn-sm" onclick={cancelEditSocial}>
														Cancel
													</button>
												</div>
											</form>
										</td>
									</tr>
								{:else if deletingSocialId === link.id}
									<!-- ── Delete Confirmation ──────────────── -->
									<tr class="delete-row">
										<td colspan="5">
											<div class="delete-confirm">
												<span>Delete "{link.platform}"?</span>
												<form
													method="POST"
													action="?/deleteSocialLink"
													use:enhance={handleEnhance}
													class="delete-form-inline"
												>
													<input type="hidden" name="id" value={link.id} />
													<button type="submit" class="btn-danger-sm" disabled={saving}>
														Sure?
													</button>
													<button
														type="button"
														class="cancel-btn-sm"
														onclick={() => (deletingSocialId = null)}
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
										<td class="cell-platform">
											<span class="platform-icon">{platformEmoji(link.platform)}</span>
											{link.platform}
										</td>
										<td class="cell-label">{link.label ?? '—'}</td>
										<td class="cell-url" title={link.url}>
											{link.url.length > 40 ? link.url.slice(0, 40) + '…' : link.url}
										</td>
										<td class="cell-order">{link.sortOrder}</td>
										<td class="cell-actions">
											<button
												class="action-btn"
												onclick={() => startEditSocial(link.id)}
												disabled={saving}
												title="Edit"
											>
												✏️
											</button>
											<button
												class="action-btn action-btn--danger"
												onclick={() => (deletingSocialId = link.id)}
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
	.links-page {
		max-width: 800px;
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

	.links-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.875rem;
		background: #fff;
		border: 1px solid #e0e0e6;
		border-radius: 8px;
		overflow: hidden;
	}

	.links-table thead {
		background: #f5f5f7;
	}

	.links-table th {
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

	.links-table td {
		padding: 0.55rem 0.75rem;
		border-bottom: 1px solid #f0f0f3;
		color: #1a1a2e;
		vertical-align: middle;
	}

	.links-table tbody tr:last-child td {
		border-bottom: none;
	}

	.links-table tbody tr:hover {
		background: #fafafa;
	}

	.cell-label {
		font-weight: 500;
	}

	.cell-url {
		font-family: monospace;
		font-size: 0.8rem;
		color: #555;
		max-width: 200px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.cell-order {
		text-align: center;
		color: #888;
	}

	.cell-ext {
		text-align: center;
	}

	.cell-platform {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		font-weight: 500;
	}

	.platform-icon {
		font-size: 1rem;
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

	.badge--header {
		background: #dbeafe;
		color: #1e40af;
	}

	.badge--footer {
		background: #fef3c7;
		color: #92400e;
	}

	.ext-badge {
		font-size: 0.85rem;
		color: #58a6ff;
	}

	/* ── Action Buttons ──────────────────────────────────────────── */
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

	/* ── Responsive ──────────────────────────────────────────────── */
	@media (max-width: 768px) {
		.inline-form-grid {
			grid-template-columns: 1fr;
		}

		.tab-btn {
			padding: 0.5rem 0.75rem;
			font-size: 0.825rem;
		}

		.links-table th,
		.links-table td {
			padding: 0.45rem 0.5rem;
			font-size: 0.8rem;
		}
	}
</style>
