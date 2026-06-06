---
description: "Use when writing or editing Tailwind CSS classes, styling Svelte components, adding design tokens, or modifying layout.css for The Collective Hub. Enforces Tailwind v4 syntax, project design tokens, and component utility conventions."
applyTo: "**/*.svelte", "src/routes/layout.css"
---

# Tailwind CSS Rules

## Version & Setup

This project uses **Tailwind CSS v4** with a CSS-first configuration — there is no `tailwind.config.js`.

### Current State

The project's [`src/routes/layout.css`](../src/routes/layout.css) currently contains only base Tailwind imports:

```css
@import 'tailwindcss';
@plugin '@tailwindcss/forms';
@plugin '@tailwindcss/typography';
```

No custom `@theme` tokens, `@layer components`, or utility classes have been defined yet. The sections below document the **intended patterns** — these utilities need to be added to `layout.css` **before** they can be used in components.

All theme tokens, component utilities, and plugin registrations live in `src/routes/layout.css`.

## Design Tokens: Always Use Named Tokens

Inline arbitrary values are **forbidden** for anything already defined in `@theme`. Prefer named tokens.

When a value isn't covered by an existing token, **add it to `@theme` in `layout.css`** first, then reference it by name.

## Color Palette

The Web Cooperative website follows a professional, trustworthy aesthetic reflecting the brand's direct and helpful personality.

| Role               | Tailwind classes                            |
| ------------------ | ------------------------------------------- |
| Page background    | `bg-slate-950` or `bg-white`                |
| Surface / card     | `bg-white/5`, `bg-slate-900/40`             |
| Border             | `border-slate-700/50`                       |
| Text primary       | `text-slate-100`, `text-slate-900`          |
| Text muted         | `text-slate-400`, `text-slate-500`          |
| Accent — primary   | `text-cyan-400`, `border-cyan-500/50`       |
| Accent — secondary | `text-emerald-400`, `border-emerald-500/50` |

Use opacity modifiers (`/10`, `/20`, `/30`, `/50`) for translucent backgrounds and borders. Reserve full-opacity fills for active/focus states only.

## Component Utilities (Planned — Add to `layout.css` Before Use)

The following utility classes are **planned but not yet defined**. Add them to `src/routes/layout.css` inside `@layer components` **before** referencing them in components:

```css
/* src/routes/layout.css — add inside @layer components */
@layer components {
	.input {
		@apply block w-full rounded-lg border border-slate-700/50 bg-white/5 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 transition-all duration-300 focus:border-cyan-500/50 focus:outline-none;
	}
	.label {
		@apply mb-1 block text-sm font-medium text-slate-400;
	}
	.btn {
		@apply inline-flex items-center justify-center rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white transition-all duration-300 hover:bg-cyan-500 focus:ring-2 focus:ring-cyan-500/50 focus:outline-none;
	}
	.btn-ghost {
		@apply inline-flex items-center justify-center rounded-lg border border-slate-700/50 bg-transparent px-4 py-2 text-sm font-medium text-slate-300 transition-all duration-300 hover:border-cyan-500/50 hover:text-cyan-400 focus:outline-none;
	}
}
```

| Class        | Use for                                           |
| ------------ | ------------------------------------------------- |
| `.input`     | `<input>`, `<select>`, `<textarea>` form controls |
| `.label`     | Micro-label headings                              |
| `.btn`       | Primary action button                             |
| `.btn-ghost` | Secondary / ghost button                          |

When a pattern repeats 3+ times across components, extract it into `@layer components` in `layout.css` using `@apply`.

## Interaction Patterns

Use consistent transitions and hover patterns:

```html
<!-- Card with border + hover effect -->
<div class="border border-slate-700/50 transition-all duration-300 hover:border-cyan-500/50">
	<div class="group">
		<span class="text-slate-400 transition-colors duration-300 group-hover:text-cyan-400">
			Content
		</span>
	</div>
</div>
```

- Always pair state changes with `transition-all duration-300`
- Use `group` + `group-hover:` for parent-triggered child transitions

## Responsive Layout

Use Tailwind breakpoint prefixes for responsive grids:

```html
<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"></div>
```

Standard breakpoints: `sm` (640px), `md` (768px), `lg` (1024px), `xl` (1280px).

Content pages should be readable and well-spaced on all devices — prioritize mobile layouts since many small business owners browse on phones.

## Avoid

- Arbitrary values (`shadow-[...]`, `text-[11px]`) for anything already in `@theme`
- `style=""` attributes for values achievable with utility classes
- Adding colors outside the established brand palette without discussion
- New `@theme` tokens that duplicate existing ones at similar opacity levels
