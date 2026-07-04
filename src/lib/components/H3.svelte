<script lang="ts">
	import type { Snippet } from 'svelte';
	let { text, children }: { text?: string; children?: Snippet } = $props();
</script>

{#if children}
	<h3>{@render children()}</h3>
{:else}
	<h3>{text}</h3>
{/if}
