import { defineComponent, ref, watch } from 'vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import MSlider from '../../src/components/MSlider.vue';
import MButton from '../../src/components/MButton.vue';

const meta = {
  title: '二级组件/Slider 刻度滑轨', component: MSlider, tags: ['autodocs'],
  args: { modelValue: 35, label: '机关行程', min: 0, max: 100, step: 5, disabled: false, showValue: true, hint: '方向键移动一格，Home与End到达刻度两端。' },
  parameters: { docs: { description: { component: '保留原生range的键盘、触屏与表单行为，以朱砂指示、菱形拨块和机械分节表达行程。有效显示值以min为锚点对齐step，并夹取到范围；范围变化只改变显示，不主动改写父模型。拖动直接响应，不对数值叠加追赶动画；父级拒绝更新时恢复受控值。' } } },
  render: args => defineComponent({
    components: { MSlider },
    setup() { const value = ref(args.modelValue); watch(() => args.modelValue, next => { value.value = next; }); return { args, value }; },
    template: '<div class="kit-stack" style="width:min(100%,640px)"><MSlider v-bind="args" v-model="value" /><p class="kit-muted">父模型：{{ value }}</p></div>',
  }),
} satisfies Meta<typeof MSlider>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Fractional: Story = { name: '小数倍率', args: { modelValue: 1.2, label: '节奏倍率', min: .6, max: 1.8, step: .1 } };
export const Disabled: Story = { args: { disabled: true } };
export const Error: Story = { args: { error: '当前档位无法用于此项任务。' } };
export const LongLabel: Story = { name: '长标题与窄屏', args: { label: 'ArchiveParameterWithoutArtificialClipping'.repeat(3), hint: '长标题自然换行，滑轨宽度保持在当前内容区内。' } };
export const Controlled: Story = {
  name: '受控更新',
  render: () => defineComponent({
    components: { MSlider, MButton },
    setup() { const value = ref(30), requests = ref(0), accepts = ref(false); function update(next: number) { requests.value++; if (accepts.value) value.value = next; } return { value, requests, accepts, update }; },
    template: '<div class="kit-stack" style="width:min(100%,640px)"><MSlider :model-value="value" label="受控滑轨" :min="0" :max="100" :step="5" @update:model-value="update" /><p role="status">更新请求：{{ requests }} 次 · 父模型：{{ value }}</p><div><MButton variant="secondary" @click="accepts = !accepts">{{ accepts ? \'拒绝更新\' : \'接受更新\' }}</MButton></div></div>',
  }),
};
export const ChangingBounds: Story = {
  name: '范围变化不改写模型',
  render: () => defineComponent({
    components: { MSlider, MButton }, setup: () => ({ value: ref(80), maximum: ref(40), requests: ref(0) }),
    template: '<div class="kit-stack" style="width:min(100%,640px)"><MSlider v-model="value" label="动态范围" :min="0" :max="maximum" :step="5" @update:model-value="requests++" /><p role="status">父模型：{{ value }} · 更新请求：{{ requests }} 次</p><div><MButton variant="secondary" @click="maximum = maximum === 40 ? 100 : 40">切换范围</MButton></div></div>',
  }),
};
