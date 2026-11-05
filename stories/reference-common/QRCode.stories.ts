import { defineComponent, ref } from 'vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import MQRCode from '../../src/components/reference-common/MQRCode.vue';
import MButton from '../../src/components/MButton.vue';
import MInput from '../../src/components/MInput.vue';

const archiveUrl = 'https://github.com/MaLaNg116/malang-ui';
const meta = {
  title: '数据展示/QRCode 二维码', component: MQRCode, tags: ['autodocs'],
  args: { value: archiveUrl, size: 200 },
  parameters: { docs: { description: { component: '连贯墨块与定位图案采用轻切角，保留时序、校正图案和至少四模块静区。微型或密集码使用方格。支持 UTF-8、SVG 和 Canvas、L/M/Q/H 纠错与 SVG/PNG 导出，屏幕和导出共享码体几何。size 指外框宽度，bordered=false 提供净码。非有效状态用透底遮罩显示反馈。中心图标使用 H 级纠错并限制面积，尺寸为零时关闭图标。' } } },
} satisfies Meta<typeof MQRCode>;
export default meta; type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Editor: Story = {
  render: () => defineComponent({
    components: { MQRCode, MInput, MButton },
    setup() {
      const value = ref(archiveUrl), qr = ref<InstanceType<typeof MQRCode>>(), error = ref('');
      async function save(format: 'svg' | 'png') { try { error.value = ''; await qr.value?.download('墨浪二维码', format); } catch (reason) { error.value = String(reason); } }
      return { value, qr, error, save };
    },
    template: '<main class="kit-stack" style="max-width:520px"><MInput v-model="value" label="二维码内容" /><MQRCode ref="qr" :value="value" label="档案访问二维码" /><div class="kit-row"><MButton @click="save(\'png\')">下载PNG</MButton><MButton variant="secondary" @click="save(\'svg\')">下载SVG</MButton></div><p role="status">{{ error }}</p></main>',
  }),
};
export const States: Story = {
  render: () => defineComponent({
    components: { MQRCode, MButton },
    setup() {
      const status = ref<'active' | 'loading' | 'expired' | 'scanned'>('expired');
      return { status, archiveUrl };
    },
    template: `
      <main class="kit-stack">
        <div class="kit-row">
          <MButton variant="secondary" @click="status = 'loading'">标记加载</MButton>
          <MButton variant="secondary" @click="status = 'scanned'">标记已扫描</MButton>
          <MButton variant="secondary" @click="status = 'expired'">标记过期</MButton>
        </div>
        <div class="kit-row">
          <MQRCode :value="archiveUrl" status="loading" />
          <MQRCode data-testid="qr-status-preview" :value="archiveUrl" :status="status" label="待刷新档案二维码" @refresh="status = 'active'" />
          <MQRCode :value="archiveUrl" status="scanned" />
          <MQRCode value="" />
        </div>
      </main>
    `,
  }),
};
export const Canvas: Story = { args: { type: 'canvas', value: '墨浪 / 功夫朋克 🖋️', errorLevel: 'H' } };
export const Invalid: Story = { args: { value: '' } };

export const Materials: Story = {
  name: '四种材质',
  render: () => defineComponent({
    components: { MQRCode },
    setup() {
      const materials = [
        { name: '宣纸', theme: 'light', palette: 'paper' },
        { name: '浓墨', theme: 'dark', palette: 'paper' },
        { name: '青瓷', theme: 'light', palette: 'celadon' },
        { name: '绢素', theme: 'light', palette: 'gilt' },
      ];
      return { materials, archiveUrl };
    },
    template: `
      <main class="kit-stack" style="max-width:1000px">
        <h2>码印档案</h2>
        <p class="kit-muted">四种外框共享同一枚可扫码面，扫码打开项目仓库。</p>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,228px),1fr));gap:14px">
          <section v-for="material in materials" :key="material.name" :data-ui-theme="material.theme" :data-ui-palette="material.palette" class="kit-panel" style="display:grid;gap:12px;padding:12px;color:var(--ui-color-text)">
            <h3>{{ material.name }}</h3>
            <MQRCode :value="archiveUrl" :label="material.name + '码印'" />
          </section>
        </div>
      </main>
    `,
  }),
};

export const Compact: Story = {
  name: '微型码印与净码',
  render: () => defineComponent({
    components: { MQRCode },
    setup() {
      const expired = ref(true);
      return { expired };
    },
    template: `
      <main class="kit-stack">
        <h2>80 像素码印</h2>
        <div class="kit-row" style="align-items:flex-start">
          <div><p>码印</p><MQRCode value="ML-08" :size="80" :quiet-zone="0" label="微型码印" /></div>
          <div><p>净码</p><MQRCode value="ML-08" :size="80" :quiet-zone="0" :bordered="false" label="微型净码" /></div>
          <div><p>状态</p><MQRCode value="ML-08" :size="80" :status="expired ? 'expired' : 'active'" label="恢复后的微型码印" @refresh="expired = false" /></div>
          <div style="width:80px"><p>限宽</p><MQRCode value="ML-08" label="限宽码印" /></div>
        </div>
      </main>
    `,
  }),
};

export const IconExport: Story = {
  name: '中心印记与导出',
  render: () => defineComponent({
    components: { MQRCode, MButton },
    setup() {
      const qr = ref<InstanceType<typeof MQRCode>>();
      const seal = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path fill="#a13c31" d="M0 0h26l6 6v26H0z"/><path fill="none" stroke="#fffdf7" stroke-width="2" d="M7 7h7v8H7v10h7M18 7h7v13h-7v5M7 11h7"/></svg>';
      const icon = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(seal)}`;
      const preview = ref('');
      const error = ref('');
      async function exportCode(format: 'svg' | 'png') {
        if (!qr.value) return;
        try {
          error.value = '';
          preview.value = await qr.value.toDataURL(format);
        } catch (reason) {
          error.value = reason instanceof Error ? reason.message : String(reason);
        }
      }
      return { qr, archiveUrl, icon, preview, error, exportCode };
    },
    template: `
      <main class="kit-stack" style="max-width:520px">
        <h2>带印码面</h2>
        <MQRCode ref="qr" type="canvas" :value="archiveUrl" :icon="icon" :icon-size="28" label="朱砂印记二维码" />
        <div class="kit-row">
          <MButton @click="exportCode('png')">导出 PNG 净码</MButton>
          <MButton variant="secondary" @click="exportCode('svg')">导出 SVG 净码</MButton>
        </div>
        <img v-if="preview" :src="preview" alt="带印净码预览" style="width:200px;max-width:100%;image-rendering:pixelated">
        <p v-if="error" role="alert">{{ error }}</p>
      </main>
    `,
  }),
};

export const InkSamples: Story = {
  name: '净码造型与纠错级别',
  render: () => defineComponent({
    components: { MQRCode },
    setup() {
      const samples = [
        { label: '英文 · L', value: 'Ink archive / 014', level: 'L', type: 'svg' },
        { label: '中文 · M', value: '墨浪工坊 · 经卷校对', level: 'M', type: 'canvas' },
        { label: '网址 · Q', value: archiveUrl, level: 'Q', type: 'svg' },
        { label: '混合文本 · H', value: ['墨浪', ' / Ink archive'], level: 'H', type: 'canvas' },
      ] as const;
      return { samples };
    },
    template: `
      <main class="kit-stack" style="max-width:940px">
        <h2>墨块与切面</h2>
        <p class="kit-muted">轻切角落在码点本身，净码也保留同样的笔形。</p>
        <div class="kit-row" style="align-items:flex-start">
          <section v-for="sample in samples" :key="sample.level">
            <h3>{{ sample.label }}</h3>
            <MQRCode :value="sample.value" :type="sample.type" :error-level="sample.level" :label="sample.label" :bordered="false" />
          </section>
        </div>
      </main>
    `,
  }),
};

export const DenseCode: Story = {
  name: '长文本与整格码面',
  render: () => defineComponent({
    components: { MQRCode, MButton },
    setup() {
      const qr = ref<InstanceType<typeof MQRCode>>();
      const value = '墨浪档案'.repeat(34) + ' / QR014';
      const preview = ref('');
      const error = ref('');
      async function exportSvg() {
        if (!qr.value) return;
        try {
          preview.value = await qr.value.toDataURL('svg');
        } catch (reason) {
          error.value = reason instanceof Error ? reason.message : String(reason);
        }
      }
      return { qr, value, preview, error, exportSvg };
    },
    template: `
      <main class="kit-stack" style="max-width:328px">
        <h2>长文本码面</h2>
        <p class="kit-muted">窄屏仍保留完整静区，SVG 导出保持原尺寸。</p>
        <MQRCode ref="qr" :value="value" :size="386" label="长文本二维码" />
        <MButton @click="exportSvg">生成原尺寸 SVG</MButton>
        <img v-if="preview" :src="preview" alt="长文本 SVG 预览" style="width:100%;max-width:386px">
        <p v-if="error" role="alert">{{ error }}</p>
      </main>
    `,
  }),
};
