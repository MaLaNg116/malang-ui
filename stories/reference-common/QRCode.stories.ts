import { defineComponent, ref } from 'vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import MQRCode from '../../src/components/reference-common/MQRCode.vue';
import { MButton, MInput, MSelect } from '../../src/components';
const meta = {
  title: '数据展示/QRCode 二维码', component: MQRCode, tags: ['autodocs'],
  args: { value: 'https://github.com/MaLaNg116/malang-ui', size: 200 },
  parameters: { docs: { description: { component: 'UTF-8真实二维码，SVG/Canvas、L/M/Q/H纠错、图标、刷新状态、SVG/PNG导出。保留至少4模块静区，图标自动使用H级并限制中心面积。码体保持高对比浅底，主题风格留在外围；超长或低对比输入显示错误。' } } },
} satisfies Meta<typeof MQRCode>;
export default meta; type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Editor: Story = {
  render: () => defineComponent({
    components: { MQRCode, MInput, MButton, MSelect },
    setup() {
      const value = ref('https://github.com/MaLaNg116/malang-ui'), qr = ref<InstanceType<typeof MQRCode>>(), error = ref('');
      async function save(format: 'svg' | 'png') { try { error.value = ''; await qr.value?.download('墨浪二维码', format); } catch (reason) { error.value = String(reason); } }
      return { value, qr, error, save };
    },
    template: '<main class="kit-stack" style="max-width:520px"><MInput v-model="value" label="二维码内容" /><MQRCode ref="qr" :value="value" label="档案访问二维码" /><div class="kit-row"><MButton @click="save(\'png\')">下载PNG</MButton><MButton variant="secondary" @click="save(\'svg\')">下载SVG</MButton></div><p role="status">{{ error }}</p></main>',
  }),
};
export const States: Story = {
  render: () => defineComponent({
    components: { MQRCode }, setup() { const expired = ref(true); return { expired }; },
    template: '<div class="kit-row"><MQRCode value="loading" status="loading" /><MQRCode value="expired" :status="expired ? \'expired\' : \'active\'" @refresh="expired = false" /><MQRCode value="scanned" status="scanned" /></div>',
  }),
};
export const Canvas: Story = { args: { type: 'canvas', value: '墨浪 / 功夫朋克 🖋️', errorLevel: 'H' } };
export const Invalid: Story = { args: { value: '' } };
