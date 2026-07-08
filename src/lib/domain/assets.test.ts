import { describe, it, expect } from 'vitest';
import { Super, BankAccount, isTaxable } from './assets';

// Expected values are worked out by hand. Tax treatment is now a capability
// (ITaxable), not a rate baked into the asset.

describe('Super', () => {
	it('carries the fixed label and its balance/return', () => {
		const s = new Super(500_000, 0.07);
		expect(s.label).toBe('Superannuation');
		expect(s.balance).toBe(500_000);
		expect(s.nominalReturn).toBe(0.07);
	});

	it('is tax-free — structurally not ITaxable', () => {
		expect(isTaxable(new Super(500_000, 0.07))).toBe(false);
	});
});

describe('BankAccount', () => {
	it('carries a custom label and its balance/return', () => {
		const b = new BankAccount('Term deposit', 200_000, 0.04);
		expect(b.label).toBe('Term deposit');
		expect(b.balance).toBe(200_000);
		expect(b.nominalReturn).toBe(0.04);
	});

	it('is taxable — its whole return is assessable when no taxable rate is given', () => {
		const b = new BankAccount('td', 200_000, 0.04);
		expect(isTaxable(b)).toBe(true);
		// interest on the held balance: 200,000 × 4% = 8,000
		expect(b.assessableIncomeOn(200_000)).toBeCloseTo(8_000, 6);
		// scales with the balance actually held that year
		expect(b.assessableIncomeOn(100_000)).toBeCloseTo(4_000, 6);
		expect(b.assessableIncomeOn(0)).toBe(0);
	});

	it('assesses only the taxable yield when it differs from the return (growth investment)', () => {
		// A Vanguard-style account: 7% total return, but only 2.5% is taxable
		// distributions — the rest is untaxed capital growth.
		const v = new BankAccount('Vanguard', 250_000, 0.07, 0.025);
		expect(v.nominalReturn).toBe(0.07); // still grows at the full return
		expect(v.taxableRate).toBe(0.025);
		// assessable income = held × taxable yield: 250,000 × 2.5% = 6,250
		expect(v.assessableIncomeOn(250_000)).toBeCloseTo(6_250, 6);
		expect(v.assessableIncomeOn(100_000)).toBeCloseTo(2_500, 6);
	});
});

describe('isTaxable guard', () => {
	it('narrows a mixed portfolio to just the assessable assets', () => {
		const assets = [new Super(500_000, 0.07), new BankAccount('cash', 200_000, 0.045)];
		const taxable = assets.filter(isTaxable);
		expect(taxable).toHaveLength(1);
		expect(taxable[0].label).toBe('cash');
	});
});
