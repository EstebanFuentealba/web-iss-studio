// Source-language keys keep ROM metadata and saved projects independent of the UI language.
const escapeRegex = text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
export const LANGUAGES = Object.freeze([
  { code: 'es', name: 'Español', locale: 'es-ES' },
  { code: 'pt', name: 'Português', locale: 'pt-BR' },
  { code: 'en', name: 'English', locale: 'en-US' },
]);
export function normalizeLanguage(value) {
  const code = typeof value === 'string' ? value.toLowerCase().split(/[-_]/)[0] : '';
  return LANGUAGES.some(language => language.code === code) ? code : 'es';
}
export function createTranslator(messages) {
  const patterns = Object.keys(messages).filter(key => /\{\d+\}/.test(key)).map(key => {
    const slots = [];
    const parts = key.split(/(\{\d+\})/);
    const pattern = parts.map(part => {
      if (/^\{\d+\}$/.test(part)) { slots.push(part); return '([\\s\\S]+?)'; }
      return escapeRegex(part);
    }).join('');
    return { key, slots, regex: new RegExp('^' + pattern + '$') };
  }).sort((a, b) => b.key.replace(/\{\d+\}/g, '').length - a.key.replace(/\{\d+\}/g, '').length);
  return function translate(value, language = 'es', depth = 0) {
    if (typeof value !== 'string' || !value || depth > 8) return value;
    const code = normalizeLanguage(language), source = value.trim();
    let output = messages[source]?.[code];
    if (output === undefined) {
      for (const { key, slots, regex } of patterns) {
        const match = source.match(regex);
        if (!match) continue;
        const parameters = Object.fromEntries(slots.map((slot, i) => [slot, translate(match[i + 1], code, depth + 1)]));
        output = messages[key][code].replace(/\{\d+\}/g, slot => parameters[slot]);
        break;
      }
    }
    if (output === undefined) return value;
    return value.slice(0, value.indexOf(source)) + output + value.slice(value.indexOf(source) + source.length);
  };
}
