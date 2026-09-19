// PCR Trainer — M5 Main Entry
// Architecture: index.html → main.js → { chess.js, board.js, i18n.js,
//   pgn-model.js, pgn-ui.js, pgn-viewer.js }
// Scope: M1+M2+M3+M4+M5 (PGN import/export + viewer navigation)
// M6 (F1): post-import viewer refresh — onImport callback wiring
// M11: LocalStorage persistence — load/save/clear (pcr-trainer:games)

import { Chess } from '../lib/chess.js';
import { renderBoard, parseFen } from './board.js';
import { t } from './i18n.js';
import { parseAndMap, toPGN } from './pgn-model.js';
import { initPgnUI } from './pgn-ui.js';
import { initPgnViewer } from './pgn-viewer.js';

// ============================================================
// M3 — Apply i18n labels
// ============================================================
document.getElementById('title').textContent = t('title');
document.getElementById('subtitle').textContent = t('subtitle');

// ============================================================
// M11 — LocalStorage persistence helpers
// Key: pcr-trainer:games · Value: { version, games, savedAt }
// ============================================================
const STORAGE_KEY = 'pcr-trainer:games';
const STORAGE_VERSION = 1;

function loadFromStorage() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return [];
    if (parsed.version !== STORAGE_VERSION) {
      console.warn('[M11] storage version mismatch:', parsed.version);
      return [];
    }
    if (!Array.isArray(parsed.games)) return [];
    return parsed.games;
  } catch (err) {
    console.warn('[M11] load failed:', err && err.message);
    return [];
  }
}

function saveToStorage(games) {
  try {
    const payload = {
      version: STORAGE_VERSION,
      games: Array.isArray(games) ? games : [],
      savedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (err) {
    console.warn('[M11] save failed:', err && err.message);
  }
}

function clearStorage() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.warn('[M11] clear failed:', err && err.message);
  }
}

// ============================================================
// Shared handles (pre-declared for TDZ safety)
// M4 onImport callback needs to reference viewerHandle
// ============================================================
let uiHandle = null;
let viewerHandle = null;

// ============================================================
// M4 — Initialize PGN UI (parser accessed via window.PgnParser)
// NOTE: index.html must load ./lib/pgn-parser.umd.js BEFORE this module
// M11: seed from storage · save on import · clear on user action
// ============================================================
const Parser = window.PgnParser;
const initialGames = loadFromStorage();

if (Parser) {
  uiHandle = initPgnUI({
    parseAndMap: (text) => parseAndMap(Parser, text),
    toPGN,
    initialGames,
    // M6 (F1) + M11: save on import success · viewer refresh
    onImport: (games) => {
      saveToStorage(games);
      if (viewerHandle && typeof viewerHandle.refresh === 'function') {
        viewerHandle.refresh();
      }
    },
    // M11: user-initiated clear → wipe storage + viewer refresh
    onClear: () => {
      clearStorage();
      if (viewerHandle && typeof viewerHandle.refresh === 'function') {
        viewerHandle.refresh();
      }
    },
  });
} else {
  console.warn('[M4] window.PgnParser not available');
}

// ============================================================
// M5 — Initialize PGN viewer (navigation + board driver)
// Wires M4 getGames + M2 renderBoard + M1 Chess
// ============================================================
viewerHandle = initPgnViewer({
  getGames: () => (uiHandle && typeof uiHandle.getGames === 'function')
    ? uiHandle.getGames()
    : [],
  renderBoard,
  Chess,
});
if (viewerHandle && typeof viewerHandle.refresh === 'function') {
  viewerHandle.refresh();
}

// ============================================================
// M1 SMOKE TEST (regression — must remain PASS)
// ============================================================
const out = document.getElementById('output');
const lines = [];
const log = (msg) => lines.push(msg);

try {
  log('chess.js ESM: loaded');
  log('Chess export type: ' + typeof Chess);

  const game = new Chess();
  log('Initial FEN: ' + game.fen());

  const move = game.move('e4');
  log('Move e4: ' + (move ? 'OK' : 'FAILED'));
  log('FEN after e4: ' + game.fen());
  log('Turn: ' + game.turn());
  log('');
  log('=== M1 SMOKE TEST: ' + (move ? 'PASS' : 'FAIL') + ' ===');
} catch (err) {
  log('ERROR: ' + err.message);
  log('');
  log('=== M1 SMOKE TEST: FAIL ===');
}

out.textContent = lines.join('\n');

// ============================================================
// M2 BOARD RENDER (regression — must remain PASS)
// ============================================================
const boardContainer = document.getElementById('board');
const fenEl = document.getElementById('fen');

try {
  const freshGame = new Chess();
  const fen = freshGame.fen();
  const grid = parseFen(fen);
  if (grid.length !== 8) {
    throw new Error('Parsed grid has ' + grid.length + ' rows (expected 8)');
  }

  renderBoard(boardContainer, fen);
  fenEl.textContent = 'FEN: ' + fen;

  const squares = boardContainer.querySelectorAll('.square').length;
  const pieces  = boardContainer.querySelectorAll('.piece').length;
  console.log('[M2] Board rendered:', squares, 'squares,', pieces, 'pieces');

  if (squares !== 64) console.warn('[M2] Expected 64 squares, got ' + squares);
  if (pieces !== 32)  console.warn('[M2] Expected 32 pieces, got ' + pieces);

} catch (err) {
  boardContainer.textContent = 'M2 BOARD ERROR: ' + err.message;
  fenEl.textContent = 'ERROR';
  console.error('[M2] Render failed:', err);
}
