import { error } from '@sveltejs/kit';
import { articles, getArticle } from '$lib/content/articles';
import type { PageLoad, EntryGenerator } from './$types';

export const prerender = true;

// Prerender one static page per article.
export const entries: EntryGenerator = () => articles.map((a) => ({ slug: a.slug }));

export const load: PageLoad = ({ params }) => {
	const article = getArticle(params.slug);
	if (!article) error(404, 'Article not found');
	return { article };
};
