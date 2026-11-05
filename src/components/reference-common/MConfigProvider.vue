<script setup lang="ts">
import { computed, provide } from 'vue';
import { mConfigKey, useMConfig, type MConfigOverrides } from '../../composables/useConfig';
const props = defineProps<MConfigOverrides>();
const { config: parent } = useMConfig();
const config = computed(() => {
  const own = Object.fromEntries(Object.entries(props).filter(([, value]) => value !== undefined));
  return { ...parent.value, ...own, messages: { ...parent.value.messages, ...props.messages } } as Readonly<MConfigOverrides>;
});
provide(mConfigKey, config);
</script>

<template>
  <div class="ui-config-provider" :data-ui-theme="config.theme" :data-ui-palette="config.palette" :data-ui-density="config.density" :data-ui-motion="config.motion" :lang="config.locale" :dir="config.dir"><slot :config="config" /></div>
</template>

<style scoped>
.ui-config-provider { min-width: 0; color: var(--ui-color-text); font-family: var(--ui-font-family); }
</style>
