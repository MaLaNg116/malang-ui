<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import MDialog from '../MDialog.vue';
import MInput from '../MInput.vue';
import MButton from '../MButton.vue';
import { useMConfig } from '../../composables/useConfig';
import type { MMessageBoxOptions, MMessageBoxResult } from '../../composables/useApp';
const props = withDefaults(defineProps<MMessageBoxOptions & { modelValue: boolean }>(), { kind: 'confirm', inputValue: '' });
const emit = defineEmits<{ 'update:modelValue': [open: boolean]; result: [result: MMessageBoxResult] }>();
const { t } = useMConfig();
const draft = ref(props.inputValue), error = ref(''), pending = ref(false), body = ref<HTMLElement>();
let controller: AbortController | undefined, version = 0, requested = false;
const inputName = computed(() => props.inputLabel ?? props.message ?? props.title);
function invalidate() { version++; controller?.abort(); controller = undefined; pending.value = false; }
watch(() => props.modelValue, value => { invalidate(); requested = false; if (value) { draft.value = props.inputValue; error.value = ''; } });
watch(draft, () => { invalidate(); error.value = ''; }, { flush: 'sync' });
async function finish(action: MMessageBoxResult['action']) {
  if (requested || !props.modelValue) return;
  requested = true; invalidate(); emit('result', { action, value: draft.value }); emit('update:modelValue', false);
  await nextTick(); requested = false;
}
async function confirm() {
  if (pending.value || requested) return;
  const own = ++version; controller?.abort(); const abort = new AbortController(); controller = abort; pending.value = true; error.value = '';
  try {
    const result = await props.validate?.(draft.value, abort.signal);
    if (own !== version || abort.signal.aborted) return;
    if (result === false || typeof result === 'string') { error.value = typeof result === 'string' ? result || t('invalid', '请检查输入内容') : t('invalid', '请检查输入内容'); await nextTick(); body.value?.querySelector('input')?.focus(); return; }
    await finish('confirm');
  } catch (reason) { if (own === version && !abort.signal.aborted) error.value = reason instanceof Error ? reason.message || t('failed', '操作未完成，请重试') : String(reason); }
  finally { if (own === version) pending.value = false; }
}
function enter(event: KeyboardEvent) { if (event.key === 'Enter' && !event.isComposing && event.keyCode !== 229 && event.target instanceof HTMLInputElement) { event.preventDefault(); void confirm(); } }
onBeforeUnmount(invalidate);
</script>
<template>
  <MDialog :model-value="modelValue" :title="title" :close-label="t('close', '关闭')" @update:model-value="finish('close')">
    <div ref="body" class="ui-message-box" :aria-busy="pending || undefined" @keydown="enter"><p v-if="message">{{ message }}</p><MInput v-if="kind === 'prompt'" v-model="draft" :label="inputName" :error="error" /><p v-else-if="error" role="alert" class="ui-message-box__error">{{ error }}</p></div>
    <template #footer><MButton v-if="kind !== 'alert'" variant="secondary" @click="finish('cancel')">{{ cancelLabel ?? t('cancel', '取消') }}</MButton><MButton :loading="pending" @click="confirm">{{ confirmLabel ?? t('confirm', '确认') }}</MButton></template>
  </MDialog>
</template>
<style scoped>.ui-message-box { min-width: 0; }.ui-message-box > p { margin: 0 0 16px; overflow-wrap: anywhere; }.ui-message-box__error { color: var(--ui-color-danger); }</style>
