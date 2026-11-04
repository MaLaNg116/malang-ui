import { computed, defineComponent, h, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue';
import type { PropType } from 'vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { MButton, MSlider } from '../../src';
import { createWeaveSequence } from '../../src/motion';
import type { WeaveSequenceController, WeaveSequenceState } from '../../src/motion';
import './WeaveSequence.css';

const phaseNames = { lay: '铺经 · 细轨列阵', cross: '穿纬 · 墨线往来', weave: '织光 · 经纬交错', rest: '归序 · 织印成面' };
const WeaveSequenceDemo = defineComponent({
  name: 'WeaveSequenceDemo',
  props: {
    label: { type: String, default: '经纬织光编排' },
    reducedMotion: { type: [Boolean, String] as PropType<boolean | 'system'>, default: 'system' },
    amplitude: { type: Number, default: 1 }, speed: { type: Number, default: 1 }, initialTime: { type: Number, default: 0 },
  },
  setup(props) {
    const canvas = ref<HTMLCanvasElement>();
    const state = shallowRef<WeaveSequenceState>({ time: 0, duration: 4.2, progress: 0, phase: 'lay', playing: false, reducedMotion: false, disposed: false });
    const phase = computed(() => phaseNames[state.value.phase]);
    let controller: WeaveSequenceController | undefined, mounted = false;
    function create() {
      if (!canvas.value) return;
      const previous = controller?.state, position = previous?.time ?? props.initialTime;
      controller?.dispose();
      controller = createWeaveSequence(canvas.value, { reducedMotion: props.reducedMotion, amplitude: props.amplitude, speed: props.speed, onUpdate: next => { state.value = next; } });
      if (!controller.state.reducedMotion || previous?.reducedMotion || (!previous && props.initialTime > 0)) controller.seek(position);
      if (previous?.playing) controller.play();
    }
    onMounted(() => { mounted = true; create(); });
    onBeforeUnmount(() => { mounted = false; controller?.dispose(); });
    watch(() => [props.reducedMotion, props.amplitude, props.speed], () => { if (mounted) create(); });
    watch(() => props.initialTime, value => { controller?.pause(); controller?.seek(value); });
    return () => h('section', { class: 'weave-demo', role: 'region', 'aria-label': props.label }, [
      h('header', { class: 'weave-demo__heading' }, [
        h('p', { class: 'weave-demo__eyebrow' }, 'MALANG / WARP & WEFT'),
        h('h2', '经纬相遇，墨里生光。'),
        h('p', { class: 'weave-demo__intro' }, '经线立骨，纬线成面。微光沿墨线穿行，交错织成一幅有序的丝绢切面。'),
      ]),
      h('div', { class: 'weave-demo__stage' }, [
        h('canvas', { ref: canvas, class: 'weave-demo__canvas', role: 'img', 'aria-label': '经纬墨线交替穿梭，青玉与金色光点织成开放的几何丝绢切面' }, '可手动播放、暂停与定位的经纬织光动画，最终为清晰静止的几何织印。'),
        h('div', { class: 'weave-demo__annotations', 'aria-hidden': 'true' }, [h('span', 'THREAD / SHUTTLE / LIGHT'), h('span', '纤维可见 · 秩序成面')]),
      ]),
      h('div', { class: 'weave-demo__controls' }, [
        h('div', { class: 'weave-demo__status' }, [h('p', { class: 'weave-demo__phase', role: 'status' }, phase.value), h('span', { class: 'weave-demo__time', 'aria-hidden': 'true' }, `${state.value.time.toFixed(2)} / 4.20 s`)]),
        h('div', { class: 'weave-demo__timeline' }, [h(MSlider, {
          modelValue: state.value.time, label: '经纬织光进度', min: 0, max: 4.2, step: 0.01, showValue: false,
          'aria-valuetext': `${state.value.time.toFixed(2)} 秒，共 4.2 秒；${phase.value}`,
          'onUpdate:modelValue': (value: number) => { controller?.pause(); controller?.seek(value); },
        })]),
        h('div', { class: 'weave-demo__buttons' }, [
          h(MButton, { onClick: () => state.value.playing ? controller?.pause() : controller?.play() }, () => state.value.reducedMotion ? '查看静态织印' : state.value.playing ? '暂停经纬' : '播放经纬'),
          h(MButton, { variant: 'secondary', onClick: () => controller?.replay() }, () => '重播经纬'),
          h(MButton, { variant: 'ghost', onClick: () => { controller?.pause(); controller?.seek(4.2); } }, () => '定位织印'),
        ]),
        h('p', { class: 'weave-demo__note' }, state.value.reducedMotion ? '减少动态效果已启用：直接显示完整织印；进度条仍可静态查看经纬结构。' : '4.2 秒有限编排，支持播放、暂停与逐帧定位。微光完成穿梭后归于静止，不表示业务进度。'),
      ]),
    ]);
  },
});
const meta = {
  title: '动效/MG 经纬织光', component: WeaveSequenceDemo,
  parameters: { layout: 'fullscreen', docs: { description: { component: '原创 Canvas 与 GSAP 有限编排。纸面细轨、经纬墨线与交替上下的线结组成开放丝绢切面，青玉与主题强调色只用于微光和局部织线；朱砂刻痕独立读取 color-seal。支持三种浅色配色、深色、减少动效、播放、暂停、定位与重播；每个实例独立管理 DPR、字体、主题、页面生命周期和销毁。' } } },
  args: { reducedMotion: 'system', amplitude: 1, speed: 1, initialTime: 0 },
  argTypes: {
    reducedMotion: { control: 'inline-radio', options: ['system', true, false] },
    amplitude: { control: { type: 'range', min: 0.6, max: 1.8, step: 0.1 } },
    speed: { control: { type: 'range', min: 0.6, max: 1.6, step: 0.1 } },
    initialTime: { control: { type: 'range', min: 0, max: 4.2, step: 0.01 } },
  },
  render: (args, context) => ({ setup: () => () => h(WeaveSequenceDemo, { ...args, reducedMotion: context.globals.motion === 'reduced' ? true : args.reducedMotion }) }),
} satisfies Meta<typeof WeaveSequenceDemo>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const ReducedMotion: Story = { name: '静态织印', args: { reducedMotion: true } };
export const WeaveDetail: Story = { name: '交织细节', args: { initialTime: 2.4 } };
export const FinalWeave: Story = { name: '完整丝面', args: { initialTime: 4.2 } };
export const TwoInstances: Story = {
  name: '双实例与卸载',
  render: (args, context) => defineComponent({
    setup() {
      const first = ref(true);
      return () => h('main', { class: 'weave-pair' }, [
        h('div', { class: 'weave-pair__tools' }, [h(MButton, { variant: 'secondary', onClick: () => { first.value = !first.value; } }, () => first.value ? '移除第一幅经纬' : '恢复第一幅经纬'), h('p', '两幅丝面分别拥有自己的时间线；移除一幅，另一幅仍然穿梭。')]),
        h('div', { class: 'weave-pair__grid' }, [
          first.value ? h(WeaveSequenceDemo, { ...args, key: 'first', label: '第一幅经纬', reducedMotion: context.globals.motion === 'reduced' ? true : args.reducedMotion }) : h('div', { class: 'weave-pair__empty' }, '第一幅经纬已移除。'),
          h(WeaveSequenceDemo, { ...args, key: 'second', label: '第二幅经纬', reducedMotion: context.globals.motion === 'reduced' ? true : args.reducedMotion }),
        ]),
      ]);
    },
  }),
};
