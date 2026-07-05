<script lang="ts">
	import { plan } from '$lib/state/plan.svelte';
	import ProjectionChart from './ProjectionChart.svelte';
	import H1 from './H1.svelte';

	const money = (n: number) => '$' + n.toLocaleString('en-AU');
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
				<a class="btn btn-primary" href="/model">Start modelling</a>
				<a class="btn btn-outline" href="/#how">See how it works</a>
			</div>
			<ul class="trust">
				<li>Free to try</li>
				<li>Your numbers stay yours</li>
				<li>Not financial advice</li>
			</ul>
		</div>

		<div class="hero-visual" id="try">
			<div class="chart-card">
				<ProjectionChart household />

				<div class="sliders">
					<div class="slider">
						<div class="slider-top">
							<span>Starting super</span>
							<b>{money(plan.superBalance)}</b>
						</div>
						<input
							type="range"
							min="100000"
							max={plan.superMax}
							step="25000"
							bind:value={plan.superBalance}
						/>
					</div>
					<div class="slider">
						<div class="slider-top">
							<span>Spend per year</span>
							<b>{money(plan.spendPerYear)}</b>
						</div>
						<input
							type="range"
							min="30000"
							max="150000"
							step="2500"
							bind:value={plan.spendPerYear}
						/>
					</div>
				</div>

				<p class="assume">
					In today's dollars · ~{(plan.realReturn * 100).toFixed(1)}% p.a. return after inflation
				</p>
				<p class="chart-note">
					Illustrative projections only. Actual investment returns, inflation, tax, fees and future
					spending will differ.
				</p>
			</div>
		</div>
	</div>
</section>
