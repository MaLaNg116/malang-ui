import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { defineComponent, ref, useId } from 'vue';
import UiCard from '../../src/components/UiCard.vue';
import UiButton from '../../src/components/UiButton.vue';
import UiInput from '../../src/components/UiInput.vue';

const meta = {
  title: '基础组件/Card 卡片',
  component: UiCard,
  tags: ['autodocs'],
  args: { as: 'article', title: '观山 · 设计档案', description: '让内容有层次，让操作有自己的位置。', headingTag: 'h3' },
  argTypes: {
    as: { control: 'inline-radio', options: ['article', 'section', 'div'] },
    headingTag: { control: 'inline-radio', options: ['h2', 'h3', 'h4'] },
  },
  parameters: {
    docs: { description: { component: '静态内容容器，提供 header、默认内容和 footer 插槽。卡片本身不加入 Tab 顺序，也不增加点击行为。默认标题可选择 h2/h3/h4；自定义 header 完全接管标题与说明，可自行提供 aria-labelledby。主题与密度通过已有 Token 继承。' } },
  },
  render: args => defineComponent({
    components: { UiCard },
    setup: () => ({ args }),
    template: `<UiCard v-bind="args" style="width:min(100%,580px)"><div class="kit-stack" style="gap:12px"><p>一份档案，可以容纳简短说明、表单或项目内容。</p><p class="kit-muted">框线与定位角给内容以边界，留白保持阅读的节奏。</p></div></UiCard>`,
  }),
} satisfies Meta<typeof UiCard>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};

export const WithActions: Story = {
  name: '自定义标题与独立操作',
  render: () => defineComponent({
    components: { UiCard, UiButton, UiInput },
    setup() {
      const identity = useId();
      const heading = `card-custom-${identity}`;
      const details = `card-details-${identity}`;
      const name = ref('观山设计室');
      const feedback = ref('保存只在当前预览中生效。');
      return { heading, details, name, feedback };
    },
    template: `<UiCard as="section" title="此默认标题由插槽替换" :aria-labelledby="heading" style="width:min(100%,580px)">
      <template #header><p class="kit-mono" style="font-size:10px;letter-spacing:1px;color:var(--ui-color-accent);margin-bottom:12px">ARCHIVE / 001</p><h2 :id="heading" style="font:500 28px/1.4 var(--ui-font-family-display)">一份正在生长的档案</h2></template>
      <div class="kit-stack" style="gap:18px"><UiInput v-model="name" label="档案名称" /><p :id="details" class="kit-muted">卡片承载内容；输入框、按钮和链接各自保留独立的键盘操作。</p><p role="status" class="kit-muted">{{ feedback }}</p></div>
      <template #footer><UiButton @click="feedback = '「' + (name.trim() || '未命名档案') + '」已在当前预览中保存。'">保存档案</UiButton><a :href="'#' + details" style="font-size:12px">查看说明</a></template>
    </UiCard>`,
  }),
};

export const ContentOnly: Story = {
  name: '仅内容',
  args: { title: undefined, description: undefined },
};

export const EmptySlots: Story = {
  name: '空插槽不占位',
  render: () => defineComponent({
    components: { UiCard },
    setup: () => ({ visible: false }),
    template: `<UiCard title="由空 header 插槽接管" style="width:min(100%,580px)"><template #header><span v-if="visible">条件标题</span></template><p>头部与尾部为空时，不会留下额外的分隔线或空白。</p><template #footer>{{ '' }}</template></UiCard>`,
  }),
};

export const LongContent: Story = {
  name: '长内容与标题层级',
  args: { as: 'section', headingTag: 'h2', title: 'ArchiveWithoutArtificialTruncationOrFixedHeight'.repeat(3), description: '长内容自然换行，卡片不负责截断或固定高度。' },
  render: args => defineComponent({
    components: { UiCard },
    setup: () => ({ args, reference: 'https://example.test/archives/' + 'continuous-reference-'.repeat(18) }),
    template: `<UiCard v-bind="args" style="width:min(100%,580px)"><div class="kit-stack" style="gap:16px"><p>信息可以安静地展开。调整预览宽度，观察长标题与连续字符如何在同一个容器内换行。</p><code>{{ reference }}</code><p class="kit-muted">间距随舒适 / 紧凑密度调整，内部内容仍由使用者组织。</p></div></UiCard>`,
  }),
};
