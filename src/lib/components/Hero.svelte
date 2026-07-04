<script lang="ts">
	import { project } from '$lib/project';
	import H1 from './H1.svelte';

	const startAge = 60;
	const endAge = 90;
	const balance = 500000;
	const growth = 0.07;
	const downturn = 0.3;

	let spend = $state(40000);

	const avg = $derived(project({ startAge, endAge, balance, spend, growth, downturn }, 'average'));
	const bad = $derived(project({ startAge, endAge, balance, spend, growth, downturn }, 'bad'));

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

	const markerAge = $derived(bad.runsOutAge);
	const markerX = $derived(markerAge ? x(markerAge) : null);

	const money = (n: number) => '$' + n.toLocaleString('en-AU');
	const outcome = (r: number | null) => (r ? `runs out at ${r}` : `lasts to ${endAge} ✓`);
</script>

<section class="hero">
	<div class="container hero-grid">
		<div class="hero-copy">
			<p class="tag">Model it before you live it</p>
			<H1>See how long your money could <span class="hl">last</span>.</H1>
			<p class="sub">
				Whole Picture is a projection tool for everyday Australians. Enter your own numbers and watch
				your financial future play out, year by year — including how a downturn at the wrong time
				could unfold.
			</p>
			<div class="cta">
				<a class="btn btn-primary" href="/#start">Start modelling</a>
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
					<h4>$500k super to age {endAge}</h4>
					<div class="legend">
						<span><i style="background:#0f2540"></i>Average</span>
						<span><i style="background:#d9534f"></i>Bad case</span>
					</div>
				</div>
				<svg viewBox="0 0 400 216" role="img" aria-label="Interactive projection of super balance">
					<g stroke="#eef1f4" stroke-width="1">
						<line x1="44" y1="70" x2="384" y2="70" />
						<line x1="44" y1="129" x2="384" y2="129" />
						<line x1="44" y1="188" x2="384" y2="188" />
					</g>
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
						{#if markerX !== null}
							<line
								x1={markerX}
								y1="188"
								x2={markerX}
								y2="74"
								stroke="#d9534f"
								stroke-width="1"
								stroke-dasharray="3 3"
								opacity="0.6"
							/>
							<circle cx={markerX} cy="187" r="3.5" fill="#d9534f" />
							<text
								x={markerX}
								y="66"
								text-anchor="middle"
								font-size="11"
								fill="#d9534f"
								font-weight="600">runs out ~{markerAge}</text
							>
						{/if}
					</g>
					<g font-size="11" fill="#93a0b0" text-anchor="middle">
						<text x="44" y="206">60</text>
						<text x="157" y="206">70</text>
						<text x="270" y="206">80</text>
						<text x="380" y="206">90</text>
					</g>
				</svg>

				<div class="slider">
					<div class="slider-top">
						<span>Drag: spend per year</span>
						<b>{money(spend)}</b>
					</div>
					<input type="range" min="30000" max="90000" step="2500" bind:value={spend} />
				</div>

				<div class="readout">
					<span><i style="background:#0f2540"></i>Average: {outcome(avg.runsOutAge)}</span>
					<span><i style="background:#d9534f"></i>Bad case: {outcome(bad.runsOutAge)}</span>
				</div>

				<p class="assume">
					Illustrative only · assumes {Math.round(growth * 100)}% p.a. average growth
				</p>
			</div>
		</div>
	</div>
</section>
