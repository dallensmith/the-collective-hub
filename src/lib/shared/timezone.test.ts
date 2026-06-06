import { describe, it, expect } from 'vitest';
import { formatEventTime, formatEventDate, formatEventTimeOnly } from './timezone';

describe('timezone', () => {
	// Use a fixed UTC date for deterministic testing: 2025-06-14T20:00:00Z
	const utcDateString = '2025-06-14T20:00:00.000Z';

	describe('formatEventTime', () => {
		it('returns a non-empty string', () => {
			const result = formatEventTime(utcDateString);
			expect(result).toBeDefined();
			expect(typeof result).toBe('string');
			expect(result.length).toBeGreaterThan(0);
		});

		it('contains the year 2025', () => {
			const result = formatEventTime(utcDateString);
			expect(result).toContain('2025');
		});

		it('contains month "Jun"', () => {
			const result = formatEventTime(utcDateString);
			expect(result).toContain('Jun');
		});

		it('contains the day "14"', () => {
			const result = formatEventTime(utcDateString);
			expect(result).toContain('14');
		});

		it('contains a time indicator (AM/PM)', () => {
			const result = formatEventTime(utcDateString);
			// Should contain either AM or PM
			expect(result).toMatch(/AM|PM/);
		});

		it('contains weekday short name', () => {
			const result = formatEventTime(utcDateString);
			// June 14, 2025 is a Saturday
			expect(result).toContain('Sat');
		});
	});

	describe('formatEventDate', () => {
		it('returns a non-empty string', () => {
			const result = formatEventDate(utcDateString);
			expect(result).toBeDefined();
			expect(typeof result).toBe('string');
			expect(result.length).toBeGreaterThan(0);
		});

		it('does NOT contain time (no AM/PM, no colon time pattern)', () => {
			const result = formatEventDate(utcDateString);
			// Should not have AM/PM
			expect(result).not.toMatch(/AM|PM/);
			// Should not have a time pattern like "8:00"
			expect(result).not.toMatch(/\d:\d{2}/);
		});

		it('contains "Sat, Jun 14"', () => {
			const result = formatEventDate(utcDateString);
			expect(result).toContain('Sat');
			expect(result).toContain('Jun');
			expect(result).toContain('14');
		});
	});

	describe('formatEventTimeOnly', () => {
		it('returns a non-empty string', () => {
			const result = formatEventTimeOnly(utcDateString);
			expect(result).toBeDefined();
			expect(typeof result).toBe('string');
			expect(result.length).toBeGreaterThan(0);
		});

		it('contains a time indicator (AM/PM)', () => {
			const result = formatEventTimeOnly(utcDateString);
			expect(result).toMatch(/AM|PM/);
		});

		it('does NOT contain date parts (no month name)', () => {
			const result = formatEventTimeOnly(utcDateString);
			expect(result).not.toMatch(/Jun|Jul|Aug|Sep|Oct|Nov|Dec|Jan|Feb|Mar|Apr|May/);
		});

		it('contains time in HH:MM format', () => {
			const result = formatEventTimeOnly(utcDateString);
			expect(result).toMatch(/\d{1,2}:\d{2}/);
		});
	});

	describe('edge cases', () => {
		it('handles an ISO string from a different era (year 2000)', () => {
			// Use a UTC time that resolves to year 2000 in all timezones
			const result = formatEventTime('2000-06-15T12:00:00.000Z');
			expect(result).toBeDefined();
			expect(result).toContain('2000');
			expect(result).toContain('Jun');
		});

		it('handles an ISO string far in the future', () => {
			const result = formatEventTime('2099-12-31T23:59:59.000Z');
			expect(result).toBeDefined();
			expect(result).toContain('2099');
			expect(result).toContain('Dec');
		});

		it('formatEventTimeOnly returns a time string for midnight UTC', () => {
			const result = formatEventTimeOnly('2025-06-15T00:00:00.000Z');
			expect(result).toBeDefined();
			expect(result).toMatch(/AM|PM/);
		});

		it('formatEventDate handles a different date correctly', () => {
			// Jan 1, 2025 is a Wednesday
			const result = formatEventDate('2025-01-01T12:00:00.000Z');
			expect(result).toContain('Wed');
			expect(result).toContain('Jan');
			expect(result).toContain('1');
		});
	});
});
