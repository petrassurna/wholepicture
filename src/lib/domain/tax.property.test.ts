import { describe, it, expect } from 'vitest';
import { taxOwed, TAX_2024_25 as S } from './tax';
import { Household } from './household';
import { IncomeSource } from './income';

// Property / fuzz tests for the tax engine. Each tax component is checked against
// an INDEPENDENTLY re-derived formula (cumulative-offset form, not the piecewise
// loop the implementation uses) across thousands of random incomes, plus the
// invariants that must hold for any income (monotonicity, non-negativity, no
// discontinuities, couples never worse than singles).

// --- reproducible RNG (mulberry32) ---
function rng(seed: number) {
	return () => {
		seed |= 0;
		seed = (seed + 0x6d2b79f5) | 0;
		let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

// --- independent oracles (different formulation from the implementation) ---

// Marginal tax as cumulative constants at each 2024-25 threshold.
function bracketOracle(x: number): number {
	if (x <= 18_200) return 0;
	if (x <= 45_000) return 0.16 * (x - 18_200);
	if (x <= 135_000) return 4_288 + 0.3 * (x - 45_000);
	if (x <= 190_000) return 31_288 + 0.37 * (x - 135_000);
	return 51_638 + 0.45 * (x - 190_000);
}

function saptoOracle(x: number, o: { max: number; threshold: number; taper: number }): number {
	if (x <= o.threshold) return o.max;
	return Math.max(0, o.max - (x - o.threshold) * o.taper);
}

function litoOracle(x: number): number {
	if (x <= 37_500) return 700;
	if (x <= 45_000) return 700 - (x - 37_500) * 0.05;
	return Math.max(0, 325 - (x - 45_000) * 0.015);
}

function medicareOracle(x: number, threshold: number): number {
	if (x <= threshold) return 0;
	return Math.min(0.02 * x, 0.1 * (x - threshold));
}

const near = (a: number, b: number, tol = 1e-6) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));

describe('taxOwed — components match independent oracles (fuzz)', () => {
	const rand = rng(1);
	it('brackets, SAPTO, LITO, Medicare and the total all reconcile over 4000 incomes', () => {
		for (let i = 0; i < 4000; i++) {
			const x = rand() * 300_000; // $0–$300k, fractional cents included
			for (const filing of ['single', 'couple'] as const) {
				const t = taxOwed(x, filing, S);
				const sapto = saptoOracle(x, S.sapto[filing]);
				const lito = litoOracle(x);
				const medicare = medicareOracle(x, S.medicare.threshold[filing]);
				const total = Math.max(0, bracketOracle(x) - sapto - lito) + medicare;

				expect(near(t.incomeTax, bracketOracle(x))).toBe(true);
				expect(near(t.sapto, sapto)).toBe(true);
				expect(near(t.lito, lito)).toBe(true);
				expect(near(t.medicare, medicare)).toBe(true);
				expect(near(t.total, total)).toBe(true);
			}
		}
	});
});

describe('taxOwed — invariants (fuzz)', () => {
	const rand = rng(2);

	it('is never negative and offsets never dip income tax below zero', () => {
		for (let i = 0; i < 3000; i++) {
			const x = rand() * 400_000 - 20_000; // include negatives
			for (const filing of ['single', 'couple'] as const) {
				const t = taxOwed(x, filing, S);
				expect(t.total).toBeGreaterThanOrEqual(0);
				// Medicare isn't reduced by offsets, so total is at least the levy.
				expect(t.total).toBeGreaterThanOrEqual(t.medicare - 1e-9);
			}
		}
	});

	it('is monotonic non-decreasing in income', () => {
		for (const filing of ['single', 'couple'] as const) {
			let prev = 0;
			for (let x = 0; x <= 300_000; x += 250) {
				const total = taxOwed(x, filing, S).total;
				expect(total).toBeGreaterThanOrEqual(prev - 1e-9);
				prev = total;
			}
		}
	});

	it('has no discontinuities — a $1 income rise changes tax by well under $1', () => {
		for (const filing of ['single', 'couple'] as const) {
			for (let x = 0; x <= 300_000; x += 137) {
				const step = taxOwed(x + 1, filing, S).total - taxOwed(x, filing, S).total;
				expect(step).toBeGreaterThanOrEqual(-1e-9);
				expect(step).toBeLessThan(1); // max combined marginal + taper slope < 1
			}
		}
	});

	// Note: taxOwed(x, 'couple') applies the PER-PERSON couple scale (smaller SAPTO,
	// lower Medicare threshold) to the full income x, so it is naturally *higher*
	// than the single scale at the same x — that is expected. The couple *benefit*
	// comes only from income-splitting and is verified in the Household tests below.
});

describe('Household.taxOn — split logic (fuzz)', () => {
	const rand = rng(4);

	it('single is assessed as one taxpayer; couple as two halves', () => {
		for (let i = 0; i < 3000; i++) {
			const assess = rand() * 200_000;
			const single = new Household('single', []);
			const couple = new Household('couple', []);
			expect(near(single.taxOn(assess, 67), taxOwed(assess, 'single', S).total)).toBe(true);
			expect(near(couple.taxOn(assess, 67), 2 * taxOwed(assess / 2, 'couple', S).total)).toBe(true);
		}
	});

	it('a couple never pays more tax than a single on the same assessable income', () => {
		for (let i = 0; i < 2000; i++) {
			const assess = rand() * 200_000;
			const single = new Household('single', []).taxOn(assess, 67);
			const couple = new Household('couple', []).taxOn(assess, 67);
			expect(couple).toBeLessThanOrEqual(single + 1e-9);
		}
	});

	it('household tax is monotonic non-decreasing in assessable income', () => {
		for (const filing of ['single', 'couple'] as const) {
			const h = new Household(filing, []);
			let prev = 0;
			for (let a = 0; a <= 250_000; a += 500) {
				const t = h.taxOn(a, 67);
				expect(t).toBeGreaterThanOrEqual(prev - 1e-9);
				prev = t;
			}
		}
	});
});

describe('Household.contributionAt — 15% concessional tax', () => {
	it('lands the gross contribution less 15% into super, within the window', () => {
		const h = new Household('single', [new IncomeSource('sac', 20_000, 57, 66, true, true, true)]);
		expect(h.contributionAt(60)).toBeCloseTo(20_000 * 0.85, 6); // 17,000 net
		expect(h.contributionAt(67)).toBe(0); // outside the working window
	});

	it('ignores spendable (non-toSuper) income', () => {
		const h = new Household('single', [new IncomeSource('rent', 20_000, 67, 90, true, true, false)]);
		expect(h.contributionAt(70)).toBe(0);
	});
});
