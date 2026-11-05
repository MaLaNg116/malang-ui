<script setup lang="ts">
import { ref } from 'vue';
import { MButton, useMTransition } from 'malang-ui';
import type { MTransitionOptions, MTransitionPreset } from 'malang-ui';

const rows = ref(['档案一', '档案二']);
const open = ref(true);
const disabled = ref(false);
const preset: MTransitionPreset = 'reveal';
const options: MTransitionOptions = { preset, group: true, disabled: () => disabled.value };
const { transition, moveClass } = useMTransition(options);
const panel = useMTransition({ preset: 'fold', duration: 180, disabled });
</script>

<template>
  <MButton @click="rows.reverse()">反转卷宗</MButton>
  <TransitionGroup tag="ul" class="ui-transition-group" v-bind="transition" :move-class="moveClass">
    <li v-for="row in rows" :key="row">{{ row }}</li>
  </TransitionGroup>
  <MButton @click="open = !open">切换卷末</MButton>
  <Transition v-bind="panel.transition"><p v-if="open">卷末记录</p></Transition>
</template>
