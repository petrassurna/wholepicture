<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { plan } from '$lib/state/plan.svelte';
	import { dev } from '$app/environment';
	import { injectAnalytics } from '@vercel/analytics/sveltekit';
	import { feedbackMailto } from '$lib/config';
	import { trackEvent } from '$lib/analytics';
	import { onMount } from 'svelte';
	import DevDisclaimer from '$lib/components/DevDisclaimer.svelte';

	// Page views. `development` mode keeps local traffic out of production numbers.
	injectAnalytics({ mode: dev ? 'development' : 'production' });

	let { children } = $props();

	// Restore saved values after hydration, then auto-save on every change.
	onMount(() => plan.load());
	$effect(() => plan.save());
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<meta property="og:site_name" content="Whole Picture" />
	<meta property="og:type" content="website" />
	<meta name="twitter:card" content="summary" />
</svelte:head>

<DevDisclaimer />

<nav class="nav">
	<a class="brand" href="/">Whole<span>Picture</span></a>
	<div class="links">
		<a href="/#why">Why</a>
		<a href="/#how">How it works</a>
		<a href="/blog">Guides</a>
		<a class="btn btn-outline" href="/model">Try it</a>
	</div>
</nav>

{@render children()}

<footer class="disclaimer">
	<div class="foot-links">
		<a href="/assumptions">How it works & assumptions</a>
		<a href={feedbackMailto} onclick={() => trackEvent('feedback_clicked', { where: 'footer' })}
			>Feedback</a
		>
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
