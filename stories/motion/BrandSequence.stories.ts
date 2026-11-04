import { computed, defineComponent, h, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue';
import type { PropType } from 'vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { MButton, MSlider } from '../../src';
import { createBrandSequence } from '../../src/motion';
import type { BrandSequenceController, BrandSequenceState } from '../../src/motion';
import './BrandSequence.css';

const phaseNames = { gather: '集轨 · 青玉校准', carve: '构骨 · 干墨成形', reveal: '断缝 · 字标显露', rest: '定名 · MALANG UI' };
const BrandSequenceDemo = defineComponent({
  name: 'BrandSequenceDemo',
  props: {
    label: { type: String, default: 'MaLang 品牌开场' },
    reducedMotion: { type: [Boolean, String] as PropType<boolean | 'system'>, default: 'system' },
    amplitude: { type: Number, default: 1 }, speed: { type: Number, default: 1 }, initialTime: { type: Number, default: 0 },
  },
  setup(props) {
    const canvas = ref<HTMLCanvasElement>();
    const state = shallowRef<BrandSequenceState>({ time: 0, duration: 4.8, progress: 0, phase: 'gather', playing: false, reducedMotion: false, disposed: false });
    const phase = computed(() => phaseNames[state.value.phase]);
    let controller: BrandSequenceController | undefined, mounted = false;
    function create() {
      if (!canvas.value) return;
      const previous = controller?.state, position = previous?.time ?? props.initialTime;
      controller?.dispose();
      controller = createBrandSequence(canvas.value, { reducedMotion: props.reducedMotion, amplitude: props.amplitude, speed: props.speed, onUpdate: next => { state.value = next; } });
      if (!controller.state.reducedMotion || previous?.reducedMotion || (!previous && props.initialTime > 0)) controller.seek(position);
      if (previous?.playing) controller.play();
    }
    onMounted(() => { mounted = true; create(); });
    onBeforeUnmount(() => { mounted = false; controller?.dispose(); });
    watch(() => [props.reducedMotion, props.amplitude, props.speed], () => { if (mounted) create(); });
    watch(() => props.initialTime, value => { controller?.pause(); controller?.seek(value); });
    return () => h('section', { class: 'brand-demo', role: 'region', 'aria-label': props.label }, [
      h('header', { class: 'brand-demo__heading' }, [
        h('p', { class: 'brand-demo__eyebrow' }, 'MALANG / IDENTITY IN MOTION'),
        h('h2', '墨骨成形，字有其名。'),
        h('p', { class: 'brand-demo__intro' }, '青玉轨道聚合，干墨构骨，朱砂断缝归位。4.8 秒，让品牌留下清晰的落点。'),
      ]),
      h('div', { class: 'brand-demo__stage' }, [
        h('canvas', { ref: canvas, class: 'brand-demo__canvas', role: 'img', 'aria-label': '青玉轨道与干墨构形归位，最终显露 MALANG UI 品牌字标' }, '可手动播放、暂停、定位或跳过的 MaLang 品牌开场，最终字标为 MALANG UI。'),
        h('div', { class: 'brand-demo__annotations', 'aria-hidden': 'true' }, [h('span', 'INK / MOTION / INTERFACE'), h('span', '01 — IDENTITY')]),
      ]),
      h('div', { class: 'brand-demo__controls' }, [
        h('div', { class: 'brand-demo__status' }, [h('p', { class: 'brand-demo__phase', role: 'status' }, phase.value), h('span', { class: 'brand-demo__time', 'aria-hidden': 'true' }, `${state.value.time.toFixed(2)} / 4.80 s`)]),
        h('div', { class: 'brand-demo__timeline' }, [h(MSlider, {
          modelValue: state.value.time, label: '品牌开场进度', min: 0, max: 4.8, step: 0.01, showValue: false,
          'aria-valuetext': `${state.value.time.toFixed(2)} 秒，共 4.8 秒；${phase.value}`,
          'onUpdate:modelValue': (value: number) => { controller?.pause(); controller?.seek(value); },
        })]),
        h('div', { class: 'brand-demo__buttons' }, [
          h(MButton, { onClick: () => state.value.playing ? controller?.pause() : controller?.play() }, () => state.value.reducedMotion ? '查看完整字标' : state.value.playing ? '暂停开场' : '播放开场'),
          h(MButton, { variant: 'secondary', onClick: () => controller?.replay() }, () => '重播开场'),
          h(MButton, { variant: 'ghost', onClick: () => { controller?.pause(); controller?.seek(4.8); } }, () => '跳过开场'),
        ]),
        h('p', { class: 'brand-demo__note' }, state.value.reducedMotion ? '减少动态效果已启用：直接显示完整字标；进度条仍可静态检查构形阶段。' : '手动播放，可随时跳过到完整字标。开场不会遮挡正文或限制操作，结束后再次播放会从头开始。'),
      ]),
    ]);
  },
});
const meta = {
  title: '动效/MG 品牌开场', component: BrandSequenceDemo,
  parameters: { layout: 'fullscreen', docs: { description: { component: 'MaLang 原创品牌有限编排。青玉定位轨、三束干墨骨架与朱砂断缝收束为 M 构形和完整 MALANG UI 字标，不使用外部图片。默认暂停，支持播放、暂停、定位、重播和跳过；减少动效初始化直接显示完整终态。每个控制器管理自己的时间线、纹理、DPR、字体、主题与页面生命周期，销毁不会清理其他实例。' } } },
  args: { reducedMotion: 'system', amplitude: 1, speed: 1, initialTime: 0 },
  argTypes: {
    reducedMotion: { control: 'inline-radio', options: ['system', true, false] },
    amplitude: { control: { type: 'range', min: 0.6, max: 1.8, step: 0.1 } },
    speed: { control: { type: 'range', min: 0.6, max: 1.6, step: 0.1 } },
    initialTime: { control: { type: 'range', min: 0, max: 4.8, step: 0.01 } },
  },
  render: (args, context) => ({ setup: () => () => h(BrandSequenceDemo, { ...args, reducedMotion: context.globals.motion === 'reduced' ? true : args.reducedMotion }) }),
} satisfies Meta<typeof BrandSequenceDemo>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const ReducedMotion: Story = { name: '静态品牌', args: { reducedMotion: true } };
export const CarveDetail: Story = { name: '墨骨细节', args: { initialTime: 1.72 } };
export const FinalBrand: Story = { name: '完整字标', args: { initialTime: 4.8 } };
export const TwoInstances: Story = {
  name: '双实例与卸载',
  render: (args, context) => defineComponent({
    setup() {
      const first = ref(true);
      return () => h('main', { class: 'brand-pair' }, [
        h('div', { class: 'brand-pair__tools' }, [h(MButton, { variant: 'secondary', onClick: () => { first.value = !first.value; } }, () => first.value ? '移除第一组开场' : '恢复第一组开场'), h('p', '两组字标各有独立的编排；移除一组，另一组继续。')]),
        h('div', { class: 'brand-pair__grid' }, [
          first.value ? h(BrandSequenceDemo, { ...args, key: 'first', label: '第一组品牌开场', reducedMotion: context.globals.motion === 'reduced' ? true : args.reducedMotion }) : h('div', { class: 'brand-pair__empty' }, '第一组开场已移除。'),
          h(BrandSequenceDemo, { ...args, key: 'second', label: '第二组品牌开场', reducedMotion: context.globals.motion === 'reduced' ? true : args.reducedMotion }),
        ]),
      ]);
    },
  }),
};
