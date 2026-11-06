<script setup lang="ts">
import { ref } from 'vue';
import { MSwitch } from 'malang-ui';

const reminders = ref(false);
</script>

<template>
  <div class="example">
    <MSwitch v-model="reminders" label="接收交付提醒" />
    <p>提醒{{ reminders ? '已开启' : '已关闭' }}。</p>
  </div>
</template>

<style scoped>
.example { display: grid; gap: 12px; width: 100%; min-width: 0; }
.example p { margin: 0; overflow-wrap: anywhere; }
</style>
