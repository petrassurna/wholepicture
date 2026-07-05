<script lang="ts">
	let { text }: { text: string } = $props();
</script>

<span class="help">
	<span class="help-badge" tabindex="0" role="button" aria-label="More information">?</span>
	<span class="help-tip" role="tooltip">{text}</span>
</span>
