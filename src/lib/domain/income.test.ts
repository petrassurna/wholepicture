import { describe, it, expect } from 'vitest';
import { IncomeSource, incomeAt } from './income';

// Hand-calculated expected values; window boundaries checked explicitly.

describe('IncomeSource', () => {
	const work = new IncomeSource('Part-time', 20_000, 67, 72); // taxable by default

	it('is taxed within its window (20,000 × 0.85 = 17,000 at 15%)', () => {
		expect(work.amountAt(67, 0.15)).toBeCloseTo(17_000, 6);
		expect(work.amountAt(72, 0.15)).toBeCloseTo(17_000, 6); // toAge is inclusive
	});

	it('is zero outside its window', () => {
		expect(work.amountAt(66, 0.15)).toBe(0);
		expect(work.amountAt(73, 0.15)).toBe(0);
	});

	it('is untaxed when marked non-taxable', () => {
		const taxFree = new IncomeSource('tax-free', 20_000, 67, 72, false);
		expect(taxFree.amountAt(67, 0.15)).toBe(20_000);
	});
});

describe('incomeAt', () => {
	it('sums after-tax income across sources active that year', () => {
		const sources = [
			new IncomeSource('work', 20_000, 67, 70),
			new IncomeSource('rent', 10_000, 67, 90)
		];
		// both active at 67: (20,000 + 10,000) × 0.85 = 25,500
		expect(incomeAt(sources, 67, 0.15)).toBeCloseTo(25_500, 6);
	});

	it('excludes sources outside their window', () => {
		const sources = [
			new IncomeSource('work', 20_000, 67, 70),
			new IncomeSource('rent', 10_000, 75, 90)
		];
		expect(incomeAt(sources, 72, 0.15)).toBe(0); // work ended, rent not started
		expect(incomeAt(sources, 68, 0.15)).toBeCloseTo(17_000, 6); // only work
	});

	it('is zero with no sources', () => {
		expect(incomeAt([], 70, 0.15)).toBe(0);
	});
});
