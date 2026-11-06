<script setup lang="ts">
import { ref } from 'vue';
import { MButton, MDrawer, MInput } from 'malang-ui';

const open = ref(false);
const draft = ref('');
const note = ref('尚无备注');
function edit() {
  draft.value = note.value === '尚无备注' ? '' : note.value;
  open.value = true;
}
function save() {
  note.value = draft.value.trim() || '尚无备注';
  open.value = false;
}
</script>

<template>
  <div>
    <MButton @click="edit">编辑备注</MButton>
    <p>当前备注：{{ note }}</p>
    <MDrawer v-model="open" title="补充备注" side="right" size="sm">
      <MInput v-model="draft" label="卷宗备注" />
      <template #footer><MButton @click="save">应用备注</MButton></template>
    </MDrawer>
  </div>
</template>
