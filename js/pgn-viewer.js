// js/pgn-viewer.js — PCR M8 PGN viewer (navigation + board driver + RAV + move list)
// M5: mainline navigation (moveIdx: 0..N)
// M7: RAV variations tree display (inline, depth-capped at 3)
// M8: Move list (mainline + nested variations, click to jump)
// M9: Keyboard (← → ↑ ↓) + Slider mainline navigation
// M10: PGN metadata panel (read-only, Event/Site/Date/White/Black/Result/Round + conditional FEN)
// M13: Move explanation region (read-only current-move comment + raw NAGs)
// M14: Session-only editable comment (textarea) · NAG stays display-only
// M15: Session-only Drill / Trainer mode (variant 1A · next-move prompt · SAN text input)

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
    metaHeader: 'Game info',
    metaEvent: 'Event',
    metaSite: 'Site',
    metaDate: 'Date',
    metaWhite: 'White',
    metaBlack: 'Black',
    metaResult: 'Result',
    metaRound: 'Round',
    metaFen: 'FEN',
    metaEmpty: '\u2014',
    explanationLabel: 'Move annotation',
    explanationEmpty: 'No annotation for this move.',
    drillStart: 'Drill',
    drillExit: 'Exit Drill',
    drillPrompt: 'Next move:',
    drillSubmit: 'Submit',
    drillReveal: 'Reveal',
    drillCorrect: '\u2713 Correct',
    drillIncorrect: '\u2717 Incorrect',
    drillCounter: (a, c) => 'Attempted: ' + a + ' / Correct: ' + c,
  },  my: {
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
    metaHeader: 'ဂိမ်း အချက်အလက်',
    metaEvent: 'ပြိုင်ပွဲ',
    metaSite: 'နေရာ',
    metaDate: 'ရက်စွဲ',
    metaWhite: 'အဖြူ',
    metaBlack: 'အမဲ',
    metaResult: 'ရလဒ်',
    metaRound: 'အဆင့်',
    metaFen: 'FEN',
    metaEmpty: '\u2014',
    explanationLabel: 'လှမ်း မှတ်ချက်',
    explanationEmpty: 'ဤလှမ်းအတွက် မှတ်ချက် မရှိပါ။',
    drillStart: 'Drill',
    drillExit: 'Drill ထွက်',
    drillPrompt: 'နောက်လှမ်း:',
    drillSubmit: 'ပို့',
    drillReveal: 'ဖော်',
    drillCorrect: '\u2713 မှန်',
    drillIncorrect: '\u2717 မှား',
    drillCounter: (a, c) => 'ကြိုးစား: ' + a + ' / မှန်: ' + c,
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
    '.pgn-viewer .pgn-viewer-explanation { margin: 6px 0; padding: 6px 8px; background: #f6f6f6; border-radius: 4px; }',
    '.pgn-viewer .pgn-viewer-explanation-header { font-size: 0.85em; margin: 0 0 4px 0; opacity: 0.7; }',
    '.pgn-viewer .pgn-viewer-explanation-edit { width: 100%; box-sizing: border-box; padding: 4px 6px; font: inherit; font-size: 0.95em; border: 1px solid #ccc; border-radius: 3px; background: #fff; resize: vertical; min-height: 2.2em; }',
    '.pgn-viewer .pgn-viewer-explanation-edit:focus { outline: none; border-color: #4a90e2; }',
    '.pgn-viewer .pgn-viewer-explanation-edit.dirty { border-color: #d18b00; background: #fffbea; }',
    '.pgn-viewer .pgn-viewer-explanation-edit:disabled { opacity: 0.6; }',
    '.pgn-viewer .pgn-viewer-explanation-nags { margin: 4px 0 2px 0; font-size: 0.9em; opacity: 0.75; }',
    '.pgn-viewer .pgn-viewer-explanation-empty { margin: 2px 0; font-size: 0.9em; opacity: 0.6; font-style: italic; }',
    '.pgn-viewer .pgn-viewer-drill { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin: 6px 0; padding: 6px 8px; background: #eef4fb; border-radius: 4px; }',
    '.pgn-viewer .pgn-viewer-drill.hidden { display: none; }',
    '.pgn-viewer .pgn-viewer-drill input[type="text"] { padding: 4px 6px; font: inherit; font-size: 0.95em; border: 1px solid #ccc; border-radius: 3px; min-width: 6em; }',
    '.pgn-viewer .pgn-viewer-drill input[type="text"]:disabled { opacity: 0.6; }',
    '.pgn-viewer .pgn-viewer-drill-feedback { font-size: 0.9em; min-width: 5em; }',
    '.pgn-viewer .pgn-viewer-drill-feedback.correct { color: #1a7f1a; }',
    '.pgn-viewer .pgn-viewer-drill-feedback.incorrect { color: #b00; }',
    '.pgn-viewer .pgn-viewer-drill-counter { font-size: 0.85em; opacity: 0.75; margin-left: auto; }',
    '.pgn-viewer .pgn-viewer-move-item.pgn-viewer-drill-hidden { font-style: italic; opacity: 0.5; }',
    '.pgn-viewer .pgn-viewer-drill button { min-height: 44px; min-width: 72px; touch-action: manipulation; -webkit-tap-highlight-color: transparent; }',
  ].join('\n');
  document.head.appendChild(style);
}export function initPgnViewer({ getGames, renderBoard, Chess }) {
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

  // M14 (PG-5): session-only per-move edit store (in-memory · not persisted)
  const sessionEdits = new Map();

  // M15 (PG-3): session-only drill state (in-memory · not persisted)
  const drillSession = {
    active: false,
    attempted: 0,
    correct: 0,
    lastFeedback: null,
  };
  let m14Focused = false;

  function getEditKey() {
    if (state.selectedIdx < 0) return null;
    if (state.variationPath.length === 0) {
      if (state.moveIdx <= 0) return null;
      return state.selectedIdx + '|main|' + state.moveIdx;
    }
    if (state.variationPos <= 0) return null;
    return state.selectedIdx + '|var|' + JSON.stringify(state.variationPath) + '|' + state.variationPos;
  }

  const container = document.getElementById('pgn-viewer');
  if (!container) {
    console.warn('[M8] #pgn-viewer container not found');
    return {
      refresh: () => {},
      getFenAt: () => ({ fen: '', error: 'no container' }),
      getState: () => Object.assign({}, state),
    };
  }
  container.classList.add('pgn-viewer');
  container.innerHTML = '';

  const row1 = document.createElement('div');
  row1.className = 'pgn-viewer-row';
  const selectLabel = document.createElement('label');
  selectLabel.textContent = L.selectLabel + ': ';
  const select = document.createElement('select');
  select.id = 'pgn-game-select';
  selectLabel.appendChild(select);
  row1.appendChild(selectLabel);

  const metaContainer = document.createElement('div');
  metaContainer.className = 'pgn-viewer-meta hidden';
  metaContainer.id = 'pgn-viewer-meta';

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
  const btnDrill = document.createElement('button');
  btnDrill.type = 'button'; btnDrill.id = 'pgn-drill-btn'; btnDrill.textContent = L.drillStart;
  row2.appendChild(btnInit);
  row2.appendChild(btnPrev);
  row2.appendChild(btnNext);
  row2.appendChild(btnFinal);
  row2.appendChild(btnDrill);

  const drillPanel = document.createElement('div');
  drillPanel.className = 'pgn-viewer-drill hidden';
  drillPanel.id = 'pgn-viewer-drill';

  const drillLabel = document.createElement('label');
  drillLabel.textContent = L.drillPrompt + ' ';
  const drillInput = document.createElement('input');
  drillInput.type = 'text';
  drillInput.id = 'pgn-drill-input';
  drillInput.autocomplete = 'off';
  drillInput.autocapitalize = 'off';
  drillInput.spellcheck = false;
  drillInput.disabled = true;
  drillLabel.appendChild(drillInput);

  const drillSubmit = document.createElement('button');
  drillSubmit.type = 'button';
  drillSubmit.id = 'pgn-drill-submit';
  drillSubmit.textContent = L.drillSubmit;
  drillSubmit.disabled = true;

  const drillReveal = document.createElement('button');
  drillReveal.type = 'button';
  drillReveal.id = 'pgn-drill-reveal';
  drillReveal.textContent = L.drillReveal;
  drillReveal.disabled = true;

  const drillFeedback = document.createElement('span');
  drillFeedback.className = 'pgn-viewer-drill-feedback';
  drillFeedback.id = 'pgn-drill-feedback';

  const drillCounterEl = document.createElement('span');
  drillCounterEl.className = 'pgn-viewer-drill-counter';
  drillCounterEl.id = 'pgn-drill-counter';
  drillCounterEl.textContent = L.drillCounter(0, 0);

  drillPanel.appendChild(drillLabel);
  drillPanel.appendChild(drillSubmit);
  drillPanel.appendChild(drillReveal);
  drillPanel.appendChild(drillFeedback);
  drillPanel.appendChild(drillCounterEl);

  const counter = document.createElement('p');
  counter.className = 'pgn-viewer-counter';
  counter.id = 'pgn-move-counter';
  counter.textContent = '';

  const explanationContainer = document.createElement('div');
  explanationContainer.className = 'pgn-viewer-explanation';
  explanationContainer.id = 'pgn-viewer-explanation';

  const ravContainer = document.createElement('div');
  ravContainer.className = 'pgn-viewer-rav';
  ravContainer.id = 'pgn-viewer-rav';

  const moveListContainer = document.createElement('div');
  moveListContainer.className = 'pgn-viewer-move-list';
  moveListContainer.id = 'pgn-viewer-move-list';

  const slider = document.createElement('input');
  slider.type = 'range';
  slider.id = 'pgn-viewer-slider';
  slider.className = 'pgn-viewer-slider';
  slider.min = '0';
  slider.max = '0';
  slider.value = '0';
  slider.disabled = true;

  const status = document.createElement('p');
  status.className = 'pgn-viewer-status';
  status.id = 'pgn-viewer-status';
  status.textContent = '';

  container.appendChild(row1);
  container.appendChild(metaContainer);
  container.appendChild(row2);
  container.appendChild(drillPanel);
  container.appendChild(counter);
  container.appendChild(explanationContainer);
  container.appendChild(ravContainer);
  container.appendChild(moveListContainer);
  container.appendChild(slider);
  container.appendChild(status);

  slider.addEventListener('input', function (e) {
    const v = parseInt(e.target.value, 10);
    if (Number.isInteger(v)) jumpToMainline(v);
  });function computeStartFen(game) {
  if (!game || !game.tags) return null;
  if (game.tags.SetUp === '1' && typeof game.tags.FEN === 'string' && game.tags.FEN.length) {
    return game.tags.FEN;
  }
  return null;
}

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

function validateVariationPath(game, path, varPos) {
  if (!game || !Array.isArray(path)) return { valid: false, list: null };
  if (path.length === 0) return { valid: false, list: null };
  if (path.length > MAX_VARIATION_DEPTH) return { valid: false, list: null };

  let list = Array.isArray(game.moves) ? game.moves : [];

  for (let s = 0; s < path.length; s++) {
    const step = path[s];
    if (!step || !Number.isInteger(step.moveIdx) || !Number.isInteger(step.varIdx)) {
      return { valid: false, list: null };
    }
    if (step.moveIdx < 0 || step.moveIdx >= list.length) {
      return { valid: false, list: null };
    }
    const parentMove = list[step.moveIdx];
    if (!parentMove || !Array.isArray(parentMove.variations)) {
      return { valid: false, list: null };
    }
    if (step.varIdx < 0 || step.varIdx >= parentMove.variations.length) {
      return { valid: false, list: null };
    }
    list = parentMove.variations[step.varIdx];
  }

  if (!Number.isInteger(varPos) || varPos < 0 || varPos > list.length) {
    return { valid: false, list: null };
  }

  return { valid: true, list: list };
}

function getCurrentHighlightKey() {
  if (state.selectedIdx < 0) return null;
  if (state.variationPath.length === 0) return 'main:' + state.moveIdx;
  return 'var:' + JSON.stringify(state.variationPath) + ':' + state.variationPos;
}

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

  btnInit.disabled  = !hasGame || state.moveIdx <= 0;
  btnPrev.disabled  = !hasGame || state.moveIdx <= 0;
  btnNext.disabled  = !hasGame || state.moveIdx >= state.totalMoves;
  btnFinal.disabled = !hasGame || state.moveIdx >= state.totalMoves;
}

function updateSlider() {
  if (!slider) return;
  const hasGame = state.selectedIdx >= 0;
  const inVar = state.variationPath.length > 0;
  slider.max = String(state.totalMoves);
  slider.value = String(state.moveIdx);
  slider.disabled = !hasGame || inVar || drillSession.active;
}function renderMetadata() {
  if (!metaContainer) return;
  metaContainer.innerHTML = '';
  if (state.selectedIdx < 0) {
    metaContainer.classList.add('hidden');
    return;
  }
  const game = state.games[state.selectedIdx];
  if (!game || !game.tags) {
    metaContainer.classList.add('hidden');
    return;
  }
  metaContainer.classList.remove('hidden');

  const tags = game.tags;
  const frag = document.createDocumentFragment();
  const header = document.createElement('p');
  header.className = 'pgn-viewer-meta-header';
  header.textContent = L.metaHeader;
  frag.appendChild(header);

  const empty = L.metaEmpty;
  const rows = [
    { label: L.metaEvent,  key: 'Event'  },
    { label: L.metaSite,   key: 'Site'   },
    { label: L.metaDate,   key: 'Date'   },
    { label: L.metaWhite,  key: 'White'  },
    { label: L.metaBlack,  key: 'Black'  },
    { label: L.metaResult, key: 'Result' },
    { label: L.metaRound,  key: 'Round'  },
  ];

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const raw = tags[r.key];
    const val = (raw === undefined || raw === null || raw === '')
      ? empty
      : String(raw);
    const row = document.createElement('div');
    row.className = 'pgn-viewer-meta-row';
    const lbl = document.createElement('span');
    lbl.className = 'pgn-viewer-meta-label';
    lbl.textContent = r.label;
    const v = document.createElement('span');
    v.className = 'pgn-viewer-meta-value';
    v.textContent = val;
    row.appendChild(lbl);
    row.appendChild(v);
    frag.appendChild(row);
  }

  if (tags.SetUp === '1' && typeof tags.FEN === 'string' && tags.FEN.length) {
    const fenRow = document.createElement('div');
    fenRow.className = 'pgn-viewer-meta-row';
    const fenLbl = document.createElement('span');
    fenLbl.className = 'pgn-viewer-meta-label';
    fenLbl.textContent = L.metaFen;
    const fenVal = document.createElement('span');
    fenVal.className = 'pgn-viewer-meta-value';
    fenVal.textContent = tags.FEN;
    fenRow.appendChild(fenLbl);
    fenRow.appendChild(fenVal);
    frag.appendChild(fenRow);
  }

  metaContainer.appendChild(frag);
}

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
        return function () {
          if (drillSession.active) return;
          enterVariation(idx);
        };
      })(i));
      ravContainer.appendChild(item);
    }
  }

  if (inVar) {
    const exitBtn = document.createElement('button');
    exitBtn.type = 'button';
    exitBtn.className = 'pgn-viewer-exit';
    exitBtn.textContent = L.exitVariation;
    exitBtn.addEventListener('click', function () {
      if (drillSession.active) return;
      exitVariation();
    });
    ravContainer.appendChild(exitBtn);
  }
}

function formatMoveText(move) {
  if (!move || !move.san) return '';
  let t = '';
  if (move.color === 'w' && move.moveNumber != null) t = move.moveNumber + '. ';
  else if (move.color === 'b' && move.moveNumber != null) t = move.moveNumber + '... ';
  t += move.san;
  return t;
}

function buildMoveItem(move, key, clickData, currentKey, depth) {
  const el = document.createElement('div');
  el.className = 'pgn-viewer-move-item';
  el.dataset.key = key;
  el.dataset.depth = String(depth);
  el.textContent = formatMoveText(move);
  if (key === currentKey) el.classList.add('active');
  el.addEventListener('click', function () {
    if (clickData.type === 'mainline') jumpToMainline(clickData.idx);
    else jumpToVariation(clickData.path, clickData.varPos);
  });
  return el;
}

function renderMoveSequence(moves, parentPath, depth, frag, currentKey) {
  if (depth > MAX_VARIATION_DEPTH) return;
  if (!Array.isArray(moves)) return;

  for (let i = 0; i < moves.length; i++) {
    const m = moves[i];
    if (!m) continue;

    let key, clickData;
    if (depth === 0) {
      key = 'main:' + (i + 1);
      clickData = { type: 'mainline', idx: i + 1 };
    } else {
      key = 'var:' + JSON.stringify(parentPath) + ':' + (i + 1);
      clickData = { type: 'variation', path: parentPath, varPos: i + 1 };
    }

    frag.appendChild(buildMoveItem(m, key, clickData, currentKey, depth));

    if (Array.isArray(m.variations) && m.variations.length && depth < MAX_VARIATION_DEPTH) {
      for (let vi = 0; vi < m.variations.length; vi++) {
        const newPath = parentPath.concat([{ moveIdx: i, varIdx: vi }]);
        renderMoveSequence(m.variations[vi], newPath, depth + 1, frag, currentKey);
      }
    }
  }
}

function renderMoveList() {
  moveListContainer.innerHTML = '';
  if (state.selectedIdx < 0) return;
  const game = state.games[state.selectedIdx];
  if (!game || !Array.isArray(game.moves)) return;

  const currentKey = getCurrentHighlightKey();
  const frag = document.createDocumentFragment();
  renderMoveSequence(game.moves, [], 0, frag, currentKey);
  moveListContainer.appendChild(frag);

  if (drillSession.active && state.variationPath.length === 0) {
    const targetKey = 'main:' + (state.moveIdx + 1);
    const items = moveListContainer.querySelectorAll('.pgn-viewer-move-item');
    for (let i = 0; i < items.length; i++) {
      if (items[i].dataset.key === targetKey) {
        items[i].classList.add('pgn-viewer-drill-hidden');
        items[i].textContent = '?';
        break;
      }
    }
  }
}

function getCurrentMoveForExplanation() {
  if (state.selectedIdx < 0) return null;
  const game = state.games[state.selectedIdx];
  if (!game) return null;
  if (state.variationPath.length === 0) {
    if (state.moveIdx <= 0) return null;
    const moves = Array.isArray(game.moves) ? game.moves : [];
    if (state.moveIdx > moves.length) return null;
    return moves[state.moveIdx - 1];
  }
  if (state.variationPos <= 0) return null;
  const list = getCurrentList();
  if (state.variationPos > list.length) return null;
  return list[state.variationPos - 1];
}

function renderExplanation() {
  if (!explanationContainer) return;
  explanationContainer.innerHTML = '';

  const header = document.createElement('p');
  header.className = 'pgn-viewer-explanation-header';
  header.textContent = L.explanationLabel;
  explanationContainer.appendChild(header);

  const move = getCurrentMoveForExplanation();
  if (!move) {
    const empty = document.createElement('p');
    empty.className = 'pgn-viewer-explanation-empty';
    empty.textContent = L.explanationEmpty;
    explanationContainer.appendChild(empty);
    return;
  }

  const nags = Array.isArray(move.nags)
    ? move.nags.filter(function (n) { return typeof n === 'string' && n.length; })
    : [];

  const key = getEditKey();
  const edit = document.createElement('textarea');
  edit.className = 'pgn-viewer-explanation-edit';
  edit.rows = 2;
  edit.placeholder = L.explanationEmpty;

  let initialValue = '';
  if (key && sessionEdits.has(key)) {
    initialValue = sessionEdits.get(key);
    edit.classList.add('dirty');
  } else if (typeof move.comment === 'string' && move.comment.length) {
    initialValue = move.comment;
  }
  edit.value = initialValue;

  if (key) {
    edit.addEventListener('input', (function (k) {
      return function (ev) {
        sessionEdits.set(k, ev.target.value);
        ev.target.classList.add('dirty');
      };
    })(key));
    if (drillSession.active) {
      edit.disabled = true;
    } else {
      edit.addEventListener('focus', function () {
        m14Focused = true;
        updateDrillUI();
      });
      edit.addEventListener('blur', function () {
        m14Focused = false;
        updateDrillUI();
      });
    }
  } else {
    edit.disabled = true;
  }

  explanationContainer.appendChild(edit);

  if (nags.length > 0) {
    const n = document.createElement('p');
    n.className = 'pgn-viewer-explanation-nags';
    n.textContent = nags.join(', ');
    explanationContainer.appendChild(n);
  }
}

function jumpToMainline(idx) {
  if (state.selectedIdx < 0) return;
  const game = state.games[state.selectedIdx];
  if (!game) return;
  const total = Array.isArray(game.moves) ? game.moves.length : 0;
  if (!Number.isInteger(idx) || idx < 0 || idx > total) return;
  state.variationPath = [];
  state.variationPos = 0;
  state.moveIdx = idx;
  renderCurrent();
}

function jumpToVariation(path, varPos) {
  if (drillSession.active) resetDrillState();
  if (state.selectedIdx < 0) return;
  const game = state.games[state.selectedIdx];
  if (!game) return;
  const check = validateVariationPath(game, path, varPos);
  if (!check.valid) return;
  state.variationPath = path.map(function (s) {
    return { moveIdx: s.moveIdx, varIdx: s.varIdx };
  });
  state.variationPos = varPos;
  renderCurrent();
}

function renderCurrent() {
  if (state.selectedIdx < 0) {
    updateCounter(); updateButtons(); updateSlider();
    renderMetadata(); renderRav(); renderMoveList(); renderExplanation();
    updateDrillUI();
    return;
  }
  const game = state.games[state.selectedIdx];
  if (!game) {
    updateCounter(); updateButtons(); updateSlider();
    renderMetadata(); renderRav(); renderMoveList(); renderExplanation();
    updateDrillUI();
    return;
  }

  let result;
  if (state.variationPath.length === 0) {
    result = buildFenAt(game, state.moveIdx);
  } else {
    result = buildFenAtPath(game, state.variationPath, state.variationPos);
  }

  const boardEl = document.getElementById('board');
  if (result.fen && boardEl) {
    try {
      renderBoard(boardEl, result.fen);
    } catch (e) {
      setStatus('renderBoard error: ' + (e && e.message ? e.message : String(e)), true);
      updateCounter(); updateButtons(); updateSlider();
      renderMetadata(); renderRav(); renderMoveList(); renderExplanation();
      updateDrillUI();
      return;
    }
  }
  if (result.error) setStatus(result.error, true);
  else setStatus('', false);
  updateCounter(); updateButtons(); updateSlider();
  renderMetadata(); renderRav(); renderMoveList(); renderExplanation();
  updateDrillUI();
}

function enterVariation(varIdx) {
  if (drillSession.active) resetDrillState();
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
    state.moveIdx = lastStep.moveIdx;
    state.variationPos = 0;
  } else {
    state.variationPos = lastStep.moveIdx + 1;
  }
  renderCurrent();
}

function stepPrev() {
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
}

function stepNext() {
  if (state.variationPath.length > 0) {
    const N = getCurrentList().length;
    if (state.variationPos < N) state.variationPos += 1;
  } else {
    if (state.moveIdx < state.totalMoves) state.moveIdx += 1;
  }
  renderCurrent();
}

function getExpectedSanForDrill() {
  if (state.selectedIdx < 0) return null;
  if (state.variationPath.length > 0) return null;
  const game = state.games[state.selectedIdx];
  if (!game) return null;
  const moves = Array.isArray(game.moves) ? game.moves : [];
  const nextIdx = state.moveIdx;
  if (nextIdx < 0 || nextIdx >= moves.length) return null;
  const m = moves[nextIdx];
  return (m && typeof m.san === 'string' && m.san.length) ? m.san : null;
}

function resetDrillState() {
  drillSession.active = false;
  drillSession.attempted = 0;
  drillSession.correct = 0;
  drillSession.lastFeedback = null;
}

function updateDrillUI() {
  if (!drillPanel || !btnDrill) return;
  if (drillSession.active) {
    btnDrill.textContent = L.drillExit;
    drillPanel.classList.remove('hidden');
    btnDrill.disabled = false;
  } else {
    btnDrill.textContent = L.drillStart;
    drillPanel.classList.add('hidden');
    btnDrill.disabled = m14Focused;
  }

  const hasNext = drillSession.active && getExpectedSanForDrill() !== null;
  drillInput.disabled = !drillSession.active || !hasNext;
  drillSubmit.disabled = !drillSession.active || !hasNext;
  drillReveal.disabled = !drillSession.active || !hasNext;

  drillCounterEl.textContent = L.drillCounter(drillSession.attempted, drillSession.correct);

  if (drillSession.lastFeedback === 'correct') {
    drillFeedback.textContent = L.drillCorrect;
    drillFeedback.className = 'pgn-viewer-drill-feedback correct';
  } else if (drillSession.lastFeedback === 'incorrect') {
    drillFeedback.textContent = L.drillIncorrect;
    drillFeedback.className = 'pgn-viewer-drill-feedback incorrect';
  } else {
    drillFeedback.textContent = '';
    drillFeedback.className = 'pgn-viewer-drill-feedback';
  }
}

function enterDrill() {
  if (state.selectedIdx < 0) return;
  if (state.variationPath.length > 0) return;
  drillSession.active = true;
  drillSession.attempted = 0;
  drillSession.correct = 0;
  drillSession.lastFeedback = null;
  drillInput.value = '';
  renderCurrent();
}

function exitDrill() {
  resetDrillState();
  drillInput.value = '';
  renderCurrent();
}

function handleDrillSubmit() {
  if (!drillSession.active) return;
  const raw = drillInput.value;
  const trimmed = (raw || '').trim();
  if (trimmed === '') return;
  const expected = getExpectedSanForDrill();
  if (!expected) return;
  const match = trimmed.toLowerCase() === expected.toLowerCase();
  drillSession.attempted += 1;
  if (match) {
    drillSession.correct += 1;
    drillSession.lastFeedback = 'correct';
    if (state.moveIdx < state.totalMoves) state.moveIdx += 1;
  } else {
    drillSession.lastFeedback = 'incorrect';
  }
  drillInput.value = '';
  renderCurrent();
}

function handleDrillReveal() {
  if (!drillSession.active) return;
  const expected = getExpectedSanForDrill();
  if (!expected) return;
  drillSession.attempted += 1;
  drillSession.lastFeedback = null;
  if (state.moveIdx < state.totalMoves) state.moveIdx += 1;
  drillInput.value = '';
  renderCurrent();
}  function buildSelectOptions() {
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
    if (drillSession.active) {
      resetDrillState();
      drillInput.value = '';
    }
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

  btnDrill.addEventListener('click', function () {
    if (drillSession.active) exitDrill();
    else enterDrill();
  });

  drillSubmit.addEventListener('click', handleDrillSubmit);
  drillReveal.addEventListener('click', handleDrillReveal);

  drillInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleDrillSubmit();
    }
  });

  function refresh() {
    const games = getGames();
    state.games = Array.isArray(games) ? games : [];
    buildSelectOptions();
    if (state.games.length === 0) {
      resetDrillState();
      drillInput.value = '';
      state.selectedIdx = -1;
      state.moveIdx = 0;
      state.totalMoves = 0;
      state.variationPath = [];
      state.variationPos = 0;
      updateCounter(); updateButtons(); updateSlider();
      renderMetadata(); renderRav(); renderMoveList(); renderExplanation();
      updateDrillUI();
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

  function isEditableFocused() {
    const el = document.activeElement;
    if (!el) return false;
    const tag = el.tagName;
    if (tag === 'SELECT' || tag === 'INPUT' || tag === 'TEXTAREA') return true;
    if (el.isContentEditable) return true;
    return false;
  }

  function onKeyDown(e) {
    if (isEditableFocused()) return;
    const key = e.key;
    if (key === 'ArrowLeft') {
      e.preventDefault();
      stepPrev();
    } else if (key === 'ArrowRight') {
      e.preventDefault();
      stepNext();
    } else if (key === 'ArrowUp') {
      e.preventDefault();
      exitVariation();
    } else if (key === 'ArrowDown') {
      e.preventDefault();
      enterVariation(0);
    }
  }

  document.addEventListener('keydown', onKeyDown);

  refresh();

  return { refresh, getFenAt, getState };
}
