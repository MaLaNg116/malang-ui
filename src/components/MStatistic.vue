<script setup lang="ts">
import { computed, useId } from 'vue';
import type { MStatisticProps } from './types';

const props = withDefaults(defineProps<MStatisticProps>(), { placeholder: '—', tone: 'neutral' });
const identity = `ui-statistic-${useId()}`;
const labelId = `${identity}-label`;
const descriptionId = `${identity}-description`;
const hasValue = computed(() => typeof props.value === 'number' ? Number.isFinite(props.value) : typeof props.value === 'string' && Boolean(props.value.trim()));
const display = computed(() => hasValue.value ? String(props.value) : props.placeholder);
</script>

<template>
  <div class="ui-statistic" :class="`ui-statistic--${tone}`" role="group" :aria-labelledby="labelId" :aria-describedby="description ? descriptionId : undefined">
    <dl class="ui-statistic__datum">
      <dt :id="labelId" class="ui-statistic__label"><span class="ui-statistic__register" aria-hidden="true"></span>{{ label }}</dt>
      <dd class="ui-statistic__reading" :data-empty="!hasValue || undefined"><span v-if="hasValue && prefix" class="ui-statistic__affix">{{ prefix }}</span><span class="ui-statistic__value">{{ display }}</span><span v-if="hasValue && suffix" class="ui-statistic__affix">{{ suffix }}</span><span v-if="hasValue && unit" class="ui-statistic__unit">{{ unit }}</span></dd>
    </dl>
    <p v-if="description" :id="descriptionId" class="ui-statistic__description">{{ description }}</p>
  </div>
</template>

<style scoped>
.ui-statistic { --ui-statistic-tone: var(--ui-color-text); box-sizing: border-box; position: relative; min-width: 0; max-width: 100%; padding: 18px 0 20px; border-bottom: 1px solid var(--ui-color-rule); color: var(--ui-color-text); font: var(--ui-font-size-body)/var(--ui-line-height-body) var(--ui-font-family); }
.ui-statistic::after { content: ''; position: absolute; right: 0; bottom: -1px; width: 18px; height: 2px; background: var(--ui-statistic-tone); opacity: .65; pointer-events: none; }
.ui-statistic--info { --ui-statistic-tone: var(--ui-color-secondary-accent); }
.ui-statistic--success { --ui-statistic-tone: var(--ui-color-success); }
.ui-statistic--warning { --ui-statistic-tone: var(--ui-color-warning); }
.ui-statistic--error { --ui-statistic-tone: var(--ui-color-danger); }
.ui-statistic__datum { min-width: 0; margin: 0; }
.ui-statistic__label { display: flex; align-items: flex-start; gap: 9px; min-width: 0; color: var(--ui-color-text-secondary); font-size: 11px; line-height: 1.8; overflow-wrap: anywhere; }
.ui-statistic__register { box-sizing: border-box; flex: none; width: 6px; height: 10px; margin-top: 4px; border: 1px solid var(--ui-statistic-tone); border-bottom-width: 3px; transform: skewY(-18deg); opacity: .7; }
.ui-statistic__reading { display: flex; align-items: baseline; flex-wrap: wrap; gap: 4px 8px; min-width: 0; max-width: 100%; margin: 15px 0 0; color: var(--ui-statistic-tone); font-variant-numeric: tabular-nums; }
.ui-statistic__value { min-width: 0; max-width: 100%; font: 500 clamp(30px, 4vw, 44px)/1.25 var(--ui-font-family-display); font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }
.ui-statistic__affix { min-width: 0; max-width: 100%; font-size: 17px; line-height: 1.5; overflow-wrap: anywhere; }
.ui-statistic__unit { min-width: 0; max-width: 100%; color: var(--ui-color-text-secondary); font-size: 11px; line-height: 1.8; overflow-wrap: anywhere; }
.ui-statistic__reading[data-empty] { color: var(--ui-color-text-secondary); }
.ui-statistic__reading[data-empty] .ui-statistic__value { font-size: 28px; }
.ui-statistic__description { min-width: 0; margin: 10px 0 0; color: var(--ui-color-text-secondary); font-size: 11px; line-height: 1.8; overflow-wrap: anywhere; }
@media (forced-colors: active) { .ui-statistic { --ui-statistic-tone: CanvasText; border-color: CanvasText; } .ui-statistic::after { background: CanvasText; } .ui-statistic__value, .ui-statistic__affix { color: CanvasText; } .ui-statistic__register { border-color: CanvasText; } }
</style>
