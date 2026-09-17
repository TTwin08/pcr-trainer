// PCR Trainer — M2 First Board Build
// Architecture: index.html → main.js → { chess.js, board.js }
// Scope: M2 only (board foundation; no font/PGN/engine)

import { Chess } from '../lib/chess.js';
import { renderBoard, parseFen } from './board.js';

// ============================================================
// M1 SMOKE TEST (regression check — must remain PASS)
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
// M2 BOARD RENDER
// ============================================================
const boardContainer = document.getElementById('board');
const fenEl = document.getElementById('fen');

try {
  // Fresh game → starting position
  const freshGame = new Chess();
  const fen = freshGame.fen();

  // Verify FEN parse
  const grid = parseFen(fen);
  if (grid.length !== 8) {
    throw new Error('Parsed grid has ' + grid.length + ' rows (expected 8)');
  }

  // Render board
  renderBoard(boardContainer, fen);

  // Display FEN for visual comparison
  fenEl.textContent = 'FEN: ' + fen;

  // Diagnostics
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
