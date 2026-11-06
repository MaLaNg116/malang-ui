<script setup lang="ts">
import { ref } from 'vue';
import { MButton, MInput } from 'malang-ui';

const email = ref('');
const submitted = ref('');
function submit() {
  submitted.value = email.value;
}
</script>

<template>
  <form @submit.prevent="submit">
    <MInput
      v-model="email"
      label="联系邮箱"
      type="email"
      name="email"
      autocomplete="email"
      placeholder="you@example.com"
      required
    />
    <MButton type="submit">校验并确认</MButton>
    <p role="status">{{ submitted ? '已确认：' + submitted : '' }}</p>
  </form>
</template>

<style scoped>
form { display: grid; gap: 20px; width: min(100%, 420px); }
button { justify-self: start; }
p { margin: 0; min-height: 20px; font-size: 14px; color: var(--ui-color-text-secondary); }
</style>
