<script setup lang="ts">
import { nextTick, ref, shallowRef, useId, watch } from 'vue';
import { useMTransition } from '../../composables/useMTransition';
import MTag from '../MTag.vue';
import MValueBridge from './MValueBridge.vue';
import { useReferenceConfig } from './locale';
import { useDraftReset } from './shared';
import type { MInputTagProps } from './types';

const props = withDefaults(defineProps<MInputTagProps>(), { max: Infinity, allowDuplicates: false, separator: ',' });
const emit = defineEmits<{ 'update:modelValue': [value: string[]] }>();
const { t } = useReferenceConfig();
const identity = `ui-input-tag-${useId()}`;
const root = ref<HTMLElement>(), input = ref<HTMLInputElement>();
const draft = ref(''), error = ref(''), composing = ref(false);
const { transition, moveClass } = useMTransition({ preset: 'reveal', group: true, duration: 150, focusTarget: () => input.value ?? null });

interface TagEntry { key: number; value: string }
let nextKey = 0;
function entry(value: string): TagEntry { return { key: nextKey++, value }; }
const entries = shallowRef(props.modelValue.map(entry));
let removal: { key: number; values: string[] } | undefined;

function sameValues(a: readonly string[], b: readonly string[]) {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

watch(() => [...props.modelValue], values => {
  // Only the owner's accepted value list identifies a requested duplicate removal.
  const removedKey = removal && sameValues(values, removal.values) ? removal.key : undefined;
  removal = undefined;
  const previous = new Map<string, TagEntry[]>();
  for (const tag of entries.value) {
    if (tag.key === removedKey) continue;
    const matches = previous.get(tag.value);
    if (matches) matches.push(tag);
    else previous.set(tag.value, [tag]);
  }
  const occurrences = new Map<string, number>();
  entries.value = values.map(value => {
    const index = occurrences.get(value) ?? 0;
    occurrences.set(value, index + 1);
    return previous.get(value)?.[index] ?? entry(value);
  });
});

function add(values = [draft.value]) {
  if (props.disabled || props.readonly || composing.value) return;
  const incoming = values.map(value => value.trim()).filter(Boolean);
  if (!incoming.length) return;
  const next = [...props.modelValue];
  for (const value of incoming) {
    if (!props.allowDuplicates && next.includes(value)) {
      error.value = t('tag.duplicate', '标签不能重复。');
      return;
    }
    next.push(value);
  }
  if (next.length > props.max) {
    error.value = t('tag.max', '标签数量已达上限。');
    return;
  }
  error.value = '';
  removal = undefined;
  emit('update:modelValue', next);
  void nextTick(() => { if (sameValues(props.modelValue, next)) draft.value = ''; });
}

function remove(tag: TagEntry | undefined) {
  if (!tag || props.disabled || props.readonly) return;
  const index = entries.value.findIndex(item => item.key === tag.key);
  if (index < 0) return;
  const values = props.modelValue.filter((_, position) => position !== index);
  removal = { key: tag.key, values: [...values] };
  emit('update:modelValue', values);
}

function keydown(event: KeyboardEvent) {
  if (event.isComposing || composing.value || event.keyCode === 229) return;
  if (event.key === 'Enter' || event.key === props.separator) {
    event.preventDefault();
    add();
  } else if (event.key === 'Backspace' && !draft.value && entries.value.length) {
    event.preventDefault();
    remove(entries.value.at(-1));
  }
}

function paste(event: ClipboardEvent) {
  if (props.disabled || props.readonly) return;
  const text = event.clipboardData?.getData('text') || '';
  if (text.includes(props.separator) || text.includes('\n')) {
    event.preventDefault();
    add(text.split(props.separator).flatMap(value => value.split(/\r?\n/)));
  }
}

useDraftReset(root, () => {
  removal = undefined;
  composing.value = false;
  draft.value = '';
  error.value = '';
  if (input.value) input.value.value = '';
});
</script>

<template>
  <div ref="root" class="ui-ri">
    <label class="ui-ri__label" :for="id || identity">{{ label }}</label>
    <TransitionGroup v-bind="transition" :move-class="moveClass" tag="div" class="ui-ri__row ui-input-tag__items ui-transition-group">
      <MTag v-for="tag in entries" :key="tag.key" :closable="!readonly" :disabled="disabled"
        :close-label="t('tag.remove', '移除标签') + tag.value" @close="remove(tag)">
        {{ tag.value }}
      </MTag>
    </TransitionGroup>
    <div class="ui-ri__row">
      <input :id="id || identity" ref="input" v-model="draft" class="ui-ri__control" :disabled="disabled" :readonly="readonly"
        :aria-invalid="!!error || undefined" @compositionstart="composing = true" @compositionend="composing = false" @keydown="keydown" @paste="paste">
      <button type="button" class="ui-ri__button" :disabled="disabled || readonly || !draft.trim()" @click="add()">{{ t('tag.add', '添加') }}</button>
    </div>
    <p v-if="error" class="ui-ri__error" role="alert">{{ error }}</p>
    <MValueBridge v-bind="props" :values="modelValue" :error="modelValue.length > max ? t('tag.max', '标签数量超出上限。') : ''" />
  </div>
</template>
