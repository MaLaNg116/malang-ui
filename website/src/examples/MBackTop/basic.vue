<script setup lang="ts">
import { ref } from 'vue';
import { MBackTop } from 'malang-ui';

const panel = ref<HTMLElement>();
const target = () => panel.value;
</script>

<template>
  <div class="backtop-demo">
    <div ref="panel" class="scroll-area" tabindex="0" role="region" aria-label="藏品清单">
      <p>向下滚动，显示返回按钮。</p>
      <ol><li v-for="index in 14" :key="index">藏品编号 {{ index }}</li></ol>
    </div>
    <MBackTop :target="target" :visibility-height="72" label="返回清单顶部" style="position: absolute; right: 16px; bottom: 12px" />
  </div>
</template>

<style scoped>
.backtop-demo { position: relative; }
.scroll-area { height: 192px; overflow: auto; overscroll-behavior: contain; border: 1px solid var(--ui-color-rule); }
.scroll-area p { padding-inline: 16px; }
.scroll-area li { padding-block: 7px; }
</style>
