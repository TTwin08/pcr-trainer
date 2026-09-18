// js/pgn-viewer.js — PCR M7 PGN viewer (navigation + board driver + RAV)
// Reads M4 pgn-model via getGames callback. Renders board via M2 renderBoard.
// Uses chess.js for move legality + FEN. Zero dependencies.
// Contract: initPgnViewer({ getGames, renderBoard, Chess })
// M5: mainline navigation (moveIdx: 0..N)
// M7: RAV variations tree display (inline, depth-capped at 3)
// NOTE (M7): RAV CSS lives in css/style.css. M5 viewer CSS remains dynamic (unchanged).

const LANG = (document.documentElement.lang || 'en').slice(0, 2);
const MAX_VARIATION_DEPTH = 3;

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
    variationsHeader: 'Variations',
    exitVariation: '\u21A9 Exit',
    maxDepth: 'Max variation depth (' + MAX_VARIATION_DEPTH + ') reached',
    variationCounter: (d, p, n) => 'Variation (depth-' + d + '): ' + p + ' / ' + n,
    invalidPath: 'Invalid variation path',
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
    variationsHeader: 'Variations',
    exitVariation: '\u21A9 ထွက်',
    maxDepth: 'Variation depth အများဆုံး (' + MAX_VARIATION_DEPTH + ') ရောက်ပါပြီ',
    variationCounter: (d, p, n) => 'Variation (depth-' + d + '): ' + p + ' / ' + n,
    invalidPath: 'Variation လမ်းကြောင်း မမှန်',
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

  const state = {
    games: [],
    selectedIdx: -1,
    moveIdx: 0,
    totalMoves: 0,
    variationPath: [],
    variationPos: 0,
  };

  const container = document.getElementById('pgn-viewer');
  if (!container) {
    console.warn('[M7] #pgn-viewer container not found');
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

  const ravContainer = document.createElement('div');
  ravContainer.className = 'pgn-viewer-rav';
  ravContainer.id = 'pgn-viewer-rav';

  const status = document.createElement('p');
  status.className = 'pgn-viewer-status';
  status.id = 'pgn-viewer-status';
  status.textContent = '';

  container.appendChild(row1);
  container.appendChild(row2);
  container.appendChild(counter);
  container.appendChild(ravContainer);
  container.appendChild(status);

  // --- LOGIC (pure) ---

  function computeStartFen(game) {
    if (!game || !game.tags) return null;
    if (game.tags.SetUp === '1' && typeof game.tags.FEN === 'string' && game.tags.FEN.length) {
      return game.tags.FEN;
    }
    return null;
  }

  // M5 — rebuild-from-start (mainline only). Unchanged.
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

  // M7 — variation-aware FEN. Unchanged.
  function buildFenAtPath(game, path, varPos) {
    if (!game) return { fen: '', error: 'no game' };
    const startFen = computeStartFen(game);
    let c;
    try {
      c = startFen ? new Chess(startFen) : new Chess();
    } catch (e) {
      return { fen: '', error: 'Invalid start FEN: ' + (e && e.message ? e.message : String(e)) };
    }

    let currentList = Array.isArray(game.moves) ? game.moves : [];

    for (let s = 0; s < path.length; s++) {
      const step = path[s];
      const limit = Math.max(0, Math.min(step.moveIdx, currentList.length));
      for (let i = 0; i < limit; i++) {
        const san = currentList[i] && currentList[i].san;
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
      const parentMove = currentList[step.moveIdx];
      if (!parentMove || !Array.isArray(parentMove.variations) ||
          !parentMove.variations[step.varIdx]) {
        return { fen: c.fen(), error: L.invalidPath };
      }
      currentList = parentMove.variations[step.varIdx];
    }

    const limit2 = Math.max(0, Math.min(varPos, currentList.length));
    for (let i = 0; i < limit2; i++) {
      const san = currentList[i] && currentList[i].san;
      if (!san) continue;
      try {
        c.move(san);
      } catch (e) {
        return {
          fen: c.fen(),
          error: L.invalidMove(san) + ' (' + (e && e.message ? e.message : String(e)) + ')',
        };
      }
    }
    return { fen: c.fen(), error: null };
  }

  // --- Context helpers (pure reads) ---

  function getCurrentList() {
    if (state.selectedIdx < 0) return [];
    const game = state.games[state.selectedIdx];
    if (!game) return [];
    let list = Array.isArray(game.moves) ? game.moves : [];
    for (let s = 0; s < state.variationPath.length; s++) {
      const step = state.variationPath[s];
      const parentMove = list[step.moveIdx];
      if (!parentMove || !Array.isArray(parentMove.variations) ||
          !parentMove.variations[step.varIdx]) {
        return [];
      }
      list = parentMove.variations[step.varIdx];
    }
    return list;
  }

  // M7 — anchor index (index of the move whose variations we display).
  //   Mainline: the NEXT move to play = moveIdx
  //   Variation: the JUST-PLAYED move = variationPos - 1
  function getAnchorIndex() {
    if (state.variationPath.length > 0) return state.variationPos - 1;
    return state.moveIdx;
  }

  function formatVariation(moves, maxMoves) {
    maxMoves = maxMoves || 8;
    if (!Array.isArray(moves) || moves.length === 0) return '(empty)';
    const parts = [];
    for (let i = 0; i < Math.min(moves.length, maxMoves); i++) {
      const m = moves[i];
      if (!m || !m.san) continue;
      if (m.color === 'w' && m.moveNumber != null) {
        parts.push(m.moveNumber + '.');
      } else if (i === 0 && m.color === 'b' && m.moveNumber != null) {
        parts.push(m.moveNumber + '...');
      }
      parts.push(m.san);
    }
    if (moves.length > maxMoves) parts.push('\u2026');
    return parts.join(' ');
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
    if (state.variationPath.length > 0) {
      const list = getCurrentList();
      counter.textContent = L.variationCounter(
        state.variationPath.length,
        state.variationPos,
        list.length
      );
      return;
    }
    // M5 mainline (unchanged)
    if (state.moveIdx === 0) counter.textContent = L.counterInitial;
    else if (state.moveIdx >= state.totalMoves) counter.textContent = L.counterFinal;
    else counter.textContent = L.counterMid(state.moveIdx, state.totalMoves);
  }

  function updateButtons() {
    const hasGame = state.selectedIdx >= 0;

    if (state.variationPath.length > 0) {
      const list = getCurrentList();
      const N = list.length;
      btnInit.disabled  = !hasGame || state.variationPos <= 0;
      btnPrev.disabled  = !hasGame;
      btnNext.disabled  = !hasGame || state.variationPos >= N;
      btnFinal.disabled = !hasGame || state.variationPos >= N;
      return;
    }

    // M5 mainline (unchanged)
    btnInit.disabled  = !hasGame || state.moveIdx <= 0;
    btnPrev.disabled  = !hasGame || state.moveIdx <= 0;
    btnNext.disabled  = !hasGame || state.moveIdx >= state.totalMoves;
    btnFinal.disabled = !hasGame || state.moveIdx >= state.totalMoves;
  }

  // M7 — render RAV. Anchor = getAnchorIndex() (context-dependent).
  function renderRav() {
    ravContainer.innerHTML = '';

    const inVar = state.variationPath.length > 0;
    let variations = [];

    if (state.selectedIdx >= 0 && state.games[state.selectedIdx]) {
      const game = state.games[state.selectedIdx];
      const currentList = inVar
        ? getCurrentList()
        : (Array.isArray(game.moves) ? game.moves : []);
      const anchorIdx = getAnchorIndex();
      const anchorMove = (anchorIdx >= 0 && anchorIdx < currentList.length)
        ? currentList[anchorIdx]
        : null;
      if (anchorMove && Array.isArray(anchorMove.variations)) {
        variations = anchorMove.variations;
      }
    }

    if (variations.length === 0 && !inVar) {
      ravContainer.classList.remove('active');
      return;
    }

    ravContainer.classList.add('active');

    if (variations.length > 0) {
      const header = document.createElement('p');
      header.className = 'pgn-viewer-rav-header';
      header.textContent = L.variationsHeader + ' (' + variations.length + ')';
      ravContainer.appendChild(header);

      const displayDepth = state.variationPath.length + 1;
      for (let i = 0; i < variations.length; i++) {
        const item = document.createElement('div');
        item.className = 'pgn-viewer-rav-item';
        item.dataset.varIdx = String(i);
        item.dataset.depth = String(displayDepth);
        item.textContent = formatVariation(variations[i]);
        item.addEventListener('click', (function (idx) {
          return function () { enterVariation(idx); };
        })(i));
        ravContainer.appendChild(item);
      }
    }

    if (inVar) {
      const exitBtn = document.createElement('button');
      exitBtn.type = 'button';
      exitBtn.className = 'pgn-viewer-exit';
      exitBtn.textContent = L.exitVariation;
      exitBtn.addEventListener('click', exitVariation);
      ravContainer.appendChild(exitBtn);
    }
  }

  function renderCurrent() {
    if (state.selectedIdx < 0) {
      updateCounter();
      updateButtons();
      renderRav();
      return;
    }
    const game = state.games[state.selectedIdx];
    if (!game) {
      updateCounter();
      updateButtons();
      renderRav();
      return;
    }

    let result;
    if (state.variationPath.length === 0) {
      result = buildFenAt(game, state.moveIdx);       // M5 path (unchanged)
    } else {
      result = buildFenAtPath(game, state.variationPath, state.variationPos);
    }

    const boardEl = document.getElementById('board');
    if (result.fen && boardEl) {
      try {
        renderBoard(boardEl, result.fen);
      } catch (e) {
        setStatus('renderBoard error: ' + (e && e.message ? e.message : String(e)), true);
        updateCounter();
        updateButtons();
        renderRav();
        return;
      }
    }
    if (result.error) setStatus(result.error, true);
    else setStatus('', false);
    updateCounter();
    updateButtons();
    renderRav();
  }

  // --- Variation enter/exit ---
  // enterVariation pushes the ANCHOR INDEX (getAnchorIndex()) so buildFenAtPath
  // enters the correct variation list. This aligns with renderRav's anchor.

  function enterVariation(varIdx) {
    if (state.selectedIdx < 0) return;
    const inVar = state.variationPath.length > 0;
    const currentList = inVar
      ? getCurrentList()
      : (Array.isArray(state.games[state.selectedIdx].moves)
          ? state.games[state.selectedIdx].moves
          : []);
    const anchorIdx = getAnchorIndex();
    if (anchorIdx < 0 || anchorIdx >= currentList.length) return;

    const anchorMove = currentList[anchorIdx];
    if (!anchorMove || !Array.isArray(anchorMove.variations) ||
        !anchorMove.variations[varIdx]) return;

    if (state.variationPath.length >= MAX_VARIATION_DEPTH) {
      setStatus(L.maxDepth, true);
      return;
    }

    state.variationPath.push({ moveIdx: anchorIdx, varIdx: varIdx });
    state.variationPos = 1;
    renderCurrent();
  }

  function exitVariation() {
    if (state.variationPath.length === 0) return;
    const lastStep = state.variationPath.pop();
    if (state.variationPath.length === 0) {
      // back to mainline — restore position where we entered
      state.moveIdx = lastStep.moveIdx;
      state.variationPos = 0;
    } else {
      // back to parent variation — restore parent's variationPos
      state.variationPos = lastStep.moveIdx + 1;
    }
    renderCurrent();
  }

  function buildSelectOptions() {
    select.innerHTML = '';
    if (!state.games.length) {
      const opt = document.createElement('option');
      opt.value = '-1';
      opt.textContent = '\u2014 ' + L.noGames + ' \u2014';
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
      opt.textContent = (i + 1) + '. ' + ev + ' \u2014 ' + w + ' vs ' + b;
      select.appendChild(opt);
    }
  }

  function selectGame(idx) {
    state.selectedIdx = idx;
    state.variationPath = [];
    state.variationPos = 0;
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

  // --- EVENTS (M5 mainline + M7 variation) ---

  select.addEventListener('change', () => {
    const idx = parseInt(select.value, 10);
    if (Number.isFinite(idx)) selectGame(idx);
  });

  btnInit.addEventListener('click', () => {
    if (state.variationPath.length > 0) {
      state.variationPos = 0;
    } else {
      state.moveIdx = 0;
    }
    renderCurrent();
  });

  btnPrev.addEventListener('click', () => {
    if (state.variationPath.length > 0) {
      if (state.variationPos > 0) {
        state.variationPos -= 1;
        renderCurrent();
      } else {
        exitVariation();
      }
      return;
    }
    if (state.moveIdx > 0) state.moveIdx -= 1;
    renderCurrent();
  });

  btnNext.addEventListener('click', () => {
    if (state.variationPath.length > 0) {
      const N = getCurrentList().length;
      if (state.variationPos < N) state.variationPos += 1;
    } else {
      if (state.moveIdx < state.totalMoves) state.moveIdx += 1;
    }
    renderCurrent();
  });

  btnFinal.addEventListener('click', () => {
    if (state.variationPath.length > 0) {
      state.variationPos = getCurrentList().length;
    } else {
      state.moveIdx = state.totalMoves;
    }
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
      state.variationPath = [];
      state.variationPos = 0;
      updateCounter();
      updateButtons();
      renderRav();
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
      variationPath: state.variationPath.slice(),
      variationPos: state.variationPos,
    };
  }

  refresh();

  return { refresh, getFenAt, getState };
}
