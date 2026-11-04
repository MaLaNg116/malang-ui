<script setup lang="ts">
import { useId } from 'vue';
import type { MEmptyProps } from './types';

withDefaults(defineProps<MEmptyProps>(), { title: '暂无内容' });
const identity = useId();
const titleId = `ui-empty-${identity}-title`;
const descriptionId = `ui-empty-${identity}-description`;
</script>

<template>
  <section class="ui-empty" :aria-labelledby="titleId" :aria-describedby="description ? descriptionId : undefined">
    <svg class="ui-empty__mark" viewBox="0 0 80 64" fill="none" aria-hidden="true">
      <path d="M20 12h29l11 11v29H20V12Zm29 0v11h11M29 32h22m-22 8h13M9 54h62" />
      <path class="ui-empty__accent" d="M13 21v-9h9m36 40h9v-9M35 23h7" />
    </svg>
    <h3 :id="titleId" class="ui-empty__title">{{ title }}</h3>
    <p v-if="description" :id="descriptionId" class="ui-empty__description">{{ description }}</p>
    <div v-if="$slots.default" class="ui-empty__actions"><slot /></div>
  </section>
</template>

<style scoped>
.ui-empty { box-sizing: border-box; display: grid; justify-items: center; min-width: 0; max-width: 100%; padding: var(--ui-space-8) var(--ui-field-gap); color: var(--ui-color-text); text-align: center; font: var(--ui-font-weight-body) var(--ui-font-size-body)/var(--ui-line-height-body) var(--ui-font-family); overflow-wrap: anywhere; }
.ui-empty__mark { width: 80px; height: 64px; max-width: 100%; margin-bottom: var(--ui-space-4); color: var(--ui-color-metal); stroke: currentColor; stroke-width: 1.2; stroke-linejoin: miter; }
.ui-empty__accent { color: var(--ui-color-accent); stroke: currentColor; stroke-width: 1.7; }
.ui-empty__title { max-width: 100%; margin: 0; font: var(--ui-font-weight-emphasis) var(--ui-font-size-title)/1.4 var(--ui-font-family-display); }
.ui-empty__description { max-width: min(100%, 48ch); margin: var(--ui-space-2) 0 0; color: var(--ui-color-text-secondary); font-size: var(--ui-font-size-caption); line-height: 1.8; }
.ui-empty__actions { display: flex; justify-content: center; flex-wrap: wrap; gap: var(--ui-space-3); max-width: 100%; margin-top: var(--ui-space-5); }
.ui-empty__actions:empty { display: none; }
@media (forced-colors: active) { .ui-empty__mark, .ui-empty__accent { color: CanvasText; } }
</style>
