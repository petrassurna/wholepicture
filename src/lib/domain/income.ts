// Income sources during retirement (part-time work, rent, an annuity…).
// Income doesn't block super access at 65+ — it just reduces how much you draw
// from the pot. Each source is active within an age window and (usually) taxed.

export class IncomeSource {
	constructor(
		readonly label: string,
		readonly amount: number, // gross per year, today's dollars
		readonly fromAge: number,
		readonly toAge: number,
		readonly taxable: boolean = true
	) {}

	/** After-tax income at a given age — zero outside its window. */
	amountAt(age: number, taxRate: number): number {
		if (age < this.fromAge || age > this.toAge) return 0;
		return this.taxable ? this.amount * (1 - taxRate) : this.amount;
	}
}

/** Total after-tax income at a given age across all sources. */
export function incomeAt(sources: IncomeSource[], age: number, taxRate: number): number {
	return sources.reduce((sum, s) => sum + s.amountAt(age, taxRate), 0);
}
