<script setup lang="ts">
import { computed, onBeforeUnmount, onDeactivated, onMounted, ref, shallowRef, watch } from 'vue';
import { MButton, MIcon, MSlider, useMConfig, useReducedMotion } from '../../../src';
import '../styles/motion-view.css';

type Kind = 'brand' | 'ink' | 'weave' | 'seal' | 'orbit';
interface SequenceState {
  readonly time: number;
  readonly duration: number;
  readonly phase: string;
  readonly playing: boolean;
}
interface SequenceController {
  readonly duration: number;
  readonly state: SequenceState;
  play(): void;
  pause(): void;
  seek(seconds: number): void;
  replay(): void;
  dispose(): void;
}
type SequenceFactory = (canvas: HTMLCanvasElement, options: {
  reducedMotion: boolean;
  onUpdate: (state: SequenceState) => void;
}) => SequenceController;
interface Artwork {
  number: string;
  inscription: string;
  title: string;
  description: string;
  alternative: string;
  phases: Record<string, string>;
}

const props = withDefaults(defineProps<{ kind?: Kind; compact?: boolean; autoplay?: boolean }>(), {
  kind: 'brand',
  compact: false,
  autoplay: false,
});

const factories: Record<Kind, () => Promise<SequenceFactory>> = {
  brand: () => import('../../../src/motion/brandSequence').then(module => module.createBrandSequence),
  ink: () => import('../../../src/motion/inkSequence').then(module => module.createInkSequence),
  weave: () => import('../../../src/motion/weaveSequence').then(module => module.createWeaveSequence),
  seal: () => import('../../../src/motion/sealSequence').then(module => module.createSealSequence),
  orbit: () => import('../../../src/motion/orbitSequence').then(module => module.createOrbitSequence),
};

const artworks: Record<Kind, Artwork> = {
  brand: {
    number: '01', inscription: 'IDENTITY', title: '品牌开场',
    description: '青玉轨道聚合，干墨成骨。朱砂划开一道切面，显出 MaLang 字标。',
    alternative: '青玉轨道与干墨汇合，显露 MALANG UI 品牌字标',
    phases: { gather: '聚轨', carve: '刻骨', reveal: '显字', rest: '归定' },
  },
  ink: {
    number: '02', inscription: 'INK CUT', title: '墨迹切面',
    description: '笔势先蓄后发，在纸上留下干湿相间的笔触与清晰的切面。',
    alternative: '干墨笔触穿过几何切面，落成一幅墨迹',
    phases: { gather: '蓄势', cut: '疾出', assemble: '收锋', complete: '归位' },
  },
  weave: {
    number: '03', inscription: 'WEAVE', title: '经纬织光',
    description: '经线铺开，纬线穿行。微光越过交点，归入完整的丝面织印。',
    alternative: '经纬丝线交织，青玉与朱砂汇成几何织印',
    phases: { lay: '铺经', cross: '穿纬', weave: '织光', rest: '归序' },
  },
  seal: {
    number: '04', inscription: 'VERMILION SEAL', title: '成功落印',
    description: '四向夹具合轨，朱砂随印面落下。墨纹渐止，一笔有了落款。',
    alternative: '机械夹具聚合，留下朱砂成章印记',
    phases: { gather: '蓄印', align: '合轨', stamp: '落印', settle: '回响' },
  },
  orbit: {
    number: '05', inscription: 'ORBIT', title: '轨道构形',
    description: '轨道环绕、校准并归位，让原本散开的构件显出秩序。',
    alternative: '多道机械轨线与构件环绕汇合',
    phases: { gather: '聚轨', shape: '构形', respond: '响应', complete: '归位' },
  },
};

const canvas = ref<HTMLCanvasElement>();
const state = shallowRef<SequenceState>();
const ready = ref(false);
const unavailable = ref(false);
const { config } = useMConfig();
const systemReduced = useReducedMotion();
const reduced = computed(() => systemReduced.value || config.value.motion === 'reduced');
const artwork = computed(() => artworks[props.kind]);
const phase = computed(() => state.value ? artwork.value.phases[state.value.phase] : undefined);
const time = computed(() => state.value ? `${state.value.time.toFixed(2)} / ${state.value.duration.toFixed(2)} s` : '—');
const status = computed(() => {
  if (unavailable.value) return '预览暂不可用';
  if (!ready.value) return '静态预览';
  if (reduced.value) return '减少动态效果';
  if (state.value?.playing) return '播放中';
  return state.value && state.value.time < state.value.duration ? '已暂停' : '完整构形';
});

let controller: SequenceController | undefined;
let installedKind: Kind | undefined;
let mounted = false;
let generation = 0;
let firstArtwork = true;

function visibleOnPage(element: HTMLCanvasElement) {
  const owner = element.ownerDocument;
  const viewport = owner.defaultView;
  if (!viewport || owner.hidden) return false;
  const box = element.getBoundingClientRect();
  return box.width > 0 && box.height > 0 &&
    box.top < viewport.innerHeight && box.bottom > 0 &&
    box.left < viewport.innerWidth && box.right > 0;
}

async function loadArtwork() {
  const element = canvas.value;
  if (!mounted || !element) return;
  const ticket = ++generation;
  const kind = props.kind;
  const prefersStill = reduced.value;
  const lastPosition = installedKind === kind && !prefersStill ? controller?.state.time : undefined;
  controller?.dispose();
  controller = undefined;
  ready.value = false;
  unavailable.value = false;
  state.value = undefined;
  try {
    const create = await factories[kind]();
    if (!mounted || ticket !== generation || canvas.value !== element) return;
    controller = create(element, {
      reducedMotion: prefersStill,
      onUpdate(next) {
        if (mounted && ticket === generation) state.value = next;
      },
    });
    installedKind = kind;
    const playOpening = firstArtwork && props.autoplay && !prefersStill && visibleOnPage(element);
    firstArtwork = false;
    if (playOpening) controller.replay();
    else controller.seek(lastPosition ?? controller.duration);
    ready.value = true;
  } catch {
    if (!mounted || ticket !== generation) return;
    controller?.dispose();
    controller = undefined;
    unavailable.value = true;
  }
}

function canPlay() {
  return ready.value && !reduced.value && !canvas.value?.ownerDocument.hidden;
}

function togglePlayback() {
  if (!controller) return;
  if (controller.state.playing) controller.pause();
  else if (canPlay()) {
    if (props.compact) controller.replay();
    else controller.play();
  }
}

function replay() {
  if (canPlay()) controller?.replay();
}

function seek(value: number) {
  if (!controller || !Number.isFinite(value)) return;
  controller.pause();
  controller.seek(Math.min(controller.duration, Math.max(0, value)));
}

function showFinal() {
  if (controller) seek(controller.duration);
}

onMounted(() => {
  mounted = true;
  void loadArtwork();
});
watch(() => [props.kind, reduced.value], () => { void loadArtwork(); }, { flush: 'post' });
onDeactivated(() => controller?.pause());
onBeforeUnmount(() => {
  mounted = false;
  generation++;
  controller?.dispose();
  controller = undefined;
});
</script>

<template>
  <section
    class="site-motion-exhibit"
    :class="{ 'site-motion-exhibit--compact': compact }"
    :aria-label="artwork.title + '预览'"
    :data-motion-exhibit="kind"
    :data-motion-ready="ready || undefined"
  >
    <div class="site-motion-stage" :data-ready="ready || undefined">
      <canvas
        ref="canvas"
        class="site-motion-canvas"
        width="760"
        height="560"
        role="img"
        :aria-label="artwork.alternative"
        :aria-hidden="!ready || undefined"
      />
      <div v-if="!ready" class="site-motion-poster">
        <strong v-if="kind === 'brand'">MALANG <span>UI</span></strong>
        <strong v-else>{{ artwork.title }}</strong>
      </div>
      <span class="site-motion-stage__edition" aria-hidden="true">{{ artwork.number }} / {{ artwork.inscription }}</span>
      <span class="site-motion-stage__mark" aria-hidden="true">墨</span>
    </div>

    <div v-if="compact" class="site-motion-compact-actions">
      <span class="site-motion-exhibit-status" role="status">{{ status }}</span>
      <MButton variant="ghost" size="sm" :disabled="!ready || reduced" @click="togglePlayback">
        <MIcon name="refresh" />
        {{ state?.playing ? '暂停开场' : '重播开场' }}
      </MButton>
    </div>
    <div v-else class="site-motion-controls">
      <p class="site-motion-kicker">{{ artwork.number }} / {{ artwork.inscription }}</p>
      <h3>{{ artwork.title }}</h3>
      <p class="site-motion-controls__description">{{ artwork.description }}</p>
      <div class="site-motion-controls__reading">
        <span class="site-motion-exhibit-status" role="status">{{ status }}</span>
        <span class="site-motion-time" data-motion-time aria-hidden="true">{{ time }}</span>
      </div>
      <MSlider
        label="动画时间"
        :model-value="state?.time ?? 0"
        :max="state?.duration ?? 5"
        :step="0.01"
        :show-value="false"
        :disabled="!ready"
        @update:model-value="seek"
      />
      <p v-if="phase" class="site-motion-phase">当前刻度 <strong>{{ phase }}</strong></p>
      <div class="site-motion-controls__actions">
        <MButton size="sm" :disabled="!ready || reduced" @click="togglePlayback">{{ state?.playing ? '暂停动画' : '播放动画' }}</MButton>
        <MButton size="sm" variant="secondary" :disabled="!ready || reduced" @click="replay">重播动画</MButton>
        <MButton size="sm" variant="ghost" :disabled="!ready" @click="showFinal">查看终态</MButton>
      </div>
    </div>
  </section>
</template>
