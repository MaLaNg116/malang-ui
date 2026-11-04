<script setup lang="ts">
import { computed, useId } from 'vue';
import type { MProgressProps } from './types';
const props = withDefaults(defineProps<MProgressProps>(), { value: 0, max: 100, indeterminate: false, status: 'default', showValue: true });
const labelId = `ui-progress-${useId()}`;
const maximum = computed(() => Number.isFinite(props.max) && props.max > 0 ? Math.min(Number.MAX_SAFE_INTEGER, props.max) : 100);
const current = computed(() => Math.max(0, Math.min(maximum.value, Number.isFinite(props.value) ? props.value : 0)));
const percent = computed(() => Math.round(current.value / maximum.value * 100));
const valueText = computed(() => props.indeterminate
  ? props.status === 'error' ? '处理出错，进度未知' : props.status === 'success' ? '已完成' : '正在处理'
  : `${percent.value}%${props.status === 'error' ? '，发生错误' : props.status === 'success' ? '，已完成' : ''}`);
const visibleValue = computed(() => props.indeterminate
  ? props.status === 'error' ? '已中断' : props.status === 'success' ? '已完成' : '处理中'
  : props.status === 'error' ? `中断 · ${percent.value}%` : `${percent.value}%`);
</script>

<template>
  <div class="ui-progress" :data-status="status" :data-indeterminate="indeterminate || undefined">
    <div class="ui-progress__heading">
      <span :id="labelId" class="ui-progress__label">{{ label }}</span>
      <span v-if="showValue || status === 'error' || status === 'success'" class="ui-progress__reading" aria-hidden="true">
        <svg v-if="status === 'error' || status === 'success'" class="ui-progress__status" width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false"><path v-if="status === 'error'" d="m4 4 8 8m0-8-8 8"/><path v-else d="m3 8 3 3 7-7"/></svg>
        <span v-if="showValue" class="ui-progress__value" aria-hidden="true">{{ visibleValue }}</span>
      </span>
    </div>
    <div class="ui-progress__track" role="progressbar" :aria-labelledby="labelId" :aria-valuemin="0" :aria-valuemax="maximum" :aria-valuenow="indeterminate ? undefined : current" :aria-valuetext="valueText">
      <span class="ui-progress__fill" :style="{ width: indeterminate ? '35%' : percent + '%' }" aria-hidden="true"></span><span class="ui-progress__ticks" aria-hidden="true"></span>
    </div>
    <div v-if="$slots.default" class="ui-progress__description"><slot /></div>
  </div>
</template>

<style scoped>
.ui-progress { --ui-progress-color: var(--ui-color-info); min-width: 0; color: var(--ui-color-text); font: var(--ui-font-size-body)/1.6 var(--ui-font-family); }
.ui-progress[data-status='success'] { --ui-progress-color: var(--ui-color-success); }
.ui-progress[data-status='error'] { --ui-progress-color: var(--ui-color-danger); }
.ui-progress__heading { display: flex; align-items: baseline; justify-content: space-between; gap: 16px; margin-bottom: 10px; }
.ui-progress__label { min-width: 0; overflow-wrap: anywhere; }
.ui-progress__reading { display: inline-flex; align-items: center; flex: none; gap: 6px; color: var(--ui-progress-color); }
.ui-progress__status { display: block; flex: none; stroke: currentColor; stroke-width: 1.6; stroke-linecap: square; stroke-linejoin: miter; }
.ui-progress__value { flex: none; color: var(--ui-progress-color); font: 11px/1.6 var(--ui-font-family-mono); font-variant-numeric: tabular-nums; }
.ui-progress__track { box-sizing: border-box; position: relative; height: 12px; padding: 2px; border-block: 1px solid var(--ui-color-metal); background: var(--ui-color-canvas); overflow: hidden; }
.ui-progress__track::before, .ui-progress__track::after { content: ''; position: absolute; top: 0; bottom: 0; width: 2px; background: var(--ui-color-metal); }
.ui-progress__track::before { left: 0; } .ui-progress__track::after { right: 0; }
.ui-progress__fill { display: block; height: 100%; max-width: 100%; background: linear-gradient(90deg, color-mix(in srgb, var(--ui-progress-color) 55%, var(--ui-color-surface)), var(--ui-progress-color)); clip-path: polygon(0 0, calc(100% - 4px) 0, 100% 50%, calc(100% - 4px) 100%, 0 100%); transition: width var(--ui-motion-duration-layout) var(--ui-motion-ease-emphasized); }
.ui-progress__ticks { position: absolute; inset: 2px; pointer-events: none; background: repeating-linear-gradient(90deg, transparent 0 22px, var(--ui-color-surface) 22px 24px); opacity: .7; }
.ui-progress__description { margin-top: 10px; color: var(--ui-color-text-secondary); font-size: var(--ui-font-size-caption); line-height: 1.8; overflow-wrap: anywhere; }
.ui-progress[data-indeterminate][data-status='default'] .ui-progress__fill { animation: ui-progress-travel 1.8s var(--ui-motion-ease-standard) infinite; }
@keyframes ui-progress-travel { from { transform: translateX(-105%); } to { transform: translateX(300%); } }
:global([data-ui-motion='reduced'] .ui-progress__fill) { animation: none; transition: none; }
:global([data-ui-motion='reduced'] .ui-progress[data-indeterminate][data-status='default'] .ui-progress__fill) { animation: none; }
@media (prefers-reduced-motion: reduce) { .ui-progress__fill, .ui-progress[data-indeterminate][data-status='default'] .ui-progress__fill { animation: none; transition: none; } }
@media (forced-colors: active) { .ui-progress__track { border: 1px solid CanvasText; } .ui-progress__fill { background: Highlight; } .ui-progress__ticks { display: none; } }
</style>
