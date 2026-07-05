// Domain assets. Each asset knows its own value, return, and tax treatment.
// Add new types (property, shares, defined-benefit…) by implementing Asset —
// the engine and the pooling logic don't change.

import type { Pot } from './projection';

export interface Asset {
	readonly label: string;
	readonly balance: number; // present value, today's dollars
	readonly nominalReturn: number; // its own long-run nominal return p.a. (pre-tax)
	/** Nominal return after tax on taxable income, given an effective tax rate. */
	afterTaxReturn(taxRate: number): number;
}

export class Super implements Asset {
	readonly label = 'Superannuation';
	constructor(
		readonly balance: number,
		readonly nominalReturn: number
	) {}
	// Pension-phase super earnings are tax-free, so the tax rate is ignored.
	afterTaxReturn(_taxRate: number): number {
		return this.nominalReturn;
	}
}

export class BankAccount implements Asset {
	constructor(
		readonly label: string,
		readonly balance: number,
		readonly nominalReturn: number
	) {}
	// Interest is assessable income, so it's reduced by the tax rate.
	afterTaxReturn(taxRate: number): number {
		return this.nominalReturn * (1 - taxRate);
	}
}

/** Blend a set of assets into one pot, using each asset's after-tax return. */
export function poolOf(assets: Asset[], taxRate: number): Pot {
	const balance = assets.reduce((sum, a) => sum + a.balance, 0);
	const nominalReturn =
		balance > 0
			? assets.reduce((sum, a) => sum + a.balance * a.afterTaxReturn(taxRate), 0) / balance
			: 0;
	return { balance, nominalReturn };
}
