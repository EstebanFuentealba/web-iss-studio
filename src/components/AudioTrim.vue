<template>
  <div class="audio-import">
    <label class="audio-drop" :class="{dragging}" @dragover.prevent="dragging=true" @dragleave.prevent="dragging=false" @drop.prevent="drop">
      <strong>{{$t(busy?'Convirtiendo audio…':'Subir o arrastrar un audio')}}</strong>
      <span>{{ $t("WAV, MP3, M4A, OGG o FLAC · conversión automática") }}</span>
      <input type="file" accept="audio/*,.wav,.flac,.m4a,.ogg" :disabled="disabled||busy" @change="upload" />
    </label>
    <div v-if="source" class="trim-editor">
      <header><strong>{{source.name}}</strong><span>{{duration.toFixed(3)}} {{ $t("s ·") }} {{$t(source.conversion)}}</span></header>
      <p>{{ $t("Arrastra los extremos para recortar o mueve el bloque azul para elegir otro fragmento.") }}</p>
      <div class="trim-track" ref="track">
        <canvas ref="wave" width="1200" height="140" role="img" :aria-label="$t(&quot;Forma de onda del audio subido&quot;)" />
        <div class="dim left" :style="{width:Math.max(0,Math.min(100,percent(start)))+'%'}"></div><div class="dim right" :style="{left:Math.max(0,Math.min(100,percent(end)))+'%'}"></div>
        <div class="trim-selection" :style="{left:percent(start)+'%',width:percentLength(end-start)+'%'}" @pointerdown="begin($event,'move')" @pointermove="move" @pointerup="finish" @pointercancel="finish" role="button" tabindex="0" :aria-label="$t(&quot;Mover recorte&quot;)" @keydown.left.prevent="shift(-.01)" @keydown.right.prevent="shift(.01)"></div>
        <button class="trim-handle start" :style="{left:percent(start)+'%'}" @pointerdown="begin($event,'start')" @pointermove="move" @pointerup="finish" @pointercancel="finish" @keydown.left.prevent="step('start',-.01)" @keydown.right.prevent="step('start',.01)" role="slider" :aria-label="$t(&quot;Inicio del recorte&quot;)" :aria-valuemin="0" :aria-valuemax="end" :aria-valuenow="start" :aria-valuetext="$t(start.toFixed(3)+' segundos')">⠿</button>
        <button class="trim-handle end" :style="{left:percent(end)+'%'}" @pointerdown="begin($event,'end')" @pointermove="move" @pointerup="finish" @pointercancel="finish" @keydown.left.prevent="step('end',-.01)" @keydown.right.prevent="step('end',.01)" role="slider" :aria-label="$t(&quot;Fin del recorte&quot;)" :aria-valuemin="start" :aria-valuemax="duration" :aria-valuenow="end" :aria-valuetext="$t(end.toFixed(3)+' segundos')">⠿</button>
      </div>
      <div class="time-axis"><span>{{viewStart.toFixed(3)}} {{ $t("s") }}</span><span>{{(viewStart+viewSpan).toFixed(3)}} {{ $t("s") }}</span></div>
      <div class="view-controls"><button @click="zoom">{{ $t("Acercar al recorte") }}</button><button @click="overview">{{ $t("Ver audio completo") }}</button><label v-if="viewSpan<duration">{{ $t("Mover vista") }} <input type="range" min="0" :max="duration-viewSpan" :step="minimum" v-model.number="viewStart" @input="draw" :aria-label="$t(&quot;Desplazar vista del audio&quot;)" /></label></div>
      <div class="trim-controls">
        <label>{{ $t("Inicio (s)") }} <input type="number" min="0" :max="end-minimum" step="0.001" :value="start.toFixed(3)" @change="setStart(Number($event.target.value));commit()" /></label>
        <label>{{ $t("Fin (s)") }} <input type="number" :min="start+minimum" :max="duration" step="0.001" :value="end.toFixed(3)" @change="setEnd(Number($event.target.value));commit()" /></label>
        <button @click="fit">{{ $t("Ajustar a capacidad") }}</button><button @click="full" :disabled="duration>maxDuration">{{ $t("Audio completo") }}</button>
      </div>
      <div class="trim-capacity"><span :style="{width:Math.min(100,(end-start)/maxDuration*100)+'%'}"></span></div>
      <p class="trim-status">{{ $t("Selección:") }} <strong>{{(end-start).toFixed(3)}} {{ $t("s") }}</strong> / {{maxDuration.toFixed(3)}} {{ $t("s disponibles ·") }} {{$t(Math.round((end-start)/maxDuration*100))}}{{ $t("% de capacidad") }}</p>
      <p v-if="duration>maxDuration" class="trim-hint">{{ $t("Se seleccionó un fragmento que cabe en la ROM. Puedes moverlo para conservar la parte que prefieras.") }}</p>
      <button @click="$emit('preview')">{{ $t("Escuchar recorte convertido") }}</button><button @click="$emit('discard')">{{ $t("Descartar audio subido") }}</button>
    </div>
  </div>
</template>
<script>
export default {
  props:{source:Object,maxDuration:Number,busy:Boolean,disabled:Boolean},emits:['upload','range','preview','discard'],
  data(){return {start:0,end:0,drag:null,dragging:false,viewStart:0,viewSpan:1};},
  computed:{duration(){return this.source?this.source.samples.length/this.source.sampleRate:0;},minimum(){return this.source?1/this.source.sampleRate:.001;}},
  watch:{source(){this.initialize();},maxDuration(){if(this.source){if(this.end-this.start>this.maxDuration)this.fit();else this.commit();}}},mounted(){if(this.source)this.initialize();},
  methods:{
    upload(event){const file=event.target.files?.[0];event.target.value='';if(file)this.$emit('upload',file);},
    drop(event){this.dragging=false;if(this.disabled||this.busy)return;const file=event.dataTransfer.files?.[0];if(file)this.$emit('upload',file);},
    percent(time){return (time-this.viewStart)/this.viewSpan*100;},percentLength(time){return time/this.viewSpan*100;},
    initialize(){if(!this.source)return;this.start=0;this.end=Math.min(this.duration,Math.floor(this.maxDuration*this.source.sampleRate)/this.source.sampleRate);this.viewStart=0;this.viewSpan=this.duration;if(this.end/this.duration<.15)this.zoom();else this.$nextTick(()=>this.draw());this.commit();},
    draw(){const canvas=this.$refs.wave;if(!canvas||!this.source)return;const ctx=canvas.getContext('2d'),samples=this.source.samples;ctx.clearRect(0,0,canvas.width,canvas.height);ctx.strokeStyle='#4b8ec9';ctx.beginPath();for(let x=0;x<canvas.width;x++){const a=Math.floor((this.viewStart+x/canvas.width*this.viewSpan)*this.source.sampleRate),b=Math.min(samples.length,Math.max(a+1,Math.floor((this.viewStart+(x+1)/canvas.width*this.viewSpan)*this.source.sampleRate)));let lo=0,hi=0;for(let i=a;i<b;i++){lo=Math.min(lo,samples[i]||0);hi=Math.max(hi,samples[i]||0);}ctx.moveTo(x,70-lo/32768*62);ctx.lineTo(x,70-hi/32768*62);}ctx.stroke();},
    setStart(value){if(!Number.isFinite(value))return;this.start=Math.max(Math.max(0,this.end-this.maxDuration),Math.min(this.end-this.minimum,value));},
    setEnd(value){if(!Number.isFinite(value))return;this.end=Math.min(this.duration,this.start+this.maxDuration,Math.max(this.start+this.minimum,value));},
    begin(event,kind){event.preventDefault();event.currentTarget.setPointerCapture(event.pointerId);this.drag={kind,x:event.clientX,start:this.start,end:this.end,span:this.viewSpan,width:this.$refs.track.getBoundingClientRect().width};},
    move(event){if(!this.drag)return;const delta=(event.clientX-this.drag.x)/this.drag.width*this.drag.span;if(this.drag.kind==='start')this.setStart(this.drag.start+delta);else if(this.drag.kind==='end')this.setEnd(this.drag.end+delta);else {const length=this.drag.end-this.drag.start;this.start=Math.max(0,Math.min(this.duration-length,this.drag.start+delta));this.end=this.start+length;}},
    finish(){if(!this.drag)return;this.drag=null;this.commit();},
    step(kind,delta){kind==='start'?this.setStart(this.start+delta):this.setEnd(this.end+delta);this.commit();},
    shift(delta){const length=this.end-this.start;this.start=Math.max(0,Math.min(this.duration-length,this.start+delta));this.end=this.start+length;this.commit();},
    fit(){this.start=Math.min(this.start,Math.max(0,this.duration-this.minimum));this.end=Math.min(this.duration,this.start+Math.floor(this.maxDuration*this.source.sampleRate)/this.source.sampleRate);this.commit();},
    zoom(){this.viewSpan=Math.min(this.duration,Math.max(this.minimum*4,(this.end-this.start)*3));this.viewStart=Math.max(0,Math.min(this.duration-this.viewSpan,this.start-(this.viewSpan-(this.end-this.start))/2));this.$nextTick(()=>this.draw());},
    overview(){this.viewStart=0;this.viewSpan=this.duration;this.$nextTick(()=>this.draw());},
    full(){this.start=0;this.end=this.duration;this.overview();this.commit();},
    commit(){this.$emit('range',{start:this.start,end:this.end});},
  },
};
</script>
<style scoped>
.audio-import{margin:20px 0}.audio-drop{display:flex;flex-direction:column;align-items:center;gap:8px;padding:22px;border:2px dashed #92abc5;border-radius:10px;background:#f0f5fa;cursor:pointer}.audio-drop.dragging{background:#deedff;border-color:#176be0}.audio-drop span{font-size:14px;color:#516579}.audio-drop input{max-width:100%}.trim-editor{margin-top:16px;padding:18px;border:1px solid #c9d6e3;border-radius:10px;background:white}.trim-editor header{display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap}.trim-editor header span{font-size:13px;color:#506477}.trim-track{position:relative;height:140px;margin:20px 12px 0;touch-action:none;background:#edf4fa;border-radius:6px;overflow:hidden}.view-controls{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.view-controls button{font:inherit;background:#f9fbfd;padding:5px 8px;border:1px solid #bbc8d6;border-radius:5px}.view-controls label{display:flex;align-items:center;gap:8px}.view-controls input{width:180px}.trim-track canvas{width:100%;height:140px}.dim{position:absolute;top:0;bottom:0;background:#172a4070;pointer-events:none}.dim.left{left:0}.dim.right{right:0}.trim-selection{position:absolute;top:0;bottom:0;border:2px solid #176be0;box-sizing:border-box;background:#176be018;cursor:grab;touch-action:none}.trim-selection:active{cursor:grabbing}.trim-handle{position:absolute;top:-6px;height:152px;width:20px;transform:translateX(-50%);padding:0;margin:0;background:#176be0;color:white;border:2px solid white;border-radius:5px;cursor:ew-resize;touch-action:none;z-index:2}.trim-handle:focus-visible,.trim-selection:focus-visible{outline:3px solid #f4b13d}.time-axis{display:flex;justify-content:space-between;margin:6px 12px;color:#526679;font-size:12px}.trim-controls{display:flex;align-items:center;flex-wrap:wrap;gap:8px;margin:16px 0}.trim-controls input{width:88px}.trim-controls button,.trim-controls input,.trim-editor>button{font:inherit;padding:7px;border:1px solid #bbc8d6;border-radius:5px;background:#f9fbfd}.trim-editor>button{margin-right:8px;cursor:pointer}.trim-controls button:disabled{opacity:.45}.trim-capacity{height:8px;background:#e4edf5;border-radius:4px;overflow:hidden}.trim-capacity span{display:block;height:100%;background:#288964}.trim-status{font-size:14px;color:#23634b}.trim-hint{font-size:14px;color:#516579}
</style>
