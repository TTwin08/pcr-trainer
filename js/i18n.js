// PCR Trainer — M6.2 i18n Module
// Hand-written EN/MY dictionary. No external dependency.
// Scope: static UI labels only (no chess/data text).

const dict = {
  en: {
    title: 'PCR Trainer',
    subtitle: 'M6 — Post-Import Viewer Refresh',
  },
  my: {
    title: 'PCR Trainer',
    subtitle: 'M6 — PGN Import ပြီးနောက် Viewer Refresh',
  },
};

let currentLang = 'my';

export function t(key) {
  const lang = dict[currentLang];
  if (!lang || !(key in lang)) {
    console.warn('[i18n] missing key:', key, 'for lang:', currentLang);
    return key;
  }
  return lang[key];
}

export function setLang(lang) {
  if (dict[lang]) currentLang = lang;
}

export function getLang() {
  return currentLang;
}
