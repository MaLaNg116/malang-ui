import { computed, defineComponent, h, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue';
import type { PropType } from 'vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { MButton, MCard, MEmpty, MInput, MSlider } from '../../src';
import { createStaggerSequence } from '../../src/motion/staggerSequence';
import type { StaggerSequenceController, StaggerSequenceOptions, StaggerSequenceState } from '../../src/motion/staggerSequence';
import './StaggerSequence.css';

const names = ['笔势归卷', '机关合轨', '朱砂成章'];
const notes = ['列表保留自己的布局与文字，入场只给归位一个短促的节奏。', '方向、距离与间隔分别管理，控制器只负责这一组容器。', '进入内容操作时立即归位，正在使用的表单不会被重播隐藏。'];
const restingStyle = { transform: 'translateX(4px) rotate(-1deg) !important', opacity: '.88 !important' };
const individualStyle = { translate: '3px 0' };
const phaseNames = { idle: '待命 · 正文可读', enter: '合轨 · 错峰入场', settled: '归位 · 正文就绪' };
const StaggerDemo = defineComponent({
  props: {
    label: { type: String, default: '归档清单入场' },
    direction: { type: String as PropType<StaggerSequenceOptions['direction']>, default: 'up' },
    reducedMotion: { type: [Boolean, String] as PropType<boolean | 'system'>, default: 'system' },
    distance: { type: Number, default: 18 }, duration: { type: Number, default: .42 }, stagger: { type: Number, default: .08 }, speed: { type: Number, default: 1 },
    count: { type: Number, default: 3 }, focusBeforeCreate: Boolean,
  },
  setup(props) {
    const stage = ref<HTMLElement>(); const targets: HTMLElement[] = []; const note = ref(''); const ownership = ref('');
    const state = shallowRef<StaggerSequenceState>({ time: 0, duration: 0, progress: 1, phase: 'idle', playing: false, reducedMotion: false, disposed: false });
    let controller: StaggerSequenceController | undefined; let mounted = false;
    const phase = computed(() => state.value.disposed ? '已释放 · 原样式归还' : phaseNames[state.value.phase]);
    function create() {
      controller?.dispose(); ownership.value = '';
      controller = createStaggerSequence(targets.slice(0, props.count), { direction: props.direction, reducedMotion: props.reducedMotion, distance: props.distance, duration: props.duration, stagger: props.stagger, speed: props.speed, onUpdate: value => { state.value = value; } });
      state.value = controller.state;
    }
    function dispose() { controller?.dispose(); if (controller) state.value = controller.state; }
    function duplicate() {
      try { const other = createStaggerSequence(targets.slice(0, props.count)); other.dispose(); ownership.value = '空集合可安全创建，无容器冲突。'; }
      catch (error) { ownership.value = error instanceof Error ? error.message : String(error); }
    }
    onMounted(async () => { mounted = true; if (props.focusBeforeCreate) { await nextTick(); stage.value?.querySelector('input')?.focus(); } if (mounted) create(); });
    onBeforeUnmount(() => { mounted = false; controller?.dispose(); targets.length = 0; });
    watch(() => [props.direction, props.reducedMotion, props.distance, props.duration, props.stagger, props.speed], () => { if (mounted) create(); });
    return () => h('section', { class: 'stagger-demo', role: 'region', 'aria-label': props.label, 'data-phase': state.value.phase, 'data-playing': state.value.playing, 'data-time': state.value.time, 'data-disposed': state.value.disposed }, [
      h('header', { class: 'stagger-demo__heading' }, [h('p', { class: 'stagger-demo__eyebrow' }, 'MALANG / DOM MOTION'), h('h2', props.label), h('p', '错落有序，归位有力。正文始终属于你，节奏由这一组容器掌握。')]),
      h('div', { class: 'stagger-demo__controls' }, [
        h('div', { class: 'stagger-demo__readout' }, [h('p', { role: 'status' }, phase.value), h('span', { 'aria-hidden': 'true' }, `${state.value.time.toFixed(2)} / ${state.value.duration.toFixed(2)} s`)]),
        h(MSlider, { modelValue: state.value.time, min: 0, max: state.value.duration, step: .01, label: '入场动画进度', disabled: state.value.disposed || !state.value.duration, showValue: false, 'aria-valuetext': `${state.value.time.toFixed(2)} 秒，共 ${state.value.duration.toFixed(2)} 秒`, 'onUpdate:modelValue': (value: number) => { controller?.pause(); controller?.seek(value); } }),
        h('div', { class: 'stagger-demo__buttons' }, [
          h(MButton, { disabled: state.value.disposed, onClick: () => state.value.playing ? controller?.pause() : controller?.play() }, () => state.value.reducedMotion ? '查看静态清单' : state.value.playing ? '暂停入场' : '播放入场'),
          h(MButton, { variant: 'secondary', disabled: state.value.disposed, onClick: () => controller?.replay() }, () => '重播入场'),
          h(MButton, { variant: 'ghost', onClick: () => state.value.disposed ? create() : dispose() }, () => state.value.disposed ? '重新创建编排' : '释放编排'),
          h(MButton, { variant: 'ghost', disabled: state.value.disposed, onClick: duplicate }, () => '校验容器独占'),
        ]),
        ownership.value ? h('p', { class: 'stagger-demo__ownership', 'data-ownership': '' }, ownership.value) : null,
      ]),
      h('div', { ref: stage, class: 'stagger-demo__stage', 'data-direction': props.direction }, [
        props.count ? names.slice(0, props.count).map((title, index) => h('div', { class: 'stagger-demo__item', key: title, 'data-stagger-item': index, ref: (element: unknown) => { if (element) targets[index] = element as HTMLElement; }, style: index === 0 ? restingStyle : index === 1 ? individualStyle : undefined }, [
          h('span', { class: 'stagger-demo__index', 'aria-hidden': 'true' }, `0${index + 1} / ARCHIVE`),
          h(MCard, { title, headingTag: 'h3' }, { default: () => [h('p', notes[index]), index === props.count - 1 ? h(MInput, { modelValue: note.value, label: `${props.label}内容备注`, 'onUpdate:modelValue': (value: string) => { note.value = value; } }) : null], footer: () => h(MButton, { variant: 'ghost', size: 'sm' }, () => `查看${title}`) }),
        ])) : h(MEmpty, { title: '清单为空，正文无需等待', description: '零时长控制器仍可安全播放、定位与释放。' }),
      ]),
      h('p', { class: 'stagger-demo__note' }, state.value.reducedMotion ? '减少动态效果已启用：播放、重播与定位均保持静态归位。' : '手动播放；焦点进入正文、页面隐藏或减少动态效果启用时，清单立即归位。'),
    ]);
  },
});
const meta = {
  title: '动效/DOM 清单归位', component: StaggerDemo,
  parameters: { layout: 'fullscreen', docs: { description: { component: '实用 DOM 错峰入场。创建时暂停且保持正文原样；play/replay/显式 seek 才应用动画。目标数组去重并固定顺序，单项时长加间隔构成总时长。使用专属包裹容器，同一容器不能交给多个实例；业务变形放在内层。焦点进入目标时整体归位，不改 ARIA、业务选择或焦点。释放仅还原本实例样式，媒体查询、页面生命周期与 GSAP context 均随实例清理；Vue 中在 onBeforeUnmount 调用 dispose。' } } },
  args: { label: '归档清单入场', direction: 'up', reducedMotion: 'system', distance: 18, duration: .42, stagger: .08, speed: 1, count: 3 },
  argTypes: { direction: { control: 'inline-radio', options: ['up', 'down', 'left', 'right'] }, reducedMotion: { control: 'inline-radio', options: ['system', true, false] }, distance: { control: { type: 'range', min: 0, max: 60, step: 1 } }, duration: { control: { type: 'range', min: .1, max: 1.5, step: .02 } }, stagger: { control: { type: 'range', min: 0, max: .3, step: .01 } }, count: { control: false } },
  render: (args, context) => ({ setup: () => () => h(StaggerDemo, { ...args, reducedMotion: context.globals.motion === 'reduced' ? true : args.reducedMotion }) }),
} satisfies Meta<typeof StaggerDemo>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Directions: Story = { name: '左右空间归位', render: (args, context) => ({ setup: () => () => h('main', { class: 'stagger-pair' }, [h(StaggerDemo, { ...args, label: '左域归位', count: 2, direction: 'left', distance: 36, reducedMotion: context.globals.motion === 'reduced' ? true : args.reducedMotion }), h(StaggerDemo, { ...args, label: '右域归位', count: 2, direction: 'right', distance: 36, reducedMotion: context.globals.motion === 'reduced' ? true : args.reducedMotion })]) }) };
export const FocusSafety: Story = { name: '焦点优先', args: { label: '正在填写的归档', focusBeforeCreate: true } };
export const ReducedMotion: Story = { name: '静态归位', args: { reducedMotion: true } };
export const Empty: Story = { name: '空集合', args: { label: '空清单编排', count: 0 } };
export const TwoInstances: Story = {
  name: '双实例与卸载',
  render: (args, context) => defineComponent({
    setup() {
      const shown = ref(true);
      return () => h('main', { class: 'stagger-pair-shell' }, [h('div', { class: 'stagger-pair-tools' }, [h(MButton, { variant: 'secondary', onClick: () => { shown.value = !shown.value; } }, () => shown.value ? '移除第一组清单' : '恢复第一组清单')]), h('div', { class: 'stagger-pair' }, [shown.value ? h(StaggerDemo, { ...args, key: 'first', label: '第一组清单', duration: 1.2, stagger: .2, reducedMotion: context.globals.motion === 'reduced' ? true : args.reducedMotion }) : h('p', { class: 'stagger-pair-empty' }, '第一组清单已移除。'), h(StaggerDemo, { ...args, key: 'second', label: '第二组清单', duration: 1.2, stagger: .2, reducedMotion: context.globals.motion === 'reduced' ? true : args.reducedMotion })])]);
    },
  }),
};
