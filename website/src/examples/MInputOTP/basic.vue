<script setup lang="ts">
import { ref } from 'vue';
import { MInputOTP } from 'malang-ui';

const code = ref('');
const complete = ref('');
</script>

<template>
  <div class="example">
    <MInputOTP v-model="code" label="四位验证码" :length="4" type="numeric" autocomplete="one-time-code" @complete="complete = $event" />
    <p>{{ code.length === 4 && complete === code ? '四位验证码已填齐。' : '已填写 ' + code.length + ' / 4 位' }}</p>
  </div>
</template>

<style scoped>
.example { display: grid; gap: 12px; width: 100%; min-width: 0; }
.example p { margin: 0; overflow-wrap: anywhere; }
</style>
