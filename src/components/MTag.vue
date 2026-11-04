<script setup lang="ts">
import { useId } from 'vue';
import type { MTagProps } from './types';
const props = withDefaults(defineProps<MTagProps>(), { tone: 'neutral', closable: false, closeLabel: '移除标签', disabled: false });
const emit = defineEmits<{ close: [event: MouseEvent] }>();
const labelId = `ui-tag-${useId()}`;
function close(event: MouseEvent) { if (!props.disabled) emit('close', event); }
</script>

<template>
  <span class="ui-tag" :data-tone="tone" :data-disabled="disabled || undefined">
    <span :id="labelId" class="ui-tag__label"><slot /></span>
    <button v-if="closable" class="ui-tag__close" type="button" :disabled="disabled" :aria-label="closeLabel" :aria-describedby="labelId" @click="close"><svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="m3 3 6 6m0-6-6 6" stroke="currentColor" stroke-width="1.3"/></svg></button>
  </span>
</template>

<style scoped>
.ui-tag { --ui-tag-color: var(--ui-color-metal); box-sizing: border-box; isolation: isolate; position: relative; display: inline-flex; align-items: center; vertical-align: middle; min-height: 28px; max-width: 100%; color: var(--ui-color-text); font: 12px/1.6 var(--ui-font-family); }
.ui-tag::before, .ui-tag::after { content: ''; position: absolute; pointer-events: none; z-index: -1; clip-path: polygon(0 0, calc(100% - 5px) 0, 100% 5px, 100% 100%, 5px 100%, 0 calc(100% - 5px)); }
.ui-tag::before { inset: 0; background: color-mix(in srgb, var(--ui-tag-color) 65%, var(--ui-color-rule)); }
.ui-tag::after { inset: 1px; background: color-mix(in srgb, var(--ui-tag-color) 9%, var(--ui-color-surface)); }
.ui-tag[data-tone='info'] { --ui-tag-color: var(--ui-color-info); }
.ui-tag[data-tone='success'] { --ui-tag-color: var(--ui-color-success); }
.ui-tag[data-tone='warning'] { --ui-tag-color: var(--ui-color-warning); }
.ui-tag[data-tone='error'] { --ui-tag-color: var(--ui-color-danger); }
.ui-tag__label { min-width: 0; padding: 4px 10px; overflow-wrap: anywhere; }
.ui-tag__close { box-sizing: border-box; flex: none; display: grid; place-items: center; align-self: stretch; min-height: 28px; width: 28px; border: 0; border-left: 1px solid color-mix(in srgb, var(--ui-tag-color) 35%, transparent); background: transparent; color: var(--ui-tag-color); cursor: pointer; transition: background-color var(--ui-motion-duration-feedback) var(--ui-motion-ease-standard); }
.ui-tag__close:hover:not(:disabled) { background: color-mix(in srgb, var(--ui-tag-color) 16%, transparent); }
.ui-tag__close:focus-visible { outline: 2px solid var(--ui-color-focus); outline-offset: 2px; }
.ui-tag[data-disabled] { opacity: .55; } .ui-tag__close:disabled { cursor: not-allowed; }
:global([data-ui-motion='reduced'] .ui-tag__close) { transition: none; }
@media (prefers-reduced-motion: reduce) { .ui-tag__close { transition: none; } }
@media (pointer: coarse) { .ui-tag__close { min-height: 44px; width: 44px; } }
@media (forced-colors: active) { .ui-tag { border: 1px solid CanvasText; } .ui-tag::before, .ui-tag::after { display: none; } .ui-tag__close { color: ButtonText; border-color: CanvasText; } }
</style>
