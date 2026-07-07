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
			assumptions below. It is <strong>general information and illustration only — not financial
				advice</strong>, and it does not consider your personal circumstances. Here is exactly what it
			assumes and what it does not model, so you can judge the results for yourself.
		</p>

		<H2 text="Everything is in today's dollars" />
		<p>
			Balances, spending and income are all shown in today's money (real terms), so every figure stays
			comparable to what money is worth now — no inflated future numbers.
		</p>
		<ul>
			<li>Investment returns are applied after inflation. A 7% return with 2.5% inflation shows as about 4.4% real growth.</li>
			<li>Spending is held flat in real terms: it keeps the same lifestyle each year, which means it rises with inflation in dollar terms.</li>
			<li>Income you mark as rising with inflation stays flat in real terms; a fixed amount slowly loses buying power.</li>
		</ul>

		<H2 text="Tax" />
		<ul>
			<li>Super pension income from age 60, and super fund earnings in the pension phase, are treated as tax-free.</li>
			<li>Bank and term-deposit interest is taxed at your marginal rate, with the Seniors and Pensioners Tax Offset (SAPTO), the Low Income Tax Offset and the Medicare levy applied.</li>
			<li>Couples are assessed as two individuals, splitting assessable income 50/50.</li>
			<li>Tax rates use the {taxYear} resident scale. Rates change each year and are treated as an estimate; per-item deductions and every individual circumstance are not modelled.</li>
		</ul>

		<H2 text="Age Pension" />
		<p>
			The Age Pension figure is a <strong>rough estimate, not a Centrelink quote.</strong> Pension rates and
			thresholds change several times a year, so treat it with caution and confirm your actual entitlement.
		</p>
		<ul>
			<li>Estimated using the <strong>assets test only</strong>, with rates as at {pensionAsAt}.</li>
			<li>Assumes you own your home — your home is exempt from the assets test and is not counted.</li>
			<li>The income test, deeming, and non-homeowner rules are not modelled and could change the result.</li>
			<li>Confirm your position with <a href="https://www.servicesaustralia.gov.au/age-pension" target="_blank" rel="noopener">Services Australia</a>.</li>
		</ul>

		<H2 text="Super contributions (before retirement)" />
		<ul>
			<li>If you are still working, contributions are modelled as a percentage of salary — the employer contribution (SG) plus any salary sacrifice — less the 15% contributions tax.</li>
			<li>Super fund earnings during the working (accumulation) years are taxed at 15%.</li>
			<li>The concessional contributions cap is not enforced.</li>
		</ul>

		<H2 text="Drawing down your super — an important limitation" />
		<p>
			By law you must withdraw a minimum amount from an account-based pension each year — around 5% of
			the balance at ages 65–74, rising with age (up to 14% from 95). It's a floor, not a limit: you can
			always take more.
		</p>
		<ul>
			<li>
				<strong>The minimum may be more than you spend.</strong> If your budget is below the required minimum,
				the law still forces you to withdraw the difference — though you can simply save or reinvest that
				surplus outside super.
			</li>
			<li>
				<strong>This tool does not enforce the minimum.</strong> It withdraws only what your budget needs
				and leaves the rest growing inside super. So the figures can differ from real life — especially for
				a <em>large balance with modest spending</em> — because in reality the forced-out money would sit
				in a taxable account (earning taxable interest) rather than tax-free inside super.
			</li>
			<li>
				The effect is a small tax difference that nudges your <em>final</em> balance, not whether the money
				lasts. But it does mean these figures are an estimate, and there may be differences here.
			</li>
		</ul>

		<H2 text="Investment returns and the bad case" />
		<ul>
			<li>A single long-run average return that you set, the same each year.</li>
			<li>The bad case applies a one-off market downturn right at retirement, then a recovery over a few years — to show sequence-of-returns risk (an early loss while you are drawing down does lasting damage).</li>
			<li>Inflation is a single rate applied to everything; real-world costs like health and aged care can rise faster than general inflation.</li>
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
			Whole Picture provides general information and illustrative projections only. It does not take your
			personal circumstances into account and is not financial product advice. Figures — especially tax
			and Age Pension rates — change over time and may be out of date. Before making financial decisions,
			consider advice from a licensed financial adviser and check government sources:
			<a href="https://moneysmart.gov.au" target="_blank" rel="noopener">moneysmart.gov.au</a>,
			<a href="https://www.servicesaustralia.gov.au" target="_blank" rel="noopener">servicesaustralia.gov.au</a>
			and <a href="https://www.ato.gov.au" target="_blank" rel="noopener">ato.gov.au</a>.
		</p>
	</div>
</section>
