// A household aggregate — the taxpayer(s) whose assessable income is taxed.
// It owns the income sources and the filing status, and is the ONLY place the
// per-person split for a couple lives. The projection asks it two things each
// year: how much gross income arrives (offsets spending) and how much tax is due.
//
// Splitting rule: for a couple, all assessable income (investment income plus
// taxable income sources) splits 50/50 between the two people, and tax is
// assessed per person via taxOwed and summed — which is what gives a couple two
// tax-free thresholds and two SAPTOs.

import { taxOwed, CURRENT, type Filing, type TaxScale } from './tax';
import { grossIncomeAt, taxableIncomeAt, type IncomeSource } from './income';

export class Household {
	constructor(
		readonly filing: Filing,
		readonly incomes: IncomeSource[],
		readonly scale: TaxScale = CURRENT
	) {}

	/** Gross income received at an age (offsets spending in the engine). */
	grossIncomeAt(age: number): number {
		return grossIncomeAt(this.incomes, age);
	}

	/** Assessable income from income sources at an age (for reporting). */
	taxableIncomeAt(age: number): number {
		return taxableIncomeAt(this.incomes, age);
	}

	/** Tax on the year's assessable income: investment income (from taxable assets)
	 *  plus taxable income sources. A couple splits the total 50/50 and is assessed
	 *  as two people; a single is assessed as one. */
	taxOn(assetAssessable: number, age: number): number {
		const assessable = assetAssessable + this.taxableIncomeAt(age);
		if (this.filing === 'single') {
			return taxOwed(assessable, 'single', this.scale).total;
		}
		return 2 * taxOwed(assessable / 2, 'couple', this.scale).total;
	}
}
