// Pure projection engine — no UI, no framework, deterministic.
// It evolves a PORTFOLIO of assets year by year: each asset grows at its own
// return and is drawn down pro-rata, taxable assets report their assessable
// income (see assets.ts / ITaxable), and tax on the year's assessable income is
// an explicit outflow (see household.ts). Assets are immutable definitions; the
// engine owns the mutable balances.
//
// Tax convention: assessable investment income is NOMINAL interest (balance ×
// nominal return), while balances grow at their REAL return (today's dollars).
// This is deliberately conservative — you're taxed on nominal interest but your
// purchasing power grows at the real rate — and matches how cash/TDs really are a
// weak store of value after tax.

import type { Asset } from './assets';
import { isTaxable } from './assets';

export type Scenario = 'average' | 'bad';

export interface Assumptions {
	startAge: number;
	endAge: number;
	spend: number; // per year, today's dollars (flat in real terms)
	inflation: number;
	downturn: number; // bad case: one-off crash in year 1
	recoveryYears: number; // ...that climbs back to its pre-crash level over N years
	/** Gross income at an age (offsets spending) and its taxable portion (reported). */
	incomeAt?: (age: number) => { gross: number; taxable: number };
	/** Tax on the year's assessable income, given investment income from taxable assets. */
	taxOn?: (assetAssessable: number, age: number) => number;
}

export interface Point {
	age: number;
	balance: number; // total portfolio, today's dollars
	tax: number; // tax paid that year
	assessableIncome: number; // investment interest + taxable income that year
}

export interface Projection {
	points: Point[];
	runsOutAge: number | null;
	totalTax: number;
}

/** Real return (today's dollars) from a nominal return and inflation. */
export function realReturn(nominal: number, inflation: number): number {
	return (1 + nominal) / (1 + inflation) - 1;
}

/** Withdraw `net` from the balances pro-rata (negative `net` reinvests a surplus). */
function drawPro(bals: number[], net: number): void {
	const pos = bals.map((b) => Math.max(0, b));
	const total = pos.reduce((s, b) => s + b, 0);
	if (total <= 0) {
		bals[0] -= net; // nothing to spread across; park it on the first asset
		return;
	}
	for (let i = 0; i < bals.length; i++) bals[i] -= net * (pos[i] / total);
}

export function project(assets: Asset[], a: Assumptions, scenario: Scenario): Projection {
	const incomeAt = a.incomeAt ?? (() => ({ gross: 0, taxable: 0 }));
	const taxOn = a.taxOn ?? (() => 0);

	const bals = assets.map((x) => x.balance);
	const growth = assets.map((x) => realReturn(x.nominalReturn, a.inflation));
	// A return that climbs from the post-crash level back to the pre-crash level
	// over `recoveryYears`; normal growth resumes afterwards.
	const recoveryReturn =
		a.recoveryYears > 0 ? Math.pow(1 / (1 - a.downturn), 1 / a.recoveryYears) - 1 : 0;

	const points: Point[] = [];
	let runsOutAge: number | null = null;
	let totalTax = 0;

	for (let age = a.startAge; age <= a.endAge; age++) {
		const opening = bals.reduce((s, b) => s + Math.max(0, b), 0);

		// This year's assessable investment income, on opening balances.
		let assetAssessable = 0;
		for (let i = 0; i < assets.length; i++) {
			const asset = assets[i];
			if (isTaxable(asset)) assetAssessable += asset.assessableIncomeOn(Math.max(0, bals[i]));
		}
		const inc = incomeAt(age);
		const tax = taxOn(assetAssessable, age);

		points.push({
			age,
			balance: Math.max(0, opening),
			tax,
			assessableIncome: assetAssessable + inc.taxable
		});

		if (opening <= 0) {
			if (runsOutAge === null) runsOutAge = age;
			continue;
		}
		totalTax += tax;

		// Net cash drawn from the portfolio: spending plus tax, less gross income.
		drawPro(bals, a.spend + tax - inc.gross);

		if (bals.reduce((s, b) => s + b, 0) <= 0) {
			bals.fill(0);
			if (runsOutAge === null) runsOutAge = age;
			continue;
		}

		// Grow each asset at its own return (the crash hits the whole portfolio).
		const t = age - a.startAge;
		for (let i = 0; i < bals.length; i++) {
			let g = growth[i];
			if (scenario === 'bad') {
				if (t === 0) g = -a.downturn;
				else if (t <= a.recoveryYears) g = recoveryReturn;
			}
			bals[i] *= 1 + g;
		}
	}

	return { points, runsOutAge, totalTax };
}
