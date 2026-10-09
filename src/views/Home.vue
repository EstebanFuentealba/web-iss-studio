<template>
  <main>
    <h1>Web ISS Studio</h1>
    <label for="rom">Abrir ROM ISS / ISS Deluxe (USA)</label>
    <input id="rom" type="file" accept=".sfc,.smc" @change="onChangeFile" :disabled="loading" />
    <p v-if="loading" role="status">Leyendo ROM…</p>
    <p v-if="error" role="alert" class="error">{{ error }}</p>
    <StudioEditor ref="editor" v-if="session?.game === 'issd'" :input="session.input" @import-rom="loadFile($event, true)" />
    <template v-if="session && session.game !== 'issd'">
      <p>{{ session.label }} · {{ teams.length }} equipos · {{ session.headerSize ? 'Cabecera SMC detectada' : 'Sin cabecera SMC' }}</p>
      <nav aria-label="Equipos">
        <button @click="move(-1)" :disabled="loading">Anterior</button>
        <select aria-label="Seleccionar equipo" :value="teamIndex" @change="selectTeam(Number($event.target.value))" :disabled="loading">
          <option v-for="(name, index) in teams" :key="index" :value="index">{{ index + 1 }}. {{ name }}</option>
        </select>
        <button @click="move(1)" :disabled="loading">Siguiente</button>
      </nav>
      <section v-if="teamData">
        <h2>{{ teamData.name }} <small>({{ teams[teamIndex] }})</small></h2>
        <div class="images">
          <figure><RomImage :matrix="teamData.flag" :colors="teamData.colors" label="Bandera del equipo" /><figcaption>Bandera de la ROM</figcaption></figure>
          <figure><RomImage :matrix="teamData.teamMatrix" :colors="teamData.teamColors" label="Rótulo del equipo" /><figcaption>Rótulo de la ROM</figcaption></figure>
        </div>
        <h3>Jugadores ({{ teamData.players.length }})</h3>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Dorsal</th><th>Nombre</th><th v-if="session.game === 'issd'">Posición</th><th>Pelo</th><th v-if="session.game === 'issd'">Piel</th><th>Datos</th></tr></thead>
            <tbody><tr v-for="(player, index) in teamData.players" :key="index">
              <td>{{ player.no }}</td><td>{{ player.name }}</td><td v-if="session.game === 'issd'">{{ positions[player.position] || player.position }}</td>
              <td><div class="appearance"><RomImage v-if="player.head" compact :matrix="player.head" :colors="player.headColors" :label="`Cabeza de ${player.name}, pelo ${player.hair}`" /><span>{{ player.hair }}</span></div></td>
              <td v-if="session.game === 'issd'"><div class="appearance"><span class="skin-swatch" :style="{ backgroundColor: player.skinColor }" role="img" :aria-label="`Piel de ${player.name}: ${player.skinColor}`" :title="player.skinColor"></span><span>{{ player.skin }}</span></div></td>
              <td><details><summary>Ver atributos</summary><pre>{{ JSON.stringify(playerAttributes(player), null, 2) }}</pre></details></td>
            </tr></tbody>
          </table>
        </div>
      </section>
      <section v-if="session.game === 'issd'" class="audio-section">
        <h2>Audio de la ROM</h2>
        <p>Voces y muestras BRR extraídas del archivo abierto. La velocidad de previsualización es ajustable; la música secuenciada requiere el motor SPC700.</p>
        <label for="sample">Muestra</label>
        <select id="sample" v-model.number="sampleIndex" @change="clearAudio">
          <option v-for="(sample, index) in audioSamples" :key="index" :value="index">{{ sample.name }}</option>
        </select>
        <label for="rate">Frecuencia de previsualización</label>
        <select id="rate" v-model.number="sampleRate" @change="clearAudio"><option :value="8000">8 kHz</option><option :value="16000">16 kHz</option><option :value="32000">32 kHz</option></select>
        <button @click="prepareAudio">Cargar audio</button>
        <p v-if="audioError" class="error" role="alert">{{ audioError }}</p>
        <div v-if="audioUrl" class="audio-output"><audio :key="audioUrl" controls :src="audioUrl" /><a :href="audioUrl" :download="audioSamples[sampleIndex].name + '.wav'">Descargar WAV</a></div>
      </section>
    </template>
  </main>
</template>
<script>
import { markRaw } from 'vue';
import RomImage from '../components/RomImage.vue';
import StudioEditor from '../components/StudioEditor.vue';
import Storage from '../utils/Storage';
import { openRom } from '../rom/binary.mjs';
import { teamNames, readTeam } from '../rom/studio';
import { AUDIO_SAMPLES, DEFAULT_SAMPLE_RATE, readAudioSample, wavBlob } from '../rom/audio.mjs';
export default {
  components: { RomImage, StudioEditor },
  data() {
    return {
      session: null, teamData: null, teams: [], teamIndex: 0, loading: false, error: '',
      storage: markRaw(new Storage()), audioSamples: AUDIO_SAMPLES, sampleIndex: AUDIO_SAMPLES.findIndex(s => s.name === 'TitleScreenNameDrop'),
      sampleRate: DEFAULT_SAMPLE_RATE, audioUrl: '', audioError: '', loadVersion: 0,
      positions: { 1: 'Portero', 2: 'Defensa', 3: 'Medio defensivo', 4: 'Mediocampo', 5: 'Medio ofensivo', 6: 'Delantero' },
    };
  },
  mounted() {
    const version = this.loadVersion;
    this.storage.init(() => this.storage.get(file => {
      if (file && version === this.loadVersion) this.loadFile(file);
    }));
  },
  beforeUnmount() { this.loadVersion++; this.clearAudio(); },
  methods: {
    playerAttributes({ head, headColors, skinColor, ...attributes }) { return attributes; },
    async loadFile(file, save = false) {
      const version = ++this.loadVersion;
      this.loading = true; this.error = ''; this.teamData = null; this.session = null; this.teams = []; this.clearAudio();
      try {
        const input = new Uint8Array(await file.arrayBuffer());
        const session = { ...openRom(input), input };
        const data = await readTeam(session, 0);
        if (version !== this.loadVersion) return;
        this.session = markRaw(session); this.teams = teamNames(session.game); this.teamIndex = 0; this.teamData = data;
        if (save && this.storage.database) this.storage.set(file);
      } catch (error) { if (version === this.loadVersion) this.error = error.message; }
      finally { if (version === this.loadVersion) this.loading = false; }
    },
    onChangeFile(event) { const file = event.target.files?.[0]; if (file && (!this.$refs.editor || this.$refs.editor.allowNavigate())) this.loadFile(file, true); event.target.value = ''; },
    move(step) { this.selectTeam((this.teamIndex + step + this.teams.length) % this.teams.length); },
    async selectTeam(index) {
      if (!this.session || this.loading) return;
      this.loading = true; this.error = ''; this.teamData = null;
      try { this.teamData = await readTeam(this.session, index); this.teamIndex = index; }
      catch (error) { this.error = error.message; }
      finally { this.loading = false; }
    },
    clearAudio() { if (this.audioUrl) URL.revokeObjectURL(this.audioUrl); this.audioUrl = ''; this.audioError = ''; },
    prepareAudio() {
      this.clearAudio();
      try { this.audioUrl = URL.createObjectURL(wavBlob(readAudioSample(this.session.rom, this.audioSamples[this.sampleIndex]), this.sampleRate)); }
      catch (error) { this.audioError = error.message; }
    },
  },
};
</script>
<style scoped>
main { max-width: 1050px; margin: 32px auto; padding: 0 20px; font-family: system-ui, sans-serif; color: #172a40; }
h1 { margin-bottom: 24px; } input, select, button { margin: 6px; padding: 8px; font: inherit; }
button { cursor: pointer; } nav, .images, .audio-output { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
figure { margin: 12px 0; } figcaption { font-size: 13px; margin-top: 6px; } small { font-size: 14px; font-weight: normal; }
.error { color: #a32121; } table { border-collapse: collapse; width: 100%; } th, td { padding: 8px 14px; text-align: left; border-bottom: 1px solid #d4dce4; } th { background: #eaf0f6; }
.table-wrap { overflow-x: auto; } pre { font-size: 12px; } summary { cursor: pointer; } .audio-section { margin: 32px 0; padding-top: 16px; border-top: 1px solid #d4dce4; } .audio-section label { display: inline-block; margin-left: 8px; }
.appearance { display: flex; align-items: center; gap: 8px; }
.skin-swatch { display: inline-block; width: 20px; height: 20px; flex: 0 0 20px; box-shadow: inset 0 0 0 1px #172a4033; }
</style>
