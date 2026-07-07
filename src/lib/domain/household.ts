// A household aggregate — the taxpayer(s) whose assessable income is taxed.
// It owns the income sources and the filing status, and is the ONLY place the
// per-person split for a couple lives. The projection asks it two things each
// year: how much gross income arrives (offsets spending) and how much tax is due.
//
// Splitting rule: investment (asset) income splits 50/50 for a couple; each
// income source goes to its owner ('joint' splits 50/50). Tax is then assessed
// per person via taxOwed and summed — which is what gives a couple two tax-free
// thresholds and two SAPTOs.

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

	/** One person's owned assessable income: their half of investment income plus
	 *  the taxable income sources attributed to them ('joint' counted half). */
	private shareFor(person: 'a' | 'b', assetAssessable: number, age: number): number {
		return this.incomes.reduce((sum, s) => {
			const t = s.taxableAt(age);
			if (s.owner === person) return sum + t;
			if (s.owner === 'joint') return sum + t / 2;
			return sum;
		}, assetAssessable / 2);
	}

	/** Tax on the year's assessable income: investment income (from taxable assets)
	 *  plus taxable income sources, assessed per person and summed. */
	taxOn(assetAssessable: number, age: number): number {
		if (this.filing === 'single') {
			const assessable = assetAssessable + this.taxableIncomeAt(age);
			return taxOwed(assessable, 'single', this.scale).total;
		}
		return (
			taxOwed(this.shareFor('a', assetAssessable, age), 'couple', this.scale).total +
			taxOwed(this.shareFor('b', assetAssessable, age), 'couple', this.scale).total
		);
	}
}
