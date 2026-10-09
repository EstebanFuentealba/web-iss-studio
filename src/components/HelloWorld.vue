<script setup>
import { ref } from 'vue'

defineProps({
  msg: String
})

const count = ref(0)
</script>

<template>
  <h1>{{ $t(msg) }}</h1>

  <p>
    {{ $t("Recommended IDE setup:") }}
    <a href="https://code.visualstudio.com/" target="_blank">{{ $t("VSCode") }}</a>
    +
    <a href="https://github.com/johnsoncodehk/volar" target="_blank">{{ $t("Volar") }}</a>
  </p>

  <p>
    <a href="https://vitejs.dev/guide/features.html" target="_blank">
      {{ $t("Vite Documentation") }}
    </a>
    |
    <a href="https://v3.vuejs.org/" target="_blank">{{ $t("Vue 3 Documentation") }}</a>
  </p>

  <button type="button" @click="count++">{{ $t("count is:") }} {{ $t(count) }}</button>
  <p>
    {{ $t("Edit") }}
    <code>{{ $t("components/HelloWorld.vue") }}</code> {{ $t("to test hot module replacement.") }}
  </p>
</template>

<style scoped>
a {
  color: #42b983;
}
</style>
