<script lang="ts">
	import H3 from './H3.svelte';
	let { n, title, text }: { n: number; title: string; text: string } = $props();
</script>

<div class="step">
	<div class="n">{n}</div>
	<H3 text={title} />
	<p>{text}</p>
</div>
