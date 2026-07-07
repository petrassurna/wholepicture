https://canwi.com.au/

# MyWealthProjection.com
### *Model it before you live it*

> **This is the product vision — the north star, deliberately bigger than what's built.**
> For what actually exists today, the design decisions behind it, and the backlog, see
> [`STATUS.md`](./STATUS.md). To run the app, see [`../README.md`](../README.md).

---

## Product Vision

A financial modelling tool for everyday Australians with real assets. Not financial advice — a projection engine. Users enter their full asset picture, state their age and goals, and receive clear scenario-based projections of their financial future.

**Target user:** Australians with $300K–$5M in combined assets who are too wealthy for budgeting apps and not wealthy enough for a private wealth manager.

**Core promise:** See every asset, every scenario, one clear picture.

---

## The Problem We Solve

- Financial advisors cost $3,000–$10,000 for a plan
- Existing tools (Pocketbook, Sorted) only handle budgeting, not wealth projection
- Super calculators ignore property, shares, and other income
- Nobody models *all* assets together in one place
- Scenarios (what if I sell this property? what if I retire early?) require a spreadsheet built from scratch

---

## What It Does — It Shows, It Never Recommends

The single clearest statement of what this product is:

> **You bring the decision; the tool brings the consequences.** It answers *"what happens if I…"* — never *"what should I do."*

It is a **what-if model, not an adviser.** It never says "put your money here" or "switch to that." The user pulls a lever; the tool shows the outcome and the trade-off. That's not a limitation — it's exactly what keeps it safe, licence-free, and trustworthy (see *Safe by Design*).

**How that plays out — three examples people ask for:**

| The user's question | What the tool does (❌ *not* a recommendation) |
|---|---|
| "What if I put everything into super?" | Toggles a **what-if lever** → shows *"+$180k by 65, but locked until 60."* User decides. |
| "Where does my money come from in retirement?" | The **Money-In lens** shows each year's drawdown, source by source. |
| "Should I go conservative when I've 7 years left?" | Won't say "you should." **Shows** Conservative vs Growth side by side, and **factually flags** *"at 82 your assets cover ~7 years at current spend."* User makes the call. |

**Two modes, one safe side of the line:**
- **What-if levers** — the user chooses an action (retire later, max super, sell a property); the tool projects the consequence.
- **Factual highlights** — the tool surfaces *observations* ("your assets now cover ~7 years," "you have unused super cap"), stated as facts, never as "you should." The moment a highlight becomes "so switch to conservative," it crosses into licensed financial advice — and that's the one thing the product must never do.

This is the difference between a **map** and a **driver**. The tool is the map: it shows every road and where each leads. The user does the driving.

---

## Why Assumptions Don't Make It Meaningless

Everything is an assumption — growth, inflation, tax rate — so it's fair to ask whether that makes the tool vague. It doesn't, because **the value was never precision about the future.** Nobody can tell you your exact net worth in 2050; a tool that claimed to would be the dishonest version. What's useful survives the assumptions intact:

- **The value is structure, not the number.** Seeing *all* your assets — property, super, shares, pension — in one coherent picture with Australian rules applied is valuable at any set of assumptions. You're solving "I've never seen it all together."
- **Comparisons cancel the assumptions out.** The power isn't "you'll have $2.1M" — it's *"retiring two years later leaves you $400k better off."* Both scenarios use the same growth rate, so the assumption cancels in the difference. The **relative** answer is robust even when the **absolute** one is uncertain. Every what-if works this way.
- **The mechanics are rules, not guesses.** When the Age Pension kicks in, super preservation age, minimum drawdown %, the tax collapse at pension phase, drawdown order — these are **legislated facts**. The tool surfaces genuinely non-obvious *structure* that's true regardless of what markets do.
- **Every serious model uses assumptions** — the $5k advisor, the actuary, the super fund calculator, the government's Moneysmart. Assumptions are the nature of projecting an unknowable future, not a weakness of this tool.

The design rule that keeps it from feeling wishy-washy:

> **Be confident about what's knowable, honest about what isn't, and lead with comparisons over absolutes.**

Confident on the mechanics (pension timing, tax structure, broadly on-track or not). Honest on markets (a *range* via Conservative / Balanced / Growth — more truthful than false precision). Frame outputs as "later vs. earlier" and "sell vs. hold," not "$2,143,000." That is exactly what *"model it before you live it"* means — a thinking instrument, not an oracle. And because every assumption is visible and editable, the sceptic can enter their own number and watch — which makes it **more** trustworthy than a black box, not less.

### Which assumptions actually matter (sensitivity hint)

A user can nudge twenty knobs — but only two or three genuinely move their result. Without guidance they'll waste time tuning *dividend yield* (barely registers) while ignoring *retirement age* (enormous). So the tool **points at what matters**: it flags the handful of assumptions their outcome is most sensitive to, and quietly de-emphasises the rest.

> On the Answer screen: *"Your result depends most on **when you retire** and **how much you spend** — try those first."* Everything else stays available but out of the spotlight. This kills two problems at once: wasted effort, and false-precision chasing on numbers that don't matter.

---

## Output First — Never a Blank Form

**The single biggest adoption risk is data-entry dread.** If the first thing a user meets is nine empty tabs and a hundred fields, most will abandon before they ever see a result. So the product is built on one rule:

> **See it, then shape it.** The user never faces a blank form. They land on a *complete, working projection* within seconds, and their job is to **correct** numbers that are already there — not produce them from scratch.

How we guarantee an instant result:

- **The floor is a single input: your age.** From age alone we synthesise a *plausible whole person* using published Australian averages — a typical super balance for that age band (ATO/ASFA), a salary track (ABS average earnings by age), likely home ownership and value, and some savings. That's enough to draw a complete projection on its own.
- **Optionally, two more questions** sharpen it — *rough total assets* and *target yearly spend* — but they're a "make it more yours" step, never a requirement. Age gets you a result; these just get you a *closer* one.
- **Everything is then a guess the user nudges.** Super, salary, home, spending are all sitting there as editable numbers derived from your age — the user alters whichever ones are wrong for them and watches the timeline move.
- **Every field is pre-filled with a sensible default** — inflation 2.5%, super contribution 11.5%, growth rates, deeming rates, dividend yields, tax. The user overrides **only what they care about**.
- **"Estimated" badges** mark every value we guessed. A **confidence meter** fills as the user replaces estimates with real figures — so refining feels like progress, not homework.
- **Tabs are refinement surfaces, not gates.** A meaningful projection already exists after the 3 questions; tabs are where you go to *sharpen* accuracy, never a checklist you must finish first.
- **Every edit re-runs instantly** — the timeline moves the moment a number changes, so each figure entered pays off immediately. This turns data entry from a chore into exploration.
- **"Explore a sample household" escape hatch** — the truly hesitant can open a fully worked demo (the Nguyens) and poke at it with zero commitment.

Required to get a projection: **just your age.** Everything else is optional refinement.

### The flow, in one line

```
   Enter age  ─▶  INSTANT PROJECTION  ─▶  refine via tabs (optional, anytime)
                  (a full timeline,          replace guesses with real numbers;
                   built from averages)       the timeline updates on every edit
```

The user always has a finished result on screen. Filling in tabs never *unlocks* the output — it only makes the output they're already looking at more accurate. There is no point in the journey where the user stares at nothing.

---

## Inputs — Two Layers: What You Have, and What Happens

The input model separates two fundamentally different things, which keeps the UI clean no matter how complex a life is:

1. **What you have *now* → tabs** (your balance sheet: assets, debts, income).
2. **What *happens over time* → Life Events on the timeline** (inheritance, aged care, a partner dies, helping the kids, redundancy).

The payoff: **life situations become *events*, not tabs**, so the tab bar never sprawls — you can represent almost any life without adding a single input tab.

> **Skip any tab that doesn't apply — unused tabs cost nothing.** A retiree with just super touches two tabs; a couple with three rentals, two supers and shares touches a few more and taps "add another." Effort scales with what you *own*, never with the tool's full capacity. Complexity you can ignore isn't complexity.

### Layer 1 — Tabs (what you have)

Seven plain-word tabs. Everything else lives *inside* a tab behind a type-selector, revealed only when relevant — so a renter never sees SMSF fields and a simple user never sees defined-benefit.

```
┌ Household & Goals ┬ Property ┬ Super & Pensions ┬ Investments ┬ Cash ┬ Income ┬ Debts ┐
│                                          Net worth: $2,205,000 · Confidence ▓▓▓▓░░ 62% │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

| Tab | What it holds | Sub-types inside (type-selector — hidden until chosen) |
|---|---|---|
| **⚙️ Household & Goals** | The settings shaping every projection | People & ages · **renter/owner** · residency · retirement age(s) · plan-to age · inflation · scenario growth rates · drawdown order · target spending |
| **🏠 Property** | Real estate (card per property) | Home · investment · commercial · land · holiday/Airbnb — each with value, mortgage, rent, ownership % |
| **🏦 Super & Pensions** | Retirement savings (card per person) | Accumulation · pension/drawdown · **SMSF** · **defined-benefit** · foreign pension (UK/US) |
| **📈 Investments** | Everything else that grows | Shares/ETFs (AU/intl/LIC) · managed funds · **private business/equity** · crypto · collectibles/art |
| **💰 Cash** | Liquid holdings | Savings · term deposit · offset · bonds/fixed income |
| **👤 Income** | Income *not* tied to an asset | Salary · **self-employed/sole trader** · **Centrelink benefits** · annuity · side income *(rent & dividends live on their asset tabs — no double entry)* |
| **💳 Debts** | Standalone liabilities (card per debt) | Personal/car loan · credit card · **HECS/HELP** · **tax debt** — each subtracts from net worth and drains cashflow until cleared. *A **mortgage** (or margin loan) is **secured to an asset**, so it's entered on that asset's card — never here — so selling the asset clears the debt and net worth stays correct.* |

**Structures worth their own type-flag** (common in the $300K–$5M bracket, each modelled differently): **SMSF**, **defined-benefit pension**, **family trust** (asset-holding + distributions), and **foreign assets/pensions**.

### Layer 2 — Life Events (what happens, on the timeline)

Things that happen *at an age* are scheduled as events, not entered as tabs. Each has a trigger age (and often a probability), and the timeline shows its impact. New life situations = new event types, never new tabs.

Four core events in MVP — the ones with the biggest impact and the simplest logic:

| Life event | What it does to the projection |
|---|---|
| **Inheritance** | Adds assets at an age (with probability weighting) |
| **Downsize the home** | Sell at an age, buy cheaper, free up capital (also a what-if lever) |
| **Aged care** 🔴 | Adds the big late-life cost (RAD/DAP + means-tested fees) — dominates the 85+ years the projection reaches |
| **Death of a partner** 🔴 | Switches to single Age Pension rate + super death benefit |

*Deferred to V2 (more complex, more tailored): gifting/deprivation rules, divorce asset-splits, career-break/redundancy (already covered by the income taper), one-off health costs.*

Because these are events, an uneventful life adds nothing to the input surface, and an eventful one never grows the tab bar — it just gets more markers on the timeline.

### 👤 Income Sources
- Employment income (salary, wages)
- Rental income (net after expenses)
- Dividend income
- Business distributions
- Pension / Age Pension (when eligible)
- Annuity income
- Side income / consulting

---

## Input Inventory by Screen (build-ready)

The field-level spec. Every field has a **default** (nothing is ever blank), a **type**, and an **estimate?** flag (shown with the ~estimated~ badge until the user confirms it). "Repeats" means the user can add multiple (e.g. three properties). Defaults marked *seeded* are derived from age; the rest are standing defaults.

### Screen 0 — Quick start
| Field | Type | Default | Required |
|---|---|---|---|
| Age | number | — | **Yes (only required field)** |
| Total assets | money | *seeded from age* | No |
| Target yearly spend | money | *seeded from age* | No |

### Screen 1 · ⚙️ Household & Goals tab
| Field | Type | Default | Estimate? |
|---|---|---|---|
| People (name, age) — **1 or 2** | list | 1 person from Screen 0 | — |
| Renter or owner? / residency years | toggle / number | Owner / 10+ | ~est~ |
| Retirement age (per person) | number | 67 | ~est~ |
| Plan-to age | number | 90 | ~est~ |
| Inflation | % | 2.5% | ~est~ |
| Scenario growth rates (equities, property) | % set ×3 | Cons/Bal/Growth presets | ~est~ |
| Effective tax rate | % | *derived from income* | ~est~ |
| Drawdown order | choice | Lowest-tax-first | — |
| Target yearly spend | money | from Screen 0 | ~est~ |
| Housing cost *(rent if renter — lifelong; else mortgage from Property)* | money/yr | *est from location* | ~est~ |

### Screen 1 · 🏠 Property tab · *card per property*
| Field | Type | Default | Repeats |
|---|---|---|---|
| Property type | choice (home / investment / commercial / land / holiday) | Home | ✓ |
| Value | money | *seeded* | ✓ |
| Mortgage remaining / repayment | money | 0 | ✓ |
| Ownership % | % | 100% | ✓ |
| Net rental income *(investment only)* | money/yr | *est from value* | ✓ |
| Growth rate | % | from scenario ~est~ | ✓ |

### Screen 1 · 🏦 Super & Pensions tab · *card per person*
| Field | Type | Default | Repeats |
|---|---|---|---|
| Owner | choice | Person 1 | ✓ |
| Fund type | choice (**accumulation / pension / SMSF / defined-benefit / foreign**) | Accumulation | ✓ |
| Balance *(or DB entitlement / income stream)* | money | *seeded from age* | ✓ |
| Move-to-pension age | number | 65 | ✓ |
| Employer contribution | % | 11.5% ~est~ | ✓ |
| Personal contributions | money/yr | 0 | ✓ |
| Growth rate | % | from scenario ~est~ | ✓ |

### Screen 1 · 📈 Investments tab · *card per holding*
| Field | Type | Default | Repeats |
|---|---|---|---|
| Holding type | choice (**shares/ETF · managed fund · private business · crypto · collectible**) | Shares/ETF | ✓ |
| Value | money | *seeded* | ✓ |
| Income / dividend yield (franked / unfranked split) | % | 4% ~est~ | ✓ |
| Cost base *(for CGT)* | money | = value ~est~ | ✓ |
| Growth rate | % | from scenario ~est~ | ✓ |

### Screen 1 · 💰 Cash tab · *card per account*
| Field | Type | Default | Repeats |
|---|---|---|---|
| Account type | choice (savings / term deposit / offset / bond) | Savings | ✓ |
| Balance | money | *seeded* | ✓ |
| Interest rate | % | 5.25% ~est~ | ✓ |
| Term-deposit maturity | date | — | ✓ |

### Screen 1 · 👤 Income tab — *only income NOT tied to an asset*
> Rent and dividends are entered on their **asset** tabs, not here, to avoid double-counting. This tab is for salary and other standalone income.

| Field | Type | Default | Repeats |
|---|---|---|---|
| Income type | choice (salary / **self-employed / sole trader** / **Centrelink benefit** / side income / annuity) | Salary | ✓ |
| Owner | choice | Person 1 | ✓ |
| Amount | money/yr | *seeded from age* | ✓ |
| Stops at age *(e.g. salary at retirement)* | number | = retirement age | ✓ |
| **Winds down to $0 by age** *(taper — optional)* | number | off (hard stop) | ✓ |

> **Taper** models the common semi-retirement pattern ("some work for a few more years"), not a cliff. **Self-employed / sole trader** matters because no employer pays the super guarantee — the engine won't assume employer contributions the user doesn't get.

### Screen 1 · 💳 Debts tab · *card per **standalone** debt* — **NEW**
> Net worth = assets − debts. Without this, every projection is too rosy. Repayments drain cashflow until the debt is cleared.
>
> **Secured debt lives on its asset, not here.** A home/investment **mortgage** is entered on the **Property card**; a margin loan on the **Investment card**. That way, selling the asset clears the debt automatically. The Debts tab is only for debt *not* tied to an asset.

| Field | Type | Default | Repeats |
|---|---|---|---|
| Debt type | choice (**personal/car loan · credit card · HECS/HELP · tax debt**) | Personal loan | ✓ |
| Balance owing | money | 0 | ✓ |
| Interest rate | % | ~est per type~ | ✓ |
| Annual repayment | money/yr | *est to clear* | ✓ |

> **V2 (deferred, per scope):** foreign property, reverse mortgage / equity release, P2P loans you've made, material vehicles.

### Life Events layer — *scheduled on the timeline, not a tab* · **4 core events (MVP)**
| Event | Inputs | Effect |
|---|---|---|
| Inheritance | amount · age · probability | adds assets at that age |
| Downsize home | age · new value | frees capital (also a what-if) |
| **Aged care** | from age · annual cost (or RAD) | big late-life outflow |
| **Death of a partner** | age | single pension rate · super death benefit |

> *V2: gifting (deprivation rules), divorce (asset split), redundancy (covered by income taper), health costs.*

### Screens 2–4 — Timeline output · **no data inputs**
Controls only: scenario toggle (🛡 ⚖ 🚀), lens toggle (Net worth / Money in / Tax), and the age scrubber.

### Screen 5 — What-if levers
| Lever | Type | Applies |
|---|---|---|
| Sell investment property at | age | on/off |
| Retire earlier / later | age | on/off |
| Spend more / less per year | money ± | on/off |
| Market crash −X% in year N | % + year | on/off |
| Downsize home at | age → new value | on/off |
| Extra super contributions | money/yr | on/off |

> **Resolved:** couples are **MVP** (1 or 2 people); repeatable items use an **"add another" card** pattern on every asset/debt tab; life situations are **timeline events**, never new tabs — so the seven-tab bar never grows.

---

## What Users Want to Know

### Retirement Planning
- How long will my money last at my current withdrawal rate?
- What age can I realistically retire?
- When will I need the Age Pension (if ever)?
- What is my minimum drawdown requirement each year (super)?
- How does my retirement date change if I save an extra $20K/year?

### Scenario Modelling
- What if I sell an investment property?
- What if I downsize my home at 70?
- What if markets fall 30% next year?
- What if I retire 3 years earlier than planned?
- What if I increase / decrease my annual spending?
- What if I make extra super contributions now?

### Tax & Structure
- What is my effective tax rate across all income sources?
- What is my CGT exposure if I sell asset X?
- Am I approaching the super transfer balance cap ($1.9M)?
- How do franking credits affect my real return?
- What is the tax-free threshold interaction with my super drawdown?

### Net Worth & Projections
- What is my total net worth today?
- What will my net worth be in 10 / 20 / 30 years?
- What is my projected income in retirement?
- Am I on track for my target retirement income?
- How diversified is my asset base? (concentration risk)

### Risk & Diversification
- How much of my wealth is in a single asset class?
- How correlated are my assets? (e.g. property + super both Australian)
- What is my exposure to Australian vs international assets?
- What happens to my plan in a worst-case scenario?

### Estate & Legacy
- What will my estate be worth at age 80 / 85 / 90?
- How does my wealth transfer to the next generation?
- What is the most tax-effective way to pass assets on?

---

## Scenario Outputs (Three Core Views)

### 1. Conservative 🛡
- Lower growth assumptions (5% equities, 4% property)
- Higher inflation (3.5%)
- Stress-test: 20% market drawdown in year 3
- Goal: When do I *definitely* have enough?

### 2. Balanced ⚖
- Moderate assumptions (7% equities, 5% property)
- Standard inflation (2.5–3%)
- Goal: Most likely realistic outcome

### 3. Growth 🚀
- Higher growth assumptions (9% equities, 6% property)
- Lower inflation (2%)
- Goal: What's the upside if things go well?

Each scenario shows:
- Net worth over time (chart)
- Annual income available
- Age at which pension is needed (if ever)
- Total lifetime wealth drawn
- Estate value at death (user-specified age)

---

## The Key Output: Annual Money Sourcing Statement

The core deliverable is **not** a single net-worth line. For **every projected year** the engine answers one question:

> *"You need $X to live on this year. Here is exactly where every dollar comes from, and exactly what you pay in tax."*

Each year is built from three stacked layers:

```
LIVING NEED  +  TAX BILL          ← total money required this year
        met by
     INCOME (arrives without selling assets)  +  DRAWDOWN (assets sold/consumed)
```

Rendered as a **stacked bar per year** — each colour is one source, the bar height is the total need. Watching those colours shift year to year (salary → dividends → super pension → Age Pension) *is* the product.

### Layer 1 — Income (money in without touching the asset base)

Priority order:

1. Employment / salary (while working)
2. Net rental income (after expenses + mortgage interest)
3. Dividends (franked / unfranked + franking credits)
4. Interest (cash, term deposits, bonds)
5. Business distributions
6. **Super pension payments** — once in pension phase the *minimum drawdown* is forced (age-banded, see below)
7. **Age Pension** — once eligible and after means-testing (see below)
8. Annuity income

### Layer 2 — Drawdown (assets sold or consumed to fill any shortfall)

9. Cash / savings buffer
10. Share portfolio sales → triggers **CGT**
11. Extra super withdrawals (above the minimum)
12. Property sale / downsize → lumpy, one-off, CGT + downsizer contribution rules

### The per-year logic

Each year, the inflation-indexed spending need is compared against total income (sources 1–8). If income covers it, the **surplus** is reinvested. If it falls short, the **shortfall** is filled from the drawdown sources (9–12), taken in priority order until the year is funded.

**Drawdown order** defaults to **lowest-tax-first** and is later user-configurable
(e.g. "always spend cash before selling shares", "preserve the family home at all costs").

### Super minimum drawdown (mandatory in pension phase)

| Age | Minimum drawdown |
|---|---|
| Under 65 | 4% |
| 65–74 | 5% |
| 75–79 | 6% |
| 80–84 | 7% |
| 85–89 | 9% |
| 90–94 | 11% |
| 95+ | 14% |

---

## The Tax Layer (per year, itemised)

Tax is its own itemised layer, not a single number — because for this cohort it is the biggest expense in the working years and often **near-zero in retirement**. Showing that collapse is a core selling point.

> **Tax is an *assumed effective rate*, not a precise ATO calculation.** We present it — like growth and interest — as a visible, editable **estimate** ("assumed effective tax ~28%, adjust if you know yours"), never as "your exact tax." Behind the scenes we derive a *realistic* default from the user's income (so a retiree reads ~0% and a $180k earner ~28%), and the itemised lines below **illustrate where tax comes from** — they are not an authoritative figure to rely on or lodge with. This keeps the Australian-tax differentiation (franking, CGT, super phases) while dropping any *claim of accuracy* that would invite reliance and create liability. **Same shield as every other rate: an assumption, not a promise.**

| Tax line | Levied on | Rate logic |
|---|---|---|
| **Personal income tax** | Salary, net rent, interest, unfranked dividends, business income | Marginal brackets + 2% Medicare |
| **Franking credits** | Franked dividends | *Offset* — reduces tax, refundable if in excess |
| **CGT** | Asset sales (shares / property) | Marginal rate on the gain, **50% discount** if held >12 months |
| **Super earnings tax** | Super fund earnings | 15% in **accumulation**, **0% in pension phase** |
| **Super contributions tax** | Concessional contributions | 15% (+15% Div 293 if income >$250k) |
| **Offsets** | — | SAPTO / seniors offset — often wipes tax post-67 |

**Resident brackets (2024–25)** to bake into a maintained constants file:
$0–18,200 nil · 16% to $45k · 30% to $135k · 37% to $190k · 45% above, plus 2% Medicare levy.

### The tax collapse — same person, two years

**Age 45, working — salary $180k + $20k net rent:**

| Tax line | Amount |
|---|---|
| Income tax + Medicare | ~$51,600 |
| Super contributions tax (15%) | ~$4,050 |
| **Total tax** | **~$55,650** |

**Age 67, retired — the $90k-need year:**

| Tax line | Amount |
|---|---|
| Super pension (post-60) | $0 (tax-free) |
| Age Pension | $0 (under threshold / SAPTO) |
| Dividends | franking credits ≈ offset the rest → refund |
| CGT on $7.1k share sale | ~$600 |
| **Total tax** | **~$0–600** |

### The feedback loop (why the engine is non-trivial)

Covering a shortfall by *selling shares* triggers CGT → raises this year's tax → raises the total need → may require selling *more*. Each year must be solved slightly **iteratively** (or by drawing from the lowest-tax asset). This is where "which asset do I sell?" becomes a real optimisation, not a guess.

---

## The Age Pension Trigger (the year it kicks in, and how much)

**The year the Age Pension switches on is not a fixed date — it is an emergent result of the drawdown.** Most people are *over the assets cut-off at 67* and get nothing, then a **part-pension quietly switches on years later** as their assets deplete, growing every year after. Revealing that specific year and amount is something no super calculator does.

### Qualifying conditions (the gate)

1. **Age 67** for anyone born on/after 1 Jan 1957 (separate from super preservation age of 60).
2. **10 years Australian residency.**
3. Passes **both** means tests — Centrelink runs the Income Test **and** the Assets Test, then pays the **lower** of the two results.

### Assets Test (2024–25 — *family home exempt*)

| Situation | Full pension under | Cut-off (nil pension) |
|---|---|---|
| Single homeowner | ~$314,000 | ~$695,500 |
| Couple homeowner (combined) | ~$470,000 | ~$1,045,500 |
| Single non-homeowner | ~$566,000 | ~$947,500 |
| Couple non-homeowner | ~$722,000 | ~$1,397,500 |

Taper: **−$3/fortnight per $1,000** of assessable assets over the threshold (≈ −$78/yr per $1,000).

### Income Test (uses deeming, *not* actual returns)

- Deeming rates: 0.25% on first ~$62,600 single / ~$103,800 couple; **2.25%** above.
- Full pension under ~$212/fn single, ~$372/fn couple; taper **−50c per $1** over.

### Maximum payment (incl. supplements, ≈ current)

- Single: **~$29,800/yr**
- Couple combined: **~$45,000/yr**

### What happens each year

Once past age 67 (and residency met), the tool works out **assessable assets** (everything except the family home) and **assessable income** (deemed income on financial assets, plus actual income like rent). It runs both means tests, applies the two tapers, and takes the **lower** of the two results as that year's Age Pension.

Because assessable assets fall every year as the household draws down, the Age Pension is a **rising line** — nothing at first, then a growing part-pension, eventually the full rate.

### The trajectory it reveals (couple, homeowners)

| Age | Assessable assets | Age Pension | Why |
|---|---|---|---|
| 67 | $1,080,000 | **$0** | Over the $1,045,500 cut-off |
| 71 | $980,000 | **$5,100** | Dropped under cut-off → part pension begins |
| 78 | $720,000 | **$21,300** | Assets keep falling → pension climbs |
| 86 | $460,000 | **$45,000** | Under full-pension threshold → maximum |

Headline callout:

> **"Age Pension is projected to begin at age 71, starting at ~$5,100/yr, and reach the full ~$45,000/yr by age 86."**

Because it is computed from state (not assumed), the "what-if" levers actually move it: selling the investment property can push the pension start year **later**; spending down first brings it **forward**.

> ⚠️ **Maintenance note:** Age Pension thresholds, deeming rates, max payments *and* income-tax brackets re-index (Age Pension twice a year, March & September). Isolate them all in one dated config file (e.g. `age-pension-rates-2024-25.json`) from day one.

---

## Engine Edge Cases — Australian Rules a Naive Model Gets Wrong

These are the traps that separate a real Australian engine from a toy. Each is a hard backend rule, not a UI concern — get one wrong and the projection is confidently incorrect at exactly the moments that matter most.

### 1. The home-downsize pension trap ⚠️
When a user sells their home to downsize, the surplus proceeds are **exempt from the Assets Test for up to 24 months** (if intended to buy/build a new home) — **but** during that window they **are** deemed under the **Income Test**, at the **lower deeming rate only**.

- **Naive model error:** counts the cash as an asset the day of sale → shows a false, immediate Age Pension drop.
- **Correct behaviour:** the engine holds home-sale proceeds in a **temporary state** — *assets-test exempt + income-test deemed (lower rate)* for ≤24 months — then moves them to normal treatment. The Downsize life-event must set this flag.

### 2. Super Transfer Balance Cap (TBC) — strictly per person 🔴
The TBC (currently **$1.9M**, indexed) is a **lifetime, per-individual** cap on how much super can move from accumulation into the tax-free **pension** phase. It is **never** applied to the household total.

- **Example:** a couple with $3M split $2.5M / $500K. Person 1 **cannot** flip all $2.5M to pension — only $1.9M. The remaining **$600K stays in accumulation**.
- **Why it cascades:** that $600K's earnings are taxed at **15%** (not 0%), and only the **pension-phase portion** is subject to the minimum-drawdown schedule. So the cap changes the **tax layer *and* the drawdown**, not just a label — and it's why couples with lopsided super are structurally worse off than evenly-split couples (something the tool can *show*, never *advise*).

### 3. Deeming applies to account-based pensions too
Under the Income Test, financial assets (cash, shares) are **deemed** — assessed at a set rate regardless of actual return. Critically, **account-based super pensions started on/after 1 Jan 2015 are deemed as well** (pre-2015 grandfathered; deeming-applies is the correct forward-looking default).

- **Correct behaviour:** once super flips to pension phase, its **whole balance joins the deeming pool** for the Income Test — even though the money drawn is tax-free to the individual. Moving super to pension phase does **not** reduce Income-Test assessment.
- **Sibling rule (the other classic error):** super in **accumulation, while the owner is *under* Age Pension age, is exempt from *both* tests entirely** — then becomes assessable the moment they reach Age Pension age. The engine must switch a person's super from "invisible to Centrelink" to "fully assessed" at that birthday.

> All three are driven by the same dated reference data as the rest of the pension logic — thresholds, deeming rates, the TBC and its indexation all live in the config file, never hard-coded.

---

## What Each Year Records

Every year in the projection keeps the **full breakdown**, not just totals — so the app can draw the three-layer stacked chart and write the plain-English callouts. For each year we hold:

- **Year and age(s)**
- **Living need** — the inflation-indexed spending target
- **Income** — split by source: salary, net rent, dividends + franking, interest, business, super pension, Age Pension, annuity
- **Tax** — split by type: income tax, Medicare, CGT, super earnings tax, contributions tax, offsets
- **Drawdown** — split by source: cash, share sales, super lump sum, property sale
- **Age Pension detail** — whether it started this year, the start age, and which test is binding
- **Surplus or shortfall**, and **closing net worth**

---

## How It All Fits Together (conceptual)

The product is one **projection engine** wrapped in a simple flow. The same engine drives the on-screen views and the PDF report — everything the user sees is just a picture of the year-by-year results.

```
   INPUTS              ASSUMPTIONS            ENGINE                 OUTPUTS
 (the wizard)   →    (which scenario)   →   (year by year)   →   (what they see)

 • Property          Conservative 🛡        For each year:        • Net-worth timeline
 • Super             Balanced   ⚖           grow assets           • Money-sourcing bars
 • Shares            Growth     🚀           collect income        • Tax-collapse view
 • Cash                                      test Age Pension      • Age Pension callout
 • Business          growth / inflation      work out tax          • Full projection PDF
 • Other assets      spending target         fund any shortfall
 • Income sources    drawdown order          record the year
 • Age & goals
```

**The idea in one paragraph:** the tool ages the household one year at a time. Each year it grows the assets, adds up the income, checks whether the Age Pension has kicked in, works out the tax, and — if income doesn't cover the spending need — draws from the right assets to fill the gap. It writes down exactly where every dollar came from and what was paid in tax, then rolls the balances into the next year. Do that to age 90 and you have the whole picture.

**A few things that stay true throughout:**
- **The three scenarios are the same engine with different assumptions** — Conservative, Balanced and Growth differ only in their growth, inflation and stress-test numbers.
- **What-if is just "run it again" with one thing changed** — sell a property, retire earlier, spend more — and compare against the base plan.
- **The Australian numbers (tax, pension thresholds, super rules) change over time**, so they're treated as dated reference data that gets updated, kept separate from the projection itself.

---

## Sample Scenario — The Nguyen Household

A concrete end-to-end walk-through used as the reference case for the whole product.

### Inputs

**People**
- David, 62 — plans to retire at **65**
- Sarah, 60 — plans to retire at **63**
- Homeowners, 10+ years residency, planning to **age 90**
- Target retirement spending: **$90,000/yr** (today's dollars, inflation-indexed)

**Assets**

| Asset | Value | Income | Notes |
|---|---|---|---|
| Family home | $1,400,000 | — | Paid off, **exempt** from pension assets test |
| Investment property | $750,000 | $22,000 net rent | Mortgage $180k remaining |
| David — Super | $620,000 | — | Accumulation → pension at 65 |
| Sarah — Super | $410,000 | — | Accumulation → pension at 63 |
| Shares / ETFs | $340,000 | $14,000 franked div | Cost base $220k → $120k unrealised gain |
| Cash / savings | $85,000 | ~$3,000 interest | Buffer + offset |
| **Total (ex-home)** | **$2,205,000** | | Assessable base for pension |

**Balanced scenario assumptions:** equities 7%, property 5%, inflation 2.5%, drawdown order = lowest-tax-first.

### Year one, step by step (age 62, still working)

Here is how the tool thinks through the **very first year** — in plain English, no maths shown to the user:

1. **Grow the assets.** A year passes. Super, shares and property each grow at the Balanced assumptions; rent and dividends are received along the way.
2. **Add up the income.** David and Sarah are both still working, so **salary is the main source**, topped up by net rent (~$22k), dividends plus franking credits (~$14k) and a little interest (~$3k).
3. **Check the Age Pension.** Both are under 67 → **not eligible**. Nothing from Centrelink this year.
4. **Work out the tax.** This is a high-tax year: full marginal rates on two salaries plus rent, and 15% tax inside super on contributions. **Total tax ≈ $48,000** — the biggest single outgoing of their year.
5. **Cover the spending, then save the rest.** Their living costs are comfortably met by salary, so there is **no shortfall and nothing is sold**. The leftover is a **surplus that gets reinvested**.
6. **Write down the year and roll on.** Net worth *rises*. The balances carry into age 63.

**Conceptual output — the "year one card":**

```
  AGE 62 · STILL WORKING · Balanced ⚖

  MONEY IN                         WHERE IT GOES
   Salary (David + Sarah)  ▓▓▓▓▓    Living costs      ▒▒▒
   Net rent                ▓▓        Tax (~$48,000)   ████
   Dividends + franking    ▓         Reinvested surplus ░░░
   Interest                ·

   Age Pension:   not yet (under 67)
   Assets sold:   none — income covers everything
   Net worth:     ▲ rising      Estate track: on target
```

The shape of this card is the story of the whole product: in year one the bars are dominated by **salary in** and **tax out**. Fast-forward past retirement and salary vanishes, the tax bar collapses to almost nothing, and new colours — super pension, then Age Pension — grow to take its place. The next table shows those turning points.

### What the engine reveals

| Age | Living need | Income sources | Tax | Drawdown | Age Pension | Net worth |
|---|---|---|---|---|---|---|
| 62 (working) | — | Salary + rent + div | **~$48,000** | reinvest surplus | $0 | $3.6M |
| 65 (both retiring) | $92,000 | Rent + div + super pension | **~$1,200** | $9k shares | $0 | $3.7M |
| 71 | $107,000 | Rent + super pension + **part Age Pension** | **~$800** | $18k shares | **$5,100** | $3.4M |
| 78 | $128,000 | Super pension + rent + Age Pension | **~$600** | $40k mixed | **$21,300** | $2.9M |
| 86 | $156,000 | Super pension + **full Age Pension** | **$0** | property sold at 84 | **$45,000** | $2.4M |
| 90 (plan end) | $172,000 | Age Pension + super | **$0** | super drawdown | **$45,000** | **$2.1M estate** |

**Three headline callouts the tool produces for this household:**

> 🛡 **"Your money lasts well beyond 90 — estate value ~$2.1M in the Balanced scenario."**

> 💸 **"Your tax bill collapses from ~$48,000/yr while working to near $0 in retirement."**

> 🏦 **"Age Pension is projected to begin at age 71 (~$5,100/yr) and reach the full ~$45,000/yr by 86 — earlier if you spend the investment property down sooner."**

---

## Sample Screens (wireframes)

Low-fidelity layouts to align on structure before visual design. Navy / white / one accent (gold or teal), calm and serious — not gamified.

### Screen 0 — Quick start (the true first screen — enter your age, get a projection)

```
┌────────────────────────────────────────────────────────────┐
│  MyWealthProjection · Model it before you live it          │
│────────────────────────────────────────────────────────────│
│                                                            │
│   Let's see your future. Start with one thing:             │
│                                                            │
│              Your age   [  62  ]                           │
│                                                            │
│              [  Show me my projection ▶  ]                 │
│                                                            │
│   ─ optional, makes it closer ─────────────────────────    │
│   Total assets  [ ~$430k~ ]     Target spend  [ ~$70k~ ]   │
│      ~we've guessed these from your age — change if wrong~ │
│                                                            │
│   …or  [ Explore a sample household ]  first               │
└────────────────────────────────────────────────────────────┘
        │
        ▼  age alone → a plausible "typical Australian" is built
           (super, salary, home, savings) and the timeline appears.
           Every number is an editable guess you nudge from there.
```

### Screen 1 — Input tabs (all pre-filled; refine what you like)

```
┌────────────────────────────────────────────────────────────┐
│ ⚙Household│Property│▎Super▐│Investments│Cash│Income│Debts   │
│─────────── Net worth: $2,205,000 ·  Confidence ▓▓▓▓░░ 62% ─│
│                                                            │
│   🏦  Super & Pensions                        [ + Add ]     │
│   ┌──────────────────────────────────────────────────┐    │
│   │ David    $620,000   Pension phase at 65    ✎  🗑 │    │
│   │ Sarah    $410,000 ~estimated~              ✎  🗑 │    │
│   └──────────────────────────────────────────────────┘    │
│                                                            │
│   Whose super?  [ David ▾ ]   Type [ Accumulation ▾ ]      │
│   Balance       [ $620,000 ]   ( )Accum (•)Pension (SMSF)  │
│   Employer contrib [ 11.5% ] ~default~   To pension [ 65 ] │
│                                                            │
│   ▸ Values marked ~estimated~ are our guesses — correct    │
│     any of them and the timeline updates instantly.        │
└────────────────────────────────────────────────────────────┘
```

### Output principle: ANSWER first, dashboard second

The user came for a *sentence*, not a dashboard — *"am I going to be OK?"* So the output is **two layers**, mirroring the answer-first design of the input:

1. **The Answer (top, always visible):** a plain-language verdict + two or three numbers. Most users never need to scroll past this. This is the payoff — it must not be buried under a chart.
2. **The Timeline (below, for anyone who wants to dig):** the interactive three-lens chart + scrubber. Optional exploration, not the front door.

> **Why:** stacked bars and lens-toggles are *analyst* tools; leading with them makes a novice do work to extract an answer that should be handed to them. Answer first fixes the one place the system was novice-hostile.

### Screen 2a — The Answer (the real front door)

```
┌────────────────────────────────────────────────────────────┐
│ The Nguyen Household        🛡 ⚖ 🚀    [What if…]  [PDF]    │
│════════════════════════════════════════════════════════════│
│                                                            │
│   ✓  You're on track.                                       │
│                                                            │
│   You can retire at 65. Your money lasts beyond 90,        │
│   leaving an estate of about $2.1M. The Age Pension        │
│   tops you up from age 71.                                 │
│                                                            │
│   Retire      Money lasts      Estate at 90                 │
│    65 ✓         to 90+ ✓          ~$2.1M                    │
│                                                            │
│   [ See where the money comes from, year by year ▼ ]       │
└────────────────────────────────────────────────────────────┘
```

The verb sets the tone: **"You're on track" / "You run short at 84" / "It's tight"** — the emotional answer in three words, before any number. The chevron opens the timeline below for those who want detail.

### Screen 2b — The interactive timeline (opens below the Answer · Net Worth lens)

```
┌────────────────────────────────────────────────────────────┐
│ The Nguyen Household    🛡 ⚖ 🚀    [What if…]  [Export PDF] │
│────────────────────────────────────────────────────────────│
│  ✓ Retire at 65   ·   Tax ~$0 in retirement   ·   Pension 71│
│────────────────────────────────────────────────────────────│
│  Lens:  [▎Net worth▐] [ Money in ] [ Tax ]                  │
│                                                            │
│  $4M ┤              ______------______                      │
│  $2M ┤   ______-----                  -----____             │
│      └────┬────┬────┬────┬────●────┬────┬────┬──▶           │
│         62   66   70   74  [71] 78   82   86   90           │
│      ◀───────────────── drag me ─────────────────▶          │
│────────────────────────────────────────────────────────────│
│  AT AGE 71:  net worth $3.4M  ·  drawing $107k  ·  tax $0.8k│
└────────────────────────────────────────────────────────────┘
```

### Screen 3 — Same screen, "Money in" lens (the hero)

The toggle flips only the chart; the callouts, scrubber and detail panel stay put.

```
┌────────────────────────────────────────────────────────────┐
│  Lens:  [ Net worth ] [▎Money in▐] [ Tax ]                  │
│  each bar = one year's spending need, by source            │
│ $160k┤                                        ▓▓▓▓ Age Pension│
│ $120k┤                    ▓▓▓  ▓▓▓  ▓▓▓  ░░░  ░░░░ Super pension│
│      │        ░░░  ░░░  ░░░  ░░░  ░░░  ░░░  ▒▒▒▒ Rent / div  │
│  $80k┤  ▒▒▒  ▒▒▒  ▒▒▒  ▒▒▒  ▒▒▒  ▒▒▒  ▒▒▒  ████ Asset sale  │
│      └──┬────┬────┬────●────┬────┬────┬──▶                  │
│        65   70   75  [71] 80   85   90                       │
│────────────────────────────────────────────────────────────│
│  AT AGE 71 — you need $107,000 ( $99k living + $8k tax )    │
│   MONEY IN                        FUNDED BY                  │
│    Net rent          $24,000       income covers $90,100    │
│    Dividends+frank.  $15,000       shortfall     $16,900    │
│    Super pension     $46,000       → sell ETFs   $16,900    │
│    Age Pension (part) $5,100          (lowest-tax source)   │
│  ▸ Age Pension started this year: assessable assets fell    │
│    to $980k, under the $1.045M couple cut-off.              │
└────────────────────────────────────────────────────────────┘
```

### Screen 4 — Same screen, "Tax" lens

```
┌────────────────────────────────────────────────────────────┐
│  Lens:  [ Net worth ] [ Money in ] [▎Tax▐]                  │
│  the tax you pay each year — watch it collapse at retirement│
│ $56k ┤ ███                                                  │
│ $40k ┤ ███ ███                                              │
│ $20k ┤ ███ ███ ███                                          │
│      │ ███ ███ ███ ▁   ▁    ▁    ·    ·    ·    ·           │
│      └──┬────┬────┬────┬────●────┬────┬────┬──▶             │
│        62   64   66   68  [71] 74   78   82   90            │
│────────────────────────────────────────────────────────────│
│  AT AGE 71 — total tax $800:  income tax $1,900 · franking  │
│  credits −$1,700 · CGT on ETF sale $600 · super earnings $0 │
└────────────────────────────────────────────────────────────┘
```

### Screen 5 — What-if panel (instant re-run)

```
┌────────────────────────────────────────────────────────────┐
│  WHAT IF…                                    ⚖ Balanced      │
│────────────────────────────────────────────────────────────│
│  Sell investment property at   [ age 75 ▾ ]   [ ✓ on ]     │
│  Retire earlier                [ age 63 ▾ ]   [   off ]     │
│  Spend extra per year          [ +$10,000 ]   [ ✓ on ]     │
│  Market crash −30% in          [ year 3  ]    [   off ]     │
│  Downsize home at              [ age 80 ▾ ]   [   off ]     │
│                                                            │
│  IMPACT vs base plan:                                       │
│   Estate at 90      $2.1M  →  $1.6M   ▼ $500k              │
│   Age Pension starts  71   →   68     ◀ 3 yrs earlier      │
│   Money lasts to     >90   →   >90    ✓ still safe         │
│                                                            │
│                                    [ Reset ]   [ Save plan ]│
└────────────────────────────────────────────────────────────┘
```

---

## Functional Overview (high level) — What / Input / How

A single-page summary of scope, before any build. Deep detail for each part lives in the sections above.

### 1. What the product does

- **Generates a complete starting projection from one input (age)** using Australian averages, so the user sees a result immediately.
- **Lets the user refine any part** of their picture through optional, pre-filled tabs — nothing is required, everything is editable.
- **Projects the household forward one year at a time**, to a chosen plan-end age.
- **Presents it as one interactive timeline** with three lenses of the same years: **Net Worth**, **Money In** (where each year's money comes from), and **Tax**.
- **Answers the core life questions:** Can I retire, and when? Will my money last? When — if ever — does the Age Pension start, and how much? What's my estate worth?
- **Runs three scenarios** (Conservative / Balanced / Growth) to show a *range*, not a false single number.
- **Offers structural what-if levers** (retire later, spend less, sell/downsize *your own* assets) with instant re-run — never product recommendations.
- **Exports a PDF** and **saves the plan** (sign-up only to save, not to try).

### 2. What data has to be entered

| Group | Fields | Required? | Where the default comes from |
|---|---|---|---|
| **Identity** | Age | **Yes — the only required input** | — |
| **Seeded assets** | Super balance, salary, home value, savings | No | Australian averages for that age (ATO/ASFA/ABS) |
| **Assumptions** | Inflation, asset-class growth, effective tax rate, deeming, super contribution % | No | Sensible AU defaults (all editable, all labelled *estimate*) |
| **Goals** | Retirement age, target yearly spend, plan-to age | No | Derived from age; user adjusts |
| **Asset detail (per tab)** | Property, Super, Shares/ETFs, Cash, Business, Other, Income | No | Whatever was seeded — user corrects only what matters |

The principle: **age gets a projection; everything else only makes it *closer*.**

### 3. How it calculates (high level)

The engine **ages the household one year at a time** to the plan-end age. Each year runs the same sequence:

1. **Grow** each asset by its scenario assumption; collect the year's rent, dividends, interest.
2. **Collect income** (sources 1–8): salary until retirement, forced super minimum drawdown once in pension phase, etc.
3. **Test the Age Pension** — run the assets test and income test, take the lower result.
4. **Estimate tax** as an assumed effective rate on the year's assessable income + any realised CGT.
5. **Fund the year:** if income doesn't cover living need + tax, draw from the waterfall (lowest-tax-first) — selling an asset realises CGT, which nudges tax, so it settles over 2–3 passes.
6. **Record the year** (full breakdown) and carry balances into the next.

The whole thing rests on a handful of **Australian calculation modules**, each driven by *dated reference data*, not hard-coded logic:

- Super phase transition + age-banded minimum drawdown
- Age Pension means test (assets vs income, with deeming)
- Effective-tax estimate (income tax, franking, CGT, super phases) — *presented as an assumption, not a precise figure*
- CGT on asset sales (50% discount)
- Inflation indexing of spending and thresholds
- The drawdown waterfall

**Scenarios** are the same engine with three assumption sets. **What-if** is the same engine re-run with one input changed — and because comparisons cancel the assumptions, the *difference* between two runs is the robust, meaningful output.

---

## Key Features (MVP)

- [ ] Tabbed asset input (Assumptions tab + one tab per asset class) — skip any tab that doesn't apply
- [ ] **Couples / joint household** (two people, per-person super & income) — core to the target market
- [ ] **Answer-first output** — plain-language verdict up top, interactive timeline below
- [ ] **"Which assumptions matter" hint** — flags the 2–3 knobs that actually move the result
- [ ] Single interactive timeline output (Net worth / Money in / Tax lenses)
- [ ] Scrubber + live year-detail panel
- [ ] Three scenarios (Conservative / Balanced / Growth)
- [ ] "What if" toggle panel (sell property, retire early, etc.)
- [ ] Income taper + self-employed income (semi-retirement, sole traders)
- [ ] Super phase modeller (accumulation → pension transition)
- [ ] Age Pension eligibility tracker (assets test + income test)
- [ ] PDF export of full projection report
- [ ] Save and return (account-based)
- [ ] Mobile friendly

## Key Features (V2)

- [ ] Bank feed / ATO pre-fill integration
- [ ] Super fund API connection (live balance)
- [ ] Property valuation API (CoreLogic or Domain)
- [ ] Share portfolio import (broker CSV)
- [ ] Family trust tax modelling
- [ ] CGT calculator per asset
- [ ] Advisor referral marketplace (fee-for-service only)
- [ ] Multi-user family mode (4+ people, e.g. adult children) — *basic couples is now MVP*

---

## Monetisation

| Tier | Price | Features |
|---|---|---|
| Free | $0 | Basic net worth + single projection |
| Pro | $29/month | All three scenarios, what-if modelling, PDF export |
| Family | $49/month | Joint planning, trust modelling, up to 4 users |
| Advisor | $199/month | White-label, client management, bulk projections |

---

## Safe by Design — We Never Recommend Products

The core safety guardrail — and the reason the product is safe for the general public — is a single rule:

> **The app never recommends an actual financial product.** It models levers over assets the user already owns or explicitly hypothesises; it never tells anyone what to buy, sell into, or switch to.

| ✅ What the app does (structural levers) | ❌ What the app never does (product advice) |
|---|---|
| "What if you retire two years later?" | "Buy this ETF / these shares" |
| "What if you spend $5k less a year?" | "Switch to this super fund" |
| "What if you sell *your* investment property at 75?" | "Move your money into X" |
| "What if you salary-sacrifice more into super?" | "You should invest in…" |
| Show *your own* numbers, scenarios, and timing | Recommend, rank, or place any product |

Because it never points a member of the public at a specific product or tells them what to do, **it can't lead anyone into a bad investment** — which is exactly the harm the personal-advice / AFSL regime exists to prevent. The safety guarantee and the legal position are the same thing:

- It stays a **modelling tool**, not personal financial advice → **no AFSL needed** (subject to legal review).
- Every "what if" offers **levers, not products** — so a worrying result gives the user *agency*, never a nudge toward something that could harm them.
- It builds **trust**: users know the tool isn't secretly steering them to sell them something.

> ⚠️ The V2 "advisor referral marketplace" is the one place this line could blur — it must be strictly fee-for-service, clearly disclosed, and kept separate from the projection itself, or it undermines the whole safety position.

### Assumption Guardrails (five rules for whoever builds it)

Using generic rates like "super grows at 8.5%" or "savings at 5.25%" is safe **as an assumption**, not a recommendation — this is exactly what the generic-calculator lane permits. **This applies to tax too**: present tax as an *assumed effective rate the user can see and change*, never as a precise ATO calculation — implying accuracy invites reliance, and reliance creates liability. Every rate — growth, interest, and tax — is an assumption, not a computed promise. It stays safe only if all five hold:

1. **State it as an assumption, never a prediction or a precise calculation.** "Assumed growth 8.5%" / "assumed effective tax ~28%" ✅ — never "your super *will* grow 8.5%" or "your tax *is* $51,600." No guarantee language, no false precision.
2. **Show it and let the user change it.** Visible + editable assumptions are a *condition* of the relief. The Assumptions tab already does this.
3. **Never name, link, promote, or rank a product.** Asset *class* is fine ("growth super," "term deposits"); a *provider* is not.
4. **Keep defaults reasonable and defensible** — tied to long-run asset-class averages, not cherry-picked to flatter. (This one bites even with no product named — see below.)
5. **Warn on every output** — "estimate only, actual returns vary, not financial advice."

| ✅ Safe (assumption) | ❌ Crosses the line |
|---|---|
| "Assumed super growth **8.5%** (editable)" | "Switch to [Fund] — it returns 8.5%" |
| "Assumed savings rate **5.25%**" | "[Bank] offers 5.25% — move your cash there" |
| "Growth super vs. balanced super" (categories) | Naming, linking, or ranking specific products |

### The actual liability shield: correct maths + honest defaults

The disclaimer and the no-product rule protect you from the user's **investment** losses — if their fund collapses, the tool never named or chose it, so the causal chain is broken and that suit is weak. But two exposures remain that are **not** "the user's risk" and cannot be disclaimed away:

- **Calculation bugs.** If the engine computes tax or the pension trigger wrong and someone relies on it, that's *your defect*, not the user's assumption. **Engine correctness is a legal asset, not just a quality one** — reconciling and testing the tax/pension maths is the real shield.
- **Misleading defaults (Australian Consumer Law).** Misleading conduct *cannot* be disclaimed. A flattering default (e.g. 8.5% chosen to make everyone look rich) is a problem even with no product named. Defaults must be defensible.

> The residual risk was never "the fund collapsed." It's "our code was wrong" or "our defaults were rosy" — both fully in our control. Standard **professional indemnity insurance** covers the "someone sues anyway" case and is a normal line item.

---

## Legal / Compliance Notes

- Product must be positioned as a **modelling and projection tool**, not financial advice (see *Safe by Design* above — the no-product-recommendation rule is what underpins this)
- **ASIC Corporations (Generic Calculators) Instrument 2016/207** is the on-point relief to sit inside — calculators that recommend no specific product and disclose assumptions + warnings. *(The older CO 05/1122 general-advice exemption is superseded — cite 2016/207.)*
- Disclaimer on every output: *"This is a projection model, not financial advice. Past performance is not indicative of future results. Consult a licensed financial advisor before making investment decisions."*
- AFS Licence likely **not** required if product gives no personalised recommendations and recommends no products — legal review needed before launch
- Privacy Act compliance required for financial data storage
- CDR (Consumer Data Right) registration if pursuing open banking integration

---

## Competitive Landscape

| Product | Country | Gap |
|---|---|---|
| ProjectionLab | USA | Not Australian (no super, CGT, Age Pension) |
| Sorted | NZ | Budgeting only, no investment modelling |
| Pocketbook | AU | Budgeting only |
| Moneysmart | AU | Government tool, very basic |
| Sharesight | AU | Shares only, no property or super |
| **MyWealthProjection** | AU | **All assets, all scenarios, Australian tax** |

---

## Brand

**Name:** MyWealthProjection  
**Domain:** mywealthprojection.com / mywealthprojection.com.au  
**Tagline:** *Model it before you live it*  
**Tone:** Confident, clear, not flashy — like a smart friend who knows finance  
**Colours:** Deep navy + clean white + one strong accent (gold or teal)  
**Audience feel:** Trusted tool for serious people, not a gamified app  

---

*Document version 0.1 — internal working draft*