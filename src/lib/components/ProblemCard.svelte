<script lang="ts">
	import type { Snippet } from 'svelte';
	import H3 from './H3.svelte';
	let { title, text, icon }: { title: string; text: string; icon: Snippet } = $props();
</script>

<div class="prob">
	<div class="ic">{@render icon()}</div>
	<H3 text={title} />
	<p>{text}</p>
</div>
