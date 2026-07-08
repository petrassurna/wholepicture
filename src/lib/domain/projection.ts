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
	startAge: number; // timeline start (age now)
	endAge: number;
	spend: number; // per year, today's dollars (flat in real terms)
	inflation: number;
	downturn: number; // bad case: one-off crash in year 1 of drawdown
	recoveryYears: number; // ...that climbs back to its pre-crash level over N years
	/** Age drawdown begins. Before it, the plan is in accumulation (contributions in,
	 *  no spending). Defaults to startAge — i.e. retiring now, no accumulation phase. */
	retireAge?: number;
	/** Gross income at an age (offsets spending) and its taxable portion (reported). */
	incomeAt?: (age: number) => { gross: number; taxable: number };
	/** Tax on the year's assessable income, given investment income from taxable assets. */
	taxOn?: (assetAssessable: number, age: number) => number;
	/** Tax-free Age Pension for the year, given the opening financial assets. */
	pensionAt?: (financialAssets: number, age: number) => number;
	/** Net super contribution landing in the fund at an age (accumulation phase). */
	contributionAt?: (age: number) => number;
}

/** Super fund earnings are taxed 15% in the accumulation phase (0% in pension phase). */
const ACCUMULATION_EARNINGS_TAX = 0.15;

export interface Point {
	age: number;
	balance: number; // total portfolio, today's dollars
	balances: number[]; // per-asset opening balances this year (aligned to `assets`)
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
	const pensionAt = a.pensionAt ?? (() => 0);
	const taxOn = a.taxOn ?? (() => 0);
	const contributionAt = a.contributionAt ?? (() => 0);

	// Drawdown begins at retireAge; before it we accumulate. Clamp so a plan whose
	// retirement is already past just draws down from now.
	const retireAge = Math.max(a.retireAge ?? a.startAge, a.startAge);
	// Contributions land in super — the first non-taxable asset (or the first asset).
	const superIdx = Math.max(0, assets.findIndex((x) => !isTaxable(x)));

	const bals = assets.map((x) => x.balance);
	// Drawdown-phase real growth (super tax-free); accumulation-phase growth carries
	// the 15% earnings-tax drag on all assets.
	const growthDraw = assets.map((x) => realReturn(x.nominalReturn, a.inflation));
	const growthAccum = assets.map((x) =>
		realReturn(x.nominalReturn * (1 - ACCUMULATION_EARNINGS_TAX), a.inflation)
	);
	// A return that climbs from the post-crash level back to the pre-crash level
	// over `recoveryYears`; normal growth resumes afterwards.
	const recoveryReturn =
		a.recoveryYears > 0 ? Math.pow(1 / (1 - a.downturn), 1 / a.recoveryYears) - 1 : 0;

	const points: Point[] = [];
	let runsOutAge: number | null = null;
	let totalTax = 0;

	for (let age = a.startAge; age <= a.endAge; age++) {
		const opening = bals.reduce((s, b) => s + Math.max(0, b), 0);

		// --- Accumulation phase: still working, paying into super, not drawing ---
		if (age < retireAge) {
			points.push({ age, balance: Math.max(0, opening), balances: bals.slice(), tax: 0, assessableIncome: 0 });
			bals[superIdx] += contributionAt(age);
			for (let i = 0; i < bals.length; i++) bals[i] *= 1 + growthAccum[i];
			continue;
		}

		// --- Drawdown phase ---
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
			balances: bals.slice(),
			tax,
			assessableIncome: assetAssessable + inc.taxable
		});

		if (opening <= 0) {
			if (runsOutAge === null) runsOutAge = age;
			continue;
		}
		totalTax += tax;

		// Tax-free Age Pension for the year, from the opening financial assets — a
		// means-tested income that rises as the portfolio falls, so it offsets the draw.
		const pension = pensionAt(opening, age);

		// Net cash drawn from the portfolio: spending plus tax, less income and pension.
		drawPro(bals, a.spend + tax - inc.gross - pension);

		if (bals.reduce((s, b) => s + b, 0) <= 0) {
			bals.fill(0);
			if (runsOutAge === null) runsOutAge = age;
			continue;
		}

		// Grow each asset at its own return. The bad-case crash is timed to the start
		// of drawdown (sequence risk), so it hits the whole portfolio at retirement.
		const t = age - retireAge;
		for (let i = 0; i < bals.length; i++) {
			let g = growthDraw[i];
			if (scenario === 'bad') {
				if (t === 0) g = -a.downturn;
				else if (t <= a.recoveryYears) g = recoveryReturn;
			}
			bals[i] *= 1 + g;
		}
	}

	return { points, runsOutAge, totalTax };
}
