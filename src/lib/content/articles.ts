// Blog content. Plain, factual, education-only articles — they explain how the
// rules work and never tell a reader what to do, so the site stays on the safe
// side of the line between general information and financial advice.
//
// Content is authored here (not user input). Paragraphs support a tiny inline
// syntax: **bold** and [text](/link). The standard "general information only"
// disclaimer is appended to every article by the page, so it can't be forgotten.

export type Block =
	| { t: 'p'; text: string }
	| { t: 'h2'; text: string }
	| { t: 'ul'; items: string[] };

export interface Article {
	slug: string;
	title: string;
	description: string; // meta description — write it for the search snippet
	keywords: string;
	date: string; // ISO, last reviewed
	readingMins: number;
	intro: string; // lead paragraph
	body: Block[];
}

export const articles: Article[] = [
	{
		slug: 'age-pension-assets-test',
		title: 'How the Age Pension assets test works',
		description:
			'A plain-English guide to the Australian Age Pension assets test: the thresholds, the taper, what counts and what is exempt. General information, not advice.',
		keywords:
			'age pension assets test, centrelink assets test, how much can you have and still get the pension, age pension cut off point, assets test taper',
		date: '2026-03-18',
		readingMins: 5,
		intro:
			'The Age Pension is means-tested, and for most retirees with savings it is the assets test that does the work. Here is how that test actually decides your payment.',
		body: [
			{ t: 'p', text: 'To get the Age Pension you have to be 67 or older and meet a residence rule. After that, Centrelink runs two tests — an assets test and an income test — and pays you whichever one produces the **lower** amount. For people with a decent super balance, that is almost always the assets test, so it is the one worth understanding first.' },
			{ t: 'h2', text: 'The free area, then the taper' },
			{ t: 'p', text: 'Below a certain level of assets you get the full pension. Above it, your payment drops by **$3 a fortnight for every $1,000** of assets over the line — that is $78 a year per $1,000. Keep adding assets and the payment tapers all the way to zero.' },
			{ t: 'p', text: 'The starting line depends on whether you own your home and whether you are single or a couple. As at 2024–25, for a homeowner the full pension cuts out below:' },
			{ t: 'ul', items: [
				'Single homeowner: $314,000 in assessable assets',
				'Couple homeowner (combined): $470,000'
			] },
			{ t: 'p', text: 'Non-homeowners get a higher free area — $566,000 single and $722,000 for a couple — because they do not have a house sheltering part of their wealth.' },
			{ t: 'p', text: 'The payment reaches zero once assessable assets pass roughly **$695,500** for a single homeowner and **$1,045,500** for a homeowning couple. Those cut-off figures move each year, so treat them as a guide rather than a hard number.' },
			{ t: 'h2', text: 'What counts, and what does not' },
			{ t: 'p', text: 'The big exemption is the one people miss: your **family home does not count** in the assets test. What does count is essentially everything else you own — super, bank accounts and term deposits, shares, investment properties, and the market value of your car, boat and household contents (second-hand value, not what you paid).' },
			{ t: 'ul', items: [
				'Counts: super, cash, shares, managed funds, investment property, contents, vehicles',
				'Exempt: the home you live in'
			] },
			{ t: 'h2', text: 'Why it rises as your savings fall' },
			{ t: 'p', text: 'Because the test is tied to how much you hold, the pension is not a fixed amount for life. As a retiree spends down their super, their assessable assets fall, they cross back under the taper, and the pension grows to fill part of the gap. Someone who starts fully self-funded can end up on a part pension, and then a full one. That is the feature that stops many retirement plans from simply hitting zero.' },
			{ t: 'h2', text: 'The numbers change every year' },
			{ t: 'p', text: 'Thresholds and the maximum rate are indexed and adjusted in March and September, and the income test can override the result in some situations. The current figures live on the Services Australia website, and the government’s Moneysmart site has calculators if you want to check your own position. You can also model how the pension phases in over time with the [projection tool](/model).' }
		]
	},
	{
		slug: 'sequence-of-returns-risk',
		title: 'What is sequence of returns risk?',
		description:
			'Why the order of investment returns matters most in your first years of retirement — sequence of returns risk explained with a simple example. General information.',
		keywords:
			'sequence of returns risk, sequencing risk retirement, market crash early retirement, order of returns matters, drawdown risk',
		date: '2026-04-22',
		readingMins: 4,
		intro:
			'Two people can earn the exact same average return over retirement and end up in very different places. The reason is sequence of returns risk — the order the returns arrive in.',
		body: [
			{ t: 'p', text: 'While you are still working and adding to super, the order of your returns barely matters. A crash early on is almost a gift — you are buying in cheaply, and there is time for it to recover before you need the money. Retirement flips that logic on its head.' },
			{ t: 'h2', text: 'Why the order suddenly matters' },
			{ t: 'p', text: 'Once you retire you stop adding money and start taking it out. Now a bad year early on does lasting damage, because you are **selling** to fund your spending while prices are down. Every dollar you draw in a slump is a dollar that is not there to recover when the market bounces back. The pot never gets the chance to heal.' },
			{ t: 'p', text: 'This is sequence of returns risk: the same set of yearly returns, delivered in a different order, produces a different outcome — sometimes a dramatically different one — purely because of when you were withdrawing.' },
			{ t: 'h2', text: 'A quick example' },
			{ t: 'p', text: 'Imagine two retirees who both average 5% a year over their first decade and both draw the same income. The only difference is timing. One has a rough first few years and a strong finish; the other has the good years first and the bad years later. The one who copped the losses early — while drawing down into them — runs out noticeably sooner, even though the long-run average was identical. The average was a mirage; the path was what counted.' },
			{ t: 'h2', text: 'How people think about it' },
			{ t: 'p', text: 'There is no way to remove the risk, because nobody knows the order of returns in advance. Common approaches you will hear discussed include holding a couple of years of spending in cash so you are not forced to sell shares in a downturn, keeping some flexibility in spending so you can ease off in bad years, and simply being aware that the years right around retirement carry outsized weight.' },
			{ t: 'p', text: 'Whether any of that suits you is a personal question — but the mechanism is worth seeing for yourself. The [projection tool](/model) includes a bad-case scenario that applies a downturn right at the start of retirement, so you can watch how an early shock changes how long the money lasts.' }
		]
	},
	{
		slug: 'is-your-super-taxed-in-retirement',
		title: 'Is your super taxed in retirement?',
		description:
			'How superannuation is taxed once you retire — the pension phase, the age-60 rule, and how it differs from money held outside super. General information, not advice.',
		keywords:
			'is super taxed in retirement, superannuation pension phase tax, tax on super withdrawals over 60, super earnings tax retirement, tax free super',
		date: '2026-05-14',
		readingMins: 4,
		intro:
			'Super is taxed very differently before and after you retire. For most people over 60 drawing an income stream, the answer surprises them: it is largely tax-free.',
		body: [
			{ t: 'p', text: 'Superannuation has two phases, and they are taxed in almost opposite ways. Knowing which phase you are in explains most of the confusion.' },
			{ t: 'h2', text: 'Accumulation phase: taxed, but lightly' },
			{ t: 'p', text: 'While you are working and your super is growing, it sits in the **accumulation phase**. Earnings inside the fund are taxed at 15%, which is lower than most people’s marginal rate — that concession is the whole point of super. Contributions are generally taxed at 15% going in as well.' },
			{ t: 'h2', text: 'Pension phase: the tax mostly disappears' },
			{ t: 'p', text: 'When you retire and move your super into an account-based pension to draw an income, it shifts to the **retirement (pension) phase**. Two things change:' },
			{ t: 'ul', items: [
				'Earnings inside the fund are no longer taxed at 15% — the rate drops to 0%.',
				'For anyone aged 60 or over, the income and lump sums you withdraw from a taxed fund are tax-free and do not even go on your tax return.'
			] },
			{ t: 'p', text: 'So a 60-plus retiree living off an account-based pension is, in most cases, drawing a **tax-free income** from investments that are themselves **growing tax-free**. That is why retirement calculators treat super pension income differently from other money.' },
			{ t: 'h2', text: 'The catch: the transfer balance cap' },
			{ t: 'p', text: 'There is a limit on how much you can move into the tax-free pension phase — the transfer balance cap, which is $1.9 million as at 2024–25. Anything above the cap stays in accumulation and keeps paying the 15% earnings tax. Most people are comfortably under it.' },
			{ t: 'h2', text: 'Why money outside super is different' },
			{ t: 'p', text: 'This tax treatment applies to money **inside** super. Savings held elsewhere — a bank account, a term deposit, shares in your own name — do not get the same deal. Interest and other earnings on them are assessable income, taxed at your marginal rate, though retiree offsets like the Seniors and Pensioners Tax Offset mean many people still pay little or nothing on modest amounts. It is one reason the mix of where your money sits can matter as much as how much you have.' },
			{ t: 'p', text: 'A couple of caveats: this describes a **taxed** fund, which covers the large majority of people; some older public-sector (untaxed) funds work differently, and the rules assume you are 60 or over. The [projection tool](/model) models super pension income as tax-free and taxes bank interest at your rate, so you can see the difference the split makes.' }
		]
	},
	{
		slug: 'retirement-calculator-how-it-works',
		title: 'A retirement calculator you can actually use in two minutes',
		description:
			'A free Australian retirement projection tool that shows how long your money could last — no signup, no wall of forms. Here is how it works and what it models.',
		keywords:
			'australian retirement calculator, how long will my super last, retirement drawdown calculator, free retirement projection tool, superannuation calculator',
		date: '2026-06-30',
		readingMins: 3,
		intro:
			'Most retirement calculators make you fill in a long form before they show you anything. This one does it the other way around: you land on a working projection and just correct the numbers that are yours.',
		body: [
			{ t: 'p', text: 'The question behind all of this is simple to ask and annoying to answer: **will my money last, and for how long?** Whole Picture is a free tool that tries to answer it in a couple of minutes, without an account and without homework.' },
			{ t: 'h2', text: 'You start with a chart, not a blank form' },
			{ t: 'p', text: 'Open it and there is already a projection on the screen, built from sensible Australian defaults. The graph sits at the top and stays there. Everything else — your super balance, your spending, your age — is arranged around it as numbers you can change. There is no empty form to stare at and no signup gate before you see a result.' },
			{ t: 'h2', text: 'Change a number, watch the line move' },
			{ t: 'p', text: 'Every edit updates the chart straight away. Drag your super balance up, or your spending down, and the line showing how long the money lasts moves with it. That is the whole loop: adjust, look, adjust again. You are exploring, not filling in a tax return.' },
			{ t: 'h2', text: 'What it takes into account' },
			{ t: 'p', text: 'Under the hood it does more than a single-number calculator. It handles:' },
			{ t: 'ul', items: [
				'Super, plus bank accounts and term deposits at their own rates',
				'A spending breakdown you can build line by line, or a single figure',
				'Part-time work, rent or other income, including whether it rises with inflation',
				'Tax — super pension income is tax-free; bank interest is taxed at your rate, with the senior offsets applied',
				'The Age Pension phasing in as your savings fall',
				'A bad-case scenario with a market downturn right at retirement, so you can see sequence risk'
			] },
			{ t: 'p', text: 'All the figures are in **today’s dollars**, so a projected balance means what it would be worth to you now, not an inflated future number. Spending and income keep pace with inflation automatically.' },
			{ t: 'h2', text: 'It shows, it does not tell' },
			{ t: 'p', text: 'One deliberate limit: the tool never tells you what to do. It will not say switch to this fund or spend less or retire later. You pull a lever, it shows the consequence, and the decision stays with you. That is on purpose — it keeps the tool honest, and it keeps it firmly on the information side of the line, not the advice side.' },
			{ t: 'p', text: 'The fastest way to understand it is to open it and change one number. [Model your plan](/model) and see how long your money lasts.' }
		]
	}
];

export function getArticle(slug: string): Article | undefined {
	return articles.find((a) => a.slug === slug);
}
