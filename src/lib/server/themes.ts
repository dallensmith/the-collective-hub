export type ThemePreset = {
	id: string;
	name: string;
	description: string;
	colors: {
		primary: string;
		'primary-hover': string;
		bg: string;
		surface: string;
		text: string;
		'text-secondary': string;
		'header-bg': string;
		'header-text': string;
		'footer-bg': string;
		'footer-text': string;
		'hero-bg': string;
		'hero-bg-end': string;
		'hero-text': string;
		'cta-bg': string;
		'cta-text': string;
		border: string;
	};
};

export const THEME_PRESETS: ThemePreset[] = [
	{
		id: 'default-dark',
		name: 'Default Dark',
		description: 'Dark gradient hero with clean white content sections',
		colors: {
			primary: '#3b82f6',
			'primary-hover': '#2563eb',
			bg: '#ffffff',
			surface: '#f9fafb',
			text: '#111827',
			'text-secondary': '#6b7280',
			'header-bg': '#ffffffcc',
			'header-text': '#111827',
			'footer-bg': '#111827',
			'footer-text': '#f9fafb',
			'hero-bg': '#111827',
			'hero-bg-end': '#1f2937',
			'hero-text': '#ffffff',
			'cta-bg': '#111827',
			'cta-text': '#ffffff',
			border: '#e5e7eb'
		}
	},
	{
		id: 'ocean-blue',
		name: 'Ocean Blue',
		description: 'Calming blue tones throughout',
		colors: {
			primary: '#0ea5e9',
			'primary-hover': '#0284c7',
			bg: '#f0f9ff',
			surface: '#ffffff',
			text: '#0c4a6e',
			'text-secondary': '#64748b',
			'header-bg': '#f0f9ffcc',
			'header-text': '#0c4a6e',
			'footer-bg': '#0c4a6e',
			'footer-text': '#e0f2fe',
			'hero-bg': '#0c4a6e',
			'hero-bg-end': '#1e3a5f',
			'hero-text': '#f0f9ff',
			'cta-bg': '#0c4a6e',
			'cta-text': '#f0f9ff',
			border: '#bae6fd'
		}
	},
	{
		id: 'forest-green',
		name: 'Forest Green',
		description: 'Earthy green palette for a natural feel',
		colors: {
			primary: '#22c55e',
			'primary-hover': '#16a34a',
			bg: '#f0fdf4',
			surface: '#ffffff',
			text: '#14532d',
			'text-secondary': '#6b7280',
			'header-bg': '#f0fdf4cc',
			'header-text': '#14532d',
			'footer-bg': '#14532d',
			'footer-text': '#dcfce7',
			'hero-bg': '#14532d',
			'hero-bg-end': '#166534',
			'hero-text': '#f0fdf4',
			'cta-bg': '#14532d',
			'cta-text': '#f0fdf4',
			border: '#bbf7d0'
		}
	},
	{
		id: 'warm-sunset',
		name: 'Warm Sunset',
		description: 'Warm orange and amber tones',
		colors: {
			primary: '#f59e0b',
			'primary-hover': '#d97706',
			bg: '#fffbeb',
			surface: '#ffffff',
			text: '#78350f',
			'text-secondary': '#92400e',
			'header-bg': '#fffbebcc',
			'header-text': '#78350f',
			'footer-bg': '#78350f',
			'footer-text': '#fef3c7',
			'hero-bg': '#78350f',
			'hero-bg-end': '#92400e',
			'hero-text': '#fffbeb',
			'cta-bg': '#78350f',
			'cta-text': '#fffbeb',
			border: '#fde68a'
		}
	},
	{
		id: 'minimal-light',
		name: 'Minimal Light',
		description: 'Clean, light, and minimal',
		colors: {
			primary: '#6366f1',
			'primary-hover': '#4f46e5',
			bg: '#ffffff',
			surface: '#f8fafc',
			text: '#1e293b',
			'text-secondary': '#94a3b8',
			'header-bg': '#ffffffcc',
			'header-text': '#1e293b',
			'footer-bg': '#1e293b',
			'footer-text': '#f8fafc',
			'hero-bg': '#f8fafc',
			'hero-bg-end': '#e2e8f0',
			'hero-text': '#1e293b',
			'cta-bg': '#f1f5f9',
			'cta-text': '#1e293b',
			border: '#e2e8f0'
		}
	}
];
