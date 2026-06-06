<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import type { DiscordRoleMapping } from '$lib/shared/types';
	import { enhance } from '$app/forms';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	/** Whether the form is currently being submitted */
	let saving = $state(false);

	/** Feedback message shown after save attempt */
	let feedback = $state<{ type: 'success' | 'error'; message: string } | null>(null);

	/** Local role mappings state (editable, synced when page data refreshes) */
	let roleMappings = $state<DiscordRoleMapping[]>([]);
	let roleSyncEnabled = $state(false);

	/** Serialized JSON of role mappings for form submission */
	let roleMappingsJson = $derived(JSON.stringify(roleMappings));

	/** Available site roles for the dropdown */
	const siteRoles: Array<{ value: DiscordRoleMapping['siteRole']; label: string }> = [
		{ value: 'owner', label: 'Owner' },
		{ value: 'admin', label: 'Admin' },
		{ value: 'editor', label: 'Editor' }
	];

	/** Sync local state from page data */
	$effect(() => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const d = data as any;
		if (d.discordRoleMappings) {
			roleMappings = d.discordRoleMappings as DiscordRoleMapping[];
		}
		roleSyncEnabled = d.discordRoleSyncEnabled ?? false;
	});

	/** Add a new empty role mapping row */
	function addMapping() {
		roleMappings = [...roleMappings, { discordRoleId: '', siteRole: 'editor' }];
	}

	/** Remove a role mapping row by index */
	function removeMapping(index: number) {
		roleMappings = roleMappings.filter((_, i) => i !== index);
	}

	/** Update a field on a specific mapping row */
	function updateMapping(index: number, field: keyof DiscordRoleMapping, value: string) {
		roleMappings = roleMappings.map((m, i) =>
			i === index ? { ...m, [field]: value } : m
		);
	}

	/** Discord connection status derived from server data */
	let discordStatus = $derived.by(() => {
		if (!data.discordGuildId) return null;
		if (data.discordGuildName) {
			return { type: 'connected' as const, label: `✅ Bot connected: ${data.discordGuildName}` };
		}
		if (data.discordConnectionError) {
			return { type: 'error' as const, label: '❌ Bot not found in server' };
		}
		return { type: 'pending' as const, label: '⏳ Checking…' };
	});

	/** Guild roles for the mapping dropdown (safe typed access) */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let guildRoles = $derived((data as any).discordGuildRoles as Array<{ id: string; name: string; color: number }> | undefined);

	/** Whether guild roles are available for the mapping dropdown */
	let canFetchRoles = $derived(
		!!data.discordGuildId && !!guildRoles?.length
	);

	// Clear feedback when form action data changes (new submission)
	$effect(() => {
		if (form) {
			saving = false;
			if (form.success) {
				if ((form as Record<string, unknown>).draftSaved) {
					feedback = { type: 'success', message: 'Draft saved. Changes are not yet live.' };
				} else if ((form as Record<string, unknown>).published) {
					feedback = { type: 'success', message: 'Settings published and live.' };
				} else if ((form as Record<string, unknown>).draftsDiscarded) {
					feedback = { type: 'success', message: 'Drafts discarded.' };
				} else {
					feedback = { type: 'success', message: 'Settings saved.' };
				}
			} else if (form.error) {
				feedback = { type: 'error', message: form.error };
			}
		}
	});

	/** Called by use:enhance before form submission */
	function handleEnhance() {
		saving = true;
		feedback = null;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		return ({ result }: any) => {
			saving = false;
			if (result.type === 'success') {
				// The $effect above will set feedback from form data
			} else if (result.type === 'failure') {
				feedback = {
					type: 'error',
					message: (result.data?.error as string) ?? 'Failed to save settings.'
				};
			} else if (result.type === 'error') {
				feedback = {
					type: 'error',
					message: 'A network error occurred. Please try again.'
				};
			}
		};
	}
</script>

<svelte:head>
	<title>Settings — {data.siteName} — Admin</title>
</svelte:head>

<div class="settings-page">
	<h1 class="page-title">Settings</h1>
	<p class="page-desc">Manage your site's basic identity.</p>

	<!-- Feedback message -->
	{#if feedback}
		<div
			class="feedback"
			class:feedback--success={feedback.type === 'success'}
			class:feedback--error={feedback.type === 'error'}
			role="alert"
		>
			{#if feedback.type === 'success'}
				✓
			{:else}
				⚠
			{/if}
			{feedback.message}
		</div>
	{/if}

	<form method="POST" use:enhance={handleEnhance} class="settings-form">
		<fieldset disabled={saving}>
			<!-- Site Name -->
			<div class="form-group">
				<label for="siteName" class="form-label">
					Site Name <span class="required">*</span>
				</label>
				<input
					type="text"
					id="siteName"
					name="siteName"
					class="form-input"
					value={data.siteName}
					required
					maxlength={100}
					placeholder="My Collective Site"
				/>
				<p class="form-help">The name displayed across your site and in browser tabs.</p>
			</div>

			<!-- Tagline -->
			<div class="form-group">
				<label for="tagline" class="form-label">Tagline</label>
				<input
					type="text"
					id="tagline"
					name="tagline"
					class="form-input"
					value={data.tagline}
					maxlength={200}
					placeholder="A community for…"
				/>
				<p class="form-help">A short description shown beneath your site name. Optional.</p>
			</div>

			<!-- ═══════════════════════════════════════════════════════ -->
			<!-- Discord Events Section -->
			<!-- ═══════════════════════════════════════════════════════ -->
			<div class="section-divider"></div>
			<h2 class="section-title">Discord Events</h2>
			<p class="section-desc">Pull Scheduled Events from your Discord server and display them on the public site. When enabled, Discord events replace native site events.</p>

			<!-- Discord Server ID -->
			<div class="form-group">
				<label for="discordGuildId" class="form-label">
					Discord Server ID
				</label>
				<input
					type="text"
					id="discordGuildId"
					name="discordGuildId"
					class="form-input"
					value={data.discordGuildId}
					maxlength={30}
					placeholder="123456789012345678"
				/>
				<p class="form-help">
					The Discord server (guild) ID to pull events from. Find this in Discord by enabling Developer Mode, then right-click your server icon → "Copy Server ID". The bot must be in your server.
				</p>

				<!-- Discord connection status -->
				{#if discordStatus}
					<div
						class="discord-status"
						class:discord-status--connected={discordStatus.type === 'connected'}
						class:discord-status--error={discordStatus.type === 'error'}
						class:discord-status--pending={discordStatus.type === 'pending'}
					>
						{discordStatus.label}
					</div>
				{/if}
			</div>

			<!-- Enable Discord Events -->
			<div class="form-group">
				<label class="form-label checkbox-label">
					<input type="checkbox" name="discordEventsEnabled" checked={data.discordEventsEnabled} />
					<span>Enable Discord Events</span>
				</label>
				<p class="form-help">
					When enabled, scheduled events from your Discord server replace native site events on the public homepage. The native events manager will be hidden.
				</p>
			</div>

			<!-- ═══════════════════════════════════════════════════════ -->
			<!-- Discord Role Sync Section -->
			<!-- ═══════════════════════════════════════════════════════ -->
			{#if data.discordGuildId}
				<div class="section-divider"></div>
				<h2 class="section-title">Discord Role Sync</h2>
				<p class="section-desc">
					Automatically assign site roles based on Discord server roles. When a user logs in via Discord, their server roles are checked against the mappings below. The first matching role determines their site access level.
				</p>

				{#if !canFetchRoles && data.discordConnectionError}
					<div class="discord-status discord-status--error">
						Cannot fetch Discord roles. Ensure the bot is in the server and has permissions.
					</div>
				{/if}

				<!-- Enable Role Sync -->
				<div class="form-group">
					<label class="form-label checkbox-label">
						<input
							type="checkbox"
							name="discordRoleSyncEnabled"
							bind:checked={roleSyncEnabled}
						/>
						<span>Enable Role Sync</span>
					</label>
					<p class="form-help">
						When enabled, site membership roles are automatically managed based on the role mappings below. The <code>OWNER_DISCORD_ID</code> user is never affected by role sync.
					</p>
				</div>

				<!-- Role Mappings -->
				{#if roleSyncEnabled}
					<div class="form-group">
						<span class="form-label">Role Mappings</span>
						<p class="form-help" style="margin-bottom: 0.75rem;">
							Map Discord server roles to site access levels. The first matching Discord role (by order) determines the user's site role.
						</p>

						<div class="role-mappings-list">
							{#each roleMappings as mapping, i (i)}
								<div class="role-mapping-row">
									<select
										class="form-input mapping-select"
										value={mapping.discordRoleId}
										onchange={(e) => updateMapping(i, 'discordRoleId', (e.target as HTMLSelectElement).value)}
									>
										<option value="">— Select Discord Role —</option>
										{#if canFetchRoles && guildRoles}
											{#each guildRoles as role}
												<option value={role.id}>
													{role.name}
												</option>
											{/each}
										{/if}
									</select>

									<span class="mapping-arrow">→</span>

									<select
										class="form-input mapping-select"
										value={mapping.siteRole}
										onchange={(e) => updateMapping(i, 'siteRole', (e.target as HTMLSelectElement).value)}
									>
										{#each siteRoles as sr}
											<option value={sr.value}>{sr.label}</option>
										{/each}
									</select>

									<button
										type="button"
										class="mapping-remove-btn"
										onclick={() => removeMapping(i)}
										title="Remove this mapping"
									>
										✕
									</button>
								</div>
							{/each}

							{#if roleMappings.length === 0}
								<p class="form-help" style="color: #999; font-style: italic;">
									No role mappings configured. Click "Add Mapping" to create one.
								</p>
							{/if}
						</div>

						<button
							type="button"
							class="add-mapping-btn"
							onclick={addMapping}
						>
							+ Add Mapping
						</button>
					</div>
				{/if}

				<!-- Hidden field: serialized role mappings for form submission -->
				<input type="hidden" name="discordRoleMappings" value={roleMappingsJson} />
			{:else}
				<div class="section-divider"></div>
				<h2 class="section-title">Discord Role Sync</h2>
				<p class="form-help" style="color: #888;">
					Configure a Discord Server ID above to enable role sync.
				</p>
			{/if}

			<!-- Submit -->
			<div class="form-actions">
				<button
					type="submit"
					class="save-btn save-btn--draft"
					formaction="?/saveDraft"
					disabled={saving}
				>
					{#if saving}
						<span class="spinner"></span>
						Saving…
					{:else}
						Save Draft
					{/if}
				</button>
				<button
					type="submit"
					class="save-btn"
					formaction="?/publish"
					disabled={saving}
				>
					{#if saving}
						<span class="spinner"></span>
						Publishing…
					{:else}
						🗸 Publish
					{/if}
				</button>
			</div>
		</fieldset>
	</form>
</div>

<style>
	.settings-page {
		max-width: 560px;
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

	/* ── Section Divider ─────────────────────────────────────────── */
	.section-divider {
		border-top: 1px solid #e0e0e6;
		margin: 1.5rem 0;
	}

	.section-title {
		font-size: 1.1rem;
		font-weight: 600;
		color: #1a1a2e;
		margin: 0 0 0.25rem;
	}

	.section-desc {
		color: #666;
		margin: 0 0 1.25rem;
		font-size: 0.85rem;
	}

	/* ── Discord Status ──────────────────────────────────────────── */
	.discord-status {
		margin-top: 0.5rem;
		padding: 0.4rem 0.75rem;
		border-radius: 5px;
		font-size: 0.8rem;
		font-weight: 500;
	}

	.discord-status--connected {
		background: #daf5e0;
		color: #1a6b30;
		border: 1px solid #a3d9b1;
	}

	.discord-status--error {
		background: #fde8e8;
		color: #9b1c1c;
		border: 1px solid #f4b2b2;
	}

	.discord-status--pending {
		background: #fef3c7;
		color: #92400e;
		border: 1px solid #fcd34d;
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

	/* ── Form ───────────────────────────────────────────────────── */
	.settings-form fieldset {
		border: none;
		padding: 0;
		margin: 0;
	}

	.form-group {
		margin-bottom: 1.25rem;
	}

	.form-label {
		display: block;
		font-weight: 600;
		font-size: 0.875rem;
		margin-bottom: 0.35rem;
		color: #1a1a2e;
	}

	.required {
		color: #e5534b;
	}

	.form-input {
		width: 100%;
		padding: 0.6rem 0.75rem;
		font-size: 0.925rem;
		border: 1px solid #d0d0d6;
		border-radius: 6px;
		background: #fff;
		color: #1a1a2e;
		transition: border-color 0.15s, box-shadow 0.15s;
		box-sizing: border-box;
	}

	.form-input:focus {
		outline: none;
		border-color: #58a6ff;
		box-shadow: 0 0 0 3px rgba(88, 166, 255, 0.2);
	}

	.form-input:disabled {
		background: #f5f5f7;
		color: #999;
	}

	.form-help {
		font-size: 0.8rem;
		color: #888;
		margin: 0.3rem 0 0;
	}

	/* ── Checkbox ───────────────────────────────────────────────── */
	.checkbox-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
	}

	.checkbox-label input[type='checkbox'] {
		width: 16px;
		height: 16px;
	}

	/* ── Actions ────────────────────────────────────────────────── */
	.form-actions {
		margin-top: 1.75rem;
		padding-top: 1.25rem;
		border-top: 1px solid #e0e0e6;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.save-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.65rem 1.5rem;
		font-size: 0.9rem;
		font-weight: 600;
		color: #fff;
		background: #1a7f37;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		transition: background 0.15s, opacity 0.15s;
	}

	.save-btn:hover {
		background: #14682c;
	}

	.save-btn:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}

	.save-btn--draft {
		background: #555;
	}

	.save-btn--draft:hover {
		background: #444;
	}

	/* Simple CSS spinner */
	.spinner {
		display: inline-block;
		width: 14px;
		height: 14px;
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

	/* ── Role Mappings ───────────────────────────────────────────── */
	.role-mappings-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-bottom: 0.75rem;
	}

	.role-mapping-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.mapping-select {
		flex: 1;
		min-width: 0;
	}

	.mapping-arrow {
		font-weight: 600;
		color: #888;
		flex-shrink: 0;
	}

	.mapping-remove-btn {
		flex-shrink: 0;
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		border: 1px solid #d0d0d6;
		border-radius: 6px;
		background: #fff;
		color: #999;
		cursor: pointer;
		font-size: 0.9rem;
		transition: color 0.15s, border-color 0.15s, background 0.15s;
	}

	.mapping-remove-btn:hover {
		color: #e5534b;
		border-color: #e5534b;
		background: #fef2f2;
	}

	.add-mapping-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.45rem 1rem;
		font-size: 0.825rem;
		font-weight: 600;
		color: #58a6ff;
		background: #f0f6ff;
		border: 1px dashed #58a6ff;
		border-radius: 6px;
		cursor: pointer;
		transition: background 0.15s;
	}

	.add-mapping-btn:hover {
		background: #e0edff;
	}
</style>
