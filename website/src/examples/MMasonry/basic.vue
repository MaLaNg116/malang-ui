<script setup lang="ts">
import { ref } from 'vue';
import { MButton, MMasonry } from 'malang-ui';

const items = ref([
  { id: 1, title: '青玉卷宗', text: '附有材料清单。' },
  { id: 2, title: '宣纸手记', text: '记录纸纹、染色和裁切方法。并附两种不同的装订选项。' },
  { id: 3, title: '绢素样张', text: '展示压纹与边缘的处理。' },
]);
function add() {
  const id = items.value.length + 1;
  items.value.push({ id, title: '补充记录 ' + id, text: '补充这份材料的编号和简要描述。' });
}
</script>

<template>
  <div class="masonry-demo">
    <div><MButton size="sm" variant="secondary" @click="add">添加一条记录</MButton></div>
    <MMasonry :items="items" item-key="id" :columns="{ xs: 1, sm: 2, md: 3 }" :gap="12" label="材质记录">
      <template #item="{ item }">
        <article><strong>{{ item.title }}</strong><p>{{ item.text }}</p></article>
      </template>
    </MMasonry>
  </div>
</template>

<style scoped>
.masonry-demo { display: grid; gap: 14px; min-width: 0; }
article { padding: 14px; border: 1px solid var(--ui-color-rule); background: var(--ui-color-surface-muted); }
article p { margin-bottom: 0; }
</style>
