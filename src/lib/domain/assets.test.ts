import { describe, it, expect } from 'vitest';
import { Super, BankAccount, poolOf } from './assets';

// Expected values are worked out by hand — never by re-deriving the
// implementation's own formula — so a bug can't hide behind a matching test.

describe('Super', () => {
	it('carries the fixed label and its balance/return', () => {
		const s = new Super(500_000, 0.07);
		expect(s.label).toBe('Superannuation');
		expect(s.balance).toBe(500_000);
		expect(s.nominalReturn).toBe(0.07);
	});

	it('is tax-free — after-tax return equals the pre-tax return', () => {
		expect(new Super(500_000, 0.07).afterTaxReturn(0.3)).toBeCloseTo(0.07, 10);
	});
});

describe('BankAccount', () => {
	it('carries a custom label and its balance/return', () => {
		const b = new BankAccount('Term deposit', 200_000, 0.04);
		expect(b.label).toBe('Term deposit');
		expect(b.balance).toBe(200_000);
		expect(b.nominalReturn).toBe(0.04);
	});

	it('interest is taxed — after-tax return is rate × (1 − tax)', () => {
		// 4% at 30% tax → 4% × 0.7 = 2.8% (by hand)
		expect(new BankAccount('td', 200_000, 0.04).afterTaxReturn(0.3)).toBeCloseTo(0.028, 10);
	});
});

describe('poolOf — no tax', () => {
	it('is empty for no assets (and does not divide by zero)', () => {
		expect(poolOf([], 0)).toEqual({ balance: 0, nominalReturn: 0 });
	});

	it('returns a single asset unchanged', () => {
		const pot = poolOf([new Super(500_000, 0.07)], 0);
		expect(pot.balance).toBe(500_000);
		expect(pot.nominalReturn).toBeCloseTo(0.07, 10);
	});

	it('blends by balance-weighted average return', () => {
		// (500,000 × 7% + 200,000 × 4%) / 700,000 = 43,000 / 700,000 = 0.06142857…
		const pot = poolOf([new Super(500_000, 0.07), new BankAccount('cash', 200_000, 0.04)], 0);
		expect(pot.balance).toBe(700_000);
		expect(pot.nominalReturn).toBeCloseTo(0.06142857, 8);
	});

	it('gives a zero-balance asset zero weight', () => {
		const pot = poolOf([new Super(0, 0.07), new BankAccount('cash', 100_000, 0.03)], 0);
		expect(pot.balance).toBe(100_000);
		expect(pot.nominalReturn).toBeCloseTo(0.03, 10);
	});

	it('has zero return when every balance is zero (no NaN)', () => {
		const pot = poolOf([new Super(0, 0.07), new BankAccount('cash', 0, 0.03)], 0);
		expect(pot.balance).toBe(0);
		expect(pot.nominalReturn).toBe(0);
	});
});

describe('poolOf — with tax', () => {
	const assets = [new Super(500_000, 0.07), new BankAccount('cash', 200_000, 0.04)];

	it('taxes the bank return but not super (hand-calculated)', () => {
		// after-tax: super 7% (untaxed), bank 4% × 0.7 = 2.8%
		// blended = (500,000 × 7% + 200,000 × 2.8%) / 700,000
		//         = (35,000 + 5,600) / 700,000 = 40,600 / 700,000 = 0.058
		expect(poolOf(assets, 0.3).nominalReturn).toBeCloseTo(0.058, 8);
	});

	it('a higher tax rate lowers the blended return', () => {
		expect(poolOf(assets, 0.3).nominalReturn).toBeLessThan(poolOf(assets, 0).nominalReturn);
	});

	it('does not touch a super-only pool', () => {
		expect(poolOf([new Super(500_000, 0.07)], 0.3).nominalReturn).toBeCloseTo(0.07, 10);
	});
});
