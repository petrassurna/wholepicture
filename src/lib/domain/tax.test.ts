import { describe, it, expect } from 'vitest';
import { taxOwed, paygTax, TAX_2024_25 } from './tax';

// All expected values are hand-calculated against the 2024-25 scale.
// Brackets: 0 | 16% >18,200 | 30% >45,000 | 37% >135,000 | 45% >190,000
// SAPTO single: 2,230, tapers 12.5c/$1 over 32,279 (out at 50,119)
// LITO: 700, −5c/$1 over 37,500 (→325 at 45,000), then −1.5c/$1 (out at 66,667)
// Medicare: 2%, single senior threshold 43,020 with a 10c/$1 shade-in

describe('taxOwed (single)', () => {
	it('is zero on no income', () => {
		expect(taxOwed(0, 'single').total).toBe(0);
	});

	it('clamps negative income to zero', () => {
		expect(taxOwed(-5_000, 'single').total).toBe(0);
	});

	it('is zero below the tax-free threshold', () => {
		const t = taxOwed(15_000, 'single');
		expect(t.incomeTax).toBe(0);
		expect(t.medicare).toBe(0);
		expect(t.total).toBe(0);
	});

	it('is zero for a $30k retiree — SAPTO + LITO wipe out the tax', () => {
		// gross = (30,000 − 18,200) × 16% = 1,888
		// SAPTO 2,230 + LITO 700 = 2,930 > 1,888 → income tax nil
		// Medicare nil (below 43,020)
		const t = taxOwed(30_000, 'single');
		expect(t.incomeTax).toBeCloseTo(1_888, 6);
		expect(t.sapto).toBeCloseTo(2_230, 6);
		expect(t.lito).toBeCloseTo(700, 6);
		expect(t.total).toBe(0);
	});

	it('matches the hand calc for a $50k retiree', () => {
		// gross = 26,800×16% + 5,000×30% = 4,288 + 1,500 = 5,788
		// SAPTO = 2,230 − (50,000 − 32,279)×12.5% = 14.875
		// LITO  = 325 − (50,000 − 45,000)×1.5%     = 250
		// net income tax = 5,788 − 14.875 − 250 = 5,523.125
		// Medicare = min(2%×50,000=1,000, 10%×(50,000−43,020)=698) = 698
		// total = 6,221.125
		const t = taxOwed(50_000, 'single');
		expect(t.incomeTax).toBeCloseTo(5_788, 6);
		expect(t.sapto).toBeCloseTo(14.875, 6);
		expect(t.lito).toBeCloseTo(250, 6);
		expect(t.medicare).toBeCloseTo(698, 6);
		expect(t.total).toBeCloseTo(6_221.125, 6);
	});

	it('taxes a $44k retiree, with Medicare added on top of net income tax', () => {
		// gross = (44,000 − 18,200) × 16% = 4,128
		// SAPTO = 2,230 − (44,000 − 32,279) × 12.5% = 764.875
		// LITO  = 700 − (44,000 − 37,500) × 5%       = 375
		// net income tax = 4,128 − 764.875 − 375 = 2,988.125
		// Medicare = min(2%×44,000=880, 10%×(44,000−43,020)=98) = 98  (offsets don't reduce it)
		// total = 3,086.125
		const t = taxOwed(44_000, 'single');
		expect(t.sapto).toBeCloseTo(764.875, 6);
		expect(t.lito).toBeCloseTo(375, 6);
		expect(t.medicare).toBeCloseTo(98, 6);
		expect(t.total).toBeCloseTo(3_086.125, 6);
	});
});

describe('taxOwed (couple, per person)', () => {
	it('applies the couple SAPTO/thresholds to each person', () => {
		// Couple SAPTO: 1,602, threshold 28,974. At $30k: 1,602 − (30,000−28,974)×0.125 = 1,473.75
		const t = taxOwed(30_000, 'couple');
		expect(t.sapto).toBeCloseTo(1_473.75, 6);
	});

	it('a $30k-each couple pays no income tax — only a tiny Medicare shade-in', () => {
		// gross 1,888; offsets SAPTO 1,473.75 + LITO 700 = 2,173.75 > 1,888 → income tax nil.
		// Medicare: each person is $57 over the couple threshold (29,943) →
		// min(2%×30,000, 10%×57) = 5.70. (Mirrors the ATO family test: $60k combined
		// is $114 over the $59,886 family threshold → $11.40, i.e. $5.70 each.)
		const t = taxOwed(30_000, 'couple');
		expect(t.incomeTax - t.sapto - t.lito).toBeLessThanOrEqual(0); // offsets wipe income tax
		expect(t.medicare).toBeCloseTo(5.7, 6);
		expect(t.total).toBeCloseTo(5.7, 6);
	});

	it('a $28k-each couple (below every threshold) pays nothing', () => {
		expect(taxOwed(28_000, 'couple').total).toBe(0);
	});
});

describe('paygTax (working-age salary — no SAPTO)', () => {
	it('is zero on no salary and clamps negatives', () => {
		expect(paygTax(0)).toBe(0);
		expect(paygTax(-5_000)).toBe(0);
	});

	it('is zero at the tax-free threshold', () => {
		// (18,200 − 18,200)×16% = 0; below the 27,222 Medicare threshold too.
		expect(paygTax(18_200)).toBe(0);
	});

	it('matches the hand calc for a $100k salary', () => {
		// marginal = 26,800×16% + 55,000×30% = 4,288 + 16,500 = 20,788
		// LITO = 0 (out at 66,667); Medicare = 2%×100,000 = 2,000
		// total = 22,788
		expect(paygTax(100_000)).toBeCloseTo(22_788, 6);
	});

	it('excludes SAPTO — a $50k worker pays more than a $50k retiree', () => {
		// marginal 5,788 − LITO 250 = 5,538; Medicare = 2%×50,000 = 1,000 → 6,538.
		// No SAPTO (that's the point): taxOwed(50k) is 6,221 thanks to its seniors offset.
		expect(paygTax(50_000)).toBeCloseTo(6_538, 6);
		expect(paygTax(50_000)).toBeGreaterThan(taxOwed(50_000, 'single').total);
	});

	it('applies the Medicare shade-in just above the general threshold', () => {
		// marginal = (30,000 − 18,200)×16% = 1,888; LITO = 700 → net income tax 1,188
		// Medicare = min(2%×30,000=600, 10%×(30,000−27,222)=277.8) = 277.8
		// total = 1,465.8
		expect(paygTax(30_000)).toBeCloseTo(1_465.8, 6);
	});
});

describe('scale is swappable', () => {
	it('accepts an explicit scale', () => {
		expect(taxOwed(30_000, 'single', TAX_2024_25).total).toBe(0);
	});
});
