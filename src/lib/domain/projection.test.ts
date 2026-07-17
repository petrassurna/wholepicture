import { describe, it, expect } from 'vitest';
import { project, realReturn, type Assumptions } from './projection';
import { Super, BankAccount, type Asset } from './assets';

// All expected numbers below are derived independently of the engine —
// by hand arithmetic, by counting, or from a stated requirement — so the
// tests genuinely check correctness rather than echoing the implementation.

// A single tax-free asset (not ITaxable) reproduces the plain balance mechanics.
const pot = (balance: number, nominalReturn: number): Asset[] => [
	{ label: 'pot', balance, nominalReturn }
];

const A = (over: Partial<Assumptions> = {}): Assumptions => ({
	startAge: 60,
	endAge: 90,
	spend: 10_000,
	inflation: 0,
	downturn: 0.3,
	recoveryYears: 5,
	...over
});

/** balance at a given age */
const at = (p: { points: { age: number; balance: number }[] }, age: number) =>
	p.points.find((pt) => pt.age === age)!.balance;

describe('realReturn', () => {
	it('equals the nominal return when there is no inflation', () => {
		expect(realReturn(0.07, 0)).toBeCloseTo(0.07, 10);
	});

	it('is zero when the return only keeps pace with inflation', () => {
		expect(realReturn(0.03, 0.03)).toBeCloseTo(0, 10);
	});

	it('matches the hand-calculated real return', () => {
		// 1.07 / 1.025 − 1 = 0.043902439…  (worked out by hand)
		expect(realReturn(0.07, 0.025)).toBeCloseTo(0.0439024, 6);
	});

	it('is negative when inflation outpaces the return', () => {
		expect(realReturn(0.02, 0.05)).toBeLessThan(0);
	});
});

describe('project — structure & invariants', () => {
	const p = project(pot(500_000, 0.06), A({ endAge: 90 }), 'average');

	it('produces one point per year, inclusive of both ends', () => {
		expect(p.points.length).toBe(90 - 60 + 1); // 31
		expect(p.points[0].age).toBe(60);
		expect(p.points.at(-1)!.age).toBe(90);
	});

	it('never reports a negative balance', () => {
		expect(p.points.every((pt) => pt.balance >= 0)).toBe(true);
	});

	it('reports no tax when nothing is assessable', () => {
		expect(p.totalTax).toBe(0);
		expect(p.points.every((pt) => pt.tax === 0)).toBe(true);
	});
});

describe('project — average, no growth (counted by hand)', () => {
	it('$100k at $10k/yr with 0% real lasts exactly 10 withdrawals → runs out at 69', () => {
		// 100,000 / 10,000 = 10 withdrawals, at ages 60,61,…,69.
		const p = project(
			pot(100_000, 0),
			A({ startAge: 60, endAge: 100, spend: 10_000, inflation: 0 }),
			'average'
		);
		expect(p.runsOutAge).toBe(69);
	});
});

describe('project — average, with growth (arithmetic by hand)', () => {
	it('follows withdraw-then-grow exactly at 10% real', () => {
		// nominal 10%, inflation 0 → real 10%. Start $100,000, spend $10,000:
		//   60: 100,000 → (−10k) 90,000 → (×1.1) 99,000
		//   61:  99,000 → (−10k) 89,000 → (×1.1) 97,900
		//   62:  97,900 → (−10k) 87,900 → (×1.1) 96,690
		const p = project(
			pot(100_000, 0.1),
			A({ startAge: 60, spend: 10_000, inflation: 0 }),
			'average'
		);
		expect(at(p, 60)).toBeCloseTo(100_000, 4);
		expect(at(p, 61)).toBeCloseTo(99_000, 4);
		expect(at(p, 62)).toBeCloseTo(97_900, 4);
		expect(at(p, 63)).toBeCloseTo(96_690, 4);
	});
});

describe('project — draw order: super pays its minimum, the taxed accounts pay the rest', () => {
	// $200k super + $100k bank, both 0% real (nominal = inflation = 0, so the bank
	// also earns no assessable interest → no tax). Spend $30k from age 65, where the
	// ATO minimum is 5%. Each year super pays only 5% of ITS OWN balance and the bank
	// covers the shortfall, so the tax-free fund is left to compound:
	//   65: super 200,000 −5% = −10,000 → 190,000 | bank 100,000 − 20,000 → 80,000
	//   66: super 190,000 −5% =  −9,500 → 180,500 | bank  80,000 − 20,500 → 59,500
	//   67: super 180,500 −5% =  −9,025 → 171,475 | bank  59,500 − 20,975 → 38,525
	const assets = () => [new Super(200_000, 0), new BankAccount('td', 100_000, 0)];
	const plan = A({ startAge: 65, endAge: 90, spend: 30_000, inflation: 0 });
	const balsAt = (p: ReturnType<typeof project>, age: number) =>
		p.points.find((pt) => pt.age === age)!.balances;

	it('takes only the minimum drawdown from super while the bank can fund the rest', () => {
		const p = project(assets(), plan, 'average');
		expect(balsAt(p, 66)[0]).toBeCloseTo(190_000, 4);
		expect(balsAt(p, 66)[1]).toBeCloseTo(80_000, 4);
		expect(balsAt(p, 67)[0]).toBeCloseTo(180_500, 4);
		expect(balsAt(p, 67)[1]).toBeCloseTo(59_500, 4);
		expect(balsAt(p, 68)[0]).toBeCloseTo(171_475, 4);
		expect(balsAt(p, 68)[1]).toBeCloseTo(38_525, 4);
	});

	it('pays above the minimum from super only once the bank is empty', () => {
		// 68: super 171,475 −5% = −8,573.75 → 162,901.25 | bank 38,525 − 21,426.25 → 17,098.75
		// 69: the bank's 17,098.75 can't cover the $30k less super's 5% minimum
		//     (8,145.06), so super pays 4,756.19 ABOVE its minimum to close the gap:
		//     super 162,901.25 − 12,901.25 → 150,000 | bank → 0
		const p = project(assets(), plan, 'average');
		expect(balsAt(p, 69)[0]).toBeCloseTo(162_901.25, 4);
		expect(balsAt(p, 69)[1]).toBeCloseTo(17_098.75, 4);
		expect(balsAt(p, 70)[0]).toBeCloseTo(150_000, 4);
		expect(balsAt(p, 70)[1]).toBe(0); // exactly empty — no floating-point crumb
	});

	it('never leaves the portfolio short — the full yearly spend always comes out', () => {
		// Whatever the split, $300k − 5 × $30k = $150k must remain at 70.
		const p = project(assets(), plan, 'average');
		expect(at(p, 70)).toBeCloseTo(150_000, 4);
	});
});

describe('project — sustainable pot lasts', () => {
	it('never runs out when spending stays modest — even as the minimum drawdown forces excess aside', () => {
		// $1M at ~2.44% real, spend $20k. The ATO minimum (4–5% ≈ $40k+) exceeds the
		// $20k need, so super is force-drawn and the surplus is set aside — the pot
		// declines but always covers spending, so it never runs out.
		const p = project(pot(1_000_000, 0.05), A({ spend: 20_000, inflation: 0.025 }), 'average');
		expect(p.runsOutAge).toBeNull();
		expect(p.totalSetAside).toBeGreaterThan(0); // forced drawdown beyond need is set aside
	});
});

describe('project — bad case crash & recovery (by requirement)', () => {
	// 0% real growth + no spending. The minimum drawdown bleeds BOTH the average and
	// bad paths by the same fraction each year, so the bad/average RATIO isolates the
	// market path cleanly (the drawdown factor cancels).
	const inputs = A({ startAge: 60, endAge: 90, spend: 0, downturn: 0.3, recoveryYears: 5 });
	const p = pot(100_000, 0.025); // return = inflation → 0% real

	it('the minimum drawdown bleeds the average case even with 0% real and no spending', () => {
		// Ages 60–64 draw 4% of the balance; the rest just sits (0% real), so:
		//   61: 100,000 − 4% = 96,000    62: 96,000 − 4% = 92,160
		const avg = project(p, { ...inputs, inflation: 0.025 }, 'average');
		expect(at(avg, 60)).toBeCloseTo(100_000, 4);
		expect(at(avg, 61)).toBeCloseTo(96_000, 4);
		expect(at(avg, 62)).toBeCloseTo(92_160, 4);
	});

	it('the crash drops the balance ~30% relative to the average path', () => {
		const avg = project(p, { ...inputs, inflation: 0.025 }, 'average');
		const bad = project(p, { ...inputs, inflation: 0.025 }, 'bad');
		expect(at(bad, 61) / at(avg, 61)).toBeCloseTo(0.7, 6); // 30% fall vs no-crash path
	});

	it('recovers back to the average path after the recovery years', () => {
		// Requirement: 30% crash then climb back to the pre-crash trajectory over 5 years.
		const avg = project(p, { ...inputs, inflation: 0.025 }, 'average');
		const bad = project(p, { ...inputs, inflation: 0.025 }, 'bad');
		expect(at(bad, 66)).toBeCloseTo(at(avg, 66), 2); // back on the average path
	});

	it('with recoveryYears = 0 the crash is a permanent 30% haircut vs the average path', () => {
		const avg = project(p, { ...inputs, inflation: 0.025, recoveryYears: 0 }, 'average');
		const bad = project(p, { ...inputs, inflation: 0.025, recoveryYears: 0 }, 'bad');
		expect(at(bad, 90) / at(avg, 90)).toBeCloseTo(0.7, 6); // never climbs back
	});
});

describe('project — sequence-of-returns risk (property)', () => {
	const p = pot(500_000, 0.07);
	const inputs = A({ startAge: 67, endAge: 90, spend: 50_000, inflation: 0.025 });
	const avg = project(p, inputs, 'average');
	const bad = project(p, inputs, 'bad');

	it('the bad case never lasts longer than the average', () => {
		expect(bad.runsOutAge!).toBeLessThanOrEqual(avg.runsOutAge!);
	});

	it('matches the independently reproduced run-out ages (regression anchor)', () => {
		expect(avg.runsOutAge).toBe(79);
		expect(bad.runsOutAge).toBe(75);
	});
});

describe('project — edge cases', () => {
	it('an empty pot runs out at the retirement age', () => {
		const p = project(pot(0, 0.07), A({ startAge: 67 }), 'average');
		expect(p.runsOutAge).toBe(67);
	});

	it('handles a single-year projection', () => {
		const p = project(pot(100_000, 0), A({ startAge: 67, endAge: 67, spend: 10_000 }), 'average');
		expect(p.points.length).toBe(1);
		expect(at(p, 67)).toBe(100_000);
		expect(p.runsOutAge).toBeNull();
	});
});
