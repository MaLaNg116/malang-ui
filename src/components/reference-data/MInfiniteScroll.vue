<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onBeforeUpdate, onMounted, onUpdated, ref, watch } from 'vue';
import MScrollbar from './MScrollbar.vue';
import MSpinner from '../MSpinner.vue';
import type { MInfiniteScrollProps } from './types';
import { useMConfig } from '../../composables/useConfig';
import './reference-data.css';
const props = withDefaults(defineProps<MInfiniteScrollProps>(), { loading: false, disabled: false, finished: false, distance: 80, height: 320 });
const emit = defineEmits<{ load: []; retry: [] }>();
const { t } = useMConfig(), scrollbar = ref<InstanceType<typeof MScrollbar>>(), awaiting = ref(false);
const footer = ref<HTMLElement>(); let ownedFocus = false;
const locked = computed(() => props.disabled || props.loading || props.finished || awaiting.value);
let alive = false, lastHeight = -1, wasAway = false;
function request(retry = false) {
  if (locked.value || props.error && !retry) return;
  awaiting.value = true; if (retry) emit('retry'); else emit('load');
  // A declined synchronous request remains retryable by an explicit action, not
  // by a scroll/resize feedback loop. The next user action may request again.
  void nextTick(() => { if (alive && !props.loading) awaiting.value = false; });
}
function onScroll() {
  const viewport = scrollbar.value?.viewport; if (!viewport || locked.value || props.error) return;
  const distance = Number.isFinite(props.distance) ? Math.max(0, props.distance) : 80;
  const near = viewport.scrollHeight - viewport.clientHeight - viewport.scrollTop <= distance;
  if (!near) { wasAway = true; return; }
  if (viewport.scrollHeight > lastHeight || wasAway) { lastHeight = viewport.scrollHeight; wasAway = false; request(); }
}
watch(() => props.loading, (loading, previous) => { if (previous && !loading) awaiting.value = false; });
onMounted(() => { alive = true; });
onBeforeUpdate(() => { const active = footer.value?.ownerDocument.activeElement; ownedFocus = !!active && !!footer.value?.contains(active); });
onUpdated(() => { const element = scrollbar.value?.viewport; if (ownedFocus && element?.ownerDocument.activeElement === element?.ownerDocument.body) element?.focus({ preventScroll: true }); ownedFocus = false; });
onBeforeUnmount(() => { alive = false; });
defineExpose({ scrollTo: (options: ScrollToOptions) => scrollbar.value?.scrollTo(options), viewport: computed(() => scrollbar.value?.viewport), check: onScroll });
</script>
<template>
  <section class="ui-data ui-infinite" :aria-busy="loading || undefined"><MScrollbar ref="scrollbar" :height="height" :label="label ?? t('scroll', '连续清单')" @scroll="onScroll"><slot /><div ref="footer" class="ui-infinite__footer"><template v-if="finished"><slot name="finished">已读至卷末</slot></template><template v-else><p v-if="error" role="alert">{{error}}</p><button class="ui-data__button" type="button" :disabled="disabled" :aria-disabled="locked || undefined" @click="request(Boolean(error))"><MSpinner v-if="loading" label="" aria-hidden="true" />{{error ? t('refresh', '重试加载') : t('loadMore', '加载更多')}}</button></template></div></MScrollbar></section>
</template>
<style scoped>
.ui-infinite__footer { display: grid; justify-items: center; gap: 10px; padding: 18px; border-top: 1px solid var(--ui-color-rule); color: var(--ui-color-text-secondary); }.ui-infinite__footer p { margin: 0; overflow-wrap: anywhere; }
</style>
