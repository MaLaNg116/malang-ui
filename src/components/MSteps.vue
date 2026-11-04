<script setup lang="ts">
import { computed, useId } from 'vue';
import type { MStepItem, MStepsProps } from './types';

const props = withDefaults(defineProps<MStepsProps>(), { interactive: false, orientation: 'horizontal', status: 'process' });
const emit = defineEmits<{ 'update:modelValue': [value: string] }>();
const identity = `ui-steps-${useId()}`;
const selectedIndex = computed(() => Math.max(0, props.items.findIndex(item => item.value === props.modelValue)));
function state(index: number) { return index < selectedIndex.value ? 'complete' : index > selectedIndex.value ? 'pending' : props.status === 'success' ? 'complete' : props.status === 'error' ? 'error' : 'current'; }
function stateLabel(index: number) { return index === selectedIndex.value ? props.status === 'error' ? '当前步骤，出现错误' : props.status === 'success' ? '当前步骤，已完成' : '当前步骤，进行中' : index < selectedIndex.value ? '已完成' : '待开始'; }
function select(item: MStepItem) { if (props.interactive && !item.disabled && item.value !== props.modelValue) emit('update:modelValue', item.value); }
</script>

<template>
  <div class="ui-steps" :class="{ 'ui-steps--vertical': orientation === 'vertical' }" role="group" :aria-label="label">
    <ol class="ui-steps__list" role="list" :style="{ '--ui-step-count': Math.max(1, items.length) }">
      <li v-for="(item, index) in items" :key="item.value" class="ui-steps__item" :class="`ui-steps__item--${state(index)}`">
        <component :is="interactive ? 'button' : 'div'" class="ui-steps__node" :type="interactive ? 'button' : undefined" :disabled="interactive ? item.disabled : undefined" :aria-current="index === selectedIndex ? 'step' : undefined" :aria-labelledby="interactive ? `${identity}-${index}-label` : undefined" :aria-describedby="interactive ? `${identity}-${index}-state${item.description ? ' ' + identity + '-' + index + '-description' : ''}` : undefined" @click="select(item)">
          <span class="ui-steps__seal" aria-hidden="true"><svg v-if="state(index) === 'complete'" width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="m3 8 3 3 7-7" stroke="currentColor" stroke-width="1.5" /></svg><svg v-else-if="state(index) === 'error'" width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 3v6m0 3v1" stroke="currentColor" stroke-width="1.5" /></svg><span v-else>{{ String(index + 1).padStart(2, '0') }}</span></span>
          <span class="ui-steps__copy"><span :id="`${identity}-${index}-label`" class="ui-steps__label">{{ item.label }}</span><span v-if="item.description" :id="`${identity}-${index}-description`" class="ui-steps__description">{{ item.description }}</span><span :id="`${identity}-${index}-state`" class="ui-steps__sr-only">{{ stateLabel(index) }}</span></span>
        </component>
      </li>
    </ol>
  </div>
</template>

<style scoped>
.ui-steps { min-width: 0; color: var(--ui-color-text); font: var(--ui-font-size-body)/var(--ui-line-height-body) var(--ui-font-family); }
.ui-steps__list { display: grid; grid-template-columns: repeat(var(--ui-step-count), minmax(0, 1fr)); gap: 24px; padding: 0; margin: 0; list-style: none; }
.ui-steps__item { position: relative; min-width: 0; --ui-step-tone: var(--ui-color-metal); }
.ui-steps__item::after { content: ''; position: absolute; left: 36px; right: -24px; top: 18px; height: 1px; background: repeating-linear-gradient(to right, var(--ui-color-rule) 0 9px, transparent 9px 12px); pointer-events: none; }
.ui-steps__item:last-child::after { display: none; }
.ui-steps__item--complete { --ui-step-tone: var(--ui-color-success); }
.ui-steps__item--complete::after { background: var(--ui-color-success); }
.ui-steps__item--current { --ui-step-tone: var(--ui-color-info); }
.ui-steps__item--error { --ui-step-tone: var(--ui-color-danger); }
.ui-steps__node { display: grid; justify-items: start; gap: 16px; min-width: 0; width: 100%; margin: 0; padding: 0; border: 0; border-radius: 0; background: transparent; color: inherit; text-align: start; font: inherit; }
button.ui-steps__node { cursor: pointer; }
button.ui-steps__node:hover:not(:disabled) .ui-steps__label { color: var(--ui-step-tone); }
.ui-steps__item--pending button.ui-steps__node:hover:not(:disabled) .ui-steps__label { color: var(--ui-color-text); }
button.ui-steps__node:disabled { cursor: not-allowed; opacity: .5; }
button.ui-steps__node:focus-visible { outline: var(--ui-focus-width) solid var(--ui-color-focus); outline-offset: var(--ui-focus-offset); }
.ui-steps__seal { position: relative; isolation: isolate; flex: none; display: grid; place-items: center; width: 36px; height: 36px; color: var(--ui-step-tone); font: 11px/1 var(--ui-font-family-mono); letter-spacing: .5px; }
.ui-steps__seal::before, .ui-steps__seal::after { content: ''; position: absolute; pointer-events: none; z-index: -1; clip-path: polygon(7px 0, 100% 0, 100% calc(100% - 7px), calc(100% - 7px) 100%, 0 100%, 0 7px); }
.ui-steps__seal::before { inset: 0; background: var(--ui-step-tone); }
.ui-steps__seal::after { inset: 1px; background: var(--ui-color-canvas); }
.ui-steps__item--current .ui-steps__seal::after { background: color-mix(in srgb, var(--ui-color-info) 12%, var(--ui-color-surface)); }
.ui-steps__item--current .ui-steps__seal, .ui-steps__item--error .ui-steps__seal { animation: ui-steps-seat var(--ui-motion-duration-transition) var(--ui-motion-ease-emphasized); }
.ui-steps__copy { display: grid; gap: 8px; min-width: 0; overflow-wrap: anywhere; }
.ui-steps__label { font: var(--ui-font-weight-emphasis) var(--ui-font-size-heading)/1.5 var(--ui-font-family-display); transition: color var(--ui-motion-duration-feedback) var(--ui-motion-ease-standard); }
.ui-steps__description { color: var(--ui-color-text-secondary); font-size: var(--ui-font-size-caption); line-height: 1.8; }
.ui-steps__sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; border: 0; }
.ui-steps--vertical .ui-steps__list { grid-template-columns: minmax(0, 1fr); }
.ui-steps--vertical .ui-steps__node { grid-template-columns: 36px minmax(0, 1fr); gap: 20px; align-items: start; }
.ui-steps--vertical .ui-steps__item::after { left: 18px; right: auto; top: 36px; bottom: -24px; width: 1px; height: auto; background: repeating-linear-gradient(to bottom, var(--ui-color-rule) 0 9px, transparent 9px 12px); }
.ui-steps--vertical .ui-steps__item--complete::after { background: var(--ui-color-success); }
@keyframes ui-steps-seat { from { opacity: .5; transform: translateY(-3px); } to { opacity: 1; transform: translateY(0); } }
:global([data-ui-motion='reduced'] .ui-steps__item--current .ui-steps__seal), :global([data-ui-motion='reduced'] .ui-steps__item--error .ui-steps__seal) { animation: none; }
:global([data-ui-motion='reduced'] .ui-steps__label) { transition: none; }
@media (prefers-reduced-motion: reduce) { .ui-steps__item--current .ui-steps__seal, .ui-steps__item--error .ui-steps__seal { animation: none; } .ui-steps__label { transition: none; } }
@media (max-width: 640px) { .ui-steps__list { grid-template-columns: minmax(0, 1fr); } .ui-steps__node { grid-template-columns: 36px minmax(0, 1fr); gap: 20px; align-items: start; } .ui-steps__item::after { left: 18px; right: auto; top: 36px; bottom: -24px; width: 1px; height: auto; background: repeating-linear-gradient(to bottom, var(--ui-color-rule) 0 9px, transparent 9px 12px); } .ui-steps__item--complete::after { background: var(--ui-color-success); } }
@media (forced-colors: active) { .ui-steps__seal { border: 1px solid CanvasText; color: CanvasText; } .ui-steps__seal::before, .ui-steps__seal::after { display: none; } .ui-steps__item::after { background: CanvasText; } button.ui-steps__node:disabled { opacity: 1; color: GrayText; } }
</style>
