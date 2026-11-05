<script setup lang="ts">
import { computed, nextTick, ref, useId, watch } from 'vue';
import MPopover from '../MPopover.vue';
import MValueBridge from './MValueBridge.vue';
import { timeSeconds, formatTime, timeError, useDraftReset } from './shared';
import { moveInList } from './tree';
import { useReferenceConfig } from './locale';
import type { MTimePickerProps } from './types';
const props = withDefaults(defineProps<MTimePickerProps>(), { step: 60, showSeconds: false });
const emit = defineEmits<{ 'update:modelValue': [value: string] }>();
const { t } = useReferenceConfig();
const id = `ui-time-${useId()}`, root = ref<HTMLElement>(), input = ref<HTMLInputElement>();
const draft = ref(props.modelValue), open = ref(false), composing = ref(false);
const secondsVisible = computed(() => props.showSeconds || props.step % 60 !== 0);
const error = computed(() => timeError(draft.value, props.min, props.max, props.step, t));
const current = computed(() => timeSeconds(draft.value) ?? timeSeconds(props.min || '00:00') ?? 0);
const units = computed(() => [t('time.hour', '时'), t('time.minute', '分'), t('time.second', '秒')]);
function restore() { composing.value = false; draft.value = props.modelValue; if (input.value) input.value.value = props.modelValue; }
function commit() {
  if (composing.value || props.disabled || props.readonly) return;
  if (!error.value && draft.value !== props.modelValue) { emit('update:modelValue', draft.value); void nextTick(restore); }
}
function candidate(part: number, value: number) {
  const values = [Math.floor(current.value / 3600), Math.floor(current.value % 3600 / 60), current.value % 60];
  values[part] = value;
  return formatTime(values[0]! * 3600 + values[1]! * 60 + values[2]!, secondsVisible.value);
}
function select(part: number, value: number) {
  if (props.disabled || props.readonly) return;
  const next = candidate(part, value);
  if (!timeError(next, props.min, props.max, props.step)) { draft.value = next; commit(); }
}
function allowed(part: number, value: number) { return !timeError(candidate(part, value), props.min, props.max, props.step); }
watch(() => props.modelValue, value => { if (!composing.value) draft.value = value; });
watch(() => [props.disabled, props.readonly], () => { if (props.disabled || props.readonly) { open.value = false; restore(); } });
useDraftReset(root, restore);
</script>
<template>
  <div ref="root" class="ui-ri">
    <label :for="props.id || id" class="ui-ri__label">{{ label }}</label>
    <div class="ui-ri__row">
      <input :id="props.id || id" ref="input" v-model="draft" class="ui-ri__control" :form="form" :placeholder="secondsVisible ? 'HH:mm:ss' : 'HH:mm'" :disabled="disabled" :readonly="readonly" :aria-invalid="!!error || undefined" @compositionstart="composing = true" @compositionend="composing = false" @blur="commit" @keydown.enter.prevent="commit">
      <MPopover v-model="open" :label="label + t('time.panel', '时间面板')" :trigger-label="t('time.choose', '选择') + label" :disabled="disabled || readonly">
        <div class="ui-ri ui-ri-time__columns">
          <section v-for="(length, part) in (secondsVisible ? [24, 60, 60] : [24, 60])" :key="part">
            <h4>{{ units[part] }}</h4>
            <div class="ui-ri__list" data-ri-list>
              <button v-for="n in length" :key="n" type="button" class="ui-ri__button" :disabled="!allowed(part, n - 1)" :aria-label="`${n - 1}${units[part]}`" :aria-pressed="[Math.floor(current / 3600), Math.floor(current % 3600 / 60), current % 60][part] === n - 1" @keydown="moveInList" @click="select(part, n - 1)">{{ String(n - 1).padStart(2, '0') }}</button>
            </div>
          </section>
        </div>
      </MPopover>
    </div>
    <p v-if="error" class="ui-ri__error">{{ error }}</p>
    <MValueBridge v-bind="props" :values="draft ? [modelValue] : []" :error="error || (draft !== modelValue ? t('time.confirm', '请确认时间输入。') : '')" />
  </div>
</template>
<style scoped>.ui-ri-time__columns{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.ui-ri-time__columns h4{margin:0 0 6px}.ui-ri-time__columns .ui-ri__list{max-height:240px}.ui-ri-time__columns .ui-ri__button{min-width:0}</style>