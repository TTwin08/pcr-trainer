// PCR Trainer — M5 Main Entry
// Architecture: index.html → main.js → { chess.js, board.js, i18n.js,
//   pgn-model.js, pgn-ui.js, pgn-viewer.js }
// Scope: M1+M2+M3+M4+M5 (PGN import/export + viewer navigation)

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
// M4 — Initialize PGN UI (parser accessed via window.PgnParser)
// NOTE: index.html must load ./lib/pgn-parser.umd.js BEFORE this module
// ============================================================
const Parser = window.PgnParser;
let uiHandle = null;
if (Parser) {
  uiHandle = initPgnUI({
    parseAndMap: (text) => parseAndMap(Parser, text),
    toPGN,
  });
} else {
  console.warn('[M4] window.PgnParser not available');
}

// ============================================================
// M5 — Initialize PGN viewer (navigation + board driver)
// Wires M4 getGames + M2 renderBoard + M1 Chess
// ============================================================
const viewerHandle = initPgnViewer({
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
