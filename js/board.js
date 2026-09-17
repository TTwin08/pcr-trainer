// PCR Trainer — M2 Board Module
// Purpose: FEN parsing + static board rendering
// Depends: none (self-contained)
// Scope:   M2 only — no font, no PGN, no engine

const PIECE_UNICODE = {
  // White (outline symbols)
  'K': '\u2654', // ♔
  'Q': '\u2655', // ♕
  'R': '\u2656', // ♖
  'B': '\u2657', // ♗
  'N': '\u2658', // ♘
  'P': '\u2659', // ♙
  // Black (filled symbols)
  'k': '\u265A', // ♚
  'q': '\u265B', // ♛
  'r': '\u265C', // ♜
  'b': '\u265D', // ♝
  'n': '\u265E', // ♞
  'p': '\u265F'  // ♟
};

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1']; // top→bottom

/**
 * Parse FEN piece placement into 8x8 array.
 * row 0 = rank 8 (top), col 0 = file a (left).
 * Cell = piece char ('K','p') or null (empty).
 */
export function parseFen(fen) {
  if (typeof fen !== 'string' || !fen.length) {
    throw new Error('parseFen: FEN must be non-empty string');
  }
  const boardPart = fen.split(' ')[0];
  const rows = boardPart.split('/');
  if (rows.length !== 8) {
    throw new Error('parseFen: expected 8 ranks, got ' + rows.length);
  }
  const grid = [];
  for (const row of rows) {
    const rowArr = [];
    for (const ch of row) {
      if (ch >= '1' && ch <= '8') {
        const n = parseInt(ch, 10);
        for (let i = 0; i < n; i++) rowArr.push(null);
      } else if (PIECE_UNICODE[ch]) {
        rowArr.push(ch);
      } else {
        throw new Error('parseFen: invalid char "' + ch + '"');
      }
    }
    if (rowArr.length !== 8) {
      throw new Error('parseFen: rank length ' + rowArr.length + ' (need 8)');
    }
    grid.push(rowArr);
  }
  return grid;
}

/**
 * Piece char → Unicode symbol.
 */
export function pieceToUnicode(ch) {
  return PIECE_UNICODE[ch] || '';
}

/**
 * Is char a white piece? (K vs k)
 */
export function isWhitePiece(ch) {
  return !!ch && ch === ch.toUpperCase();
}

/**
 * Render static board into container element.
 * @param {HTMLElement} container
 * @param {string} fen
 * @param {object} [opts] - { flipped: false }
 */
export function renderBoard(container, fen, opts = {}) {
  if (!container || !container.appendChild) {
    throw new Error('renderBoard: invalid container');
  }
  const flipped = !!opts.flipped;
  const grid = parseFen(fen);

  container.innerHTML = '';

  const wrap = document.createElement('div');
  wrap.className = 'board-wrap';

  // Ranks column
  const ranksEl = document.createElement('div');
  ranksEl.className = 'ranks';
  const rankOrder = flipped ? [...RANKS].reverse() : RANKS;
  for (const r of rankOrder) {
    const s = document.createElement('span');
    s.textContent = r;
    ranksEl.appendChild(s);
  }

  // Board grid
  const boardEl = document.createElement('div');
  boardEl.className = 'board';

  const rowIdx = flipped ? [7,6,5,4,3,2,1,0] : [0,1,2,3,4,5,6,7];
  const colIdx = flipped ? [7,6,5,4,3,2,1,0] : [0,1,2,3,4,5,6,7];

  for (const r of rowIdx) {
    for (const c of colIdx) {
      const piece = grid[r][c];
      const sq = document.createElement('div');

      // a1 = dark, h1 = light (standard chess coloring)
      const isLight = ((r + c) % 2) === 0;
      sq.className = 'square ' + (isLight ? 'light' : 'dark');

      if (piece) {
        const span = document.createElement('span');
        span.className = 'piece ' + (isWhitePiece(piece) ? 'piece-w' : 'piece-b');
        span.textContent = pieceToUnicode(piece);
        sq.appendChild(span);
      }
      boardEl.appendChild(sq);
    }
  }

  // Files row
  const filesEl = document.createElement('div');
  filesEl.className = 'files';
  const fileOrder = flipped ? [...FILES].reverse() : FILES;
  for (const f of fileOrder) {
    const s = document.createElement('span');
    s.textContent = f;
    filesEl.appendChild(s);
  }

  wrap.appendChild(ranksEl);
  wrap.appendChild(boardEl);
  wrap.appendChild(filesEl);
  container.appendChild(wrap);
}
