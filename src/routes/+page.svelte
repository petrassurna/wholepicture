<script lang="ts">
	import Hero from '$lib/components/Hero.svelte';
	import Problem from '$lib/components/Problem.svelte';
	import HowItWorks from '$lib/components/HowItWorks.svelte';
	import DevDisclaimer from '$lib/components/DevDisclaimer.svelte';
</script>

<svelte:head>
	<title>How Long Will Your Super Last? | Whole Picture</title>
	<meta
		name="description"
		content="Model how long your super could last in retirement. A free Australian projection tool — enter your own numbers and explore different scenarios. Not financial advice."
	/>
	<meta property="og:title" content="How Long Will Your Super Last? | Whole Picture" />
	<meta
		property="og:description"
		content="A free Australian projection tool — model how long your super could last in retirement and explore different scenarios. Not financial advice."
	/>
</svelte:head>

<DevDisclaimer />

<Hero />
<Problem />
<HowItWorks />
