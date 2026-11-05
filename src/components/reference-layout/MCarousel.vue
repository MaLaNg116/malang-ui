<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue';
import type { MCarouselProps } from './types';
import { bounded, keyIntent, useReduced } from './_shared';
import { useMConfig } from '../../composables/useConfig';
const props = withDefaults(defineProps<MCarouselProps>(), { autoplay: false, interval: 5000, loop: true });
const emit = defineEmits<{ 'update:modelValue': [index: number]; change: [index: number] }>();
const { t } = useMConfig();
const host = ref<HTMLElement>(), internal = ref(0), userPaused = ref(false), hover = ref(false), focused = ref(false), hidden = ref(false), mounted = ref(false);
const identity = `ui-carousel-${useId()}`, reduced = useReduced(host);
const current = computed(() => Math.floor(bounded(props.modelValue ?? internal.value,0,Math.max(0,props.items.length-1),0)));
const running = computed(() => mounted.value && props.autoplay && props.items.length > 1 && !userPaused.value && !hover.value && !focused.value && !hidden.value && !reduced.value);
let timer: ReturnType<typeof setTimeout> | undefined;
function stop() { if (timer !== undefined) clearTimeout(timer); timer = undefined; }
function select(index: number, manual = true) {
  if (!props.items.length) return;
  const next = props.loop ? (index % props.items.length + props.items.length) % props.items.length : Math.max(0,Math.min(props.items.length-1,index));
  if (next === current.value) return;
  const document = host.value?.ownerDocument, active = document?.activeElement, retired = host.value?.querySelector('[data-current]');
  if (manual) userPaused.value = true;
  if (props.modelValue === undefined) internal.value = next;
  emit('update:modelValue',next); emit('change',next);
  void nextTick(() => { if (active && document && (retired?.contains(active) || active.matches(':disabled')) && (document.activeElement === document.body || document.activeElement === active)) host.value?.focus({preventScroll:true}); });
}
function schedule() { stop(); if (!running.value) return; timer = setTimeout(() => { timer = undefined; if (!running.value) return; if (!props.loop && current.value === props.items.length-1) userPaused.value = true; else select(current.value+1,false); schedule(); },bounded(props.interval,1000,2147483647,5000)); }
function play() { userPaused.value = false; schedule(); } function pause() { userPaused.value = true; stop(); }
function visibility() { hidden.value = host.value?.ownerDocument.hidden ?? false; }
function focusOut(event: FocusEvent) { focused.value = !!host.value?.contains(event.relatedTarget as Node); }
function keyboard(event: KeyboardEvent) { if (!keyIntent(event) || event.shiftKey || (event.target as Element).closest('input,textarea,select,[contenteditable="true"]')) return; if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); const rtl = host.value && getComputedStyle(host.value).direction === 'rtl'; select(current.value + (event.key === 'ArrowRight' ? 1 : -1) * (rtl ? -1 : 1)); } else if (event.key === 'Home' || event.key === 'End') { event.preventDefault(); select(event.key === 'Home' ? 0 : props.items.length-1); } }
watch([running,current,() => props.interval,() => props.loop],schedule);
onMounted(() => { mounted.value = true; visibility(); host.value?.ownerDocument.addEventListener('visibilitychange',visibility); schedule(); });
onBeforeUnmount(() => { mounted.value = false; stop(); host.value?.ownerDocument.removeEventListener('visibilitychange',visibility); });
defineExpose({ play, pause, goTo: select });
</script>
<template><section ref="host" class="ui-carousel" role="region" :aria-label="label || t('carouselLabel','内容轮播')" :aria-roledescription="t('carouselRole','轮播')" tabindex="0" @mouseenter="hover = true" @mouseleave="hover = false" @focusin="focused = true" @focusout="focusOut" @keydown="keyboard"><div class="ui-carousel__slides" :aria-live="running ? 'off' : 'polite'" aria-atomic="false"><section v-for="(item,index) in items" :id="`${identity}-${index}`" :key="item.key" class="ui-carousel__slide" role="group" :aria-roledescription="t('carouselSlide','幻灯片')" :aria-label="`${index+1} / ${items.length} ${item.label}`" :hidden="current !== index" :inert="current !== index || undefined" :data-current="current === index || undefined"><slot :name="item.key" :item="item" :index="index" :active="current === index"><slot :item="item" :index="index" :active="current === index">{{ item.label }}</slot></slot></section></div><p v-if="!items.length" class="ui-carousel__empty">{{ t('empty','暂无内容') }}</p><div v-if="items.length" class="ui-carousel__controls"><button type="button" :aria-label="t('previous','上一张')" :disabled="!loop && current === 0" @click="select(current-1)">←</button><div class="ui-carousel__dots" role="group" :aria-label="t('carouselSelect','选择幻灯片')"><button v-for="(item,index) in items" :key="item.key" type="button" :aria-label="`${index+1}. ${item.label}`" :aria-controls="`${identity}-${index}`" :aria-current="current === index ? 'true' : undefined" @click="select(index)"><span aria-hidden="true" /></button></div><button type="button" :aria-label="t('next','下一张')" :disabled="!loop && current === items.length-1" @click="select(current+1)">→</button><button v-if="autoplay" class="ui-carousel__play" type="button" :aria-pressed="!userPaused" @click="userPaused ? play() : pause()">{{ userPaused ? t('carouselPlay','播放轮播') : t('carouselPause','暂停轮播') }}</button></div></section></template>
<style scoped>.ui-carousel{min-width:0;border:1px solid var(--ui-color-rule);background:var(--ui-color-surface);color:var(--ui-color-text)}.ui-carousel__slide{min-width:0;overflow-wrap:anywhere}.ui-carousel__slide[hidden]{display:none}.ui-carousel__empty{padding:24px;color:var(--ui-color-text-secondary)}.ui-carousel__controls{display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:8px;padding:12px;border-top:1px solid var(--ui-color-rule)}.ui-carousel__controls>button{min-width:44px;min-height:44px;padding:8px 12px;border:1px solid var(--ui-color-border);background:var(--ui-color-surface);color:var(--ui-color-text);cursor:pointer}.ui-carousel__controls button:disabled{opacity:.4;cursor:not-allowed}.ui-carousel__dots{display:flex;flex-wrap:wrap;justify-content:center}.ui-carousel__dots button{display:grid;place-items:center;width:44px;height:44px;border:0;background:transparent;color:var(--ui-color-metal);cursor:pointer}.ui-carousel__dots span{width:12px;height:4px;background:currentColor}.ui-carousel__dots button[aria-current]{color:var(--ui-color-accent)}.ui-carousel__dots button[aria-current] span{width:20px}.ui-carousel:focus-visible,.ui-carousel button:focus-visible{outline:2px solid var(--ui-color-focus);outline-offset:-3px}@media(forced-colors:active){.ui-carousel{background:Canvas;border-color:CanvasText}.ui-carousel__dots button[aria-current]{color:Highlight}}</style>
