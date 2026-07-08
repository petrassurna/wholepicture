import { describe, it, expect } from 'vitest';
import { agePension, PENSION_JUL_2026 as P } from './pension';

// Hand-calculated against the 1 July 2026 scale (homeowner unless noted).
// Assets test — max annual: single $31,223, couple $47,070. Free area (homeowner):
//   single $333,000, couple $499,000. Taper: $0.078/yr per $1 over the free area.
// Income test — free area: single $5,512/yr, couple $9,672/yr. Taper: 50c/$1.
//   Deeming: 0.25% up to $62,600 (single) / $103,800 (couple), 2.25% above.
// The pension paid is the LOWER of the two tests.
// NOTE: these figures are indexed several times a year — if a test breaks after
// updating pension.ts, that's expected; recompute the expected values.

describe('agePension — assets test binds (single, homeowner, no other income)', () => {
	it('pays nothing below the eligibility age', () => {
		expect(agePension(66, 100_000, 0, 'single')).toBe(0);
	});

	it('pays the full pension when both tests are under their free areas', () => {
		// $200k: assets < $333k → full; deemed = 156.5 + 137,400×2.25% = $3,248 < $5,512 → full.
		expect(agePension(67, 200_000, 0, 'single')).toBeCloseTo(31_223, 6);
	});

	it('tapers by $0.078 per $1 above the assets free area (assets test is lower)', () => {
		// $500k assets test: (500,000 − 333,000) × 0.078 = 13,026 → 31,223 − 13,026 = 18,197.
		// Income test at $500k: deemed $9,998 → 31,223 − (9,998 − 5,512)×0.5 = 28,980. Lower = 18,197.
		expect(agePension(67, 500_000, 0, 'single')).toBeCloseTo(18_197, 6);
	});

	it('reaches zero at (and past) the assets cut-off', () => {
		expect(agePension(67, 733_295, 0, 'single')).toBeLessThan(1);
		expect(agePension(67, 1_000_000, 0, 'single')).toBe(0);
	});
});

describe('agePension — income test binds', () => {
	it('deeming alone trims the pension even with no wages, once assets are sizable', () => {
		// $333k assets test = full, BUT deemed = 156.5 + 270,400×2.25% = $6,240.5 > $5,512 free area
		// → income test = 31,223 − (6,240.5 − 5,512)×0.5 = 30,858.75. Lower test wins.
		expect(agePension(70, 333_000, 0, 'single')).toBeCloseTo(30_858.75, 6);
	});

	it('a working, asset-light single has the income test bind (not the assets test)', () => {
		// $100k assets → assets test full ($31,223). Income: deemed $998 + $40,000 wages = $40,998
		// → 31,223 − (40,998 − 5,512)×0.5 = 31,223 − 17,743 = 13,480. This is what's paid.
		expect(agePension(70, 100_000, 40_000, 'single')).toBeCloseTo(13_480, 6);
	});

	it('high income wipes the pension out entirely', () => {
		// deemed $998 + $70,000 = $70,998 → 31,223 − (70,998 − 5,512)×0.5 < 0 → clamped to 0.
		expect(agePension(70, 100_000, 70_000, 'single')).toBe(0);
	});

	it('a couple with rental income has the income test bind', () => {
		// $400k → assets test full ($47,070). Income: deemed $6,924 + $30,000 rent = $36,924
		// → 47,070 − (36,924 − 9,672)×0.5 = 47,070 − 13,626 = 33,444. Lower than assets test.
		expect(agePension(67, 400_000, 30_000, 'couple')).toBeCloseTo(33_444, 6);
	});
});

describe('agePension — couple and non-homeowner (assets test binds, no other income)', () => {
	it('uses the couple free area and max rate', () => {
		expect(agePension(67, 400_000, 0, 'couple')).toBeCloseTo(47_070, 6); // under $499k, both tests full
		// $700k assets: (700,000 − 499,000) × 0.078 = 15,678 → 47,070 − 15,678 = 31,392 (lower than income test).
		expect(agePension(67, 700_000, 0, 'couple')).toBeCloseTo(31_392, 6);
	});

	it('a non-homeowner gets a higher assets free area (more pension at the same assets)', () => {
		const owner = agePension(67, 500_000, 0, 'single', true); // assets test binds → 18,197
		const renter = agePension(67, 500_000, 0, 'single', false); // assets < $600k free → income test binds
		expect(renter).toBeGreaterThan(owner);
		// Renter: assets test full, income test = 31,223 − (9,998 − 5,512)×0.5 = 28,980.
		expect(renter).toBeCloseTo(28_980, 6);
	});
});

describe('agePension — invariants', () => {
	it('is monotonic non-increasing in assets and clamped to [0, max]', () => {
		// Both tests fall as assets rise (assets taper; deeming raises income), so the
		// lower of the two is non-increasing too.
		let prev = P.maxAnnual.single;
		for (let a = 0; a <= 1_000_000; a += 5_000) {
			const p = agePension(70, a, 0, 'single');
			expect(p).toBeGreaterThanOrEqual(0);
			expect(p).toBeLessThanOrEqual(P.maxAnnual.single + 1e-9);
			expect(p).toBeLessThanOrEqual(prev + 1e-9); // never rises as assets rise
			prev = p;
		}
	});

	it('is non-increasing in actual income', () => {
		let prev = P.maxAnnual.single + 1;
		for (let inc = 0; inc <= 80_000; inc += 2_000) {
			const p = agePension(70, 150_000, inc, 'single');
			expect(p).toBeLessThanOrEqual(prev + 1e-9);
			prev = p;
		}
	});
});
