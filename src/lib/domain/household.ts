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
import { grossIncomeAt, taxableIncomeAt, type IncomeSource, type RealCtx } from './income';
import { agePension } from './pension';

export class Household {
	constructor(
		readonly filing: Filing,
		readonly incomes: IncomeSource[],
		readonly scale: TaxScale = CURRENT
	) {}

	/** Gross income received at an age (offsets spending in the engine). */
	grossIncomeAt(age: number, ctx?: RealCtx): number {
		return grossIncomeAt(this.incomes, age, ctx);
	}

	/** Assessable income from income sources at an age (for reporting). */
	taxableIncomeAt(age: number, ctx?: RealCtx): number {
		return taxableIncomeAt(this.incomes, age, ctx);
	}

	/** Tax on the year's assessable income: investment income (from taxable assets)
	 *  plus taxable income sources. A couple splits the total 50/50 and is assessed
	 *  as two people; a single is assessed as one. */
	taxOn(assetAssessable: number, age: number, ctx?: RealCtx): number {
		const assessable = assetAssessable + this.taxableIncomeAt(age, ctx);
		if (this.filing === 'single') {
			return taxOwed(assessable, 'single', this.scale).total;
		}
		return 2 * taxOwed(assessable / 2, 'couple', this.scale).total;
	}

	/** Age Pension (assets test) payable given the year's financial assets. Tax-free;
	 *  v1 assumes the household owns its home (as the spending model does). */
	agePensionAt(financialAssets: number, age: number): number {
		return agePension(age, financialAssets, this.filing, true);
	}
}
