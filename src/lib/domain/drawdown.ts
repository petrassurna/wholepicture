// Minimum pension drawdown — the ATO's age-based minimum you must withdraw from a
// super pension account each year, as a fraction of its 1-July balance. Standard
// rates (not the temporarily-halved COVID ones). Pure policy, like the tax scale.
//
// When the minimum exceeds what you actually need to spend, the surplus is still
// forced out of super — the projection sets it aside in a separate, non-growing
// bucket (see projection.ts) rather than letting it stay in the fund.

/** Minimum drawdown fraction for a given age (super pension phase). */
export function minDrawdownRate(age: number): number {
	if (age < 65) return 0.04;
	if (age < 75) return 0.05;
	if (age < 80) return 0.06;
	if (age < 85) return 0.07;
	if (age < 90) return 0.09;
	if (age < 95) return 0.11;
	return 0.14;
}
