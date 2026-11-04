import { computed, defineComponent, h, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue';
import type { PropType } from 'vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { MButton, MSlider } from '../../src';
import { createWaitingSequence } from '../../src/motion/waitingSequence';
import type { WaitingSequenceColors, WaitingSequenceController, WaitingSequenceState } from '../../src/motion/waitingSequence';
import './WaitingSequence.css';

const phaseNames = { outbound: '启轨 · 送出待询', exchange: '换向 · 双轨交接', return: '回流 · 保持处理中', rejoin: '回接 · 接续待命' };
const WaitingSequenceDemo = defineComponent({
  name: 'WaitingSequenceDemo',
  props: {
    label: { type: String, default: '双轨等待编排' },
    reducedMotion: { type: [Boolean, String] as PropType<boolean | 'system'>, default: 'system' },
    amplitude: { type: Number, default: 1 }, speed: { type: Number, default: 1 }, loop: { type: Boolean, default: true },
    initialTime: { type: Number, default: 0 }, colors: { type: Object as PropType<Partial<WaitingSequenceColors>>, default: undefined },
  },
  setup(props) {
    const canvas = ref<HTMLCanvasElement>();
    const state = shallowRef<WaitingSequenceState>({ time: 0, duration: 2.8, progress: 0, cycle: 0, phase: 'outbound', playing: false, reducedMotion: false, disposed: false });
    let controller: WaitingSequenceController | undefined; let mounted = false;
    const phase = computed(() => phaseNames[state.value.phase]);
    function create() {
      if (!canvas.value) return;
      const previous = controller?.state;
      controller?.dispose();
      controller = createWaitingSequence(canvas.value, { reducedMotion: props.reducedMotion, amplitude: props.amplitude, speed: props.speed, loop: props.loop, colors: props.colors, onUpdate: next => { state.value = next; } });
      if (previous && !controller.state.reducedMotion) controller.seek(previous.time);
      else if (!previous && props.initialTime > 0) controller.seek(props.initialTime);
      if (previous?.playing && !controller.state.reducedMotion) controller.play();
    }
    onMounted(() => { mounted = true; create(); });
    onBeforeUnmount(() => { mounted = false; controller?.dispose(); });
    watch(() => [props.reducedMotion, props.amplitude, props.speed, props.loop, props.colors], () => { if (mounted) create(); });
    watch(() => props.initialTime, time => { controller?.seek(time); });
    return () => h('section', { class: 'waiting-demo', role: 'region', 'aria-label': props.label }, [
      h('header', { class: 'waiting-demo__heading' }, [
        h('p', { class: 'waiting-demo__eyebrow' }, 'MALANG / MOTION STUDY · 02'),
        h('div', { class: 'waiting-demo__title' }, [h('h2', '双轨回流，静候回应。'), h('span', { class: 'waiting-demo__badge' }, '处理中')]),
        h('p', { class: 'waiting-demo__intro' }, '朱砂送出，青玉回接。2.8 秒的循环位置用于检视动画，业务结果由应用确认。'),
      ]),
      h('div', { class: 'waiting-demo__stage' }, [
        h('canvas', { ref: canvas, class: 'waiting-demo__canvas', role: 'img', 'aria-label': '朱砂与青玉滑块沿双重切角轨道往复回流，中央保持处理中标记' }, '可以暂停、静态定位与重播的双轨处理中动画。'),
        h('span', { class: 'waiting-demo__stage-label', 'aria-hidden': 'true' }, 'OUTBOUND / EXCHANGE / RETURN / REJOIN'),
      ]),
      h('div', { class: 'waiting-demo__controls' }, [
        h('div', { class: 'waiting-demo__status' }, [h('p', { class: 'waiting-demo__phase' }, phase.value), h('span', { class: 'waiting-demo__time', 'aria-hidden': 'true' }, `${state.value.time.toFixed(2)} / 2.80 s`)]),
        h('p', { class: 'waiting-demo__cycle' }, `自然回流：${state.value.cycle} 次`),
        h(MSlider, {
          modelValue: state.value.time, label: '等待动画循环位置', min: 0, max: 2.8, step: .01, showValue: false, disabled: state.value.disposed,
          'aria-valuetext': `循环位置 ${state.value.time.toFixed(2)} 秒，每周期 2.8 秒；${phase.value}`,
          'onUpdate:modelValue': (value: number) => { controller?.seek(value); },
        }),
        h('div', { class: 'waiting-demo__buttons' }, [
          h(MButton, { disabled: state.value.disposed, onClick: () => state.value.playing ? controller?.pause() : controller?.play() }, () => state.value.reducedMotion ? '查看静态处理中' : state.value.playing ? '暂停回流' : '播放回流'),
          h(MButton, { disabled: state.value.disposed, variant: 'secondary', onClick: () => controller?.replay() }, () => '重播回流'),
          h(MButton, { disabled: state.value.disposed, variant: 'ghost', onClick: () => controller?.seek(2.8) }, () => '定位周期末'),
        ]),
        h('p', { class: 'waiting-demo__note' }, state.value.disposed ? '实例已释放。' : state.value.reducedMotion ? '减少动态效果已启用：静态显示处理中轨道，可拖动循环位置查看阶段。' : props.loop ? '手动播放后循环回流。暂停、定位或页面隐藏时会停住，业务确认仍由应用处理。' : '单周期结束后保持等待姿态；再次播放可重新检视这一周期。'),
      ]),
    ]);
  },
});
const meta = {
  title: '动效/MG 双轨等待', component: WaitingSequenceDemo,
  parameters: { layout: 'fullscreen', docs: { description: { component: 'Canvas 与 GSAP 构成的原创双轨等待编排，默认暂停，可无限循环或单周期查看。cycle 只记录自然回流；time/progress 只表示动画位置。减少动效停在清晰处理中轨道，手动 seek 仍可查看各阶段；此动效不决定业务结果。每个实例独立管理时间线、主题、字体、DPR、尺寸与页面生命周期。' } } },
  args: { reducedMotion: 'system', amplitude: 1, speed: 1, loop: true, initialTime: 0 },
  argTypes: {
    reducedMotion: { control: 'inline-radio', options: ['system', true, false] },
    amplitude: { control: { type: 'range', min: .6, max: 1.8, step: .1 } },
    speed: { control: { type: 'range', min: .6, max: 1.8, step: .1 } },
    initialTime: { control: { type: 'range', min: 0, max: 2.8, step: .01 } },
  },
  render: (args, context) => ({ setup: () => () => h(WaitingSequenceDemo, { ...args, reducedMotion: context.globals.motion === 'reduced' ? true : args.reducedMotion }) }),
} satisfies Meta<typeof WaitingSequenceDemo>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const ReducedMotion: Story = { name: '静态处理中', args: { reducedMotion: true } };
export const ReturnDetail: Story = { name: '回流切面', args: { initialTime: 1.85, amplitude: 1.3 } };
export const SingleCycle: Story = { name: '单周期等待姿态', args: { loop: false } };
export const TwoInstances: Story = {
  name: '双实例与卸载',
  render: (args, context) => defineComponent({
    setup() {
      const first = ref(true);
      return () => h('main', { class: 'waiting-pair' }, [
        h('div', { class: 'waiting-pair__tools' }, [h(MButton, { variant: 'secondary', onClick: () => { first.value = !first.value; } }, () => first.value ? '移除第一条回流' : '恢复第一条回流'), h('p', '两条回流独立计时，移除一个实例会释放它自己的观察器与时间线。')]),
        h('div', { class: 'waiting-pair__grid' }, [
          first.value ? h(WaitingSequenceDemo, { ...args, key: 'first', label: '第一条回流', reducedMotion: context.globals.motion === 'reduced' ? true : args.reducedMotion }) : h('div', { class: 'waiting-pair__empty' }, '第一条回流已移除。'),
          h(WaitingSequenceDemo, { ...args, key: 'second', label: '第二条回流', reducedMotion: context.globals.motion === 'reduced' ? true : args.reducedMotion }),
        ]),
      ]);
    },
  }),
};
