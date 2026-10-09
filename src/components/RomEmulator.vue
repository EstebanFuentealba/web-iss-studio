<template>
  <section>
    <h2>{{ $t("Emulador SNES") }}</h2>
    <p>{{ $t("Prueba la ROM con los cambios aplicados al proyecto. El motor de EmulatorJS se descarga al abrir este menú y requiere internet.") }}</p>
    <div class="controls">
      <button @click="start">{{ $t(active ? 'Recargar ROM modificada' : 'Cargar ROM modificada') }}</button>
      <button @click="stop" :disabled="!active">{{ $t("Detener") }}</button>
    </div>
    <p v-if="active && loadedRevision !== revision" class="notice">{{ $t("Hay cambios nuevos. Recarga la ROM para probarlos; el juego comenzará desde el inicio.") }}</p>
    <p role="status">{{ $t(status) }}</p>
    <p v-if="error" class="error" role="alert">{{ $t(error) }}</p>
    <iframe v-if="active" :key="session" ref="frame" :src="frameUrl+'?lang='+$locale" :title="$t(&quot;Emulador de la ROM ISSD modificada&quot;)" allow="autoplay; fullscreen; gamepad" allowfullscreen @load="sendRom" />
    <p>{{ $t("Haz clic en «Iniciar juego» dentro de la pantalla. En la barra del emulador puedes pausar, usar pantalla completa y configurar teclado o mando. Al salir de este menú se detiene la emulación.") }}</p>
  </section>
</template>

<script>
export default {
  props: { project: { type: Object, required: true }, revision: Number },
  data() {
    return { active: false, session: 0, loadedRevision: null, status: '', error: '', snapshot: null, timer: null,
      frameUrl: `${import.meta.env.BASE_URL}emulator/index.html` };
  },
  mounted() { window.addEventListener('message', this.receive); this.start(); },
  beforeUnmount() { this.stop(); window.removeEventListener('message', this.receive); },
  methods: {
    start() {
      this.stop(); this.error = '';
      try {
        // Use the same validated export as the download, without the copier header.
        this.snapshot = this.project.exportRom().slice(this.project.headerSize);
        this.loadedRevision = this.revision; this.session++; this.active = true;
        this.status = 'Cargando motor SNES…';
        this.timer = setTimeout(() => this.fail('La carga está tardando demasiado. Revisa tu conexión y vuelve a cargar la ROM.'), 60000);
      } catch (error) { this.fail(`No se pudo preparar la ROM: ${error.message}`); }
    },
    stop() {
      clearTimeout(this.timer); this.timer = null; this.active = false; this.snapshot = null;
      this.status = 'Emulador detenido.';
    },
    fail(message) { this.stop(); this.error = message; },
    sendRom() {
      if (!this.active || !this.snapshot || !this.$refs.frame) return;
      const bytes = this.snapshot; this.snapshot = null;
      this.$refs.frame.contentWindow.postMessage({ type: 'issd:load-rom', bytes, language: this.$locale || 'es' }, window.location.origin, [bytes.buffer]);
    },
    receive(event) {
      if (!this.active || event.origin !== window.location.origin || event.source !== this.$refs.frame?.contentWindow) return;
      const data = event.data;
      if (data?.type !== 'issd:emulator-status') return;
      if (data.state === 'error') { this.fail(data.message || 'No se pudo cargar el emulador. Vuelve a intentarlo.'); return; }
      if (data.state === 'ready' || data.state === 'running') {
        clearTimeout(this.timer); this.timer = null;
        this.status = data.state === 'ready' ? 'ROM cargada. Pulsa «Iniciar juego» en la pantalla.' : 'Ejecutando ROM modificada.';
      }
    },
  },
};
</script>

<style scoped>
iframe{display:block;width:100%;height:560px;max-height:75vh;min-height:320px;border:0;border-radius:10px;background:#101820}
.controls{display:flex;gap:8px;flex-wrap:wrap}button{padding:8px 12px;font:inherit;border:1px solid #bbc8d6;border-radius:5px;cursor:pointer}button:disabled{opacity:.45;cursor:default}
.notice{padding:10px;background:#fff0ca}.error{color:#a32121}
</style>
