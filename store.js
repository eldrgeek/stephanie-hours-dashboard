/*
 * store.js — THE SWAPPABLE DATA SEAM.
 *
 * v0 persists to the browser's localStorage. This is the one file you replace
 * when a real data source arrives (see README "Path to v1"). Every entry is:
 *
 *   { id: string, date: "YYYY-MM-DD", hours: number, description: string,
 *     createdAt: ISOstring }
 *
 * The rest of the app only ever talks to window.Store — it never touches
 * localStorage or any backend directly. Keep this interface stable and the
 * UI won't care whether the rows come from localStorage, Supabase, a Google
 * Sheet, or a time-tracking API:
 *
 *   Store.list()            -> Entry[]   (newest first)
 *   Store.add(entry)        -> Entry     (assigns id + createdAt)
 *   Store.update(id, patch) -> Entry|null
 *   Store.remove(id)        -> boolean
 *   Store.replaceAll(rows)  -> void      (used by CSV import / seed)
 */
(function () {
  const KEY = window.CONFIG.storageKey;

  function read() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error("Store: failed to read, starting empty.", e);
      return [];
    }
  }

  function write(rows) {
    localStorage.setItem(KEY, JSON.stringify(rows));
  }

  function newId() {
    return (
      Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8)
    );
  }

  function sortNewestFirst(rows) {
    return rows.slice().sort((a, b) => {
      if (a.date !== b.date) return a.date < b.date ? 1 : -1;
      return (a.createdAt || "") < (b.createdAt || "") ? 1 : -1;
    });
  }

  window.Store = {
    list() {
      return sortNewestFirst(read());
    },

    add(entry) {
      const rows = read();
      const record = {
        id: newId(),
        date: entry.date,
        hours: Number(entry.hours),
        description: (entry.description || "").trim(),
        createdAt: new Date().toISOString(),
      };
      rows.push(record);
      write(rows);
      return record;
    },

    update(id, patch) {
      const rows = read();
      const i = rows.findIndex((r) => r.id === id);
      if (i === -1) return null;
      rows[i] = {
        ...rows[i],
        ...patch,
        hours: patch.hours != null ? Number(patch.hours) : rows[i].hours,
      };
      write(rows);
      return rows[i];
    },

    remove(id) {
      const rows = read();
      const next = rows.filter((r) => r.id !== id);
      if (next.length === rows.length) return false;
      write(next);
      return true;
    },

    replaceAll(rows) {
      write(rows);
    },
  };
})();
