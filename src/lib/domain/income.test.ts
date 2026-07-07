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
