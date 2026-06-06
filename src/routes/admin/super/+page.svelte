<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { enhance } from '$app/forms';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	/** Whether the create site form card is expanded */
	let showCreateForm = $state(false);
	/** Feedback message shown as a toast */
	let feedback = $state<{ type: 'success' | 'error'; message: string } | null>(null);
	/** Whether a form is currently being submitted */
	let saving = $state(false);

	// ─── Drill-down state ──────────────────────────────────────────
	let selectedSiteId = $state<string | null>(null);
	let siteDetails = $state<Record<string, unknown> | null>(null);
	let detailsLoading = $state(false);
	let flagSaving = $state(false);

	// ─── Clone state ───────────────────────────────────────────────
	/** Source site ID when cloning; null means fresh create */
	let cloneSourceId = $state<string | null>(null);
	/** Source site name used to pre-fill the create form */
	let cloneSourceName = $state<string>('');

	// ─── Bulk selection state ──────────────────────────────────────
	/** Set of selected site IDs for bulk operations */
	let selectedIds = $state<Set<string>>(new Set());
	/** Whether a bulk action is being submitted */
	let bulkSaving = $state(false);

	// Watch for form action results and update feedback
	$effect(() => {
		if (form) {
			saving = false;
			detailsLoading = false;
			flagSaving = false;

			if (form.success) {
				if (form.action === 'createSite') {
					feedback = {
						type: 'success',
						message: 'Site created successfully. Remember to configure the Coolify environment variables.'
					};
					showCreateForm = false;
					cloneSourceId = null;
					cloneSourceName = '';
					window.location.reload();
				} else if (form.action === 'cloneSite') {
					feedback = {
						type: 'success',
						message: 'Site cloned successfully. Remember to configure the Coolify environment variables.'
					};
					showCreateForm = false;
					cloneSourceId = null;
					cloneSourceName = '';
					window.location.reload();
				} else if (form.action === 'toggleActive') {
					feedback = { type: 'success', message: 'Site status toggled.' };
					window.location.reload();
				} else if (form.action === 'loadSiteDetails') {
					const raw = form as Record<string, unknown>;
					if (raw.details) {
						siteDetails = raw.details as Record<string, unknown>;
					}
				} else if (form.action === 'saveFeatureFlags') {
					feedback = { type: 'success', message: 'Feature flags saved.' };
				} else if (form.action === 'bulkToggleActive') {
					const raw = form as Record<string, unknown>;
					feedback = { type: 'success', message: `Updated ${raw.count ?? '?'} site(s).` };
					selectedIds = new Set();
					window.location.reload();
				} else {
					feedback = { type: 'success', message: 'Action completed.' };
				}
			} else if (form.error) {
				feedback = { type: 'error', message: form.error };
			}
		}
	});

	function formatDate(date: Date | string): string {
		const d = typeof date === 'string' ? new Date(date) : date;
		return d.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	function formatRelative(date: Date | string): string {
		const d = typeof date === 'string' ? new Date(date) : date;
		const now = new Date();
		const diffMs = now.getTime() - d.getTime();
		const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

		if (diffDays === 0) return 'Today';
		if (diffDays === 1) return 'Yesterday';
		if (diffDays < 30) return `${diffDays} days ago`;
		if (diffDays < 365) {
			const months = Math.floor(diffDays / 30);
			return `${months} month${months > 1 ? 's' : ''} ago`;
		}
		const years = Math.floor(diffDays / 365);
		return `${years} year${years > 1 ? 's' : ''} ago`;
	}

	function formatSize(bytes: number | null | undefined): string {
		if (bytes == null) return '\u2014';
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	}

	function formatDateTime(date: Date | string): string {
		const d = typeof date === 'string' ? new Date(date) : date;
		return d.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		});
	}

	function dismissFeedback() {
		feedback = null;
	}

	function viewSite(siteId: string) {
		selectedSiteId = siteId;
		siteDetails = null;
		detailsLoading = true;
	}

	function closePanel() {
		selectedSiteId = null;
		siteDetails = null;
	}

	// ─── Bulk selection helpers ────────────────────────────────────

	/** Toggle all visible sites on/off */
	function toggleSelectAll() {
		if (selectedIds.size === data.sites.length) {
			selectedIds = new Set();
		} else {
			selectedIds = new Set(data.sites.map((s) => s.id));
		}
	}

	/** Toggle a single site ID in/out of the selection set */
	function toggleSite(id: string) {
		const next = new Set(selectedIds);
		if (next.has(id)) {
			next.delete(id);
		} else {
			next.add(id);
		}
		selectedIds = next;
	}
</script>

<svelte:head>
	<title>Super Admin Dashboard \u2014 The Collective Hub</title>
</svelte:head>

<div class="super-page">
	<div class="page-header">
		<h1 class="page-title">Super Admin Dashboard</h1>
		<p class="page-desc">Manage all sites across The Collective Hub from one central location.</p>
	</div>

	{#if feedback}
		<div
			class="feedback-toast"
			class:feedback-toast--success={feedback.type === 'success'}
			class:feedback-toast--error={feedback.type === 'error'}
			role="alert"
		>
			<span class="feedback-icon">
				{#if feedback.type === 'success'}
					\u2713
				{:else}
					\u26A0
				{/if}
			</span>
			<span class="feedback-message">{feedback.message}</span>
			<button class="feedback-dismiss" onclick={dismissFeedback} aria-label="Dismiss">&times;</button>
		</div>
	{/if}

	<!-- Create Site Card -->
	<div class="create-card">
		<button
			class="create-card-toggle"
			onclick={() => (showCreateForm = !showCreateForm)}
			aria-expanded={showCreateForm}
		>
			<span class="create-card-icon">{showCreateForm ? '\u25BE' : '\u25B8'}</span>
			<span>Create New Site</span>
		</button>

		{#if showCreateForm}
			<div class="create-card-body">
				<form
					method="POST"
					action={cloneSourceId ? '?/cloneSite' : '?/createSite'}
					use:enhance={() => {
						saving = true;
						feedback = null;
					}}
				>
					<fieldset disabled={saving}>
						{#if cloneSourceId}
							<input type="hidden" name="sourceSiteId" value={cloneSourceId} />
							<div class="clone-banner">
								\uD83D\uDCCB Cloning from <strong>{cloneSourceName}</strong>. Settings will be copied to the new site.
							</div>
						{/if}
						<div class="form-row">
							<div class="form-group">
								<label for="siteName" class="form-label">
									Site Name <span class="required">*</span>
								</label>
								<input
									type="text"
									id="siteName"
									name="name"
									class="form-input"
									required
									maxlength={100}
									placeholder="My Collective Site"
									value={cloneSourceName ? `${cloneSourceName} (Clone)` : ''}
								/>
								<p class="form-help">The display name for this site (e.g. "The Collective Hub").</p>
							</div>

							<div class="form-group">
								<label for="siteSlug" class="form-label">
									Site Slug <span class="required">*</span>
								</label>
								<input
									type="text"
									id="siteSlug"
									name="slug"
									class="form-input form-input--mono"
									required
									maxlength={50}
									pattern="[a-z0-9-]+"
									placeholder="my-collective-site"
									oninput={(e) => {
										const input = e.currentTarget as HTMLInputElement;
										input.value = input.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
									}}
								/>
								<p class="form-help">
									Used for the SITE_SLUG env var. Lowercase letters, numbers, and hyphens only.
								</p>
							</div>
						</div>

						<div class="form-actions">
							<button type="submit" class="create-btn" disabled={saving}>
								{#if saving}
									<span class="spinner"></span>
									{cloneSourceId ? 'Cloning\u2026' : 'Creating\u2026'}
								{:else if cloneSourceId}
									Clone Site
								{:else}
									Create Site
								{/if}
							</button>
							<button
								type="button"
								class="cancel-btn"
								onclick={() => {
									showCreateForm = false;
									cloneSourceId = null;
									cloneSourceName = '';
								}}
								disabled={saving}
							>
								Cancel
							</button>
						</div>
					</fieldset>
				</form>

				<div class="setup-instructions">
					<h3 class="setup-title">After creating a site, configure these Coolify environment variables:</h3>
					<div class="setup-grid">
						<div class="setup-section">
							<h4 class="setup-subtitle">Per-Deployment Variables</h4>
							<ul class="setup-list">
								<li>
									<code>SITE_SLUG</code>
									<span class="setup-desc">\u2014 The slug you chose above</span>
								</li>
								<li>
									<code>PUBLIC_SITE_URL</code>
									<span class="setup-desc">\u2014 The full public URL for this deployment</span>
								</li>
								<li>
									<code>OWNER_DISCORD_ID</code>
									<span class="setup-desc">\u2014 Discord user ID of the site owner</span>
								</li>
							</ul>
						</div>
						<div class="setup-section">
							<h4 class="setup-subtitle">Deployment Settings</h4>
							<ul class="setup-list">
								<li>
									<code>RUN_MIGRATIONS</code>
									<span class="setup-desc">\u2014 Set to <strong>false</strong> on all but one deployment</span>
								</li>
							</ul>
							<h4 class="setup-subtitle" style="margin-top: 0.75rem;">Shared Variables</h4>
							<ul class="setup-list">
								<li>
									<code>DATABASE_URL</code>
									<span class="setup-desc">\u2014 Same across all deployments</span>
								</li>
								<li>
									<code>BETTER_AUTH_SECRET</code>
									<span class="setup-desc">\u2014 Same across all deployments</span>
								</li>
								<li>
									<code>DISCORD_CLIENT_ID</code> / <code>DISCORD_CLIENT_SECRET</code>
									<span class="setup-desc">\u2014 Same Discord app credentials</span>
								</li>
								<li>
									<code>SUPER_ADMIN_DISCORD_IDS</code>
									<span class="setup-desc">\u2014 Comma-separated Discord IDs for super admin access</span>
								</li>
							</ul>
						</div>
					</div>
				</div>
			</div>
		{/if}
	</div>

	<!-- Sites Table -->
	<div class="sites-section">
		<h2 class="section-title">
			All Sites
			<span class="section-count">{data.sites.length}</span>
		</h2>

		<!-- Cross-Site Search -->
		<form method="GET" action="." class="search-form">
			<div class="search-input-wrapper">
				<span class="search-icon" aria-hidden="true">🔍</span>
				<input
					type="text"
					name="search"
					class="search-input"
					placeholder="Search by site name or slug..."
					value={data.search ?? ''}
				/>
				{#if data.search}
					<a href="." class="search-clear" aria-label="Clear search">&times;</a>
				{/if}
			</div>
		</form>

		{#if data.sites.length === 0}
			<div class="empty-state">
				<p class="empty-icon">\uD83D\uDCED</p>
				<p class="empty-text">No sites found. Create your first site above.</p>
			</div>
		{:else}
			<div class="table-wrapper">
				<table class="sites-table">
					<thead>
						<tr>
							<th class="col-check">
								<input
									type="checkbox"
									class="row-checkbox"
									checked={selectedIds.size === data.sites.length && data.sites.length > 0}
									onchange={toggleSelectAll}
									aria-label="Select all sites"
								/>
							</th>
							<th>Site Name</th>
							<th>Slug</th>
							<th>Status</th>
							<th class="col-num">Events</th>
							<th class="col-num">Assets</th>
							<th>Settings</th>
							<th>Created</th>
							<th>Actions</th>
						</tr>
					</thead>
					<tbody>
						{#each data.sites as site}
							<tr class:site-inactive={!site.isActive} class:site-selected={selectedSiteId === site.id}>
								<td class="col-check">
									<input
										type="checkbox"
										class="row-checkbox"
										checked={selectedIds.has(site.id)}
										onchange={() => toggleSite(site.id)}
										aria-label="Select {site.name}"
									/>
								</td>
								<td class="col-name">
									<span class="site-name">{site.name}</span>
								</td>
								<td class="col-slug">
									<code class="slug-code">{site.slug}</code>
								</td>
								<td class="col-status">
									{#if site.isActive}
										<span class="badge badge--active">Active</span>
									{:else}
										<span class="badge badge--inactive">Inactive</span>
									{/if}
								</td>
								<td class="col-num">{site.eventCount}</td>
								<td class="col-num">{site.assetCount}</td>
								<td class="col-settings">
									{#if site.hasSettings}
										<span class="checkmark">\u2713</span>
									{:else}
										<span class="dimmed">\u2014</span>
									{/if}
								</td>
								<td class="col-date" title={formatDate(site.createdAt)}>
									{formatRelative(site.createdAt)}
								</td>
								<td class="col-actions">
									<div class="action-group">
										<form
											method="POST"
											action="?/loadSiteDetails"
											use:enhance={() => {
												viewSite(site.id);
											}}
											class="inline-form"
										>
											<input type="hidden" name="siteId" value={site.id} />
											<button
												type="submit"
												class="view-btn"
												disabled={detailsLoading && selectedSiteId === site.id}
											>
												{#if detailsLoading && selectedSiteId === site.id}
													<span class="spinner spinner--small"></span>
												{:else}
													\uD83D\uDD0D View
												{/if}
											</button>
										</form>

										<form
											method="POST"
											action="?/toggleActive"
											use:enhance
											class="inline-form"
										>
											<input type="hidden" name="siteId" value={site.id} />
											<button
												type="submit"
												class="toggle-btn"
												class:toggle-btn--deactivate={site.isActive}
												class:toggle-btn--activate={!site.isActive}
											>
												{#if site.isActive}
													Deactivate
												{:else}
													Activate
												{/if}
											</button>
										</form>

										<button
											type="button"
											class="clone-btn"
											title="Clone this site's settings"
											onclick={() => {
												cloneSourceId = site.id;
												cloneSourceName = site.name;
												showCreateForm = true;
												// Scroll to the create form
												document.querySelector('.create-card')?.scrollIntoView({ behavior: 'smooth' });
											}}
										>
											\uD83D\uDCCB Clone
										</button>
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}

		<!-- Drill-Down Panel -->
		{#if selectedSiteId && siteDetails}
			{@const d = siteDetails}
			{@const site = d.site as Record<string, unknown> | undefined}
			{@const settings = d.settings as Record<string, unknown> | undefined}
			{@const eventList = d.events as Array<Record<string, unknown>> | undefined}
			{@const assetList = d.assets as Array<Record<string, unknown>> | undefined}
			{@const navList = d.navLinks as Array<Record<string, unknown>> | undefined}
			{@const socialList = d.socialLinks as Array<Record<string, unknown>> | undefined}
			{@const memberList = d.members as Array<Record<string, unknown>> | undefined}
			{@const flags = settings?.featureFlags as Record<string, boolean> | undefined}

			<div class="drilldown-panel">
				<div class="drilldown-header">
					<div class="drilldown-title-row">
						<h2 class="drilldown-title">\uD83D\uDCCB {site?.name ?? 'Site'} Details</h2>
						<span class="drilldown-slug"><code>{site?.slug ?? ''}</code></span>
						{#if site?.isActive}
							<span class="badge badge--active">Active</span>
						{:else}
							<span class="badge badge--inactive">Inactive</span>
						{/if}
					</div>
					<button class="drilldown-close" onclick={closePanel} aria-label="Close panel">&times;</button>
				</div>

				<div class="drilldown-body">
					<!-- Site Info -->
					<section class="drilldown-section">
						<h3 class="drilldown-section-title">Site Information</h3>
						<div class="info-grid">
							<div class="info-item">
								<span class="info-label">Name</span>
								<span class="info-value">{site?.name ?? '\u2014'}</span>
							</div>
							<div class="info-item">
								<span class="info-label">Slug</span>
								<span class="info-value"><code>{site?.slug ?? '\u2014'}</code></span>
							</div>
							<div class="info-item">
								<span class="info-label">Status</span>
								<span class="info-value">{site?.isActive ? 'Active' : 'Inactive'}</span>
							</div>
							<div class="info-item">
								<span class="info-label">Created</span>
								<span class="info-value">{site?.createdAt ? formatDate(site.createdAt as string) : '\u2014'}</span>
							</div>
							<div class="info-item">
								<span class="info-label">Updated</span>
								<span class="info-value">{site?.updatedAt ? formatDate(site.updatedAt as string) : '\u2014'}</span>
							</div>
						</div>
					</section>

					<!-- Feature Flags -->
					<section class="drilldown-section">
						<h3 class="drilldown-section-title">\u2699\uFE0F Feature Flags</h3>
						<p class="drilldown-section-help">
							Toggle which features are available for this site. Unchecked features are hidden from the admin panel and public pages.
						</p>

						<form
							method="POST"
							action="?/saveFeatureFlags"
							use:enhance={() => {
								flagSaving = true;
								feedback = null;
							}}
						>
							<input type="hidden" name="siteId" value={selectedSiteId} />
							<fieldset disabled={flagSaving} class="flag-fieldset">
								<div class="flag-grid">
									<label class="flag-item">
										<input
											type="checkbox"
											name="flag_events"
											checked={flags?.events !== false}
											class="flag-checkbox"
										/>
										<span class="flag-label">
											<span class="flag-name">Events</span>
											<span class="flag-desc">Event calendar & scheduling</span>
										</span>
									</label>

									<label class="flag-item">
										<input
											type="checkbox"
											name="flag_navLinks"
											checked={flags?.navLinks !== false}
											class="flag-checkbox"
										/>
										<span class="flag-label">
											<span class="flag-name">Nav Links</span>
											<span class="flag-desc">Custom header/footer navigation</span>
										</span>
									</label>

									<label class="flag-item">
										<input
											type="checkbox"
											name="flag_socialLinks"
											checked={flags?.socialLinks !== false}
											class="flag-checkbox"
										/>
										<span class="flag-label">
											<span class="flag-name">Social Links</span>
											<span class="flag-desc">Social media link buttons</span>
										</span>
									</label>

									<label class="flag-item">
										<input
											type="checkbox"
											name="flag_branding"
											checked={flags?.branding !== false}
											class="flag-checkbox"
										/>
										<span class="flag-label">
											<span class="flag-name">Branding</span>
											<span class="flag-desc">Logo, colors & theme</span>
										</span>
									</label>

									<label class="flag-item">
										<input
											type="checkbox"
											name="flag_homepageEditor"
											checked={flags?.homepageEditor !== false}
											class="flag-checkbox"
										/>
										<span class="flag-label">
											<span class="flag-name">Homepage Editor</span>
											<span class="flag-desc">Customize homepage content</span>
										</span>
									</label>

									<label class="flag-item">
										<input
											type="checkbox"
											name="flag_assetLibrary"
											checked={flags?.assetLibrary !== false}
											class="flag-checkbox"
										/>
										<span class="flag-label">
											<span class="flag-name">Asset Library</span>
											<span class="flag-desc">Upload & manage images</span>
										</span>
									</label>
								</div>

								<div class="flag-actions">
									<button type="submit" class="save-flags-btn" disabled={flagSaving}>
										{#if flagSaving}
											<span class="spinner spinner--small"></span>
											Saving\u2026
										{:else}
											Save Feature Flags
										{/if}
									</button>
								</div>
							</fieldset>
						</form>
					</section>

					<!-- Settings Summary -->
					<section class="drilldown-section">
						<h3 class="drilldown-section-title">\uD83D\uDEE0\uFE0F Settings Summary</h3>
						{#if settings}
							<div class="settings-summary">
								<div class="settings-row">
									<span class="settings-key">Branding:</span>
									<span class="settings-val">
										{settings.branding ? 'Configured' : 'Not configured'}
										{#if settings.branding}
											{@const b = settings.branding as Record<string, unknown>}
											<span class="settings-detail"> \u2014 {b.siteName ?? 'Unnamed'}</span>
										{/if}
									</span>
								</div>
								<div class="settings-row">
									<span class="settings-key">Theme:</span>
									<span class="settings-val">
										{settings.theme ? 'Configured' : 'Not configured'}
										{#if settings.theme}
											{@const t = settings.theme as Record<string, unknown>}
											<span class="settings-detail"> \u2014 {t.preset ?? 'custom'}</span>
										{/if}
									</span>
								</div>
								<div class="settings-row">
									<span class="settings-key">Homepage:</span>
									<span class="settings-val">
										{settings.homepage ? 'Configured' : 'Not configured'}
									</span>
								</div>
								<div class="settings-row">
									<span class="settings-key">Layout:</span>
									<span class="settings-val">
										{settings.layout ? 'Configured' : 'Not configured'}
									</span>
								</div>
							</div>
						{:else}
							<p class="drilldown-empty">No settings found for this site.</p>
						{/if}
					</section>

					<!-- Events -->
					<section class="drilldown-section">
						<h3 class="drilldown-section-title">
							\uD83D\uDCC5 Events
							<span class="section-count">{eventList?.length ?? 0}</span>
						</h3>
						{#if eventList && eventList.length > 0}
							<div class="compact-table-wrapper">
								<table class="compact-table">
									<thead>
										<tr>
											<th>Title</th>
											<th>Start Time</th>
											<th>Status</th>
										</tr>
									</thead>
									<tbody>
										{#each eventList as ev}
											<tr>
												<td>{ev.title ?? 'Untitled'}</td>
												<td class="col-date">{ev.startTime ? formatDateTime(ev.startTime as string) : '\u2014'}</td>
												<td>
													{#if ev.isPublished}
														<span class="badge badge--active">Published</span>
													{:else}
														<span class="badge badge--inactive">Draft</span>
													{/if}
												</td>
											</tr>
										{/each}
									</tbody>
								</table>
							</div>
						{:else}
							<p class="drilldown-empty">No events found.</p>
						{/if}
					</section>

					<!-- Assets -->
					<section class="drilldown-section">
						<h3 class="drilldown-section-title">
							\uD83D\uDDBC\uFE0F Assets
							<span class="section-count">{assetList?.length ?? 0}</span>
						</h3>
						{#if assetList && assetList.length > 0}
							<div class="compact-table-wrapper">
								<table class="compact-table">
									<thead>
										<tr>
											<th>Filename</th>
											<th>Type</th>
											<th>Size</th>
											<th>CDN URL</th>
										</tr>
									</thead>
									<tbody>
										{#each assetList as a}
											<tr>
												<td class="col-filename">{a.filename ?? '\u2014'}</td>
												<td><code>{a.type ?? '\u2014'}</code></td>
												<td>{formatSize(a.size as number | null)}</td>
												<td class="col-url">
													{#if a.cdnUrl}
														<a href={a.cdnUrl as string} target="_blank" rel="noopener" class="cdn-link">
															View \u2197
														</a>
													{:else}
														<span class="dimmed">\u2014</span>
													{/if}
												</td>
											</tr>
										{/each}
									</tbody>
								</table>
							</div>
						{:else}
							<p class="drilldown-empty">No assets found.</p>
						{/if}
					</section>

					<!-- Nav Links -->
					<section class="drilldown-section">
						<h3 class="drilldown-section-title">
							\uD83D\uDD17 Nav Links
							<span class="section-count">{navList?.length ?? 0}</span>
						</h3>
						{#if navList && navList.length > 0}
							<div class="compact-table-wrapper">
								<table class="compact-table">
									<thead>
										<tr>
											<th>Label</th>
											<th>URL</th>
											<th>Position</th>
											<th>External</th>
										</tr>
									</thead>
									<tbody>
										{#each navList as nl}
											<tr>
												<td>{nl.label ?? '\u2014'}</td>
												<td class="col-url"><code>{nl.url ?? '\u2014'}</code></td>
												<td><code>{nl.position ?? '\u2014'}</code></td>
												<td>{nl.isExternal ? '\u2713' : '\u2014'}</td>
											</tr>
										{/each}
									</tbody>
								</table>
							</div>
						{:else}
							<p class="drilldown-empty">No nav links found.</p>
						{/if}
					</section>

					<!-- Social Links -->
					<section class="drilldown-section">
						<h3 class="drilldown-section-title">
							\uD83D\uDCF1 Social Links
							<span class="section-count">{socialList?.length ?? 0}</span>
						</h3>
						{#if socialList && socialList.length > 0}
							<div class="compact-table-wrapper">
								<table class="compact-table">
									<thead>
										<tr>
											<th>Platform</th>
											<th>Label</th>
											<th>URL</th>
										</tr>
									</thead>
									<tbody>
										{#each socialList as sl}
											<tr>
												<td><code>{sl.platform ?? '\u2014'}</code></td>
												<td>{sl.label ?? '\u2014'}</td>
												<td class="col-url"><code>{sl.url ?? '\u2014'}</code></td>
											</tr>
										{/each}
									</tbody>
								</table>
							</div>
						{:else}
							<p class="drilldown-empty">No social links found.</p>
						{/if}
					</section>

					<!-- Members -->
					<section class="drilldown-section">
						<h3 class="drilldown-section-title">
							\uD83D\uDC65 Members
							<span class="section-count">{memberList?.length ?? 0}</span>
						</h3>
						{#if memberList && memberList.length > 0}
							<div class="compact-table-wrapper">
								<table class="compact-table">
									<thead>
										<tr>
											<th>Username</th>
											<th>Role</th>
										</tr>
									</thead>
									<tbody>
										{#each memberList as m}
											<tr>
												<td>{m.discordUsername ?? 'Unknown'}</td>
												<td>
													<span class="role-badge" class:role-owner={m.role === 'owner'} class:role-admin={m.role === 'admin'} class:role-editor={m.role === 'editor'}>
														{m.role ?? '\u2014'}
													</span>
												</td>
											</tr>
										{/each}
									</tbody>
								</table>
							</div>
						{:else}
							<p class="drilldown-empty">No members found.</p>
						{/if}
					</section>
				</div>
			</div>
		{/if}

		<!-- Bulk Action Bar -->
		{#if selectedIds.size > 0}
			<div class="bulk-bar">
				<div class="bulk-bar-status">
					<span class="bulk-indicator">{selectedIds.size} site{selectedIds.size === 1 ? '' : 's'} selected</span>
				</div>
				<div class="bulk-bar-actions">
					<form
						method="POST"
						action="?/bulkToggleActive"
						use:enhance={() => {
							bulkSaving = true;
							feedback = null;
						}}
						class="bulk-form"
					>
						<input type="hidden" name="siteIds" value={[...selectedIds].join(',')} />
						<input type="hidden" name="isActive" value="true" />
						<button type="submit" class="bulk-btn bulk-btn--activate" disabled={bulkSaving}>
							{#if bulkSaving}
								<span class="spinner spinner--small"></span>
							{/if}
							Activate Selected
						</button>
					</form>
					<form
						method="POST"
						action="?/bulkToggleActive"
						use:enhance={() => {
							bulkSaving = true;
							feedback = null;
						}}
						class="bulk-form"
					>
						<input type="hidden" name="siteIds" value={[...selectedIds].join(',')} />
						<input type="hidden" name="isActive" value="false" />
						<button type="submit" class="bulk-btn bulk-btn--deactivate" disabled={bulkSaving}>
							{#if bulkSaving}
								<span class="spinner spinner--small"></span>
							{/if}
							Deactivate Selected
						</button>
					</form>
				</div>
			</div>
		{/if}

		<p class="admin-note">
			\uD83D\uDCA1 To manage a different site's admin panel, visit that site's deployment URL and navigate to
			<code>/admin</code>. Each deployment runs its own admin panel scoped to that site.
		</p>
	</div>
</div>

<style>
	.super-page {
		max-width: 960px;
	}

	.page-header {
		margin-bottom: 1.5rem;
	}

	.page-title {
		font-size: 1.5rem;
		font-weight: 700;
		margin: 0 0 0.25rem;
		color: #1a1a2e;
	}

	.page-desc {
		color: #666;
		margin: 0;
		font-size: 0.925rem;
	}

	/* Feedback Toast */
	.feedback-toast {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.7rem 1rem;
		border-radius: 6px;
		margin-bottom: 1.25rem;
		font-size: 0.875rem;
		font-weight: 500;
	}

	.feedback-toast--success {
		background: #daf5e0;
		color: #1a6b30;
		border: 1px solid #a3d9b1;
	}

	.feedback-toast--error {
		background: #fde8e8;
		color: #9b1c1c;
		border: 1px solid #f4b2b2;
	}

	.feedback-icon {
		flex-shrink: 0;
	}

	.feedback-message {
		flex: 1;
	}

	.feedback-dismiss {
		flex-shrink: 0;
		background: none;
		border: none;
		font-size: 1.25rem;
		line-height: 1;
		cursor: pointer;
		color: inherit;
		opacity: 0.6;
		padding: 0 0.25rem;
	}

	.feedback-dismiss:hover {
		opacity: 1;
	}

	/* Create Site Card */
	.create-card {
		background: #fff;
		border: 1px solid #d0d0d6;
		border-radius: 8px;
		margin-bottom: 2rem;
		overflow: hidden;
	}

	.create-card-toggle {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.85rem 1.25rem;
		background: #fafafa;
		border: none;
		border-bottom: 1px solid transparent;
		font-size: 0.95rem;
		font-weight: 600;
		color: #1a1a2e;
		cursor: pointer;
		text-align: left;
		transition: background 0.15s;
	}

	.create-card-toggle:hover {
		background: #f0f0f3;
	}

	.create-card-toggle[aria-expanded='true'] {
		border-bottom-color: #e0e0e6;
	}

	.create-card-icon {
		font-size: 0.8rem;
		width: 1.25rem;
		text-align: center;
		flex-shrink: 0;
	}

	.create-card-body {
		padding: 1.25rem;
	}

	.create-card-body fieldset {
		border: none;
		padding: 0;
		margin: 0;
	}

	/* Form */
	.form-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	@media (max-width: 640px) {
		.form-row {
			grid-template-columns: 1fr;
		}
	}

	.form-group {
		display: flex;
		flex-direction: column;
	}

	.form-label {
		font-weight: 600;
		font-size: 0.85rem;
		margin-bottom: 0.3rem;
		color: #1a1a2e;
	}

	.required {
		color: #e5534b;
	}

	.form-input {
		padding: 0.55rem 0.75rem;
		font-size: 0.9rem;
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

	.form-input--mono {
		font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace;
		font-size: 0.85rem;
	}

	.form-help {
		font-size: 0.75rem;
		color: #888;
		margin: 0.25rem 0 0;
	}

	.form-actions {
		display: flex;
		gap: 0.75rem;
		padding-top: 1rem;
		border-top: 1px solid #e0e0e6;
	}

	.create-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.6rem 1.5rem;
		font-size: 0.875rem;
		font-weight: 600;
		color: #fff;
		background: #1a7f37;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		transition: background 0.15s, opacity 0.15s;
	}

	.create-btn:hover {
		background: #14682c;
	}

	.create-btn:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}

	.cancel-btn {
		padding: 0.6rem 1.25rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: #555;
		background: #f0f0f3;
		border: 1px solid #d0d0d6;
		border-radius: 6px;
		cursor: pointer;
		transition: background 0.15s;
	}

	.cancel-btn:hover {
		background: #e0e0e6;
	}

	.cancel-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	/* Spinner */
	.spinner {
		display: inline-block;
		width: 14px;
		height: 14px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top-color: #fff;
		border-radius: 50%;
		animation: spin 0.6s linear infinite;
	}

	.spinner--small {
		width: 12px;
		height: 12px;
		border-width: 2px;
		border-color: rgba(88, 166, 255, 0.3);
		border-top-color: #58a6ff;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	/* Setup Instructions */
	.setup-instructions {
		margin-top: 1.5rem;
		padding: 1rem 1.25rem;
		background: #f8f9fb;
		border: 1px solid #e0e0e6;
		border-radius: 6px;
	}

	.setup-title {
		font-size: 0.875rem;
		font-weight: 700;
		color: #1a1a2e;
		margin: 0 0 0.75rem;
	}

	.setup-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}

	@media (max-width: 640px) {
		.setup-grid {
			grid-template-columns: 1fr;
		}
	}

	.setup-subtitle {
		font-size: 0.8rem;
		font-weight: 700;
		color: #555;
		margin: 0 0 0.4rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.setup-list {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.setup-list li {
		padding: 0.3rem 0;
		font-size: 0.825rem;
		color: #333;
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 0.25rem;
	}

	.setup-list code {
		font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace;
		font-size: 0.8rem;
		background: #e8e8ed;
		padding: 0.1rem 0.4rem;
		border-radius: 3px;
		color: #1a1a2e;
	}

	.setup-desc {
		color: #777;
		font-size: 0.8rem;
	}

	/* Sites Section */
	.sites-section {
		margin-top: 0.5rem;
	}

	.section-title {
		font-size: 1.15rem;
		font-weight: 700;
		color: #1a1a2e;
		margin: 0 0 1rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.section-count {
		font-size: 0.8rem;
		font-weight: 500;
		color: #888;
		background: #e8e8ed;
		padding: 0.15rem 0.55rem;
		border-radius: 10px;
	}

	/* Empty State */
	.empty-state {
		text-align: center;
		padding: 3rem 1.5rem;
		background: #fff;
		border: 1px solid #e0e0e6;
		border-radius: 8px;
	}

	.empty-icon {
		font-size: 2.5rem;
		margin: 0 0 0.75rem;
	}

	.empty-text {
		color: #888;
		font-size: 0.925rem;
		margin: 0;
	}

	/* Table */
	.table-wrapper {
		background: #fff;
		border: 1px solid #e0e0e6;
		border-radius: 8px;
		overflow-x: auto;
	}

	.sites-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.875rem;
	}

	.sites-table thead {
		background: #fafafa;
		border-bottom: 2px solid #e0e0e6;
	}

	.sites-table th {
		padding: 0.7rem 1rem;
		text-align: left;
		font-weight: 600;
		font-size: 0.8rem;
		color: #666;
		text-transform: uppercase;
		letter-spacing: 0.03em;
		white-space: nowrap;
	}

	.sites-table td {
		padding: 0.7rem 1rem;
		border-bottom: 1px solid #f0f0f3;
		color: #333;
		vertical-align: middle;
	}

	.sites-table tbody tr:last-child td {
		border-bottom: none;
	}

	.sites-table tbody tr:hover {
		background: #fafbfc;
	}

	.site-inactive td {
		opacity: 0.6;
	}

	.site-selected td {
		background: #f0f7ff;
	}

	.col-num {
		text-align: center !important;
		width: 80px;
	}

	.col-name {
		min-width: 160px;
	}

	.site-name {
		font-weight: 700;
		color: #1a1a2e;
	}

	.col-slug {
		min-width: 140px;
	}

	.slug-code {
		font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace;
		font-size: 0.8rem;
		background: #f0f0f3;
		padding: 0.15rem 0.5rem;
		border-radius: 4px;
		color: #555;
	}

	.col-settings {
		text-align: center;
		width: 80px;
	}

	.checkmark {
		color: #1a7f37;
		font-weight: 700;
	}

	.dimmed {
		color: #ccc;
	}

	.col-date {
		white-space: nowrap;
		color: #888;
		font-size: 0.825rem;
	}

	.col-actions {
		white-space: nowrap;
	}

	/* Action Group */
	.action-group {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	/* Badges */
	.badge {
		display: inline-block;
		padding: 0.2rem 0.6rem;
		border-radius: 12px;
		font-size: 0.75rem;
		font-weight: 600;
		letter-spacing: 0.02em;
		text-transform: uppercase;
		white-space: nowrap;
	}

	.badge--active {
		background: #daf5e0;
		color: #1a6b30;
	}

	.badge--inactive {
		background: #e8e8ed;
		color: #777;
	}

	/* Inline Forms & Action Buttons */
	.inline-form {
		display: inline;
	}

	.toggle-btn {
		padding: 0.35rem 0.75rem;
		font-size: 0.78rem;
		font-weight: 600;
		border-radius: 5px;
		border: 1px solid;
		cursor: pointer;
		transition: background 0.15s, color 0.15s, border-color 0.15s;
		white-space: nowrap;
	}

	.toggle-btn--deactivate {
		background: #fef3f2;
		color: #b42318;
		border-color: #fecaca;
	}

	.toggle-btn--deactivate:hover {
		background: #fde8e8;
	}

	.toggle-btn--activate {
		background: #ecfdf5;
		color: #065f46;
		border-color: #a7f3d0;
	}

	.toggle-btn--activate:hover {
		background: #d1fae5;
	}

	/* View Button */
	.view-btn {
		padding: 0.35rem 0.75rem;
		font-size: 0.78rem;
		font-weight: 600;
		border-radius: 5px;
		border: 1px solid #58a6ff;
		background: #f0f7ff;
		color: #1a6bc0;
		cursor: pointer;
		transition: background 0.15s, color 0.15s;
		white-space: nowrap;
	}

	.view-btn:hover {
		background: #dceeff;
		color: #0f5090;
	}

	.view-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	/* Clone Button */
	.clone-btn {
		padding: 0.35rem 0.75rem;
		font-size: 0.78rem;
		font-weight: 600;
		border-radius: 5px;
		border: 1px solid #a78bfa;
		background: #f5f3ff;
		color: #6d28d9;
		cursor: pointer;
		transition: background 0.15s, color 0.15s;
		white-space: nowrap;
	}

	.clone-btn:hover {
		background: #ede9fe;
		color: #5b21b6;
	}

	/* Clone Banner (shown inside create form when cloning) */
	.clone-banner {
		padding: 0.6rem 0.75rem;
		background: #f5f3ff;
		border: 1px solid #ddd6fe;
		border-radius: 6px;
		font-size: 0.825rem;
		color: #4c1d95;
		margin-bottom: 1rem;
	}

	.clone-banner strong {
		font-weight: 700;
	}

	/* Drill-Down Panel */
	.drilldown-panel {
		background: #fff;
		border: 1px solid #58a6ff;
		border-radius: 8px;
		margin-top: 1.5rem;
		overflow: hidden;
		box-shadow: 0 2px 12px rgba(88, 166, 255, 0.12);
	}

	.drilldown-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem 1.25rem;
		background: #f0f7ff;
		border-bottom: 1px solid #dceeff;
	}

	.drilldown-title-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.drilldown-title {
		font-size: 1.1rem;
		font-weight: 700;
		color: #1a1a2e;
		margin: 0;
	}

	.drilldown-slug code {
		font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace;
		font-size: 0.8rem;
		background: #e8e8ed;
		padding: 0.15rem 0.5rem;
		border-radius: 4px;
		color: #555;
	}

	.drilldown-close {
		flex-shrink: 0;
		background: none;
		border: none;
		font-size: 1.5rem;
		line-height: 1;
		cursor: pointer;
		color: #666;
		padding: 0 0.25rem;
		transition: color 0.15s;
	}

	.drilldown-close:hover {
		color: #1a1a2e;
	}

	.drilldown-body {
		padding: 1.25rem;
		max-height: 70vh;
		overflow-y: auto;
	}

	/* Drill-Down Sections */
	.drilldown-section {
		margin-bottom: 1.75rem;
		padding-bottom: 1.5rem;
		border-bottom: 1px solid #f0f0f3;
	}

	.drilldown-section:last-child {
		margin-bottom: 0;
		padding-bottom: 0;
		border-bottom: none;
	}

	.drilldown-section-title {
		font-size: 0.95rem;
		font-weight: 700;
		color: #1a1a2e;
		margin: 0 0 0.75rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.drilldown-section-help {
		font-size: 0.8rem;
		color: #888;
		margin: 0 0 0.75rem;
	}

	.drilldown-empty {
		color: #aaa;
		font-size: 0.85rem;
		font-style: italic;
		margin: 0;
	}

	/* Info Grid */
	.info-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
		gap: 0.75rem;
	}

	.info-item {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
	}

	.info-label {
		font-size: 0.72rem;
		font-weight: 600;
		color: #888;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.info-value {
		font-size: 0.875rem;
		color: #1a1a2e;
	}

	.info-value code {
		font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace;
		font-size: 0.8rem;
		background: #f0f0f3;
		padding: 0.1rem 0.4rem;
		border-radius: 3px;
	}

	/* Feature Flags */
	.flag-fieldset {
		border: none;
		padding: 0;
		margin: 0;
	}

	.flag-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
		gap: 0.6rem;
		margin-bottom: 1rem;
	}

	.flag-item {
		display: flex;
		align-items: flex-start;
		gap: 0.6rem;
		padding: 0.65rem 0.75rem;
		background: #fafafa;
		border: 1px solid #e8e8ed;
		border-radius: 6px;
		cursor: pointer;
		transition: background 0.15s, border-color 0.15s;
	}

	.flag-item:hover {
		background: #f0f0f3;
		border-color: #d0d0d6;
	}

	.flag-checkbox {
		flex-shrink: 0;
		margin-top: 0.1rem;
		width: 16px;
		height: 16px;
		cursor: pointer;
		accent-color: #58a6ff;
	}

	.flag-label {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
	}

	.flag-name {
		font-size: 0.85rem;
		font-weight: 600;
		color: #1a1a2e;
	}

	.flag-desc {
		font-size: 0.75rem;
		color: #888;
	}

	.flag-actions {
		padding-top: 0.5rem;
	}

	.save-flags-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.55rem 1.25rem;
		font-size: 0.85rem;
		font-weight: 600;
		color: #fff;
		background: #58a6ff;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		transition: background 0.15s, opacity 0.15s;
	}

	.save-flags-btn:hover {
		background: #3d8fef;
	}

	.save-flags-btn:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}

	/* Settings Summary */
	.settings-summary {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.settings-row {
		display: flex;
		align-items: baseline;
		gap: 0.5rem;
		font-size: 0.85rem;
	}

	.settings-key {
		font-weight: 600;
		color: #555;
		min-width: 90px;
	}

	.settings-val {
		color: #333;
	}

	.settings-detail {
		color: #888;
		font-size: 0.8rem;
	}

	/* Compact Tables */
	.compact-table-wrapper {
		overflow-x: auto;
		border: 1px solid #e8e8ed;
		border-radius: 6px;
	}

	.compact-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.8rem;
	}

	.compact-table thead {
		background: #fafafa;
		border-bottom: 1px solid #e0e0e6;
	}

	.compact-table th {
		padding: 0.5rem 0.75rem;
		text-align: left;
		font-weight: 600;
		font-size: 0.72rem;
		color: #888;
		text-transform: uppercase;
		letter-spacing: 0.03em;
		white-space: nowrap;
	}

	.compact-table td {
		padding: 0.45rem 0.75rem;
		border-bottom: 1px solid #f5f5f7;
		color: #333;
		vertical-align: middle;
	}

	.compact-table tbody tr:last-child td {
		border-bottom: none;
	}

	.compact-table tbody tr:hover {
		background: #fafbfc;
	}

	.col-filename {
		max-width: 180px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.col-url {
		max-width: 200px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.col-url code {
		font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace;
		font-size: 0.75rem;
	}

	.cdn-link {
		color: #58a6ff;
		text-decoration: none;
		font-size: 0.78rem;
		font-weight: 500;
	}

	.cdn-link:hover {
		text-decoration: underline;
	}

	/* Role Badges */
	.role-badge {
		display: inline-block;
		padding: 0.15rem 0.5rem;
		border-radius: 10px;
		font-size: 0.7rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.03em;
	}

	.role-owner {
		background: #fef3c7;
		color: #92400e;
	}

	.role-admin {
		background: #dbeafe;
		color: #1e40af;
	}

	.role-editor {
		background: #e8e8ed;
		color: #555;
	}

	/* ── Search Form ────────────────────────────────────────────── */
	.search-form {
		margin-bottom: 1rem;
	}

	.search-input-wrapper {
		position: relative;
		display: flex;
		align-items: center;
	}

	.search-icon {
		position: absolute;
		left: 0.75rem;
		font-size: 0.9rem;
		color: #999;
		pointer-events: none;
	}

	.search-input {
		width: 100%;
		padding: 0.55rem 2.5rem 0.55rem 2.25rem;
		font-size: 0.875rem;
		border: 1px solid #d0d0d6;
		border-radius: 6px;
		background: #fff;
		color: #1a1a2e;
		transition: border-color 0.15s, box-shadow 0.15s;
		box-sizing: border-box;
	}

	.search-input:focus {
		outline: none;
		border-color: #58a6ff;
		box-shadow: 0 0 0 3px rgba(88, 166, 255, 0.2);
	}

	.search-input::placeholder {
		color: #aaa;
	}

	.search-clear {
		position: absolute;
		right: 0.5rem;
		font-size: 1.25rem;
		color: #999;
		text-decoration: none;
		line-height: 1;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		transition: color 0.15s, background 0.15s;
	}

	.search-clear:hover {
		color: #e5534b;
		background: #fde8e8;
	}

	/* ── Checkbox Column ────────────────────────────────────────── */
	.col-check {
		width: 40px;
		text-align: center;
		padding-left: 0.75rem !important;
		padding-right: 0.25rem !important;
	}

	.row-checkbox {
		width: 16px;
		height: 16px;
		cursor: pointer;
		accent-color: #58a6ff;
		margin: 0;
	}

	/* ── Bulk Action Bar ────────────────────────────────────────── */
	.bulk-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.6rem 1rem;
		background: #fff8e1;
		border: 1px solid #ffe082;
		border-radius: 6px;
		margin-top: 1rem;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.bulk-bar-status {
		font-size: 0.85rem;
		font-weight: 500;
	}

	.bulk-indicator {
		color: #e65100;
	}

	.bulk-bar-actions {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.bulk-form {
		display: inline;
	}

	.bulk-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.4rem 0.9rem;
		font-size: 0.8rem;
		font-weight: 600;
		border-radius: 5px;
		border: none;
		cursor: pointer;
		transition: background 0.15s, opacity 0.15s;
		white-space: nowrap;
	}

	.bulk-btn:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}

	.bulk-btn--activate {
		background: #1a7f37;
		color: #fff;
	}

	.bulk-btn--activate:hover:not(:disabled) {
		background: #14682c;
	}

	.bulk-btn--deactivate {
		background: #b42318;
		color: #fff;
	}

	.bulk-btn--deactivate:hover:not(:disabled) {
		background: #9b1c1c;
	}

	/* Admin Note */
	.admin-note {
		margin-top: 1.25rem;
		padding: 0.75rem 1rem;
		background: #f8f9fb;
		border: 1px solid #e0e0e6;
		border-radius: 6px;
		font-size: 0.825rem;
		color: #666;
		line-height: 1.5;
	}

	.admin-note code {
		font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace;
		font-size: 0.8rem;
		background: #e8e8ed;
		padding: 0.1rem 0.4rem;
		border-radius: 3px;
	}
</style>
