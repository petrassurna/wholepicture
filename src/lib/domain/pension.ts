// Australian Age Pension — pure, deterministic, no UI.
// Models BOTH means tests and pays the LOWER result, exactly as Centrelink does:
//   • Assets test — pension tapers as assessable assets rise.
//   • Income test — pension tapers as assessable income rises, where income is the
//     DEEMED income on financial assets (an assumed return, not the actual one) plus
//     any actual income (wages, rent). This is what makes a working retiree's or a
//     landlord's pension lower than assets alone would suggest.
// The result is a means-tested, tax-free, inflation-indexed income that RISES as the
// portfolio falls — turning a hard run-out into a glide onto a part-then-full pension.
//
// Today's-dollars assumption (as elsewhere): the pension is indexed, so its real
// value is constant and one year's scale applies to every projection year. Swap
// the dated scale below for a newer one when confirmed — nothing else changes.
//
// Not yet modelled: the Work Bonus (which exempts the first ~$300/fn of EMPLOYMENT
// income) — so a working retiree's income-test reduction is slightly overstated,
// i.e. the pension is conservative (never overstated) in that case; non-homeowner
// rent assistance; and the home-sale deeming exemption window. The family home is
// exempt from the assets test — and this model doesn't track it (spending assumes a
// homeowner) — so assessable assets are simply the financial portfolio (super + bank),
// which is also the base that deeming is applied to.

import type { Filing } from './tax';

export type Ownership = 'homeowner' | 'nonHomeowner';

export interface PensionScale {
	/** The date these figures took effect — shown to users so they can judge staleness. */
	readonly asAt: string;
	/** Maximum annual pension incl. supplements (single / couple combined). */
	readonly maxAnnual: Record<Filing, number>;
	/** Assets below this get the full pension; above it the payment tapers. */
	readonly assetFreeArea: Record<Ownership, Record<Filing, number>>;
	/** Annual pension reduction per $1 of assessable assets above the free area. */
	readonly taperPerDollar: number;
	/** Age of eligibility. */
	readonly eligibilityAge: number;
	// --- income test ---
	/** Assessable income below this (per year) doesn't reduce the pension; above it it tapers. */
	readonly incomeFreeArea: Record<Filing, number>;
	/** Annual pension reduction per $1 of assessable income above the free area (50c/$1). */
	readonly incomeTaperPerDollar: number;
	/** Deeming: financial assets are ASSUMED to earn this for the income test, whatever
	 *  their actual return. Two tiers — up to `threshold` at `rateLow`, the excess at `rateHigh`. */
	readonly deeming: {
		readonly rateLow: number;
		readonly rateHigh: number;
		readonly threshold: Record<Filing, number>;
	};
}

// ---------------------------------------------------------------------------
// !!!  VOLATILE — VERIFY BEFORE TRUSTING  !!!
// Age Pension rates and thresholds are indexed THREE times a year (20 March,
// 1 July, 20 September) and move every time. These are the 1 July 2026 figures
// from Services Australia / Noel Whittaker's calculator. They WILL go stale —
// confirm at servicesaustralia.gov.au and update `asAt` when you do. The taper
// ($3/fortnight per $1,000 = $78/yr per $1,000 = 0.078) has been stable since
// 2017. Max rates are the combined single / couple totals incl. supplements.
// Non-homeowner couple free area is derived from the homeowner offset and is
// unused while the app assumes a homeowner.
//
// Income test (also VOLATILE — VERIFY): income free areas $212/fn single and
// $372/fn couple, annualised here (×26). Deeming rates 0.25% / 2.25% have been
// frozen since 2020; thresholds ($62,600 single / $103,800 couple) index on 1 July.
// The 50c/$1 income taper has been stable for years.
// ---------------------------------------------------------------------------
export const PENSION_JUL_2026: PensionScale = {
	asAt: '1 July 2026',
	maxAnnual: { single: 31_223, couple: 47_070 },
	assetFreeArea: {
		homeowner: { single: 333_000, couple: 499_000 },
		nonHomeowner: { single: 600_000, couple: 766_000 }
	},
	taperPerDollar: 0.078,
	eligibilityAge: 67,
	incomeFreeArea: { single: 5_512, couple: 9_672 }, // $212/fn × 26, $372/fn × 26
	incomeTaperPerDollar: 0.5,
	deeming: {
		rateLow: 0.0025,
		rateHigh: 0.0225,
		threshold: { single: 62_600, couple: 103_800 }
	}
};

/** The scale used when a caller doesn't specify one. */
export const CURRENT_PENSION: PensionScale = PENSION_JUL_2026;

/** Deemed income on financial assets for the income test — a two-tier assumed
 *  return applied regardless of what the assets actually earn. */
function deemedIncome(financialAssets: number, filing: Filing, scale: PensionScale): number {
	const assets = Math.max(0, financialAssets);
	const threshold = scale.deeming.threshold[filing];
	const low = Math.min(assets, threshold) * scale.deeming.rateLow;
	const high = Math.max(0, assets - threshold) * scale.deeming.rateHigh;
	return low + high;
}

/**
 * Age Pension payable for the year, in today's dollars. Zero below the eligibility
 * age. Runs BOTH means tests and returns the LOWER (as Centrelink does):
 *   • Assets test — tapers as assessable (financial) assets rise.
 *   • Income test — tapers as assessable income rises, where income is deemed income
 *     on those same financial assets plus `actualIncome` (wages, rent…).
 * Tax-free.
 */
export function agePension(
	age: number,
	assessableAssets: number,
	actualIncome: number,
	filing: Filing,
	homeowner: boolean = true,
	scale: PensionScale = CURRENT_PENSION
): number {
	if (age < scale.eligibilityAge) return 0;
	const max = scale.maxAnnual[filing];

	// Assets test.
	const freeArea = scale.assetFreeArea[homeowner ? 'homeowner' : 'nonHomeowner'][filing];
	const assetsReduction = Math.max(0, assessableAssets - freeArea) * scale.taperPerDollar;
	const assetsTest = Math.max(0, max - assetsReduction);

	// Income test: deemed income on financial assets + actual income (wages, rent…).
	const assessableIncome = deemedIncome(assessableAssets, filing, scale) + Math.max(0, actualIncome);
	const incomeReduction =
		Math.max(0, assessableIncome - scale.incomeFreeArea[filing]) * scale.incomeTaperPerDollar;
	const incomeTest = Math.max(0, max - incomeReduction);

	// Centrelink pays whichever test gives the lower pension.
	return Math.min(assetsTest, incomeTest);
}
