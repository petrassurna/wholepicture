<script lang="ts">
	import { project, realReturn } from '$lib/domain/projection';
	import { CURRENT_PENSION } from '$lib/domain/pension';
	import { plan } from '$lib/state/plan.svelte';

	const pensionAsAt = CURRENT_PENSION.asAt;

	// A transparency + self-check panel. It recomputes the year-by-year arithmetic
	// behind the graph from the displayed formula, and confirms each year lands on
	// the engine's number. "Step" explains one year in full; "Table" reconciles the
	// whole plan at a glance. The hand-calc is exact for a super-only plan; bank
	// accounts blend the growth step, which the check flags rather than hides.

	let show = $state(false);
	let mode = $state<'step' | 'table'>('step');
	let scenario = $state<'average' | 'bad'>('average');
	let age = $state(plan.retireAge);

	const proj = $derived(project(plan.assets, plan.buildAssumptions(), scenario));

	// The age to inspect, kept within the drawdown range without an effect (which
	// would read and write `age` and loop). The input binds to `shownAge`.
	const ageLo = $derived(plan.retireAge);
	const ageHi = $derived(Math.max(plan.retireAge, plan.planToAge - 1));
	const shownAge = $derived(Math.min(Math.max(age, ageLo), ageHi));

	const money = (n: number) => '$' + Math.round(n).toLocaleString('en-AU');
	const num = (n: number) => Math.round(n).toLocaleString('en-AU');
	const dec = (n: number) => n.toFixed(4);
	const pctStr = (r: number) => (r * 100).toFixed(2) + '%';

	interface Year {
		A: number;
		opening: number;
		growth: number;
		growthLabel: string;
		growthEq: string;
		spend: number;
		tax: number;
		income: number;
		pension: number;
		pensionEq: string;
		afterCashflow: number;
		cashflowEq: string;
		closing: number;
		graphNext: number | null;
		matches: boolean;
	}

	function computeYear(A: number): Year | null {
		const pt = proj.points.find((p) => p.age === A);
		const nextPt = proj.points.find((p) => p.age === A + 1);
		if (!pt) return null;

		const opening = pt.balance;
		const R = plan.superReturn;
		const I = plan.inflation;
		const t = A - plan.retireAge;
		const gNormal = realReturn(R, I);
		const recoveryReturn =
			plan.recoveryYears > 0
				? Math.pow(1 / (1 - plan.downturn), 1 / plan.recoveryYears) - 1
				: gNormal;

		let growth = gNormal;
		let growthLabel = 'Real return (return above inflation)';
		let growthEq = `(1 + ${pctStr(R)}) ÷ (1 + ${pctStr(I)}) − 1 = ${dec(1 + R)} ÷ ${dec(1 + I)} − 1 = ${pctStr(growth)}`;
		if (scenario === 'bad' && t === 0) {
			growth = -plan.downturn;
			growthLabel = 'Market crash in the first year of retirement';
			growthEq = `growth = −${pctStr(plan.downturn)}`;
		} else if (scenario === 'bad' && t <= plan.recoveryYears) {
			growth = recoveryReturn;
			growthLabel = `Recovery year — climbing back to the pre-crash level over ${plan.recoveryYears} years`;
			growthEq = `(1 ÷ (1 − ${dec(plan.downturn)}))^(1 ÷ ${plan.recoveryYears}) − 1 = ${pctStr(growth)}`;
		}

		const income = plan.incomeAt(A).gross;
		const tax = plan.taxOn(0, A);
		const pension = plan.pensionAt(opening, A);

		// Show where the pension figure comes from (assets test, homeowner v1).
		// Show the pension working whenever it's switched on — including why it's $0.
		let pensionEq = '';
		if (plan.includePension) {
			const s = CURRENT_PENSION;
			const max = s.maxAnnual[plan.household];
			const freeArea = s.assetFreeArea.homeowner[plan.household];
			if (A < s.eligibilityAge) {
				pensionEq = `age ${A} is under the pension age (${s.eligibilityAge}) → $0`;
			} else if (opening <= freeArea) {
				pensionEq = `assets ${num(opening)} are under the ${num(freeArea)} free area → full pension ${num(max)}`;
			} else {
				const reduction = (opening - freeArea) * s.taperPerDollar;
				const raw = max - reduction;
				pensionEq =
					raw > 0
						? `${num(max)} − (${num(opening)} − ${num(freeArea)}) × ${s.taperPerDollar} = ${num(max)} − ${num(reduction)} = ${num(pension)}`
						: `${num(max)} − (${num(opening)} − ${num(freeArea)}) × ${s.taperPerDollar} = ${num(max)} − ${num(reduction)} = ${num(raw)} → clamped to $0 (assets above the cut-off)`;
			}
		}

		const netDraw = plan.spend + tax - income - pension;
		const afterCashflow = opening - netDraw;
		const closing = afterCashflow * (1 + growth);

		const parts = [num(opening), `− ${num(plan.spend)}`];
		if (tax > 0.5) parts.push(`− ${num(tax)}`);
		if (income > 0.5) parts.push(`+ ${num(income)}`);
		if (pension > 0.5) parts.push(`+ ${num(pension)}`);
		const cashflowEq = `${parts.join(' ')} = ${num(afterCashflow)}`;

		const graphNext = nextPt?.balance ?? null;
		const matches = graphNext !== null && Math.abs(closing - graphNext) < 1;

		return {
			A,
			opening,
			growth,
			growthLabel,
			growthEq,
			spend: plan.spend,
			tax,
			income,
			pension,
			afterCashflow,
			cashflowEq,
			closing,
			graphNext,
			matches,
			pensionEq
		};
	}

	const calc = $derived(computeYear(shownAge));

	const rows = $derived.by(() => {
		const out: Year[] = [];
		for (let A = plan.retireAge; A <= plan.planToAge - 1; A++) {
			const y = computeYear(A);
			if (y && y.opening > 0) out.push(y);
		}
		return out;
	});
	const checkable = $derived(rows.filter((r) => r.graphNext !== null));
	const reconciled = $derived(checkable.filter((r) => r.matches).length);
	const allOk = $derived(checkable.length > 0 && reconciled === checkable.length);
</script>

<div class="calc-box">
	<label class="check calc-toggle">
		<input type="checkbox" bind:checked={show} />
		<span>Show calculations</span>
	</label>

	{#if show}
		<div class="calc-panel">
			<div class="calc-controls">
				<div class="toggle" role="group" aria-label="Scenario">
					<button
						type="button"
						class:active={scenario === 'average'}
						onclick={() => (scenario = 'average')}>Average</button
					>
					<button type="button" class:active={scenario === 'bad'} onclick={() => (scenario = 'bad')}
						>Worst case</button
					>
				</div>
				<div class="toggle" role="group" aria-label="View">
					<button type="button" class:active={mode === 'step'} onclick={() => (mode = 'step')}
						>Step</button
					>
					<button type="button" class:active={mode === 'table'} onclick={() => (mode = 'table')}
						>Table</button
					>
				</div>
				{#if mode === 'step'}
					<label class="calc-age">
						Age
						<input
							type="number"
							min={ageLo}
							max={ageHi}
							value={shownAge}
							oninput={(e) => (age = Number(e.currentTarget.value) || ageLo)}
						/>
					</label>
				{/if}
			</div>

			{#if mode === 'step' && calc}
				<ol class="calc-steps">
					<li>
						<span class="calc-label">{calc.growthLabel}</span>
						<code>{calc.growthEq}</code>
					</li>
					<li>
						<span class="calc-label">Opening balance at age {calc.A}</span>
						<code>{money(calc.opening)}</code>
					</li>
					{#if calc.pensionEq}
						<li>
							<span class="calc-label"
								>Age Pension for the year (assets test · rates as at {pensionAsAt}; estimate only)</span
							>
							<code>{calc.pensionEq}</code>
						</li>
					{/if}
					<li>
						<span class="calc-label">
							Balance after the year's cash flow (spending{calc.tax > 0.5 ? ', tax' : ''}{calc.income >
							0.5
								? ', income'
								: ''}{calc.pension > 0.5 ? ', pension' : ''})
						</span>
						<code>{calc.cashflowEq}</code>
					</li>
					<li>
						<span class="calc-label">Grow by {pctStr(calc.growth)}</span>
						<code
							>{num(calc.afterCashflow)} × (1 {calc.growth < 0 ? '−' : '+'} {pctStr(
								Math.abs(calc.growth)
							)}) = {num(calc.afterCashflow)} × {dec(1 + calc.growth)} = {num(calc.closing)}</code
						>
					</li>
					<li>
						<span class="calc-label">Closing balance — next year's opening (age {calc.A + 1})</span>
						<code class="calc-result">{money(calc.closing)}</code>
					</li>
				</ol>
				{#if calc.graphNext !== null}
					<p class="calc-check" class:ok={calc.matches}>
						{#if calc.matches}
							✓ Matches the graph's age {calc.A + 1} balance ({money(calc.graphNext)}).
						{:else}
							This exact hand-calc applies to a super-only plan. You hold other assets, so the graph
							blends their returns — age {calc.A + 1} on the graph is {money(calc.graphNext)}.
						{/if}
					</p>
				{/if}
			{:else if mode === 'table'}
				<p class="calc-check" class:ok={allOk}>
					{#if allOk}
						✓ All {checkable.length} years reconcile with the graph.
					{:else}
						{reconciled} of {checkable.length} years match. The rest hold assets other than super, so the
						graph blends their returns (see a row below).
					{/if}
				</p>
				<div class="calc-table-wrap">
					<table class="calc-table">
						<thead>
							<tr>
								<th>Age</th>
								<th>Opening</th>
								<th>Growth</th>
								<th>Closing (calc)</th>
								<th>Graph</th>
								<th aria-label="Matches"></th>
							</tr>
						</thead>
						<tbody>
							{#each rows as r}
								<tr>
									<td>{r.A}</td>
									<td>{money(r.opening)}</td>
									<td>{pctStr(r.growth)}</td>
									<td>{money(r.closing)}</td>
									<td>{r.graphNext === null ? '—' : money(r.graphNext)}</td>
									<td class="calc-tick" class:ok={r.matches}>{r.matches ? '✓' : '≠'}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</div>
	{/if}
</div>
