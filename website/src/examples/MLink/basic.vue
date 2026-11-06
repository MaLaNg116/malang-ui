<script setup lang="ts">
import { MLink, MSpace } from 'malang-ui';
</script>

<template>
  <MSpace :size="20">
    <MLink href="https://github.com/MaLaNg116/malang-ui" target="_blank" rel="noreferrer" type="primary" underline>
      浏览项目源码
    </MLink>
    <MLink href="https://github.com/MaLaNg116/malang-ui/issues" disabled>问题列表暂不可用</MLink>
  </MSpace>
</template>
