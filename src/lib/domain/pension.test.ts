import { describe, it, expect } from 'vitest';
import { agePension, PENSION_2024_25 as P } from './pension';

// Hand-calculated against the 2024-25 assets test (homeowner unless noted).
// Max annual: single $29,754, couple $44,855. Free area (homeowner): single
// $314,000, couple $470,000. Taper: $0.078/yr per $1 over the free area.

describe('agePension — assets test (single, homeowner)', () => {
	it('pays nothing below the eligibility age', () => {
		expect(agePension(66, 100_000, 'single')).toBe(0);
	});

	it('pays the full pension when assets are under the free area', () => {
		expect(agePension(67, 200_000, 'single')).toBeCloseTo(29_754, 6);
		expect(agePension(70, 314_000, 'single')).toBeCloseTo(29_754, 6); // at the threshold
	});

	it('tapers by $0.078 per $1 above the free area (hand-calc)', () => {
		// $500k: reduction = (500,000 − 314,000) × 0.078 = 14,508 → 29,754 − 14,508 = 15,246
		expect(agePension(67, 500_000, 'single')).toBeCloseTo(15_246, 6);
	});

	it('reaches zero at (and past) the cut-off', () => {
		// cut-off = 314,000 + 29,754/0.078 ≈ 695,461.5 → essentially nil there, and
		// clamped to exactly 0 beyond it.
		expect(agePension(67, 695_461, 'single')).toBeLessThan(1);
		expect(agePension(67, 1_000_000, 'single')).toBe(0);
	});
});

describe('agePension — couple and non-homeowner', () => {
	it('uses the couple free area and max rate', () => {
		expect(agePension(67, 400_000, 'couple')).toBeCloseTo(44_855, 6); // under $470k
		// $700k: (700,000 − 470,000) × 0.078 = 17,940 → 44,855 − 17,940 = 26,915
		expect(agePension(67, 700_000, 'couple')).toBeCloseTo(26_915, 6);
	});

	it('a non-homeowner gets a higher free area (more pension at the same assets)', () => {
		const owner = agePension(67, 500_000, 'single', true);
		const renter = agePension(67, 500_000, 'single', false); // free area $566k → full
		expect(renter).toBeGreaterThan(owner);
		expect(renter).toBeCloseTo(29_754, 6);
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
