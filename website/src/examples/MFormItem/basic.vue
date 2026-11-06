<script setup lang="ts">
import { reactive, ref } from 'vue';
import { MButton, MForm, MFormItem, MInput, type MFormRules } from 'malang-ui';

const model = reactive({ code: '' });
const result = ref('');
const rules: MFormRules = {
  code: [{ required: true, pattern: /^ML-[0-9]{3}$/, message: '请使用 ML- 加三位数字。' }],
};
</script>

<template>
  <div class="example">
    <MForm class="form-fields" :model="model" :rules="rules" label="编号校验" validate-on="blur" @submit="result = '编号 ' + model.code + ' 可用。'">
      <MFormItem name="code" label="档案编号" hint="例如 ML-012" v-slot="{ field }">
        <MInput v-bind="field" v-model="model.code" />
      </MFormItem>
      <MButton type="submit">核对编号</MButton>
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
