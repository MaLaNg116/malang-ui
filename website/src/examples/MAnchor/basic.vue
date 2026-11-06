<script setup lang="ts">
import { ref, useId } from 'vue';
import { MAnchor } from 'malang-ui';

const panel = ref<HTMLElement>();
const id = useId();
const chapters = [
  { label: '摘要', text: '查阅卷宗编号、作者与来源。' },
  { label: '材料', text: '查看纸、墨和装订方式。' },
  { label: '修订', text: '核对修改人与登记时间。' },
];
const items = chapters.map((chapter, index) => ({ label: chapter.label, href: '#' + id + '-' + index }));
const target = () => panel.value ?? null;
</script>

<template>
  <div class="anchor-demo">
    <MAnchor :items="items" :target="target" label="卷宗章节" />
    <div ref="panel" class="scroll-area" tabindex="0" role="region" aria-label="卷宗正文">
      <section v-for="(chapter, index) in chapters" :id="id + '-' + index" :key="chapter.label">
        <h4>{{ chapter.label }}</h4>
        <p>{{ chapter.text }}</p>
      </section>
    </div>
  </div>
</template>

<style scoped>
.anchor-demo { display: grid; gap: 12px; }
.scroll-area { height: 150px; overflow: auto; overscroll-behavior: contain; border: 1px solid var(--ui-color-rule); }
.scroll-area section { box-sizing: border-box; min-height: 150px; padding: 12px 16px; }
.scroll-area h4 { margin-top: 0; }
</style>
