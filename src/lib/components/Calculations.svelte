<script lang="ts">
	import { project, realReturn } from '$lib/domain/projection';
	import { isTaxable } from '$lib/domain/assets';
	import { CURRENT_PENSION } from '$lib/domain/pension';
	import { plan } from '$lib/state/plan.svelte';
	import { trackEvent } from '$lib/analytics';
	import { taxOwed, type Filing } from '$lib/domain/tax';
	import { minDrawdownRate } from '$lib/domain/drawdown';

	const pensionAsAt = CURRENT_PENSION.asAt;

	// A transparency + self-check panel. It recomputes the year-by-year arithmetic
	// behind the graph from the displayed formula, and confirms each year lands on
	// the engine's number. "Step" explains one year in full; "Table" reconciles the
	// whole plan at a glance. It follows the whole portfolio: when you hold more than
	// super, each account's opening, its taxable income, its pro-rata share of the
	// draw and its own return are shown, then summed — so every year still reconciles.

	let show = $state(false);
	let mode = $state<'step' | 'table'>('step');
	let scenario = $state<'average' | 'bad'>('average');
	let age = $state(plan.retireAge);

	const proj = $derived(project(plan.assets, plan.buildAssumptions(), scenario));

	// The age to inspect, kept within range without an effect (which would read and
	// write `age` and loop). The input binds to `shownAge`. Range spans the whole
	// plan — the accumulation (working) years as well as drawdown.
	const ageLo = $derived(plan.currentAge);
	const ageHi = $derived(Math.max(plan.currentAge, plan.planToAge - 1));
	const shownAge = $derived(Math.min(Math.max(age, ageLo), ageHi));

	const money = (n: number) => '$' + Math.round(n).toLocaleString('en-AU');
	const num = (n: number) => Math.round(n).toLocaleString('en-AU');
	const dec = (n: number) => n.toFixed(4);
	const pctStr = (r: number) => (r * 100).toFixed(2) + '%';

	// Break each retirement income source down: its gross for the year, and — for a
	// source fixed in dollar terms — the real-terms deflation that shrinks it each
	// year (an indexed source keeps a constant real value). Mirrors income.ts.
	function incomeWorkings(A: number): { parts: string[]; summary: string } {
		const ctx = plan.realCtx;
		const active = plan.incomes.filter((s) => !s.toSuper && s.activeAt(A));
		const parts: string[] = [];
		let gross = 0;
		let taxable = 0;
		for (const s of active) {
			const g = s.grossAt(A, ctx);
			if (g <= 0.5) continue;
			gross += g;
			if (s.taxable) taxable += g;
			const name = s.label || 'Income';
			const taxNote = s.taxable ? '' : ' · tax-free';
			if (s.indexed || ctx.inflation === 0) {
				parts.push(`${name}: ${num(g)} (indexed — constant real value)${taxNote}`);
			} else {
				const k = A - ctx.startAge;
				parts.push(
					`${name}: ${num(s.amount)} ÷ (1 + ${pctStr(ctx.inflation)})^${k} = ${num(g)} (not indexed — erodes in real terms)${taxNote}`
				);
			}
		}
		let summary = '';
		const splitTaxable = Math.abs(gross - taxable) > 0.5;
		if (parts.length > 1 || (parts.length === 1 && splitTaxable)) {
			summary = `total income ${num(gross)}`;
			if (splitTaxable) summary += ` · taxable portion ${num(taxable)}`;
		}
		return { parts, summary };
	}

	// One person's tax worked across the brackets, less SAPTO/LITO, plus Medicare.
	// Mirrors taxOwed() in tax.ts so the figure lands on the engine's number.
	function personTaxEq(taxable: number, filing: Filing): { eq: string; total: number } {
		const tb = taxOwed(taxable, filing);
		const net = Math.max(0, tb.incomeTax - tb.sapto - tb.lito);
		let eq = `income tax ${num(tb.incomeTax)}`;
		if (tb.sapto > 0.5) eq += ` − SAPTO ${num(tb.sapto)}`;
		if (tb.lito > 0.5) eq += ` − LITO ${num(tb.lito)}`;
		if (tb.sapto > 0.5 || tb.lito > 0.5) eq += ` = ${num(net)}`;
		if (tb.medicare > 0.5) eq += ` + Medicare ${num(tb.medicare)}`;
		eq += ` = ${num(tb.total)}`;
		return { eq, total: tb.total };
	}

	// The tax line, fully worked. A couple splits assessable income 50/50 and is
	// assessed as two people (two thresholds, two SAPTOs) — as household.ts does.
	function taxWorkings(assessable: number): string {
		if (assessable <= 0.5) return '';
		if (plan.household === 'single') {
			return `taxable ${num(assessable)} → ${personTaxEq(assessable, 'single').eq}`;
		}
		const per = assessable / 2;
		const p = personTaxEq(per, 'couple');
		return `taxable ${num(assessable)} split 50/50 → ${num(per)} each → ${p.eq}; × 2 people = ${num(2 * p.total)}`;
	}

	// One account's line within a year: its opening, its balance just before growth
	// (after its share of the draw, or after a contribution), its own return, closing.
	interface AssetRow {
		label: string;
		opening: number;
		afterCashflow: number;
		growth: number;
		closing: number;
	}

	interface Year {
		A: number;
		phase: 'accumulation' | 'drawdown';
		opening: number;
		assets: AssetRow[];
		multi: boolean; // more than one account (super + at least one other)
		uniformGrowth: boolean; // every account grows at the same rate this year (so one line reconciles)
		growth: number; // effective portfolio growth (blended when accounts differ)
		growthLabel: string;
		growthEq: string; // '' when growth isn't a single meaningful rate (shown per-account instead)
		investParts: string[]; // per-account taxable-income working
		spend: number;
		tax: number;
		taxEq: string;
		income: number;
		incomeParts: string[];
		incomeSummary: string;
		pension: number;
		pensionEq: string;
		contribution: number;
		contributionEq: string;
		setAsideThisYear: number; // forced out by the minimum drawdown, not spent
		setAsideTotal: number; // running set-aside bucket at this age
		minDrawEq: string; // '' unless the minimum drawdown forced something aside
		afterCashflow: number;
		drawn: number; // total withdrawn from all accounts this year (drawdown only; 0 while working)
		cashflowEq: string;
		closing: number;
		graphNext: number | null;
		matches: boolean;
	}

	function computeYear(A: number): Year | null {
		const pt = proj.points.find((p) => p.age === A);
		const nextPt = proj.points.find((p) => p.age === A + 1);
		if (!pt) return null;

		// Per-account opening balances this year, aligned to plan.assets (super first).
		const assets = plan.assets;
		const openings = assets.map((_, i) => Math.max(0, pt.balances[i] ?? 0));
		const opening = openings.reduce((s, b) => s + b, 0);
		const R = plan.superReturn;
		const I = plan.inflation;
		const graphNext = nextPt?.balance ?? null;
		const multi = assets.length > 1;

		// --- Accumulation (still working): contribute, grow with the 15% earnings tax ---
		if (A < plan.retireAge) {
			const contribution = plan.contributionAt(A);
			// The engine adds contributions to the first non-taxable asset — Super (index 0).
			const rows: AssetRow[] = assets.map((asset, i) => {
				const g = realReturn(asset.nominalReturn * 0.85, I); // 15% earnings tax while working
				const after = openings[i] + (i === 0 ? contribution : 0);
				return {
					label: asset.label,
					opening: openings[i],
					afterCashflow: after,
					growth: g,
					closing: after * (1 + g)
				};
			});
			const afterCashflow = rows.reduce((s, r) => s + r.afterCashflow, 0);
			const closing = rows.reduce((s, r) => s + r.closing, 0);
			const uniformGrowth = assets.length === 1;
			const growth = afterCashflow !== 0 ? closing / afterCashflow - 1 : (rows[0]?.growth ?? 0);
			const growthEq = uniformGrowth
				? `${pctStr(R)} × 0.85 = ${pctStr(R * 0.85)} after the 15% earnings tax, then (1 + ${pctStr(R * 0.85)}) ÷ (1 + ${pctStr(I)}) − 1 = ${pctStr(growth)}`
				: '';

			const sgGross = plan.salary * plan.sgRate;
			const sacGross = plan.effectiveSacrifice;
			const concGross = sgGross + sacGross;
			let contributionEq = '';
			if (contribution > 0.5) {
				const src =
					sacGross > 0.5
						? `SG ${num(sgGross)} + sacrifice ${num(sacGross)} = ${num(concGross)}`
						: `${num(plan.salary)} × ${pctStr(plan.sgRate)} = ${num(concGross)}`;
				contributionEq = `${src}, × 0.85 (after 15% contributions tax) = ${num(contribution)}`;
			}
			const cashflowEq =
				contribution > 0.5
					? `${num(openings[0])} + ${num(contribution)} = ${num(openings[0] + contribution)} (into super)`
					: `${num(opening)} (no contribution set)`;
			const matches = graphNext !== null && Math.abs(closing - graphNext) < 1;
			return {
				A,
				phase: 'accumulation',
				opening,
				assets: rows,
				multi,
				uniformGrowth,
				growth,
				growthLabel: 'Real return while working (super earnings taxed 15%)',
				growthEq,
				investParts: [],
				spend: 0,
				tax: 0,
				taxEq: '',
				income: 0,
				incomeParts: [],
				incomeSummary: '',
				pension: 0,
				pensionEq: '',
				contribution,
				contributionEq,
				setAsideThisYear: 0,
				setAsideTotal: pt.setAside,
				minDrawEq: '',
				afterCashflow,
				drawn: 0,
				cashflowEq,
				closing,
				graphNext,
				matches
			};
		}

		// --- Drawdown ---
		const t = A - plan.retireAge;
		const recoveryReturn =
			plan.recoveryYears > 0
				? Math.pow(1 / (1 - plan.downturn), 1 / plan.recoveryYears) - 1
				: realReturn(R, I);

		// This year's taxable income from each account = its held balance × its taxable
		// yield. Super is tax-free (not ITaxable), so it never appears here.
		const investParts: string[] = [];
		let assetAssessable = 0;
		let taxableAccounts = 0;
		assets.forEach((asset, i) => {
			if (!isTaxable(asset)) return;
			const earned = asset.assessableIncomeOn(openings[i]);
			assetAssessable += earned;
			if (earned > 0.5) {
				taxableAccounts++;
				const rate = openings[i] > 0 ? earned / openings[i] : 0;
				investParts.push(`${asset.label}: ${num(openings[i])} × ${pctStr(rate)} = ${num(earned)}`);
			}
		});
		if (taxableAccounts > 1)
			investParts.push(`total taxable income from accounts ${num(assetAssessable)}`);

		const incomeAt = plan.incomeAt(A);
		const income = incomeAt.gross;
		const inc = incomeWorkings(A);
		// Tax is on the whole assessable income: the accounts' taxable income plus any
		// taxable income sources (matches the engine's taxOn(assetAssessable, age)).
		const tax = plan.taxOn(assetAssessable, A);
		const taxEq = taxWorkings(assetAssessable + incomeAt.taxable);
		const pension = plan.pensionAt(opening, A);

		// Show where the pension figure comes from: both means tests, paying the lower
		// (homeowner v1). Show it working whenever it's switched on — including why it's $0.
		let pensionEq = '';
		if (plan.includePension) {
			const s = CURRENT_PENSION;
			const max = s.maxAnnual[plan.household];
			const freeArea = s.assetFreeArea.homeowner[plan.household];
			if (A < s.eligibilityAge) {
				pensionEq = `age ${A} is under the pension age (${s.eligibilityAge}) → $0`;
			} else {
				// Assets test.
				const assetsReduction = Math.max(0, opening - freeArea) * s.taperPerDollar;
				const assetsTest = Math.max(0, max - assetsReduction);
				// Income test: deemed income on financial assets + actual income (wages, rent).
				const thr = s.deeming.threshold[plan.household];
				const deemed =
					Math.min(opening, thr) * s.deeming.rateLow +
					Math.max(0, opening - thr) * s.deeming.rateHigh;
				const assessable = deemed + income;
				const incFree = s.incomeFreeArea[plan.household];
				const incomeReduction = Math.max(0, assessable - incFree) * s.incomeTaperPerDollar;
				const incomeTest = Math.max(0, max - incomeReduction);
				const clamp = pension <= 0.5 ? ' → clamped to $0' : '';
				if (assetsTest <= incomeTest) {
					pensionEq =
						opening <= freeArea
							? `assets ${num(opening)} under the ${num(freeArea)} free area → full ${num(max)}; lower than the income test → ${num(pension)}`
							: `assets test (lower): ${num(max)} − (${num(opening)} − ${num(freeArea)}) × ${s.taperPerDollar} = ${num(pension)}${clamp}`;
				} else {
					pensionEq = `income test (lower): deemed ${num(deemed)} + income ${num(income)} = ${num(assessable)}; ${num(max)} − (${num(assessable)} − ${num(incFree)}) × ${s.incomeTaperPerDollar} = ${num(pension)}${clamp}`;
				}
			}
		}

		// Cash the portfolio must fund, floored at zero (a plain income surplus isn't
		// saved — conservative). Super must pay its ATO minimum drawdown, so that forced
		// money funds the year first and whatever it pushes out beyond what's needed is
		// set aside in a non-growing bucket. The rest of the need comes from the taxed
		// accounts, and super only pays ABOVE its minimum once those are empty — mirrors
		// the engine (see projection.ts), which is what makes the reconciliation a check.
		const rawNet = plan.spend + tax - income - pension;
		const need = Math.max(0, rawNet);
		const superBal = openings[0];
		const minRate = minDrawdownRate(A);
		const minW = minRate * superBal;
		const fromMin = Math.min(need, minW);
		const setAsideThisYear = minW - fromMin;
		const setAsideTotal = pt.setAside;

		const draws = openings.map(() => 0);
		const others = openings.map((o, i) => (i === 0 ? 0 : Math.max(0, o)));
		const otherTotal = others.reduce((s, b) => s + b, 0);
		const fromOthers = Math.min(need - fromMin, otherTotal);
		if (fromOthers > 0)
			openings.forEach((_, i) => {
				if (i !== 0) draws[i] = fromOthers * (others[i] / otherTotal);
			});
		draws[0] = minW + Math.min(need - fromMin - fromOthers, superBal - minW);
		const afterCashflow = openings.reduce((s, o, i) => s + (o - draws[i]), 0);
		const drawn = draws.reduce((s, d) => s + d, 0); // total pulled from the pot this year
		const surplus = rawNet < 0;

		const minDrawEq =
			setAsideThisYear > 0.5
				? `${pctStr(minRate)} × ${num(superBal)} = ${num(minW)} minimum vs ${num(need)} needed for spending → ${num(setAsideThisYear)} set aside (bucket now ${num(setAsideTotal)})`
				: '';

		const uniformGrowth = assets.length === 1 || (scenario === 'bad' && t <= plan.recoveryYears);
		const rows: AssetRow[] = assets.map((asset, i) => {
			let g = realReturn(asset.nominalReturn, I);
			if (scenario === 'bad' && t === 0) g = -plan.downturn;
			else if (scenario === 'bad' && t <= plan.recoveryYears) g = recoveryReturn;
			const after = openings[i] - draws[i];
			return {
				label: asset.label,
				opening: openings[i],
				afterCashflow: after,
				growth: g,
				closing: after * (1 + g)
			};
		});
		const closing = rows.reduce((s, r) => s + r.closing, 0);
		const growth = afterCashflow !== 0 ? closing / afterCashflow - 1 : (rows[0]?.growth ?? 0);

		let growthLabel = 'Real return (return above inflation)';
		let growthEq = uniformGrowth
			? `(1 + ${pctStr(R)}) ÷ (1 + ${pctStr(I)}) − 1 = ${dec(1 + R)} ÷ ${dec(1 + I)} − 1 = ${pctStr(growth)}`
			: '';
		if (scenario === 'bad' && t === 0) {
			growthLabel = 'Market crash in the first year of retirement';
			growthEq = `growth = −${pctStr(plan.downturn)}`;
		} else if (scenario === 'bad' && t <= plan.recoveryYears) {
			growthLabel = `Recovery year — climbing back to the pre-crash level over ${plan.recoveryYears} years`;
			growthEq = `(1 ÷ (1 − ${dec(plan.downturn)}))^(1 ÷ ${plan.recoveryYears}) − 1 = ${pctStr(growth)}`;
		}

		let cashflowEq: string;
		if (surplus) {
			const inParts = [`income ${num(income)}`];
			if (pension > 0.5) inParts.push(`pension ${num(pension)}`);
			const outParts = [`spending ${num(plan.spend)}`];
			if (tax > 0.5) outParts.push(`tax ${num(tax)}`);
			const covers = `${inParts.join(' + ')} cover ${outParts.join(' + ')}`;
			cashflowEq =
				setAsideThisYear > 0.5
					? `${covers}; the minimum drawdown forces ${num(setAsideThisYear)} out, set aside → ${num(opening)} − ${num(setAsideThisYear)} = ${num(afterCashflow)}`
					: `${covers} — nothing drawn (surplus not saved), balance unchanged at ${num(afterCashflow)}`;
		} else {
			const parts = [num(opening), `− ${num(plan.spend)}`];
			if (tax > 0.5) parts.push(`− ${num(tax)}`);
			if (income > 0.5) parts.push(`+ ${num(income)}`);
			if (pension > 0.5) parts.push(`+ ${num(pension)}`);
			if (setAsideThisYear > 0.5) parts.push(`− ${num(setAsideThisYear)} (set aside)`);
			cashflowEq = `${parts.join(' ')} = ${num(afterCashflow)}`;
		}

		const matches = graphNext !== null && Math.abs(closing - graphNext) < 1;

		return {
			A,
			phase: 'drawdown',
			opening,
			assets: rows,
			multi,
			uniformGrowth,
			growth,
			growthLabel,
			growthEq,
			investParts,
			spend: plan.spend,
			tax,
			taxEq,
			income,
			incomeParts: inc.parts,
			incomeSummary: inc.summary,
			pension,
			pensionEq,
			contribution: 0,
			contributionEq: '',
			setAsideThisYear,
			setAsideTotal,
			minDrawEq,
			afterCashflow,
			drawn,
			cashflowEq,
			closing,
			graphNext,
			matches
		};
	}

	const calc = $derived(computeYear(shownAge));

	const rows = $derived.by(() => {
		const out: Year[] = [];
		for (let A = plan.currentAge; A <= plan.planToAge - 1; A++) {
			const y = computeYear(A);
			if (y && y.opening > 0) out.push(y);
		}
		return out;
	});
	const checkable = $derived(rows.filter((r) => r.graphNext !== null));
	const reconciled = $derived(checkable.filter((r) => r.matches).length);
	const allOk = $derived(checkable.length > 0 && reconciled === checkable.length);

	// Only show the money-in columns a plan actually uses, so the default case
	// (super + pension, no other income or tax) stays uncluttered.
	const anyTax = $derived(rows.some((r) => r.tax > 0.5));
	const anyIncome = $derived(rows.some((r) => r.income > 0.5));
	const anyPension = $derived(rows.some((r) => r.pension > 0.5));
</script>

<div class="calc-box">
	<label class="check calc-toggle">
		<input
			type="checkbox"
			bind:checked={show}
			onchange={() => show && trackEvent('opened_calculations')}
		/>
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
					{#if calc.uniformGrowth && calc.growthEq}
						<li>
							<span class="calc-label">{calc.growthLabel}</span>
							<code>{calc.growthEq}</code>
						</li>
					{/if}
					<li>
						<span class="calc-label">Opening balance at age {calc.A}</span>
						{#if calc.multi}
							{#each calc.assets as a}
								<code class="calc-line">{a.label}: {money(a.opening)}</code>
							{/each}
							<code class="calc-line">total {money(calc.opening)}</code>
						{:else}
							<code>{money(calc.opening)}</code>
						{/if}
					</li>
					{#if calc.contributionEq}
						<li>
							<span class="calc-label"
								>Super contribution this year (salary × rate, less 15% tax)</span
							>
							<code>{calc.contributionEq}</code>
						</li>
					{/if}
					{#if calc.investParts.length}
						<li>
							<span class="calc-label"
								>Taxable income from your accounts this year (balance × return — the whole return is
								taxed)</span
							>
							{#each calc.investParts as part}
								<code class="calc-line">{part}</code>
							{/each}
						</li>
					{/if}
					{#if calc.incomeParts.length}
						<li>
							<span class="calc-label">Income received this year (offsets what you draw)</span>
							{#each calc.incomeParts as part}
								<code class="calc-line">{part}</code>
							{/each}
							{#if calc.incomeSummary}
								<code class="calc-line">{calc.incomeSummary}</code>
							{/if}
						</li>
					{/if}
					{#if calc.taxEq}
						<li>
							<span class="calc-label">Tax on the year's taxable income</span>
							<code>{calc.taxEq}</code>
						</li>
					{/if}
					{#if calc.pensionEq}
						<li>
							<span class="calc-label"
								>Age Pension for the year (assets &amp; income test, lower applies · rates as at
								{pensionAsAt}; estimate only)</span
							>
							<code>{calc.pensionEq}</code>
						</li>
					{/if}
					{#if calc.minDrawEq}
						<li>
							<span class="calc-label"
								>Minimum drawdown — super must pay out its ATO minimum; whatever that forces out
								beyond your spending is set aside (a non-growing bucket, not re-spent)</span
							>
							<code>{calc.minDrawEq}</code>
						</li>
					{/if}
					<li>
						{#if calc.phase === 'accumulation'}
							<span class="calc-label">Balance after this year's contribution</span>
						{:else}
							<span class="calc-label">
								Balance after the year's cash flow (spending{calc.tax > 0.5
									? ', tax'
									: ''}{calc.income > 0.5 ? ', income' : ''}{calc.pension > 0.5 ? ', pension' : ''})
							</span>
						{/if}
						<code>{calc.cashflowEq}</code>
					</li>
					{#if calc.uniformGrowth}
						<li>
							<span class="calc-label">Grow by {pctStr(calc.growth)}</span>
							<code
								>{num(calc.afterCashflow)} × (1 {calc.growth < 0 ? '−' : '+'}
								{pctStr(Math.abs(calc.growth))}) = {num(calc.afterCashflow)} × {dec(
									1 + calc.growth
								)} = {num(calc.closing)}</code
							>
						</li>
					{:else}
						<li>
							<span class="calc-label"
								>{calc.phase === 'accumulation'
									? 'Each account grows at its own return (super earnings taxed 15% while working)'
									: 'Each account grows at its own real return, then they sum'}</span
							>
							<div class="calc-subtable-wrap">
								<table class="calc-subtable">
									<thead>
										<tr>
											<th>Account</th>
											<th>Before growth</th>
											<th>Grows</th>
											<th>Closing</th>
										</tr>
									</thead>
									<tbody>
										{#each calc.assets as a}
											<tr>
												<td>{a.label}</td>
												<td>{money(a.afterCashflow)}</td>
												<td>{pctStr(a.growth)}</td>
												<td>{money(a.closing)}</td>
											</tr>
										{/each}
										<tr class="calc-subtotal">
											<td>Total</td>
											<td>{money(calc.afterCashflow)}</td>
											<td></td>
											<td>{money(calc.closing)}</td>
										</tr>
									</tbody>
								</table>
							</div>
						</li>
					{/if}
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
							≈ The graph shows {money(calc.graphNext)} at age {calc.A + 1}; small differences can
							appear in the years an account is nearly depleted.
						{/if}
					</p>
				{/if}
			{:else if mode === 'table'}
				<p class="calc-check" class:ok={allOk}>
					{#if allOk}
						✓ All {checkable.length} years reconcile with the graph.
					{:else}
						{reconciled} of {checkable.length} years match — small differences can appear in the years
						an account is nearly depleted.
					{/if}
				</p>
				<div class="calc-table-wrap">
					<table class="calc-table">
						<thead>
							<tr>
								<th>Age</th>
								<th>Opening</th>
								<th>Spend</th>
								{#if anyTax}<th>Tax</th>{/if}
								{#if anyIncome}<th>Income</th>{/if}
								{#if anyPension}<th>Pension</th>{/if}
								<th>Drawn</th>
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
									<td>{r.phase === 'drawdown' ? money(r.spend) : '—'}</td>
									{#if anyTax}<td>{r.phase === 'drawdown' && r.tax > 0.5 ? money(r.tax) : '—'}</td>{/if}
									{#if anyIncome}<td>{r.phase === 'drawdown' && r.income > 0.5 ? money(r.income) : '—'}</td
										>{/if}
									{#if anyPension}<td
											>{r.phase === 'drawdown' && r.pension > 0.5 ? money(r.pension) : '—'}</td
										>{/if}
									<td>{r.phase === 'drawdown' ? money(r.drawn) : '—'}</td>
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
