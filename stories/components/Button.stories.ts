import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { defineComponent, ref } from 'vue';
import { MButton } from '../../src/components';

const meta = {
  title: '基础组件/Button 按钮',
  component: MButton,
  tags: ['autodocs'],
  args: { variant: 'primary', size: 'md', disabled: false, loading: false },
  argTypes: {
    variant: { control: 'select', options: ['primary', 'secondary', 'ghost'] },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    type: { control: 'select', options: ['button', 'submit', 'reset'] },
  },
  render: (args) => defineComponent({
    components: { MButton },
    setup: () => ({ args }),
    template: '<MButton v-bind="args">创建空间 ↗</MButton>',
  }),
} satisfies Meta<typeof MButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Loading: Story = { args: { loading: true } };
export const Disabled: Story = { args: { disabled: true } };
export const Secondary: Story = { args: { variant: 'secondary' } };
export const Ghost: Story = { args: { variant: 'ghost' } };

export const VariantsAndSizes: Story = {
  render: () => defineComponent({
    components: { MButton },
    setup: () => ({ variants: ['primary', 'secondary', 'ghost'], sizes: ['sm', 'md', 'lg'] }),
    template: `<div style="display:grid;gap:24px">
      <div v-for="size in sizes" :key="size" style="display:flex;flex-wrap:wrap;align-items:center;gap:12px">
        <MButton v-for="variant in variants" :key="variant" :variant="variant" :size="size">{{ variant }} ↗</MButton>
      </div>
    </div>`,
  }),
};

export const AsyncAction: Story = {
  render: () => defineComponent({
    components: { MButton },
    setup() {
      const loading = ref(false);
      const saved = ref(false);
      async function save() {
        loading.value = true;
        saved.value = false;
        try {
          await new Promise((resolve) => setTimeout(resolve, 800));
          saved.value = true;
        } finally {
          loading.value = false;
        }
      }
      return { loading, saved, save };
    },
    template: `<div style="display:grid;gap:12px;justify-items:start">
      <MButton :loading="loading" @click="save">{{ loading ? '正在保存…' : '保存草稿 ↗' }}</MButton>
      <span role="status" style="font-size:12px;color:var(--ui-color-success)">{{ saved ? '草稿已保存' : '' }}</span>
    </div>`,
  }),
};
