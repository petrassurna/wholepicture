<script lang="ts">
	import type { Snippet } from 'svelte';
	let { text, children }: { text?: string; children?: Snippet } = $props();
</script>

{#if children}
	<h2>{@render children()}</h2>
{:else}
	<h2>{text}</h2>
{/if}
