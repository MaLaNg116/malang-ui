<script setup lang="ts">
import { ref } from 'vue';
import { MAffix, MButton } from 'malang-ui';

const panel = ref<HTMLElement>();
const selected = ref(false);
const target = () => panel.value ?? null;
</script>

<template>
  <div ref="panel" class="scroll-area" tabindex="0" role="region" aria-label="可滚动记录">
    <p class="intro">向下滚动，观察工具条的位置。</p>
    <MAffix :target="target" v-slot="{ affixed }">
      <div class="bar">
        <MButton size="sm" variant="secondary" @click="selected = !selected">
          {{ selected ? '取消标记' : '标记当前卷宗' }}
        </MButton>
        <span>{{ affixed ? '已固定' : '随内容滚动' }}</span>
      </div>
    </MAffix>
    <ol><li v-for="index in 10" :key="index">卷宗记录 {{ index }}</li></ol>
  </div>
</template>

<style scoped>
.scroll-area { height: 190px; overflow: auto; overscroll-behavior: contain; border: 1px solid var(--ui-color-rule); }
.intro, ol { margin: 0; padding: 16px 28px; }
li { padding-block: 8px; }
.bar { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; padding: 10px; background: var(--ui-color-surface); }
</style>
