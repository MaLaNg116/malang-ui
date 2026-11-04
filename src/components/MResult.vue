<script setup lang="ts">
import { computed, useId } from 'vue';
import type { MResultProps } from './types';

const props = withDefaults(defineProps<MResultProps>(), { status: 'success', headingTag: 'h2', announce: false });
const identity = `ui-result-${useId()}`;
const titleId = `${identity}-title`;
const descriptionId = `${identity}-description`;
const caption = computed(() => ({ success: '已完成', error: '未完成', warning: '请确认', info: '信息' })[props.status]);
</script>

<template>
  <section class="ui-result" :class="`ui-result--${status}`" :aria-labelledby="titleId" :aria-describedby="description ? descriptionId : undefined">
    <svg class="ui-result__mark" viewBox="0 0 144 128" fill="none" aria-hidden="true" focusable="false">
      <path class="ui-result__wash" d="M35 12h75l17 17v63l-17 17H35L18 92V29L35 12Z"/>
      <path class="ui-result__scaffold" d="M7 36V13h23m84 102h23V92M19 112h29m53-95h27M29 28h79l9 9v49l-9 9H29V28Z"/>
      <path class="ui-result__frame" d="M45 31h51l12 12v42l-12 12H45L33 85V43L45 31Z"/>
      <path class="ui-result__register" d="M33 54V43l12-12h11m52 42v12L96 97H85M18 60H7m130 9h-11"/>
      <path v-if="status === 'success'" class="ui-result__symbol" d="m50 64 15 15 28-31M50 72l8 8"/>
      <path v-else-if="status === 'error'" class="ui-result__symbol" d="m53 47 38 38m0-38L53 85m-7-42h11m30 46h11"/>
      <path v-else-if="status === 'warning'" class="ui-result__symbol" d="m72 40 25 45H47l25-45Zm0 15v14m0 7v2"/>
      <path v-else class="ui-result__symbol" d="M72 59v22m-6-22h6m-6 22h12m-6-36v2"/>
      <path class="ui-result__baseline" d="M43 118h18m6 0h4m6 0h25"/>
    </svg>
    <div class="ui-result__message" :role="announce ? (status === 'error' ? 'alert' : 'status') : undefined" :aria-live="announce ? (status === 'error' ? 'assertive' : 'polite') : undefined" :aria-atomic="announce ? true : undefined" :aria-labelledby="announce ? titleId : undefined" :aria-describedby="announce && description ? descriptionId : undefined">
      <p class="ui-result__caption">{{ caption }}</p>
      <component :is="headingTag" :id="titleId" class="ui-result__title">{{ title }}</component>
      <p v-if="description" :id="descriptionId" class="ui-result__description">{{ description }}</p>
    </div>
    <div v-if="$slots.default" class="ui-result__body"><slot /></div>
    <footer v-if="$slots.footer" class="ui-result__footer"><slot name="footer" /></footer>
  </section>
</template>

<style scoped>
.ui-result { --ui-result-tone: var(--ui-color-success); box-sizing: border-box; display: grid; justify-items: center; min-width: 0; max-width: 100%; padding: clamp(28px, 5vw, 48px) clamp(20px, 4vw, 40px); border-block: 1px solid var(--ui-color-rule); background: var(--ui-color-surface-muted, var(--ui-color-surface)); color: var(--ui-color-text); text-align: center; font: var(--ui-font-size-body)/var(--ui-line-height-body) var(--ui-font-family); }
.ui-result--error { --ui-result-tone: var(--ui-color-danger); }
.ui-result--warning { --ui-result-tone: var(--ui-color-warning); }
.ui-result--info { --ui-result-tone: var(--ui-color-secondary-accent); }
.ui-result__mark { box-sizing: border-box; display: block; width: 144px; height: 128px; max-width: 100%; margin-bottom: 24px; color: var(--ui-result-tone); stroke: currentColor; stroke-linecap: square; stroke-linejoin: miter; }
.ui-result__wash { fill: color-mix(in srgb, var(--ui-result-tone) 7%, transparent); stroke: none; }
.ui-result__scaffold { stroke: var(--ui-color-metal); stroke-width: .9; opacity: .55; }
.ui-result__frame { stroke-width: 1.2; }
.ui-result__register { stroke-width: 3; }
.ui-result__symbol { stroke-width: 2.7; }
.ui-result__baseline { stroke-width: 1.2; opacity: .7; }
.ui-result__message { min-width: 0; max-width: min(100%, 66ch); }
.ui-result__caption { margin: 0 0 12px; color: var(--ui-result-tone); font: 12px/1.8 var(--ui-font-family-display); letter-spacing: .16em; }
.ui-result__title { min-width: 0; max-width: 100%; margin: 0; font: 500 clamp(26px, 3.5vw, 36px)/1.5 var(--ui-font-family-display); overflow-wrap: anywhere; }
.ui-result__description { max-width: min(100%, 56ch); margin: 14px auto 0; color: var(--ui-color-text-secondary); font-size: 13px; line-height: 1.9; overflow-wrap: anywhere; }
.ui-result__body { min-width: 0; width: min(100%, 680px); margin-top: 24px; color: var(--ui-color-text-secondary); font-size: 12px; line-height: 1.9; overflow-wrap: anywhere; }
.ui-result__footer { display: flex; justify-content: center; align-items: center; flex-wrap: wrap; gap: 12px; min-width: 0; max-width: 100%; margin-top: 28px; }
@media (max-width: 480px) { .ui-result__mark { width: 120px; height: 108px; margin-bottom: 20px; } .ui-result__title { font-size: 26px; } }
@media (forced-colors: active) { .ui-result { --ui-result-tone: CanvasText; border-color: CanvasText; background: Canvas; } .ui-result__wash { fill: Canvas; stroke: CanvasText; stroke-width: 1; } .ui-result__scaffold { stroke: CanvasText; } }
</style>
