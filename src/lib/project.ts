// Tiny projection engine that powers the interactive hero.
// Deliberately simple and pure — the seed of the real domain engine.

export interface ProjectInput {
	startAge: number;
	endAge: number;
	balance: number;
	spend: number;
	growth: number; // e.g. 0.08
	downturn: number; // e.g. 0.30, applied in the first year for the bad case
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
	const { startAge, endAge, balance, spend, growth, downturn } = input;
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
		const g = scenario === 'bad' && age === startAge ? -downturn : growth;
		bal *= 1 + g;
	}

	return { points, runsOutAge };
}
