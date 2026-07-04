<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Whole Picture — model it before you live it</title>
</svelte:head>

<nav class="nav">
	<a class="brand" href="/">Whole<span>Picture</span></a>
	<div class="links">
		<a href="/#why">Why</a>
		<a href="/#how">How it works</a>
		<a class="btn btn-outline" href="/#start">Sign in</a>
	</div>
</nav>

{@render children()}

<footer class="disclaimer">
	<div class="foot-links">
		<a href="/terms">Terms of Service</a>
		<a href="/privacy">Privacy Policy</a>
	</div>
	<p>
		<strong>Whole Picture is a modelling and projection tool for your own information.</strong>
		It is not financial advice, does not recommend any product or tell you what to do, and is not a
		substitute for a licensed financial adviser.
	</p>
	<p class="copyright">© 2025 Whole Picture</p>
</footer>
