<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useMTransition } from '../../composables/useMTransition';
import MValueBridge from './MValueBridge.vue';
import { useReferenceConfig } from './locale';
import type { MTransferOption, MTransferProps } from './types';

const props = withDefaults(defineProps<MTransferProps>(), { filterable: true });
const emit = defineEmits<{ 'update:modelValue': [value: string[]]; change: [value: string[], direction: 'left' | 'right', moved: string[]] }>();
const { t } = useReferenceConfig();
const root = ref<HTMLElement>();
const queries = ref<[string, string]>(['', '']);
const marked = ref<[string[], string[]]>([[], []]);
const quiet = ref<[boolean, boolean]>([false, false]);
const panels = [0, 1] as const;
type Side = typeof panels[number];
const emptyKey = Symbol('transfer-empty');

const sides = computed(() => {
  const selected = new Set(props.modelValue);
  return [props.options.filter(option => !selected.has(option.value)), props.options.filter(option => selected.has(option.value))] as const;
});
function filter(side: Side) {
  const needle = queries.value[side].toLocaleLowerCase();
  return sides.value[side].filter(option => option.label.toLocaleLowerCase().includes(needle));
}
const visible = computed(() => [filter(0), filter(1)] as const);
const selectable = computed(() => [visible.value[0].filter(option => !option.disabled), visible.value[1].filter(option => !option.disabled)] as const);

function motion(side: Side) {
  return useMTransition({
    preset: 'reveal', group: true, duration: 145,
    disabled: () => quiet.value[side],
    focusTarget: () => root.value?.querySelector<HTMLElement>(`[data-transfer-filter="${side}"]`)
      ?? root.value?.querySelector<HTMLElement>(`[data-transfer-move="${side}"]`) ?? null,
  });
}
const motions = [motion(0), motion(1)] as const;

function largeChange(before: readonly MTransferOption[], after: readonly MTransferOption[]) {
  const oldKeys = new Set(before.map(option => option.value));
  const newKeys = new Set(after.map(option => option.value));
  let changed = 0;
  for (const key of oldKeys) if (!newKeys.has(key) && ++changed > 8) return true;
  for (const key of newKeys) if (!oldKeys.has(key) && ++changed > 8) return true;
  return false;
}
watch(visible, (next, previous) => {
  // A broad filter change should settle immediately rather than animate a long list.
  quiet.value = [largeChange(previous[0], next[0]), largeChange(previous[1], next[1])];
});

function panelTitle(side: Side) {
  return props.titles?.[side] || (side === 0 ? t('transfer.source', '待选项目') : t('transfer.target', '已选项目'));
}
function allChecked(side: Side) {
  const options = selectable.value[side];
  return options.length > 0 && options.every(option => marked.value[side].includes(option.value));
}
function toggleAll(side: Side, event: Event) {
  const checked = (event.target as HTMLInputElement).checked;
  marked.value[side] = checked ? selectable.value[side].map(option => option.value) : [];
}
function canMove(side: Side) {
  return !props.disabled && !props.readonly && marked.value[side].length > 0;
}
function move(side: Side) {
  if (!canMove(side)) return;
  const available = new Set(sides.value[side].filter(option => !option.disabled).map(option => option.value));
  const moved = marked.value[side].filter(value => available.has(value));
  if (!moved.length) return;
  const next = side === 0 ? [...new Set([...props.modelValue, ...moved])] : props.modelValue.filter(value => !moved.includes(value));
  emit('update:modelValue', next);
  emit('change', next, side === 0 ? 'right' : 'left', moved);
}

watch(sides, () => {
  for (const side of panels) {
    const available = new Set(sides.value[side].filter(option => !option.disabled).map(option => option.value));
    marked.value[side] = marked.value[side].filter(value => available.has(value));
  }
}, { deep: true });
</script>

<template>
  <div ref="root" class="ui-ri" role="group" :aria-label="label">
    <span class="ui-ri__label">{{ label }}</span>
    <div class="ui-ri-transfer">
      <section v-for="side in panels" :key="side" class="ui-ri__panel" :aria-label="panelTitle(side)">
        <h4>{{ panelTitle(side) }} {{ sides[side].length }}</h4>
        <input v-if="filterable" v-model="queries[side]" class="ui-ri__control" :data-transfer-filter="side"
          :aria-label="t('search', '搜索') + panelTitle(side)">
        <label class="ui-ri__row">
          <input type="checkbox" :disabled="disabled || readonly" :checked="allChecked(side)" @change="toggleAll(side, $event)">
          {{ t('transfer.selectAll', '选择当前结果') }}
        </label>
        <TransitionGroup v-bind="motions[side].transition" :move-class="motions[side].moveClass.value"
          tag="ul" class="ui-ri__list ui-transition-group">
          <li v-for="option in visible[side]" :key="option.value">
            <label class="ui-ri__row">
              <input v-model="marked[side]" type="checkbox" :value="option.value" :disabled="disabled || readonly || option.disabled">
              {{ option.label }}
            </label>
          </li>
          <li v-if="!visible[side].length" :key="emptyKey" class="ui-ri-transfer__empty">{{ t('empty', '暂无数据') }}</li>
        </TransitionGroup>
        <button type="button" class="ui-ri__button" :data-transfer-move="side" :disabled="disabled || readonly"
          :aria-disabled="!canMove(side) || undefined" :tabindex="canMove(side) ? undefined : -1" @click="move(side)">
          {{ side === 0 ? t('transfer.add', '移入已选') : t('transfer.remove', '移回待选') }}
        </button>
      </section>
    </div>
    <MValueBridge v-bind="props" :values="modelValue"
      :error="modelValue.some(value => !options.some(option => option.value === value)) ? t('transfer.invalid', '存在无效项目。') : ''" />
  </div>
</template>

<style scoped>
.ui-ri-transfer { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
.ui-ri-transfer h4 { margin: 0 0 10px; }
.ui-ri-transfer .ui-ri__panel { display: grid; gap: 12px; }
.ui-ri-transfer li { min-height: 36px; }
.ui-ri-transfer__empty { display: flex; align-items: center; color: var(--ui-color-text-secondary); }
.ui-ri-transfer button[aria-disabled='true'] { opacity: .55; cursor: not-allowed; }
@media (max-width: 480px) { .ui-ri-transfer { grid-template-columns: minmax(0, 1fr); } }
@media (pointer: coarse) { .ui-ri-transfer li { min-height: 44px; } }
</style>
