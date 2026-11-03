import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { computed, defineComponent, h, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue';
import type { PropType } from 'vue';
import { createInkSequence } from '../../src/motion';
import type { InkSequenceController, InkSequenceState } from '../../src/motion';
import './InkSequence.css';

const phaseNames = { gather: '蓄势 · 墨迹聚合', cut: '疾出 · 刀锋切面', assemble: '收锋 · 切面重组', complete: '归位 · 印记落定' };

const InkSequenceDemo = defineComponent({
  name: 'InkSequenceDemo',
  props: {
    reducedMotion: { type: [Boolean, String] as PropType<boolean | 'system'>, default: 'system' },
    amplitude: { type: Number, default: 1 },
    speed: { type: Number, default: 1 },
  },
  setup(props) {
    const canvas = ref<HTMLCanvasElement>();
    const state = shallowRef<InkSequenceState>({ time: 0, duration: 5, progress: 0, phase: 'gather', playing: false, reducedMotion: false, disposed: false });
    let controller: InkSequenceController | undefined;
    let mounted = false;
    const phase = computed(() => phaseNames[state.value.phase]);

    function create() {
      if (!canvas.value) return;
      const position = controller?.state.time ?? 0;
      const wasPlaying = controller?.state.playing ?? false;
      controller?.dispose();
      controller = createInkSequence(canvas.value, {
        amplitude: props.amplitude,
        speed: props.speed,
        reducedMotion: props.reducedMotion,
        onUpdate: next => { state.value = next; },
      });
      controller.seek(position);
      if (wasPlaying) controller.play();
    }

    onMounted(() => { mounted = true; create(); });
    onBeforeUnmount(() => { mounted = false; controller?.dispose(); });
    watch(() => [props.amplitude, props.speed, props.reducedMotion], () => { if (mounted) create(); });

    return () => h('section', { class: 'ink-demo', 'aria-label': '墨迹切面 GSAP 动画编排' }, [
      h('header', { class: 'ink-demo__heading' }, [
        h('p', { class: 'ink-demo__eyebrow' }, 'MOTION STUDY / 02'),
        h('div', { class: 'ink-demo__title' }, [h('h2', '墨起，锋至。'), h('span', { 'aria-hidden': 'true' }, '墨 / 锋 / 印')]),
        h('p', { class: 'ink-demo__intro' }, '干刷的飞白，切面的秩序。五秒，从蓄势到归位。'),
      ]),
      h('div', { class: 'ink-demo__stage' }, [
        h('canvas', {
          ref: canvas, class: 'ink-demo__canvas', role: 'img',
          'aria-label': '成组墨迹被朱砂刀锋切开，碎片汇合成一枚几何印记',
        }, '可通过下方按钮播放，或使用进度条逐帧查看的水墨构形动画。'),
        h('span', { class: 'ink-demo__stage-label', 'aria-hidden': 'true' }, 'INK → EDGE → SEAL'),
      ]),
      h('div', { class: 'ink-demo__controls' }, [
        h('div', { class: 'ink-demo__status' }, [
          h('span', { role: 'status', 'aria-live': 'polite' }, phase.value),
          h('span', { class: 'ink-demo__time', 'aria-hidden': 'true' }, `${state.value.time.toFixed(1)} / 5.0 s`),
        ]),
        h('input', {
          type: 'range', class: 'ink-demo__timeline', min: 0, max: 5, step: 0.01, value: state.value.time,
          'aria-label': '墨迹切面动画进度', 'aria-valuetext': `${state.value.time.toFixed(1)} 秒，共 5 秒；${phase.value}`,
          onInput: (event: Event) => {
            const next = Number((event.target as HTMLInputElement).value);
            controller?.pause();
            controller?.seek(next);
          },
        }),
        h('div', { class: 'ink-demo__buttons' }, [
          h('button', {
            type: 'button', class: 'ink-demo__button ink-demo__button--primary',
            onClick: () => state.value.playing ? controller?.pause() : controller?.play(),
          }, state.value.reducedMotion ? '查看落印状态' : state.value.playing ? '暂停动画' : '播放动画'),
          h('button', { type: 'button', class: 'ink-demo__button', onClick: () => controller?.replay() }, '重新播放'),
          h('button', { type: 'button', class: 'ink-demo__button', onClick: () => { controller?.pause(); controller?.seek(5); } }, '定位到落印'),
        ]),
        h('p', { class: 'ink-demo__note' }, state.value.reducedMotion
          ? '已启用减少动态效果：播放会直接显示落印状态，进度条仍可查看各阶段。'
          : '点击播放；可暂停、拖动进度，或聚焦进度条后使用方向键。'),
      ]),
    ]);
  },
});

const meta = {
  title: '动效/MG 墨迹切面',
  component: InkSequenceDemo,
  parameters: {
    layout: 'fullscreen',
    docs: { description: { component: '独立的原生 Canvas 与 GSAP 编排，以确定性干刷、断续切面和原创几何印记表现蓄势、疾出、收锋、归位。手动播放，支持定位、重播、主题更新与减少动态效果。' } },
  },
  argTypes: {
    reducedMotion: { control: 'inline-radio', options: ['system', true, false], description: '遵循系统或显式选择减少动态效果。' },
    amplitude: { control: { type: 'range', min: 0.6, max: 1.8, step: 0.1 }, description: '笔触分离与碎片的展开幅度。' },
    speed: { control: { type: 'range', min: 0.6, max: 1.6, step: 0.1 }, description: '播放倍速，进度条仍使用原始时间。' },
  },
  args: { reducedMotion: 'system', amplitude: 1, speed: 1 },
  render: (args, context) => ({
    setup: () => () => h(InkSequenceDemo, {
      ...args,
      reducedMotion: context.globals.motion === 'reduced' ? true : args.reducedMotion,
    }),
  }),
} satisfies Meta<typeof InkSequenceDemo>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const ReducedMotion: Story = { args: { reducedMotion: true } };
