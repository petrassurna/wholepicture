<script lang="ts">
	import H2 from './H2.svelte';
	import ProblemCard from './ProblemCard.svelte';
</script>

<section id="why" class="problem">
	<div class="container">
		<p class="eyebrow">The problem</p>
		<H2 text="Seeing your future costs too much — or shows too little." />
		<div class="problem-grid">
			<ProblemCard
				title="Plans cost thousands"
				text="A full financial plan runs $3,000–$10,000 — so most people never see their own numbers laid out."
			>
				{#snippet icon()}
					<svg
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="1.6"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<circle cx="12" cy="12" r="9" />
						<path
							d="M12 7v10M14.5 9.3c-.3-1-1.3-1.6-2.5-1.6-1.4 0-2.4.8-2.4 1.9 0 2.4 4.9 1.4 4.9 3.8 0 1.1-1 1.9-2.5 1.9-1.2 0-2.2-.6-2.5-1.6"
						/>
					</svg>
				{/snippet}
			</ProblemCard>
			<ProblemCard
				title="Spreadsheets take a weekend"
				text="Building your own model from scratch is hours of fiddly formulas."
			>
				{#snippet icon()}
					<svg
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="1.6"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<rect x="3" y="4" width="18" height="16" rx="2" />
						<path d="M3 9h18M3 14.5h18M9 4v16M15 4v16" />
					</svg>
				{/snippet}
			</ProblemCard>
			<ProblemCard
				title="Calculators see only super"
				text="They skip your spending, a market downturn, and how long it all really lasts."
			>
				{#snippet icon()}
					<svg
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="1.6"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<circle cx="12" cy="12" r="9" />
						<path d="M12 12V3.2" />
						<path d="M12 12l7.6 4.2" />
					</svg>
				{/snippet}
			</ProblemCard>
		</div>
		<p class="resolve">
			Whole Picture isn't a cheaper adviser — it's a modelling tool. <strong
				>You enter the figures. It shows you a projection. You draw your own conclusions.</strong
			>
		</p>
	</div>
</section>
