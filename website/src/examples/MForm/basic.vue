<script setup lang="ts">
import { reactive, ref } from 'vue';
import { MButton, MForm, MFormItem, MInput, MTextarea, type MFormRules } from 'malang-ui';

const model = reactive({ title: '', note: '' });
const result = ref('');
const rules: MFormRules = {
  title: [{ required: true, min: 2, message: '档案标题至少填写两个字。' }],
};
function save() {
  result.value = '已保存「' + model.title + '」。';
}
</script>

<template>
  <div class="example">
    <MForm class="form-fields" :model="model" :rules="rules" label="档案登记" @submit="save" @invalid="result = '请先补全表单。'">
      <MFormItem name="title" label="档案标题" v-slot="{ field }">
        <MInput v-bind="field" v-model="model.title" />
      </MFormItem>
      <MFormItem name="note" label="附注" v-slot="{ field }">
        <MTextarea v-bind="field" v-model="model.note" :rows="2" />
      </MFormItem>
      <MButton type="submit">保存档案</MButton>
    </MForm>
    <p v-if="result" role="status">{{ result }}</p>
  </div>
</template>

<style scoped>
.example { display: grid; gap: 12px; width: 100%; min-width: 0; }
.example p { margin: 0; overflow-wrap: anywhere; }
.form-fields { display: grid; gap: 12px; min-width: 0; }
.form-fields > .ui-button { justify-self: start; }
</style>
