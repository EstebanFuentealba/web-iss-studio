<template>
  <label class="language-selector" for="language">{{ $t('Idioma') }}
    <select id="language" :value="language" @change="setLanguage($event.target.value)">
      <option v-for="item in LANGUAGES" :key="item.code" :value="item.code" :lang="item.code">{{ item.name }}</option>
    </select>
  </label>
</template>
<script setup>
import { language, setLanguage, LANGUAGES } from '../i18n';
</script>
<style scoped>
.language-selector { display: flex; justify-content: flex-end; align-items: center; gap: 8px; margin-bottom: 12px; }
</style>
