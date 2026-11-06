<script setup lang="ts">
import { ref } from 'vue';
import { MAutoComplete } from 'malang-ui';

const address = ref('');
const options = ['杭州工作室', '上海展厅', '北京档案馆'].map(text => ({ value: text, label: text }));
</script>

<template>
  <div class="example">
    <MAutoComplete v-model="address" label="交付地点" placeholder="输入城市或自定义地点" :options="options" />
    <p>将使用：{{ address || '尚未填写' }}</p>
  </div>
</template>

<style scoped>
.example { display: grid; gap: 12px; width: 100%; min-width: 0; }
.example p { margin: 0; overflow-wrap: anywhere; }
</style>
