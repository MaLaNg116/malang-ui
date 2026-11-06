<script setup lang="ts">
import { computed, ref } from 'vue';
import { MButton, MIcon, MSegmented, useMTransition } from '../../../src';
import CodeBlock from '../components/CodeBlock.vue';
import MotionExhibit from '../components/MotionExhibit.vue';

const exhibits = [
  { value: 'brand', label: '品牌开场' },
  { value: 'ink', label: '墨迹切面' },
  { value: 'weave', label: '经纬织光' },
  { value: 'seal', label: '成功落印' },
  { value: 'orbit', label: '轨道构形' },
] as const;
const selected = ref('brand');
const kind = computed(() => exhibits.find(item => item.value === selected.value)?.value ?? 'brand');

interface Note { id: number; title: string; detail: string }
const notes = ref<Note[]>([
  { id: 1, title: '补一笔墨迹', detail: '调整留白与笔触。' },
  { id: 2, title: '核对字标', detail: '确认字样与对齐。' },
  { id: 3, title: '归档一份纹样', detail: '保存经纬构形。' },
]);
const notice = ref('现有 3 条记录。');
const addButton = ref<InstanceType<typeof MButton>>();
const { transition, moveClass } = useMTransition({
  preset: 'reveal',
  group: true,
  focusTarget: () => addButton.value?.$el ?? null,
});
let nextNote = 4;

function addNote() {
  const id = nextNote++;
  notes.value = [...notes.value, { id, title: '手记 ' + String(id).padStart(2, '0'), detail: '刚添加到此刻的清单。' }];
  notice.value = '已新增一条手记。现有 ' + notes.value.length + ' 条记录。';
}

function removeNote(note: Note) {
  notes.value = notes.value.filter(item => item.id !== note.id);
  notice.value = '已移除「' + note.title + '」。现有 ' + notes.value.length + ' 条记录。';
}

function reverseNotes() {
  if (notes.value.length < 2) return;
  notes.value = [...notes.value].reverse();
  notice.value = '已倒序排列 ' + notes.value.length + ' 条记录。';
}

const example = [
  '<script setup lang="ts">',
  "import { onBeforeUnmount, onMounted, ref } from 'vue'",
  "import { createWeaveSequence, type WeaveSequenceController } from 'malang-ui/motion'",
  '',
  'const canvas = ref<HTMLCanvasElement>()',
  'let weave: WeaveSequenceController | undefined',
  '',
  'onMounted(() => {',
  '  if (!canvas.value) return',
  "  weave = createWeaveSequence(canvas.value, { reducedMotion: 'system' })",
  '  weave.seek(weave.duration)',
  '})',
  'onBeforeUnmount(() => weave?.dispose())',
  'const replay = () => weave?.replay()',
  '</' + 'script>',
  '',
  '<template>',
  '  <canvas ref="canvas" aria-label="经纬织光" role="img"',
  '    style="display: block; width: 100%; aspect-ratio: 760 / 430" />',
  '  <button type="button" @click="replay">重播织光</button>',
  '</template>',
].join('\n');

</script>

<template>
  <article class="site-motion-page">
    <header class="site-motion-intro">
      <p class="site-motion-kicker"><span>02</span> 动效展厅 / MOTION</p>
      <h1 aria-label="让界面，有起落。">让界面，<br />有起落<span>。</span></h1>
      <p class="site-motion-intro__lead">墨迹有起势，器物有归位。把这一点节奏留给界面里真实发生的变化。</p>
    </header>

    <section class="site-motion-section" aria-labelledby="site-motion-gallery-title">
      <header class="site-motion-section__heading">
        <div>
          <p class="site-motion-kicker">01 / 构形</p>
          <h2 id="site-motion-gallery-title">五种构形，逐帧细看。</h2>
        </div>
        <p>选一幅画面开始播放。也可以沿刻度前后找一帧，慢慢看清线条怎样合拢。</p>
      </header>
      <MSegmented v-model="selected" class="site-motion-picker" :options="exhibits" label="选择 MG 动效" />
      <MotionExhibit :kind="kind" />
    </section>

    <section class="site-motion-section" aria-labelledby="site-motion-operations-title">
      <header class="site-motion-section__heading">
        <div>
          <p class="site-motion-kicker">02 / 操作</p>
          <h2 id="site-motion-operations-title">增删，也有章法。</h2>
        </div>
        <p>加一条手记、删一条，或把它们倒过来。记录随操作立即更新，位移帮你看清每条去了哪里。</p>
      </header>
      <div class="site-motion-playground">
        <div class="site-motion-playground__bar">
          <div class="site-motion-playground__actions">
            <MButton ref="addButton" size="sm" @click="addNote"><MIcon name="plus" /> 新增手记</MButton>
            <MButton size="sm" variant="secondary" :disabled="notes.length < 2" @click="reverseNotes">倒序排列</MButton>
          </div>
          <p role="status">{{ notice }}</p>
        </div>
        <TransitionGroup
          tag="ul"
          class="site-motion-notes ui-transition-group"
          aria-label="手记记录"
          v-bind="transition"
          :move-class="moveClass"
        >
          <li v-for="note in notes" :key="note.id" class="site-motion-note">
            <span class="site-motion-note__number" aria-hidden="true">{{ String(note.id).padStart(2, '0') }}</span>
            <div class="site-motion-note__copy">
              <strong>{{ note.title }}</strong>
              <p>{{ note.detail }}</p>
            </div>
            <MButton size="sm" variant="ghost" :aria-label="'移除' + note.title" @click="removeNote(note)">
              <MIcon name="close" /> 移除
            </MButton>
          </li>
        </TransitionGroup>
        <p v-if="!notes.length" class="site-motion-notes__empty">手记已清空，可以再添一条。</p>
      </div>
    </section>

    <section class="site-motion-section site-motion-section--integration" aria-labelledby="site-motion-code-title">
      <header class="site-motion-section__heading">
        <div>
          <p class="site-motion-kicker">03 / 接入</p>
          <h2 id="site-motion-code-title">带一段动效回去。</h2>
        </div>
        <p>MG 工厂从 <code>malang-ui/motion</code> 单独导入。页面的短过渡可以从主入口使用 <code>useMTransition</code>。</p>
      </header>
      <CodeBlock :code="example" language="Vue" filename="MotionPreview.vue" />
    </section>
  </article>
</template>
