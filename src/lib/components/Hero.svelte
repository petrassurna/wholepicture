<script lang="ts">
	import { project } from '$lib/project';
	import H1 from './H1.svelte';

	const startAge = 60;
	const endAge = 90;
	let balance = $state(500000);
	const growth = 0.045; // real return (≈7% nominal − 2.5% inflation), so figures are in today's dollars
	const downturn = 0.3; // bad case: one-off 30% crash in year 1...
	const recoveryYears = 5; // ...that climbs back to its pre-crash level over 5 years

	let spend = $state(40000);

	const params = $derived({ startAge, endAge, balance, spend, growth, downturn, recoveryYears });
	const avg = $derived(project(params, 'average'));
	const bad = $derived(project(params, 'bad'));

	const yMax = $derived(
		Math.max(balance, ...avg.points.map((p) => p.balance), ...bad.points.map((p) => p.balance)) *
			1.05
	);

	const x = (age: number) => 44 + ((age - startAge) / (endAge - startAge)) * 340;
	const y = (b: number) => 188 - (b / yMax) * 148;

	const avgPts = $derived(
		avg.points.map((p) => `${x(p.age).toFixed(1)},${y(p.balance).toFixed(1)}`).join(' ')
	);
	const badPts = $derived(
		bad.points.map((p) => `${x(p.age).toFixed(1)},${y(p.balance).toFixed(1)}`).join(' ')
	);

	const avgOut = $derived(avg.runsOutAge);
	const badOut = $derived(bad.runsOutAge);
	const avgMarkerX = $derived(avgOut ? x(avgOut) : null);
	const badMarkerX = $derived(badOut ? x(badOut) : null);

	const label = (out: number | null) =>
		out ? `projected to run out ~${out}` : `projected to last past ${endAge} ✓`;
	const money = (n: number) => '$' + n.toLocaleString('en-AU');
	const compact = (n: number) =>
		n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M` : `$${Math.round(n / 1000)}k`;
</script>

<section class="hero">
	<div class="container hero-grid">
		<div class="hero-copy">
			<p class="tag">Model it before you live it</p>
			<H1>
				Explore how long your money might <span class="hl">last</span> in retirement — under different
				assumptions.
			</H1>
			<p class="sub">
				Whole Picture is a projection tool for everyday Australians. Enter your own numbers and see
				different projected outcomes based on your assumptions, year by year — including how a
				downturn at the wrong time could unfold.
			</p>
			<div class="cta">
				<a class="btn btn-primary" href="/app">Start modelling</a>
				<a class="btn btn-outline" href="/#how">See how it works</a>
			</div>
			<ul class="trust">
				<li>Free to try</li>
				<li>Your numbers stay yours</li>
				<li>Not financial advice</li>
			</ul>
		</div>

		<div class="hero-visual">
			<div class="chart-card">
				<div class="ct">
					<h4>{compact(balance)} super to age {endAge}</h4>
				</div>
				<svg viewBox="0 0 400 216" role="img" aria-label="Interactive projection of super balance">
					<g stroke="#eef1f4" stroke-width="1">
						<line x1="44" y1="70" x2="384" y2="70" />
						<line x1="44" y1="129" x2="384" y2="129" />
						<line x1="44" y1="188" x2="384" y2="188" />
					</g>

					<!-- Outcomes, up top -->
					<circle cx="48" cy="12.5" r="3.2" fill="#0f2540" />
					<text x="57" y="16" font-size="11.5" font-weight="600" fill="#0f2540"
						>Average · {label(avgOut)}</text
					>
					<circle cx="48" cy="29.5" r="3.2" fill="#d9534f" />
					<text x="57" y="33" font-size="11.5" font-weight="600" fill="#d9534f"
						>Bad case · {label(badOut)}</text
					>

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

					{#if avgMarkerX !== null}
						<line
							x1={avgMarkerX}
							y1="188"
							x2={avgMarkerX}
							y2="150"
							stroke="#0f2540"
							stroke-width="1"
							stroke-dasharray="3 3"
							opacity="0.35"
						/>
						<circle cx={avgMarkerX} cy="187" r="3.2" fill="#0f2540" />
					{/if}
					{#if badMarkerX !== null}
						<line
							x1={badMarkerX}
							y1="188"
							x2={badMarkerX}
							y2="150"
							stroke="#d9534f"
							stroke-width="1"
							stroke-dasharray="3 3"
							opacity="0.5"
						/>
						<circle cx={badMarkerX} cy="187" r="3.2" fill="#d9534f" />
					{/if}

					<g font-size="11" fill="#93a0b0" text-anchor="middle">
						<text x="44" y="206">60</text>
						<text x="157" y="206">70</text>
						<text x="270" y="206">80</text>
						<text x="380" y="206">90</text>
					</g>
				</svg>

				<div class="sliders">
					<div class="slider">
						<div class="slider-top">
							<span>Starting super</span>
							<b>{money(balance)}</b>
						</div>
						<input type="range" min="100000" max="3000000" step="25000" bind:value={balance} />
					</div>
					<div class="slider">
						<div class="slider-top">
							<span>Spend per year</span>
							<b>{money(spend)}</b>
						</div>
						<input type="range" min="30000" max="150000" step="2500" bind:value={spend} />
					</div>
				</div>

				<p class="assume">
					In today's dollars · ~{(growth * 100).toFixed(1)}% p.a. return after inflation
				</p>
				<p class="chart-note">
					Illustrative projections only. Actual investment returns, inflation, tax, fees and future
					spending will differ.
				</p>
			</div>
		</div>
	</div>
</section>
