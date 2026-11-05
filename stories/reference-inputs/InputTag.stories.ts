import { defineComponent, ref } from 'vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import MButton from '../../src/components/MButton.vue';
import MInputTag from '../../src/components/reference-inputs/MInputTag.vue';
import { referenceStory } from './storyHelpers';

const meta = {
  title: '表单组件/输入日期/InputTag 标签输入', component: MInputTag,
  args: { modelValue: ['墨迹'], label: '档案关键词', max: 4, required: true },
  render: args => referenceStory(MInputTag, args),
} satisfies Meta<typeof MInputTag>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Boundary: Story = { args: { modelValue: ['不可移除的完整长标签'.repeat(5)], readonly: true, max: 1 } };

export const OperationMotion: Story = {
  name: '增删与归位',
  render: () => defineComponent({
    components: { MButton, MInputTag },
    setup() {
      const values = ref(['墨迹', '刻印', '墨迹', '青玉']);
      const accepted = ref(true), mounted = ref(true), reduced = ref(false), requests = ref(0), submitted = ref('尚未提交');
      function update(next: string[]) { requests.value++; if (accepted.value) values.value = next; }
      function reverse() { values.value.reverse(); }
      function submit(event: SubmitEvent) { submitted.value = JSON.stringify(new FormData(event.target as HTMLFormElement).getAll('keyword')); }
      return { values, accepted, mounted, reduced, requests, submitted, update, reverse, submit };
    },
    template: `
      <main class="kit-stack" style="max-width:640px" :data-ui-motion="reduced ? 'reduced' : undefined">
        <h1 style="font:500 30px/1.5 var(--ui-font-family-display)">一笔入册，余项归位。</h1>
        <p>添加或移除关键词，反转顺序，观察条目的身份与表单值如何保留。</p>
        <form class="kit-stack" @submit.prevent="submit">
          <MInputTag v-if="mounted" :model-value="values" label="档案关键词" name="keyword" :max="8" allow-duplicates @update:model-value="update" />
          <div class="kit-row">
            <MButton type="submit">提交关键词</MButton>
            <MButton variant="secondary" @click="reverse">反转标签顺序</MButton>
            <MButton variant="ghost" @click="accepted = !accepted">{{ accepted ? '拒绝标签更新' : '接受标签更新' }}</MButton>
          </div>
        </form>
        <div class="kit-row">
          <MButton variant="ghost" @click="reduced = !reduced">切换标签减少动效</MButton>
          <MButton variant="ghost" @click="mounted = !mounted">切换标签实例</MButton>
        </div>
        <input class="ui-ri__control" aria-label="标签外草稿" value="在标签之外继续编辑">
        <output data-tag-motion-state>{{ JSON.stringify(values) }}</output>
        <output data-tag-motion-requests>请求 {{ requests }}</output>
        <output data-tag-motion-form>{{ submitted }}</output>
      </main>
    `,
  }),
};
