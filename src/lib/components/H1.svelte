<script lang="ts">
	import type { Snippet } from 'svelte';
	let { text, children }: { text?: string; children?: Snippet } = $props();
</script>

{#if children}
	<h1>{@render children()}</h1>
{:else}
	<h1>{text}</h1>
{/if}
