// Domain assets. Each asset knows its own value and return. Assets that produce
// assessable income also implement ITaxable — the tax RATE is never an asset's
// concern (it's progressive and per-person; see household.ts + tax.ts), only the
// taxable AMOUNT is. Add new types (property, shares, defined-benefit…) by
// implementing Asset (and ITaxable if it's assessable); the engine doesn't change.

export interface Asset {
	readonly label: string;
	readonly balance: number; // present value, today's dollars
	readonly nominalReturn: number; // its own long-run nominal return p.a. (pre-tax)
}

/** Capability of an asset that generates income assessable for tax. */
export interface ITaxable {
	/** Assessable income earned by `held` dollars over one year, today's dollars. */
	assessableIncomeOn(held: number): number;
}

/** True when an asset produces assessable income (so tax-free assets are excluded structurally). */
export function isTaxable(a: Asset): a is Asset & ITaxable {
	return typeof (a as Partial<ITaxable>).assessableIncomeOn === 'function';
}

export class Super implements Asset {
	readonly label = 'Superannuation';
	constructor(
		readonly balance: number,
		readonly nominalReturn: number
	) {}
	// Pension-phase super earnings are tax-free, so Super is deliberately NOT ITaxable.
}

export class BankAccount implements Asset, ITaxable {
	constructor(
		readonly label: string,
		readonly balance: number,
		readonly nominalReturn: number
	) {}
	// A bank account's whole return is assessable interest.
	assessableIncomeOn(held: number): number {
		return held * this.nominalReturn;
	}
}
