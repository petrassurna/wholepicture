// Income sources during retirement (part-time work, rent, an annuity…).
// Income doesn't block super access — it just reduces how much you draw from the
// pot. Each source is active within an age window and (usually) taxable. Amounts
// here are GROSS; tax is assessed centrally on total assessable income (see
// household.ts), never per-source, because tax is progressive.

export class IncomeSource {
	constructor(
		readonly label: string,
		readonly amount: number, // gross per year, today's dollars
		readonly fromAge: number,
		readonly toAge: number,
		readonly taxable: boolean = true
	) {}

	activeAt(age: number): boolean {
		return age >= this.fromAge && age <= this.toAge;
	}

	/** Gross income received at an age (zero outside its window). */
	grossAt(age: number): number {
		return this.activeAt(age) ? this.amount : 0;
	}

	/** Assessable income at an age — gross if taxable and active, else zero. */
	taxableAt(age: number): number {
		return this.taxable ? this.grossAt(age) : 0;
	}
}

/** Total gross income at an age across all sources. */
export function grossIncomeAt(sources: IncomeSource[], age: number): number {
	return sources.reduce((sum, s) => sum + s.grossAt(age), 0);
}

/** Total assessable income at an age across all sources. */
export function taxableIncomeAt(sources: IncomeSource[], age: number): number {
	return sources.reduce((sum, s) => sum + s.taxableAt(age), 0);
}
