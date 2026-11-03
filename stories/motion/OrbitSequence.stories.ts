import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { computed, defineComponent, h, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue';
import type { PropType } from 'vue';
import { createOrbitSequence } from '../../src/motion';
import type { OrbitSequenceController, OrbitSequenceState } from '../../src/motion';
import './OrbitSequence.css';

const phaseNames = { gather:'几何聚合', shape:'形态重组', respond:'界面响应', complete:'完成反馈' };

const OrbitSequenceDemo = defineComponent({
  name: 'OrbitSequenceDemo',
  props: {
    reducedMotion: { type:[Boolean, String] as PropType<boolean | 'system'>, default:'system' },
    amplitude: { type:Number, default:1 },
    speed: { type:Number, default:1 },
  },
  setup(props) {
    const canvas = ref<HTMLCanvasElement>();
    const state = shallowRef<OrbitSequenceState>({ time:0,duration:4.8,progress:0,phase:'gather',playing:false,reducedMotion:false,disposed:false });
    let controller: OrbitSequenceController | undefined;
    let mounted = false;
    const phase = computed(() => phaseNames[state.value.phase]);

    function create() {
      if (!canvas.value) return;
      const position = controller?.state.time ?? 0;
      const wasPlaying = controller?.state.playing ?? false;
      controller?.dispose();
      controller = createOrbitSequence(canvas.value, {
        amplitude:props.amplitude,
        speed:props.speed,
        reducedMotion:props.reducedMotion,
        onUpdate:next => { state.value = next; },
      });
      controller.seek(position);
      if (wasPlaying) controller.play();
    }

    onMounted(() => { mounted = true; create(); });
    onBeforeUnmount(() => { mounted = false; controller?.dispose(); });
    watch(() => [props.amplitude, props.speed, props.reducedMotion], () => { if (mounted) create(); });

    return () => h('section', { class:'orbit-demo', 'aria-label':'GSAP 轨道构形编排' }, [
      h('header', { class:'orbit-demo__heading' }, [
        h('p', { class:'orbit-demo__eyebrow' }, 'GSAP / MOTION GRAPHICS'),
        h('h2', '从几何，到交互。'),
      ]),
      h('canvas', { ref:canvas, class:'orbit-demo__canvas', role:'img', 'aria-label':'几何轨道聚合成按钮，随后展开完成反馈' }, '可通过下方按钮播放或定位的几何构形动画。'),
      h('div', { class:'orbit-demo__controls' }, [
        h('div', { class:'orbit-demo__status' }, [
          h('span', { role:'status', 'aria-live':'polite' }, phase.value),
          h('span', { class:'orbit-demo__time', 'aria-hidden':'true' }, `${state.value.time.toFixed(1)} / 4.8s`),
        ]),
        h('input', {
          type:'range', class:'orbit-demo__timeline', min:0, max:4.8, step:0.01, value:state.value.time,
          'aria-label':'MG 编排进度', 'aria-valuetext':`${state.value.time.toFixed(1)} 秒，共 4.8 秒`,
          onInput:(event:Event) => {
            const next = Number((event.target as HTMLInputElement).value);
            controller?.pause(); controller?.seek(next);
          },
        }),
        h('div', { class:'orbit-demo__buttons' }, [
          h('button', {
            type:'button', class:'orbit-demo__button orbit-demo__button--primary',
            onClick:() => state.value.playing ? controller?.pause() : controller?.play(),
          }, state.value.reducedMotion ? '查看完成状态' : state.value.playing ? '暂停' : '播放'),
          h('button', { type:'button', class:'orbit-demo__button', onClick:() => controller?.replay() }, '重新播放'),
          h('button', { type:'button', class:'orbit-demo__button', onClick:() => { controller?.pause(); controller?.seek(4.8); } }, '完成状态'),
        ]),
        h('p', { class:'orbit-demo__note' }, state.value.reducedMotion ? '已启用减少动态效果，播放时直接显示完成状态。' : '手动播放，支持暂停与拖动；离开示例时释放动画与订阅。'),
      ]),
    ]);
  },
});

const meta = {
  title:'动效/MG 轨道构形',
  component:OrbitSequenceDemo,
  parameters:{ layout:'fullscreen', docs:{ description:{ component:'框架无关的 GSAP 编排，通过 Vue 示例控制播放、暂停、定位、重播和销毁。默认遵循系统减少动态效果偏好。' } } },
  argTypes:{
    reducedMotion:{ control:'inline-radio', options:['system', true, false], description:'遵循系统或显式选择减少动态效果。' },
    amplitude:{ control:{type:'range',min:0.6,max:1.8,step:0.1} },
    speed:{ control:{type:'range',min:0.6,max:1.6,step:0.1} },
  },
  args:{ reducedMotion:'system', amplitude:1, speed:1 },
  render:(args, context) => ({
    setup:() => () => h(OrbitSequenceDemo, {
      ...args,
      // The workbench setting is an accessibility override. Returning to
      // standard restores the story's own boolean/system preference.
      reducedMotion:context.globals.motion === 'reduced' ? true : args.reducedMotion,
    }),
  }),
} satisfies Meta<typeof OrbitSequenceDemo>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const ReducedMotion: Story = { args:{reducedMotion:true} };
