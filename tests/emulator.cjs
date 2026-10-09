const assert = require('assert/strict');
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
// Exercise the frame lifecycle without fetching a third-party runtime.
const origin = 'http://localhost:3000';
const timers = new Set();
const component = vm.runInNewContext(read('src/components/RomEmulator.vue').match(/<script>([\s\S]*?)<\/script>/)[1]
  .replace('export default', 'module.exports =').replace('import.meta.env.BASE_URL', "'/studio/'"), {
  module: { exports: {} }, window: { location: { origin } },
  setTimeout: fn => { timers.add(fn); return fn; }, clearTimeout: fn => timers.delete(fn),
});
const sent = [];
const frame = { postMessage: (...args) => sent.push(args) };
const exported = Uint8Array.from({ length: 1024 }, (_, i) => i % 256);
const editor = { ...component.data(), project: { headerSize: 512, exportRom: () => exported.slice() },
  revision: 1, $refs: { frame: { contentWindow: frame } } };
for (const [name, fn] of Object.entries(component.methods)) editor[name] = fn.bind(editor);
editor.start();
assert.equal(editor.frameUrl, '/studio/emulator/index.html');
assert.equal(editor.active, true);
assert.deepEqual(editor.snapshot, exported.slice(512));
editor.sendRom(); editor.sendRom();
assert.equal(sent.length, 1);
assert.equal(sent[0][1], origin);
assert.equal(sent[0][2][0], sent[0][0].bytes.buffer);
assert.deepEqual(exported.slice(0, 512), Uint8Array.from({ length: 512 }, (_, i) => i % 256));
editor.receive({ origin: 'https://untrusted.example', source: frame, data: { type: 'issd:emulator-status', state: 'error' } });
assert.equal(editor.active, true);
editor.receive({ origin, source: {}, data: { type: 'issd:emulator-status', state: 'error' } });
assert.equal(editor.active, true);
editor.receive({ origin, source: frame, data: { type: 'issd:emulator-status', state: 'ready' } });
assert.equal(timers.size, 0);
editor.revision = 2; editor.start();
assert.equal(editor.loadedRevision, 2);
editor.stop(); assert.equal(timers.size, 0); assert.equal(editor.snapshot, null);
editor.start(); [...timers][0](); assert.equal(editor.active, false); assert.match(editor.error, /conexión/);
editor.project.exportRom = () => { throw Error('ROM inválida'); };
editor.start(); assert.equal(editor.active, false); assert.match(editor.error, /ROM inválida/);

const listeners = {}, reports = [], blobs = [], scripts = [], revoked = [];
const parent = { postMessage: data => reports.push(data) };
const game = { textContent: '' };
const context = { Uint8Array, Blob: require('buffer').Blob, parent, location: { origin },
  URL: { createObjectURL: blob => { blobs.push(blob); return 'blob:rom'; }, revokeObjectURL: url => revoked.push(url) },
  document: { getElementById: () => game, createElement: () => ({}), body: { appendChild: script => scripts.push(script) } },
  window: { addEventListener: (name, fn) => { listeners[name] = fn; } } };
vm.runInNewContext(read('public/emulator/player.js'), context);
const load = { origin, source: parent, data: { type: 'issd:load-rom', bytes: Uint8Array.of(1, 2, 3) } };
listeners.message({ ...load, origin: 'https://untrusted.example' }); assert.equal(scripts.length, 0);
listeners.message(load); listeners.message(load);
assert.equal(scripts.length, 1); assert.equal(blobs[0].size, 3);
assert.equal(context.window.EJS_core, 'snes'); assert.equal(context.window.EJS_gameUrl, 'blob:rom');
context.window.EJS_ready(); context.window.EJS_onGameStart();
assert.deepEqual(reports.map(r => r.state), ['ready', 'running']);
scripts[0].onerror(); assert.equal(reports.at(-1).state, 'error');
listeners.pagehide(); assert.deepEqual(revoked, ['blob:rom']);
console.log('PASS emulator: validated snapshot, SMC header removal, reload, origin checks, cleanup and load errors');

// The selected UI language configures the isolated EmulatorJS runtime too.
for (const [language, locale, startName] of [['en', 'en-US', 'Start game'], ['pt', 'pt-BR', 'Iniciar jogo']]) {
  const localizedListeners = {}, localizedGame = { textContent: '' };
  const localized = { ...context,
    document: { documentElement: {}, getElementById: () => localizedGame, createElement: () => ({}), body: { appendChild() {} } },
    window: { addEventListener: (name, fn) => { localizedListeners[name] = fn; } },
  };
  vm.runInNewContext(read('public/emulator/player.js'), localized);
  localizedListeners.message({ ...load, data: { ...load.data, language } });
  assert.equal(localized.window.EJS_language, locale);
  assert.equal(localized.window.EJS_startButtonName, startName);
  assert.equal(localized.document.documentElement.lang, language);
  localizedListeners.error();
  assert.match(localizedGame.textContent, language === 'en' ? /Check your connection/ : /Verifique sua conexão/);
}
console.log('PASS emulator languages: English and Portuguese runtime, start button and load errors');
