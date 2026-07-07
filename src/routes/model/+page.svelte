<script lang="ts">
	import ProjectionChart from '$lib/components/ProjectionChart.svelte';
	import Help from '$lib/components/Help.svelte';
	import MoneyInput from '$lib/components/MoneyInput.svelte';
	import H1 from '$lib/components/H1.svelte';
	import { plan } from '$lib/state/plan.svelte';

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
					Illustrative projections only. Actual investment returns, inflation, tax, fees and future
					spending will differ.
				</p>
			</div>
		</div>

		<!-- Inputs: collapsible sections -->
		<div class="model-inputs">
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
									<label for="spend">Spend per year ($)</label>
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
									<span>×</span>
									<span class="spend-col-total">Total</span>
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
										<input
											class="spend-qty"
											type="number"
											min="0"
											aria-label="Times per year"
											bind:value={item.quantity}
										/>
										<span class="spend-line">{money(item.amount * item.quantity)}</span>
										<button
											type="button"
											class="bank-remove"
											aria-label="Remove item"
											onclick={() => plan.removeSpendItem(i)}>×</button
										>
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
						<p class="field-note">Assumes you own your home — no rent or mortgage is included.</p>
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
								<label for="super">Super balance ($)</label>
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
					</div>
				{/if}
			</section>

			<!-- BANK ACCOUNTS -->
			<section class="acc">
				<button class="acc-head" aria-expanded={open.bank} onclick={() => (open.bank = !open.bank)}>
					<span>Bank accounts</span>
					<span class="acc-chev" class:open={open.bank}>›</span>
				</button>
				{#if open.bank}
					<div class="acc-body">
						<p class="field-note">
							Savings and term deposits are pooled with your super at their own rate. Maturity dates
							don't change a long-term projection, so they aren't needed.
						</p>
						{#each plan.bankAccounts as account, i (account)}
							<div class="bank-acct">
								<div class="bank-acct-top">
									<input
										class="bank-name"
										type="text"
										aria-label="Account name"
										placeholder="Account name (e.g. term deposit)"
										bind:value={account.name}
									/>
									<button
										type="button"
										class="bank-remove"
										aria-label="Remove account"
										onclick={() => plan.removeBankAccount(i)}>×</button
									>
								</div>
								<div class="bank-fields">
									<div class="field">
										<label for={`bank-amt-${i}`}>Amount ($)</label>
										<MoneyInput id={`bank-amt-${i}`} bind:value={account.amount} />
									</div>
									<div class="field">
										<label for={`bank-rate-${i}`}>Rate (% p.a.)</label>
										<input
											id={`bank-rate-${i}`}
											type="number"
											step="0.1"
											value={pct(account.rate)}
											oninput={(e) => (account.rate = (Number(e.currentTarget.value) || 0) / 100)}
										/>
									</div>
								</div>
							</div>
						{/each}
						<button type="button" class="add-btn" onclick={() => plan.addBankAccount()}
							>+ Add account</button
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
					<span>Income</span>
					<span class="acc-chev" class:open={open.income}>›</span>
				</button>
				{#if open.income}
					<div class="acc-body">
						<p class="field-note">
							Part-time work, rent or other income during retirement.
							<Help
								text="It reduces how much you draw from your pot for the years you receive it, and is taxed at your marginal rate (your super pension isn't)."
							/>
						</p>
						{#each plan.incomeSources as inc, i (inc)}
							<div class="bank-acct">
								<div class="bank-acct-top">
									<input
										class="bank-name"
										type="text"
										aria-label="Income label"
										placeholder="e.g. Part-time work"
										bind:value={inc.label}
									/>
									<button
										type="button"
										class="bank-remove"
										aria-label="Remove income"
										onclick={() => plan.removeIncome(i)}>×</button
									>
								</div>
								<div class="income-body">
									<div class="field">
										<label for={`inc-amt-${i}`}>Amount ($/yr)</label>
										<MoneyInput id={`inc-amt-${i}`} bind:value={inc.amount} />
									</div>
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
								</div>
							</div>
						{/each}
						<button type="button" class="add-btn" onclick={() => plan.addIncome()}
							>+ Add income</button
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
							Tax is worked out for you each year from your assessable income — bank interest plus
							any taxable income like rent or part-time work — using current resident rates
							(marginal brackets, SAPTO, LITO and the Medicare levy). Your super pension is
							tax-free, so it's never taxed. Many retirees pay little or nothing.
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
