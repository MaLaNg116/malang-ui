import { computed, defineComponent, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { MButton, MCard, MCheckbox, MDescriptions, MInput, MRadioGroup, MResult, MSkeleton, MSlider, MSpinner, MStatistic, MSwitch, MTag, useReducedMotion } from '../src';
import type { MDescriptionItem } from '../src';
import { createWeaveSequence } from '../src/motion';
import type { WeaveSequenceController, WeaveSequenceState } from '../src/motion';
import './PaletteStudio.css';

type Palette = 'paper' | 'celadon' | 'gilt';
type Theme = 'light' | 'dark';
interface PaletteRecord { id: number; name: string; note: string; palette: Palette; theme: Theme; materialNotes: boolean }
const paletteNames: Record<Palette, string> = { paper: '宣纸 · 朱砂', celadon: '青瓷 · 冷玉', gilt: '绢素 · 鎏金' };
const paletteOptions = [
  { value: 'paper', label: paletteNames.paper },
  { value: 'celadon', label: paletteNames.celadon },
  { value: 'gilt', label: paletteNames.gilt },
];
const phaseNames = { lay: '铺经 · 细轨列阵', cross: '穿纬 · 墨线往来', weave: '织光 · 经纬交错', rest: '归序 · 织印成面' };
const validPalette = (value: string): Palette => value === 'celadon' || value === 'gilt' ? value : 'paper';
const validTheme = (value: string): Theme => value === 'dark' ? 'dark' : 'light';
const PaletteStudio = defineComponent({
  props: { globalTheme: { type: String, default: 'light' }, globalPalette: { type: String, default: 'paper' }, motionProfile: { type: String, default: 'standard' } },
  components: { MButton, MCard, MCheckbox, MDescriptions, MInput, MRadioGroup, MResult, MSkeleton, MSlider, MSpinner, MStatistic, MSwitch, MTag },
  setup(props) {
    const theme = ref<Theme>(validTheme(props.globalTheme)); const palette = ref<Palette>(validPalette(props.globalPalette));
    const paletteValue = computed({ get: () => palette.value, set: (value: string) => { palette.value = validPalette(value); } });
    const dark = computed({ get: () => theme.value === 'dark', set: (value: boolean) => { theme.value = value ? 'dark' : 'light'; } });
    const name = ref('纸墨 · 初样'), note = ref('让光停在纸上。'), materialNotes = ref(true), keepNote = ref(true);
    const records = ref<PaletteRecord[]>([]), attempted = ref(false), announceResult = ref(false);
    const form = ref<HTMLFormElement>(), canvas = ref<HTMLCanvasElement>();
    const systemMotion = useReducedMotion(); const reduced = computed(() => props.motionProfile === 'reduced' || systemMotion.value);
    const motion = shallowRef<WeaveSequenceState>({ time: 0, duration: 4.2, progress: 0, phase: 'lay', playing: false, reducedMotion: false, disposed: false });
    let controller: WeaveSequenceController | undefined; let mounted = false, generation = 0, recordId = 0;
    const nameError = computed(() => attempted.value && !name.value.trim() ? '请填写方案名称。' : '');
    const paletteLabel = computed(() => paletteNames[palette.value]);
    const themeLabel = computed(() => theme.value === 'dark' ? '浓墨深色' : '纸面浅色');
    const phase = computed(() => phaseNames[motion.value.phase]);
    const latest = computed(() => records.value[0]);
    const resultTitle = computed(() => latest.value ? '试色方案已记下。' : '一纸初样，等待记录。');
    const resultDescription = computed(() => latest.value ? `第 ${records.value.length} 份本页记录：${latest.value.name} · ${paletteNames[latest.value.palette]} · ${latest.value.theme === 'dark' ? '浓墨深色' : '纸面浅色'}。` : '调整纸面、文字与控件，确认这份方案后再记录并验印。');
    const details = computed<MDescriptionItem[]>(() => [
      { key: 'name', label: '方案名称', value: latest.value?.name || '尚未记录' },
      { key: 'palette', label: '局部配色', value: latest.value ? paletteNames[latest.value.palette] : '—' },
      { key: 'theme', label: '纸面模式', value: latest.value ? latest.value.theme === 'dark' ? '浓墨深色' : '纸面浅色' : '—' },
      { key: 'note', label: '留存备注', value: latest.value?.note || '未留存备注', span: 2 },
    ]);
    function createMotion() {
      if (!mounted || !canvas.value) return;
      const previous = controller?.state, token = ++generation;
      controller?.dispose();
      controller = createWeaveSequence(canvas.value, { reducedMotion: reduced.value, onUpdate: state => { if (mounted && token === generation) motion.value = state; } });
      if (previous && !reduced.value) { controller.seek(previous.time); if (previous.playing) controller.play(); }
    }
    function focusName() { form.value?.querySelector<HTMLInputElement>('input[name="schemeName"]')?.focus({ preventScroll: false }); }
    function record() {
      attempted.value = true;
      if (!name.value.trim()) { focusName(); return; }
      records.value = [{ id: ++recordId, name: name.value.trim(), note: keepNote.value ? note.value.trim() : '', palette: palette.value, theme: theme.value, materialNotes: materialNotes.value }, ...records.value];
      announceResult.value = true; controller?.replay();
    }
    async function reset(event: MouseEvent) {
      const button = event.currentTarget as HTMLButtonElement | null;
      const restoreFocus = Boolean(button && (button === button.ownerDocument.activeElement || button.contains(button.ownerDocument.activeElement)));
      name.value = ''; note.value = ''; records.value = []; attempted.value = false; announceResult.value = false; recordId = 0;
      materialNotes.value = true; keepNote.value = true; theme.value = validTheme(props.globalTheme); palette.value = validPalette(props.globalPalette);
      controller?.pause(); controller?.seek(reduced.value ? controller.duration : 0);
      await nextTick(); if (mounted && restoreFocus) focusName();
    }
    function longSample() { name.value = 'ArchivePaletteDraftWithoutArtificialClipping'; note.value = '让一段很长的说明也保有呼吸。ArchivePaletteNoteWithoutArtificialTruncation'.repeat(3); }
    function toggleMotion() { if (motion.value.playing) controller?.pause(); else controller?.play(); }
    function seek(value: number) { controller?.pause(); controller?.seek(value); }
    watch(() => props.globalTheme, value => { theme.value = validTheme(value); });
    watch(() => props.globalPalette, value => { palette.value = validPalette(value); });
    watch(reduced, () => { createMotion(); });
    onMounted(() => { mounted = true; createMotion(); });
    onBeforeUnmount(() => { mounted = false; generation++; controller?.dispose(); });
    return { theme, palette, paletteValue, dark, name, note, materialNotes, keepNote, records, form, canvas, reduced, motion, phase, nameError, paletteLabel, themeLabel, latest, details, resultTitle, resultDescription, announceResult, paletteOptions, paletteNames, record, reset, longSample, focusName, toggleMotion, seek, replay: () => controller?.replay(), final: () => seek(4.2) };
  },
  template: `<main class="palette-studio" :data-ui-theme="theme" :data-ui-palette="palette" :data-ui-motion="reduced ? 'reduced' : 'standard'">
    <header class="palette-studio__hero"><div><p class="palette-studio__eyebrow">MALANG / PAPER & PIGMENT</p><h1>纸上有光，墨中藏锋。</h1><p class="palette-studio__intro">让一张纸有温度，让一抹色有分寸。留下手边草稿，换一层光，再看字与器如何相处。</p></div><div class="palette-studio__identity"><MTag tone="info">{{ paletteLabel }}</MTag><span>{{ themeLabel }}</span></div></header>
    <div class="palette-studio__metrics"><MStatistic label="公开组件" :value="41" unit="个" description="统一使用 M 前缀的公开组件。"/><MStatistic label="Canvas MG" :value="6" unit="套" description="独立编排，可暂停与静态定位。" tone="info"/><MStatistic label="本页记录" :value="records.length" unit="份" description="仅计算本页实际记录的方案。"/></div>
    <div class="palette-studio__workspace"><aside class="palette-studio__editor"><MCard as="section" title="调一纸颜色" description="配色切换保留手边的输入与选项。"><form ref="form" class="palette-studio__form" @submit.prevent="record"><MRadioGroup v-model="paletteValue" :options="paletteOptions" label="局部配色"/><MSwitch v-model="dark" label="深色试映" hint="深色保持浓墨，浅色保留所选纸面。"/><MInput v-model="name" label="方案名称" name="schemeName" required :error="nameError" placeholder="为这张试色纸取一个名字"/><MInput v-model="note" label="试色备注" name="schemeNote" placeholder="留下一句对纸面与光的感受"/><MSwitch v-model="materialNotes" label="显示材质说明"/><MCheckbox v-model="keepNote" label="记录时保留备注"/><div class="palette-studio__form-actions"><MButton type="submit">记录并验印 <span aria-hidden="true">↗</span></MButton><MButton type="button" variant="secondary" @click="longSample">载入长文样本</MButton><MButton type="button" variant="ghost" @click="focusName">聚焦方案名称</MButton></div></form></MCard></aside>
      <section class="palette-studio__preview" aria-label="试色预览"><div class="palette-studio__materials" role="group" aria-label="纸面三层"><div class="palette-studio__material palette-studio__material--canvas"><span>01 / 底纸</span><strong>承托留白</strong></div><div class="palette-studio__material palette-studio__material--surface"><span>02 / 浮纸</span><strong>承托内容</strong></div><div class="palette-studio__material palette-studio__material--muted"><span>03 / 静层</span><strong>收住细节</strong></div></div><p v-show="materialNotes" class="palette-studio__material-note">底纸、浮纸与静层以明度分出层次；主色负责动作，副色留作呼应，朱砂刻印独立保留。</p>
        <div class="palette-studio__swatches" role="group" aria-label="色彩关系"><figure><span class="palette-studio__swatch palette-studio__swatch--primary" aria-hidden="true"></span><figcaption>主色</figcaption></figure><figure><span class="palette-studio__swatch palette-studio__swatch--secondary" aria-hidden="true"></span><figcaption>副色</figcaption></figure><figure><span class="palette-studio__swatch palette-studio__swatch--seal" aria-hidden="true"></span><figcaption>朱砂刻印</figcaption></figure></div>
        <section class="palette-studio__weave" aria-label="织光试色预览"><div class="palette-studio__section-heading"><h2>经纬之间，见一层光。</h2><span>WEAVE / 4.20s</span></div><canvas ref="canvas" class="palette-studio__canvas" role="img" aria-label="纸墨配色下的经纬织光">可播放、暂停与静态定位的经纬织光。</canvas><div class="palette-studio__weave-controls"><div class="palette-studio__phase"><span>{{ phase }}</span><span aria-hidden="true">{{ motion.time.toFixed(2) }} / 4.20 s</span></div><MSlider :model-value="motion.time" label="织光预览进度" :min="0" :max="4.2" :step="0.01" :show-value="false" :aria-valuetext="motion.time.toFixed(2)+' 秒，共 4.2 秒；'+phase" @update:model-value="seek"/><div class="palette-studio__motion-actions"><MButton type="button" @click="toggleMotion">{{ reduced ? '查看静态织印' : motion.playing ? '暂停织光' : '播放织光' }}</MButton><MButton type="button" variant="secondary" @click="replay">重播织光</MButton><MButton type="button" variant="ghost" @click="final">定位完整织印</MButton></div><p v-if="reduced" class="palette-studio__muted">减少动态效果：显示完整静态织印，也可拖动进度查看结构。</p></div></section>
        <MCard as="section" title="载入姿态" description="两种加载状态的局部试色样本。"><div class="palette-studio__loading"><div><MSpinner label="旋转错层加载演示" size="lg"/><span>旋转错层示意</span></div><div><p>马赛克骨架示意</p><MSkeleton :lines="3"/></div></div></MCard>
      </section></div>
    <section class="palette-studio__records" aria-label="试色记录"><MResult :title="resultTitle" :description="resultDescription" :status="latest ? 'success' : 'info'" :announce="announceResult"><p>方案只保留在当前页面。记录会保存当时的配色、纸面、选项与勾选的备注；切换颜色可继续编辑下一份草稿。</p><template #footer><MButton type="button" variant="secondary" @click="reset">还原试色台</MButton></template></MResult><div class="palette-studio__record-details"><MDescriptions :items="details" label="最近记录"/><ol v-if="records.length" aria-label="本页试色记录"><li v-for="item in records" :key="item.id"><strong>{{ item.name }}</strong><span>{{ paletteNames[item.palette] }} · {{ item.theme === 'dark' ? '浓墨深色' : '纸面浅色' }} · {{ item.materialNotes ? '附材质说明' : '精简说明' }}</span></li></ol><p v-else class="palette-studio__muted">本页尚无记录。</p></div></section>
  </main>`,
});
const meta = {
  title: '开始/纸墨试色台', component: PaletteStudio, parameters: { layout: 'fullscreen', controls: { disable: true } },
  render: (_args, context) => defineComponent({ components: { PaletteStudio }, setup: () => ({ globalTheme: computed(() => context.globals.theme), globalPalette: computed(() => context.globals.palette), motionProfile: computed(() => context.globals.motion) }), template: '<PaletteStudio :global-theme="globalTheme" :global-palette="globalPalette" :motion-profile="motionProfile" />' }),
} satisfies Meta<typeof PaletteStudio>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = { name: '择纸 · 试色 · 验印' };
