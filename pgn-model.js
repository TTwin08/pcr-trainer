// js/pgn-model.js — PCR M4 PGN data model
// Adapted from Gate 3 v2 verified prototype (logic unchanged).
// Converts @mliebelt/pgn-parser output → PCR model, and back to PGN.

// ---- PARSER OUTPUT → PCR DATA MODEL ----

export function parseAndMap(PgnParser, pgnText) {
  const games = PgnParser.parse(pgnText, { startRule: 'games' });
  return games.map(mapGame);
}

function mapGame(g) {
  return {
    tags: extractTags(g.tags || {}),
    moves: mapMoveList(g.moves || []),
    messages: g.messages || [],
  };
}

function extractTags(raw) {
  const out = {};
  for (const k of Object.keys(raw)) {
    if (k === 'messages') continue;
    out[k] = normalizeTagValue(raw[k]);
  }
  return out;
}

// Normalize tag values: parser emits {value, year, month, day} for Date
function normalizeTagValue(v) {
  if (v && typeof v === 'object' && !Array.isArray(v)) {
    if (typeof v.value === 'string') return v.value;
    if (typeof v.value === 'number') return String(v.value);
    return '';
  }
  return v;
}

function mapMoveList(moves) {
  return moves.map(mapMove);
}

function mapMove(m) {
  const n = m.notation || {};
  return {
    san: n.notation || null,
    moveNumber: (m.moveNumber != null) ? m.moveNumber : null,
    color: m.turn || null,
    nags: normalizeNags(m.nag),
    comment: extractComment(m),
    variations: (m.variations || []).map(v => v.map(mapMove)),
  };
}

function normalizeNags(nags) {
  if (!nags) return [];
  if (Array.isArray(nags)) return nags.slice();
  return [nags];
}

function extractComment(m) {
  if (m.commentDiag && typeof m.commentDiag === 'object' && m.commentDiag.comment) {
    return m.commentDiag.comment;
  }
  if (typeof m.commentAfter === 'string' && m.commentAfter.length) {
    return m.commentAfter;
  }
  if (typeof m.commentMove === 'string' && m.commentMove.length) {
    return m.commentMove;
  }
  return null;
}

// ---- PCR DATA MODEL → PGN (hand-written serialization) ----

export function toPGN(games) {
  if (!Array.isArray(games)) games = [games];
  return games.map(gameToPGN).join('\n\n');
}

function gameToPGN(game) {
  const lines = [];
  for (const k of Object.keys(game.tags || {})) {
    lines.push('[' + k + ' "' + String(game.tags[k]) + '"]');
  }
  lines.push('');
  lines.push(movesToPGN(game.moves || []));
  return lines.join('\n');
}

function movesToPGN(moves) {
  const parts = [];
  for (const m of moves) {
    if (m.color === 'w' && m.moveNumber != null) parts.push(m.moveNumber + '.');
    if (m.san) parts.push(m.san);
    if (m.nags && m.nags.length) for (const n of m.nags) parts.push(n);
    if (m.comment) parts.push('{' + m.comment + '}');
    if (m.variations && m.variations.length) {
      for (const v of m.variations) parts.push('(' + movesToPGN(v) + ')');
    }
  }
  return parts.join(' ');
}