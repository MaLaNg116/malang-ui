<script setup lang="ts">
import { onErrorCaptured, ref } from 'vue';
import { MConfigProvider } from '../../../src';
import type { ComponentExample } from '../data/examples';
import CodeBlock from './CodeBlock.vue';

defineProps<{
  headingId: string;
  example: ComponentExample;
}>();

const run = ref(0);
const state = ref<'loading' | 'ready' | 'error'>('loading');

onErrorCaptured(() => {
  state.value = 'error';
  return false;
});

function resolveExample() {
  if (state.value !== 'error') state.value = 'ready';
}

function reset() {
  state.value = 'loading';
  run.value += 1;
}
</script>

<template>
  <section class="doc-demo" :aria-labelledby="headingId" :data-demo-id="example.id" :data-demo-state="state">
    <h3 :id="headingId" tabindex="-1">{{ example.title }}</h3>
    <p class="doc-demo__description">{{ example.description }}</p>
    <div class="doc-demo__panel">
      <MConfigProvider class="doc-demo__stage">
        <p v-if="state === 'error'" class="doc-demo__status" role="status">这个示例未能加载，可以重置后重试。</p>
        <Suspense v-else :key="run" @resolve="resolveExample">
          <component :is="example.component" />
          <template #fallback><p class="doc-demo__status" role="status">正在载入示例…</p></template>
        </Suspense>
      </MConfigProvider>
      <div class="doc-demo__actions">
        <details class="doc-demo__source">
          <summary>查看代码</summary>
          <CodeBlock :code="example.source" :filename="`${example.id}.vue`" />
        </details>
        <button type="button" class="doc-demo__reset" @click="reset">重置示例</button>
      </div>
    </div>
  </section>
</template>
