<script lang="ts">
	// Reusable "remove row" button (the × next to bank accounts, income, spend items).
	let {
		onclick,
		label = 'Remove',
		small = false
	}: { onclick: () => void; label?: string; small?: boolean } = $props();
</script>

<button type="button" class="remove" class:small aria-label={label} {onclick}>×</button>

<style>
	.remove {
		width: 40px;
		height: 42px;
		flex-shrink: 0;
		margin: 0;
		padding: 0;
		border: 1px solid var(--line);
		background: #fff;
		border-radius: 8px;
		color: var(--muted);
		font-size: 18px;
		line-height: 1;
		cursor: pointer;
	}
	.remove:hover {
		color: #b42318;
		border-color: #f0c4bd;
	}
	.remove.small {
		width: 22px;
		height: 28px;
		font-size: 16px;
	}
</style>
