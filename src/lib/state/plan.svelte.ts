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
// A spending line item: amount × quantity = yearly cost. Owner is informational
// (couples), so you can see who spends what; the projection uses the total.
type SpendItem = { name: string; amount: number; quantity: number; owner: Owner };

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
			{ name: 'Food', amount: 730, quantity: 12, owner: 'joint' }, // 8,760
			{ name: 'Holidays', amount: 7000, quantity: 1, owner: 'joint' }, // 7,000
			{ name: 'Car', amount: 6000, quantity: 1, owner: 'joint' }, // 6,000
			{ name: 'Entertainment', amount: 95, quantity: 52, owner: 'joint' }, // 4,940
			{ name: 'Medical/dentist', amount: 3500, quantity: 1, owner: 'joint' }, // 3,500
			{ name: 'Rates', amount: 797, quantity: 4, owner: 'joint' }, // 3,188
			{ name: 'Private health insurance', amount: 250, quantity: 12, owner: 'joint' }, // 3,000
			{ name: 'Home repairs', amount: 2800, quantity: 1, owner: 'joint' }, // 2,800
			{ name: 'Household goods', amount: 1972, quantity: 1, owner: 'joint' }, // 1,972 (balances to $52,200)
			{ name: 'Clothes & personal care', amount: 1800, quantity: 1, owner: 'joint' }, // 1,800
			{ name: 'Home insurance', amount: 1700, quantity: 1, owner: 'joint' }, // 1,700
			{ name: 'Gifts & donations', amount: 1500, quantity: 1, owner: 'joint' }, // 1,500
			{ name: 'Water', amount: 350, quantity: 4, owner: 'joint' }, // 1,400
			{ name: 'Electricity', amount: 350, quantity: 4, owner: 'joint' }, // 1,400
			{ name: 'Gas', amount: 300, quantity: 4, owner: 'joint' }, // 1,200
			{ name: 'Internet', amount: 95, quantity: 12, owner: 'joint' }, // 1,140
			{ name: 'Transport', amount: 500, quantity: 1, owner: 'joint' }, // 500
			{ name: 'Mobile', amount: 300, quantity: 1, owner: 'joint' }, // 300
			{ name: 'Glasses', amount: 100, quantity: 1, owner: 'joint' } // 100
		];
	}
	// ≈ ASFA "comfortable" couple, $73,500/yr (homeowners). Largest first.
	return [
		{ name: 'Food', amount: 1300, quantity: 12, owner: 'joint' }, // 15,600
		{ name: 'Holidays', amount: 10000, quantity: 1, owner: 'joint' }, // 10,000
		{ name: 'Entertainment', amount: 135, quantity: 52, owner: 'joint' }, // 7,020
		{ name: 'Car', amount: 7000, quantity: 1, owner: 'joint' }, // 7,000
		{ name: 'Medical/dentist', amount: 5000, quantity: 1, owner: 'joint' }, // 5,000
		{ name: 'Private health insurance', amount: 400, quantity: 12, owner: 'joint' }, // 4,800
		{ name: 'Home repairs', amount: 3500, quantity: 1, owner: 'joint' }, // 3,500
		{ name: 'Rates', amount: 797, quantity: 4, owner: 'joint' }, // 3,188
		{ name: 'Household goods', amount: 2972, quantity: 1, owner: 'joint' }, // 2,972 (balances to $73,500)
		{ name: 'Clothes & personal care', amount: 2800, quantity: 1, owner: 'joint' }, // 2,800
		{ name: 'Gifts & donations', amount: 2500, quantity: 1, owner: 'joint' }, // 2,500
		{ name: 'Home insurance', amount: 1700, quantity: 1, owner: 'joint' }, // 1,700
		{ name: 'Water', amount: 420, quantity: 4, owner: 'joint' }, // 1,680
		{ name: 'Electricity', amount: 400, quantity: 4, owner: 'joint' }, // 1,600
		{ name: 'Gas', amount: 400, quantity: 4, owner: 'joint' }, // 1,600
		{ name: 'Internet', amount: 95, quantity: 12, owner: 'joint' }, // 1,140
		{ name: 'Mobile', amount: 300, quantity: 2, owner: 'joint' }, // 600
		{ name: 'Transport', amount: 600, quantity: 1, owner: 'joint' }, // 600
		{ name: 'Glasses', amount: 100, quantity: 2, owner: 'joint' } // 200
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
	retireAge = $state(67);
	planToAge = $state(90);

	// Superannuation
	superBalance = $state(DEFAULTS.single.superBalance);
	superReturn = $state(0.07); // nominal p.a.

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

	/** Effective yearly spend: the itemised total when broken down, else the simple figure. */
	get spend(): number {
		return this.spendItems.length
			? this.spendItems.reduce((sum, it) => sum + it.amount * it.quantity, 0)
			: this.spendPerYear;
	}

	/** Informational per-person spend subtotals (couples). Projection uses `total`. */
	get spendBreakdown(): { a: number; b: number; shared: number; total: number } {
		const t = { a: 0, b: 0, shared: 0, total: 0 };
		for (const it of this.spendItems) {
			const line = it.amount * it.quantity;
			if (it.owner === 'a') t.a += line;
			else if (it.owner === 'b') t.b += line;
			else t.shared += line;
			t.total += line;
		}
		return t;
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
			owner: 'joint'
		});
	}

	removeIncome(i: number) {
		this.incomeSources.splice(i, 1);
	}

	addSpendItem() {
		this.spendItems.push({ name: '', amount: 0, quantity: 1, owner: 'joint' });
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
				if (typeof d.retireAge === 'number') this.retireAge = d.retireAge;
				if (typeof d.planToAge === 'number') this.planToAge = d.planToAge;
				if (typeof d.superBalance === 'number') this.superBalance = d.superBalance;
				if (typeof d.superReturn === 'number') this.superReturn = d.superReturn;
				if (typeof d.inflation === 'number') this.inflation = d.inflation;
				if (typeof d.downturn === 'number') this.downturn = d.downturn;
				if (typeof d.recoveryYears === 'number') this.recoveryYears = d.recoveryYears;
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
							owner: s.owner === 'a' || s.owner === 'b' || s.owner === 'joint' ? s.owner : 'joint'
						}));
				}
				if (Array.isArray(d.spendItems)) {
					this.spendItems = d.spendItems
						.filter(
							(it: SpendItem) =>
								it && typeof it.amount === 'number' && typeof it.quantity === 'number'
						)
						.map((it: SpendItem) => ({
							name: String(it.name ?? ''),
							amount: it.amount,
							quantity: it.quantity,
							owner:
								it.owner === 'a' || it.owner === 'b' || it.owner === 'joint' ? it.owner : 'joint'
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
			spendItems: this.spendItems,
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

	/** Clear saved data and force every value back to defaults (unconditionally). */
	reset() {
		if (typeof localStorage !== 'undefined') localStorage.removeItem(STORAGE_KEY);
		this.household = 'single';
		this.superBalance = DEFAULTS.single.superBalance;
		this.spendPerYear = DEFAULTS.single.spendPerYear;
		this.retireAge = 67;
		this.planToAge = 90;
		this.superReturn = 0.07;
		this.bankAccounts = [];
		this.incomeSources = [];
		this.spendItems = defaultSpendItems('single');
		this.inflation = 0.025;
		this.downturn = 0.3;
		this.recoveryYears = 5;
	}
}

export const plan = new Plan();
