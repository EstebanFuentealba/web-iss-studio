// Each iframe owns one runtime. Removing it stops the core, sound and input handlers.
(() => {
  let romUrl = null;
  const messages = {
    es: { locale: 'es-ES', title: 'ISSD · Emulador SNES', preparing: 'Preparando ROM modificada…', start: 'Iniciar juego', error: 'No se pudo cargar el motor SNES. Revisa tu conexión y vuelve a intentarlo.' },
    pt: { locale: 'pt-BR', title: 'ISSD · Emulador SNES', preparing: 'Preparando ROM modificada…', start: 'Iniciar jogo', error: 'Não foi possível carregar o motor SNES. Verifique sua conexão e tente novamente.' },
    en: { locale: 'en-US', title: 'ISSD · SNES emulator', preparing: 'Preparing modified ROM…', start: 'Start game', error: 'Could not load the SNES engine. Check your connection and try again.' },
  };
  const requested = typeof URLSearchParams === 'function' ? new URLSearchParams(location.search).get('lang') : 'es';
  let language = Object.hasOwnProperty.call(messages, requested) ? requested : 'es';
  const updateLanguage = () => {
    document.documentElement && (document.documentElement.lang = language);
    document.title = messages[language].title;
    document.getElementById('game').textContent = messages[language].preparing;
  };
  updateLanguage();
  const report = (state, message) => parent.postMessage({ type: 'issd:emulator-status', state, message }, location.origin);
  const fail = () => {
    document.getElementById('game').textContent = messages[language].error;
    report('error', messages[language].error);
  };
  window.addEventListener('message', event => {
    if (event.source !== parent || event.origin !== location.origin || event.data?.type !== 'issd:load-rom' || romUrl) return;
    language = Object.hasOwnProperty.call(messages, event.data.language) ? event.data.language : language;
    updateLanguage();
    const bytes = event.data.bytes;
    if (!(bytes instanceof Uint8Array) || !bytes.length) { fail(); return; }
    romUrl = URL.createObjectURL(new Blob([bytes], { type: 'application/octet-stream' }));
    Object.assign(window, {
      EJS_player: '#game', EJS_core: 'snes', EJS_gameUrl: romUrl,
      EJS_gameName: 'ISSD-editado', EJS_pathtodata: 'https://cdn.emulatorjs.org/stable/data/',
      EJS_language: messages[language].locale, EJS_color: '#176be0', EJS_backgroundColor: '#101820',
      EJS_startOnLoaded: false, EJS_startButtonName: messages[language].start, EJS_threads: false,
      EJS_disableLocalStorage: true, EJS_noAutoFocus: true,
      EJS_ready: () => report('ready'), EJS_onGameStart: () => report('running'),
    });
    const loader = document.createElement('script');
    loader.src = `${window.EJS_pathtodata}loader.js`;
    loader.onerror = fail;
    document.body.appendChild(loader);
  });
  window.addEventListener('error', fail);
  window.addEventListener('unhandledrejection', fail);
  window.addEventListener('pagehide', () => { if (romUrl) URL.revokeObjectURL(romUrl); });
})();
