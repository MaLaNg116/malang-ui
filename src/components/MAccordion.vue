<script setup lang="ts">
import { computed, ref, useId } from 'vue';
import type { MAccordionItem, MAccordionProps } from './types';

const props = withDefaults(defineProps<MAccordionProps>(), { multiple: false, headingTag: 'h3' });
const emit = defineEmits<{ 'update:modelValue': [value: string[]] }>();
defineSlots<Record<string, (props: { item: MAccordionItem; expanded: boolean }) => unknown>>();
const identity = `ui-accordion-${useId()}`;
const group = ref<HTMLElement>();
const ids = new Map<string, number>();
let nextId = 0;
function key(value: string) { if (!ids.has(value)) ids.set(value, nextId++); return ids.get(value)!; }
function triggerId(value: string) { return `${identity}-trigger-${key(value)}`; }
function panelId(value: string) { return `${identity}-panel-${key(value)}`; }
const expandedValues = computed(() => {
  const valid = [...new Set(props.modelValue)].filter(value => props.items.some(item => item.value === value && !item.disabled));
  return props.multiple ? valid : valid.slice(0, 1);
});
function expanded(value: string) { return expandedValues.value.includes(value); }
function toggle(item: MAccordionItem) {
  if (item.disabled) return;
  emit('update:modelValue', expanded(item.value) ? expandedValues.value.filter(value => value !== item.value) : props.multiple ? [...expandedValues.value, item.value] : [item.value]);
}
function move(event: KeyboardEvent) {
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.isComposing) return;
  if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
  const enabled = [...group.value?.querySelectorAll<HTMLButtonElement>('.ui-accordion__trigger') ?? []].filter(button => !button.disabled && button.closest('.ui-accordion') === group.value);
  const index = enabled.indexOf(event.currentTarget as HTMLButtonElement);
  if (index < 0 || !enabled.length) return;
  event.preventDefault();
  const next = event.key === 'Home' ? 0 : event.key === 'End' ? enabled.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + enabled.length) % enabled.length;
  enabled[next]?.focus();
}
</script>

<template>
  <div ref="group" class="ui-accordion" role="group" :aria-label="label">
    <div v-for="(item, index) in items" :key="item.value" class="ui-accordion__item" :class="{ 'ui-accordion__item--expanded': expanded(item.value), 'ui-accordion__item--disabled': item.disabled }">
      <component :is="headingTag" class="ui-accordion__heading">
        <button :id="triggerId(item.value)" class="ui-accordion__trigger" type="button" :disabled="item.disabled" :aria-expanded="expanded(item.value)" :aria-controls="panelId(item.value)" :aria-labelledby="`${triggerId(item.value)}-label`" :aria-describedby="item.description ? `${triggerId(item.value)}-description` : undefined" @click="toggle(item)" @keydown="move">
          <span class="ui-accordion__number" aria-hidden="true">{{ String(index + 1).padStart(2, '0') }}</span>
          <span class="ui-accordion__summary"><span :id="`${triggerId(item.value)}-label`" class="ui-accordion__label">{{ item.label }}</span><span v-if="item.description" :id="`${triggerId(item.value)}-description`" class="ui-accordion__description">{{ item.description }}</span></span>
          <span class="ui-accordion__hinge" aria-hidden="true"><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="m4 2 4 4-4 4" stroke="currentColor" stroke-width="1.5" /></svg></span>
        </button>
      </component>
      <div :id="panelId(item.value)" class="ui-accordion__panel" role="region" :aria-labelledby="`${triggerId(item.value)}-label`" :hidden="!expanded(item.value)">
        <slot :name="item.value" :item="item" :expanded="expanded(item.value)"><slot :item="item" :expanded="expanded(item.value)" /></slot>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ui-accordion { min-width: 0; color: var(--ui-color-text); font: var(--ui-font-size-body)/var(--ui-line-height-body) var(--ui-font-family); border-top: 1px solid var(--ui-color-metal); }
.ui-accordion__item { position: relative; border-bottom: 1px solid var(--ui-color-rule); background: linear-gradient(var(--ui-color-metal), var(--ui-color-metal)) left top / 7px 1px no-repeat; }
.ui-accordion__item::before { content: ''; position: absolute; top: 16px; bottom: 16px; left: 0; width: 2px; background: var(--ui-color-accent); transform: scaleY(0); transform-origin: top; transition: transform var(--ui-motion-duration-transition) var(--ui-motion-ease-emphasized); pointer-events: none; }
.ui-accordion__item--expanded { background-color: var(--ui-color-surface); }
.ui-accordion__item--expanded::before { transform: scaleY(1); }
.ui-accordion__heading { margin: 0; font: inherit; }
.ui-accordion__trigger { box-sizing: border-box; width: 100%; min-height: 64px; display: grid; grid-template-columns: 30px minmax(0, 1fr) 26px; gap: 16px; align-items: center; padding: 18px 20px; border: 0; border-radius: 0; background: transparent; color: inherit; text-align: start; font: inherit; cursor: pointer; }
.ui-accordion__trigger:hover:not(:disabled) { background: color-mix(in srgb, var(--ui-color-wash) 16%, transparent); }
.ui-accordion__trigger:focus-visible { outline: var(--ui-focus-width) solid var(--ui-color-focus); outline-offset: -3px; }
.ui-accordion__number { align-self: start; padding-top: 3px; color: var(--ui-color-metal); font: 11px/1.7 var(--ui-font-family-mono); letter-spacing: 1px; }
.ui-accordion__item--expanded .ui-accordion__number { color: var(--ui-color-accent); }
.ui-accordion__summary { display: grid; gap: 6px; min-width: 0; overflow-wrap: anywhere; }
.ui-accordion__label { font: var(--ui-font-weight-emphasis) var(--ui-font-size-heading)/1.5 var(--ui-font-family-display); }
.ui-accordion__description { color: var(--ui-color-text-secondary); font-size: var(--ui-font-size-caption); font-weight: var(--ui-font-weight-body); line-height: 1.7; }
.ui-accordion__hinge { box-sizing: border-box; display: grid; place-items: center; width: 26px; height: 26px; border: 1px solid var(--ui-color-rule); color: var(--ui-color-metal); }
.ui-accordion__hinge svg { transition: transform var(--ui-motion-duration-transition) var(--ui-motion-ease-emphasized); }
.ui-accordion__item--expanded .ui-accordion__hinge { border-color: var(--ui-color-accent); color: var(--ui-color-accent); }
.ui-accordion__item--expanded .ui-accordion__hinge svg { transform: rotate(90deg); }
.ui-accordion__trigger:disabled { opacity: .5; cursor: not-allowed; }
.ui-accordion__panel { padding: 0 62px 24px 66px; overflow-wrap: anywhere; }
.ui-accordion__panel[hidden] { display: none; }
.ui-accordion__panel:not([hidden]) { animation: ui-accordion-unfold var(--ui-motion-duration-transition) var(--ui-motion-ease-emphasized); }
@keyframes ui-accordion-unfold { from { opacity: 0; transform: translateY(calc(var(--ui-motion-distance-enter) * -.5)); } to { opacity: 1; transform: translateY(0); } }
:global([data-ui-motion='reduced'] .ui-accordion__panel:not([hidden])) { animation: none; }
:global([data-ui-motion='reduced'] .ui-accordion__item::before), :global([data-ui-motion='reduced'] .ui-accordion__hinge svg) { transition: none; }
@media (prefers-reduced-motion: reduce) { .ui-accordion__panel:not([hidden]) { animation: none; } .ui-accordion__item::before, .ui-accordion__hinge svg { transition: none; } }
@media (max-width: 480px) { .ui-accordion__trigger { grid-template-columns: 22px minmax(0, 1fr) 26px; gap: 12px; padding: 16px 12px; } .ui-accordion__panel { padding: 0 12px 20px 46px; } }
@media (forced-colors: active) { .ui-accordion__item--expanded::before { background: Highlight; } .ui-accordion__trigger:disabled { opacity: 1; color: GrayText; } }
</style>
