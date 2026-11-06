<script setup lang="ts">
import { MImage } from 'malang-ui';

function illustration(sky: string, ink: string, sun: string) {
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 220">'
    + '<path fill="' + sky + '" d="M0 0h400v220H0z"/>'
    + '<circle cx="286" cy="65" r="25" fill="' + sun + '"/>'
    + '<path fill="' + ink + '" d="m0 198 79-90 23 20 43-70 37 44 22-8 71 85 44-30 81 52v19H0z"/>'
    + '<path fill="none" stroke="' + sky + '" stroke-width="2" d="m30 201 59-49m31 40 32-41m112 50 19-9m19 6 24-16"/>'
    + '</svg>';
  return 'data:image/svg+xml,' + encodeURIComponent(svg);
}
const first = illustration('#e6dfce', '#314d45', '#a55440');
const second = illustration('#e1e8dd', '#32615c', '#bc9864');
</script>

<template>
  <div class="example">
    <MImage class="plate" :src="first" :preview-sources="[first, second]" alt="朱日山水拓本" fit="contain" preview />
    <p>点击预览，可在两张拓本之间切换，也可以放大查看。</p>
  </div>
</template>

<style scoped>
.example { display: grid; gap: 12px; width: 100%; min-width: 0; }
.example p { margin: 0; overflow-wrap: anywhere; }
.plate { width: min(100%, 360px); aspect-ratio: 20 / 11; }
</style>
