<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useAttrs, useId, watch } from 'vue';
import MButton from './MButton.vue';
import { floatingPosition } from '../composables/floatingPosition';
import type { MDropdownMenuProps, MMenuAction } from './types';

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<MDropdownMenuProps>(), { placement: 'bottom', disabled: false });
const emit = defineEmits<{ 'update:modelValue': [open: boolean]; select: [value: string] }>();
const attrs = useAttrs();
const trigger = ref<InstanceType<typeof MButton>>();
const panel = ref<HTMLElement>();
const id = `ui-dropdown-menu-${useId()}`;
const visible = ref(false), ready = ref(false), focused = ref<string>();
const actions = computed(() => props.items.filter((item): item is MMenuAction => item.type !== 'separator'));
const enabled = computed(() => actions.value.filter(item => !item.disabled));
const buttons = new Map<string, HTMLButtonElement>();
let mounted = false, requesting = false, restoreOnClose = false;
let focusOnOpen: 'first' | 'last' | undefined;
let positioning: ReturnType<typeof floatingPosition> | undefined;
let cycle = 0;
let search = '';
let searchTimer: ReturnType<typeof setTimeout> | undefined;
const triggerElement = () => trigger.value?.$el as HTMLButtonElement | undefined;
const isOpen = () => panel.value?.matches(':popover-open') ?? false;
function resetSearch() { search = ''; if (searchTimer !== undefined) clearTimeout(searchTimer); searchTimer = undefined; }
function cleanup() { positioning?.dispose(); positioning = undefined; ready.value = false; resetSearch(); cycle++; }
function focusItem(value: string | undefined) {
  const element = panel.value;
  if (!mounted || !isOpen() || !element) return;
  const item = enabled.value.find(item => item.value === value);
  focused.value = item?.value;
  // Tab exit temporarily clears the native tab stops even if a controlled owner declines closing.
  for (const [key, button] of buttons) button.tabIndex = key === item?.value ? 0 : -1;
  const button = item && buttons.get(item.value);
  if (button) { button.focus({ preventScroll: true }); button.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' }); }
  else element.focus({ preventScroll: true });
}
function request(value: boolean, restore = false) {
  if (!mounted || requesting || value === props.modelValue || (value && props.disabled)) return;
  requesting = true;
  restoreOnClose = !value && restore;
  emit('update:modelValue', value);
  void nextTick(() => {
    requesting = false;
    if (props.modelValue !== value) { focusOnOpen = undefined; restoreOnClose = false; }
  });
}
function openFromTrigger(where: 'first' | 'last') {
  if (props.disabled) return;
  if (props.modelValue) { focusItem(where === 'first' ? enabled.value[0]?.value : enabled.value.at(-1)?.value); return; }
  focusOnOpen = where;
  request(true);
}
function toggle() {
  if (props.modelValue) request(false, true);
  else openFromTrigger('first');
}
function triggerKey(event: KeyboardEvent) {
  if (event.altKey || event.ctrlKey || event.metaKey || event.isComposing) return;
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); openFromTrigger(event.key === 'ArrowDown' ? 'first' : 'last'); }
}
function select(item: MMenuAction) {
  if (item.disabled || props.disabled) return;
  request(false, true);
  emit('select', item.value);
}
function keydown(event: KeyboardEvent) {
  if (event.isComposing || event.altKey || event.ctrlKey || event.metaKey) return;
  if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); request(false, true); return; }
  if (event.key === 'Tab') {
    resetSearch();
    // Continue the browser's actual tab order from the trigger, skipping menu items.
    // No document-wide tab-stop approximation or focus trap is needed.
    for (const button of buttons.values()) button.tabIndex = -1;
    triggerElement()?.focus({ preventScroll: true });
    request(false);
    return;
  }
  if (event.shiftKey || !enabled.value.length) return;
  const current = enabled.value.findIndex(item => item.value === focused.value);
  let target: MMenuAction | undefined;
  if (event.key === 'ArrowDown') target = enabled.value[(current + 1) % enabled.value.length];
  else if (event.key === 'ArrowUp') target = current < 0 ? enabled.value.at(-1) : enabled.value[(current - 1 + enabled.value.length) % enabled.value.length];
  else if (event.key === 'Home') target = enabled.value[0];
  else if (event.key === 'End') target = enabled.value.at(-1);
  else if (event.key.length === 1 && event.key !== ' ') {
    const character = event.key.normalize('NFKC').toLocaleLowerCase();
    search += character;
    if (searchTimer !== undefined) clearTimeout(searchTimer);
    searchTimer = setTimeout(resetSearch, 700);
    const repeated = [...search].every(letter => letter === character);
    const needle = repeated ? character : search;
    const start = repeated ? current + 1 : Math.max(0, current);
    const ordered = [...enabled.value.slice(start), ...enabled.value.slice(0, start)];
    target = ordered.find(item => item.label.trim().normalize('NFKC').toLocaleLowerCase().startsWith(needle));
    event.preventDefault();
    if (target) focusItem(target.value);
    return;
  }
  if (target) { event.preventDefault(); resetSearch(); focusItem(target.value); }
}
function syncOpen() {
  const element = panel.value, button = triggerElement();
  if (!mounted || !element?.isConnected || !button) return;
  if (props.modelValue && !props.disabled) {
    if (!isOpen()) element.showPopover();
    visible.value = true;
    if (!positioning) positioning = floatingPosition(button, element, () => props.placement, () => {
      ready.value = true;
      if (focusOnOpen) {
        const where = focusOnOpen, opening = cycle; focusOnOpen = undefined;
        void nextTick(() => { if (mounted && isOpen() && cycle === opening) focusItem(where === 'first' ? enabled.value[0]?.value : enabled.value.at(-1)?.value); });
      }
    });
    else positioning.update();
    if (focused.value && !enabled.value.some(item => item.value === focused.value)) {
      const active = element.ownerDocument.activeElement;
      if (!active || active === element.ownerDocument.body || element.contains(active)) focusItem(enabled.value[0]?.value);
      else focused.value = undefined;
    }
  } else {
    focusOnOpen = undefined;
    const document = element.ownerDocument;
    const active = document.activeElement;
    const restore = restoreOnClose || Boolean(active && element.contains(active));
    if (isOpen()) element.hidePopover();
    visible.value = false; focused.value = undefined; restoreOnClose = false; cleanup();
    if (restore && !props.disabled) void nextTick(() => {
      const current = document.activeElement;
      if (mounted && !isOpen() && button.isConnected && !button.disabled
        && (!current || current === document.body || current === document.documentElement || current === button || element.contains(current))) button.focus({ preventScroll: true });
    });
  }
}
function nativeToggle() {
  if (!mounted) return;
  if (isOpen()) { syncOpen(); return; }
  visible.value = false; focused.value = undefined; cleanup();
  if (props.modelValue) { emit('update:modelValue', false); void nextTick(syncOpen); }
}
onMounted(() => { mounted = true; syncOpen(); });
watch(() => [props.modelValue, props.disabled, props.placement, props.items], syncOpen, { flush: 'post', deep: true });
onBeforeUnmount(() => { mounted = false; cleanup(); if (isOpen()) panel.value?.hidePopover(); buttons.clear(); });
</script>

<template>
  <div class="ui-dropdown-menu">
    <MButton v-bind="attrs" ref="trigger" variant="secondary" :disabled="disabled" :aria-label="triggerLabel || label" aria-haspopup="menu" :aria-expanded="visible" :aria-controls="id" :popovertarget="id" @click.prevent="toggle" @keydown="triggerKey"><slot name="trigger">{{ triggerLabel || label }}</slot><svg class="ui-dropdown-menu__chevron" width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="m3 4.5 3 3 3-3" stroke="currentColor" stroke-width="1.5" /></svg></MButton>
    <div :id="id" ref="panel" class="ui-dropdown-menu__panel" popover="auto" role="menu" :aria-label="label" :data-ready="ready || undefined" tabindex="-1" @toggle="nativeToggle" @keydown="keydown">
      <div class="ui-dropdown-menu__heading" aria-hidden="true"><span class="ui-dropdown-menu__seal"></span><span>{{ label }}</span><span class="ui-dropdown-menu__ticks"></span></div>
      <div class="ui-dropdown-menu__items" role="presentation">
        <template v-for="item in items" :key="item.type === 'separator' ? 'separator-' + item.key : 'item-' + item.value">
          <div v-if="item.type === 'separator'" class="ui-dropdown-menu__separator" role="separator"></div>
          <button v-else :ref="element => { if (element) buttons.set(item.value, element as HTMLButtonElement); else buttons.delete(item.value); }" class="ui-dropdown-menu__item" :class="{ 'ui-dropdown-menu__item--danger': item.danger }" type="button" role="menuitem" :aria-label="item.label" :disabled="item.disabled" :tabindex="focused === item.value ? 0 : -1" @focus="focused = item.value" @pointermove="!item.disabled && focusItem(item.value)" @click="select(item)"><span class="ui-dropdown-menu__cursor" aria-hidden="true"></span><span class="ui-dropdown-menu__label">{{ item.label }}</span><kbd v-if="item.shortcut" aria-hidden="true">{{ item.shortcut }}</kbd><span v-else class="ui-dropdown-menu__end" aria-hidden="true">↗</span></button>
        </template>
        <p v-if="!actions.length" class="ui-dropdown-menu__empty">暂无可用操作</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ui-dropdown-menu { display: inline-flex; min-width: 0; max-width: 100%; }
.ui-dropdown-menu__chevron { margin-inline-start: 10px; flex: none; transition: transform var(--ui-motion-duration-transition) var(--ui-motion-ease-emphasized); }
.ui-dropdown-menu :deep([aria-expanded='true'] .ui-dropdown-menu__chevron) { transform: rotate(180deg); }
.ui-dropdown-menu__panel { --ui-menu-x: 0px; --ui-menu-y: -4px; box-sizing: border-box; position: fixed; isolation: isolate; inset: auto; left: 0; top: 0; margin: 0; width: max-content; min-width: min(240px, calc(100vw - 24px)); max-width: min(360px, calc(100vw - 24px)); max-height: calc(100dvh - 24px); padding: 1px; border: 0; border-radius: 0; background: transparent; color: var(--ui-color-text); overflow: hidden; visibility: hidden; font: var(--ui-font-size-body)/var(--ui-line-height-body) var(--ui-font-family); }
.ui-dropdown-menu__panel:popover-open { display: flex; flex-direction: column; }
.ui-dropdown-menu__panel::before, .ui-dropdown-menu__panel::after { content: ''; position: absolute; z-index: -1; pointer-events: none; clip-path: polygon(0 0, calc(100% - 13px) 0, 100% 13px, 100% 100%, 9px 100%, 0 calc(100% - 9px)); }
.ui-dropdown-menu__panel::before { inset: 0; background: var(--ui-color-metal); }
.ui-dropdown-menu__panel::after { inset: 1px; clip-path: polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 8px 100%, 0 calc(100% - 8px)); background: linear-gradient(120deg, color-mix(in srgb, var(--ui-color-accent) 5%, transparent), transparent 50%), var(--ui-color-surface-raised); }
.ui-dropdown-menu__panel[data-ready] { visibility: visible; animation: ui-menu-enter var(--ui-motion-duration-transition) var(--ui-motion-ease-emphasized); }
.ui-dropdown-menu__panel[data-placement='top'] { --ui-menu-y: 4px; }
.ui-dropdown-menu__panel[data-placement='left'] { --ui-menu-x: 4px; --ui-menu-y: 0px; }
.ui-dropdown-menu__panel[data-placement='right'] { --ui-menu-x: -4px; --ui-menu-y: 0px; }
.ui-dropdown-menu__heading { display: flex; align-items: center; gap: 10px; flex: none; padding: 13px 18px 12px; border-bottom: 1px solid var(--ui-color-rule); background: linear-gradient(var(--ui-color-accent), var(--ui-color-accent)) 18px top / 35px 2px no-repeat; font: 13px/1.5 var(--ui-font-family-display); color: var(--ui-color-text-secondary); overflow-wrap: anywhere; }
.ui-dropdown-menu__seal { flex: none; width: 6px; height: 14px; border-block: 2px solid var(--ui-color-accent); border-inline: 1px solid var(--ui-color-accent); transform: skewY(-18deg); }
.ui-dropdown-menu__ticks { margin-inline-start: auto; width: 22px; height: 10px; flex: none; background: repeating-linear-gradient(90deg, var(--ui-color-secondary-accent) 0 1px, transparent 1px 5px) left center / 100% 5px no-repeat; opacity: .65; }
.ui-dropdown-menu__items { min-height: 0; overflow: auto; padding: 7px; scrollbar-width: thin; scrollbar-color: var(--ui-color-metal) transparent; overscroll-behavior: contain; }
.ui-dropdown-menu__item { position: relative; display: flex; align-items: center; gap: 12px; box-sizing: border-box; min-height: 42px; width: 100%; max-width: 100%; padding: 10px 12px; border: 1px solid transparent; border-radius: 0; background: transparent; color: var(--ui-color-text); font: inherit; text-align: start; cursor: pointer; outline-offset: -2px; transition: background-color var(--ui-motion-duration-feedback) var(--ui-motion-ease-standard), border-color var(--ui-motion-duration-feedback) var(--ui-motion-ease-standard); }
.ui-dropdown-menu__label { min-width: 0; flex: 1; overflow-wrap: anywhere; }
.ui-dropdown-menu__cursor { width: 5px; height: 5px; flex: none; border: 1px solid var(--ui-color-metal); transform: rotate(45deg); }
.ui-dropdown-menu__item kbd { flex: none; max-width: 40%; overflow-wrap: anywhere; color: var(--ui-color-text-secondary); font: 10px/1.4 var(--ui-font-family-mono); letter-spacing: .05em; }
.ui-dropdown-menu__end { flex: none; color: var(--ui-color-metal); font-size: 12px; opacity: 0; }
.ui-dropdown-menu__item:focus { outline: none; border-color: var(--ui-color-accent); background: var(--ui-color-accent-soft); }
.ui-dropdown-menu__item:focus .ui-dropdown-menu__cursor { background: var(--ui-color-accent); border-color: var(--ui-color-accent); }
.ui-dropdown-menu__item:focus .ui-dropdown-menu__end { opacity: 1; color: var(--ui-color-accent); }
.ui-dropdown-menu__item:focus-visible { outline: 2px solid var(--ui-color-focus); }
.ui-dropdown-menu__item--danger, .ui-dropdown-menu__item--danger kbd { color: var(--ui-color-danger); }
.ui-dropdown-menu__item:disabled { opacity: .45; cursor: not-allowed; }
.ui-dropdown-menu__separator { margin: 6px 12px; height: 1px; background: var(--ui-color-rule); }
.ui-dropdown-menu__empty { margin: 0; padding: 20px 14px; color: var(--ui-color-text-secondary); font-size: var(--ui-font-size-caption); }
.ui-dropdown-menu__panel:focus-visible { outline: 2px solid var(--ui-color-focus); outline-offset: -4px; }
@keyframes ui-menu-enter { from { opacity: 0; transform: translate(var(--ui-menu-x), var(--ui-menu-y)); } to { opacity: 1; transform: translate(0, 0); } }
:global([data-ui-motion='reduced'] .ui-dropdown-menu__panel[data-ready]) { animation: none; }
@media (prefers-reduced-motion: reduce) { .ui-dropdown-menu__panel[data-ready] { animation: none; } .ui-dropdown-menu__item, .ui-dropdown-menu__chevron { transition: none; } }
@media (pointer: coarse) { .ui-dropdown-menu__item { min-height: 44px; } }
@media (forced-colors: active) { .ui-dropdown-menu__panel { border: 1px solid CanvasText; padding: 0; background: Canvas; color: CanvasText; } .ui-dropdown-menu__panel::before, .ui-dropdown-menu__panel::after, .ui-dropdown-menu__seal, .ui-dropdown-menu__ticks { display: none; } .ui-dropdown-menu__item { color: CanvasText; } .ui-dropdown-menu__item:focus { outline: 2px solid Highlight; border-color: Highlight; } .ui-dropdown-menu__item:disabled { color: GrayText; opacity: 1; } }
</style>
