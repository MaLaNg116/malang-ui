import { defineComponent, reactive, ref } from 'vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import MForm from '../../src/components/MForm.vue';
import MFormItem from '../../src/components/MFormItem.vue';
import { MButton, MInput, MSelect, MTextarea } from '../../src/components';
import type { MFormModel, MFormRules } from '../../src/components/types';

class RegistryDraft {
  name = ''; code = ''; confirm = ''; category = 'illustration'; note = ''; contact = '';
}
const FormExample = defineComponent({
  components: { MForm, MFormItem, MButton, MInput, MSelect, MTextarea },
  props: { mode: { type: String, default: 'submit' }, disabled: Boolean, removable: Boolean, classModel: Boolean },
  setup(props) {
    const model = reactive(props.classModel ? new RegistryDraft() : { ...new RegistryDraft() });
    const saved = ref(0), submitted = ref(''), validatingSignal = ref('待核对'), visible = ref(true), outside = ref('表单外继续编辑的草稿');
    const rules: MFormRules = {
      name: [{ required: true, message: '请填写档案名称。' }, { min: 2, max: 30, message: '档案名称应为 2–30 个字符。' }],
      code: [{ required: true, message: '请填写档案编号。' }, { pattern: /^[a-z][a-z0-9-]{2,19}$/i, message: '编号使用字母开头的 3–20 位字母、数字或短横线。' }, {
        async validator(value, _model, signal) {
          validatingSignal.value = '正在校验编号';
          await new Promise<void>((resolve, reject) => {
            const timer = setTimeout(() => { signal.removeEventListener('abort', abort); resolve(); }, 400);
            const abort = () => { clearTimeout(timer); reject(new DOMException('已取消', 'AbortError')); };
            signal.addEventListener('abort', abort, { once: true });
          });
          validatingSignal.value = '编号核对结束';
          if (value === 'error') throw new Error();
          return value === 'taken' ? '此编号已被本页演练占用，请换一个。' : true;
        },
      }],
      confirm: [{ required: true, message: '请再次填写编号。' }, { validator: (value, values) => value === values.code || '两次填写的编号不一致。' }],
    };
    const submit = (value: MFormModel) => { saved.value++; submitted.value = String(value.name); };
    const reset = (value: MFormModel) => Object.assign(model, value);
    return { model, rules, saved, submitted, submit, reset, validatingSignal, visible, outside, options: [{ value: 'illustration', label: '机械插画' }, { value: 'motion', label: 'MG 编排' }] };
  },
  template: `<main class="kit-stack" style="max-width:760px"><p class="kit-mono kit-muted">FORM / 字段有据，落印有序</p><h1 style="font:500 32px/1.4 var(--ui-font-family-display)">先校准，再归档。</h1><p class="kit-muted">必填、格式、跨字段和可取消的异步校验共同守住提交边界。输入 taken 演练编号冲突，输入 error 演练校验暂不可用；校验只使用本页计时器。</p>
  <MForm :model="model" :rules="rules" :validate-on="mode" :disabled="disabled" label="档案登记表单" @submit="submit" @reset="reset" v-slot="{validating}">
    <MFormItem v-if="visible" name="name" label="档案名称" hint="2–30 个字符，中文输入结束后再校验。" v-slot="{field}"><MInput v-model="model.name" v-bind="field" autocomplete="off" /></MFormItem>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr));gap:24px;min-width:0">
      <MFormItem name="code" label="档案编号" v-slot="{field}"><MInput v-model="model.code" v-bind="field" autocomplete="off" /></MFormItem>
      <MFormItem name="confirm" label="确认编号" v-slot="{field}"><MInput v-model="model.confirm" v-bind="field" autocomplete="off" /></MFormItem>
    </div>
    <MFormItem name="category" label="作品分类" v-slot="{field}"><MSelect v-model="model.category" v-bind="field" :options="options" /></MFormItem>
    <MFormItem name="note" label="归档说明" v-slot="{field}"><MTextarea v-model="model.note" v-bind="field" :maxlength="160" /></MFormItem>
    <MFormItem name="contact" label="联系邮箱" hint="选填，填写时使用原生邮箱格式校验。" v-slot="{field}"><MInput v-model="model.contact" v-bind="field" type="email" /></MFormItem>
    <div class="kit-row"><MButton type="submit" :loading="validating">核对并登记</MButton><MButton type="reset" variant="secondary">恢复初始资料</MButton></div>
  </MForm><div v-if="removable" class="kit-stack"><MButton variant="secondary" @click="visible=!visible">切换名称字段</MButton><MInput v-model="outside" label="表单外的草稿" /></div><p role="status">已登记 {{ saved }} 次<span v-if="saved">：{{ submitted }}</span></p><p class="kit-muted" data-testid="validation-signal">{{validatingSignal}}</p></main>`,
});
const meta = { title: '基础组件/Form 表单', component: MForm, tags: ['autodocs'], args: { model: {} },
  parameters: { docs: { description: { component: 'MForm 使用真实 form 和受控 model；MFormItem 提供 field 插槽绑定给现有输入组件，共用其标签、错误和原生表单语义。支持必填/长度或数值边界/正则/跨字段与异步校验、原生 validity、错误摘要和焦点定位。validator 接收 AbortSignal，改值、重置、卸载或新校验会取消旧结果。reset 发出初始 model 快照，由父级决定是否接受。字段名为 model 的直接属性名；不隐式读写嵌套路径。' } } },
  render: args => defineComponent({ components: { FormExample }, setup: () => ({ args }), template: '<FormExample :disabled="args.disabled" />' }),
} satisfies Meta<typeof MForm>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const BlurValidation: Story = { render: () => defineComponent({ components: { FormExample }, template: '<FormExample mode="blur" />' }) };
export const ChangeValidation: Story = { render: () => defineComponent({ components: { FormExample }, template: '<FormExample mode="change" />' }) };
export const Disabled: Story = { args: { disabled: true } };
export const ReducedMotion: Story = { globals: { theme: 'dark', motion: 'reduced' } };
export const FieldLifecycle: Story = { render: () => defineComponent({ components: { FormExample }, template: '<FormExample removable class-model />' }) };
