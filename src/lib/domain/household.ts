// A household aggregate — the taxpayer(s) whose assessable income is taxed.
// It owns the income sources and the filing status, and is the ONLY place the
// per-person split for a couple lives. The projection asks it two things each
// year: how much gross income arrives (offsets spending) and how much tax is due.
//
// Splitting rule: for a couple, all assessable income (investment income plus
// taxable income sources) splits 50/50 between the two people, and tax is
// assessed per person via taxOwed and summed — which is what gives a couple two
// tax-free thresholds and two SAPTOs.

import { taxOwed, paygTax, CURRENT, type Filing, type TaxScale } from './tax';
import {
	grossIncomeAt,
	taxableIncomeAt,
	contributionsAt,
	type IncomeSource,
	type RealCtx
} from './income';
import { agePension } from './pension';

/** Concessional (before-tax) super contributions are taxed 15% going into the fund. */
export const CONTRIBUTIONS_TAX = 0.15;

/** Annual concessional contributions cap (employer SG + salary sacrifice + personal
 *  deductible), 2024–25 onward. Today's dollars; indexes ~with wages over time. */
export const CONCESSIONAL_CAP = 30_000;

/** How much salary sacrifice fits under the concessional cap once the employer SG
 *  (salary × sgRate) is counted. The cap includes the SG, so room = cap − SG, floored
 *  at zero (a high SG can use the whole cap on its own). */
export function salarySacrificeRoom(salary: number, sgRate: number): number {
	return Math.max(0, CONCESSIONAL_CAP - salary * sgRate);
}

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

	/** PAYG tax on a working-age salary (before retirement). A couple's COMBINED
	 *  salary splits 50/50 and is assessed per person — mirroring taxOn — so each
	 *  gets their own tax-free threshold; no SAPTO applies to working-age income. */
	paygOnSalary(salary: number): number {
		if (this.filing === 'single') return paygTax(salary, this.scale);
		return 2 * paygTax(salary / 2, this.scale);
	}

	/** Age Pension payable given the year's financial assets. Runs both means tests and
	 *  returns the lower — the income test uses deemed income on those assets plus the
	 *  household's actual income (wages, rent) this year. Tax-free; assumes a homeowner
	 *  (as the spending model does). */
	agePensionAt(financialAssets: number, age: number, ctx?: RealCtx): number {
		const actualIncome = this.grossIncomeAt(age, ctx);
		return agePension(age, financialAssets, actualIncome, this.filing, true);
	}

	/** Net super contribution landing in the fund at an age — the gross amount less
	 *  the 15% concessional contributions tax. */
	contributionAt(age: number, ctx?: RealCtx): number {
		return contributionsAt(this.incomes, age, ctx) * (1 - CONTRIBUTIONS_TAX);
	}
}
