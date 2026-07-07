// Australian Age Pension — pure, deterministic, no UI.
// v1 models the ASSETS test only: for asset-rich retirees it almost always binds
// (gives the lower of the two tests), so it captures the behaviour that matters —
// a means-tested, tax-free, inflation-indexed income that RISES as assets fall,
// turning a hard run-out into a glide onto a part-then-full pension.
//
// Today's-dollars assumption (as elsewhere): the pension is indexed, so its real
// value is constant and one year's scale applies to every projection year. Swap
// the dated scale below for a newer one when confirmed — nothing else changes.
//
// Not yet modelled (v1): the income test + deeming, and non-homeowner rent
// assistance. The family home is exempt from the assets test — and this model
// doesn't track it (spending assumes a homeowner) — so assessable assets are
// simply the financial portfolio (super + bank).

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
// ---------------------------------------------------------------------------
export const PENSION_JUL_2026: PensionScale = {
	asAt: '1 July 2026',
	maxAnnual: { single: 31_223, couple: 47_070 },
	assetFreeArea: {
		homeowner: { single: 333_000, couple: 499_000 },
		nonHomeowner: { single: 600_000, couple: 766_000 }
	},
	taperPerDollar: 0.078,
	eligibilityAge: 67
};

/** The scale used when a caller doesn't specify one. */
export const CURRENT_PENSION: PensionScale = PENSION_JUL_2026;

/**
 * Age Pension payable for the year (assets test), in today's dollars.
 * Zero below the eligibility age; full pension below the free area; tapers to
 * zero as assessable assets rise. Tax-free.
 */
export function agePension(
	age: number,
	assessableAssets: number,
	filing: Filing,
	homeowner: boolean = true,
	scale: PensionScale = CURRENT_PENSION
): number {
	if (age < scale.eligibilityAge) return 0;
	const max = scale.maxAnnual[filing];
	const freeArea = scale.assetFreeArea[homeowner ? 'homeowner' : 'nonHomeowner'][filing];
	const reduction = Math.max(0, assessableAssets - freeArea) * scale.taperPerDollar;
	return Math.max(0, max - reduction);
}
