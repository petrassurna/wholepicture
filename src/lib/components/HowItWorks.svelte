<script lang="ts">
	import H2 from './H2.svelte';
	import Step from './Step.svelte';
</script>

<section id="how">
	<div class="container">
		<H2 text="How it works" />
		<div class="steps">
			<Step
				n={1}
				title="Enter your details"
				text="Your age, what you spend each year, and your super. Every field is pre-filled and editable."
			/>
			<Step
				n={2}
				title="See various scenarios"
				text="From an average case to a bad-timing downturn — year by year, side by side."
			/>
			<Step
				n={3}
				title="Explore"
				text="Change any number and watch the projection update instantly. Model it before you live it."
			/>
		</div>
	</div>
</section>
