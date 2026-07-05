import { describe, it, expect } from 'vitest';
import { Super, BankAccount, poolOf } from './assets';
import { project, type Assumptions } from './projection';

// End-to-end: assets → pool (with tax) → projection. Verifies the pieces
// compose correctly, and specifically that tax on bank interest shortens how
// long the money lasts. Regression ages (83 / 82) were reproduced independently.

describe('tax reduces longevity end-to-end', () => {
	const assets = [new Super(500_000, 0.07), new BankAccount('cash', 200_000, 0.04)];
	const a: Assumptions = {
		startAge: 67,
		endAge: 95,
		spend: 55_000,
		inflation: 0.025,
		downturn: 0.3,
		recoveryYears: 5
	};

	const runsOut = (taxRate: number) => project(poolOf(assets, taxRate), a, 'average').runsOutAge;

	it('a higher tax rate never makes the money last longer', () => {
		expect(runsOut(0.3)!).toBeLessThanOrEqual(runsOut(0)!);
	});

	it('matches the independently reproduced run-out ages (0% → 83, 30% → 82)', () => {
		expect(runsOut(0)).toBe(83);
		expect(runsOut(0.3)).toBe(82);
	});

	it('does not change a super-only plan (super is tax-free)', () => {
		const superOnly = [new Super(500_000, 0.07)];
		const noTax = project(poolOf(superOnly, 0), a, 'average').runsOutAge;
		const withTax = project(poolOf(superOnly, 0.3), a, 'average').runsOutAge;
		expect(withTax).toBe(noTax);
	});
});

describe('income extends longevity end-to-end', () => {
	const pot = { balance: 500_000, nominalReturn: 0.07 };
	const base: Assumptions = {
		startAge: 67,
		endAge: 95,
		spend: 55_000,
		inflation: 0.025,
		downturn: 0.3,
		recoveryYears: 5
	};
	const bal = (proj: { points: { age: number; balance: number }[] }, age: number) =>
		proj.points.find((pt) => pt.age === age)!.balance;

	it('early-retirement income makes the money last longer', () => {
		const without = project(pot, base, 'average').runsOutAge!;
		const withInc = project(
			pot,
			{ ...base, incomeAt: (age) => (age <= 71 ? 25_500 : 0) },
			'average'
		).runsOutAge!;
		expect(withInc).toBeGreaterThan(without);
	});

	it('income above spending grows the pot in those years', () => {
		// $80k income vs $55k spend for the first 3 years → surplus is invested.
		const withSurplus = project(pot, { ...base, incomeAt: (age) => (age <= 69 ? 80_000 : 0) }, 'average');
		const flat = project(pot, base, 'average');
		expect(bal(withSurplus, 70)).toBeGreaterThan(bal(flat, 70));
	});
});
