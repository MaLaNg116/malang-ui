<script setup lang="ts">
import { reactive, ref } from 'vue';
import { MButton, MForm, MFormItem, MFormList, MInput, type MFormRules } from 'malang-ui';

const model = reactive({ members: [{ id: 1, name: '林墨' }, { id: 2, name: '苏澄' }] });
const result = ref('');
const rules: MFormRules = { 'members.*.name': [{ required: true, message: '请填写成员姓名。' }] };
let nextId = 3;
const newMember = () => ({ id: nextId++, name: '' });
</script>

<template>
  <div class="example">
    <MForm class="form-fields" :model="model" :rules="rules" label="交付成员" @submit="result = '已保存 ' + model.members.length + ' 位成员。'">
      <MFormList v-model="model.members" name="members" label="成员清单" item-key="id" :min="1" v-slot="{ fields, add, remove }">
        <div v-for="item in fields" :key="item.key" class="member">
          <MFormItem :name="item.name + '.name'" :label="'成员 ' + (item.index + 1)" v-slot="{ field }">
            <MInput v-bind="field" v-model="item.value.name" />
          </MFormItem>
          <MButton variant="ghost" :disabled="fields.length === 1" :aria-label="'移除成员 ' + (item.index + 1)" @click="remove(item.index)">移除</MButton>
        </div>
        <MButton variant="secondary" @click="add(newMember())">添加成员</MButton>
      </MFormList>
      <MButton type="submit">保存清单</MButton>
    </MForm>
    <p v-if="result" role="status">{{ result }}</p>
  </div>
</template>

<style scoped>
.example { display: grid; gap: 12px; width: 100%; min-width: 0; }
.example p { margin: 0; overflow-wrap: anywhere; }
.form-fields { display: grid; gap: 12px; min-width: 0; }
.form-fields > .ui-button { justify-self: start; }
.member { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: end; gap: 8px; min-width: 0; }
</style>
