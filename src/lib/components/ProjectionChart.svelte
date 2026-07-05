<script lang="ts">
	import { project, type Projection, type Assumptions } from '$lib/domain/projection';
	import { plan } from '$lib/state/plan.svelte';

	// Household toggle is a home-page preset only (it just swaps default numbers).
	let { household = false }: { household?: boolean } = $props();

	const assumptions = $derived<Assumptions>({
		startAge: plan.retireAge,
		endAge: plan.planToAge,
		spend: plan.spendPerYear,
		inflation: plan.inflation,
		downturn: plan.downturn,
		recoveryYears: plan.recoveryYears,
		incomeAt: (age) => plan.incomeAt(age)
	});
	const avg = $derived(project(plan.pot, assumptions, 'average'));
	const bad = $derived(project(plan.pot, assumptions, 'bad'));

	const yMax = $derived(
		Math.max(
			plan.totalBalance,
			...avg.points.map((p) => p.balance),
			...bad.points.map((p) => p.balance)
		) * 1.05
	);

	const x = (age: number) => 44 + ((age - plan.retireAge) / (plan.planToAge - plan.retireAge)) * 340;
	const y = (b: number) => 188 - (b / yMax) * 148;

	const axisTicks = $derived.by(() => {
		const span = plan.planToAge - plan.retireAge;
		return [
			plan.retireAge,
			Math.round(plan.retireAge + span / 3),
			Math.round(plan.retireAge + (2 * span) / 3),
			plan.planToAge
		];
	});

	const drawn = (p: Projection) => {
		const i = p.points.findIndex((pt) => pt.balance <= 0);
		return i === -1 ? p.points : p.points.slice(0, i + 1);
	};
	const avgDrawn = $derived(drawn(avg));
	const badDrawn = $derived(drawn(bad));
	const avgPts = $derived(
		avgDrawn.map((p) => `${x(p.age).toFixed(1)},${y(p.balance).toFixed(1)}`).join(' ')
	);
	const badPts = $derived(
		badDrawn.map((p) => `${x(p.age).toFixed(1)},${y(p.balance).toFixed(1)}`).join(' ')
	);

	const avgOut = $derived(avg.runsOutAge);
	const badOut = $derived(bad.runsOutAge);
	const avgEnd = $derived(avgOut ? avgDrawn[avgDrawn.length - 1] : null);
	const badEnd = $derived(badOut ? badDrawn[badDrawn.length - 1] : null);

	const label = (out: number | null) =>
		out ? `projected to run out ~${out}` : `projected to last past ${plan.planToAge} ✓`;
	const compact = (n: number) =>
		n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M` : `$${Math.round(n / 1000)}k`;
</script>

<div class="ct">
	<h4>
		{compact(plan.totalBalance)}
		{plan.bankAccounts.length ? 'total' : 'super'} to age {plan.planToAge}
	</h4>
	{#if household}
		<div class="toggle" role="group" aria-label="Household">
			<button
				type="button"
				class:active={plan.household === 'single'}
				onclick={() => plan.setHousehold('single')}>Single</button
			>
			<button
				type="button"
				class:active={plan.household === 'couple'}
				onclick={() => plan.setHousehold('couple')}>Couple</button
			>
		</div>
	{/if}
</div>

<svg viewBox="0 0 400 216" role="img" aria-label="Interactive projection of your balance">
	<g stroke="#eef1f4" stroke-width="1">
		<line x1="44" y1="70" x2="384" y2="70" />
		<line x1="44" y1="129" x2="384" y2="129" />
		<line x1="44" y1="188" x2="384" y2="188" />
	</g>

	<circle cx="48" cy="12.5" r="3.2" fill="#0f2540" />
	<text x="57" y="16" font-size="13" font-weight="600" fill="#0f2540">Average · {label(avgOut)}</text>
	<circle cx="48" cy="29.5" r="3.2" fill="#d9534f" />
	<text x="57" y="33" font-size="13" font-weight="600" fill="#d9534f">Bad case · {label(badOut)}</text>

	<g class="draw">
		<polyline
			fill="none"
			stroke="#0f2540"
			stroke-width="2.6"
			stroke-linecap="round"
			stroke-linejoin="round"
			points={avgPts}
		/>
		<polyline
			fill="none"
			stroke="#d9534f"
			stroke-width="2.6"
			stroke-dasharray="6 5"
			stroke-linecap="round"
			stroke-linejoin="round"
			points={badPts}
		/>
	</g>

	{#if avgEnd}
		<circle cx={x(avgEnd.age)} cy={y(avgEnd.balance)} r="3.4" fill="#0f2540" />
	{/if}
	{#if badEnd}
		<circle cx={x(badEnd.age)} cy={y(badEnd.balance)} r="3.4" fill="#d9534f" />
	{/if}

	<g font-size="11" fill="#93a0b0" text-anchor="middle">
		{#each axisTicks as t}
			<text x={x(t)} y="206">{t}</text>
		{/each}
	</g>
</svg>
