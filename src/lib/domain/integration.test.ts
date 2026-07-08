import { describe, it, expect } from 'vitest';
import { Super, BankAccount, type Asset } from './assets';
import { Household } from './household';
import { IncomeSource } from './income';
import { project, type Assumptions, type Projection } from './projection';

// End-to-end: assets + household → projection. Verifies the pieces compose —
// taxable assets/income are taxed, super is not, and a couple's two thresholds
// mean less tax than a single on the same income. Mostly property-based so the
// tests survive an annual update to the tax constants.

const base: Assumptions = {
	startAge: 67,
	endAge: 95,
	spend: 55_000,
	inflation: 0.025,
	downturn: 0.3,
	recoveryYears: 5
};

const run = (assets: Asset[], h: Household, over: Partial<Assumptions> = {}): Projection =>
	project(
		assets,
		{
			...base,
			...over,
			incomeAt: (age) => ({ gross: h.grossIncomeAt(age), taxable: h.taxableIncomeAt(age) }),
			taxOn: (assess, age) => h.taxOn(assess, age)
		},
		'average'
	);

const bal = (p: Projection, age: number) => p.points.find((pt) => pt.age === age)!.balance;
const lastsPast = (p: Projection) => p.runsOutAge ?? Infinity;

describe('super is tax-free', () => {
	it('a super-only plan never pays tax, single or couple', () => {
		const assets = [new Super(600_000, 0.07)];
		expect(run(assets, new Household('single', [])).totalTax).toBe(0);
		expect(run(assets, new Household('couple', [])).totalTax).toBe(0);
	});
});

describe('taxable income is actually taxed', () => {
	const assets = [new Super(500_000, 0.07)];

	it('taxable income incurs tax and ends poorer than the same tax-free income', () => {
		const taxable = run(assets, new Household('single', [new IncomeSource('rent', 40_000, 67, 95, true)]));
		const free = run(assets, new Household('single', [new IncomeSource('gift', 40_000, 67, 95, false)]));

		expect(taxable.totalTax).toBeGreaterThan(0);
		expect(free.totalTax).toBe(0);
		// Same gross income, but tax on the taxable one leaves a smaller pot.
		expect(bal(taxable, 95)).toBeLessThan(bal(free, 95));
	});
});

describe('bank interest is taxed once it clears the thresholds', () => {
	it('a small term deposit stays under the tax-free point (no tax)', () => {
		// $200k × 4.5% = $9,000 interest < the effective senior tax-free point.
		const assets = [new Super(400_000, 0.07), new BankAccount('td', 200_000, 0.045)];
		expect(run(assets, new Household('single', [])).totalTax).toBe(0);
	});

	it('a large term deposit generates taxable interest', () => {
		// $900k × 4.5% = $40,500 interest → clearly past SAPTO's cut-out.
		const assets = [new Super(400_000, 0.07), new BankAccount('td', 900_000, 0.045)];
		expect(run(assets, new Household('single', [])).totalTax).toBeGreaterThan(0);
	});
});

describe('a couple pays less than a single on the same income', () => {
	it('splitting $60k of rent across two thresholds cuts the tax', () => {
		const assets = [new Super(600_000, 0.07)];
		const incomes = [new IncomeSource('rent', 60_000, 67, 95, true)];
		const single = run(assets, new Household('single', incomes));
		const couple = run(assets, new Household('couple', incomes));

		expect(single.totalTax).toBeGreaterThan(0);
		expect(couple.totalTax).toBeLessThan(single.totalTax);
	});
});

describe('income extends longevity end-to-end', () => {
	const assets = [new Super(500_000, 0.07)];

	it('early-retirement income makes the money last longer', () => {
		const none = run(assets, new Household('single', []));
		const withInc = run(assets, new Household('single', [new IncomeSource('work', 25_000, 67, 71, true)]));
		expect(lastsPast(withInc)).toBeGreaterThan(lastsPast(none));
	});
});

describe('retirement income feeds the Age Pension income test (UI→pension wiring)', () => {
	// Mirrors the UI path: an Income row becomes a taxable, non-super IncomeSource on
	// the Household (exactly what plan.incomes builds), and Household.agePensionAt feeds
	// it as actual income into the pension's income test. Guards the wiring from silently
	// regressing back to assets-test-only. $150k financial assets sits under the assets
	// free area, so any reduction here is the INCOME test binding.
	const fin = 150_000;
	const uiIncomeRow = (amount: number, from = 60, to = 100) =>
		new IncomeSource('income', amount, from, to, true, true); // taxable, not toSuper

	it('adding a retirement income row lowers the modelled pension', () => {
		const before = new Household('single', []).agePensionAt(fin, 70);
		const after = new Household('single', [uiIncomeRow(45_000)]).agePensionAt(fin, 70);
		expect(before).toBeGreaterThan(after); // income test now binds
		expect(after).toBeGreaterThanOrEqual(0);
	});

	it('only counts income while its age window is active', () => {
		// A job that ends before pension age must not affect the pension years.
		const earlyJob = new Household('single', [uiIncomeRow(40_000, 60, 66)]).agePensionAt(fin, 70);
		const none = new Household('single', []).agePensionAt(fin, 70);
		expect(earlyJob).toBeCloseTo(none, 6);
	});

	it('enough income drives the pension to zero', () => {
		expect(new Household('single', [uiIncomeRow(90_000)]).agePensionAt(fin, 70)).toBe(0);
	});
});
