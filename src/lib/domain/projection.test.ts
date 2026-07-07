import { describe, it, expect } from 'vitest';
import { project, realReturn, type Assumptions } from './projection';
import type { Asset } from './assets';

// All expected numbers below are derived independently of the engine —
// by hand arithmetic, by counting, or from a stated requirement — so the
// tests genuinely check correctness rather than echoing the implementation.

// A single tax-free asset (not ITaxable) reproduces the plain balance mechanics.
const pot = (balance: number, nominalReturn: number): Asset[] => [
	{ label: 'pot', balance, nominalReturn }
];

const A = (over: Partial<Assumptions> = {}): Assumptions => ({
	startAge: 60,
	endAge: 90,
	spend: 10_000,
	inflation: 0,
	downturn: 0.3,
	recoveryYears: 5,
	...over
});

/** balance at a given age */
const at = (p: { points: { age: number; balance: number }[] }, age: number) =>
	p.points.find((pt) => pt.age === age)!.balance;

describe('realReturn', () => {
	it('equals the nominal return when there is no inflation', () => {
		expect(realReturn(0.07, 0)).toBeCloseTo(0.07, 10);
	});

	it('is zero when the return only keeps pace with inflation', () => {
		expect(realReturn(0.03, 0.03)).toBeCloseTo(0, 10);
	});

	it('matches the hand-calculated real return', () => {
		// 1.07 / 1.025 − 1 = 0.043902439…  (worked out by hand)
		expect(realReturn(0.07, 0.025)).toBeCloseTo(0.0439024, 6);
	});

	it('is negative when inflation outpaces the return', () => {
		expect(realReturn(0.02, 0.05)).toBeLessThan(0);
	});
});

describe('project — structure & invariants', () => {
	const p = project(pot(500_000, 0.06), A({ endAge: 90 }), 'average');

	it('produces one point per year, inclusive of both ends', () => {
		expect(p.points.length).toBe(90 - 60 + 1); // 31
		expect(p.points[0].age).toBe(60);
		expect(p.points.at(-1)!.age).toBe(90);
	});

	it('never reports a negative balance', () => {
		expect(p.points.every((pt) => pt.balance >= 0)).toBe(true);
	});

	it('reports no tax when nothing is assessable', () => {
		expect(p.totalTax).toBe(0);
		expect(p.points.every((pt) => pt.tax === 0)).toBe(true);
	});
});

describe('project — average, no growth (counted by hand)', () => {
	it('$100k at $10k/yr with 0% real lasts exactly 10 withdrawals → runs out at 69', () => {
		// 100,000 / 10,000 = 10 withdrawals, at ages 60,61,…,69.
		const p = project(
			pot(100_000, 0),
			A({ startAge: 60, endAge: 100, spend: 10_000, inflation: 0 }),
			'average'
		);
		expect(p.runsOutAge).toBe(69);
	});
});

describe('project — average, with growth (arithmetic by hand)', () => {
	it('follows withdraw-then-grow exactly at 10% real', () => {
		// nominal 10%, inflation 0 → real 10%. Start $100,000, spend $10,000:
		//   60: 100,000 → (−10k) 90,000 → (×1.1) 99,000
		//   61:  99,000 → (−10k) 89,000 → (×1.1) 97,900
		//   62:  97,900 → (−10k) 87,900 → (×1.1) 96,690
		const p = project(pot(100_000, 0.1), A({ startAge: 60, spend: 10_000, inflation: 0 }), 'average');
		expect(at(p, 60)).toBeCloseTo(100_000, 4);
		expect(at(p, 61)).toBeCloseTo(99_000, 4);
		expect(at(p, 62)).toBeCloseTo(97_900, 4);
		expect(at(p, 63)).toBeCloseTo(96_690, 4);
	});
});

describe('project — sustainable pot lasts', () => {
	it('never runs out and ends richer when growth outpaces spending', () => {
		// $1M at ~2.44% real earns ~$24k/yr > $20k spend → grows.
		const p = project(pot(1_000_000, 0.05), A({ spend: 20_000, inflation: 0.025 }), 'average');
		expect(p.runsOutAge).toBeNull();
		expect(at(p, 90)).toBeGreaterThan(1_000_000);
	});
});

describe('project — bad case crash & recovery (by requirement)', () => {
	// 0% real growth + no spending isolates the market path itself.
	const inputs = A({ startAge: 60, endAge: 90, spend: 0, downturn: 0.3, recoveryYears: 5 });
	const p = pot(100_000, 0.025); // return = inflation → 0% real

	it('the average case is flat with 0% real and no spending', () => {
		const avg = project(p, { ...inputs, inflation: 0.025 }, 'average');
		expect(avg.points.every((pt) => Math.abs(pt.balance - 100_000) < 1e-6)).toBe(true);
	});

	it('the crash drops the balance ~30% in the first year', () => {
		const bad = project(p, { ...inputs, inflation: 0.025 }, 'bad');
		expect(at(bad, 61)).toBeCloseTo(70_000, 2); // 100k after a 30% fall
	});

	it('recovers back to its pre-crash level after the recovery years', () => {
		// Requirement: 30% crash then climb back to the pre-crash level over 5 years.
		const bad = project(p, { ...inputs, inflation: 0.025 }, 'bad');
		expect(at(bad, 66)).toBeCloseTo(100_000, 2); // 5 recovery years after the year-1 crash
	});

	it('with recoveryYears = 0 the crash is a permanent haircut', () => {
		const bad = project(p, { ...inputs, inflation: 0.025, recoveryYears: 0 }, 'bad');
		expect(at(bad, 90)).toBeCloseTo(70_000, 2); // never climbs back
	});
});

describe('project — sequence-of-returns risk (property)', () => {
	const p = pot(500_000, 0.07);
	const inputs = A({ startAge: 67, endAge: 90, spend: 50_000, inflation: 0.025 });
	const avg = project(p, inputs, 'average');
	const bad = project(p, inputs, 'bad');

	it('the bad case never lasts longer than the average', () => {
		expect(bad.runsOutAge!).toBeLessThanOrEqual(avg.runsOutAge!);
	});

	it('matches the independently reproduced run-out ages (regression anchor)', () => {
		expect(avg.runsOutAge).toBe(79);
		expect(bad.runsOutAge).toBe(75);
	});
});

describe('project — edge cases', () => {
	it('an empty pot runs out at the retirement age', () => {
		const p = project(pot(0, 0.07), A({ startAge: 67 }), 'average');
		expect(p.runsOutAge).toBe(67);
	});

	it('handles a single-year projection', () => {
		const p = project(pot(100_000, 0), A({ startAge: 67, endAge: 67, spend: 10_000 }), 'average');
		expect(p.points.length).toBe(1);
		expect(at(p, 67)).toBe(100_000);
		expect(p.runsOutAge).toBeNull();
	});
});
