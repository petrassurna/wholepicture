import { describe, it, expect } from 'vitest';
import { IncomeSource, grossIncomeAt, taxableIncomeAt } from './income';

// Amounts are GROSS now (tax is assessed centrally in the household). Window
// boundaries and the taxable flag are checked explicitly.

describe('IncomeSource', () => {
	const work = new IncomeSource('Part-time', 20_000, 67, 72); // taxable by default

	it('is active only within its (inclusive) age window', () => {
		expect(work.activeAt(66)).toBe(false);
		expect(work.activeAt(67)).toBe(true);
		expect(work.activeAt(72)).toBe(true);
		expect(work.activeAt(73)).toBe(false);
	});

	it('reports gross within its window and zero outside', () => {
		expect(work.grossAt(67)).toBe(20_000);
		expect(work.grossAt(73)).toBe(0);
	});

	it('taxable income equals gross when taxable, zero when not', () => {
		expect(work.taxableAt(67)).toBe(20_000);
		const taxFree = new IncomeSource('tax-free', 20_000, 67, 72, false);
		expect(taxFree.grossAt(67)).toBe(20_000);
		expect(taxFree.taxableAt(67)).toBe(0);
	});

	it('defaults to indexed (flat real value) — a context makes no difference', () => {
		const ctx = { startAge: 67, inflation: 0.03 };
		expect(work.indexed).toBe(true);
		expect(work.grossAt(67, ctx)).toBe(20_000);
		expect(work.grossAt(72, ctx)).toBe(20_000); // unchanged in real terms
	});
});

describe('IncomeSource — inflation indexation (today’s dollars)', () => {
	const ctx = { startAge: 67, inflation: 0.025 };
	const level = new IncomeSource('annuity', 30_000, 67, 90, true, false); // NOT indexed

	it('a non-indexed income keeps full value in year 0', () => {
		expect(level.grossAt(67, ctx)).toBeCloseTo(30_000, 6);
	});

	it('a non-indexed income erodes by inflation each year (hand-calc)', () => {
		// year 3: 30,000 / 1.025^3 = 30,000 / 1.076890625 = 27,857.61…
		expect(level.grossAt(70, ctx)).toBeCloseTo(30_000 / Math.pow(1.025, 3), 4);
		// year 10: 30,000 / 1.025^10
		expect(level.grossAt(77, ctx)).toBeCloseTo(30_000 / Math.pow(1.025, 10), 4);
	});

	it('erosion applies to the taxable amount too', () => {
		expect(level.taxableAt(70, ctx)).toBeCloseTo(30_000 / Math.pow(1.025, 3), 4);
	});

	it('with zero inflation a non-indexed income is flat', () => {
		expect(level.grossAt(80, { startAge: 67, inflation: 0 })).toBe(30_000);
	});

	it('without a context, a non-indexed income is treated as flat', () => {
		expect(level.grossAt(80)).toBe(30_000);
	});

	it('an indexed income never erodes', () => {
		const indexed = new IncomeSource('rent', 30_000, 67, 90, true, true);
		expect(indexed.grossAt(77, ctx)).toBe(30_000);
	});
});

describe('grossIncomeAt / taxableIncomeAt', () => {
	const sources = [
		new IncomeSource('work', 20_000, 67, 70),
		new IncomeSource('gift', 10_000, 67, 90, false) // non-taxable
	];

	it('sums gross across active sources', () => {
		expect(grossIncomeAt(sources, 67)).toBe(30_000);
		expect(grossIncomeAt(sources, 72)).toBe(10_000); // work ended, gift continues
	});

	it('sums only the taxable portion', () => {
		expect(taxableIncomeAt(sources, 67)).toBe(20_000); // gift excluded
		expect(taxableIncomeAt(sources, 72)).toBe(0); // only the non-taxable gift is left
	});

	it('is zero with no sources', () => {
		expect(grossIncomeAt([], 70)).toBe(0);
		expect(taxableIncomeAt([], 70)).toBe(0);
	});
});
