import { ref, watch } from 'vue';
import messages from './messages.json';
import { createTranslator, LANGUAGES, normalizeLanguage } from './translate.mjs';
export { LANGUAGES };
const STORAGE_KEY = 'issd-studio-language';
function initialLanguage() {
  try { const saved = localStorage.getItem(STORAGE_KEY); if (saved) return normalizeLanguage(saved); } catch {}
  return normalizeLanguage(navigator.language);
}
export const language = ref(initialLanguage());
const translate = createTranslator(messages);
export const t = value => translate(value, language.value);
export function setLanguage(value) { language.value = normalizeLanguage(value); }
watch(language, value => {
  document.documentElement.lang = value;
  try { localStorage.setItem(STORAGE_KEY, value); } catch { /* Language switching also works without storage. */ }
}, { immediate: true });
export default {
  install(app) {
    app.config.globalProperties.$t = t;
    Object.defineProperty(app.config.globalProperties, '$locale', { get: () => language.value });
  },
};
