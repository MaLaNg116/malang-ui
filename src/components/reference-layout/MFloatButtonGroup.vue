<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, provide, ref, useId, watch } from 'vue';
import type { MFloatButtonGroupProps } from './types';
import { floatGroupContext } from './_shared';
const props = withDefaults(defineProps<MFloatButtonGroupProps>(), { expandable: true, label: '浮动操作' });
const emit = defineEmits<{ 'update:modelValue': [open: boolean] }>();
provide(floatGroupContext,true);
const host = ref<HTMLElement>(), trigger = ref<HTMLButtonElement>(), panel = ref<HTMLElement>(), internal = ref(false), identity = `ui-floats-${useId()}`;
const open = computed(() => !props.expandable || (props.modelValue ?? internal.value));
function update(value: boolean) { if (props.modelValue === undefined) internal.value = value; emit('update:modelValue',value); }
function outside(event: PointerEvent) { if (props.expandable && open.value && !host.value?.contains(event.target as Node)) update(false); }
function escape(event: KeyboardEvent) { if (event.key === 'Escape' && props.expandable && open.value) { event.preventDefault(); update(false); } }
watch(open,(value,old) => { const active = host.value?.ownerDocument.activeElement; if (!value && old && active && panel.value?.contains(active)) void nextTick(() => { const document = host.value?.ownerDocument; if (document && (document.activeElement === document.body || panel.value?.contains(document.activeElement))) trigger.value?.focus({preventScroll:true}); }); });
onMounted(() => host.value?.ownerDocument.addEventListener('pointerdown',outside,true)); onBeforeUnmount(() => host.value?.ownerDocument.removeEventListener('pointerdown',outside,true));
</script>
<template><div ref="host" class="ui-float-group" role="group" :aria-label="label" @keydown="escape"><button v-if="expandable" ref="trigger" class="ui-float-group__trigger" type="button" :aria-label="`${open ? '收起' : '展开'}${label}`" :aria-expanded="open" :aria-controls="identity" @click="update(!open)"><slot name="trigger"><span aria-hidden="true">{{ open ? '×' : '＋' }}</span></slot></button><div :id="identity" ref="panel" v-show="open" class="ui-float-group__items" :inert="!open || undefined"><slot /></div></div></template>
<style scoped>.ui-float-group{position:fixed;inset-inline-end:max(24px,env(safe-area-inset-right));bottom:max(24px,env(safe-area-inset-bottom));z-index:90;display:grid;justify-items:center;gap:12px;max-width:calc(100% - 48px)}.ui-float-group__items{order:-1;display:grid;justify-items:center;gap:12px}.ui-float-group__trigger{display:grid;place-items:center;width:56px;height:56px;min-width:44px;border:1px solid var(--ui-color-accent);border-radius:0;background:var(--ui-color-accent);color:var(--ui-color-on-accent);font:24px/1 var(--ui-font-family);cursor:pointer}.ui-float-group__trigger:focus-visible{outline:2px solid var(--ui-color-focus);outline-offset:3px}@media(forced-colors:active){.ui-float-group__trigger{background:ButtonFace;color:ButtonText;border-color:ButtonText}}</style>
