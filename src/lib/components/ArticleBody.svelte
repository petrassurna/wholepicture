<script lang="ts">
	import type { Block } from '$lib/content/articles';

	let { blocks }: { blocks: Block[] } = $props();

	// Turn our tiny inline syntax into safe HTML. Content is authored by us, but we
	// still escape everything first, then re-introduce only **bold** and [text](/link).
	function inline(text: string): string {
		const esc = text
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;');
		return esc
			.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
			.replace(/\[(.+?)\]\((\/[^)]*)\)/g, '<a href="$2">$1</a>');
	}
</script>

<div class="article-body">
	{#each blocks as block}
		{#if block.t === 'h2'}
			<h2>{block.text}</h2>
		{:else if block.t === 'p'}
			<!-- eslint-disable-next-line svelte/no-at-html-tags -->
			<p>{@html inline(block.text)}</p>
		{:else if block.t === 'ul'}
			<ul>
				{#each block.items as item}
					<li>{@html inline(item)}</li>
				{/each}
			</ul>
		{/if}
	{/each}
</div>
