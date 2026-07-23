/*
 * config.js — the ONLY place to change who this dashboard tracks and the rate.
 *
 * Everything user-facing (partner name, hourly rate, currency, project label)
 * lives here so nothing is hardcoded deep in logic. Change a value, reload the
 * page, and the whole UI + cost math follows.
 */
window.CONFIG = {
  // Who the hours are being tracked for.
  partnerName: "Stephanie Rincon",

  // Short label used in tight UI spots (headings, exports).
  partnerShort: "Stephanie",

  // The engagement this work belongs to.
  projectName: "Playmaker",

  // Billing rate. total owed = hours * hourlyRate.
  hourlyRate: 120,

  // Currency for display only (no FX / no real money is ever moved here).
  currency: "USD",
  currencySymbol: "$",

  // localStorage key. Bump this to start a fresh ledger without touching code.
  storageKey: "stephanie-hours-dashboard.v0",

  // ---- Access control ------------------------------------------------------
  // The page is auth-gated with SOMA Auth (see login.html). Only signed-in
  // users reach it. `allowedEmails` further restricts WHO among signed-in SOMA
  // users may view the ledger. Leave EMPTY ([]) to allow any authenticated
  // SOMA user; list emails to restrict to exactly those people.
  //
  // Seeded with Mike only because Stephanie's email is not yet on file. To give
  // Stephanie access, add her email to this array and redeploy — one line, done.
  // Signed-in users not on the list see a "not authorized" panel, never the data.
  allowedEmails: [
    "mw@mike-wolf.com",
    "team@ekcosystem.com",  // Stephanie Rincon
  ],
};
