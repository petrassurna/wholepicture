// Shared, reactive plan state — the raw values the user sets.
// The maths lives in the domain layer ($lib/domain); this just holds inputs
// and exposes the domain objects derived from them.

import { Super, BankAccount, poolOf, type Asset } from '$lib/domain/assets';
import { realReturn } from '$lib/domain/projection';
import { IncomeSource, incomeAt as sumIncomeAt } from '$lib/domain/income';

type Household = 'single' | 'couple';
type BankInput = { name: string; amount: number; rate: number };
type IncomeInput = { label: string; amount: number; fromAge: number; toAge: number };

const STORAGE_KEY = 'wholepicture.plan.v1';

// Defaults per household — ASFA "comfortable" figures (single vs couple combined).
const DEFAULTS: Record<Household, { superBalance: number; spendPerYear: number; superMax: number }> =
	{
		single: { superBalance: 500000, spendPerYear: 50000, superMax: 1000000 },
		couple: { superBalance: 700000, spendPerYear: 72500, superMax: 1500000 }
	};

class Plan {
	household = $state<Household>('single');

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

	// Effective tax rate on taxable income (bank interest, and future income).
	// Super pension is tax-free, so this doesn't touch super.
	taxRate = $state(0.15);

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

	get pot() {
		return poolOf(this.assets, this.taxRate);
	}

	get totalBalance() {
		return this.pot.balance;
	}

	get realReturn() {
		return realReturn(this.pot.nominalReturn, this.inflation);
	}

	get incomes(): IncomeSource[] {
		return this.incomeSources.map((s) => new IncomeSource(s.label, s.amount, s.fromAge, s.toAge));
	}

	/** After-tax income at a given age (offsets spending in the engine). */
	incomeAt(age: number): number {
		return sumIncomeAt(this.incomes, age, this.taxRate);
	}

	// Super slider ceiling depends on household (a couple's combined pot is bigger).
	get superMax() {
		return DEFAULTS[this.household].superMax;
	}

	setHousehold(h: Household) {
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
			toAge: this.retireAge + 5
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
				if (typeof d.taxRate === 'number') this.taxRate = d.taxRate;
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
							toAge: s.toAge
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
			recoveryYears: this.recoveryYears,
			taxRate: this.taxRate
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
		this.taxRate = 0.15;
	}
}

export const plan = new Plan();
