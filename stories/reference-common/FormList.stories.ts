import { defineComponent, reactive, ref } from 'vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { MForm, MFormItem, MFormList, MInput, MButton, MSelect, MCheckboxGroup } from '../../src/components';
const meta = {
  title: '基础组件/Form 动态字段', tags: ['autodocs'],
  render: () => defineComponent({
    components: { MForm, MFormItem, MFormList, MInput, MButton, MSelect, MCheckboxGroup },
    setup() {
      const model = reactive({ profile: { name: '' }, members: [{ id: 1, name: '' }], checked: ['paper'] }); let sequence = 1;
      const rules = { 'profile.name': [{ required: true }], 'members.*.name': [{ required: true, min: 2 }] };
      const result = ref(''), selected = ref<string[]>(['paper']);
      const options = [{ value: 'paper', label: '宣纸' }, { value: 'ink', label: '浓墨' }, { value: 'jade', label: '青玉' }];
      return { model, rules, result, selected, options, member: () => ({ id: ++sequence, name: '' }), submit: (snapshot: object) => { result.value = JSON.stringify(snapshot); } };
    },
    template: `
      <MForm :model="model" :rules="rules" label="档案成员" @submit="submit" class="kit-stack" style="max-width:640px">
        <MFormItem name="profile.name" label="档案名" v-slot="{ field }">
          <MInput v-bind="field" v-model="model.profile.name" />
        </MFormItem>
        <MFormList v-model="model.members" name="members" label="成员" item-key="id" v-slot="{ fields, add, remove, move }">
          <div v-for="field in fields" :key="field.key" class="kit-row">
            <MFormItem :name="field.name + '.name'" :label="'成员' + (field.index + 1)" v-slot="{ field: binding }">
              <MInput v-bind="binding" v-model="field.value.name" />
            </MFormItem>
            <MButton variant="secondary" @click="remove(field.index)">删除成员{{ field.index + 1 }}</MButton>
            <MButton variant="ghost" :disabled="field.index === 0" @click="move(field.index, field.index - 1)">上移成员{{ field.index + 1 }}</MButton>
          </div>
          <MButton variant="secondary" @click="add(member())">添加成员</MButton>
        </MFormList>
        <MSelect multiple v-model:selected-values="selected" :options="options" label="原生多选材质" name="materials" />
        <MFormItem name="checked" label="组合复选材质" required v-slot="{ field }">
          <MCheckboxGroup v-bind="field" v-model="model.checked" :options="options" :max="2" />
        </MFormItem>
        <MButton type="submit">提交动态表单</MButton>
        <output>{{ result }}</output>
      </MForm>
    `,
  }),
} satisfies Meta;
export default meta; type Story = StoryObj<typeof meta>;
export const Default: Story = {};
