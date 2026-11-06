<script setup lang="ts">
import { ref } from 'vue';
import { MButton, MConfigProvider, MInput } from 'malang-ui';

const dark = ref(false);
const note = ref('保留这份手记');
</script>

<template>
  <div class="config-demo">
    <div><MButton variant="secondary" @click="dark = !dark">{{ dark ? '切回青瓷' : '切到浓墨' }}</MButton></div>
    <MConfigProvider :theme="dark ? 'dark' : 'light'" palette="celadon" :density="dark ? 'compact' : 'comfortable'">
      <div class="panel">
        <MInput v-model="note" label="局部主题中的输入框" />
      </div>
    </MConfigProvider>
  </div>
</template>

<style scoped>
.config-demo { display: grid; gap: 12px; }
.panel { padding: 18px; background: var(--ui-color-canvas); border: 1px solid var(--ui-color-rule); }
</style>
