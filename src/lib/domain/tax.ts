// Australian personal income tax — pure, deterministic, no UI.
// Computes one person's tax on their assessable income for one year.
//
// Progressive tax can't be applied per-asset: it's levied on TOTAL taxable
// income through one set of brackets. So callers aggregate a person's assessable
// income (bank/TD interest + taxable income sources; super pension is excluded,
// being tax-free in pension phase) and pass the single figure here.
//
// Today's-dollars assumption: the projection runs in real terms, and we assume
// tax thresholds index with inflation, so ONE tax-year's scale applies to every
// projection year. Swap TAX_2024_25 for a newer year when confirmed — nothing
// else changes.

export type Filing = 'single' | 'couple';

/** A marginal bracket: `rate` applies to income above `over` (up to the next). */
interface Bracket {
	readonly over: number;
	readonly rate: number;
}

/** A tax offset that starts at `max` and tapers to zero above `threshold`. */
interface Offset {
	readonly max: number;
	readonly threshold: number;
	readonly taper: number; // cents per $1 of income above the threshold
}

/** The Low Income Tax Offset has two taper rates, so it's described explicitly. */
interface Lito {
	readonly max: number;
	readonly from: number; // income where the offset starts reducing
	readonly rate1: number; // first taper rate
	readonly to1: number; // income where the second taper rate takes over
	readonly rate2: number; // second taper rate (down to zero)
}

export interface TaxScale {
	readonly year: string;
	readonly brackets: readonly Bracket[]; // ascending by `over`; first is { over: 0 }
	readonly medicare: {
		readonly rate: number;
		/** No levy below this income; a 10c/$1 shade-in applies just above it. */
		readonly threshold: Record<Filing, number>;
		/** Working-age (non-senior) single low-income threshold — used for PAYG
		 *  take-home, where the senior threshold above doesn't apply. */
		readonly generalThreshold: number;
	};
	readonly sapto: Record<Filing, Offset>; // Seniors & Pensioners Tax Offset
	readonly lito: Lito; // Low Income Tax Offset
}

// ---------------------------------------------------------------------------
// 2024-25 resident scale. CONFIRM/UPDATE these against the ATO each tax year.
// Couple figures are applied PER PERSON against that person's own income — a
// simplification of the ATO's combined-income basis (and its transfer of unused
// SAPTO between partners), reasonable once household income is split per person.
// ---------------------------------------------------------------------------
export const TAX_2024_25: TaxScale = {
	year: '2024-25',
	brackets: [
		{ over: 0, rate: 0 },
		{ over: 18_200, rate: 0.16 },
		{ over: 45_000, rate: 0.3 },
		{ over: 135_000, rate: 0.37 },
		{ over: 190_000, rate: 0.45 }
	],
	medicare: {
		rate: 0.02,
		// Senior/pensioner (SAPTO-eligible) low-income thresholds. Couple is the
		// senior family threshold split in two, tested against each person.
		threshold: { single: 43_020, couple: 29_943 },
		// Working-age single low-income threshold (used for pre-retirement PAYG).
		generalThreshold: 27_222
	},
	sapto: {
		single: { max: 2_230, threshold: 32_279, taper: 0.125 },
		couple: { max: 1_602, threshold: 28_974, taper: 0.125 }
	},
	lito: { max: 700, from: 37_500, rate1: 0.05, to1: 45_000, rate2: 0.015 }
};

/** The scale used when a caller doesn't specify one. */
export const CURRENT: TaxScale = TAX_2024_25;

export interface TaxBreakdown {
	taxable: number;
	incomeTax: number; // gross marginal tax, before offsets
	sapto: number; // offset applied
	lito: number; // offset applied
	medicare: number; // Medicare levy (offsets don't reduce it)
	total: number; // net tax payable
}

/** Gross marginal income tax across the brackets. */
function marginalTax(taxable: number, brackets: readonly Bracket[]): number {
	let tax = 0;
	for (let i = 0; i < brackets.length; i++) {
		if (taxable <= brackets[i].over) break;
		const upper = i + 1 < brackets.length ? brackets[i + 1].over : Infinity;
		tax += (Math.min(taxable, upper) - brackets[i].over) * brackets[i].rate;
	}
	return tax;
}

/** A simple tapered offset (used for SAPTO): full below the threshold, then linear to zero. */
function taperedOffset(income: number, o: Offset): number {
	if (income <= o.threshold) return o.max;
	return Math.max(0, o.max - (income - o.threshold) * o.taper);
}

/** LITO with its two-stage taper. */
function litoOffset(income: number, l: Lito): number {
	if (income <= l.from) return l.max;
	if (income <= l.to1) return l.max - (income - l.from) * l.rate1;
	const atTo1 = l.max - (l.to1 - l.from) * l.rate1;
	return Math.max(0, atTo1 - (income - l.to1) * l.rate2);
}

/** Medicare levy: nil below the threshold, a 10c/$1 shade-in, then the flat rate. */
function medicareLevy(taxable: number, rate: number, threshold: number): number {
	if (taxable <= threshold) return 0;
	return Math.min(rate * taxable, 0.1 * (taxable - threshold));
}

/**
 * Tax payable on one person's assessable income for the year.
 * Offsets (SAPTO, LITO) are non-refundable — they cut income tax to zero at
 * most, and never reduce the Medicare levy.
 */
export function taxOwed(taxable: number, filing: Filing, scale: TaxScale = CURRENT): TaxBreakdown {
	const t = Math.max(0, taxable);
	const incomeTax = marginalTax(t, scale.brackets);
	const sapto = taperedOffset(t, scale.sapto[filing]);
	const lito = litoOffset(t, scale.lito);
	const netIncomeTax = Math.max(0, incomeTax - sapto - lito);
	const medicare = medicareLevy(t, scale.medicare.rate, scale.medicare.threshold[filing]);
	return { taxable: t, incomeTax, sapto, lito, medicare, total: netIncomeTax + medicare };
}

/**
 * PAYG income tax on ONE person's working-age salary: marginal tax + Medicare
 * levy − LITO. Returns the tax payable (so take-home = salary − paygTax).
 *
 * SAPTO is deliberately excluded — it's the Seniors & Pensioners Tax Offset, which
 * a pre-retirement earner isn't eligible for; applying it (as taxOwed does) would
 * understate PAYG on lower salaries. Medicare uses the working-age general
 * low-income threshold, not the senior one. This is for showing pre-retirement
 * take-home pay only — the projection engine runs on retirement-age income.
 */
export function paygTax(salary: number, scale: TaxScale = CURRENT): number {
	const s = Math.max(0, salary);
	const incomeTax = marginalTax(s, scale.brackets);
	const lito = litoOffset(s, scale.lito);
	const netIncomeTax = Math.max(0, incomeTax - lito);
	const medicare = medicareLevy(s, scale.medicare.rate, scale.medicare.generalThreshold);
	return netIncomeTax + medicare;
}
