import { describe, it, expect } from 'vitest';
import { agePension, PENSION_JUL_2026 as P } from './pension';

// Hand-calculated against the 1 July 2026 assets test (homeowner unless noted).
// Max annual: single $31,223, couple $47,070. Free area (homeowner): single
// $333,000, couple $499,000. Taper: $0.078/yr per $1 over the free area.
// NOTE: these figures are indexed 3× a year — if a test breaks after updating
// pension.ts, that's expected; recompute the expected values from the new scale.

describe('agePension — assets test (single, homeowner)', () => {
	it('pays nothing below the eligibility age', () => {
		expect(agePension(66, 100_000, 'single')).toBe(0);
	});

	it('pays the full pension when assets are under the free area', () => {
		expect(agePension(67, 200_000, 'single')).toBeCloseTo(31_223, 6);
		expect(agePension(70, 333_000, 'single')).toBeCloseTo(31_223, 6); // at the threshold
	});

	it('tapers by $0.078 per $1 above the free area (hand-calc)', () => {
		// $500k: reduction = (500,000 − 333,000) × 0.078 = 13,026 → 31,223 − 13,026 = 18,197
		expect(agePension(67, 500_000, 'single')).toBeCloseTo(18_197, 6);
	});

	it('reaches zero at (and past) the cut-off', () => {
		// cut-off = 333,000 + 31,223/0.078 ≈ 733,295 → essentially nil there, and
		// clamped to exactly 0 beyond it.
		expect(agePension(67, 733_295, 'single')).toBeLessThan(1);
		expect(agePension(67, 1_000_000, 'single')).toBe(0);
	});
});

describe('agePension — couple and non-homeowner', () => {
	it('uses the couple free area and max rate', () => {
		expect(agePension(67, 400_000, 'couple')).toBeCloseTo(47_070, 6); // under $499k
		// $700k: (700,000 − 499,000) × 0.078 = 15,678 → 47,070 − 15,678 = 31,392
		expect(agePension(67, 700_000, 'couple')).toBeCloseTo(31_392, 6);
	});

	it('a non-homeowner gets a higher free area (more pension at the same assets)', () => {
		const owner = agePension(67, 500_000, 'single', true);
		const renter = agePension(67, 500_000, 'single', false); // free area $600k → full
		expect(renter).toBeGreaterThan(owner);
		expect(renter).toBeCloseTo(31_223, 6);
	});
});

describe('agePension — invariants', () => {
	it('is monotonic non-increasing in assets and clamped to [0, max]', () => {
		let prev = P.maxAnnual.single;
		for (let a = 0; a <= 1_000_000; a += 5_000) {
			const p = agePension(70, a, 'single');
			expect(p).toBeGreaterThanOrEqual(0);
			expect(p).toBeLessThanOrEqual(P.maxAnnual.single + 1e-9);
			expect(p).toBeLessThanOrEqual(prev + 1e-9); // never rises as assets rise
			prev = p;
		}
	});
});
