<script setup lang="ts">
import { computed, nextTick, ref, useAttrs, useId, watch } from 'vue';
import type { MSliderProps } from './types';

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<MSliderProps>(), { min: 0, max: 100, step: 1, disabled: false, showValue: true });
const emit = defineEmits<{ 'update:modelValue': [value: number] }>();
const attrs = useAttrs();
const control = ref<HTMLInputElement>();
const identity = `ui-slider-${useId()}`;
const id = computed(() => props.id || identity);
const minimum = computed(() => Number.isFinite(props.min) ? props.min : 0);
const maximum = computed(() => Number.isFinite(props.max) && Number.isFinite(props.max - minimum.value) ? Math.max(minimum.value, props.max) : Math.max(minimum.value, 100));
const increment = computed(() => Number.isFinite(props.step) && props.step > 0 ? props.step : 1);
function places(value: number) { const [mantissa = '', exponent = '0'] = String(value).toLowerCase().split('e'); return Math.max(0, (mantissa.split('.')[1]?.length || 0) - Number(exponent)); }
function normalize(value: number) {
  const amount = Number.isFinite(value) ? Math.min(maximum.value, Math.max(minimum.value, value)) : minimum.value;
  const steps = (maximum.value - minimum.value) / increment.value;
  const position = (amount - minimum.value) / increment.value;
  if (!Number.isFinite(steps) || !Number.isFinite(position)) return amount;
  const tolerance = Math.max(1, Math.abs(steps)) * Number.EPSILON * 4;
  const last = Math.max(0, Math.floor(steps + tolerance));
  const index = Math.min(last, Math.max(0, Math.round(position + Math.max(1, Math.abs(position)) * Number.EPSILON * 4)));
  const precision = Math.max(places(minimum.value), places(increment.value));
  const valueOnGrid = minimum.value + index * increment.value;
  if (!Number.isFinite(valueOnGrid)) return amount;
  const rounded = precision <= 100 ? Number(valueOnGrid.toFixed(precision)) : valueOnGrid;
  return Math.min(maximum.value, Math.max(minimum.value, rounded));
}
const current = computed(() => normalize(props.modelValue));
const fill = computed(() => maximum.value > minimum.value ? Math.max(0, Math.min(100, (current.value - minimum.value) / (maximum.value - minimum.value) * 100)) : 0);
let pending: number | undefined;
function describedBy() { return [...new Set([attrs['aria-describedby'], props.hint && `${id.value}-hint`, props.error && `${id.value}-error`].filter(Boolean).join(' ').split(/\s+/))].filter(Boolean).join(' ') || undefined; }
function update(event: Event) {
  const element = event.target as HTMLInputElement;
  if (props.disabled || maximum.value <= minimum.value) { element.value = String(current.value); return; }
  const value = normalize(element.valueAsNumber);
  if (value !== props.modelValue && value !== pending) {
    pending = value; emit('update:modelValue', value);
    void nextTick(() => { if (pending === value) pending = undefined; });
  }
  void nextTick(() => { if (control.value) control.value.value = String(current.value); });
}
watch(() => [props.modelValue, props.min, props.max, props.step], () => {
  // Apply the canonical value after the browser has received new range limits.
  if (control.value) control.value.value = String(current.value);
}, { flush: 'post' });
</script>

<template>
  <div class="ui-slider" :class="{ 'ui-slider--disabled': disabled || maximum <= minimum, 'ui-slider--error': Boolean(error) }">
    <div class="ui-slider__heading"><label class="ui-slider__label" :for="id">{{ label }}</label><span v-if="showValue" class="ui-slider__value" aria-hidden="true">{{ current }}</span></div>
    <div class="ui-slider__control">
      <div class="ui-slider__rail" aria-hidden="true"><span class="ui-slider__fill" :style="{ width: fill + '%' }"></span><span class="ui-slider__ticks"></span></div>
      <input v-bind="attrs" :id="id" ref="control" class="ui-slider__input" type="range" :value="current" :min="minimum" :max="maximum" :step="increment" :disabled="disabled || maximum <= minimum" :aria-describedby="describedBy()" :aria-invalid="error ? true : attrs['aria-invalid'] as boolean | 'true' | 'false' | 'grammar' | 'spelling' | undefined" @input="update">
    </div>
    <div class="ui-slider__limits" aria-hidden="true"><span>{{ minimum }}</span><span>{{ maximum }}</span></div>
    <p v-if="hint" :id="`${id}-hint`" class="ui-slider__hint">{{ hint }}</p>
    <p v-if="error" :id="`${id}-error`" class="ui-slider__error" role="alert">{{ error }}</p>
  </div>
</template>

<style scoped>
.ui-slider { --ui-slider-tone: var(--ui-color-info); min-width: 0; display: grid; gap: 8px; color: var(--ui-color-text); font: var(--ui-font-size-body)/var(--ui-line-height-body) var(--ui-font-family); }
.ui-slider--error { --ui-slider-tone: var(--ui-color-danger); }
.ui-slider__heading { display: flex; align-items: baseline; justify-content: space-between; gap: 16px; }
.ui-slider__label { min-width: 0; overflow-wrap: anywhere; font-size: var(--ui-font-size-caption); font-weight: var(--ui-font-weight-emphasis); letter-spacing: .04em; }
.ui-slider__value { flex: none; color: var(--ui-slider-tone); font: 11px/1.6 var(--ui-font-family-mono); font-variant-numeric: tabular-nums; }
.ui-slider__control { box-sizing: border-box; position: relative; min-width: 0; padding-inline: 6px; }
.ui-slider__rail { box-sizing: border-box; position: absolute; inset: calc(50% - 4px) 6px auto; height: 8px; border: 1px solid var(--ui-color-metal); background: var(--ui-color-surface); pointer-events: none; }
.ui-slider__fill { display: block; height: 100%; background: var(--ui-slider-tone); opacity: .7; }
.ui-slider__ticks { position: absolute; inset: 0; background: repeating-linear-gradient(90deg, transparent 0 22px, var(--ui-color-surface) 22px 24px); }
.ui-slider__input { box-sizing: border-box; position: relative; display: block; width: 100%; height: 40px; min-height: 40px; margin: 0; padding: 0; border: 0; border-radius: 0; appearance: none; background: transparent; color: var(--ui-slider-tone); cursor: pointer; }
.ui-slider__input:focus-visible { outline: none; }
.ui-slider__input::-webkit-slider-runnable-track { height: 4px; background: transparent; }
.ui-slider__input::-moz-range-track { height: 4px; background: transparent; }
.ui-slider__input::-webkit-slider-thumb { box-sizing: border-box; appearance: none; width: 20px; height: 20px; margin-top: -8px; border: 2px solid var(--ui-slider-tone); border-radius: 0; background: linear-gradient(90deg, transparent 42%, var(--ui-slider-tone) 42% 58%, transparent 58%), var(--ui-color-surface-raised); transform: rotate(45deg); transition: box-shadow var(--ui-motion-duration-feedback) var(--ui-motion-ease-standard); }
.ui-slider__input::-moz-range-thumb { box-sizing: border-box; width: 20px; height: 20px; border: 2px solid var(--ui-slider-tone); border-radius: 0; background: linear-gradient(90deg, transparent 42%, var(--ui-slider-tone) 42% 58%, transparent 58%), var(--ui-color-surface-raised); transform: rotate(45deg); transition: box-shadow var(--ui-motion-duration-feedback) var(--ui-motion-ease-standard); }
.ui-slider__input:focus-visible::-webkit-slider-thumb { outline: 2px solid var(--ui-color-focus); outline-offset: 3px; }
.ui-slider__input:focus-visible::-moz-range-thumb { outline: 2px solid var(--ui-color-focus); outline-offset: 3px; }
.ui-slider__input:hover:not(:disabled)::-webkit-slider-thumb { box-shadow: 0 0 0 3px var(--ui-color-accent-soft); }
.ui-slider__input:hover:not(:disabled)::-moz-range-thumb { box-shadow: 0 0 0 3px var(--ui-color-accent-soft); }
.ui-slider__limits { display: flex; justify-content: space-between; gap: 16px; margin-top: -5px; color: var(--ui-color-text-secondary); font: 9px/1.6 var(--ui-font-family-mono); }
.ui-slider__hint, .ui-slider__error { margin: 0; font-size: var(--ui-font-size-caption); line-height: 1.7; overflow-wrap: anywhere; }
.ui-slider__hint { color: var(--ui-color-text-secondary); } .ui-slider__error { color: var(--ui-color-danger); }
.ui-slider--disabled { opacity: .5; } .ui-slider__input:disabled { cursor: not-allowed; }
:global([data-ui-motion='reduced'] .ui-slider__input::-webkit-slider-thumb), :global([data-ui-motion='reduced'] .ui-slider__input::-moz-range-thumb) { transition: none; }
@media (prefers-reduced-motion: reduce) { .ui-slider__input::-webkit-slider-thumb, .ui-slider__input::-moz-range-thumb { transition: none; } }
@media (pointer: coarse) { .ui-slider__input { height: 44px; min-height: 44px; } }
@media (forced-colors: active) { .ui-slider__rail { border-color: CanvasText; background: Canvas; } .ui-slider__fill { forced-color-adjust: none; background: Highlight; opacity: 1; } .ui-slider__ticks { display: none; } .ui-slider__input::-webkit-slider-thumb { forced-color-adjust: none; border-color: CanvasText; background: Highlight; } .ui-slider__input::-moz-range-thumb { forced-color-adjust: none; border-color: CanvasText; background: Highlight; } }
</style>
