/**
 * Client-safe timezone formatting utilities.
 *
 * All event times are stored as timestamptz (UTC) in the database.
 * These functions use the browser's `Intl.DateTimeFormat` to display
 * times in the visitor's local timezone.
 */

/**
 * Format a UTC date string for display in the visitor's local timezone.
 * Returns a formatted string like "Sat, Jun 14, 2025 at 8:00 PM".
 */
export function formatEventTime(utcIsoString: string): string {
	const date = new Date(utcIsoString);
	return date.toLocaleDateString('en-US', {
		weekday: 'short',
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		hour: 'numeric',
		minute: '2-digit',
		timeZoneName: 'short'
	});
}

/**
 * Format just the date portion (no time).
 * Returns a formatted string like "Sat, Jun 14".
 */
export function formatEventDate(utcIsoString: string): string {
	const date = new Date(utcIsoString);
	return date.toLocaleDateString('en-US', {
		weekday: 'short',
		month: 'short',
		day: 'numeric'
	});
}

/**
 * Format just the time portion.
 * Returns a formatted string like "8:00 PM EST".
 */
export function formatEventTimeOnly(utcIsoString: string): string {
	const date = new Date(utcIsoString);
	return date.toLocaleTimeString('en-US', {
		hour: 'numeric',
		minute: '2-digit',
		timeZoneName: 'short'
	});
}
