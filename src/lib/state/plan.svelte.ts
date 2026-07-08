// Shared, reactive plan state — the raw values the user sets.
// The maths lives in the domain layer ($lib/domain); this just holds inputs
// and exposes the domain objects derived from them.

import { Super, BankAccount, type Asset } from '$lib/domain/assets';
import { realReturn, type Assumptions } from '$lib/domain/projection';
import { IncomeSource } from '$lib/domain/income';
import {
	Household,
	CONCESSIONAL_CAP,
	CONTRIBUTIONS_TAX,
	salarySacrificeRoom
} from '$lib/domain/household';
import type { Filing } from '$lib/domain/tax';

type BankInput = { name: string; amount: number; rate: number };
// Retirement income only — a salary paying into super is handled in the super
// fields below, not here.
type IncomeInput = {
	label: string;
	amount: number;
	fromAge: number;
	toAge: number;
	indexed: boolean;
};

// How often a spending amount recurs, and how many times a year that is.
export type Freq = 'weekly' | 'fortnightly' | 'monthly' | 'quarterly' | 'yearly';
export const FREQ: Record<Freq, number> = {
	weekly: 52,
	fortnightly: 26,
	monthly: 12,
	quarterly: 4,
	yearly: 1
};
export const FREQ_OPTIONS: { value: Freq; label: string }[] = [
	{ value: 'weekly', label: 'Weekly' },
	{ value: 'fortnightly', label: 'Fortnightly' },
	{ value: 'monthly', label: 'Monthly' },
	{ value: 'quarterly', label: 'Quarterly' },
	{ value: 'yearly', label: 'Yearly' }
];
// A spending line item: amount recurring at `freq` → yearly cost.
type SpendItem = { name: string; amount: number; freq: Freq };

const STORAGE_KEY = 'wholepicture.plan.v1';

// Defaults per household — ASFA "comfortable" figures (single vs couple combined).
const DEFAULTS: Record<Filing, { superBalance: number; spendPerYear: number; superMax: number }> = {
	single: { superBalance: 500000, spendPerYear: 50000, superMax: 1000000 },
	couple: { superBalance: 700000, spendPerYear: 72500, superMax: 1500000 }
};

// Worked sample budgets, shown by default so the Spending section is never a
// blank form. Amount × quantity = yearly cost; owner is informational (couples).
// Household fixed costs (rates, utilities, home) barely change with one vs two
// people; personal costs (food, health, entertainment, holidays) scale down —
// so single lands ~72% of couple, matching the ASFA single:couple ratio.
function defaultSpendItems(filing: Filing): SpendItem[] {
	if (filing === 'single') {
		// ≈ ASFA "comfortable" single, $52,200/yr (homeowner). Largest first.
		return [
			{ name: 'Food', amount: 730, freq: 'monthly' }, // 8,760
			{ name: 'Holidays', amount: 7000, freq: 'yearly' }, // 7,000
			{ name: 'Car', amount: 6000, freq: 'yearly' }, // 6,000
			{ name: 'Entertainment', amount: 95, freq: 'weekly' }, // 4,940
			{ name: 'Medical/dentist', amount: 3500, freq: 'yearly' }, // 3,500
			{ name: 'Rates', amount: 797, freq: 'quarterly' }, // 3,188
			{ name: 'Private health insurance', amount: 250, freq: 'monthly' }, // 3,000
			{ name: 'Home repairs', amount: 2800, freq: 'yearly' }, // 2,800
			{ name: 'Household goods', amount: 1972, freq: 'yearly' }, // 1,972 (balances to $52,200)
			{ name: 'Clothes & personal care', amount: 1800, freq: 'yearly' }, // 1,800
			{ name: 'Home insurance', amount: 1700, freq: 'yearly' }, // 1,700
			{ name: 'Gifts & donations', amount: 1500, freq: 'yearly' }, // 1,500
			{ name: 'Water', amount: 350, freq: 'quarterly' }, // 1,400
			{ name: 'Electricity', amount: 350, freq: 'quarterly' }, // 1,400
			{ name: 'Gas', amount: 300, freq: 'quarterly' }, // 1,200
			{ name: 'Internet', amount: 95, freq: 'monthly' }, // 1,140
			{ name: 'Transport', amount: 500, freq: 'yearly' }, // 500
			{ name: 'Mobile', amount: 300, freq: 'yearly' }, // 300
			{ name: 'Glasses', amount: 100, freq: 'yearly' } // 100
		];
	}
	// ≈ ASFA "comfortable" couple, $73,500/yr (homeowners). Largest first.
	return [
		{ name: 'Food', amount: 1300, freq: 'monthly' }, // 15,600
		{ name: 'Holidays', amount: 10000, freq: 'yearly' }, // 10,000
		{ name: 'Entertainment', amount: 135, freq: 'weekly' }, // 7,020
		{ name: 'Car', amount: 7000, freq: 'yearly' }, // 7,000
		{ name: 'Medical/dentist', amount: 5000, freq: 'yearly' }, // 5,000
		{ name: 'Private health insurance', amount: 400, freq: 'monthly' }, // 4,800
		{ name: 'Home repairs', amount: 3500, freq: 'yearly' }, // 3,500
		{ name: 'Rates', amount: 797, freq: 'quarterly' }, // 3,188
		{ name: 'Household goods', amount: 2972, freq: 'yearly' }, // 2,972 (balances to $73,500)
		{ name: 'Clothes & personal care', amount: 2800, freq: 'yearly' }, // 2,800
		{ name: 'Gifts & donations', amount: 2500, freq: 'yearly' }, // 2,500
		{ name: 'Home insurance', amount: 1700, freq: 'yearly' }, // 1,700
		{ name: 'Water', amount: 420, freq: 'quarterly' }, // 1,680
		{ name: 'Electricity', amount: 400, freq: 'quarterly' }, // 1,600
		{ name: 'Gas', amount: 400, freq: 'quarterly' }, // 1,600
		{ name: 'Internet', amount: 95, freq: 'monthly' }, // 1,140
		{ name: 'Mobile', amount: 50, freq: 'monthly' }, // 600
		{ name: 'Transport', amount: 600, freq: 'yearly' }, // 600
		{ name: 'Glasses', amount: 200, freq: 'yearly' } // 200
	];
}

/** True when two spend lists are identical — used to detect an untouched default. */
function sameItems(a: SpendItem[], b: SpendItem[]): boolean {
	return JSON.stringify(a) === JSON.stringify(b);
}

class Plan {
	household = $state<Filing>('single');

	// You / timeframe
	spendPerYear = $state(DEFAULTS.single.spendPerYear);
	currentAge = $state(67); // age now; if below retireAge you get an accumulation phase
	retireAge = $state(67);
	planToAge = $state(90);

	// Superannuation
	superBalance = $state(DEFAULTS.single.superBalance);
	superReturn = $state(0.07); // nominal p.a.
	// Contributions while still working (accumulation). Only used if currentAge < retireAge.
	// sgRate = employer Super Guarantee rate on salary; salarySacrifice = extra before-tax
	// dollars. Both are concessional (taxed 15% going in).
	salary = $state(0);
	sgRate = $state(0.12);
	salarySacrifice = $state(0);

	// Bank accounts / term deposits — each with its own rate
	bankAccounts = $state<BankInput[]>([]);

	// Income during retirement (part-time work, rent…) — reduces what you draw
	incomeSources = $state<IncomeInput[]>([]);

	// Itemised spending breakdown; when it has items it drives `spend`.
	// Seeded with a sample budget so the section is never empty on first load.
	spendItems = $state<SpendItem[]>(defaultSpendItems('single'));

	// Market assumptions
	inflation = $state(0.025);
	downturn = $state(0.3);
	recoveryYears = $state(5);

	// Include the means-tested Age Pension (assets test) as it phases in.
	includePension = $state(true);

	// Don't persist until we've loaded, so the initial save() can't clobber
	// saved data with the defaults.
	_loaded = false;

	// --- domain objects derived from the raw inputs ---

	get assets(): Asset[] {
		return [
			new Super(this.superBalance, this.superReturn),
			...this.bankAccounts.map(
				(a) => new BankAccount(a.name || 'Bank/investment account', a.amount, a.rate)
			)
		];
	}

	get incomes(): IncomeSource[] {
		// Retirement income (offsets drawdown), plus — while still working — super
		// contributions modelled as toSuper sources over the accumulation years: the
		// employer SG (a % of salary) and any salary sacrifice (a flat $ amount). The
		// domain treats both as contributions (taxed 15%), not spendable income.
		const sources = this.incomeSources.map(
			(s) => new IncomeSource(s.label, s.amount, s.fromAge, s.toAge, true, s.indexed ?? true)
		);
		const working = this.currentAge < this.retireAge;
		if (working && this.salary > 0) {
			sources.push(
				new IncomeSource(
					'Salary (SG)',
					this.salary,
					this.currentAge,
					this.retireAge - 1,
					true,
					true,
					true,
					this.sgRate
				)
			);
		}
		if (working && this.effectiveSacrifice > 0) {
			sources.push(
				new IncomeSource(
					'Salary sacrifice',
					this.effectiveSacrifice,
					this.currentAge,
					this.retireAge - 1,
					true,
					true,
					true,
					1
				)
			);
		}
		return sources;
	}

	// Concessional cap ($30k) covers SG + salary sacrifice. What's left for sacrifice
	// after the employer SG is the most the model will accept; anything above is clamped.
	readonly concessionalCap = CONCESSIONAL_CAP;
	get salarySacrificeCap(): number {
		return salarySacrificeRoom(this.salary, this.sgRate);
	}
	get effectiveSacrifice(): number {
		return Math.min(this.salarySacrifice, this.salarySacrificeCap);
	}
	get sacrificeOverCap(): boolean {
		return this.currentAge < this.retireAge && this.salarySacrifice > this.salarySacrificeCap;
	}

	/** The taxpayer(s): filing status + income sources. */
	get taxUnit(): Household {
		return new Household(this.household, this.incomes);
	}

	/** PAYG tax on the pre-retirement salary (gross, before any salary sacrifice). */
	get salaryTax(): number {
		return this.taxUnit.paygOnSalary(this.salary);
	}

	/** Take-home pay from the salary after PAYG tax. */
	get salaryTakeHome(): number {
		return Math.max(0, this.salary - this.salaryTax);
	}

	/** Yearly surplus: take-home pay less spending (a plain observation, not advice). */
	get salarySurplus(): number {
		return this.salaryTakeHome - this.spend;
	}

	/** Concessional-cap room still available for salary sacrifice — the $30k cap less
	 *  the employer SG and any sacrifice already entered. Caps what's actually allowed. */
	get sacrificeRoomLeft(): number {
		return Math.max(0, this.salarySacrificeCap - this.effectiveSacrifice);
	}

	/** Gross employer Super Guarantee contribution for the year (salary × SG rate). */
	get sgContribution(): number {
		return this.salary * this.sgRate;
	}

	/** What the SG actually adds to super, after the 15% concessional contributions tax. */
	get sgIntoSuper(): number {
		return this.sgContribution * (1 - CONTRIBUTIONS_TAX);
	}

	/** Real-terms context so non-indexed income erodes by inflation over the plan. */
	get realCtx() {
		return { startAge: this.retireAge, inflation: this.inflation };
	}

	get totalBalance(): number {
		return this.assets.reduce((sum, a) => sum + a.balance, 0);
	}

	/** Effective yearly spend: the itemised total when broken down, else the simple figure. */
	get spend(): number {
		return this.spendItems.length
			? this.spendItems.reduce((sum, it) => sum + it.amount * FREQ[it.freq], 0)
			: this.spendPerYear;
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
		const ctx = this.realCtx;
		return { gross: h.grossIncomeAt(age, ctx), taxable: h.taxableIncomeAt(age, ctx) };
	}

	/** Tax on the year's assessable income given investment income from taxable assets. */
	taxOn(assetAssessable: number, age: number): number {
		return this.taxUnit.taxOn(assetAssessable, age, this.realCtx);
	}

	/** Tax-free Age Pension for the year, given the opening financial assets. */
	pensionAt(financialAssets: number, age: number): number {
		return this.includePension ? this.taxUnit.agePensionAt(financialAssets, age, this.realCtx) : 0;
	}

	/** Net super contribution landing in the fund at an age (accumulation phase). */
	contributionAt(age: number): number {
		return this.taxUnit.contributionAt(age, this.realCtx);
	}

	/** The full set of projection assumptions — used by both the chart and the
	 *  calculations panel so they always describe the same run. */
	buildAssumptions(): Assumptions {
		return {
			startAge: this.currentAge,
			retireAge: this.retireAge,
			endAge: this.planToAge,
			spend: this.spend,
			inflation: this.inflation,
			downturn: this.downturn,
			recoveryYears: this.recoveryYears,
			incomeAt: (age) => this.incomeAt(age),
			taxOn: (assess, age) => this.taxOn(assess, age),
			pensionAt: (assets, age) => this.pensionAt(assets, age),
			contributionAt: (age) => this.contributionAt(age)
		};
	}

	// Super slider ceiling depends on household (a couple's combined pot is bigger).
	get superMax() {
		return DEFAULTS[this.household].superMax;
	}

	/**
	 * Switch single/couple, updating each household-dependent field to the new
	 * household's default — but ONLY where the user hasn't customised it, so a
	 * flip never wipes real edits. "Pristine" = still equal to the CURRENT
	 * household's default.
	 */
	setHousehold(h: Filing) {
		const cur = this.household;
		if (this.superBalance === DEFAULTS[cur].superBalance)
			this.superBalance = DEFAULTS[h].superBalance;
		if (this.spendPerYear === DEFAULTS[cur].spendPerYear)
			this.spendPerYear = DEFAULTS[h].spendPerYear;
		if (sameItems(this.spendItems, defaultSpendItems(cur))) this.spendItems = defaultSpendItems(h);
		this.household = h;
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
			indexed: true
		});
	}

	removeIncome(i: number) {
		this.incomeSources.splice(i, 1);
	}

	addSpendItem() {
		this.spendItems.push({ name: '', amount: 0, freq: 'monthly' });
	}

	removeSpendItem(i: number) {
		this.spendItems.splice(i, 1);
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
				if (typeof d.currentAge === 'number') this.currentAge = d.currentAge;
				if (typeof d.retireAge === 'number') this.retireAge = d.retireAge;
				if (typeof d.planToAge === 'number') this.planToAge = d.planToAge;
				if (typeof d.superBalance === 'number') this.superBalance = d.superBalance;
				if (typeof d.superReturn === 'number') this.superReturn = d.superReturn;
				if (typeof d.salary === 'number') this.salary = d.salary;
				// `superContribRate` is the legacy key (was the blended SG+sacrifice %).
				if (typeof d.sgRate === 'number') this.sgRate = d.sgRate;
				else if (typeof d.superContribRate === 'number') this.sgRate = d.superContribRate;
				if (typeof d.salarySacrifice === 'number') this.salarySacrifice = d.salarySacrifice;
				if (typeof d.inflation === 'number') this.inflation = d.inflation;
				if (typeof d.downturn === 'number') this.downturn = d.downturn;
				if (typeof d.recoveryYears === 'number') this.recoveryYears = d.recoveryYears;
				if (typeof d.includePension === 'boolean') this.includePension = d.includePension;
				if (Array.isArray(d.bankAccounts)) {
					this.bankAccounts = d.bankAccounts
						.filter(
							(a: BankInput) => a && typeof a.amount === 'number' && typeof a.rate === 'number'
						)
						.map((a: BankInput) => ({
							name: String(a.name ?? ''),
							amount: a.amount,
							rate: a.rate
						}));
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
							indexed: typeof s.indexed === 'boolean' ? s.indexed : true
						}));
				}
				if (Array.isArray(d.spendItems)) {
					// Accept new {freq} items; migrate legacy {quantity} items — map a
					// standard quantity to its frequency, else fold it into a yearly amount.
					const qtyToFreq: Record<number, Freq> = {
						52: 'weekly',
						26: 'fortnightly',
						12: 'monthly',
						4: 'quarterly',
						1: 'yearly'
					};
					this.spendItems = d.spendItems
						.filter((it: { amount?: unknown }) => it && typeof it.amount === 'number')
						.map((it: { name?: unknown; amount: number; freq?: unknown; quantity?: unknown }) => {
							let freq: Freq = 'monthly';
							if (typeof it.freq === 'string' && it.freq in FREQ) freq = it.freq as Freq;
							else if (typeof it.quantity === 'number') freq = qtyToFreq[it.quantity] ?? 'yearly';
							const amount =
								typeof it.freq !== 'string' &&
								typeof it.quantity === 'number' &&
								!(it.quantity in qtyToFreq)
									? it.amount * it.quantity // non-standard quantity → annualise
									: it.amount;
							return { name: String(it.name ?? ''), amount, freq };
						});
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
			currentAge: this.currentAge,
			retireAge: this.retireAge,
			planToAge: this.planToAge,
			superBalance: this.superBalance,
			superReturn: this.superReturn,
			salary: this.salary,
			sgRate: this.sgRate,
			salarySacrifice: this.salarySacrifice,
			bankAccounts: this.bankAccounts,
			incomeSources: this.incomeSources,
			spendItems: this.spendItems,
			inflation: this.inflation,
			downturn: this.downturn,
			recoveryYears: this.recoveryYears,
			includePension: this.includePension
		});
		if (this._loaded && typeof localStorage !== 'undefined') {
			try {
				localStorage.setItem(STORAGE_KEY, json);
			} catch {
				// storage full / unavailable — ignore
			}
		}
	}

	/** Clear saved data and force every value back to defaults (unconditionally). */
	reset() {
		if (typeof localStorage !== 'undefined') localStorage.removeItem(STORAGE_KEY);
		this.household = 'single';
		this.superBalance = DEFAULTS.single.superBalance;
		this.spendPerYear = DEFAULTS.single.spendPerYear;
		this.currentAge = 67;
		this.retireAge = 67;
		this.planToAge = 90;
		this.superReturn = 0.07;
		this.salary = 0;
		this.sgRate = 0.12;
		this.salarySacrifice = 0;
		this.bankAccounts = [];
		this.incomeSources = [];
		this.spendItems = defaultSpendItems('single');
		this.inflation = 0.025;
		this.downturn = 0.3;
		this.recoveryYears = 5;
		this.includePension = true;
	}
}

export const plan = new Plan();
