<script setup lang="ts">
import { MIcon, MTooltip } from 'malang-ui';
</script>

<template>
  <MTooltip label="编号说明" text="档案编号由登记时间与序列号组成。" placement="top" :delay="150">
    <MIcon name="info" :size="18" />
    <span>编号说明</span>
  </MTooltip>
</template>
