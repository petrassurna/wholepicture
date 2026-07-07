<script lang="ts">
	import H1 from '$lib/components/H1.svelte';
	import { articles } from '$lib/content/articles';

	const sorted = [...articles].sort((a, b) => b.date.localeCompare(a.date));
	const fmtDate = (iso: string) =>
		new Date(iso).toLocaleDateString('en-AU', { year: 'numeric', month: 'long', day: 'numeric' });
</script>

<svelte:head>
	<title>Guides — Whole Picture</title>
	<meta
		name="description"
		content="Plain-English guides to retirement in Australia — the Age Pension, super tax, sequence of returns risk and more. General information, not financial advice."
	/>
	<meta property="og:title" content="Retirement guides — Whole Picture" />
	<meta
		property="og:description"
		content="Plain-English guides to retirement in Australia. General information, not financial advice."
	/>
</svelte:head>

<section class="blog">
	<div class="container">
		<div class="blog-head">
			<H1 text="Guides" />
			<p>
				Short, plain-English explainers on how retirement actually works in Australia. Facts and
				mechanics — not advice, and nothing about what you personally should do.
			</p>
		</div>

		<ul class="blog-list">
			{#each sorted as a}
				<li>
					<a class="blog-card" href={`/blog/${a.slug}`}>
						<h2>{a.title}</h2>
						<p class="blog-desc">{a.intro}</p>
						<p class="blog-meta">{fmtDate(a.date)} · {a.readingMins} min read</p>
					</a>
				</li>
			{/each}
		</ul>
	</div>
</section>
