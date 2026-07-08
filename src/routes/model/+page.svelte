<script lang="ts">
	import ProjectionChart from '$lib/components/ProjectionChart.svelte';
	import Calculations from '$lib/components/Calculations.svelte';
	import Help from '$lib/components/Help.svelte';
	import MoneyInput from '$lib/components/MoneyInput.svelte';
	import RemoveButton from '$lib/components/RemoveButton.svelte';
	import H1 from '$lib/components/H1.svelte';
	import { plan, FREQ, FREQ_OPTIONS } from '$lib/state/plan.svelte';
	import { CURRENT_PENSION } from '$lib/domain/pension';
	import { trackEngaged, trackEvent } from '$lib/analytics';

	// Independent collapsible sections — scales to any number of categories.
	let open = $state({
		you: true,
		spend: false,
		sup: false,
		bank: false,
		income: false,
		assumptions: false
	});

	const pct = (r: number) => Math.round(r * 1000) / 10; // 0.07 -> 7
	const money = (n: number) => '$' + Math.round(n).toLocaleString('en-AU');
	// For a couple, dollar amounts are the combined total for both partners.
	const couple = $derived(plan.household === 'couple');
</script>

<svelte:head>
	<title>Model your plan — Whole Picture</title>
</svelte:head>

<section class="model">
	<div class="container">
		<div class="model-head">
			<div>
				<H1 text="Model your plan" />
				<p>Adjust your numbers and assumptions — the projection updates as you go.</p>
			</div>
			<button type="button" class="reset-btn" onclick={() => plan.reset()}>Reset all values</button>
		</div>
	</div>

	<div class="container model-grid">
		<!-- Chart stays visible at all times -->
		<div class="model-chart">
			<div class="chart-card">
				<ProjectionChart />
				<p class="chart-note">
					In today's dollars <Help
						text="Every figure is shown in today's money — what it's worth to you now, not an inflated future amount. Spending stays flat because it's already in today's dollars, and returns are shown after inflation: 7% growth with 2.5% inflation appears as about 4.4%. So a $52,200 budget buys the same lifestyle each year even as prices rise."
					/> · illustrative only; actual returns, tax and future spending will differ.
					<a href="/assumptions">Assumptions</a>.
				</p>
			</div>
			<Calculations />
		</div>

		<!-- Inputs: collapsible sections -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="model-inputs" oninput={trackEngaged} onchange={trackEngaged}>
			<!-- YOU -->
			<section class="acc">
				<button class="acc-head" aria-expanded={open.you} onclick={() => (open.you = !open.you)}>
					<span>You</span>
					<span class="acc-chev" class:open={open.you}>›</span>
				</button>
				{#if open.you}
					<div class="acc-body">
						<div class="field">
							<div class="field-head">
								<label for="household">Household</label>
								<Help
									text="Single or a couple. A couple is taxed as two people — two tax-free thresholds and two seniors offsets — so the same taxable income is usually taxed less. Assessable income is split 50/50 between partners."
								/>
							</div>
							<select
								id="household"
								value={plan.household}
								onchange={(e) => plan.setHousehold(e.currentTarget.value as 'single' | 'couple')}
							>
								<option value="single">Single</option>
								<option value="couple">Couple</option>
							</select>
						</div>
						{#if couple}
							<p class="field-note">
								Enter <strong>combined</strong> totals for both partners — super, savings, income and
								spending — not just one person's.
							</p>
						{/if}
						<div class="field">
							<div class="field-head">
								<label for="agenow">Age now</label>
								<Help
									text="Your current age. If it's below your retirement age, the projection runs an accumulation phase first — your super keeps growing and any salary contributions (set in the Superannuation section) are added, until you retire and start drawing. Leave it equal to your retirement age if you're retiring now."
								/>
							</div>
							<input id="agenow" type="number" min="18" max="80" bind:value={plan.currentAge} />
						</div>
						<div class="field">
							<div class="field-head">
								<label for="retire">Retirement age</label>
								<Help
									text="The age you stop working and start drawing on your savings. Default 67 is the Age Pension age in Australia — you can access super earlier, but most people retire around here."
								/>
							</div>
							<input id="retire" type="number" min="40" max="80" bind:value={plan.retireAge} />
						</div>
						<div class="field">
							<div class="field-head">
								<label for="planto">Live until age</label>
								<Help
									text="The age your money needs to last to — in effect, your assumed age at death. Plan a bit beyond your life expectancy so you don't run out early: a 67-year-old today can expect to reach their mid-80s, and many live well into their 90s, so 90 is a sensible default."
								/>
							</div>
							<input id="planto" type="number" min="70" max="110" bind:value={plan.planToAge} />
						</div>
						<label class="check">
							<input type="checkbox" bind:checked={plan.includePension} />
							<span>Include Age Pension</span>
							<Help
								text="Adds the means-tested Age Pension (tax-free, from age 67) as it phases in — a stabiliser that rises as your savings fall, so many retirees glide onto a part or full pension rather than running out. v1 models the assets test only and assumes you own your home (the home is exempt). The income test and non-homeowner rules aren't modelled yet."
							/>
						</label>
						{#if plan.includePension}
							<p class="warn-note">
								⚠ <strong>Age Pension is a rough estimate only.</strong> It uses published rates as
								at
								{CURRENT_PENSION.asAt}, which change several times a year, and it models the assets
								test only (not the income test or your full circumstances). Do not rely on it —
								confirm your actual entitlement with
								<a
									href="https://www.servicesaustralia.gov.au/age-pension"
									target="_blank"
									rel="noopener">Services Australia</a
								> or a licensed adviser.
							</p>
						{/if}
					</div>
				{/if}
			</section>

			<!-- SUPERANNUATION -->
			<section class="acc">
				<button class="acc-head" aria-expanded={open.sup} onclick={() => (open.sup = !open.sup)}>
					<span>Superannuation</span>
					<span class="acc-chev" class:open={open.sup}>›</span>
				</button>
				{#if open.sup}
					<div class="acc-body">
						<div class="field">
							<div class="field-head">
								<label for="super"
									>{couple
										? 'Current combined super balance ($)'
										: 'Current super balance ($)'}</label
								>
								<Help
									text="Your superannuation balance today — the main pot most people draw on in retirement. Cash savings (which earn a different rate) can be added separately later."
								/>
							</div>
							<MoneyInput id="super" bind:value={plan.superBalance} />
						</div>
						<div class="field">
							<div class="field-head">
								<label for="ret">Super return (% p.a.)</label>
								<Help
									text="The long-run average return on your super, before inflation. Default 7% is a typical long-term figure for a growth/balanced option; conservative options earn less, so lower it if your super is in a defensive setting."
								/>
							</div>
							<input
								id="ret"
								type="number"
								step="0.1"
								value={pct(plan.superReturn)}
								oninput={(e) => (plan.superReturn = (Number(e.currentTarget.value) || 0) / 100)}
							/>
						</div>

						{#if plan.currentAge < plan.retireAge}
							<div class="field">
								<div class="field-head">
									<label for="salary"
										>{couple
											? 'Salary before retirement ($/yr, combined)'
											: 'Salary before retirement ($/yr)'}</label
									>
									<Help
										text="Your (pre-tax) salary while you're still working. It drives the employer super contribution below. The rest of your salary is your living money and isn't modelled. Leave blank if you're already retired."
									/>
								</div>
								<MoneyInput id="salary" bind:value={plan.salary} />
								{#if plan.salary > 0}
									<p class="field-note note-sm">
										Note: after PAYG tax approximately {money(plan.salaryTax)}, you have about
										<strong>{money(plan.salaryTakeHome)}/yr</strong> to spend.
									</p>
								{/if}
							</div>
							<div class="field">
								<div class="field-head">
									<label for="sgpct">Employer Super Guarantee (%)</label>
									<Help
										text="The compulsory employer contribution (Super Guarantee), currently 12% of salary. Raise it only if your employer pays more. Added to super each year (less the 15% contributions tax) until you retire."
									/>
								</div>
								<input
									id="sgpct"
									type="number"
									step="0.5"
									min="0"
									max="100"
									value={pct(plan.sgRate)}
									oninput={(e) => (plan.sgRate = (Number(e.currentTarget.value) || 0) / 100)}
								/>
								{#if plan.sgContribution > 0}
									<p class="field-note note-sm">
										Note: {pct(plan.sgRate)}% of {money(plan.salary)} = <strong
											>{money(plan.sgContribution)}/yr</strong
										>; {money(plan.sgIntoSuper)} lands in super after the 15% contributions tax.
									</p>
								{/if}
							</div>
							<div class="field">
								<div class="field-head">
									<label for="sacrifice"
										>{couple
											? 'Salary sacrifice ($/yr, combined)'
											: 'Salary sacrifice ($/yr)'}</label
									>
									<Help
										text="Extra before-tax salary you choose to put into super, on top of the compulsory employer Super Guarantee. Taxed 15% going in. It counts toward the $30,000 concessional cap, which already includes the Super Guarantee — so the most you can sacrifice is $30,000 minus that."
									/>
								</div>
								<MoneyInput id="sacrifice" bind:value={plan.salarySacrifice} />
									{#if plan.salarySurplus > 0}
										<p class="field-note note-sm">
											Note: your take-home less spending ({money(plan.salaryTakeHome)} − {money(
												plan.spend
											)}) is about <strong>{money(plan.salarySurplus)}/yr</strong>{#if plan.sacrificeRoomLeft > 0} — of that
												<strong>{money(plan.sacrificeRoomLeft)}</strong> could be added as salary sacrifice,
												taking your before-tax super contributions to the $30,000 yearly cap{/if}.
										</p>
									{/if}
							</div>
							{#if plan.sacrificeOverCap}
								<p class="warn-note">
									⚠ Salary sacrifice is capped at the {money(plan.concessionalCap)} concessional limit
									(which includes the {money(Math.round(plan.salary * plan.sgRate))} employer Super Guarantee).
									The model uses {money(plan.salarySacrificeCap)}; the excess would be taxed at your
									marginal rate, not 15%.
								</p>
							{/if}
						{/if}
					</div>
				{/if}
			</section>

			<!-- SPENDING -->
			<section class="acc">
				<button
					class="acc-head"
					aria-expanded={open.spend}
					onclick={() => (open.spend = !open.spend)}
				>
					<span>Spending <em class="acc-sub">{money(plan.spend)}/yr</em></span>
					<span class="acc-chev" class:open={open.spend}>›</span>
				</button>
				{#if open.spend}
					<div class="acc-body">
						{#if plan.spendItems.length === 0}
							<div class="field">
								<div class="field-head">
									<label for="spend"
										>{couple ? 'Combined spend per year ($)' : 'Spend per year ($)'}</label
									>
									<Help
										text="What you spend each year in retirement, in today's dollars. Default $50k is roughly the ASFA 'comfortable' budget for a single person (a couple is ~$73k). Or break it into line items below for a realistic figure."
									/>
								</div>
								<MoneyInput id="spend" bind:value={plan.spendPerYear} />
							</div>
							<p class="field-note">Prefer detail? Add line items and we'll total them for you.</p>
						{:else}
							<div class="spend-list">
								<div class="spend-head">
									<span class="spend-col-name">Item</span>
									<span>Amount</span>
									<span>Every</span>
									<span class="spend-col-total">Yearly</span>
									<span></span>
								</div>
								{#each plan.spendItems as item, i (item)}
									<div class="spend-row">
										<input
											class="spend-name"
											type="text"
											aria-label="Item name"
											placeholder="e.g. Food"
											bind:value={item.name}
										/>
										<input
											class="spend-amt"
											type="number"
											min="0"
											aria-label="Amount"
											bind:value={item.amount}
										/>
										<select class="spend-freq" aria-label="How often" bind:value={item.freq}>
											{#each FREQ_OPTIONS as opt}
												<option value={opt.value}>{opt.label}</option>
											{/each}
										</select>
										<span class="spend-line">{money(item.amount * FREQ[item.freq])}</span>
										<RemoveButton
											small
											label="Remove item"
											onclick={() => plan.removeSpendItem(i)}
										/>
									</div>
								{/each}
								<div class="spend-total">
									<span>Total per year</span>
									<strong>{money(plan.spend)}</strong>
								</div>
							</div>
						{/if}
						<button type="button" class="add-btn" onclick={() => plan.addSpendItem()}>
							+ Add item
						</button>
						<p class="field-note">
							In today's dollars. Assumes you own your home (no rent or mortgage).
						</p>
					</div>
				{/if}
			</section>

			<!-- BANK ACCOUNTS -->
			<section class="acc">
				<button class="acc-head" aria-expanded={open.bank} onclick={() => (open.bank = !open.bank)}>
					<span>Bank/investment accounts</span>
					<span class="acc-chev" class:open={open.bank}>›</span>
				</button>
				{#if open.bank}
					<div class="acc-body">
						<p class="field-note">
							Savings, term deposits and investments (e.g. an index fund), each at its own return.
							<Help
								text="Pooled with your super and drawn down together. Set 'Taxable income' to the part of the return that's taxed each year: for a cash account that's the whole return (all interest); for a growth investment like Vanguard it's just the distribution yield (roughly 2–3%), the rest being untaxed capital growth. Your super isn't taxed. Capital gains tax on sale isn't modelled."
							/>
						</p>
						{#each plan.bankAccounts as account, i (account)}
							<div class="bank-acct">
								<div class="bank-acct-top">
									<input
										class="bank-name"
										type="text"
										aria-label="Account name"
										placeholder="Account name (e.g. Vanguard, term deposit)"
										bind:value={account.name}
									/>
									<RemoveButton label="Remove account" onclick={() => plan.removeBankAccount(i)} />
								</div>
								<div class="bank-fields">
									<div class="field">
										<label for={`bank-amt-${i}`}>Amount ($){couple ? ', combined' : ''}</label>
										<MoneyInput id={`bank-amt-${i}`} bind:value={account.amount} />
									</div>
									<div class="field">
										<label for={`bank-rate-${i}`}>Return (% p.a.)</label>
										<input
											id={`bank-rate-${i}`}
											type="number"
											step="0.1"
											value={pct(account.rate)}
											oninput={(e) => (account.rate = (Number(e.currentTarget.value) || 0) / 100)}
										/>
									</div>
									<div class="field">
										<label for={`bank-tax-${i}`}>Taxable income (% p.a.)</label>
										<input
											id={`bank-tax-${i}`}
											type="number"
											step="0.1"
											value={pct(account.taxableRate)}
											oninput={(e) =>
												(account.taxableRate = (Number(e.currentTarget.value) || 0) / 100)}
										/>
									</div>
								</div>
							</div>
						{/each}
						<button
							type="button"
							class="add-btn"
							onclick={() => {
								plan.addBankAccount();
								trackEvent('added_bank');
							}}>+ Add account</button
						>
					</div>
				{/if}
			</section>

			<!-- INCOME -->
			<section class="acc">
				<button
					class="acc-head"
					aria-expanded={open.income}
					onclick={() => (open.income = !open.income)}
				>
					<span>Income in retirement</span>
					<span class="acc-chev" class:open={open.income}>›</span>
				</button>
				{#if open.income}
					<div class="acc-body">
						<p class="field-note">
							Part-time work, rent, or other. Set the ages it applies.
							<Help
								text="Each income applies over the ages you set and reduces how much you draw from your pot, taxed at your marginal rate (your super pension isn't). To model a salary paying into super while you're still working, use the Superannuation section instead."
							/>
						</p>
						{#each plan.incomeSources as inc, i (inc)}
							<div class="bank-acct">
								<div class="bank-acct-top">
									<div class="field" style="flex: 1">
										<label for={`inc-amt-${i}`}>Amount ($/yr){couple ? ', combined' : ''}</label>
										<MoneyInput id={`inc-amt-${i}`} bind:value={inc.amount} />
									</div>
									<RemoveButton label="Remove income" onclick={() => plan.removeIncome(i)} />
								</div>
								<div class="income-body">
									<div class="bank-fields">
										<div class="field">
											<label for={`inc-from-${i}`}>From age</label>
											<input
												id={`inc-from-${i}`}
												type="number"
												min="40"
												max="110"
												bind:value={inc.fromAge}
											/>
										</div>
										<div class="field">
											<label for={`inc-to-${i}`}>To age</label>
											<input
												id={`inc-to-${i}`}
												type="number"
												min="40"
												max="110"
												bind:value={inc.toAge}
											/>
										</div>
									</div>
									<div class="field">
										<label for={`inc-desc-${i}`}>Description (optional)</label>
										<input
											id={`inc-desc-${i}`}
											type="text"
											placeholder="e.g. Part-time work"
											bind:value={inc.label}
										/>
									</div>
									<label class="check">
										<input type="checkbox" bind:checked={inc.indexed} />
										<span>Increases with inflation</span>
										<Help
											text="Tick if this income rises with inflation (most wages and rents do) — its buying power stays the same. Untick for an amount fixed in dollars (e.g. a level annuity); its real value then shrinks each year."
										/>
									</label>
								</div>
							</div>
						{/each}
						<button
							type="button"
							class="add-btn"
							onclick={() => {
								plan.addIncome();
								trackEvent('added_income');
							}}>+ Add income</button
						>
					</div>
				{/if}
			</section>

			<!-- ASSUMPTIONS -->
			<section class="acc">
				<button
					class="acc-head"
					aria-expanded={open.assumptions}
					onclick={() => (open.assumptions = !open.assumptions)}
				>
					<span>Assumptions</span>
					<span class="acc-chev" class:open={open.assumptions}>›</span>
				</button>
				{#if open.assumptions}
					<div class="acc-body">
						<p class="field-note">
							Tax is worked out for you each year — your super pension isn't taxed.
							<Help
								text="Calculated from your assessable income (the taxable income from your bank/investment accounts plus any taxable income like rent or part-time work) using current resident rates — marginal brackets, SAPTO, LITO and the Medicare levy. Super pension income is tax-free, so it's never taxed. Many retirees pay little or nothing."
							/>
						</p>
						<div class="field">
							<div class="field-head">
								<label for="inf">Inflation (% p.a.)</label>
								<Help
									text="How much prices rise each year. Default 2.5% sits in the middle of the Reserve Bank's 2–3% target band. The chart is shown in today's dollars (your return minus inflation)."
								/>
							</div>
							<input
								id="inf"
								type="number"
								step="0.1"
								value={pct(plan.inflation)}
								oninput={(e) => (plan.inflation = (Number(e.currentTarget.value) || 0) / 100)}
							/>
						</div>
						<div class="field">
							<div class="field-head">
								<label for="dn">Bad-case downturn (%)</label>
								<Help
									text="A one-off market crash right at retirement — used only for the red 'bad case' line. Default 30% is a severe but realistic fall (roughly the size of the GFC)."
								/>
							</div>
							<input
								id="dn"
								type="number"
								step="1"
								value={pct(plan.downturn)}
								oninput={(e) => (plan.downturn = (Number(e.currentTarget.value) || 0) / 100)}
							/>
						</div>
						<div class="field">
							<div class="field-head">
								<label for="rec">Recovery (years)</label>
								<Help
									text="How long the market takes to climb back to its pre-crash level in the bad case. Default 5 years. You keep withdrawing during the dip, which is what makes an early crash so costly."
								/>
							</div>
							<input id="rec" type="number" min="1" max="15" bind:value={plan.recoveryYears} />
						</div>
					</div>
				{/if}
			</section>
		</div>
	</div>
</section>
