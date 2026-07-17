import { describe, it, expect } from 'vitest';
import { project, realReturn, type Assumptions, type Scenario } from './projection';
import { Super, BankAccount, isTaxable, type Asset } from './assets';
import { Household } from './household';
import { IncomeSource } from './income';
import { minDrawdownRate } from './drawdown';

// Property / fuzz tests for the projection engine over thousands of random plans.
// Three angles:
//   1. Invariants that must hold for ANY input (non-negative balances, bounded
//      run-out age, determinism, non-negative tax).
//   2. Monotonicity — more spend never lasts longer, more balance never lasts
//      shorter, the bad case never beats the average, tax never extends longevity.
//   3. An INDEPENDENTLY written simulator (no-tax path) checked point-by-point,
//      validating growth, the minimum-drawdown-then-others draw order, and the
//      crash/recovery mechanics.

function rng(seed: number) {
	return () => {
		seed |= 0;
		seed = (seed + 0x6d2b79f5) | 0;
		let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

const longevity = (p: { runsOutAge: number | null }) => p.runsOutAge ?? Infinity;
const near = (a: number, b: number, tol = 1e-6) =>
	Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));

// A random plan: assumptions + a portfolio of tax-free super assets only (so the
// engine's mechanics can be compared to a no-tax oracle), returned separately.
function randomPlan(rand: () => number) {
	const startAge = 55 + Math.floor(rand() * 15); // 55–69
	const endAge = startAge + 3 + Math.floor(rand() * 45); // up to ~110
	const a: Assumptions = {
		startAge,
		endAge,
		spend: Math.round(rand() * 120_000),
		inflation: rand() * 0.05,
		downturn: rand() * 0.6,
		recoveryYears: Math.floor(rand() * 12) // includes 0
	};
	const assets: Asset[] = [new Super(Math.round(rand() * 3_000_000), rand() * 0.12)];
	if (rand() > 0.5) assets.push(new Super(Math.round(rand() * 500_000), rand() * 0.12));
	return { a, assets };
}

// Independent simulator for the no-tax, no-income path — written from the spec,
// structured differently from the engine (separate withdraw/grow helpers).
function simulate(assets: Asset[], a: Assumptions, scenario: Scenario) {
	const bal = assets.map((x) => x.balance);
	const growth = assets.map((x) => realReturn(x.nominalReturn, a.inflation));
	const recovery =
		a.recoveryYears > 0 ? Math.pow(1 / (1 - a.downturn), 1 / a.recoveryYears) - 1 : 0;
	const points: { age: number; balance: number }[] = [];
	let runsOutAge: number | null = null;

	for (let age = a.startAge; age <= a.endAge; age++) {
		const opening = bal.reduce((s, b) => s + Math.max(0, b), 0);
		points.push({ age, balance: Math.max(0, opening) });
		if (opening <= 0) {
			runsOutAge ??= age;
			continue;
		}
		// Super pays at least the ATO minimum drawdown and that forced money funds
		// `spend` first (any excess just leaves super); the rest of the spend comes
		// from the other accounts; super only pays above its minimum once they're empty.
		const superIdx = Math.max(
			0,
			assets.findIndex((x) => !isTaxable(x))
		);
		const superBal = Math.max(0, bal[superIdx]);
		const minW = minDrawdownRate(age) * superBal;
		const others = bal.map((b, i) => (i === superIdx ? 0 : Math.max(0, b)));
		const tot = others.reduce((s, b) => s + b, 0);
		const unmet = Math.max(0, a.spend - minW); // spend the minimum can't cover
		const fromOthers = Math.min(unmet, tot);
		const superW = minW + Math.min(unmet - fromOthers, superBal - minW);
		bal[superIdx] -= superW;
		if (fromOthers > 0) for (let i = 0; i < bal.length; i++) bal[i] -= fromOthers * (others[i] / tot);
		// A drained account rounds to ~1e-13, not 0; treat a millionth of a cent as empty.
		for (let i = 0; i < bal.length; i++) if (Math.abs(bal[i]) < 1e-6) bal[i] = 0;
		if (bal.reduce((s, b) => s + b, 0) <= 0) {
			bal.fill(0);
			runsOutAge ??= age;
			continue;
		}
		const t = age - a.startAge;
		for (let i = 0; i < bal.length; i++) {
			let g = growth[i];
			if (scenario === 'bad') {
				if (t === 0) g = -a.downturn;
				else if (t <= a.recoveryYears) g = recovery;
			}
			bal[i] *= 1 + g;
		}
	}
	return { points, runsOutAge };
}

describe('project — invariants over random plans', () => {
	const rand = rng(10);
	it('holds structure, non-negativity and bounded run-out across 3000 plans', () => {
		for (let i = 0; i < 3000; i++) {
			const { a, assets } = randomPlan(rand);
			for (const scenario of ['average', 'bad'] as const) {
				const p = project(assets, a, scenario);
				expect(p.points.length).toBe(a.endAge - a.startAge + 1);
				expect(p.points[0].age).toBe(a.startAge);
				expect(p.points.at(-1)!.age).toBe(a.endAge);
				expect(p.points.every((pt) => pt.balance >= 0)).toBe(true);
				expect(p.points.every((pt) => pt.tax >= 0 && pt.assessableIncome >= 0)).toBe(true);
				expect(p.totalTax).toBeGreaterThanOrEqual(0);
				if (p.runsOutAge !== null) {
					expect(p.runsOutAge).toBeGreaterThanOrEqual(a.startAge);
					expect(p.runsOutAge).toBeLessThanOrEqual(a.endAge);
					// Strictly after the run-out age the balance is pinned at 0. (At the
					// run-out age itself the point still shows the positive opening balance
					// — the money ran out *during* that year.)
					const after = p.points.filter((pt) => pt.age > p.runsOutAge!);
					expect(after.every((pt) => pt.balance === 0)).toBe(true);
				}
			}
		}
	});

	it('is deterministic — identical inputs give identical output', () => {
		const r = rng(11);
		for (let i = 0; i < 500; i++) {
			const { a, assets } = randomPlan(r);
			expect(project(assets, a, 'bad')).toEqual(project(assets, a, 'bad'));
		}
	});
});

describe('project — matches the independent simulator (no-tax mechanics)', () => {
	const rand = rng(12);
	it('reproduces every point balance and the run-out age across 3000 plans', () => {
		for (let i = 0; i < 3000; i++) {
			const { a, assets } = randomPlan(rand);
			for (const scenario of ['average', 'bad'] as const) {
				const engine = project(assets, a, scenario); // no incomeAt/taxOn → tax 0
				const oracle = simulate(assets, a, scenario);
				expect(engine.runsOutAge).toBe(oracle.runsOutAge);
				for (let k = 0; k < engine.points.length; k++) {
					expect(near(engine.points[k].balance, oracle.points[k].balance, 1e-9)).toBe(true);
				}
			}
		}
	});
});

describe('project — monotonicity properties', () => {
	const rand = rng(13);

	it('more spending never makes the money last longer', () => {
		for (let i = 0; i < 1500; i++) {
			const { a, assets } = randomPlan(rand);
			const less = project(assets, { ...a, spend: a.spend }, 'average');
			const more = project(assets, { ...a, spend: a.spend + 5_000 }, 'average');
			expect(longevity(more)).toBeLessThanOrEqual(longevity(less));
		}
	});

	it('a bigger starting balance never makes the money last shorter', () => {
		for (let i = 0; i < 1500; i++) {
			const { a, assets } = randomPlan(rand);
			const base = assets[0] as Super;
			const richer = [new Super(base.balance + 50_000, base.nominalReturn), ...assets.slice(1)];
			expect(longevity(project(richer, a, 'average'))).toBeGreaterThanOrEqual(
				longevity(project(assets, a, 'average'))
			);
		}
	});

	it('the bad case never lasts longer than the average (positive real returns)', () => {
		// This holds whenever the portfolio's real return is ≥ 0 — the realistic
		// regime the app targets. It can FAIL when returns fall below inflation:
		// the bad-case recovery climbs back toward the pre-crash level, injecting
		// growth the steadily-declining average path lacks. So we require every
		// asset to beat inflation here, matching real usage.
		for (let i = 0; i < 2000; i++) {
			const { a, assets } = randomPlan(rand);
			const inflation = Math.min(...assets.map((x) => x.nominalReturn)) * 0.6;
			const aa = { ...a, inflation };
			expect(longevity(project(assets, aa, 'bad'))).toBeLessThanOrEqual(
				longevity(project(assets, aa, 'average'))
			);
		}
	});
});

describe('project — tax always costs, never helps', () => {
	const rand = rng(14);
	it('taxable bank interest never makes the money last longer than the same in tax-free super', () => {
		for (let i = 0; i < 1500; i++) {
			const startAge = 60 + Math.floor(rand() * 8);
			const endAge = startAge + 10 + Math.floor(rand() * 30);
			const rate = 0.02 + rand() * 0.05;
			const superBal = Math.round(rand() * 800_000);
			const otherBal = Math.round(50_000 + rand() * 600_000);
			const a: Assumptions = {
				startAge,
				endAge,
				spend: Math.round(20_000 + rand() * 60_000),
				inflation: rand() * 0.035,
				downturn: rand() * 0.4,
				recoveryYears: Math.floor(rand() * 8)
			};
			const h = new Household('single', []);
			const withTax: Assumptions = {
				...a,
				incomeAt: () => ({ gross: 0, taxable: 0 }),
				taxOn: (assess, age) => h.taxOn(assess, age)
			};
			// Same money and same return, but taxable (bank) vs tax-free (super).
			const taxable = project(
				[new Super(superBal, rate), new BankAccount('c', otherBal, rate)],
				withTax,
				'average'
			);
			const free = project([new Super(superBal + otherBal, rate)], withTax, 'average');
			// Only compare where the minimum drawdown never forces excess out: when it does,
			// money is set aside in a NON-growing, unspent bucket, and the all-super plan
			// (bigger super → bigger forced drawdown) parks more there, which can
			// legitimately shorten longevity vs the split plan.
			if (taxable.totalSetAside === 0 && free.totalSetAside === 0)
				expect(longevity(taxable)).toBeLessThanOrEqual(longevity(free));
		}
	});
});

describe('project — income offsets spending, never shortens longevity', () => {
	const rand = rng(15);
	it('adding a taxable income stream never makes the money run out sooner', () => {
		for (let i = 0; i < 1500; i++) {
			const startAge = 60 + Math.floor(rand() * 8);
			const endAge = startAge + 10 + Math.floor(rand() * 30);
			const a: Assumptions = {
				startAge,
				endAge,
				spend: Math.round(30_000 + rand() * 50_000),
				inflation: rand() * 0.035,
				downturn: rand() * 0.4,
				recoveryYears: Math.floor(rand() * 8)
			};
			const assets = [new Super(Math.round(200_000 + rand() * 800_000), 0.02 + rand() * 0.06)];
			const none = new Household('single', []);
			const withInc = new Household('single', [
				new IncomeSource('work', Math.round(rand() * 30_000), startAge, startAge + 5, true)
			]);
			const wrap = (h: Household): Assumptions => ({
				...a,
				incomeAt: (age) => ({ gross: h.grossIncomeAt(age), taxable: h.taxableIncomeAt(age) }),
				taxOn: (assess, age) => h.taxOn(assess, age)
			});
			// Net income (gross − tax) is always ≥ 0 since marginal rates < 100%,
			// so income can only extend or match longevity, never shorten it.
			expect(longevity(project(assets, wrap(withInc), 'average'))).toBeGreaterThanOrEqual(
				longevity(project(assets, wrap(none), 'average'))
			);
		}
	});

	it('an inflation-indexed income never lasts less long than the same fixed income', () => {
		for (let i = 0; i < 1500; i++) {
			const startAge = 60 + Math.floor(rand() * 8);
			const endAge = startAge + 15 + Math.floor(rand() * 25);
			const inflation = 0.01 + rand() * 0.04; // strictly positive so erosion bites
			const a: Assumptions = {
				startAge,
				endAge,
				spend: Math.round(35_000 + rand() * 45_000),
				inflation,
				downturn: rand() * 0.4,
				recoveryYears: Math.floor(rand() * 8)
			};
			const assets = [new Super(Math.round(200_000 + rand() * 700_000), 0.03 + rand() * 0.05)];
			const amt = Math.round(5_000 + rand() * 25_000);
			const mk = (indexed: boolean) => {
				const h = new Household('single', [
					new IncomeSource('inc', amt, startAge, endAge, true, indexed)
				]);
				const ctx = { startAge, inflation };
				const wrap: Assumptions = {
					...a,
					incomeAt: (age) => ({
						gross: h.grossIncomeAt(age, ctx),
						taxable: h.taxableIncomeAt(age, ctx)
					}),
					taxOn: (assess, age) => h.taxOn(assess, age, ctx)
				};
				return project(assets, wrap, 'average');
			};
			// Indexed income holds its real value; a fixed one erodes, so it offsets
			// less over time and can only run out sooner or the same, never later.
			expect(longevity(mk(true))).toBeGreaterThanOrEqual(longevity(mk(false)));
		}
	});
});

describe('project — Age Pension never shortens longevity, and stabilises modest plans', () => {
	const rand = rng(16);

	it('including the pension never makes the money run out sooner (2000 plans)', () => {
		for (let i = 0; i < 2000; i++) {
			const { a, assets } = randomPlan(rand);
			const h = new Household('single', []);
			const withP: Assumptions = {
				...a,
				pensionAt: (assetsBal, age) => h.agePensionAt(assetsBal, age)
			};
			// The pension is tax-free income offsetting the draw, so it can only extend
			// or match longevity — never shorten it.
			expect(longevity(project(assets, withP, 'average'))).toBeGreaterThanOrEqual(
				longevity(project(assets, a, 'average'))
			);
		}
	});

	it('a modest homeowner never runs out — spending under the max pension is sustained', () => {
		// Spend below the single max pension ($29,754); once assets fall enough the
		// pension covers spending entirely, so the pot stabilises and never depletes.
		const h = new Household('single', []);
		const p = project(
			[new Super(250_000, 0.05)],
			{
				startAge: 67,
				endAge: 105,
				spend: 25_000,
				inflation: 0.025,
				downturn: 0.3,
				recoveryYears: 5,
				pensionAt: (assetsBal, age) => h.agePensionAt(assetsBal, age)
			},
			'average'
		);
		expect(p.runsOutAge).toBeNull();
		expect(p.points.at(-1)!.balance).toBeGreaterThan(0);
	});
});

describe('project — accumulation phase (pre-retirement)', () => {
	const at = (p: { points: { age: number; balance: number }[] }, age: number) =>
		p.points.find((pt) => pt.age === age)!.balance;

	it('grows super at the 15%-earnings-taxed rate before retirement (hand-calc)', () => {
		// One accumulation year, no contributions. Super 100k @ 7% nominal, 2.5%
		// inflation. Accumulation real growth = (1 + 0.07×0.85)/(1 + 0.025) − 1.
		const p = project(
			[new Super(100_000, 0.07)],
			{
				startAge: 57,
				retireAge: 67,
				endAge: 90,
				spend: 50_000,
				inflation: 0.025,
				downturn: 0.3,
				recoveryYears: 5
			},
			'average'
		);
		const expected = 100_000 * ((1 + 0.07 * 0.85) / 1.025);
		expect(at(p, 57)).toBeCloseTo(100_000, 4);
		expect(at(p, 58)).toBeCloseTo(expected, 2); // ≈ 103,366, below the tax-free 104,390
		expect(at(p, 58)).toBeLessThan(100_000 * ((1 + 0.07) / 1.025)); // less than pension-phase growth
	});

	it('does not draw down or run out during accumulation', () => {
		const p = project(
			[new Super(200_000, 0.06)],
			{
				startAge: 55,
				retireAge: 67,
				endAge: 90,
				spend: 80_000,
				inflation: 0.025,
				downturn: 0.3,
				recoveryYears: 5
			},
			'average'
		);
		// Balance only grows up to retirement despite the big retirement spend.
		expect(at(p, 66)).toBeGreaterThan(at(p, 55));
		expect(p.points.filter((pt) => pt.age < 67).every((pt) => pt.balance > 0)).toBe(true);
	});

	it('contributions build the balance and never shorten longevity', () => {
		const base: Assumptions = {
			startAge: 57,
			retireAge: 67,
			endAge: 95,
			spend: 55_000,
			inflation: 0.025,
			downturn: 0.3,
			recoveryYears: 5
		};
		const assets = [new Super(300_000, 0.06)];
		const none = project(assets, base, 'average');
		// $10k/yr gross salary sacrifice, ages 57–66 (net $8,500 after 15% tax).
		const h = new Household('single', [new IncomeSource('sac', 10_000, 57, 66, true, true, true)]);
		const withContrib = project(
			assets,
			{ ...base, contributionAt: (age) => h.contributionAt(age) },
			'average'
		);
		// More in super at retirement, and it lasts at least as long.
		const bal = (p: typeof none, age: number) => at(p, age);
		expect(bal(withContrib, 67)).toBeGreaterThan(bal(none, 67));
		expect(longevity(withContrib)).toBeGreaterThanOrEqual(longevity(none));
	});

	it('reduces to the plain drawdown model when currentAge equals retireAge', () => {
		const assets = [new Super(500_000, 0.07)];
		const common = { endAge: 90, spend: 45_000, inflation: 0.025, downturn: 0.3, recoveryYears: 5 };
		const withRetireAge = project(assets, { startAge: 67, retireAge: 67, ...common }, 'average');
		const without = project(assets, { startAge: 67, ...common }, 'average');
		expect(withRetireAge).toEqual(without); // retireAge defaults to startAge → identical
	});
});

describe('project — the super-only hand-calc reconciles every year (calc panel fidelity)', () => {
	// Mirrors what the Calculations panel shows: for a super-only, retired, no-tax,
	// no-income, no-pension plan, super withdraws max(spend, ATO minimum drawdown),
	// so closing = (opening − that withdrawal) × (1 + real return) must land on the
	// engine's next-year balance for EVERY year and both scenarios.
	const rand = rng(17);
	it('closing = (opening − spend) × (1 + growth) matches the engine across 1000 plans', () => {
		for (let i = 0; i < 1000; i++) {
			const startAge = 60 + Math.floor(rand() * 8);
			const endAge = startAge + 10 + Math.floor(rand() * 30);
			const R = 0.03 + rand() * 0.06;
			const I = rand() * 0.035;
			const downturn = rand() * 0.5;
			const recoveryYears = 1 + Math.floor(rand() * 8);
			const a: Assumptions = {
				startAge,
				endAge,
				spend: Math.round(20_000 + rand() * 45_000),
				inflation: I,
				downturn,
				recoveryYears
			};
			const gNormal = realReturn(R, I);
			const recovery = Math.pow(1 / (1 - downturn), 1 / recoveryYears) - 1;
			for (const scenario of ['average', 'bad'] as const) {
				const p = project([new Super(600_000, R)], a, scenario);
				for (let k = 0; k < p.points.length - 1; k++) {
					const pt = p.points[k];
					if (pt.balance <= 0) continue;
					const t = pt.age - startAge; // retireAge === startAge here
					let g = gNormal;
					if (scenario === 'bad') {
						if (t === 0) g = -downturn;
						else if (t <= recoveryYears) g = recovery;
					}
					const need = Math.min(a.spend, pt.balance);
					const minW = minDrawdownRate(pt.age) * pt.balance;
					const superW = Math.min(pt.balance, Math.max(need, minW));
					const closing = (pt.balance - superW) * (1 + g);
					const engineNext = p.points[k + 1].balance;
					if (closing <= 0) continue; // run-out year: engine clamps to 0
					expect(near(closing, engineNext, 1e-9)).toBe(true);
				}
			}
		}
	});
});
