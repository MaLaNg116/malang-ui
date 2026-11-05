<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import MSpinner from '../MSpinner.vue';
import MButton from '../MButton.vue';
import MDialog from '../MDialog.vue';
import { useMConfig } from '../../composables/useConfig';
const props = withDefaults(defineProps<{ modelValue: boolean; text?: string; fullscreen?: boolean; delay?: number; cancelable?: boolean; cancelLabel?: string }>(), { delay: 0 });
const emit = defineEmits<{ cancel: [] }>();
const { t } = useMConfig();
const host = ref<HTMLElement>(), mask = ref<HTMLElement>(), content = ref<HTMLElement>(), shown = ref(false);
const label = computed(() => props.text ?? t('loading', '加载中'));
let timer: ReturnType<typeof setTimeout> | undefined, mounted = false, previousFocus: HTMLElement | undefined, version = 0;
async function update() {
  const current = ++version; clearTimeout(timer); timer = undefined;
  if (!props.modelValue) {
    const original = previousFocus, ownedMask = mask.value; shown.value = false; await nextTick();
    if (!mounted || current !== version) return;
    const document = host.value?.ownerDocument, active = document?.activeElement;
    if (original?.isConnected && !original.closest('[inert]') && (!active || active === document?.body || active === document?.documentElement || ownedMask?.contains(active))) original.focus({ preventScroll: true });
    previousFocus = undefined; return;
  }
  if (!mounted) return;
  const reveal = async () => {
    if (!mounted || current !== version || !props.modelValue) return;
    const active = host.value?.ownerDocument.activeElement;
    if (active && content.value?.contains(active)) previousFocus = active as HTMLElement;
    shown.value = true; await nextTick();
    if (!mounted || current !== version) return;
    const document = host.value?.ownerDocument, now = document?.activeElement;
    if (previousFocus && !props.fullscreen && (!now || now === document?.body || now === document?.documentElement || content.value?.contains(now) || mask.value?.contains(now))) mask.value?.focus({ preventScroll: true });
  };
  const delay = Number.isFinite(props.delay) ? Math.max(0, props.delay) : 0;
  if (delay) timer = setTimeout(() => { void reveal(); }, delay); else await reveal();
}
watch(() => [props.modelValue, props.delay, props.fullscreen], () => { void update(); });
onMounted(() => { mounted = true; void update(); });
onBeforeUnmount(() => { mounted = false; version++; clearTimeout(timer); });
</script>
<template>
  <div ref="host" class="ui-loading" :aria-busy="modelValue || undefined">
    <div ref="content" class="ui-loading__content" :inert="shown && !fullscreen || undefined"><slot /></div>
    <MDialog v-if="fullscreen" :model-value="shown" :title="label" :close-on-backdrop="false" :close-on-escape="cancelable" class="ui-loading__fullscreen" @update:model-value="cancelable && emit('cancel')"><MSpinner :label="label" /><template v-if="cancelable" #footer><MButton variant="secondary" @click="emit('cancel')">{{ cancelLabel ?? t('cancel', '取消') }}</MButton></template></MDialog>
    <div v-else-if="shown" ref="mask" class="ui-loading__mask" tabindex="-1"><MSpinner :label="label" /><MButton v-if="cancelable" variant="secondary" size="sm" @click="emit('cancel')">{{ cancelLabel ?? t('cancel', '取消') }}</MButton></div>
  </div>
</template>
<style scoped>
.ui-loading { position: relative; min-width: 0; }.ui-loading__content { min-width: 0; }.ui-loading__mask { position: absolute; inset: 0; z-index: 20; display: flex; flex-direction: column; gap: 16px; align-items: center; justify-content: center; min-height: 56px; background: color-mix(in srgb, var(--ui-color-surface) 94%, transparent); }.ui-loading__mask:focus-visible { outline: 2px solid var(--ui-color-focus); outline-offset: -2px; }.ui-loading__fullscreen :deep(.ui-dialog__close) { display: none; }.ui-loading__fullscreen :deep(.ui-dialog__body) { display: grid; place-items: center; min-height: 100px; }
</style>
