<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { enhance } from '$app/forms';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	/** Can the current user manage team members? */
	let canManage = $derived(
		data.isSuperAdmin || data.currentUserRole === 'owner'
	);

	/** Feedback message state */
	let feedback = $state<{ type: 'success' | 'error'; message: string } | null>(null);

	/** Whether a save operation is in flight */
	let saving = $state(false);

	/** Which member is being confirmed for removal (null = none) */
	let removingId = $state<string | null>(null);

	// Handle form action feedback from server
	$effect(() => {
		if (form) {
			saving = false;
			if (form.success) {
				const label = actionLabel(form.action as string);
				feedback = { type: 'success', message: label };
				removingId = null;
			} else if (form.error) {
				feedback = { type: 'error', message: form.error };
			}
		}
	});

	function actionLabel(action: string | undefined): string {
		if (action === 'addMember') return 'Member added successfully.';
		if (action === 'changeRole') return 'Role updated.';
		if (action === 'removeMember') return 'Member removed.';
		return 'Saved.';
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

	/** Format a date string for display */
	function formatDate(isoStr: string): string {
		const d = new Date(isoStr);
		return d.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}

	/** Get role badge CSS class */
	function roleBadgeClass(role: string): string {
		if (role === 'owner') return 'badge badge--owner';
		if (role === 'admin') return 'badge badge--admin';
		return 'badge badge--editor';
	}

	/** Get role display label */
	function roleLabel(role: string): string {
		return role.charAt(0).toUpperCase() + role.slice(1);
	}
</script>

<svelte:head>
	<title>Team — Admin</title>
</svelte:head>

<div class="team-page">
	<header class="page-header">
		<h1 class="page-title">Team</h1>
		<span class="member-count-badge">{data.members.length} member{data.members.length !== 1 ? 's' : ''}</span>
	</header>
	<p class="page-desc">
		Manage who has access to this site's admin panel and what they can do.
	</p>

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

	<!-- Access control: read-only for editors -->
	{#if !canManage}
		<div class="permission-notice" role="alert">
			⚠️ You don't have permission to manage team members. The team list is shown in read-only mode.
		</div>
	{/if}

	<!-- Add Member Card -->
	{#if canManage}
		<div class="card add-member-card">
			<h2 class="card-title">Add Member</h2>
			<form
				method="POST"
				action="?/addMember"
				use:enhance={handleEnhance}
				class="add-member-form"
			>
				<div class="add-member-fields">
					<div class="form-group">
						<label for="discordId" class="form-label">Discord User ID</label>
						<input
							type="text"
							id="discordId"
							name="discordId"
							class="form-input"
							placeholder="e.g., 123456789012345678"
							required
							pattern="\d{17,20}"
							title="Discord user ID (17-20 digit number)"
						/>
					</div>
					<div class="form-group form-group--role">
						<label for="role" class="form-label">Role</label>
						<select id="role" name="role" class="form-select">
							<option value="admin">Admin</option>
							<option value="editor">Editor</option>
						</select>
					</div>
					<div class="form-group form-group--submit">
						<button type="submit" class="btn btn--primary" disabled={saving}>
							{#if saving}<span class="spinner"></span>{/if}
							Add Member
						</button>
					</div>
				</div>
				<p class="form-help">
					Users must log in via Discord at least once before they can be added.
				</p>
			</form>
		</div>
	{/if}

	<!-- Members Table -->
	<div class="card">
		<h2 class="card-title">Members</h2>
		{#if data.members.length === 0}
			<div class="empty-state">
				<p>No team members yet. Add your first admin or editor above.</p>
			</div>
		{:else}
			<div class="table-wrap">
				<table class="members-table">
					<thead>
						<tr>
							<th>Member</th>
							<th>Role</th>
							<th>Joined</th>
							{#if canManage}
								<th class="actions-col">Actions</th>
							{/if}
						</tr>
					</thead>
					<tbody>
						{#each data.members as member (member.membershipId)}
							<tr>
								<td class="cell-member">
									<div class="member-info">
										<img
											src={member.discordAvatarUrl}
											alt={member.discordUsername}
											class="member-avatar"
											width="32"
											height="32"
										/>
										<span class="member-name">{member.discordUsername}</span>
									</div>
								</td>
								<td>
									<span class={roleBadgeClass(member.role)}>
										{roleLabel(member.role)}
									</span>
								</td>
								<td class="cell-date">{formatDate(member.createdAt)}</td>
								{#if canManage}
									<td class="cell-actions">
										{#if member.role === 'owner'}
											<span class="owner-status">Owner</span>
										{:else}
											<div class="actions-row">
												<!-- Role change form -->
												<form
													method="POST"
													action="?/changeRole"
													use:enhance={handleEnhance}
													class="action-form-inline"
												>
													<input
														type="hidden"
														name="membershipId"
														value={member.membershipId}
													/>
													<select
														name="newRole"
														class="role-select-inline"
														onchange={(e) => {
															const form = (e.target as HTMLSelectElement).closest('form');
															if (form) form.requestSubmit();
														}}
														disabled={saving}
													>
														<option value="admin" selected={member.role === 'admin'}>
															Admin
														</option>
														<option value="editor" selected={member.role === 'editor'}>
															Editor
														</option>
													</select>
												</form>

												<!-- Remove button -->
												{#if removingId === member.membershipId}
													<div class="remove-confirm-inline">
														<span class="confirm-text">Remove?</span>
														<form
															method="POST"
															action="?/removeMember"
															use:enhance={handleEnhance}
															class="action-form-inline"
														>
															<input
																type="hidden"
																name="membershipId"
																value={member.membershipId}
															/>
															<button
																type="submit"
																class="btn btn--danger-sm"
																disabled={saving}
															>
																Yes
															</button>
														</form>
														<button
															type="button"
															class="btn btn--cancel-sm"
															onclick={() => (removingId = null)}
														>
															No
														</button>
													</div>
												{:else}
													<button
														type="button"
														class="btn btn--remove-sm"
														onclick={() => (removingId = member.membershipId)}
														disabled={saving}
													>
														Remove
													</button>
												{/if}
											</div>
										{/if}
									</td>
								{/if}
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
</div>

<style>
	.team-page {
		max-width: 900px;
	}

	/* ── Page Header ─────────────────────────────────────────────── */
	.page-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 0.25rem;
	}

	.page-title {
		font-size: 1.5rem;
		font-weight: 700;
		margin: 0;
		color: #1a1a2e;
	}

	.member-count-badge {
		display: inline-block;
		font-size: 0.8rem;
		font-weight: 600;
		color: #555;
		background: #e8e8ec;
		padding: 0.2rem 0.6rem;
		border-radius: 12px;
	}

	.page-desc {
		color: #666;
		margin: 0 0 1.5rem;
		font-size: 0.925rem;
	}

	/* ── Feedback ────────────────────────────────────────────────── */
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

	/* ── Permission Notice ───────────────────────────────────────── */
	.permission-notice {
		padding: 0.75rem 1rem;
		border-radius: 6px;
		margin-bottom: 1.25rem;
		font-size: 0.875rem;
		font-weight: 500;
		background: #fef9c3;
		color: #854d0e;
		border: 1px solid #fde68a;
	}

	/* ── Card ────────────────────────────────────────────────────── */
	.card {
		background: #fff;
		border: 1px solid #e0e0e6;
		border-radius: 8px;
		padding: 1.25rem;
		margin-bottom: 1.25rem;
	}

	.card-title {
		font-size: 1rem;
		font-weight: 600;
		margin: 0 0 1rem;
		color: #1a1a2e;
	}

	/* ── Add Member Form ─────────────────────────────────────────── */
	.add-member-fields {
		display: flex;
		gap: 0.75rem;
		align-items: flex-end;
		flex-wrap: wrap;
		margin-bottom: 0.5rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.form-group--role {
		min-width: 120px;
	}

	.form-group--submit {
		padding-bottom: 0;
	}

	.form-label {
		font-size: 0.75rem;
		font-weight: 600;
		color: #555;
		text-transform: uppercase;
		letter-spacing: 0.03em;
	}

	.form-input {
		padding: 0.5rem 0.65rem;
		font-size: 0.875rem;
		border: 1px solid #d0d0d6;
		border-radius: 5px;
		background: #fff;
		color: #1a1a2e;
		transition: border-color 0.15s;
		box-sizing: border-box;
		min-width: 220px;
	}

	.form-input:focus {
		outline: none;
		border-color: #58a6ff;
		box-shadow: 0 0 0 2px rgba(88, 166, 255, 0.15);
	}

	.form-select {
		padding: 0.5rem 0.65rem;
		font-size: 0.875rem;
		border: 1px solid #d0d0d6;
		border-radius: 5px;
		background: #fff;
		color: #1a1a2e;
		cursor: pointer;
		box-sizing: border-box;
	}

	.form-select:focus {
		outline: none;
		border-color: #58a6ff;
		box-shadow: 0 0 0 2px rgba(88, 166, 255, 0.15);
	}

	.form-help {
		font-size: 0.8rem;
		color: #888;
		margin: 0.5rem 0 0;
	}

	/* ── Buttons ─────────────────────────────────────────────────── */
	.btn {
		padding: 0.5rem 1rem;
		font-size: 0.85rem;
		font-weight: 600;
		border: none;
		border-radius: 5px;
		cursor: pointer;
		transition: background 0.15s;
		font-family: inherit;
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		white-space: nowrap;
	}

	.btn:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}

	.btn--primary {
		color: #fff;
		background: #1a7f37;
	}

	.btn--primary:hover {
		background: #14682c;
	}

	.btn--danger-sm {
		padding: 0.3rem 0.65rem;
		font-size: 0.75rem;
		font-weight: 600;
		color: #fff;
		background: #e5534b;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		transition: background 0.15s;
		font-family: inherit;
	}

	.btn--danger-sm:hover {
		background: #c93c34;
	}

	.btn--danger-sm:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}

	.btn--cancel-sm {
		padding: 0.3rem 0.65rem;
		font-size: 0.75rem;
		font-weight: 500;
		color: #666;
		background: #fff;
		border: 1px solid #d0d0d6;
		border-radius: 4px;
		cursor: pointer;
		transition: background 0.15s;
		font-family: inherit;
	}

	.btn--cancel-sm:hover {
		background: #f0f0f3;
	}

	.btn--remove-sm {
		padding: 0.3rem 0.65rem;
		font-size: 0.75rem;
		font-weight: 500;
		color: #e5534b;
		background: #fff;
		border: 1px solid #e5534b;
		border-radius: 4px;
		cursor: pointer;
		transition: background 0.15s, color 0.15s;
		font-family: inherit;
	}

	.btn--remove-sm:hover {
		background: #e5534b;
		color: #fff;
	}

	.btn--remove-sm:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	/* ── Empty State ─────────────────────────────────────────────── */
	.empty-state {
		text-align: center;
		padding: 2rem 1rem;
		color: #888;
		font-size: 0.925rem;
	}

	/* ── Table ───────────────────────────────────────────────────── */
	.table-wrap {
		overflow-x: auto;
	}

	.members-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.875rem;
	}

	.members-table thead {
		background: #f5f5f7;
	}

	.members-table th {
		text-align: left;
		padding: 0.6rem 0.75rem;
		font-weight: 600;
		font-size: 0.8rem;
		color: #666;
		text-transform: uppercase;
		letter-spacing: 0.03em;
		border-bottom: 2px solid #e0e0e6;
		white-space: nowrap;
	}

	.members-table td {
		padding: 0.65rem 0.75rem;
		border-bottom: 1px solid #f0f0f3;
		color: #1a1a2e;
		vertical-align: middle;
	}

	.members-table tbody tr:last-child td {
		border-bottom: none;
	}

	.members-table tbody tr:hover {
		background: #fafafa;
	}

	.actions-col {
		text-align: right;
	}

	/* ── Member Cell ─────────────────────────────────────────────── */
	.cell-member {
		min-width: 180px;
	}

	.member-info {
		display: flex;
		align-items: center;
		gap: 0.6rem;
	}

	.member-avatar {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		object-fit: cover;
		border: 1px solid #e0e0e6;
		flex-shrink: 0;
	}

	.member-name {
		font-weight: 500;
		font-size: 0.875rem;
	}

	.cell-date {
		font-size: 0.825rem;
		color: #666;
		white-space: nowrap;
	}

	.cell-actions {
		text-align: right;
		white-space: nowrap;
	}

	/* ── Role Badges ─────────────────────────────────────────────── */
	.badge {
		display: inline-block;
		font-size: 0.7rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		padding: 0.2rem 0.5rem;
		border-radius: 4px;
	}

	.badge--owner {
		background: #fef3c7;
		color: #92400e;
		border: 1px solid #fcd34d;
	}

	.badge--admin {
		background: #dbeafe;
		color: #1e40af;
		border: 1px solid #93c5fd;
	}

	.badge--editor {
		background: #daf5e0;
		color: #1a6b30;
		border: 1px solid #a3d9b1;
	}

	/* ── Actions Row ─────────────────────────────────────────────── */
	.actions-row {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 0.5rem;
	}

	.action-form-inline {
		display: inline;
	}

	.owner-status {
		font-size: 0.8rem;
		color: #92400e;
		font-weight: 500;
	}

	/* ── Role Select Inline ──────────────────────────────────────── */
	.role-select-inline {
		padding: 0.3rem 0.5rem;
		font-size: 0.8rem;
		border: 1px solid #d0d0d6;
		border-radius: 4px;
		background: #fff;
		color: #1a1a2e;
		cursor: pointer;
		font-family: inherit;
	}

	.role-select-inline:focus {
		outline: none;
		border-color: #58a6ff;
	}

	.role-select-inline:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	/* ── Remove Confirmation Inline ──────────────────────────────── */
	.remove-confirm-inline {
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}

	.confirm-text {
		font-size: 0.8rem;
		font-weight: 500;
		color: #9b1c1c;
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
		.add-member-fields {
			flex-direction: column;
			align-items: stretch;
		}

		.form-input {
			min-width: 0;
			width: 100%;
		}

		.members-table th,
		.members-table td {
			padding: 0.5rem 0.5rem;
			font-size: 0.8rem;
		}

		.member-name {
			font-size: 0.8rem;
		}

		.actions-row {
			flex-wrap: wrap;
			gap: 0.3rem;
		}
	}
</style>
