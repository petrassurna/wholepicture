# STATUS — where the build actually is

*The living record of what's built, why it's built this way, and what's next.*
For the long-term product vision, see [`VISION.md`](./VISION.md) — that's the north
star and is deliberately bigger than what exists today. **This file is the truth about
the current code; the vision is the ambition.**

Last updated: 2026-07-07.

---

## Where we are

A working, chart-first retirement model — a focused but steadily growing slice of the vision. It now spans both the accumulation years (still working, paying into super) and the drawdown years (retired, spending down), all in today's dollars.

**App surface** (SvelteKit, `wholepicture/`):
- Routes: `/` (home), `/model` (the tool), `/blog` + `/blog/[slug]` (prerendered guides), `/privacy`, `/terms`, shared `+layout.svelte` nav.
- Home: hero with a live preview chart and a **work-in-progress disclaimer popup** (once per session).
- `/model` is the tool: collapsible sections (You / Superannuation / Spending / Bank accounts / Income / Assumptions) feeding a **pinned chart** that updates live. Includes an **"Age now"** field (drives the accumulation phase), an **"Include Age Pension"** toggle, a frequency-based **spending breakdown**, and a **"Reset all values"** button.
- Chart: **Balance | Tax toggle** (Tax view only when there's assessable income), graded dollar axes, **hover tooltips** on both views, and a **"Retire" marker** when there's an accumulation phase.
- **Calculations panel** under the chart: reproduces the year-by-year arithmetic with real numbers substituted (Step view) and reconciles every year against the graph (Table view) — a self-check for the engine.
- **Blog:** four factual, education-only (ASIC-safe) articles with SEO metadata and JSON-LD, each with an auto-appended "general information, not advice" disclaimer.

**Domain** (`src/lib/domain/`, pure / framework-free / deterministic, **88 unit tests across 8 files** including fuzz/property suites):
- `assets.ts` — `Asset` + the `ITaxable` capability (`assessableIncomeOn`). `Super` is structurally tax-free (not `ITaxable`); `BankAccount` is taxable. `isTaxable` guard.
- `income.ts` — `IncomeSource` (amount, age window, `taxable`, `indexed` for inflation, `toSuper` contribution flag, `superRate` share of salary). `grossIncomeAt`/`taxableIncomeAt` (exclude contributions), `contributionsAt` (the `toSuper` share). `RealCtx` deflates non-indexed income.
- `household.ts` — the `Household` aggregate: filing status + income sources. `taxOn` (a couple splits total assessable income **50/50** and is assessed as two people), `agePensionAt`, and `contributionAt` (applies the 15% concessional contributions tax).
- `tax.ts` — `taxOwed(taxable, filing, scale)`: marginal brackets + SAPTO + LITO + Medicare levy, in a **swappable tax-year constants table** (currently 2024-25).
- `pension.ts` — `agePension(age, assets, filing, homeowner, scale)`: the Age Pension **assets test**, single/couple, homeowner, in an indexed constants table (2024-25). Tax-free, from age 67.
- `projection.ts` — `project(assets, assumptions, scenario)`: runs an **accumulation phase** (before `retireAge`: contributions in, 15%-earnings-taxed growth, no spending) then **drawdown** (income offset, tax, Age Pension, spend; the bad-case crash is timed to retirement). All the policies (tax, pension, income, contributions) are **injected callbacks** — the engine knows nothing about SAPTO or filing.

**What's modelled:** super (tax-free in pension phase; 15%-taxed earnings in accumulation), bank/term deposits (taxed interest), retirement income (work/rent, indexed or fixed), **salary contributions into super** (SG % + salary sacrifice, 15% contributions tax), single or couple, the **Age Pension** (assets test, phasing in as assets fall), average vs bad-case (sequence-risk) scenarios, and drawdown to a plan-to age with run-out detection.

**What's not (yet):** property, shares, the Age Pension *income* test + deeming, non-homeowner pension rules, concessional-cap enforcement, life events, the wider multi-tab "whole picture" from the vision doc, real accounts / persistence beyond localStorage.

---

## Design philosophy (the decisions, with rationale)

**1. Pure domain, thin UI.** All maths lives in `src/lib/domain` — no framework, no I/O, fully deterministic and unit-tested. Svelte state (`plan.svelte.ts`) is a composition root that builds domain objects from raw inputs and exposes `buildAssumptions()` so the chart and the calculations panel run the *same* projection.

**2. DDD, and specifically:**
- **Assets own the taxable *amount*, never the tax *rate*.** Tax is progressive and per-person, so no single asset can compute its own tax. `ITaxable.assessableIncomeOn` exposes the amount; `Household` + `tax.ts` apply the scale. (This replaced an earlier `afterTaxReturn(rate)` that baked a flat rate into each asset — the anti-pattern.)
- **`Household` is the aggregate** that encapsulates single-vs-couple. The projection engine calls injected `incomeAt` / `taxOn` / `pensionAt` / `contributionAt` callbacks and knows nothing about filing, SAPTO, or the pension taper. That dependency injection is the main decoupling win, and it's how the pension and accumulation slotted in with no engine surgery.
- **Tax and pension scales are swappable policies** keyed by year — annual updates are a data edit, not a code change.

**3. Chart-first, and today's dollars.** The graph is the product: pinned, prominent, fed live by the inputs. Everything is expressed in **today's dollars** — balances grow at the *real* return (`(1+nominal)/(1+inflation)−1`), spending is flat in real terms, indexed income is flat, fixed income erodes. One conversion (the real return) puts the whole model in one unit, so no figure ever needs manual inflation-adjustment.

**4. Tax modelling choices (deliberate, documented in code):**
- **Marginal, not flat** — with SAPTO/LITO/Medicare, because without SAPTO a modest retiree shows tax where the real answer is $0 (not credible).
- **Conservative bias:** assessable investment income is *nominal* interest while balances grow at their *real* return — matches how nominal interest is actually taxed, and is the safe direction.
- **Couples split assessable income 50/50 automatically** and are assessed as two people (two tax-free thresholds, two SAPTOs). Per-item owner attribution was tried and removed as too complex for this stage — 50/50 is a documented simplification of the ATO's individual-assessment basis.

**5. Accumulation reuses income, not a new section.** Salary contributions are an income row flagged **"Pays into super"** with a **% of salary** (SG default 11.5%). Only that share (less 15% contributions tax) is added to super; the rest of the salary is the working-life money the model doesn't track. The only genuinely new input is **"Age now"** — without pre-retirement years there's nothing to contribute over.

**6. Honest + verifiable by design.** "Illustrative only," visible/editable assumptions, a prominent work-in-progress disclaimer, and the **calculations panel** that shows and self-checks the arithmetic. The product *shows consequences, never recommends* (see the vision doc's "Safe by Design"). The blog holds the same line — factual/educational only.

### Known simplifications (accepted for now)
- The bad-case **crash hits the whole portfolio**, including bank/TDs — unrealistic for cash; a term deposit doesn't crash.
- **Accumulation applies a 15% earnings-tax drag to every asset**, not just super. Correct for super (the dominant accumulation asset); for a bank account the working-years marginal rate is usually higher, so 15% understates it slightly.
- **Age Pension v1 is the assets test only**, homeowner, single/couple. The income test + deeming and non-homeowner rules aren't modelled — for asset-rich retirees the assets test almost always binds, so this is close.
- **No concessional-cap enforcement** — a very large "Pays into super" figure isn't capped at $30k/yr, and Division 293 for high earners isn't modelled.
- **Tax + pension constants are 2024-25**; FY2026-27 has legislated bracket cuts not yet entered.
- **Money is a raw `number`** — no `Money`/`Percent`/`Age` value objects yet (the vision/MVP called for integer-cents `Money`).
- **Inflation is a single rate applied to everything.** Each asset uses its own nominal return deflated by inflation (correct per-asset), spending is flat in real terms, and fixed income erodes — so items *are* treated individually, not by a blanket subtraction. The simplification is one CPI rate for all categories: real retiree costs (health, aged care, rates) typically outrun CPI, so a flat-CPI basket slightly **understates** cost growth → mildly optimistic on longevity. Deliberately not modelling per-category inflation; a single "spend grows above inflation" knob is the cheap future option if wanted.

---

## Where to from here (backlog)

Prioritised, with the reasoning behind the order:

1. **Fix the `Asset` doc comment.** It promises "add property/shares without touching the engine," which isn't true (see #5). Cheap honesty fix.
2. **Update the tax + pension scales to the current year** (`TAX_2026_27`, the 16%→15% cut; latest pension rates) — a data edit when wanted.
3. **Age Pension follow-ups:** the income test + deeming, and non-homeowner thresholds + rent assistance. Adds accuracy for renters and income-rich retirees; the assets-test v1 covers the common case.
4. **Enforce the concessional contributions cap** ($30k/yr) and optionally Division 293 — small guards on the accumulation inputs.
5. **`Money` value object — when the domain stabilises.** Foundational and mechanical (touches everything), so it only gets more expensive; but for an illustrative tool the float-drift risk is low, so not urgent. Do it before numbers drive real advice or hit a DB.
6. **Injected scenario / drawdown strategies — when the second case arrives.** Today the engine hardcodes the crash/recovery path and pro-rata drawdown. The seam is obvious; extracting it early would be premature abstraction.
7. **Rethink the `Asset` abstraction *before* building property/shares.** This is a *shape* change, not an addition: `assessableIncomeOn(held)` assumes assets are divisible, cash-like, and assessed annually. It breaks on CGT-on-sale (shares), illiquidity (property), and assets that also yield *spendable* income (rent). Design it first.
8. **Crash only growth assets**, not cash (removes the term-deposit-crashes oddity).
9. **Beyond the current slice:** more asset tabs, life events, real accounts + persistence — the vision doc's territory.

---

## Doc map
- [`VISION.md`](./VISION.md) — product vision (why / what-forever). Aspirational.
- `STATUS.md` (this file) — where we are, how, and what's next. The current truth.
- [`../README.md`](../README.md) — how to run the app.
