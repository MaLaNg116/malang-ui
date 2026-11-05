import { defineComponent, ref } from 'vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import MApp from '../../src/components/reference-common/MApp.vue';
import MQRCode from '../../src/components/reference-common/MQRCode.vue';
import MButton from '../../src/components/MButton.vue';
import { useMApp, type MFeedbackHandle } from '../../src/composables/useApp';

const FeedbackControls = defineComponent({
  components: { MButton },
  setup() {
    const app = useMApp();
    const started = ref(false);
    let previous: MFeedbackHandle | undefined;
    let current: MFeedbackHandle | undefined;

    function show(content: string) {
      return app.message({ key: 'archive-review', content, duration: 0 });
    }
    function start() {
      app.destroyAll();
      previous = current = show('正在校对档案');
      started.value = true;
    }
    function reuse() { current = show('同键校对已继续'); }
    function reopen() {
      current?.close();
      current = show('关闭后的新任务');
    }
    function reset() {
      previous = current;
      app.destroyAll();
      current = show('清空后的新任务');
    }
    function updatePrevious() { previous?.update({ content: '原句柄更新了提示' }); }
    function closePrevious() { previous?.close(); }
    function updateCurrent() { current?.update({ content: '当前任务已完成', type: 'success' }); }

    return { started, start, reuse, reopen, reset, updatePrevious, closePrevious, updateCurrent };
  },
  template: `
    <main class="kit-stack" style="max-width:680px;padding-block-start:48px">
      <h2>同键提示的生命周期</h2>
      <p class="kit-muted">同一条提示存续期间可以从多个句柄更新。关闭后重用键名会创建一条新提示。</p>
      <div class="kit-row">
        <MButton @click="start">开始校对</MButton>
        <MButton :disabled="!started" variant="secondary" @click="reuse">继续同键任务</MButton>
        <MButton :disabled="!started" variant="secondary" @click="reopen">关闭后重开</MButton>
        <MButton :disabled="!started" variant="secondary" @click="reset">清空后重开</MButton>
      </div>
      <div class="kit-row">
        <MButton :disabled="!started" variant="ghost" @click="updatePrevious">从原句柄更新</MButton>
        <MButton :disabled="!started" variant="ghost" @click="closePrevious">从原句柄关闭</MButton>
        <MButton :disabled="!started" variant="ghost" @click="updateCurrent">完成当前任务</MButton>
      </div>
    </main>
  `,
});

const meta = {
  title: '配置/反馈生命周期',
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const KeyedFeedback: Story = {
  name: '同键更新与重开',
  render: () => ({
    components: { MApp, FeedbackControls },
    template: '<MApp><FeedbackControls /></MApp>',
  }),
};

export const SuppressedIcon: Story = {
  name: '关闭二维码图标',
  render: () => defineComponent({
    components: { MQRCode, MButton },
    setup() {
      const qr = ref<InstanceType<typeof MQRCode>>();
      const value = '墨浪 / 档案交接';
      const icon = '/missing-feedback-lifecycle-icon.png';
      const png = ref('');
      const error = ref('');

      function showError(reason: unknown) {
        error.value = reason instanceof Error ? reason.message : String(reason);
      }
      async function exportPng() {
        if (!qr.value) return;
        try {
          png.value = await qr.value.toDataURL('png');
        } catch (reason) {
          showError(reason);
        }
      }

      return { qr, value, icon, png, error, showError, exportPng };
    },
    template: `
      <main class="kit-stack" style="max-width:520px">
        <h2>档案交接二维码</h2>
        <p class="kit-muted">保留图标地址，将图标尺寸设为零即可隐藏图标。</p>
        <MQRCode ref="qr" type="canvas" :value="value" :icon="icon" :icon-size="0" label="档案交接二维码" @error="showError" />
        <MButton @click="exportPng">生成 PNG</MButton>
        <img v-if="png" :src="png" alt="PNG 导出预览" style="width:200px;max-width:100%;image-rendering:pixelated">
        <p v-if="error" role="alert">{{ error }}</p>
      </main>
    `,
  }),
};
