// js/pgn-viewer.js — PCR M5 PGN viewer (navigation + board driver)
// Reads M4 pgn-model via getGames callback. Renders board via M2 renderBoard.
// Uses chess.js for move legality + FEN. Zero dependencies.
// Contract: initPgnViewer({ getGames, renderBoard, Chess })
// Fix A: moveIdx semantics = 0..N (0 = initial, N = final)

const LANG = (document.documentElement.lang || 'en').slice(0, 2);

const LABELS = {
  en: {
    selectLabel: 'Select game',
    noGames: 'No games loaded',
    navInitial: 'Initial',
    navPrev: 'Prev',
    navNext: 'Next',
    navFinal: 'Final',
    counterInitial: 'Initial position',
    counterFinal: 'Final position',
    counterMid: (i, n) => 'Move ' + i + ' / ' + n,
    invalidMove: (san) => 'Invalid move: ' + san,
    noGame: 'Select a game',
  },
  my: {
    selectLabel: 'ဂိမ်း ရွေးပါ',
    noGames: 'ဂိမ်း မရှိသေး',
    navInitial: 'အစ',
    navPrev: 'ရှေ့',
    navNext: 'နောက်',
    navFinal: 'အဆုံး',
    counterInitial: 'အစ အနေအထား',
    counterFinal: 'အဆုံး အနေအထား',
    counterMid: (i, n) => 'လှမ်း ' + i + ' / ' + n,
    invalidMove: (san) => 'လှမ်း မမှန်: ' + san,
    noGame: 'ဂိမ်း ရွေးပါ',
  },
};

const L = LABELS[LANG] || LABELS.en;

function injectStylesOnce() {
  if (document.getElementById('pgn-viewer-style')) return;
  const style = document.createElement('style');
  style.id = 'pgn-viewer-style';
  style.textContent = [
    '.pgn-viewer { padding: 8px 0; }',
    '.pgn-viewer .pgn-viewer-row { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin: 6px 0; }',
    '.pgn-viewer select { padding: 6px; font-size: 0.95em; }',
    '.pgn-viewer button { padding: 6px 12px; }',
    '.pgn-viewer button:disabled { opacity: 0.5; }',
    '.pgn-viewer .pgn-viewer-counter { font-size: 0.9em; margin: 4px 0; }',
    '.pgn-viewer .pgn-viewer-status { font-size: 0.9em; min-height: 1.2em; margin: 4px 0; }',
    '.pgn-viewer .pgn-viewer-status.error { color: #b00; }',
  ].join('\n');
  document.head.appendChild(style);
}

export function initPgnViewer({ getGames, renderBoard, Chess }) {
  if (typeof getGames !== 'function') throw new Error('initPgnViewer: getGames required');
  if (typeof renderBoard !== 'function') throw new Error('initPgnViewer: renderBoard required');
  if (typeof Chess !== 'function') throw new Error('initPgnViewer: Chess required');

  injectStylesOnce();

  // moveIdx: 0 = initial, k = after move k (1..N), N = final
  const state = {
    games: [],
    selectedIdx: -1,
    moveIdx: 0,
    totalMoves: 0,
  };

  const container = document.getElementById('pgn-viewer');
  if (!container) {
    console.warn('[M5] #pgn-viewer container not found');
    return {
      refresh: () => {},
      getFenAt: () => ({ fen: '', error: 'no container' }),
      getState: () => Object.assign({}, state),
    };
  }
  container.classList.add('pgn-viewer');
  container.innerHTML = '';

  // --- DOM ---
  const row1 = document.createElement('div');
  row1.className = 'pgn-viewer-row';
  const selectLabel = document.createElement('label');
  selectLabel.textContent = L.selectLabel + ': ';
  const select = document.createElement('select');
  select.id = 'pgn-game-select';
  selectLabel.appendChild(select);
  row1.appendChild(selectLabel);

  const row2 = document.createElement('div');
  row2.className = 'pgn-viewer-row';
  const btnInit = document.createElement('button');
  btnInit.type = 'button'; btnInit.id = 'pgn-init'; btnInit.textContent = L.navInitial;
  const btnPrev = document.createElement('button');
  btnPrev.type = 'button'; btnPrev.id = 'pgn-prev'; btnPrev.textContent = L.navPrev;
  const btnNext = document.createElement('button');
  btnNext.type = 'button'; btnNext.id = 'pgn-next'; btnNext.textContent = L.navNext;
  const btnFinal = document.createElement('button');
  btnFinal.type = 'button'; btnFinal.id = 'pgn-final'; btnFinal.textContent = L.navFinal;
  row2.appendChild(btnInit);
  row2.appendChild(btnPrev);
  row2.appendChild(btnNext);
  row2.appendChild(btnFinal);

  const counter = document.createElement('p');
  counter.className = 'pgn-viewer-counter';
  counter.id = 'pgn-move-counter';
  counter.textContent = '';

  const status = document.createElement('p');
  status.className = 'pgn-viewer-status';
  status.id = 'pgn-viewer-status';
  status.textContent = '';

  container.appendChild(row1);
  container.appendChild(row2);
  container.appendChild(counter);
  container.appendChild(status);

  // --- LOGIC (pure) ---

  function computeStartFen(game) {
    if (!game || !game.tags) return null;
    if (game.tags.SetUp === '1' && typeof game.tags.FEN === 'string' && game.tags.FEN.length) {
      return game.tags.FEN;
    }
    return null;
  }

  // Rebuild-from-start (deterministic)
  // idx = number of moves to apply (0..N)
  function buildFenAt(game, idx) {
    if (!game) return { fen: '', error: 'no game' };
    const startFen = computeStartFen(game);
    let c;
    try {
      c = startFen ? new Chess(startFen) : new Chess();
    } catch (e) {
      return { fen: '', error: 'Invalid start FEN: ' + (e && e.message ? e.message : String(e)) };
    }
    const moves = Array.isArray(game.moves) ? game.moves : [];
    const limit = Math.max(0, Math.min(idx, moves.length));
    for (let i = 0; i < limit; i++) {
      const san = moves[i] && moves[i].san;
      if (!san) continue;
      try {
        c.move(san);
      } catch (e) {
        return {
          fen: c.fen(),
          error: L.invalidMove(san) + (e && e.message ? ' (' + e.message + ')' : ''),
        };
      }
    }
    return { fen: c.fen(), error: null };
  }

  // --- UI updates ---

  function setStatus(text, isError) {
    status.textContent = text || '';
    if (isError) status.classList.add('error');
    else status.classList.remove('error');
  }

  function updateCounter() {
    if (state.selectedIdx < 0) {
      counter.textContent = L.noGame;
      return;
    }
    if (state.moveIdx === 0) counter.textContent = L.counterInitial;
    else if (state.moveIdx >= state.totalMoves) counter.textContent = L.counterFinal;
    else counter.textContent = L.counterMid(state.moveIdx, state.totalMoves);
  }

  function updateButtons() {
    const hasGame = state.selectedIdx >= 0 && state.totalMoves >= 0;
    btnInit.disabled = !hasGame || state.moveIdx <= 0;
    btnPrev.disabled = !hasGame || state.moveIdx <= 0;
    btnNext.disabled = !hasGame || state.moveIdx >= state.totalMoves;
    btnFinal.disabled = !hasGame || state.moveIdx >= state.totalMoves;
  }

  function renderCurrent() {
    if (state.selectedIdx < 0) {
      updateCounter();
      updateButtons();
      return;
    }
    const game = state.games[state.selectedIdx];
    if (!game) {
      updateCounter();
      updateButtons();
      return;
    }
    const result = buildFenAt(game, state.moveIdx);
    const boardEl = document.getElementById('board');
    if (result.fen && boardEl) {
      try {
        renderBoard(boardEl, result.fen);
      } catch (e) {
        setStatus('renderBoard error: ' + (e && e.message ? e.message : String(e)), true);
        updateCounter();
        updateButtons();
        return;
      }
    }
    if (result.error) setStatus(result.error, true);
    else setStatus('', false);
    updateCounter();
    updateButtons();
  }

  function buildSelectOptions() {
    select.innerHTML = '';
    if (!state.games.length) {
      const opt = document.createElement('option');
      opt.value = '-1';
      opt.textContent = '— ' + L.noGames + ' —';
      select.appendChild(opt);
      select.disabled = true;
      return;
    }
    select.disabled = false;
    for (let i = 0; i < state.games.length; i++) {
      const g = state.games[i];
      const opt = document.createElement('option');
      opt.value = String(i);
      const ev = (g.tags && g.tags.Event) ? g.tags.Event : ('Game ' + (i + 1));
      const w = (g.tags && g.tags.White) ? g.tags.White : '?';
      const b = (g.tags && g.tags.Black) ? g.tags.Black : '?';
      opt.textContent = (i + 1) + '. ' + ev + ' — ' + w + ' vs ' + b;
      select.appendChild(opt);
    }
  }

  function selectGame(idx) {
    state.selectedIdx = idx;
    if (idx < 0) {
      state.moveIdx = 0;
      state.totalMoves = 0;
    } else {
      const g = state.games[idx];
      state.totalMoves = (g && Array.isArray(g.moves)) ? g.moves.length : 0;
      state.moveIdx = 0;
    }
    renderCurrent();
  }

  // --- EVENTS ---

  select.addEventListener('change', () => {
    const idx = parseInt(select.value, 10);
    if (Number.isFinite(idx)) selectGame(idx);
  });

  btnInit.addEventListener('click', () => {
    state.moveIdx = 0;
    renderCurrent();
  });
  btnPrev.addEventListener('click', () => {
    if (state.moveIdx > 0) state.moveIdx -= 1;
    renderCurrent();
  });
  btnNext.addEventListener('click', () => {
    if (state.moveIdx < state.totalMoves) state.moveIdx += 1;
    renderCurrent();
  });
  btnFinal.addEventListener('click', () => {
    state.moveIdx = state.totalMoves;
    renderCurrent();
  });

  // --- PUBLIC HANDLE ---

  function refresh() {
    const games = getGames();
    state.games = Array.isArray(games) ? games : [];
    buildSelectOptions();
    if (state.games.length === 0) {
      state.selectedIdx = -1;
      state.moveIdx = 0;
      state.totalMoves = 0;
      updateCounter();
      updateButtons();
      setStatus('', false);
    } else {
      select.value = '0';
      selectGame(0);
    }
  }

  function getFenAt(idx) {
    if (state.selectedIdx < 0) return { fen: '', error: 'no game selected' };
    const game = state.games[state.selectedIdx];
    if (!game) return { fen: '', error: 'no game selected' };
    return buildFenAt(game, idx);
  }

  function getState() {
    return {
      selectedIdx: state.selectedIdx,
      moveIdx: state.moveIdx,
      totalMoves: state.totalMoves,
      gameCount: state.games.length,
    };
  }

  refresh();

  return { refresh, getFenAt, getState };
}
