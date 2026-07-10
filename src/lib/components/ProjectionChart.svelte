<script lang="ts">
	import { project, type Projection, type Assumptions } from '$lib/domain/projection';
	import { plan } from '$lib/state/plan.svelte';
	import Help from './Help.svelte';

	// Household toggle is a home-page preset only (it just swaps default numbers).
	let { household = false }: { household?: boolean } = $props();

	const assumptions = $derived<Assumptions>(plan.buildAssumptions());
	const avg = $derived(project(plan.assets, assumptions, 'average'));
	const bad = $derived(project(plan.assets, assumptions, 'bad'));

	// Chart view — Tax exists only with assessable income; Set aside only when the
	// minimum drawdown has forced money aside. `view` is the user's choice;
	// `activeView` falls back to Balance when the chosen tab is hidden (without an
	// effect, so the choice is remembered if the tab reappears).
	let view = $state<'balance' | 'tax' | 'setAside'>('balance');
	const showTaxTab = $derived(plan.hasTaxableItems);
	const showSetAsideTab = $derived(avg.totalSetAside > 0.5);
	const activeView = $derived(
		view === 'tax' && showTaxTab
			? 'tax'
			: view === 'setAside' && showSetAsideTab
				? 'setAside'
				: 'balance'
	);

	// Round an axis up to "nice" gridline values so they read as round amounts.
	const niceStep = (max: number): number => {
		const target = Math.max(max, 1) / 4; // aim for ~4 divisions
		const pow = Math.pow(10, Math.floor(Math.log10(target)));
		const n = target / pow;
		const nice = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
		return nice * pow;
	};

	const balMax = $derived(
		Math.max(
			plan.totalBalance,
			...avg.points.map((p) => p.balance),
			...bad.points.map((p) => p.balance)
		)
	);
	const balStep = $derived(niceStep(balMax));
	const balAxisMax = $derived(Math.max(balStep, Math.ceil(balMax / balStep) * balStep));
	const balYTicks = $derived.by(() => {
		const ticks: number[] = [];
		for (let v = 0; v <= balAxisMax + 1e-6; v += balStep) ticks.push(v);
		return ticks;
	});

	// The timeline starts at your current age (which equals the retirement age when
	// there's no accumulation phase) and runs to the plan-to age.
	const t0 = $derived(plan.currentAge);
	const x = (age: number) => 44 + ((age - t0) / (plan.planToAge - t0)) * 340;
	// Plot spans y 68 (top) → 188 (bottom); the 68 start leaves clear space under the
	// two-row legend (Average / Bad case).
	const y = (b: number) => 188 - (b / balAxisMax) * 148;

	const axisTicks = $derived.by(() => {
		const span = plan.planToAge - t0;
		return [t0, Math.round(t0 + span / 3), Math.round(t0 + (2 * span) / 3), plan.planToAge];
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
		n >= 1_000_000
			? `$${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`
			: `$${Math.round(n / 1000)}k`;
	const axisMoney = (n: number) =>
		n === 0
			? '$0'
			: n >= 1_000_000
				? `$${Number.isInteger(n / 1_000_000) ? n / 1_000_000 : (n / 1_000_000).toFixed(1)}M`
				: n >= 1000
					? `$${Number.isInteger(n / 1000) ? n / 1000 : (n / 1000).toFixed(1)}k`
					: `$${Math.round(n)}`;

	// --- Tax view: taxable income vs tax paid, as two lines (average case) ---
	const totalTax = $derived(avg.totalTax);
	const rawIncMax = $derived(Math.max(1, ...avg.points.map((p) => p.assessableIncome)));
	const taxStep = $derived(niceStep(rawIncMax));
	const taxAxisMax = $derived(Math.ceil(rawIncMax / taxStep) * taxStep);
	const taxYTicks = $derived.by(() => {
		const ticks: number[] = [];
		for (let v = 0; v <= taxAxisMax + 1e-6; v += taxStep) ticks.push(v);
		return ticks;
	});
	const yt = (v: number) => 188 - (v / taxAxisMax) * 148;
	const incLine = $derived(
		avg.points.map((p) => `${x(p.age).toFixed(1)},${yt(p.assessableIncome).toFixed(1)}`).join(' ')
	);
	const taxLine = $derived(
		avg.points.map((p) => `${x(p.age).toFixed(1)},${yt(p.tax).toFixed(1)}`).join(' ')
	);

	// --- Set aside view: the forced-drawdown bucket accumulating (average case) ---
	const totalSetAside = $derived(avg.totalSetAside);
	const saStep = $derived(niceStep(Math.max(1, totalSetAside)));
	const saAxisMax = $derived(Math.ceil(Math.max(1, totalSetAside) / saStep) * saStep);
	const saYTicks = $derived.by(() => {
		const ticks: number[] = [];
		for (let v = 0; v <= saAxisMax + 1e-6; v += saStep) ticks.push(v);
		return ticks;
	});
	const ys = (v: number) => 188 - (v / saAxisMax) * 148;
	const saLine = $derived(
		avg.points.map((p) => `${x(p.age).toFixed(1)},${ys(p.setAside).toFixed(1)}`).join(' ')
	);

	// Hover readout (shared — only one view is visible at a time).
	let hoverAge = $state<number | null>(null);
	const hp = $derived(
		hoverAge == null ? null : (avg.points.find((p) => p.age === hoverAge) ?? null)
	);
	const hAvg = $derived(
		hoverAge == null ? null : (avg.points.find((p) => p.age === hoverAge) ?? null)
	);
	const hBad = $derived(
		hoverAge == null ? null : (bad.points.find((p) => p.age === hoverAge) ?? null)
	);
	const fmtFull = (n: number) => `$${Math.round(n).toLocaleString()}`;
	function onHover(e: PointerEvent) {
		const rect = (e.currentTarget as SVGElement).getBoundingClientRect();
		const vbX = ((e.clientX - rect.left) / rect.width) * 400;
		const raw = t0 + ((vbX - 44) / 340) * (plan.planToAge - t0);
		hoverAge = Math.round(Math.min(plan.planToAge, Math.max(t0, raw)));
	}
</script>

<div class="ct">
	<h4>
		{#if activeView === 'tax'}
			{compact(totalTax)} in tax to age {plan.planToAge}
		{:else if activeView === 'setAside'}
			{compact(totalSetAside)} set aside by age {plan.planToAge}
		{:else}
			{compact(plan.totalBalance)}
			{plan.bankAccounts.length ? 'total' : 'super'} to age {plan.planToAge}
		{/if}
	</h4>
	{#if showTaxTab || showSetAsideTab}
		<div class="toggle" role="group" aria-label="Chart view">
			<button
				type="button"
				class:active={activeView === 'balance'}
				onclick={() => (view = 'balance')}>Balance</button
			>
			{#if showTaxTab}
				<button type="button" class:active={activeView === 'tax'} onclick={() => (view = 'tax')}
					>Tax</button
				>
			{/if}
			{#if showSetAsideTab}
				<button
					type="button"
					class:active={activeView === 'setAside'}
					onclick={() => (view = 'setAside')}>Set aside</button
				>
			{/if}
		</div>
	{:else if household}
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

{#if activeView === 'tax'}
	<svg
		viewBox="0 0 400 216"
		role="img"
		aria-label="Taxable income and tax paid each year"
		onpointermove={onHover}
		onpointerleave={() => (hoverAge = null)}
	>
		<rect x="0" y="0" width="400" height="216" fill="transparent" />
		<g stroke="#eef1f4" stroke-width="1">
			{#each taxYTicks as v}
				<line x1="44" y1={yt(v).toFixed(1)} x2="384" y2={yt(v).toFixed(1)} />
			{/each}
		</g>

		<g font-size="11" fill="#93a0b0" text-anchor="end">
			{#each taxYTicks as v}
				<text x="40" y={(yt(v) + 3.5).toFixed(1)}>{axisMoney(v)}</text>
			{/each}
		</g>

		<circle cx="48" cy="12.5" r="3.2" fill="#0f2540" />
		<text x="57" y="16" font-size="13" font-weight="600" fill="#0f2540">Taxable income</text>
		<circle cx="180" cy="12.5" r="3.2" fill="#c9a24b" />
		<text x="189" y="16" font-size="13" font-weight="600" fill="#a9812f">Tax paid</text>

		<polyline
			fill="none"
			stroke="#0f2540"
			stroke-width="2.6"
			stroke-linecap="round"
			stroke-linejoin="round"
			points={incLine}
		/>
		<polyline
			fill="none"
			stroke="#c9a24b"
			stroke-width="2.6"
			stroke-linecap="round"
			stroke-linejoin="round"
			points={taxLine}
		/>

		{#if hp}
			{@const hx = x(hp.age)}
			{@const flip = hx > 210}
			<g pointer-events="none">
				<line
					x1={hx}
					y1="40"
					x2={hx}
					y2="188"
					stroke="#cbd3dd"
					stroke-width="1"
					stroke-dasharray="3 3"
				/>
				<circle cx={hx} cy={yt(hp.assessableIncome)} r="3.4" fill="#0f2540" />
				<circle cx={hx} cy={yt(hp.tax)} r="3.4" fill="#c9a24b" />
				<g transform={`translate(${flip ? hx - 128 : hx + 10}, 44)`}>
					<rect width="118" height="58" rx="6" fill="#0f2540" opacity="0.96" />
					<text x="10" y="18" font-size="12" font-weight="700" fill="#fff">Age {hp.age}</text>
					<circle cx="13" cy="33" r="3" fill="#8fa6c4" />
					<text x="22" y="37" font-size="11.5" fill="#dce4ef"
						>Income {fmtFull(hp.assessableIncome)}</text
					>
					<circle cx="13" cy="48" r="3" fill="#c9a24b" />
					<text x="22" y="52" font-size="11.5" fill="#dce4ef">Tax {fmtFull(hp.tax)}</text>
				</g>
			</g>
		{/if}

		<g font-size="11" fill="#93a0b0" text-anchor="middle">
			{#each axisTicks as t}
				<text x={x(t)} y="206">{t}</text>
			{/each}
		</g>
	</svg>
	<p class="chart-note">
		{#if totalTax > 0}
			Estimated tax each year (average case) — about {compact(totalTax)} over the plan. Bad-case tax runs
			lower, since a smaller balance earns less interest. Your super pension is never taxed.
		{:else}
			No tax due — your assessable income stays under the senior tax-free thresholds. Your super
			pension is tax-free.
		{/if}
	</p>
{:else if activeView === 'setAside'}
	<svg
		viewBox="0 0 400 216"
		role="img"
		aria-label="Money set aside by the minimum drawdown, accumulating over the plan"
		onpointermove={onHover}
		onpointerleave={() => (hoverAge = null)}
	>
		<rect x="0" y="0" width="400" height="216" fill="transparent" />
		<g stroke="#eef1f4" stroke-width="1">
			{#each saYTicks as v}
				<line x1="44" y1={ys(v).toFixed(1)} x2="384" y2={ys(v).toFixed(1)} />
			{/each}
		</g>
		<g font-size="11" fill="#93a0b0" text-anchor="end">
			{#each saYTicks as v}
				<text x="40" y={(ys(v) + 3.5).toFixed(1)}>{axisMoney(v)}</text>
			{/each}
		</g>

		<circle cx="48" cy="12.5" r="3.2" fill="#2e7d5b" />
		<text x="57" y="16" font-size="13" font-weight="600" fill="#2e7d5b"
			>Spare cash you didn't plan to have</text
		>

		<polyline
			fill="none"
			stroke="#2e7d5b"
			stroke-width="2.6"
			stroke-linecap="round"
			stroke-linejoin="round"
			points={saLine}
		/>

		{#if hp}
			{@const hx = x(hp.age)}
			{@const flip = hx > 210}
			<g pointer-events="none">
				<line
					x1={hx}
					y1="40"
					x2={hx}
					y2="188"
					stroke="#cbd3dd"
					stroke-width="1"
					stroke-dasharray="3 3"
				/>
				<circle cx={hx} cy={ys(hp.setAside)} r="3.4" fill="#2e7d5b" />
				<g transform={`translate(${flip ? hx - 138 : hx + 10}, 44)`}>
					<rect width="128" height="40" rx="6" fill="#0f2540" opacity="0.96" />
					<text x="10" y="18" font-size="12" font-weight="700" fill="#fff">Age {hp.age}</text>
					<circle cx="13" cy="31" r="3" fill="#7fc0a6" />
					<text x="22" y="35" font-size="11.5" fill="#dce4ef">Set aside {fmtFull(hp.setAside)}</text
					>
				</g>
			</g>
		{/if}

		<g font-size="11" fill="#93a0b0" text-anchor="middle">
			{#each axisTicks as t}
				<text x={x(t)} y="206">{t}</text>
			{/each}
		</g>
	</svg>
	<p class="chart-note">
		The ATO minimum pays out more than you spend, so about {compact(totalSetAside)} builds up as cash
		by age {plan.planToAge} — your own super, just out early. Real, spendable money, so you're better
		off than the balance line suggests.
	</p>
{:else}
	<div class="chart-legend">
		<span class="lg-item">
			<i style="background: #0f2540"></i>
			<span>Average · {label(avgOut)}</span>
			<Help
				text="Steady growth at your assumed return each year — if markets behave normally. Adjust the return (Superannuation) or inflation (Assumptions)."
			/>
		</span>
		<span class="lg-item">
			<i style="background: #d9534f"></i>
			<span>Bad case · {label(badOut)}</span>
			<Help
				text="A market crash right at retirement, then a slow recovery — an early slump while you're drawing down makes the money run out sooner. Adjust it in Assumptions."
			/>
		</span>
	</div>
	<svg
		viewBox="0 0 400 216"
		role="img"
		aria-label="Interactive projection of your balance"
		onpointermove={onHover}
		onpointerleave={() => (hoverAge = null)}
	>
		<rect x="0" y="0" width="400" height="216" fill="transparent" />
		<g stroke="#eef1f4" stroke-width="1">
			{#each balYTicks as v}
				<line x1="44" y1={y(v).toFixed(1)} x2="384" y2={y(v).toFixed(1)} />
			{/each}
		</g>
		<g font-size="11" fill="#93a0b0" text-anchor="end">
			{#each balYTicks as v}
				<text x="40" y={(y(v) + 3.5).toFixed(1)}>{axisMoney(v)}</text>
			{/each}
		</g>

		{#if plan.currentAge < plan.retireAge}
			<line
				x1={x(plan.retireAge)}
				y1="40"
				x2={x(plan.retireAge)}
				y2="188"
				stroke="#c9a24b"
				stroke-width="1"
				stroke-dasharray="3 3"
			/>
			<text x={x(plan.retireAge)} y="36" font-size="10" fill="#a9812f" text-anchor="middle"
				>Retire {plan.retireAge}</text
			>
		{/if}

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

		{#if hAvg && hBad}
			{@const hx = x(hAvg.age)}
			{@const flip = hx > 200}
			<g pointer-events="none">
				<line
					x1={hx}
					y1="40"
					x2={hx}
					y2="188"
					stroke="#cbd3dd"
					stroke-width="1"
					stroke-dasharray="3 3"
				/>
				<circle cx={hx} cy={y(hAvg.balance)} r="3.4" fill="#0f2540" />
				<circle cx={hx} cy={y(hBad.balance)} r="3.4" fill="#d9534f" />
				<g transform={`translate(${flip ? hx - 156 : hx + 10}, 44)`}>
					<rect width="146" height="58" rx="6" fill="#0f2540" opacity="0.96" />
					<text x="10" y="18" font-size="12" font-weight="700" fill="#fff">Age {hAvg.age}</text>
					<circle cx="13" cy="33" r="3" fill="#8fa6c4" />
					<text x="22" y="37" font-size="11.5" fill="#dce4ef">Average {fmtFull(hAvg.balance)}</text>
					<circle cx="13" cy="48" r="3" fill="#d9534f" />
					<text x="22" y="52" font-size="11.5" fill="#dce4ef">Bad case {fmtFull(hBad.balance)}</text
					>
				</g>
			</g>
		{/if}

		<g font-size="11" fill="#93a0b0" text-anchor="middle">
			{#each axisTicks as t}
				<text x={x(t)} y="206">{t}</text>
			{/each}
		</g>
	</svg>
	{#if showSetAsideTab && (avgOut || badOut)}
		<p class="chart-note">
			The run-out age ignores your set-aside cash (about {compact(totalSetAside)} by age {plan.planToAge}) —
			money the minimum drawdown forces out of super that the model doesn't re-spend. That cash would
			really fund more years, so your money likely lasts longer than shown.
		</p>
	{/if}
{/if}
