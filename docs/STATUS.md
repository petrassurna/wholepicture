# STATUS — where the build actually is

*The living record of what's built, why it's built this way, and what's next.*
For the long-term product vision, see [`VISION.md`](./VISION.md) — that's the north
star and is deliberately bigger than what exists today. **This file is the truth about
the current code; the vision is the ambition.**

Last updated: 2026-07-07.

---

## Where we are

A working, chart-first retirement drawdown model — a focused slice of the vision.

**App surface** (SvelteKit, `wholepicture/`):
- Routes: `/` (home), `/model` (the tool), `/privacy`, `/terms`, shared `+layout.svelte` nav.
- Home shows the hero with a live preview chart and a **work-in-progress disclaimer popup** (once per session).
- `/model` is the tool: collapsible input sections (You / Superannuation / Bank accounts / Income / Assumptions) feeding a **pinned chart** that updates live.
- Chart has a **Balance | Tax toggle** (the Tax view only appears when there's assessable income), graded axes, and **hover tooltips** on both views.

**Domain** (`src/lib/domain/`, pure / framework-free / deterministic, 46 unit tests):
- `assets.ts` — `Asset` + the `ITaxable` capability (`assessableIncomeOn`). `Super` is structurally tax-free (not `ITaxable`); `BankAccount` is taxable. `isTaxable` guard.
- `income.ts` — `IncomeSource` with gross vs taxable split and an `Owner` (a / b / joint).
- `household.ts` — the `Household` aggregate: filing status + income sources; the **only** place the couple split lives (assets 50/50, income by owner).
- `tax.ts` — `taxOwed(taxable, filing, scale)`: marginal brackets + SAPTO + LITO + Medicare levy, in a **swappable tax-year constants table** (currently 2024-25).
- `projection.ts` — `project(assets, assumptions, scenario)`: evolves a **portfolio of assets** year by year, computes each year's assessable income, subtracts tax as an explicit outflow, and reports per-year `tax` + `assessableIncome` plus `totalTax`.

**What's modelled:** super (tax-free in pension phase), bank/term deposits (taxed interest), retirement income sources (work/rent), single or couple, average vs bad-case (sequence-risk) scenarios, drawdown to a plan-to age with run-out detection.

**What's not (yet):** property, shares, contributions/accumulation phase, the Age Pension, life events, the wider multi-tab "whole picture" from the vision doc, real accounts / persistence beyond localStorage.

---

## Design philosophy (the decisions, with rationale)

**1. Pure domain, thin UI.** All maths lives in `src/lib/domain` — no framework, no I/O, fully deterministic and unit-tested. Svelte state (`plan.svelte.ts`) is a composition root that builds domain objects from raw inputs; components just render.

**2. DDD, and specifically:**
- **Assets own the taxable *amount*, never the tax *rate*.** Tax is progressive and per-person, so no single asset can compute its own tax. `ITaxable.assessableIncomeOn` exposes the amount; `Household` + `tax.ts` apply the scale. (This replaced an earlier `afterTaxReturn(rate)` that baked a flat rate into each asset — the anti-pattern.)
- **`Household` is the aggregate** that encapsulates single-vs-couple. The projection engine knows nothing about filing or SAPTO — it calls injected `incomeAt`/`taxOn` callbacks. That dependency injection is the main decoupling win.
- **Tax scale is a swappable policy** keyed by tax year — annual updates are a data edit, not a code change.

**3. Chart-first.** The graph is the product: pinned, prominent, fed live by the inputs — not a form with a chart at the bottom.

**4. Tax modelling choices (deliberate, documented in code):**
- **Marginal, not flat** — with SAPTO/LITO/Medicare, because without SAPTO a modest retiree shows tax where the real answer is $0 (not credible).
- **Conservative bias:** assessable investment income is *nominal* interest while balances grow at their *real* return — slightly overstates tax, the safe direction for a retirement-safety tool.
- **Couples = two tax-free thresholds + two SAPTOs**, via a per-person split (assets 50/50, income by owner). Couple SAPTO is applied per-person on own income — a documented simplification of the ATO's combined-income basis.

**5. Honest by design.** "Illustrative only," visible/editable assumptions, and a prominent work-in-progress disclaimer. The product *shows consequences, never recommends* (see the vision doc's "Safe by Design").

### Known simplifications (accepted for now)
- The bad-case **crash hits the whole portfolio**, including bank/TDs — unrealistic for cash; a term deposit doesn't crash.
- **Tax constants are 2024-25**; FY2026-27 has legislated bracket cuts not yet entered.
- **Money is a raw `number`** — no `Money`/`Percent`/`Age` value objects yet (the vision/MVP called for integer-cents `Money`).
- **Inflation is a single rate applied to everything.** Each asset uses its own nominal return deflated by inflation (correct per-asset), spending is flat in real terms, and fixed income erodes — so items *are* treated individually, not by a blanket subtraction. The simplification is one CPI rate for all categories: real retiree costs (health, aged care, rates) typically outrun CPI, so a flat-CPI basket slightly **understates** cost growth → mildly optimistic on longevity. Deliberately not modelling per-category inflation (big complexity for a projection tool); a single "spend grows above inflation" knob is the cheap future option if wanted.
- **No Age Pension.** A large, inflation-linked income stream (indexed to the higher of CPI/wages) that kicks in as assets deplete — its absence makes longevity **pessimistic**, partly offsetting the inflation point above. Scope decision; see the vision doc.

---

## Where to from here (backlog)

Prioritised, with the reasoning behind the order:

0. **Age Pension (highest-value feature).** The biggest realism gap for the $300k–$5M user. It's a means-tested, tax-free, inflation-indexed income stream that *rises as assets fall* — a stabiliser that turns a hard "run-out" cliff into a glide onto a part-then-full pension. Design (fits the existing seams with no engine surgery):
   - New `pension.ts` policy: `agePension(financialAssets, otherIncome, filing, homeowner, scale)` → tax-free annual $, from an indexed constants table (assets-test thresholds/taper, income-test free area + deeming, max rates). Owned/called via `Household` (it already knows single/couple).
   - Injected into the projection as a per-year callback (like `taxOn`): each year compute the pension from that year's **opening** financial assets, add it as tax-free gross income offsetting spend. Recomputed yearly because the balance changes.
   - Composes with what exists: indexed → flat real (fits today's-dollars frame); tax-free (bypasses the tax engine); assesses super + bank (home exempt — already assumed homeowner).
   - **v1 scope:** assets-test only (it almost always binds for asset-rich retirees), homeowner, single/couple. Later: income test + deeming, non-homeowner thresholds + rent assistance.
   - **UI:** an "Include Age Pension" toggle (on = realistic; off = self-funded-only view). The "run-out age" framing softens to "your own money lasts to ~X, then the pension carries you."
1. **Fix the `Asset` doc comment.** It promises "add property/shares without touching the engine," which isn't true (see #4). Cheap honesty fix.
2. **Update the tax scale to the current year** (`TAX_2026_27`, the 16%→15% cut) — five-minute data add when wanted.
3. **`Money` value object — when the domain stabilises.** Foundational and mechanical (touches everything), so it only gets more expensive; but for an illustrative tool the float-drift risk is low, so not urgent. Do it before numbers drive real advice or hit a DB.
4. **Injected scenario / drawdown strategies — when the second case arrives.** Today the engine hardcodes the crash/recovery path and pro-rata drawdown. The seam is obvious; extracting it early would be premature abstraction. Add a strategy the moment a second drawdown rule or scenario is needed.
5. **Rethink the `Asset` abstraction *before* building property/shares.** This is a *shape* change, not an addition: `assessableIncomeOn(held)` assumes assets are divisible, cash-like, and assessed annually. It breaks on CGT-on-sale (shares), illiquidity (property), and assets that also yield *spendable* income (rent is taxed but, today, not credited as income to live on). Retrofitting after the fact is disruptive — design it first.
6. **Crash only growth assets**, not cash (removes the term-deposit-crashes oddity).
7. **Beyond the MVP slice:** contributions/accumulation, Age Pension, more asset tabs, life events, real accounts + persistence — the vision doc's territory.

---

## Doc map
- [`VISION.md`](./VISION.md) — product vision (why / what-forever). Aspirational.
- `STATUS.md` (this file) — where we are, how, and what's next. The current truth.
- [`../README.md`](../README.md) — how to run the app.
