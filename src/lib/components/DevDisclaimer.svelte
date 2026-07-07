<script lang="ts">
	// A work-in-progress warning shown once per browser session on the home page.
	let open = $state(false);
	const KEY = 'wholepicture.disclaimer.ack';

	$effect(() => {
		// Client-only ($effect never runs on the server), so no hydration flash.
		try {
			if (sessionStorage.getItem(KEY) !== '1') open = true;
		} catch {
			open = true;
		}
	});

	function dismiss() {
		open = false;
		try {
			sessionStorage.setItem(KEY, '1');
		} catch {
			// ignore unavailable storage
		}
	}

	function onKey(e: KeyboardEvent) {
		if (e.key === 'Escape') dismiss();
	}
</script>

<svelte:window onkeydown={onKey} />

{#if open}
	<div class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="disc-title">
		<div class="modal-card">
			<h2 id="disc-title">⚠️ Work in progress</h2>
			<p>
				Whole Picture is in active development. Its calculations are <strong>unfinished and may be
					wrong or incomplete</strong>.
			</p>
			<p>
				It's for illustration and exploration only — not financial advice, and not something to base
				real decisions on. Always check with a licensed financial adviser.
			</p>
			<button type="button" class="btn btn-primary" onclick={dismiss}>I understand</button>
		</div>
	</div>
{/if}
