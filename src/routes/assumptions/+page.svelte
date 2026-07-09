<script lang="ts">
	import H1 from '$lib/components/H1.svelte';
	import H2 from '$lib/components/H2.svelte';
	import { CURRENT_PENSION } from '$lib/domain/pension';
	import { CURRENT as TAX } from '$lib/domain/tax';

	const pensionAsAt = CURRENT_PENSION.asAt;
	const taxYear = TAX.year;
</script>

<svelte:head>
	<title>How it works & assumptions — Whole Picture</title>
	<meta
		name="description"
		content="Exactly what the Whole Picture retirement projection assumes, and what it doesn't model. General information, not financial advice."
	/>
</svelte:head>

<section class="legal">
	<div class="container">
		<H1 text="How it works & assumptions" />
		<p>
			This tool projects how your retirement savings might last, using the numbers you enter and the
			assumptions below. It is <strong
				>general information and illustration only — not financial advice</strong
			>, and it does not consider your personal circumstances. Here is exactly what it assumes and
			what it does not model, so you can judge the results for yourself.
		</p>

		<H2 text="Everything is in today's dollars" />
		<p>
			Balances, spending and income are all shown in today's money (real terms), so every figure
			stays comparable to what money is worth now — no inflated future numbers.
		</p>
		<ul>
			<li>
				Investment returns are applied after inflation. An 8% return with 3% inflation shows as
				about 4.9% real growth.
			</li>
			<li>
				Spending is held flat in real terms: it keeps the same lifestyle each year, which means it
				rises with inflation in dollar terms.
			</li>
			<li>
				Income you mark as rising with inflation stays flat in real terms; a fixed amount slowly
				loses buying power.
			</li>
		</ul>

		<H2 text="Tax" />
		<ul>
			<li>
				Super pension income from age 60, and super fund earnings in the pension phase, are treated
				as tax-free.
			</li>
			<li>
				Only super up to the transfer balance cap (about $1.9 million) can sit in the tax-free
				pension phase; the tool treats <em>all</em> your super as tax-free, so it may be optimistic if
				your balance is very large.
			</li>
			<li>
				Bank and investment accounts are taxed each year on their whole return, at your marginal
				rate with the Seniors and Pensioners Tax Offset (SAPTO), the Low Income Tax Offset and the
				Medicare levy applied. This is right for a cash account (all interest) and deliberately
				conservative for a growth investment like an index fund — the whole return is taxed even
				though only its yearly distributions really would be, which keeps it simple and never
				flatters the result. Capital gains tax on sale is not modelled.
			</li>
			<li>
				Couples are assessed as two individuals splitting assessable income 50/50, on <strong
					>one shared timeline</strong
				> — the same ages, retiring together. Different ages, and the survivor case when one partner dies
				(spending drops, and the pension moves to the single rate), are not modelled.
			</li>
			<li>
				Tax rates use the {taxYear} resident scale. Rates change each year and are treated as an estimate;
				per-item deductions and every individual circumstance are not modelled.
			</li>
		</ul>

		<H2 text="Age Pension" />
		<p>
			The Age Pension figure is a <strong>rough estimate, not a Centrelink quote.</strong> Pension rates
			and thresholds change several times a year, so treat it with caution and confirm your actual entitlement.
		</p>
		<ul>
			<li>
				Estimated using <strong
					>both means tests — the assets test and the income test — paying the lower</strong
				>, as Centrelink does. Rates as at {pensionAsAt}.
			</li>
			<li>
				The income test counts <strong>deemed</strong> income on your financial assets (an assumed
				return set by the government, not your actual one) plus any income you earn, such as wages
				or rent. So working or renting-out in retirement <strong>does</strong> reduce the estimate here.
			</li>
			<li>
				Assumes you own your home — your home is exempt from the assets test and is not counted.
			</li>
			<li>
				The <strong>Work Bonus</strong> (which exempts the first ~$300/fortnight of employment
				income) and non-homeowner rules are not modelled — so for a working retiree the estimate is
				<strong>conservative</strong> (it never overstates the pension).
			</li>
			<li>
				Confirm your position with <a
					href="https://www.servicesaustralia.gov.au/age-pension"
					target="_blank"
					rel="noopener">Services Australia</a
				>.
			</li>
		</ul>

		<H2 text="Super contributions (before retirement)" />
		<ul>
			<li>
				If you are still working, super contributions are the employer SG (a percentage of salary)
				plus any salary sacrifice (a dollar amount), each taxed 15% going in.
			</li>
			<li>
				The <strong>take-home pay</strong> shown under your salary applies PAYG tax on the {taxYear} resident
				scale — marginal rates, the Low Income Tax Offset and the 2% Medicare levy — but
				<em>not</em> the Seniors and Pensioners Tax Offset, which working-age earners can't claim. It's
				a guide only: salary sacrifice, HELP/HECS repayments and the Medicare Levy Surcharge are not deducted
				from it.
			</li>
			<li>
				Salary sacrifice is capped at the $30,000 concessional limit, which <em>includes</em> the SG —
				so the most that can be sacrificed is $30,000 minus the SG. Amounts above the cap are ignored
				(in reality they'd be taxed at your marginal rate).
			</li>
			<li>Super fund earnings during the working (accumulation) years are taxed at 15%.</li>
			<li>
				After-tax (non-concessional) contributions and the downsizer contribution are not modelled.
			</li>
		</ul>

		<H2 text="Drawing down your super" />
		<p>
			Your spending is funded from <strong>super first</strong> — any bank or investment accounts are
			left to grow and are only drawn on once super is exhausted. By law you must also withdraw a minimum
			from an account-based pension each year — around 5% of the balance at ages 65–74, rising with age
			(up to 14% from 95). It's a floor, not a limit.
		</p>
		<ul>
			<li>
				<strong>The tool enforces that minimum.</strong> Each year super pays out the greater of what
				your budget needs and the required minimum.
			</li>
			<li>
				<strong>The minimum may be more than you spend</strong> — most often with a large balance
				and modest spending, or when other income already covers your budget. When it is, the
				surplus is withdrawn from super and put into a
				<strong>&ldquo;set aside&rdquo; bucket</strong>
				(visible on the chart's
				<em>Set aside</em> view and in <em>Show calculations</em>).
			</li>
			<li>
				<strong>That bucket is a deliberate simplification.</strong> It's treated as cash that earns
				no return and is <em>not</em> spent later — so your invested balance runs down as if it weren't
				there. In real life you'd reinvest it (in a taxable account) and could draw on it. This is conservative
				— it never flatters the projection — and a fuller treatment is planned for a later version.
			</li>
			<li>
				A plain income surplus (income above spending, before any forced drawdown) is likewise not
				saved.
			</li>
			<li>
				The tool doesn't enforce super <strong>preservation rules</strong> — you generally can't access
				super before about age 60, but it won't stop you setting an earlier retirement age.
			</li>
		</ul>

		<H2 text="Investment returns and the bad case" />
		<ul>
			<li>A single long-run average return that you set, the same each year — entered before fees.</li>
			<li>
				<strong>Super fees are a separate input</strong> (default 0.85% a year, covering admin plus
				investment fees) and are subtracted from your super return, matching how Moneysmart treats
				fees. The default 8% return less 0.85% fees, then the 15% earnings tax while you are working,
				gives about 6.1% — the same net figure Moneysmart quotes for a balanced option. (Bank and
				investment accounts have no separate fees field, so enter their return net of fees.)
			</li>
			<li>
				The bad case applies a one-off market downturn right at retirement, then a recovery over a
				few years — to show sequence-of-returns risk (an early loss while you are drawing down does
				lasting damage).
			</li>
			<li>
				The bad case is a <strong>single illustrative stress test you set</strong>, not a
				statistical worst case or a probability — real outcomes could be milder, or considerably
				worse.
			</li>
			<li>
				Inflation is a single rate applied to everything; real-world costs like health and aged care
				can rise faster than general inflation.
			</li>
		</ul>

		<H2 text="What's not modelled (yet)" />
		<ul>
			<li>Property, shares, and assets beyond super and cash.</li>
			<li>The Age Pension income test and deeming; non-homeowner rules.</li>
			<li>The minimum super drawdown rule (see above) and super death-benefits tax.</li>
			<li>Aged care, life events, and changes in your circumstances over time.</li>
		</ul>

		<H2 text="Not financial advice" />
		<p>
			Whole Picture provides general information and illustrative projections only. It does not take
			your personal circumstances into account and is not financial product advice. Figures —
			especially tax and Age Pension rates — change over time and may be out of date. Before making
			financial decisions, consider advice from a licensed financial adviser and check government
			sources:
			<a href="https://moneysmart.gov.au" target="_blank" rel="noopener">moneysmart.gov.au</a>,
			<a href="https://www.servicesaustralia.gov.au" target="_blank" rel="noopener"
				>servicesaustralia.gov.au</a
			>
			and <a href="https://www.ato.gov.au" target="_blank" rel="noopener">ato.gov.au</a>.
		</p>
	</div>
</section>
