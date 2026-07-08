// Income sources during retirement (part-time work, rent, an annuity…).
// Income doesn't block super access — it just reduces how much you draw from the
// pot. Each source is active within an age window and (usually) taxable. Amounts
// here are GROSS; tax is assessed centrally on total assessable income (see
// household.ts), never per-source, because tax is progressive.
//
// Everything is in today's dollars. An income that rises with inflation has a
// constant real value (flat here) — that's `indexed`. An income fixed in dollar
// terms (e.g. a level annuity) loses real value each year, so with a real context
// (start age + inflation) we deflate it: real value at year k = amount /
// (1+inflation)^k. Without a context, amounts are treated as flat (indexed).

/** Real-terms context: the projection's start age and inflation rate. */
export interface RealCtx {
	startAge: number;
	inflation: number;
}

export class IncomeSource {
	constructor(
		readonly label: string,
		readonly amount: number, // gross per year, today's dollars (a salary when toSuper)
		readonly fromAge: number,
		readonly toAge: number,
		readonly taxable: boolean = true,
		readonly indexed: boolean = true, // rises with inflation (constant real value)
		readonly toSuper: boolean = false, // pays into super rather than being spendable income
		readonly superRate: number = 1 // fraction of the amount that goes into super (when toSuper)
	) {}

	activeAt(age: number): boolean {
		return age >= this.fromAge && age <= this.toAge;
	}

	/** Gross income received at an age, in today's dollars (zero outside its window). */
	grossAt(age: number, ctx?: RealCtx): number {
		if (!this.activeAt(age)) return 0;
		if (this.indexed || !ctx || ctx.inflation === 0) return this.amount;
		return this.amount / Math.pow(1 + ctx.inflation, age - ctx.startAge);
	}

	/** Assessable income at an age — gross if taxable and active, else zero. */
	taxableAt(age: number, ctx?: RealCtx): number {
		return this.taxable ? this.grossAt(age, ctx) : 0;
	}
}

/** Total spendable gross income at an age (super contributions are excluded —
 *  they go into the pot, they don't offset spending). */
export function grossIncomeAt(sources: IncomeSource[], age: number, ctx?: RealCtx): number {
	return sources.reduce((sum, s) => (s.toSuper ? sum : sum + s.grossAt(age, ctx)), 0);
}

/** Total assessable income at an age (super contributions excluded). */
export function taxableIncomeAt(sources: IncomeSource[], age: number, ctx?: RealCtx): number {
	return sources.reduce((sum, s) => (s.toSuper ? sum : sum + s.taxableAt(age, ctx)), 0);
}

/** Total gross super contributions at an age — the `superRate` share of each
 *  toSuper source (e.g. 12% SG on a salary). Contributions tax is applied later. */
export function contributionsAt(sources: IncomeSource[], age: number, ctx?: RealCtx): number {
	return sources.reduce((sum, s) => (s.toSuper ? sum + s.grossAt(age, ctx) * s.superRate : sum), 0);
}
