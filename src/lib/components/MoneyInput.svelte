<script lang="ts">
	// Text input that shows a number with thousands separators, live as you type,
	// and keeps the caret in the right place. Binds a plain number.
	let {
		value = $bindable(0),
		id,
		placeholder
	}: { value?: number; id?: string; placeholder?: string } = $props();

	let el: HTMLInputElement | undefined = $state();

	const format = (n: number) => (n ? n.toLocaleString('en-AU') : '');
	const parse = (s: string) => {
		const d = s.replace(/\D/g, '');
		return d ? parseInt(d, 10) : 0;
	};

	// Sync the field when `value` changes from outside (e.g. a household preset reset).
	// After typing, parse(el.value) already equals value, so this is a no-op — no caret fight.
	$effect(() => {
		if (el && parse(el.value) !== value) {
			el.value = format(value);
		}
	});

	function onInput(e: Event & { currentTarget: HTMLInputElement }) {
		const input = e.currentTarget;
		const caret = input.selectionStart ?? input.value.length;
		const digitsLeft = input.value.slice(0, caret).replace(/\D/g, '').length;

		const num = parse(input.value);
		value = num;

		const formatted = format(num);
		input.value = formatted;

		// Restore the caret after the same number of digits.
		let pos = 0;
		let seen = 0;
		while (pos < formatted.length && seen < digitsLeft) {
			if (/\d/.test(formatted[pos])) seen++;
			pos++;
		}
		input.setSelectionRange(pos, pos);
	}
</script>

<input {id} bind:this={el} type="text" inputmode="numeric" {placeholder} oninput={onInput} />
