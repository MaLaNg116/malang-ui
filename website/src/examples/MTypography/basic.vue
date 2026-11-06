<script setup lang="ts">
import { ref } from 'vue';
import { MTypography } from 'malang-ui';

const title = ref('藏品整理手记');
</script>

<template>
  <div>
    <MTypography v-model="title" as="h3" editable label="手记标题" />
    <p>当前标题：{{ title }}</p>
  </div>
</template>
