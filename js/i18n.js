// PCR Trainer — M3 i18n Module
// Hand-written EN/MY dictionary. No external dependency.
// Scope: M3 static UI labels only (no chess/data text).

const dict = {
  en: {
    title: 'PCR Trainer',
    subtitle: 'M3 — Burmese Font + UI Labels (Localization Foundation)',
  },
  my: {
    title: 'PCR Trainer',
    subtitle: 'M3 — မြန်မာဖောင့်နှင့် UI စာသား',
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
