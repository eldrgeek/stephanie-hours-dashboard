/*
 * app.js — UI logic. Talks only to window.Store and window.CONFIG.
 * No backend, no build step. Reads config for all labels + rate math.
 */
(function () {
  const C = window.CONFIG;
  const S = window.Store;

  // ---- money / number formatting -----------------------------------------
  const money = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: C.currency,
  });
  const fmtHours = (h) => Number(h).toFixed(2);

  // ---- element refs --------------------------------------------------------
  const el = (id) => document.getElementById(id);
  const form = el("entry-form");
  const fDate = el("f-date");
  const fHours = el("f-hours");
  const fDesc = el("f-desc");
  const fFrom = el("f-from");
  const fTo = el("f-to");
  const body = el("entries-body");
  const foot = el("entries-foot");

  // ---- static labels from config ------------------------------------------
  function applyConfigLabels() {
    el("eyebrow").textContent = `SOMA · ${C.projectName}`;
    el("title").textContent = `${C.partnerShort}'s Hours & Work`;
    el(
      "subtitle"
    ).textContent = `Tracking ${C.partnerName} on ${C.projectName} · ${C.currencySymbol}${C.hourlyRate}/hr`;
    el("stat-rate-foot").textContent = `@ ${C.currencySymbol}${C.hourlyRate}/hr`;
    el("footnote").innerHTML =
      `Manual-entry v0 · access-gated with SOMA Auth. Entries are stored in ` +
      `<strong>this browser only</strong> (localStorage) — they are not yet shared ` +
      `between devices or people. Export CSV to keep a durable copy. Change the ` +
      `tracked person, rate, or access list in <code>config.js</code>. ` +
      `Shared persistence (one ledger Mike &amp; Stephanie both see) is the next step — see README "Path to v1".`;
    document.title = `${C.partnerShort}'s Hours — ${C.projectName}`;
  }

  // ---- filtering -----------------------------------------------------------
  function currentView() {
    const from = fFrom.value || null;
    const to = fTo.value || null;
    return S.list().filter((r) => {
      if (from && r.date < from) return false;
      if (to && r.date > to) return false;
      return true;
    });
  }

  // ---- rendering -----------------------------------------------------------
  function render() {
    const rows = currentView();
    const totalHours = rows.reduce((s, r) => s + Number(r.hours), 0);
    const totalOwed = totalHours * C.hourlyRate;

    // summary cards
    el("stat-count").textContent = String(rows.length);
    el("stat-hours").textContent = fmtHours(totalHours);
    el("stat-owed").textContent = money.format(totalOwed);
    const filtered = fFrom.value || fTo.value;
    const scope = filtered ? "in filtered range" : "all time";
    el("stat-count-foot").textContent = scope;
    el("stat-hours-foot").textContent = scope;

    // table
    body.innerHTML = "";
    if (rows.length === 0) {
      body.innerHTML = `<tr><td colspan="5" class="empty">No entries yet${
        filtered ? " in this range" : ""
      }. Log the first one above.</td></tr>`;
      foot.innerHTML = "";
      return;
    }

    for (const r of rows) {
      const owed = Number(r.hours) * C.hourlyRate;
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${r.date}</td>
        <td class="desc"></td>
        <td class="num">${fmtHours(r.hours)}</td>
        <td class="num">${money.format(owed)}</td>
        <td class="actions-cell">
          <button class="link" data-edit="${r.id}">Edit</button>
          <button class="link danger" data-del="${r.id}">Delete</button>
        </td>`;
      // set description via textContent to avoid HTML injection
      tr.querySelector(".desc").textContent = r.description || "—";
      body.appendChild(tr);
    }

    foot.innerHTML = `
      <tr>
        <td>Total</td>
        <td class="badge">${rows.length} ${rows.length === 1 ? "entry" : "entries"}</td>
        <td class="num">${fmtHours(totalHours)}</td>
        <td class="num">${money.format(totalOwed)}</td>
        <td></td>
      </tr>`;
  }

  // ---- events --------------------------------------------------------------
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const hours = parseFloat(fHours.value);
    if (!fDate.value || isNaN(hours) || hours <= 0 || !fDesc.value.trim()) {
      return;
    }
    S.add({ date: fDate.value, hours, description: fDesc.value });
    fHours.value = "";
    fDesc.value = "";
    fDesc.focus();
    render();
  });

  body.addEventListener("click", (e) => {
    const delId = e.target.getAttribute("data-del");
    const editId = e.target.getAttribute("data-edit");
    if (delId) {
      const row = S.list().find((r) => r.id === delId);
      const label = row ? `${row.date} · ${fmtHours(row.hours)}h` : "this entry";
      if (confirm(`Delete ${label}? This cannot be undone.`)) {
        S.remove(delId);
        render();
      }
    } else if (editId) {
      const row = S.list().find((r) => r.id === editId);
      if (!row) return;
      const newHours = prompt(`Hours for ${row.date}:`, String(row.hours));
      if (newHours === null) return;
      const h = parseFloat(newHours);
      if (isNaN(h) || h <= 0) {
        alert("Enter a positive number of hours.");
        return;
      }
      const newDesc = prompt("Task / description:", row.description);
      if (newDesc === null) return;
      S.update(editId, { hours: h, description: newDesc.trim() });
      render();
    }
  });

  el("clear-filter").addEventListener("click", () => {
    fFrom.value = "";
    fTo.value = "";
    render();
  });
  fFrom.addEventListener("change", render);
  fTo.addEventListener("change", render);

  el("export-btn").addEventListener("click", exportCsv);

  // ---- CSV export ----------------------------------------------------------
  function csvCell(v) {
    const s = String(v == null ? "" : v);
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }

  function exportCsv() {
    const rows = currentView();
    const header = ["date", "hours", "description", "rate", "owed"];
    const lines = [header.join(",")];
    for (const r of rows) {
      const owed = (Number(r.hours) * C.hourlyRate).toFixed(2);
      lines.push(
        [r.date, r.hours, csvCell(r.description), C.hourlyRate, owed].join(",")
      );
    }
    const totalHours = rows.reduce((s, r) => s + Number(r.hours), 0);
    lines.push(
      ["TOTAL", totalHours.toFixed(2), "", "", (totalHours * C.hourlyRate).toFixed(2)].join(",")
    );

    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const stamp = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `${C.partnerShort.toLowerCase()}-hours-${stamp}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ---- init ----------------------------------------------------------------
  applyConfigLabels();
  fDate.value = new Date().toISOString().slice(0, 10); // default today
  render();
})();
