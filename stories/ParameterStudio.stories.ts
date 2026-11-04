import { computed, defineComponent, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, useId, watch } from 'vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { MAvatar, MBreadcrumb, MButton, MCombobox, MDescriptions, MInput, MInputNumber, MSlider, MTag, MToast, MToastViewport, useReducedMotion } from '../src';
import type { MDescriptionItem } from '../src';
import { createSealSequence } from '../src/motion';
import type { SealSequenceController, SealSequenceState } from '../src/motion';
import './ParameterStudio.css';

const presets = [
  { value: 'calm', label: '墨线 · 沉静', name: '归印 · 沉静', description: '更轻的墨纹与从容的归位。', amplitude: .65, speed: .7, tags: ['墨线构形', '从容归位'] },
  { value: 'balanced', label: '机关 · 均衡', name: '归印 · 均衡', description: '清晰的夹具合轨与朱砂落印。', amplitude: 1, speed: 1, tags: ['机械归位', '朱砂落印', '墨纹回响'] },
  { value: 'bold', label: '朱砂 · 凌厉', name: '归印 · 凌厉', description: '更鲜明的展开幅度与短促回响。', amplitude: 1.55, speed: 1.3, tags: ['切面展开', '朱砂落印', '疾出归位'] },
];
const phaseNames = { gather: '蓄印 · 滑轨聚合', align: '合轨 · 印面校准', stamp: '落印 · 朱砂成形', settle: '回响 · 成章归位' };
const ParameterStudio = defineComponent({
  props: { motionProfile: { type: String, default: 'standard' } },
  components: { MAvatar, MBreadcrumb, MButton, MCombobox, MDescriptions, MInput, MInputNumber, MSlider, MTag, MToast, MToastViewport },
  setup(props) {
    const selected = ref('balanced'); const name = ref('归印 · 均衡'); const amplitude = ref<number | null>(1); const speed = ref<number | null>(1); const tags = ref([...presets[1]!.tags]);
    const applied = ref({ name: name.value, base: presets[1]!.label, amplitude: 1, speed: 1, tags: [...tags.value] });
    const editorForm = ref<HTMLFormElement>(); const canvas = ref<HTMLCanvasElement>(); const tagGroup = ref<HTMLElement>(); const restoreButton = ref<InstanceType<typeof MButton>>();
    const attempted = ref(false); const systemMotion = useReducedMotion(); const reduced = computed(() => props.motionProfile === 'reduced' || systemMotion.value);
    const identity = useId(); const nameId = `studio-name-${identity}`; const amplitudeId = `studio-amplitude-${identity}`; const speedId = `studio-speed-${identity}`;
    const nameError = computed(() => attempted.value && !name.value.trim() ? '请填写预设名称。' : '');
    const amplitudeError = computed(() => attempted.value && (amplitude.value === null || !Number.isFinite(amplitude.value) || amplitude.value < .6 || amplitude.value > 1.8) ? '力度需在 0.6 至 1.8 之间。' : '');
    const speedError = computed(() => attempted.value && (speed.value === null || !Number.isFinite(speed.value) || speed.value < .5 || speed.value > 2) ? '速度需在 0.5 至 2 之间。' : '');
    const amplitudeSlider = computed({ get: () => amplitude.value ?? applied.value.amplitude, set: (value: number) => { amplitude.value = value; } });
    const speedSlider = computed({ get: () => speed.value ?? applied.value.speed, set: (value: number) => { speed.value = value; } });
    const dirty = computed(() => name.value.trim() !== applied.value.name || amplitude.value !== applied.value.amplitude || speed.value !== applied.value.speed || JSON.stringify(tags.value) !== JSON.stringify(applied.value.tags) || (presets.find(item => item.value === selected.value)?.label || '自定义') !== applied.value.base);
    const options = [...presets.map(({ value, label, description }) => ({ value, label, description })), { value: 'experimental', label: '极端实验 · 暂未开放', description: '当前预设不提供这一档配置。', disabled: true }];
    const snapshot = shallowRef<SealSequenceState>({ time: 0, duration: 3.6, progress: 0, phase: 'gather', playing: false, reducedMotion: false, disposed: false });
    const toast = ref(false); const toastText = ref(''); let controller: SealSequenceController | undefined; let generation = 0; let notice = 0; let mounted = false; let armed = false;
    async function notify() { const token = ++notice; toast.value = false; await nextTick(); if (!mounted || token !== notice) return; toastText.value = `${applied.value.name} · 力度 ${applied.value.amplitude.toFixed(2)}，速度 ${applied.value.speed.toFixed(1)}×。`; toast.value = true; }
    function create(keepPosition = false) {
      if (!mounted || !canvas.value) return;
      const previous = keepPosition ? controller?.state : undefined; const token = ++generation; controller?.dispose();
      controller = createSealSequence(canvas.value, { amplitude: applied.value.amplitude, speed: applied.value.speed, reducedMotion: reduced.value, onUpdate: state => { if (!mounted || token !== generation) return; snapshot.value = state; if (state.progress === 1 && !state.playing && armed) { armed = false; void notify(); } } });
      if (!controller.state.reducedMotion || previous?.reducedMotion) controller.seek(previous?.time ?? 0);
      if (previous?.playing) controller.play();
    }
    watch(selected, value => { const preset = presets.find(item => item.value === value); if (!preset) return; name.value = preset.name; amplitude.value = preset.amplitude; speed.value = preset.speed; tags.value = [...preset.tags]; });
    watch(reduced, () => create(true));
    onMounted(() => { mounted = true; create(); });
    onBeforeUnmount(() => { mounted = false; generation++; notice++; armed = false; controller?.dispose(); controller = undefined; });
    async function apply() {
      attempted.value = true; const nextAmplitude = amplitude.value, nextSpeed = speed.value;
      if (nameError.value || amplitudeError.value || speedError.value || nextAmplitude === null || nextSpeed === null) { await nextTick(); document.getElementById(nameError.value ? nameId : amplitudeError.value ? amplitudeId : speedId)?.focus(); return; }
      if (editorForm.value && !editorForm.value.reportValidity()) return;
      applied.value = { name: name.value.trim(), base: presets.find(item => item.value === selected.value)?.label || '自定义', amplitude: nextAmplitude, speed: nextSpeed, tags: [...tags.value] };
      armed = true; create(); controller?.replay();
    }
    function toggle() { if (!controller) return; if (snapshot.value.playing) controller.pause(); else { armed = true; if (snapshot.value.time >= snapshot.value.duration) controller.replay(); else controller.play(); } }
    function seek(value: number) { armed = false; controller?.pause(); controller?.seek(value); }
    function replay() { armed = true; controller?.replay(); }
    async function removeTag(value: string) { const index = tags.value.indexOf(value); tags.value = tags.value.filter(item => item !== value); await nextTick(); const buttons = tagGroup.value?.querySelectorAll<HTMLButtonElement>('button'); (buttons?.[Math.min(index, buttons.length - 1)] || restoreButton.value?.$el)?.focus(); }
    function restoreTags() { tags.value = [...(presets.find(item => item.value === selected.value)?.tags || presets[1]!.tags)]; }
    async function restoreDraft() { selected.value = presets.find(item => item.label === applied.value.base)?.value || ''; await nextTick(); name.value = applied.value.name; amplitude.value = applied.value.amplitude; speed.value = applied.value.speed; tags.value = [...applied.value.tags]; attempted.value = false; }
    const details = computed<MDescriptionItem[]>(() => [{ key:'base',label:'基底预设',value:applied.value.base },{ key:'name',label:'已应用名称',value:applied.value.name },{ key:'amplitude',label:'力度',value:applied.value.amplitude.toFixed(2) },{ key:'speed',label:'速度',value:applied.value.speed.toFixed(1)+'×' },{ key:'duration',label:'预计播放时长',value:reduced.value?'静态完成态':(3.6/applied.value.speed).toFixed(2)+'s' },{ key:'tags',label:'归档关键词',value:applied.value.tags.join(' · ')||'未添加',span:2 }]);
    return { selected, name, amplitude, speed, tags, applied, editorForm, canvas, tagGroup, restoreButton, options, snapshot, reduced, dirty, nameId, amplitudeId, speedId, nameError, amplitudeError, speedError, amplitudeSlider, speedSlider, details, toast, toastText, phaseNames, apply, toggle, seek, replay, removeTag, restoreTags, restoreDraft, breadcrumbs:[{label:'组件工坊',href:'#studio-top'},{label:'归印调校'}] };
  },
  template: `<main id="studio-top" class="parameter-studio"><MBreadcrumb :items="breadcrumbs"/><header class="parameter-studio__header"><div><p class="parameter-studio__eyebrow">MALANG / IMPRESSION STUDIO</p><h1>毫厘之间，自有锋芒。</h1><p class="parameter-studio__intro">选择基底，微调力度与节奏，再看一枚朱砂印记如何归位成章。</p></div><div class="parameter-studio__author"><MAvatar name="ML" alt="" tone="seal"/><div><strong>MaLang 工坊</strong><p>刻印 · 调校 · 归档</p></div></div></header>
    <div class="parameter-studio__workspace"><form ref="editorForm" class="parameter-studio__editor" novalidate @submit.prevent="apply"><div class="parameter-studio__section-heading"><h2>调校参数</h2><MTag :tone="dirty ? 'warning' : 'success'">{{ dirty ? '待应用' : '已应用' }}</MTag></div><MCombobox v-model="selected" label="选择基底" :options="options" placeholder="搜索墨线、机关或朱砂" hint="支持中文搜索；选中后仍可继续微调。" name="preset"/><MInput :id="nameId" v-model="name" label="预设名称" :error="nameError" maxlength="40" name="presetName" required />
      <section class="parameter-studio__calibration" aria-label="力度调校"><MInputNumber :id="amplitudeId" v-model="amplitude" label="力度数值" :min="0.6" :max="1.8" :step="0.05" :error="amplitudeError" hint="调整滑轨分离与墨纹回响的幅度。" name="amplitude" required/><MSlider v-model="amplitudeSlider" label="力度刻度" :min="0.6" :max="1.8" :step="0.05" :show-value="false"/></section>
      <section class="parameter-studio__calibration" aria-label="速度调校"><MInputNumber :id="speedId" v-model="speed" label="速度数值" :min="0.5" :max="2" :step="0.1" :error="speedError" hint="1× 为原速；数值越大，节奏越短促。" name="speed" required/><MSlider v-model="speedSlider" label="速度刻度" :min="0.5" :max="2" :step="0.1" :show-value="false"/></section>
      <section class="parameter-studio__keywords" aria-labelledby="studio-keywords"><h3 id="studio-keywords">归档关键词</h3><div ref="tagGroup" class="parameter-studio__tags"><MTag v-for="tag in tags" :key="tag" closable :close-label="'移除'+tag" @close="removeTag(tag)">{{ tag }}</MTag><span v-if="!tags.length" class="parameter-studio__muted">尚未添加关键词。</span></div><MButton ref="restoreButton" variant="ghost" size="sm" @click="restoreTags">恢复关键词</MButton></section><div class="parameter-studio__actions"><MButton type="submit">应用并预览 <span aria-hidden="true">↗</span></MButton><MButton variant="secondary" :disabled="!dirty" @click="restoreDraft">还原草稿</MButton></div><p class="parameter-studio__muted">参数修改后再应用，预览中的印记会保持当前节奏。</p></form>
    <section class="parameter-studio__preview" aria-labelledby="studio-preview"><div class="parameter-studio__section-heading"><h2 id="studio-preview">落印预览</h2><MTag :tone="snapshot.progress === 1 ? 'success' : 'info'">{{ snapshot.progress === 1 ? '印记已成' : snapshot.playing ? '正在归印' : '静候落印' }}</MTag></div><div class="parameter-studio__canvas-wrap"><canvas ref="canvas" width="800" height="520" role="img" aria-label="机械合轨与朱砂成章印记"></canvas><div class="parameter-studio__canvas-caption" aria-hidden="true"><span>成章 / SEAL</span><span>{{ Math.round(snapshot.progress * 100) }}%</span></div></div><p class="parameter-studio__phase">{{ phaseNames[snapshot.phase] }}</p><MSlider :model-value="snapshot.time" label="编排进度" :min="0" :max="3.6" :step="0.01" :show-value="false" @update:model-value="seek"/><div class="parameter-studio__transport"><MButton variant="secondary" @click="toggle">{{ snapshot.playing ? '暂停编排' : '播放编排' }}</MButton><MButton variant="ghost" @click="replay">重播</MButton><MButton variant="ghost" @click="seek(3.6)">查看落印</MButton><span>{{ snapshot.time.toFixed(2) }} / 3.60s</span></div><p v-if="reduced" class="parameter-studio__muted">减少动态效果：直接显示完成态，也可以拖动进度静态查看各阶段。</p><MDescriptions :items="details" label="已应用参数"/></section></div><footer class="parameter-studio__footer"><span aria-hidden="true">↳</span><p>当前参数只保留在本次演示中，刷新后恢复初始预设。</p></footer><MToastViewport><MToast v-model="toast" title="印记已成" :description="toastText" variant="success" :duration="6000"/></MToastViewport></main>`,
});
const meta = { title:'开始/归印调校台',component:ParameterStudio,parameters:{layout:'fullscreen',controls:{disable:true}},render:(_args,context)=>defineComponent({components:{ParameterStudio},setup:()=>({motionProfile:computed(()=>context.globals.motion)}),template:'<ParameterStudio :motion-profile="motionProfile" />'}) } satisfies Meta<typeof ParameterStudio>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = { name:'调参 · 合轨 · 成章' };
