# Stephanie's Hours & Work Dashboard

A clean, manual-entry dashboard to log hours and see running totals + cost for
**Stephanie Rincon** on the **Playmaker** engagement ($120/hr).

**Live (access-gated):** https://stephanie-hours-dashboard.netlify.app

Manual-entry tool: log entries (date, hours, description); it computes total
hours and total owed (hours × rate) and filters by date range. The page is
gated with **SOMA Auth** — only signed-in, allow-listed people reach the ledger.

> Origin: Trello card (Playmaker board) — "Mike to build dashboard for
> Stephanie's hours/work." Per SOMA doctrine the fleet does the building.
> Built 2026-07-23 by Claude (CCc) for Mike Wolf; hardened + deployed the same
> day. No real payment or bank data is touched — it only records time and
> computes what is owed.

## Auth & access control

- **SOMA Auth** (shared Supabase project `omfwcodoimjmbrhssvfl`), using the
  reference runtime `js/soma-auth.js` copied **verbatim** from
  `legends-membership-site`. Per-app config in `js/soma-auth-config.js`.
- Sign-in methods: **magic link**, **Google**, **email + password** (`login.html`).
- **Who gets in:** `config.js` → `allowedEmails`. Signed-in users NOT on the list
  see a "not authorized" panel, never the data. Currently seeded with Mike only
  (`mw@mike-wolf.com`) because Stephanie's email isn't on file yet — **add her
  email to that array and redeploy to grant her access** (one line). Set the
  array to `[]` to allow any authenticated SOMA user.
- **Feedback chip** (`soma-feedback`, SOMA App Standard §8) is vendored in
  `vendor/soma-feedback/` and loaded on both pages.

## Deploy

Netlify site `stephanie-hours-dashboard`, GitHub CI/CD wired
(`eldrgeek/stephanie-hours-dashboard`, `master`) — `git push` auto-deploys.
Static, no build step (`netlify.toml`: `publish="."`, empty command). After any
deploy, run `python3 ~/Projects/SOMA/tools/ship/soma-ship-check.py
https://stephanie-hours-dashboard.netlify.app --pages /login.html`.

## Stack & why

- **Zero-build static site**: plain HTML + CSS + vanilla JS. No `npm install`,
  no bundler, no backend. Open the file and it runs.
- **Why not the full SOMA house stack** (Vite + React + TS + Tailwind +
  Supabase, per `soma-app-template`)? That stack's data layer *is* Supabase —
  a real data source we explicitly do not have for hours yet, and the task
  called for a self-contained, locally-runnable v0 with a data model that is
  trivially swappable later. A static app with an isolated `Store` seam is the
  most reversible choice: it can graduate onto the house stack (or a Google
  Sheet, or a real time-tracking API) by replacing one file.
- **SOMA visual conventions honored**: dark navy palette (`theme-color
  #0f1222`, matching `soma-app-template/index.html`), same card/panel language.

## Run it

Either:

```bash
# Simplest — open directly:
open index.html            # macOS

# Or serve it (identical result, avoids any file:// quirks):
cd stephanie-hours-dashboard
python3 -m http.server 8000
# then visit http://localhost:8000
```

No dependencies to install.

## Configure (name + rate — not buried in logic)

Everything person/rate/project-specific lives in **`config.js`**:

```js
window.CONFIG = {
  partnerName: "Stephanie Rincon",
  partnerShort: "Stephanie",
  projectName: "Playmaker",
  hourlyRate: 120,          // total owed = hours * hourlyRate
  currency: "USD",
  currencySymbol: "$",
  storageKey: "stephanie-hours-dashboard.v0",
};
```

Change a value, reload — the whole UI and cost math follow.

## What it does

- **Log entry**: date, hours (0.25-hour steps), task/description.
- **Running totals**: entry count, total hours, total owed — all respect the
  active filter.
- **Date-range filter**: From / To; totals + export recompute to the range.
- **Edit / delete** any entry.
- **Export CSV**: current view → `stephanie-hours-<date>.csv` (columns: date,
  hours, description, rate, owed, plus a TOTAL row). This is the intended bridge
  to `business-ops/LEDGER.csv` when hours become billable records.

## Data model & storage

Each entry:

```
{ id, date: "YYYY-MM-DD", hours: number, description: string, createdAt: ISO }
```

Persisted to browser **localStorage** (key from `config.js`). Data lives only in
the browser it was entered in — nothing is synced or transmitted. Clearing
browser data clears the ledger; use **Export CSV** to keep a durable copy.

## The swappable seam

`store.js` is the **only** file that knows where data lives. The UI (`app.js`)
talks solely to `window.Store`:

```
Store.list()  Store.add(entry)  Store.update(id, patch)
Store.remove(id)  Store.replaceAll(rows)
```

Keep that interface and you can back it with anything.

## Path to v1 (the real data source)

v0's honest limitation is that hours are typed in by hand. v1 needs a real
source. In rough order of leverage:

1. **Shared persistence** — swap `store.js` to the shared SOMA Supabase project
   (see `soma-app-template` for the Auth + RLS pattern, and
   `reference_supabase_access`). Gives Stephanie and Mike the same ledger from
   any device, with SOMA Auth gating writes.
2. **Real hours ingestion** — replace manual entry with an actual source:
   Playmaker activity, a time-tracking integration, or approved timesheets.
   Manual entry becomes the correction/override path, not the primary input.
3. **Approval + invoice flow** — Mike approves periods; export a ledger line to
   `business-ops/` and generate an invoice. (Still no money moved by this tool.)
4. **SOMA App Standard affordances** — ✅ done: vendored `soma-feedback` chip is
   live on both pages; passes `soma-ship-check`.

## Storage model (and why)

**localStorage, behind the auth gate** — deliberately, for now. Each browser
holds its own ledger; entries are not shared between Mike and Stephanie yet.
Shared Supabase persistence (item 1 above) is the honest next step but was left
for v1 rather than shipped half-done: doing it correctly needs a table + RLS
policy scoped to exactly Mike + Stephanie's Supabase user identities, and
Stephanie's email/account isn't on file to build or test that gate against. The
`Store` seam (`store.js`) is the single file to swap when that lands. Until then,
**Export CSV** is the durable, shareable copy.

## Self-assessment

**DONE — live and gated.** Deployed to
https://stephanie-hours-dashboard.netlify.app, auth-gated with SOMA Auth
(only allow-listed signed-in users see the ledger), feedback chip present,
`soma-ship-check` passes all hard checks. Add/edit/delete entries, live totals,
date filter, configurable name/rate/allow-list, CSV export all work with no
build step.

**Remaining (v1):** (a) shared Supabase persistence so Mike & Stephanie see one
ledger — see "Storage model"; (b) add Stephanie's real email to
`config.allowedEmails` to grant her access; (c) a real (non-manual) hours source.
