import { defineComponent, ref } from 'vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import MButton from '../../src/components/MButton.vue';
import MTransfer from '../../src/components/reference-inputs/MTransfer.vue';
import { referenceStory } from './storyHelpers';

const initialOptions = [
  { value: 'ink', label: '墨迹' }, { value: 'seal', label: '刻印' },
  { value: 'gold', label: '鎏金' }, { value: 'locked', label: '封存资料', disabled: true },
];
const meta = {
  title: '表单组件/输入日期/Transfer 穿梭选择', component: MTransfer,
  args: { modelValue: ['ink'], options: initialOptions, label: '归档项目', required: true },
  render: args => referenceStory(MTransfer, args),
} satisfies Meta<typeof MTransfer>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Boundary: Story = { args: { modelValue: ['locked'], titles: ['待选择', '已归档'] } };

export const OperationMotion: Story = {
  name: '调卷与筛选',
  render: () => defineComponent({
    components: { MButton, MTransfer },
    setup() {
      const options = [...initialOptions, ...Array.from({ length: 12 }, (_, index) => ({ value: `archive-${index + 1}`, label: `备用卷宗 ${index + 1}` }))];
      const values = ref(['ink']), reduced = ref(false), mounted = ref(true), submitted = ref('尚未提交');
      function submit(event: SubmitEvent) { submitted.value = JSON.stringify(new FormData(event.target as HTMLFormElement).getAll('archive')); }
      return { options, values, reduced, mounted, submitted, submit };
    },
    template: `
      <main class="kit-stack" style="max-width:680px" :data-ui-motion="reduced ? 'reduced' : undefined">
        <h1 style="font:500 30px/1.5 var(--ui-font-family-display)">卷册换轨，择而归档。</h1>
        <p>勾选项目后往返调卷，或筛选待选清单。大批量变化直接落位。</p>
        <form class="kit-stack" @submit.prevent="submit">
          <MTransfer v-if="mounted" v-model="values" :options="options" label="归档项目" name="archive" />
          <MButton type="submit">提交归档项目</MButton>
        </form>
        <div class="kit-row">
          <MButton variant="ghost" @click="reduced = !reduced">切换穿梭减少动效</MButton>
          <MButton variant="ghost" @click="mounted = !mounted">切换穿梭实例</MButton>
        </div>
        <output data-transfer-motion-state>{{ JSON.stringify(values) }}</output>
        <output data-transfer-motion-form>{{ submitted }}</output>
      </main>
    `,
  }),
};
