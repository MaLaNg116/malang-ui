<script setup lang="ts">
import { ref } from 'vue';
import { MRadioGroup } from 'malang-ui';

const scope = ref('团队可见');
const options = ['仅自己', '团队可见', '公开'].map(value => ({ value, label: value }));
</script>

<template>
  <div class="example">
    <MRadioGroup v-model="scope" label="共享范围" name="sharing-scope" :options="options" />
    <p>本次共享范围：{{ scope }}</p>
  </div>
</template>

<style scoped>
.example { display: grid; gap: 12px; width: 100%; min-width: 0; }
.example p { margin: 0; overflow-wrap: anywhere; }
</style>
