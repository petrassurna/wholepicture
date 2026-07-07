<script lang="ts">
	import H1 from '$lib/components/H1.svelte';
	import ArticleBody from '$lib/components/ArticleBody.svelte';

	let { data } = $props();
	const a = $derived(data.article);

	const fmtDate = (iso: string) =>
		new Date(iso).toLocaleDateString('en-AU', { year: 'numeric', month: 'long', day: 'numeric' });

	const jsonLd = $derived(
		JSON.stringify({
			'@context': 'https://schema.org',
			'@type': 'Article',
			headline: a.title,
			description: a.description,
			datePublished: a.date,
			dateModified: a.date,
			author: { '@type': 'Organization', name: 'Whole Picture' },
			publisher: { '@type': 'Organization', name: 'Whole Picture' }
		})
	);
</script>

<svelte:head>
	<title>{a.title} — Whole Picture</title>
	<meta name="description" content={a.description} />
	<meta name="keywords" content={a.keywords} />
	<meta property="og:type" content="article" />
	<meta property="og:title" content={a.title} />
	<meta property="og:description" content={a.description} />
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html `<script type="application/ld+json">${jsonLd}<` + '/script>'}
</svelte:head>

<section class="article">
	<div class="container container-narrow">
		<a class="back-link" href="/blog">← All guides</a>
		<H1 text={a.title} />
		<p class="article-meta">{fmtDate(a.date)} · {a.readingMins} min read</p>
		<p class="article-intro">{a.intro}</p>

		<ArticleBody blocks={a.body} />

		<div class="article-cta">
			<p>See how it plays out for your own numbers.</p>
			<a class="btn btn-primary" href="/model">Model your plan</a>
		</div>

		<p class="article-disclaimer">
			<strong>General information only.</strong> This article explains how the rules generally work in
			Australia. It is not financial advice and does not take your personal circumstances into account.
			Figures are examples current around the date shown and change over time. For your own situation,
			check Services Australia and moneysmart.gov.au, or speak to a licensed financial adviser.
		</p>
	</div>
</section>
