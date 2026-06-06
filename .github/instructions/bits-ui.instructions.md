---
description: 'Use when integrating Bits UI headless components into The Collective Hub. Covers installation, the child snippet pattern, component catalog, Tailwind v4 integration, and migration guidance for overlapping existing UI components.'
applyTo: 'src/**/*.svelte'
---

# Bits UI Integration

## Overview

[Bits UI](https://bits-ui.com/) is a **headless component library for Svelte 5**, built and maintained by Hunter Johnston ([@huntabyte](https://github.com/huntabyte)). It is the successor to Melt UI, rebuilt exclusively for Svelte 5 runes.

| Property                | Description                                                                              |
| ----------------------- | ---------------------------------------------------------------------------------------- |
| **Headless**            | Ships unstyled — you bring your own CSS/Tailwind classes                                 |
| **Accessibility-first** | WAI-ARIA compliant with keyboard navigation, focus management, and screen reader support |
| **TypeScript-native**   | Full type coverage with exported type helpers                                            |
| **Svelte 5 only**       | Built exclusively for runes (`$state`, `$derived`, `$props`, `$bindable`, `Snippet`)     |

## Installation

```bash
npm install bits-ui
```

For date/time components, also install the peer dependency:

```bash
npm install @internationalized/date
```

No additional setup or configuration required — import directly:

```svelte
<script lang="ts">
	import { Accordion, Button, Dialog } from 'bits-ui';
</script>
```

## Component Catalog

### Interactive / Disclosure

| Component        | Description                             |
| ---------------- | --------------------------------------- |
| `Accordion`      | Expandable/collapsible content sections |
| `AlertDialog`    | Modal dialog for urgent confirmations   |
| `Collapsible`    | Single collapsible panel                |
| `Dialog`         | Modal dialog overlay                    |
| `Tabs`           | Tabbed content switcher                 |
| `DropdownMenu`   | Menu anchored to a trigger button       |
| `ContextMenu`    | Right-click context menu                |
| `Menubar`        | Horizontal menu bar with nested menus   |
| `NavigationMenu` | Responsive nav menu with submenus       |
| `Popover`        | Floating content anchored to a trigger  |
| `Tooltip`        | Hover tooltip anchored to an element    |
| `LinkPreview`    | Floating preview card for hyperlinks    |
| `Command`        | ⌘K-style command palette                |
| `Combobox`       | Autocomplete input with dropdown        |
| `Select`         | Single/multi-select dropdown            |

### Form / Input

| Component         | Description                      |
| ----------------- | -------------------------------- |
| `Button`          | Unstyled button primitive        |
| `Checkbox`        | Checkbox input                   |
| `Label`           | Accessible label                 |
| `RadioGroup`      | Radio button group               |
| `Switch`          | Toggle switch                    |
| `Toggle`          | Single toggle button             |
| `ToggleGroup`     | Grouped toggle buttons           |
| `PinInput`        | Split-digit code input           |
| `Slider`          | Range slider                     |
| `Meter`           | Meter/guage display              |
| `Progress`        | Progress bar                     |
| `RatingGroup`     | Star/score rating input          |
| `Calendar`        | Single date calendar             |
| `RangeCalendar`   | Date range calendar              |
| `DateField`       | Single date segmented input      |
| `DateRangeField`  | Date range segmented input       |
| `DatePicker`      | Calendar popover for single date |
| `DateRangePicker` | Calendar popover for date range  |
| `TimeField`       | Time segmented input             |
| `TimeRangeField`  | Time range segmented input       |

### Layout / Display

| Component     | Description                     |
| ------------- | ------------------------------- |
| `AspectRatio` | Fixed aspect ratio container    |
| `Avatar`      | Image placeholder with fallback |
| `Badge`       | Inline status/label indicator   |
| `Separator`   | Horizontal/vertical divider     |
| `Pagination`  | Page navigation control         |
| `ScrollArea`  | Custom scrollbar container      |
| `Toolbar`     | Toolbar button group            |

### Utilities & Type Helpers

| Export                   | Description                                                |
| ------------------------ | ---------------------------------------------------------- |
| `mergeProps`             | Merge multiple prop objects with handler chaining          |
| `useId`                  | Generate unique IDs for accessibility wiring               |
| `Portal`                 | Teleport content to a different DOM node                   |
| `isUsingKeyboard`        | Track keyboard vs. mouse interaction                       |
| `BitsConfig`             | Global Bits UI configuration provider                      |
| `computeCommandScore`    | Score items for Command/Combobox filtering                 |
| `WithElementRef`         | Type helper for element ref forwarding                     |
| `WithoutChild`           | Type helper omitting the child snippet prop                |
| `WithoutChildren`        | Type helper omitting children snippet props                |
| `WithoutChildrenOrChild` | Type helper omitting both child and children snippet props |

## Svelte 5 Runes Integration

Bits UI is built exclusively for Svelte 5 runes. It uses a **compound component pattern** (`Component.Root`, `Component.Item`, `Component.Trigger`, `Component.Content`, etc.) throughout.

### Bindable Props

Control component state with two-way bindable props:

```svelte
<script lang="ts">
	import { Dialog } from 'bits-ui';
	let open = $state(false);
</script>

<Dialog.Root bind:open>
	<!-- ... -->
</Dialog.Root>
```

Common bindable props across components:

| Pattern            | Example                                    |
| ------------------ | ------------------------------------------ |
| `bind:open`        | Dialog, Popover, DropdownMenu, Collapsible |
| `bind:value`       | Select, Combobox, Tabs, RadioGroup         |
| `bind:placeholder` | DateField, DatePicker                      |
| `bind:date`        | Calendar, DatePicker                       |

### Callback Props

Bits UI uses an `on{EventName}Change` pattern for change callbacks:

```svelte
<Select.Root
  bind:value
  onValueChange={(val) => console.log('selected', val)}
>
```

## The `child` Snippet Pattern (Critical)

Bits UI does **not** use `<slot>`. Instead, it exposes a **`child` snippet** pattern for render delegation.

### Basic Usage

```svelte
<Accordion.Trigger>
	{#snippet child({ props })}
		<button {...props} class="my-custom-class">Trigger Label</button>
	{/snippet}
</Accordion.Trigger>
```

The `child` snippet receives an object with `props` (and optionally `wrapperProps` for floating components). You must spread `{...props}` onto the root element of your rendered markup to wire up accessibility, events, and state attributes.

### Floating Components (Two-Level Wrapper)

For **floating components** — `Popover`, `Tooltip`, `DropdownMenu`, `Select`, `Combobox`, `DatePicker`, `Command` — Bits UI requires a **two-level wrapper** inside the `child` snippet:

```svelte
<script lang="ts">
	import { Popover, Button } from 'bits-ui';
	let open = $state(false);
</script>

<Popover.Root bind:open>
	<Popover.Trigger>
		{#snippet child({ props })}
			<button {...props} class="btn-cyan">Menu</button>
		{/snippet}
	</Popover.Trigger>

	<Popover.Content>
		{#snippet child({ wrapperProps, props })}
			<div {...wrapperProps}>
				<div {...props} class="shadow-card w-48 border border-slate-700 bg-slate-900 p-2">
					<!-- Popover content -->
				</div>
			</div>
		{/snippet}
	</Popover.Content>
</Popover.Root>
```

The snippet receives:

- `wrapperProps` — spread onto the outermost positioning wrapper
- `props` — spread onto the actual UI element
- `open` — current open state (available but not needed for conditional rendering)

⚠️ **Do NOT wrap floating content in `{#if open}`** — bits-ui's `PresenceManager` handles visibility internally. Premature DOM removal via `{#if open}` breaks the animation lifecycle and causes `ScrollLock` to persist indefinitely (`document.body.style.pointerEvents = "none"` never gets cleared). See [Anti-Patterns](#anti-patterns--pitfalls).

## Tailwind CSS v4 Integration

Bits UI works naturally with the project's Tailwind v4 setup (see [`tailwindcss.instructions.md`](.github/instructions/tailwindcss.instructions.md)).

### Passing Classes

Pass `class` directly to any Bits UI component — they forward it to the root DOM element:

```svelte
<Dialog.Content class="fixed inset-0 z-50 flex items-center justify-center">
```

### Data-Attribute Selectors

Bits UI components expose `data-*` attributes on their root elements for state-driven styling:

| Attribute                 | Applies When                       |
| ------------------------- | ---------------------------------- |
| `[data-state="open"]`     | Component is open/expanded         |
| `[data-state="closed"]`   | Component is closed/collapsed      |
| `[data-state="active"]`   | Tab or item is active              |
| `[data-state="inactive"]` | Tab or item is inactive            |
| `[data-disabled]`         | Component or item is disabled      |
| `[data-highlighted]`      | Item is highlighted (keyboard nav) |
| `[data-selected]`         | Item is selected                   |

Example usage in a CSS block:

```css
[data-state='open'] {
	--tw-ring-color: var(--color-cyan-500);
}
```

### CSS Variables for Layout

Bits UI exposes CSS variables for measuring dynamic content:

| Variable                          | Component           |
| --------------------------------- | ------------------- |
| `--bits-accordion-content-height` | `Accordion.Content` |
| `--bits-select-anchor-width`      | `Select.Content`    |
| `--bits-tooltip-trigger-width`    | `Tooltip`           |
| `--bits-popover-anchor-width`     | `Popover.Content`   |

### Animations

Use `data-starting-style` and `data-ending-style` transient attributes for CSS-based enter/exit animations. These attributes are present only during the animation frame and are automatically removed.

## Project-Specific Integration

This project's technology choices align well with Bits UI:

| Project Trait                                                                                           | Bits UI Compatibility                                                                                              |
| ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| **Tailwind CSS v4** (CSS-first config)                                                                  | `class` prop pattern works directly — no `tailwind.config.js` required                                             |
| **Svelte 5 runes only** (see [`svelte5.instructions.md`](.github/instructions/svelte5.instructions.md)) | Natively compatible — Bits UI is built on runes                                                                    |
| **No `tailwind.config.js`**                                                                             | Bits UI does not require one                                                                                       |
| **Colors follow brand palette**                                                                         | Use existing design tokens (see [`tailwindcss.instructions.md`](.github/instructions/tailwindcss.instructions.md)) |
| **Lucide icons** (see [`icons.instructions.md`](.github/instructions/icons.instructions.md))            | Pass icon components as snippets to Bits UI components                                                             |

### Icon Pattern with Bits UI

Render Lucide SVG strings inside child snippets:

```svelte
<Accordion.Trigger>
	{#snippet child({ props })}
		<button {...props} class="flex items-center gap-2">
			<!-- svelte-ignore no-at-html-tags -->
			<!-- svelte-ignore a11y_no_svg_body -->
			{@html ChevronDownIcon}
			<span>Section Title</span>
		</button>
	{/snippet}
</Accordion.Trigger>
```

### `{@html}` for Inline SVGs — Last-Resort Pattern

The use of `{@html}` to render inline SVG strings is a **last-resort pattern** in this project. Follow the icon hierarchy below:

1. **`@lucide/svelte` components** — preferred for all UI icons (e.g., `<Filter size={16} />`, `<ChevronDown size={16} />`)
2. **`simple-icons`** — for brand icons (social media platforms, tech logos)
3. **Inline SVG via `{@html}`** — only for Bits UI child snippets where component pass-through isn't possible

> See [`icons.instructions.md`](.github/instructions/icons.instructions.md) for the full icon hierarchy and usage guidelines.

## Existing Component Overlap & Migration Guidance

The following custom components may have overlapping functionality with Bits UI. Migration should be **phased and deliberate** — never replace a tested, working component without a clear benefit.

| Component Type      | Bits UI Equivalent        | Priority | Rationale                                                          |
| ------------------- | ------------------------- | -------- | ------------------------------------------------------------------ |
| Custom modal/dialog | `Dialog`                  | Medium   | Accessibility upgrade (focus trapping, ARIA, keyboard dismiss)     |
| Tabs/accordion      | `Tabs` / `Accordion`      | Low      | Existing implementation works; reconsider if a11y issues arise     |
| Custom select       | `Select`                  | Medium   | Accessibility upgrade (keyboard nav, ARIA combobox pattern)        |
| Custom button       | `Button`                  | Low      | Keep project-specific variants                                     |
| (none)              | `Popover`                 | **High** | New capability — useful for dropdown menus, filters, quick-actions |
| (none)              | `Tooltip`                 | **High** | New capability — useful for icon-only buttons and truncated text   |
| (none)              | `Calendar` / `DatePicker` | Medium   | New capability — date picking for scheduling                       |
| (none)              | `DropdownMenu`            | **High** | New capability — contextual menus                                  |

### Migration Rules

1. **Never migrate a tested, working component** solely for library adoption — there must be a measurable benefit (accessibility, maintainability, feature gap)
2. When migrating, **keep the old component in place** during a transition period — do not break existing consumers
3. Wrap Bits UI components in project-specific wrappers if the same styling is used in many places (e.g., `AppPopover.svelte` that pre-applies project styling)
4. Run existing tests after any migration to confirm nothing is broken

## Usage Examples with Project Styling

### Dialog — Confirmation Modal

```svelte
<script lang="ts">
	import { Dialog, Button } from 'bits-ui';
	let open = $state(false);
</script>

<Button onmousedown={() => (open = true)} class="btn-cyan">Open Dialog</Button>

<Dialog.Root bind:open>
	<Dialog.Content class="fixed inset-0 z-50 flex items-center justify-center">
		{#snippet child({ wrapperProps, props })}
			<div {...wrapperProps}>
				<div
					{...props}
					class="shadow-card w-full max-w-md border-2 border-slate-700 bg-slate-900/95 p-6 backdrop-blur-md"
				>
					<Dialog.Header>
						<Dialog.Title class="text-lg font-bold text-slate-100">Confirm Action</Dialog.Title>
						<Dialog.Description class="mt-1 text-sm text-slate-400">
							Are you sure you want to proceed? This action cannot be undone.
						</Dialog.Description>
					</Dialog.Header>
					<div class="mt-4 flex justify-end gap-3">
						<Button class="btn-ghost" onmousedown={() => (open = false)}>Cancel</Button>
						<Button class="btn-cyan">Confirm</Button>
					</div>
				</div>
			</div>
		{/snippet}
	</Dialog.Content>
</Dialog.Root>
```

### Popover — Filter Dropdown

```svelte
<script lang="ts">
	import { Popover, Button } from 'bits-ui';
	import { Filter } from '@lucide/svelte';

	let open = $state(false);
	let selectedFilter = $state('All');
</script>

<Popover.Root bind:open>
	<Popover.Trigger>
		{#snippet child({ props })}
			<button {...props} class="btn-ghost flex items-center gap-2">
				<Filter size={16} />
				{selectedFilter}
			</button>
		{/snippet}
	</Popover.Trigger>

	<Popover.Content>
		{#snippet child({ wrapperProps, props })}
			<div {...wrapperProps}>
				<div {...props} class="shadow-card w-56 border-2 border-slate-700 bg-slate-900 p-2">
					<p class="mb-2 px-2 text-xs font-semibold tracking-wider text-slate-400 uppercase">
						Filter by Status
					</p>
					{#each ['All', 'Published', 'Draft', 'Archived'] as option}
						<button
							class="w-full px-2 py-1.5 text-left text-sm text-slate-200
                     hover:bg-slate-800 data-[highlighted]:bg-slate-800"
							onmousedown={() => {
								selectedFilter = option;
								open = false;
							}}
						>
							{option}
						</button>
					{/each}
				</div>
			</div>
		{/snippet}
	</Popover.Content>
</Popover.Root>
```

### Accordion — FAQ / Settings Sections

```svelte
<script lang="ts">
	import { Accordion } from 'bits-ui';
	import { ChevronDown } from '@lucide/svelte';

	let value = $state<string | undefined>(undefined);
</script>

<Accordion.Root bind:value class="flex flex-col gap-2">
	<Accordion.Item value="item-1" class="border-2 border-slate-700">
		<Accordion.Trigger>
			{#snippet child({ props, open })}
				<button
					{...props}
					class="flex w-full items-center justify-between bg-slate-800 px-4 py-3
                 text-sm font-medium text-slate-200"
				>
					<span>Section One</span>
					<span class:rotate-180={open} class="transition-transform duration-200">
							<ChevronDown size={16} />
						</span>
				</button>
			{/snippet}
		</Accordion.Trigger>
		<Accordion.Content>
			{#snippet child({ props })}
				<div {...props} class="border-t-2 border-slate-700 px-4 py-3 text-sm text-slate-400">
					Content for section one.
				</div>
			{/snippet}
		</Accordion.Content>
	</Accordion.Item>

	<Accordion.Item value="item-2" class="border-2 border-slate-700">
		<Accordion.Trigger>
			{#snippet child({ props, open })}
				<button
					{...props}
					class="flex w-full items-center justify-between bg-slate-800 px-4 py-3
                 text-sm font-medium text-slate-200"
				>
					<span>Section Two</span>
					<span class:rotate-180={open} class="transition-transform duration-200">
							<ChevronDown size={16} />
						</span>
				</button>
			{/snippet}
		</Accordion.Trigger>
		<Accordion.Content>
			{#snippet child({ props })}
				<div {...props} class="border-t-2 border-slate-700 px-4 py-3 text-sm text-slate-400">
					Content for section two.
				</div>
			{/snippet}
		</Accordion.Content>
	</Accordion.Item>
</Accordion.Root>
```

## Anti-Patterns / Pitfalls

- ❌ **Don't use Bits UI with Svelte 4** — it requires Svelte 5 runes and will not work
- ❌ **Don't use `<slot>` inside Bits UI components** — always use `{#snippet child(...)}` instead (see [`svelte5.instructions.md`](.github/instructions/svelte5.instructions.md))
- ❌ **Don't forget the two-level wrapper for floating components** — `Popover`, `Tooltip`, `DropdownMenu`, `Select`, `Combobox`, `DatePicker`, and `Command` content snippets receive both `wrapperProps` and `props`
- ❌ **Don't wrap floating content in `{#if open}`** — bits-ui's `PresenceManager` handles visibility internally. Premature DOM removal via `{#if open}` prevents `AnimationsComplete.run()` from firing its completion callback, which causes `ScrollLock` to persist indefinitely (`document.body.style.pointerEvents = "none"` and `document.body.style.overflow = "hidden"` never get cleared). This was a critical bug discovered and fixed across all floating components during Batch 5.
- ❌ **Don't override internal handlers without `mergeProps`** — if you need to add your own event handlers while keeping Bits UI's internal handlers, import `mergeProps` from `"bits-ui"`
- ❌ **Don't import from deep subpaths** — always import from `"bits-ui"` (e.g., `import { Dialog } from "bits-ui"`, not `import Dialog from "bits-ui/dialog"`)

## Resources

| Resource                      | Link                                                                 |
| ----------------------------- | -------------------------------------------------------------------- |
| Full Documentation (LLMs.txt) | [bits-ui.com/docs/llms.txt](https://bits-ui.com/docs/llms.txt)       |
| GitHub Repository             | [github.com/huntabyte/bits-ui](https://github.com/huntabyte/bits-ui) |
| Author                        | Hunter Johnston ([@huntabyte](https://github.com/huntabyte))         |
