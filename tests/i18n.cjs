const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const { parse: parseVue } = require('@vue/compiler-dom');
const { parse } = require('@babel/parser');
const root = path.join(__dirname, '..');
const messages = require('../src/i18n/messages.json');
function walk(node, callback) {
  if (!node || typeof node !== 'object') return;
  callback(node);
  for (const [key, value] of Object.entries(node)) {
    if (['loc', 'comments', 'tokens'].includes(key)) continue;
    if (Array.isArray(value)) value.forEach(item => walk(item, callback));
    else if (value && typeof value === 'object') walk(value, callback);
  }
}
(async () => {
  const { createTranslator, normalizeLanguage } = await import('../src/i18n/translate.mjs');
  const t = createTranslator(messages);
  assert.equal(normalizeLanguage('pt-BR'), 'pt');
  assert.equal(normalizeLanguage('en-US'), 'en');
  assert.equal(normalizeLanguage('fr'), 'es');
  for (const [key, variants] of Object.entries(messages)) {
    const slots = text => (text.match(/\{\d+\}/g) || []).sort();
    for (const language of ['es', 'pt', 'en']) {
      assert.ok(variants[language]?.trim(), `Missing ${language}: ${key}`);
      assert.deepEqual(slots(variants[language]), slots(key), `Placeholders differ in ${language}: ${key}`);
    }
  }
  assert.equal(t('Jugadores', 'en'), 'Players');
  assert.equal(t('Jugadores', 'pt'), 'Jogadores');
  assert.equal(t('speed', 'es'), 'Velocidad');
  assert.equal(t('speed', 'pt'), 'Velocidade');
  assert.equal(t('No se pudo preparar la ROM: Equipo inválido.', 'en'), 'Could not prepare the ROM: Invalid team.');
  assert.equal(t('Este slot admite hasta 8 caracteres A–Z, puntos y espacios.', 'pt'), 'Este slot aceita até 8 caracteres A–Z, pontos e espaços.');
  assert.equal(t('Valor de shotPower inválido (1–10).', 'en'), 'Invalid Shot power value (1–10).');
  assert.equal(t('Foto 2 de portada · centro izquierda', 'en'), 'Title photo 2 · center left');
  assert.equal(t('  Guardado: 09/10/2026 12:30  ', 'en'), '  Saved: 09/10/2026 12:30  ');
  assert.equal(t('custom player name', 'pt'), 'custom player name');
  assert.equal(t('0.125 segundos', 'en'), '0.125 seconds');
  assert.equal(t(42, 'en'), 42);
  assert.equal(t(null, 'pt'), null);
  // Every literal passed to $t must have a complete catalog entry.
  const files = ['src/App.vue', 'src/views/Home.vue', ...fs.readdirSync(path.join(root, 'src/components')).filter(f => f.endsWith('.vue')).map(f => 'src/components/' + f)];
  for (const file of files) {
    const source = fs.readFileSync(path.join(root, file), 'utf8');
    const template = source.slice(source.indexOf('<template>') + 10, source.lastIndexOf('</template>'));
    walk(parseVue(template), node => {
      if (node.type !== 4) return;
      let ast;
      try { ast = parse('(' + node.content + ')'); } catch { return; }
      walk(ast, expr => {
        if (expr.type === 'CallExpression' && expr.callee.name === '$t' && expr.arguments[0]?.type === 'StringLiteral') {
          assert.ok(messages[expr.arguments[0].value], `Missing text in ${file}: ${expr.arguments[0].value}`);
        }
      });
    });
  }
  // Translated option labels must retain the binary field identifier as their value.
  const studio = fs.readFileSync(path.join(root, 'src/components/StudioEditor.vue'), 'utf8');
  assert.match(studio, /<option v-for="s in stats"[^>]*:value="s"/);
  console.log('PASS i18n: 3 complete catalogs, interpolation, nested errors, source data, locale fallback and editor field values');
})();
