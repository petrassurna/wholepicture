// Pure projection engine — no UI, no framework, deterministic.
// Works on a single pooled Pot; assets are blended into it by the domain (see assets.ts).

export type Scenario = 'average' | 'bad';

export interface Pot {
	balance: number; // present value, today's dollars
	nominalReturn: number; // blended nominal return p.a.
}

export interface Assumptions {
	startAge: number;
	endAge: number;
	spend: number; // per year, today's dollars (flat in real terms)
	inflation: number;
	downturn: number; // bad case: one-off crash in year 1
	recoveryYears: number; // ...that climbs back to its pre-crash level over N years
	/** After-tax income at a given age, which offsets spending. Defaults to none. */
	incomeAt?: (age: number) => number;
}

export interface Point {
	age: number;
	balance: number;
}

export interface Projection {
	points: Point[];
	runsOutAge: number | null;
}

/** Real return (today's dollars) from a nominal return and inflation. */
export function realReturn(nominal: number, inflation: number): number {
	return (1 + nominal) / (1 + inflation) - 1;
}

export function project(pot: Pot, a: Assumptions, scenario: Scenario): Projection {
	const growth = realReturn(pot.nominalReturn, a.inflation);

	// Return during recovery that climbs from the post-crash level back to the
	// pre-crash level over `recoveryYears`; growth resumes normally afterwards.
	const recoveryReturn =
		a.recoveryYears > 0 ? Math.pow(1 / (1 - a.downturn), 1 / a.recoveryYears) - 1 : growth;

	const points: Point[] = [];
	let bal = pot.balance;
	let runsOutAge: number | null = null;

	for (let age = a.startAge; age <= a.endAge; age++) {
		points.push({ age, balance: Math.max(0, bal) });
		if (bal <= 0) {
			// already depleted (or started with nothing) — record the first such age
			if (runsOutAge === null) runsOutAge = age;
			continue;
		}
		// Net withdrawal: spending less any income that year. If income exceeds
		// spending, the surplus is added back to the pot (negative withdrawal).
		const income = a.incomeAt ? a.incomeAt(age) : 0;
		bal -= a.spend - income;
		if (bal <= 0) {
			bal = 0;
			if (runsOutAge === null) runsOutAge = age;
			continue;
		}
		let g = growth;
		if (scenario === 'bad') {
			const t = age - a.startAge;
			if (t === 0) g = -a.downturn;
			else if (t <= a.recoveryYears) g = recoveryReturn;
		}
		bal *= 1 + g;
	}

	return { points, runsOutAge };
}
