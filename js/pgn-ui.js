// js/pgn-ui.js — PCR M4 PGN Import/Export UI handlers
// Local-only processing: File API + Blob + Clipboard. No network calls.
// No external dependencies.
//
// M11 — LocalStorage seed (initialGames) + Clear button (onClear, Law 4)
// Signature: initPgnUI({ parseAndMap, toPGN, initialGames, onImport, onClear })

const LANG = (document.documentElement.lang || 'en').slice(0, 2);

const LABELS = {
  en: {
    importBtn: 'Import PGN',
    exportBtn: 'Export PGN',
    clearBtn: 'Clear',
    statusParsing: 'Parsing...',
    statusLoaded: (n) => n + ' game(s) loaded',
    statusParseError: (m) => 'Error: ' + m,
    statusNoGames: 'No games loaded',
    statusExported: 'Exported (check Downloads)',
    statusNoParser: 'Parser not available',
    statusCleared: 'Cleared',
    confirmClear: 'Clear all loaded games? This cannot be undone.',
  },
  my: {
    importBtn: 'PGN ဖွင့်ရန်',
    exportBtn: 'PGN သိမ်းရန်',
    clearBtn: 'ရှင်းလင်း',
    statusParsing: 'ဖတ်နေသည်...',
    statusLoaded: (n) => 'ဂိမ်း ' + n + ' ခု ရရှိပြီ',
    statusParseError: (m) => 'အမှား: ' + m,
    statusNoGames: 'ဂိမ်း မရှိသေးပါ',
    statusExported: 'သိမ်းပြီးပါပြီ (Downloads ကို စစ်ပါ)',
    statusNoParser: 'Parser မရရှိပါ',
    statusCleared: 'ရှင်းလင်းပြီး',
    confirmClear: 'ဂိမ်းအားလုံး ရှင်းလင်းမလား? ပြန်ယူလို့ မရပါ။',
  },
};

const L = LABELS[LANG] || LABELS.en;

function injectStylesOnce() {
  if (document.getElementById('pgn-ui-style')) return;
  const style = document.createElement('style');
  style.id = 'pgn-ui-style';
  style.textContent = [
    '.pgn-ui { padding: 8px 0; }',
    '.pgn-ui button { margin-right: 8px; padding: 6px 12px; }',
    '.pgn-ui .pgn-status { font-size: 0.9em; min-height: 1.2em; margin: 6px 0 0 0; }',
  ].join('\n');
  document.head.appendChild(style);
}

export function initPgnUI({ parseAndMap, toPGN, initialGames, onImport, onClear }) {
  if (typeof parseAndMap !== 'function' || typeof toPGN !== 'function') {
    console.warn('[M4] initPgnUI requires { parseAndMap, toPGN }');
    return null;
  }

  // M11 — seed from storage (defensive copy)
  const seed = Array.isArray(initialGames) ? initialGames : [];

  const state = {
    games: seed.slice(),
    lastPgnText: '',
  };

  injectStylesOnce();

  const container = document.createElement('div');
  container.id = 'pgn-ui';
  container.className = 'pgn-ui';

  const importBtn = document.createElement('button');
  importBtn.type = 'button';
  importBtn.id = 'pgn-import-btn';
  importBtn.textContent = L.importBtn;

  const exportBtn = document.createElement('button');
  exportBtn.type = 'button';
  exportBtn.id = 'pgn-export-btn';
  exportBtn.textContent = L.exportBtn;

  // M11 — Clear button (Law 4: destructive op requires confirm)
  const clearBtn = document.createElement('button');
  clearBtn.type = 'button';
  clearBtn.id = 'pgn-clear-btn';
  clearBtn.textContent = L.clearBtn;

  const status = document.createElement('p');
  status.id = 'pgn-status';
  status.className = 'pgn-status';
  status.textContent = '';

  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.id = 'pgn-file-input';
  fileInput.accept = '.pgn,.txt,application/x-chess-pgn,text/plain';
  fileInput.style.display = 'none';

  container.appendChild(importBtn);
  container.appendChild(exportBtn);
  container.appendChild(clearBtn);
  container.appendChild(status);
  container.appendChild(fileInput);

  // Insert before #pgn-viewer if present; otherwise append to body
  const pgnViewerEl = document.getElementById('pgn-viewer');
  if (pgnViewerEl && pgnViewerEl.parentNode) {
    pgnViewerEl.parentNode.insertBefore(container, pgnViewerEl);
  } else {
    document.body.appendChild(container);
  }

  // --- M11: derived button state (from seed) ---
  function syncButtons() {
    const hasGames = state.games.length > 0;
    exportBtn.disabled = !hasGames;
    clearBtn.disabled = !hasGames;
  }
  syncButtons();
  if (seed.length) {
    status.textContent = L.statusLoaded(seed.length);
  }

  // --- Handlers ---

  importBtn.addEventListener('click', () => {
    fileInput.click();
  });

  fileInput.addEventListener('change', async () => {
    const file = fileInput.files && fileInput.files[0];
    if (!file) return;
    status.textContent = L.statusParsing;
    try {
      const text = await file.text();
      const result = parseAndMap(text);
      const games = Array.isArray(result) ? result : [];
      state.games = games;
      state.lastPgnText = text;
      syncButtons();
      status.textContent = games.length
        ? L.statusLoaded(games.length)
        : L.statusNoGames;
      // F1 (M6) + M11: notify listener (save + viewer refresh) — success only
      if (typeof onImport === 'function') {
        try { onImport(games); } catch (_) { /* swallow */ }
      }
    } catch (e) {
      // M11 (Law 4): parse failure — preserve current state + storage.
      // Only update status. Do NOT touch state.games / lastPgnText /
      // buttons / viewer. Last-good data remains consistent everywhere.
      status.textContent = L.statusParseError(
        (e && e.message) ? e.message : String(e)
      );
    }
    fileInput.value = '';
  });

  exportBtn.addEventListener('click', () => {
    if (!state.games.length) return;
    let pgnText;
    try {
      pgnText = toPGN(state.games);
    } catch (e) {
      status.textContent = L.statusParseError(
        (e && e.message) ? e.message : String(e)
      );
      return;
    }
    // Download via Blob
    try {
      const blob = new Blob([pgnText], { type: 'application/x-chess-pgn' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'pcr-export.pgn';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      // ignore — clipboard fallback below
    }
    // Best-effort clipboard copy
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      navigator.clipboard.writeText(pgnText).catch(() => {});
    }
    status.textContent = L.statusExported;
  });

  // M11 — Clear handler (Law 4: confirm → wipe → notify)
  clearBtn.addEventListener('click', () => {
    if (!state.games.length) return;
    const ok = window.confirm(L.confirmClear);
    if (!ok) return;
    state.games = [];
    state.lastPgnText = '';
    syncButtons();
    status.textContent = L.statusCleared;
    if (typeof onClear === 'function') {
      try { onClear(); } catch (_) { /* swallow */ }
    }
  });

  return {
    getGames: () => state.games.slice(),
    getLastPgnText: () => state.lastPgnText,
  };
}
