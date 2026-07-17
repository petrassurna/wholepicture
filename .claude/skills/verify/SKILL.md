---
name: verify
description: Launch and drive the WholePicture SvelteKit app to observe a change working end-to-end — especially the /model page's chart and Calculations self-check panel.
---

# Verifying WholePicture

The product is a chart-first retirement model. The domain (`src/lib/domain/`) is pure
and unit-tested, but **unit tests are not verification** — the surface is the `/model`
page, and the highest-value evidence is the **Calculations panel**, which recomputes
every year independently and marks each one `✓` (matches the graph) or `≠`.
A domain change that reconciles across every year in that table is genuinely verified;
one that shows `≠` is broken even if the tests pass, because the panel and the engine
are separate implementations that must agree.

## Launch

```bash
npm run dev -- --port 5199        # background it; ready in ~2s
```

No browser driver is installed. Add one temporarily and **uninstall it when done**
so it doesn't land in `package.json`:

```bash
npm i -D playwright && npx playwright install chromium
# ... drive ...
npm uninstall playwright          # restores package.json + package-lock.json
```

Scripts outside the repo can't resolve the module — import it by absolute path:

```js
import { chromium } from 'file:///C:/Yart/Clients and Jobs/WholePicture/wholepicture/node_modules/playwright/index.mjs';
```

## Driving /model — the gotchas that cost time

1. **A disclaimer modal blocks everything.** Dismiss first:
   `await page.getByRole('button', { name: 'I understand' }).click()`
2. **Input sections are collapsed** behind accordion buttons ("You ›",
   "Superannuation ›", "Spending …/yr ›", "Bank/investment accounts ›", "Income in
   retirement ›", "Assumptions ›"). Only "You" starts open — click the section
   button before its fields exist in the DOM.
   `page.getByRole('button', { name: /^Superannuation/ }).click()`
3. **Fields by id, once their section is open:** `#agenow`, `#retire`, `#planto`,
   `#super`, `#ret`, `#fees`, `#bank-amt-0`, `#bank-rate-0`.
   Bank accounts need `+ Add account` clicked first.
4. **`#spend` only exists when there are no spending line items.** The default plan
   ships an itemised budget (~$52,200/yr), so `#spend` is absent — either clear every
   item or just work with the default total.
5. **"Show calculations" is a checkbox label, not a button** —
   `page.getByText('Show calculations').click()`. Then `Step` / `Table` buttons.
6. Svelte 5 runes don't always react to a bare Playwright `fill` — dispatch `input`
   and `change` after it.

## What to read

- **Table view** → `table tbody tr`, last cell is `✓` or `≠`. **Every row must be `✓`.**
- **Step view** → `.calc-box` innerText gives the full year's arithmetic with real
  numbers, including the per-account "Before growth / Grows / Closing" table. This is
  where you see *which account funded the year* — the totals in Table view can hide a
  wrong split.

## Scenarios worth driving for drawdown changes

Retired now (`#agenow` = `#retire` = 67) so drawdown starts immediately, then:

- **Need above super's minimum** — super $800k (5% min = $40k) + bank $400k vs the
  default $52,200 spend. Expect super to draw exactly its $40k minimum and the bank to
  fund the $12,200 shortfall.
- **Minimum above the need** — super $1.5M (5% min = $75k) vs $52,200 spend. Expect
  $22,800 set aside and the **bank untouched**.

Both must reconcile every year.
