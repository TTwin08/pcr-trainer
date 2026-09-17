// PCR Trainer — M1 First Build
// Purpose: prove chess.js v1.4.0 loads and functions
// Scope:   M1 only (no board, no UI, no other deps)

import { Chess } from '../lib/chess.js';

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
