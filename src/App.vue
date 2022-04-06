<template>
  <div>
    <router-view />
    <div v-bind="getRootProps()">
      <div v-show="isDragActive">drop</div>
    </div>
  </div>
</template>
<script>
// This starter template is using Vue 3 <script setup> SFCs
// Check out https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup

import { useDropzone } from "vue3-dropzone";
export default {
  setup() {
    function onDrop(acceptFiles, rejectReasons) {}
    const { getRootProps, getInputProps, ...rest } = useDropzone({
      noClick: true,
      accept: [],
      onDrop,
    });
    return {
      getRootProps,
      getInputProps,
      ...rest,
    };
  },
};
</script>
