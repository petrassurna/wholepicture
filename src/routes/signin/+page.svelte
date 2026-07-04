<script lang="ts">
	import { enhance } from '$app/forms';
	import H1 from '$lib/components/H1.svelte';

	let { form } = $props();
</script>

<svelte:head>
	<title>Sign in — Whole Picture</title>
</svelte:head>

<div class="auth">
	<form class="auth-card" method="POST" use:enhance>
		<H1 text="Sign in" />
		<p class="sub">Welcome back to Whole Picture.</p>

		{#if form?.error}
			<div class="auth-error">{form.error}</div>
		{/if}

		<div class="field">
			<label for="email">Email</label>
			<input
				id="email"
				name="email"
				type="email"
				autocomplete="username"
				value={form?.email ?? ''}
				required
			/>
		</div>
		<div class="field">
			<label for="password">Password</label>
			<input id="password" name="password" type="password" autocomplete="current-password" required />
		</div>

		<button class="btn btn-primary" type="submit">Sign in</button>

		<p class="auth-note">Prototype login — real accounts coming soon.</p>
	</form>
</div>
