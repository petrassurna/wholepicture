// Tiny projection engine that powers the interactive hero.
// Deliberately simple and pure — the seed of the real domain engine.

export interface ProjectInput {
	startAge: number;
	endAge: number;
	balance: number;
	spend: number;
	growth: number; // real return, e.g. 0.045
	downturn: number; // e.g. 0.30 — a one-off crash in the first year (bad case only)
	recoveryYears: number; // years the market takes to climb back to trend after the crash
}

export interface Point {
	age: number;
	balance: number;
}

export interface Projection {
	points: Point[];
	runsOutAge: number | null;
}



export function project(input: ProjectInput, scenario: 'average' | 'bad'): Projection {
	const { startAge, endAge, balance, spend, growth, downturn, recoveryYears } = input;

	// Return during the recovery window that climbs from the post-crash level back to
	// the pre-crash level over `recoveryYears`. After that, growth resumes at the normal
	// rate — so the crash costs those years of lost ground (does not catch back up to trend).
	const recoveryReturn =
		recoveryYears > 0 ? Math.pow(1 / (1 - downturn), 1 / recoveryYears) - 1 : growth;

	const points: Point[] = [];
	let bal = balance;
	let runsOutAge: number | null = null;

	for (let age = startAge; age <= endAge; age++) {
		points.push({ age, balance: Math.max(0, bal) });
		if (bal <= 0) continue;
		bal -= spend;
		if (bal <= 0) {
			bal = 0;
			if (runsOutAge === null) runsOutAge = age;
			continue;
		}

		let g = growth;
		if (scenario === 'bad') {
			const t = age - startAge;
			if (t === 0) g = -downturn; // crash in year 1
			else if (t <= recoveryYears) g = recoveryReturn; // recover to trend
		}
		bal *= 1 + g;
	}

	return { points, runsOutAge };
}
