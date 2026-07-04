<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<meta property="og:site_name" content="Whole Picture" />
	<meta property="og:type" content="website" />
	<meta name="twitter:card" content="summary" />
</svelte:head>

<nav class="nav">
	<a class="brand" href="/">Whole<span>Picture</span></a>
	<div class="links">
		<a href="/#why">Why</a>
		<a href="/#how">How it works</a>
		<a class="btn btn-outline" href="/signin">Sign in</a>
	</div>
</nav>

{@render children()}

<footer class="disclaimer">
	<div class="foot-links">
		<a href="/terms">Terms of Service</a>
		<a href="/privacy">Privacy Policy</a>
	</div>
	<p>
		Whole Picture is an educational modelling and projection tool for general information only. It
		does not provide financial advice, recommendations or personal financial product advice.
		Projections are based on the assumptions and information you enter and do not predict future
		investment returns or outcomes. Consider obtaining advice from a licensed financial adviser
		before making financial decisions.
	</p>
	<p class="copyright">© 2025 Whole Picture</p>
</footer>
