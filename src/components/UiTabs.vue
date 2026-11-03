<script setup lang="ts">
import { computed, nextTick, ref, useId, watch } from 'vue';
import type { UiTabItem, UiTabsProps } from './types';

const props = withDefaults(defineProps<UiTabsProps>(), { activationMode: 'automatic' });
const emit = defineEmits<{ 'update:modelValue': [value: string] }>();
defineSlots<Record<string, (props: { item: UiTabItem; active: boolean }) => unknown>>();

const instanceId = `ui-tabs-${useId()}`;
const list = ref<HTMLElement>();
const buttons = new Map<string, HTMLButtonElement>();
const itemIds = new Map<string, number>();
let nextId = 0;
let restoringFocus = false;
let pointerGesture: { value: string; activatedOnFocus: boolean } | undefined;
const enabledItems = computed(() => props.items.filter(item => !item.disabled));
// An unavailable value displays the first enabled panel without mutating its owner.
const selectedValue = computed(() => enabledItems.value.find(item => item.value === props.modelValue)?.value ?? enabledItems.value[0]?.value);
const focusedValue = ref<string | undefined>(selectedValue.value);
const tabStopValue = computed(() => enabledItems.value.some(item => item.value === focusedValue.value) ? focusedValue.value : selectedValue.value);

function itemId(value: string) {
  if (!itemIds.has(value)) itemIds.set(value, nextId++);
  return itemIds.get(value)!;
}
function tabId(value: string) { return `${instanceId}-tab-${itemId(value)}`; }
function panelId(value: string) { return `${instanceId}-panel-${itemId(value)}`; }

function activate(value: string) {
  if (!enabledItems.value.some(item => item.value === value)) return false;
  focusedValue.value = value;
  if (value === props.modelValue) return false;
  emit('update:modelValue', value);
  return true;
}

function onPointerDown(event: PointerEvent, value: string) {
  if (event.button === 0 && event.isPrimary) pointerGesture = { value, activatedOnFocus: false };
}

function onPointerCancel() { pointerGesture = undefined; }

function onClick(event: MouseEvent, value: string) {
  const gesture = pointerGesture;
  pointerGesture = undefined;
  // Focus and click can run in different tasks; track the physical gesture,
  // rather than the parent's update timing. Detail 0 remains an explicit
  // keyboard/assistive/programmatic activation, even after an abandoned press.
  if (event.detail > 0 && gesture?.value === value && gesture.activatedOnFocus) return;
  activate(value);
}

function reveal(button: HTMLButtonElement) {
  button.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' });
}

function focusTab(value: string | undefined, activateOnFocus = true) {
  if (value === undefined) { list.value?.focus({ preventScroll: true }); return; }
  focusedValue.value = value;
  const button = buttons.get(value);
  restoringFocus = !activateOnFocus;
  button?.focus({ preventScroll: true });
  restoringFocus = false;
  if (button) reveal(button);
}

function onFocus(value: string) {
  focusedValue.value = value;
  if (props.activationMode === 'automatic' && !restoringFocus) {
    const activated = activate(value);
    if (pointerGesture?.value === value) pointerGesture.activatedOnFocus = activated;
  }
}

function onFocusOut(event: FocusEvent) {
  if (!(event.relatedTarget instanceof Node) || !list.value?.contains(event.relatedTarget)) {
    focusedValue.value = selectedValue.value;
  }
}

function onKeydown(event: KeyboardEvent, value: string) {
  pointerGesture = undefined;
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.isComposing) return;
  const items = enabledItems.value;
  if (!items.length) return;
  const index = items.findIndex(item => item.value === value);
  const rtl = list.value && getComputedStyle(list.value).direction === 'rtl';
  let target: string | undefined;
  if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
    const direction = (event.key === 'ArrowRight' ? 1 : -1) * (rtl ? -1 : 1);
    target = items[(index + direction + items.length) % items.length]!.value;
  } else if (event.key === 'Home') target = items[0]!.value;
  else if (event.key === 'End') target = items.at(-1)!.value;
  else if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    activate(value);
    return;
  } else return;
  event.preventDefault();
  focusTab(target);
}

watch([selectedValue, () => enabledItems.value.map(item => item.value)], ([selected], [previous]) => {
  const activeElement = list.value?.ownerDocument.activeElement;
  const currentFocus = [...buttons].find(([, button]) => button === activeElement)?.[0];
  const focusUnavailable = currentFocus !== undefined && !enabledItems.value.some(item => item.value === currentFocus);
  if (selected !== previous || !enabledItems.value.some(item => item.value === focusedValue.value)) {
    focusedValue.value = selected;
  }
  if (focusUnavailable) void nextTick(() => focusTab(selected, false));
});
</script>

<template>
  <div class="ui-tabs">
    <div class="ui-tabs__rail">
      <div ref="list" class="ui-tabs__list" role="tablist" :aria-label="label" aria-orientation="horizontal" tabindex="-1" @focusout="onFocusOut">
        <button
          v-for="item in items"
          :id="tabId(item.value)"
          :key="item.value"
          :ref="element => { if (element) buttons.set(item.value, element as HTMLButtonElement); else buttons.delete(item.value); }"
          class="ui-tabs__tab"
          type="button"
          role="tab"
          :aria-selected="selectedValue === item.value"
          :aria-controls="panelId(item.value)"
          :disabled="item.disabled"
          :tabindex="tabStopValue === item.value ? 0 : -1"
          @pointerdown="onPointerDown($event, item.value)"
          @pointercancel="onPointerCancel"
          @focus="onFocus(item.value)"
          @click="onClick($event, item.value)"
          @keydown="onKeydown($event, item.value)"
        >{{ item.label }}</button>
      </div>
    </div>
    <section
      v-for="item in items"
      :id="panelId(item.value)"
      :key="item.value"
      class="ui-tabs__panel"
      role="tabpanel"
      :aria-labelledby="tabId(item.value)"
      :hidden="selectedValue !== item.value"
      tabindex="0"
    >
      <slot :name="item.value" :item="item" :active="selectedValue === item.value">
        <slot :item="item" :active="selectedValue === item.value" />
      </slot>
    </section>
  </div>
</template>

<style scoped>
.ui-tabs {
  min-width: 0;
  color: var(--ui-color-text);
  font: var(--ui-font-weight-body) var(--ui-font-size-body)/var(--ui-line-height-body) var(--ui-font-family);
}

.ui-tabs__rail {
  overflow-x: auto;
  overscroll-behavior-inline: contain;
  padding: 6px;
  scrollbar-width: thin;
  scrollbar-color: var(--ui-color-metal) transparent;
}

.ui-tabs__list {
  display: flex;
  width: max-content;
  min-width: 100%;
  border-bottom: var(--ui-border-width) solid var(--ui-color-border);
}

.ui-tabs__tab {
  position: relative;
  flex: none;
  min-height: var(--ui-control-height);
  padding: var(--ui-space-1) var(--ui-control-padding-inline);
  border: 0;
  border-radius: 0;
  background: transparent;
  color: var(--ui-color-text-secondary);
  font: inherit;
  font-weight: var(--ui-font-weight-emphasis);
  letter-spacing: 0.025em;
  white-space: nowrap;
  cursor: pointer;
  transition:
    color var(--ui-motion-duration-transition) var(--ui-motion-ease-standard),
    background-color var(--ui-motion-duration-transition) var(--ui-motion-ease-standard);
}

.ui-tabs__tab::after {
  content: '';
  position: absolute;
  inset-inline: var(--ui-space-3);
  bottom: -1px;
  height: 3px;
  background: currentColor;
  clip-path: polygon(0 0, 100% 0, calc(100% - 3px) 100%, 0 100%);
  opacity: 0;
  transform: scaleX(0.35);
  transform-origin: left;
  transition:
    opacity var(--ui-motion-duration-transition) var(--ui-motion-ease-standard),
    transform var(--ui-motion-duration-transition) var(--ui-motion-ease-emphasized);
}

.ui-tabs__tab:hover:not(:disabled) { color: var(--ui-color-accent); background: var(--ui-color-accent-soft); }
.ui-tabs__tab[aria-selected='true'] { color: var(--ui-color-accent); }
.ui-tabs__tab[aria-selected='true']::after { opacity: 1; transform: scaleX(1); }
.ui-tabs__tab:disabled { opacity: 0.45; cursor: not-allowed; }
.ui-tabs__tab:focus-visible,
.ui-tabs__panel:focus-visible,
.ui-tabs__list:focus-visible { outline: var(--ui-focus-width) solid var(--ui-color-focus); outline-offset: var(--ui-focus-offset); }

.ui-tabs__panel { min-width: 0; padding: var(--ui-space-5) 6px 6px; overflow-wrap: anywhere; }
.ui-tabs__panel[hidden] { display: none; }

@media (pointer: coarse) { .ui-tabs__tab { min-height: 44px; } }
@media (prefers-reduced-motion: reduce) { .ui-tabs__tab, .ui-tabs__tab::after { transition: none; } }
@media (forced-colors: active) {
  .ui-tabs__tab::after { clip-path: none; background: Highlight; forced-color-adjust: none; }
}
</style>
