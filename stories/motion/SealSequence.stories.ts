import { computed, defineComponent, h, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue';
import type { PropType } from 'vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { MButton, MSlider } from '../../src';
import { createSealSequence } from '../../src/motion';
import type { SealSequenceController, SealSequenceState } from '../../src/motion';
import './SealSequence.css';

const phaseNames = { gather: '蓄印 · 滑轨聚合', align: '合轨 · 印面校准', stamp: '落印 · 朱砂成形', settle: '回响 · 成章归位' };
const SealSequenceDemo = defineComponent({
  name: 'SealSequenceDemo',
  props: {
    label: { type: String, default: '成功落印编排' },
    reducedMotion: { type: [Boolean, String] as PropType<boolean | 'system'>, default: 'system' },
    amplitude: { type: Number, default: 1 }, speed: { type: Number, default: 1 }, initialTime: { type: Number, default: 0 },
  },
  setup(props) {
    const canvas = ref<HTMLCanvasElement>();
    const state = shallowRef<SealSequenceState>({ time: 0, duration: 3.6, progress: 0, phase: 'gather', playing: false, reducedMotion: false, disposed: false });
    let controller: SealSequenceController | undefined; let mounted = false;
    const phase = computed(() => phaseNames[state.value.phase]);
    function create() {
      if (!canvas.value) return;
      const previous = controller?.state; const position = previous?.time ?? props.initialTime;
      controller?.dispose();
      controller = createSealSequence(canvas.value, { reducedMotion: props.reducedMotion, amplitude: props.amplitude, speed: props.speed, onUpdate: next => { state.value = next; } });
      if (!controller.state.reducedMotion || previous?.reducedMotion || (!previous && props.initialTime > 0)) controller.seek(position);
      if (previous?.playing) controller.play();
    }
    onMounted(() => { mounted = true; create(); });
    onBeforeUnmount(() => { mounted = false; controller?.dispose(); });
    watch(() => [props.reducedMotion, props.amplitude, props.speed], () => { if (mounted) create(); });
    watch(() => props.initialTime, time => { controller?.pause(); controller?.seek(time); });
    return () => h('section', { class: 'seal-demo', role: 'region', 'aria-label': props.label }, [
      h('header', { class: 'seal-demo__heading' }, [
        h('p', { class: 'seal-demo__eyebrow' }, 'MALANG / MOTION STUDY'),
        h('div', { class: 'seal-demo__title' }, [h('h2', '机关合拢，一印成章。'), h('span', { 'aria-hidden': 'true' }, '轨 / 印 / 响')]),
        h('p', { class: 'seal-demo__intro' }, '四向滑轨校准，朱砂印面落定。3.6 秒，给完成一个有分量的落点。'),
      ]),
      h('div', { class: 'seal-demo__stage' }, [
        h('canvas', { ref: canvas, class: 'seal-demo__canvas', role: 'img', 'aria-label': '四向机械滑轨合拢后，朱砂成章印记落定，墨纹回响逐渐归位' }, '可以播放、暂停、拖动进度或静态查看的机械落印动画。'),
        h('span', { class: 'seal-demo__stage-label', 'aria-hidden': 'true' }, 'GATHER / ALIGN / STAMP / SETTLE'),
      ]),
      h('div', { class: 'seal-demo__controls' }, [
        h('div', { class: 'seal-demo__status' }, [h('p', { class: 'seal-demo__phase' }, phase.value), h('span', { class: 'seal-demo__time', 'aria-hidden': 'true' }, `${state.value.time.toFixed(2)} / 3.60 s`)]),
        h('div', { class: 'seal-demo__timeline' }, [h(MSlider, {
          modelValue: state.value.time, label: '落印动画进度', min: 0, max: 3.6, step: 0.01, showValue: false,
          'aria-valuetext': `${state.value.time.toFixed(2)} 秒，共 3.6 秒；${phase.value}`,
          'onUpdate:modelValue': (value: number) => { controller?.pause(); controller?.seek(value); },
        })]),
        h('div', { class: 'seal-demo__buttons' }, [
          h(MButton, { onClick: () => state.value.playing ? controller?.pause() : controller?.play() }, () => state.value.reducedMotion ? '查看静态落印' : state.value.playing ? '暂停落印' : '播放落印'),
          h(MButton, { variant: 'secondary', onClick: () => controller?.replay() }, () => '重播落印'),
          h(MButton, { variant: 'ghost', onClick: () => { controller?.pause(); controller?.seek(3.6); } }, () => '定位成章'),
        ]),
        h('p', { class: 'seal-demo__note' }, state.value.reducedMotion ? '减少动态效果已启用：直接显示成章印面，进度条仍可静态检查每个阶段。' : '手动播放，支持暂停、定位与重播；进度条可用方向键逐帧查看。'),
      ]),
    ]);
  },
});
const meta = {
  title: '动效/MG 成功落印', component: SealSequenceDemo,
  parameters: { layout: 'fullscreen', docs: { description: { component: '独立 Canvas 与 GSAP 成功反馈编排。四向机械滑轨、朱砂刻印与确定性墨纹构成蓄印、合轨、落印、回响四阶段；无需外部图片。实例管理自己的时间线、DPR、主题、字体与页面生命周期，销毁不会影响其他实例。' } } },
  args: { reducedMotion: 'system', amplitude: 1, speed: 1, initialTime: 0 },
  argTypes: {
    reducedMotion: { control: 'inline-radio', options: ['system', true, false] },
    amplitude: { control: { type: 'range', min: 0.6, max: 1.8, step: 0.1 } },
    speed: { control: { type: 'range', min: 0.6, max: 1.6, step: 0.1 } },
    initialTime: { control: { type: 'range', min: 0, max: 3.6, step: 0.01 } },
  },
  render: (args, context) => ({ setup: () => () => h(SealSequenceDemo, { ...args, reducedMotion: context.globals.motion === 'reduced' ? true : args.reducedMotion }) }),
} satisfies Meta<typeof SealSequenceDemo>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const ReducedMotion: Story = { name: '静态成章', args: { reducedMotion: true } };
export const ImpressionDetail: Story = { name: '落印瞬间', args: { initialTime: 2.12 } };
export const FinalImpression: Story = { name: '印面细节', args: { initialTime: 3.6 } };
export const TwoInstances: Story = {
  name: '双实例与卸载',
  render: (args, context) => defineComponent({
    components: { MButton },
    setup() {
      const first = ref(true);
      return () => h('main', { class: 'seal-pair' }, [
        h('div', { class: 'seal-pair__tools' }, [h(MButton, { variant: 'secondary', onClick: () => { first.value = !first.value; } }, () => first.value ? '移除第一枚印记' : '恢复第一枚印记'), h('p', '两枚印记分别拥有时间线；移除其中一枚，另一枚仍可继续。')]),
        h('div', { class: 'seal-pair__grid' }, [
          first.value ? h(SealSequenceDemo, { ...args, key: 'first', label: '第一枚印记', reducedMotion: context.globals.motion === 'reduced' ? true : args.reducedMotion }) : h('div', { class: 'seal-pair__empty' }, '第一枚印记已移除。'),
          h(SealSequenceDemo, { ...args, key: 'second', label: '第二枚印记', reducedMotion: context.globals.motion === 'reduced' ? true : args.reducedMotion }),
        ]),
      ]);
    },
  }),
};
