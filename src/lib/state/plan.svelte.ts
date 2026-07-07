// Shared, reactive plan state — the raw values the user sets.
// The maths lives in the domain layer ($lib/domain); this just holds inputs
// and exposes the domain objects derived from them.

import { Super, BankAccount, type Asset } from '$lib/domain/assets';
import { realReturn } from '$lib/domain/projection';
import { IncomeSource, type Owner } from '$lib/domain/income';
import { Household } from '$lib/domain/household';
import type { Filing } from '$lib/domain/tax';

type BankInput = { name: string; amount: number; rate: number };
type IncomeInput = {
	label: string;
	amount: number;
	fromAge: number;
	toAge: number;
	owner: Owner;
};

const STORAGE_KEY = 'wholepicture.plan.v1';

// Defaults per household — ASFA "comfortable" figures (single vs couple combined).
const DEFAULTS: Record<Filing, { superBalance: number; spendPerYear: number; superMax: number }> = {
	single: { superBalance: 500000, spendPerYear: 50000, superMax: 1000000 },
	couple: { superBalance: 700000, spendPerYear: 72500, superMax: 1500000 }
};

class Plan {
	household = $state<Filing>('single');

	// You / timeframe
	spendPerYear = $state(DEFAULTS.single.spendPerYear);
	retireAge = $state(67);
	planToAge = $state(90);

	// Superannuation
	superBalance = $state(DEFAULTS.single.superBalance);
	superReturn = $state(0.07); // nominal p.a.

	// Bank accounts / term deposits — each with its own rate
	bankAccounts = $state<BankInput[]>([]);

	// Income during retirement (part-time work, rent…) — reduces what you draw
	incomeSources = $state<IncomeInput[]>([]);

	// Market assumptions
	inflation = $state(0.025);
	downturn = $state(0.3);
	recoveryYears = $state(5);

	// Don't persist until we've loaded, so the initial save() can't clobber
	// saved data with the defaults.
	_loaded = false;

	// --- domain objects derived from the raw inputs ---

	get assets(): Asset[] {
		return [
			new Super(this.superBalance, this.superReturn),
			...this.bankAccounts.map((a) => new BankAccount(a.name || 'Bank account', a.amount, a.rate))
		];
	}

	get incomes(): IncomeSource[] {
		return this.incomeSources.map(
			(s) => new IncomeSource(s.label, s.amount, s.fromAge, s.toAge, true, s.owner ?? 'joint')
		);
	}

	/** The taxpayer(s): filing status + income sources. */
	get taxUnit(): Household {
		return new Household(this.household, this.incomes);
	}

	get totalBalance(): number {
		return this.assets.reduce((sum, a) => sum + a.balance, 0);
	}

	/** Whether any assessable income exists — drives the Tax view's visibility. */
	get hasTaxableItems(): boolean {
		return this.bankAccounts.some((a) => a.amount > 0) || this.incomeSources.length > 0;
	}

	/** Balance-weighted real return across the portfolio (for display). */
	get realReturn(): number {
		const total = this.totalBalance;
		if (total <= 0) return 0;
		const blended = this.assets.reduce((s, a) => s + a.balance * a.nominalReturn, 0) / total;
		return realReturn(blended, this.inflation);
	}

	/** Gross income (offsets spending) and its taxable portion, at an age. */
	incomeAt(age: number): { gross: number; taxable: number } {
		const h = this.taxUnit;
		return { gross: h.grossIncomeAt(age), taxable: h.taxableIncomeAt(age) };
	}

	/** Tax on the year's assessable income given investment income from taxable assets. */
	taxOn(assetAssessable: number, age: number): number {
		return this.taxUnit.taxOn(assetAssessable, age);
	}

	// Super slider ceiling depends on household (a couple's combined pot is bigger).
	get superMax() {
		return DEFAULTS[this.household].superMax;
	}

	setHousehold(h: Filing) {
		this.household = h;
		this.superBalance = DEFAULTS[h].superBalance;
		this.spendPerYear = DEFAULTS[h].spendPerYear;
	}

	addBankAccount() {
		this.bankAccounts.push({ name: '', amount: 0, rate: 0.045 });
	}

	removeBankAccount(i: number) {
		this.bankAccounts.splice(i, 1);
	}

	addIncome() {
		this.incomeSources.push({
			label: '',
			amount: 0,
			fromAge: this.retireAge,
			toAge: this.retireAge + 5,
			owner: 'joint'
		});
	}

	removeIncome(i: number) {
		this.incomeSources.splice(i, 1);
	}

	/** Restore saved values (client-only; a no-op on the server). */
	load() {
		if (typeof localStorage === 'undefined') return;
		try {
			const raw = localStorage.getItem(STORAGE_KEY);
			if (raw) {
				const d = JSON.parse(raw);
				if (d.household === 'single' || d.household === 'couple') this.household = d.household;
				if (typeof d.spendPerYear === 'number') this.spendPerYear = d.spendPerYear;
				if (typeof d.retireAge === 'number') this.retireAge = d.retireAge;
				if (typeof d.planToAge === 'number') this.planToAge = d.planToAge;
				if (typeof d.superBalance === 'number') this.superBalance = d.superBalance;
				if (typeof d.superReturn === 'number') this.superReturn = d.superReturn;
				if (typeof d.inflation === 'number') this.inflation = d.inflation;
				if (typeof d.downturn === 'number') this.downturn = d.downturn;
				if (typeof d.recoveryYears === 'number') this.recoveryYears = d.recoveryYears;
				if (Array.isArray(d.bankAccounts)) {
					this.bankAccounts = d.bankAccounts
						.filter((a: BankInput) => a && typeof a.amount === 'number' && typeof a.rate === 'number')
						.map((a: BankInput) => ({ name: String(a.name ?? ''), amount: a.amount, rate: a.rate }));
				}
				if (Array.isArray(d.incomeSources)) {
					this.incomeSources = d.incomeSources
						.filter(
							(s: IncomeInput) =>
								s &&
								typeof s.amount === 'number' &&
								typeof s.fromAge === 'number' &&
								typeof s.toAge === 'number'
						)
						.map((s: IncomeInput) => ({
							label: String(s.label ?? ''),
							amount: s.amount,
							fromAge: s.fromAge,
							toAge: s.toAge,
							owner: s.owner === 'a' || s.owner === 'b' || s.owner === 'joint' ? s.owner : 'joint'
						}));
				}
			}
		} catch {
			// ignore corrupt or unavailable storage
		}
		this._loaded = true;
	}

	/** Persist current values. Reads every field so it tracks as a Svelte effect. */
	save() {
		const json = JSON.stringify({
			household: this.household,
			spendPerYear: this.spendPerYear,
			retireAge: this.retireAge,
			planToAge: this.planToAge,
			superBalance: this.superBalance,
			superReturn: this.superReturn,
			bankAccounts: this.bankAccounts,
			incomeSources: this.incomeSources,
			inflation: this.inflation,
			downturn: this.downturn,
			recoveryYears: this.recoveryYears
		});
		if (this._loaded && typeof localStorage !== 'undefined') {
			try {
				localStorage.setItem(STORAGE_KEY, json);
			} catch {
				// storage full / unavailable — ignore
			}
		}
	}

	/** Clear saved data and return to defaults. */
	reset() {
		if (typeof localStorage !== 'undefined') localStorage.removeItem(STORAGE_KEY);
		this.setHousehold('single');
		this.retireAge = 67;
		this.planToAge = 90;
		this.superReturn = 0.07;
		this.bankAccounts = [];
		this.incomeSources = [];
		this.inflation = 0.025;
		this.downturn = 0.3;
		this.recoveryYears = 5;
	}
}

export const plan = new Plan();
