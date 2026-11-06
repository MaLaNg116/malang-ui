<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue';
import CodeBlock from '../components/CodeBlock.vue';
import ComponentExamples from '../components/ComponentExamples.vue';
import { componentApi } from '../data/api';
import { componentCatalog, componentCategories, workbenchUrl } from '../data/catalog';
import '../styles/components-view.css';

const props = defineProps<{
  componentName?: string;
  theme: 'light' | 'dark';
  palette: string;
  motion: 'standard' | 'reduced';
}>();

const query = ref('');
const category = ref('');
const heading = ref<HTMLHeadingElement | null>(null);
const searchId = useId();
const storySelectorId = useId();
const active = computed(() => componentCatalog.find((item) => item.name === props.componentName));
const normalize = (value: string) => value.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
const searchIndex = componentCatalog.map((item) => ({
  item,
  terms: [item.name, item.label, item.category, item.description, ...item.keywords].map(normalize),
}));
const searchTerms = computed(() => query.value.trim().split(/\s+/).map(normalize).filter(Boolean));
const matches = computed(() => searchIndex.filter(({ item, terms }) => (
  (!category.value || item.category === category.value)
  && searchTerms.value.every((term) => terms.some((word) => word.includes(term)))
)).map(({ item }) => item));
const sections = computed(() => componentCategories.map((name) => ({
  name,
  items: matches.value.filter((item) => item.category === name),
})).filter((section) => section.items.length));
const sidebarItems = computed(() => active.value && !category.value && !searchTerms.value.length
  ? matches.value.filter((item) => item.category === active.value?.category)
  : matches.value);

const href = (name: string) => `#/components/${name}`;
const sourceUrl = computed(() => active.value ? `https://github.com/MaLaNg116/malang-ui/blob/main/${active.value.source}` : '');
const docsUrl = computed(() => active.value?.docsId
  ? workbenchUrl(active.value.docsId, 'docs', props.theme, props.palette, props.motion)
  : '');
const api = computed(() => active.value && componentApi[active.value.name]);
const hasExamples = computed(() => active.value?.name === 'MButton' || active.value?.name === 'MInput');
const docSections = computed(() => [
  ...(hasExamples.value ? [{ id: 'catalog-examples', label: '常用示例' }] : []),
  { id: 'catalog-story', label: '更多示例' },
  { id: 'catalog-api', label: 'API 参考' },
  { id: 'catalog-related', label: '相关组件' },
]);
const currentSection = ref(docSections.value[0]?.id);
let sectionFrame: number | undefined;
let jumpPosition: number | undefined;

const activeIndex = computed(() => componentCatalog.findIndex((item) => item.name === active.value?.name));
const previousComponent = computed(() => componentCatalog[activeIndex.value - 1]);
const nextComponent = computed(() => componentCatalog[activeIndex.value + 1]);
const relatedNames: Record<string, string[]> = {
  MButton: ['MIcon', 'MInput', 'MFloatButton'],
  MInput: ['MTextarea', 'MInputNumber', 'MForm'],
};
const relatedComponents = computed(() => {
  if (!active.value) return [];
  const names = relatedNames[active.value.name];
  if (names) return names.flatMap((name) => componentCatalog.filter((item) => item.name === name));
  return componentCatalog.filter((item) => item.category === active.value?.category && item !== active.value).slice(0, 3);
});

function jumpTo(id: string) {
  const target = document.getElementById(id);
  if (!target) return;
  currentSection.value = id;
  target.scrollIntoView({ block: 'start', behavior: 'instant' });
  target.focus({ preventScroll: true });
  jumpPosition = window.scrollY;
}

function scheduleSectionUpdate() {
  if (!active.value || sectionFrame !== undefined) return;
  sectionFrame = requestAnimationFrame(() => {
    sectionFrame = undefined;
    if (jumpPosition === window.scrollY) return;
    jumpPosition = undefined;
    const headings = docSections.value.flatMap(({ id }) => document.getElementById(id) ?? []);
    if (!headings.length) return;
    const marker = (Number.parseFloat(getComputedStyle(headings[0]!).scrollMarginBlockStart) || 0) + 8;
    const atEnd = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;
    const last = headings.at(-1)!;
    if (atEnd && last.getBoundingClientRect().top < window.innerHeight * .65) {
      currentSection.value = last.id;
      return;
    }
    let current = headings[0]!;
    for (const heading of headings) {
      if (heading.getBoundingClientRect().top > marker) break;
      current = heading;
    }
    currentSection.value = current.id;
  });
}

const storyId = ref('');
const previewUrl = computed(() => storyId.value
  ? workbenchUrl(storyId.value, 'story', props.theme, props.palette, props.motion)
  : '');
const previewSize = computed(() => {
  if (active.value?.name === 'MInput') return 'field';
  if (active.value?.name === 'MButton') return storyId.value.endsWith('--variants-and-sizes') ? 'matrix' : 'compact';
  return 'regular';
});
const stage = ref<HTMLElement | null>(null);
const frame = ref<HTMLIFrameElement | null>(null);
const nearViewport = ref(false);
const attempt = ref(0);
const frameState = ref<'loading' | 'ready' | 'error'>('loading');
let observer: IntersectionObserver | undefined;
let readinessTimer: number | undefined;

function clearReadinessTimer() {
  if (readinessTimer !== undefined) window.clearTimeout(readinessTimer);
  readinessTimer = undefined;
}

function finishPreview(state: 'ready' | 'error') {
  clearReadinessTimer();
  frameState.value = state;
}

function receivePreviewMessage(message: MessageEvent) {
  if (!previewUrl.value || message.source !== frame.value?.contentWindow
    || message.origin !== new URL(previewUrl.value, document.baseURI).origin) return;
  let channel: { key?: string; event?: { type?: string; args?: unknown[] } };
  try {
    channel = typeof message.data === 'string' ? JSON.parse(message.data) : message.data;
  } catch {
    return;
  }
  if (channel?.key !== 'storybook-channel') return;
  const event = channel.event;
  if (event?.type === 'storyRendered' && event.args?.[0] === storyId.value) {
    finishPreview('ready');
  } else if (['storyMissing', 'storyErrored', 'storyThrewException'].includes(event?.type ?? '')) {
    finishPreview('error');
  }
}

watch(active, (item) => {
  storyId.value = item?.storyId ?? '';
}, { immediate: true });

watch(() => props.componentName, async () => {
  jumpPosition = undefined;
  currentSection.value = docSections.value[0]?.id;
  await nextTick();
  heading.value?.focus();
  scheduleSectionUpdate();
});

watch(stage, (element) => {
  observer?.disconnect();
  nearViewport.value = false;
  if (!element) return;
  if (!('IntersectionObserver' in window)) {
    nearViewport.value = true;
    return;
  }
  observer = new IntersectionObserver((entries, current) => {
    if (!entries.some((entry) => entry.isIntersecting)) return;
    nearViewport.value = true;
    current.disconnect();
  }, { rootMargin: '180px' });
  observer.observe(element);
});

watch([nearViewport, previewUrl, attempt], ([near, url]) => {
  clearReadinessTimer();
  frameState.value = 'loading';
  if (near && url) readinessTimer = window.setTimeout(() => finishPreview('error'), 20_000);
});

onMounted(() => {
  window.addEventListener('message', receivePreviewMessage);
  window.addEventListener('scroll', scheduleSectionUpdate, { passive: true });
  window.addEventListener('resize', scheduleSectionUpdate);
  scheduleSectionUpdate();
});
onBeforeUnmount(() => {
  observer?.disconnect();
  clearReadinessTimer();
  if (sectionFrame !== undefined) cancelAnimationFrame(sectionFrame);
  window.removeEventListener('scroll', scheduleSectionUpdate);
  window.removeEventListener('resize', scheduleSectionUpdate);
  window.removeEventListener('message', receivePreviewMessage);
});
</script>

<template>
  <section class="catalog-view" aria-labelledby="component-page-heading">
    <aside class="catalog-view__sidebar" aria-label="组件筛选">
      <p class="catalog-view__eyebrow">CATALOG / 组件索引</p>
      <label :for="searchId" class="catalog-view__search-label">搜索组件</label>
      <div class="catalog-view__search">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" aria-hidden="true">
          <circle cx="6.5" cy="6.5" r="4" /><path d="m9.5 9.5 4 4" />
        </svg>
        <input :id="searchId" v-model="query" type="search" placeholder="名称、分类或用途" autocomplete="off" />
      </div>
      <nav class="catalog-view__categories" aria-label="组件分类">
        <button type="button" :aria-pressed="!category" @click="category = ''">全部组件</button>
        <button v-for="name in componentCategories" :key="name" type="button" :aria-pressed="category === name" @click="category = name">{{ name }}</button>
      </nav>
      <nav
        v-if="active"
        class="catalog-view__side-results"
        :class="{ 'catalog-view__side-results--filtered': query.trim() || category }"
        aria-label="相关组件"
      >
        <p class="catalog-view__eyebrow">{{ query.trim() || category ? `筛选结果 / ${sidebarItems.length}` : '同类组件' }}</p>
        <p v-if="!sidebarItems.length" class="catalog-view__empty-side">没有匹配的组件。</p>
        <a v-for="item in sidebarItems" :key="item.name" :href="href(item.name)" :aria-current="item.name === active.name ? 'page' : undefined">
          <span>{{ item.label }}</span><code>{{ item.name }}</code>
        </a>
      </nav>
    </aside>

    <article v-if="active" class="catalog-view__main catalog-view__document">
      <header class="catalog-view__lead">
        <p class="catalog-view__breadcrumb">
          <a href="#/components" class="catalog-view__back">← 组件目录</a>
          <span aria-hidden="true">/</span><span>{{ active.category }}</span>
        </p>
        <div class="catalog-view__doc-title">
          <h1 id="component-page-heading" ref="heading" tabindex="-1">{{ active.label }}</h1>
          <code>{{ active.name }}</code>
        </div>
        <p class="catalog-view__description">{{ active.description }}</p>
        <div class="catalog-view__metadata">
          <span>VUE 3</span><span>{{ active.stories.length }} 个交互示例</span>
          <a class="catalog-view__source" :href="sourceUrl" target="_blank" rel="noopener noreferrer">查看源码 <span aria-hidden="true">↗</span></a>
        </div>
        <CodeBlock :key="active.name" :code="`import { ${active.name} } from 'malang-ui';`" language="typescript" filename="导入组件" />
      </header>

      <nav class="catalog-view__toc" aria-label="本页目录">
        <p>本页目录</p>
        <button v-for="section in docSections" :key="section.id" type="button" :aria-controls="section.id" :aria-current="currentSection === section.id ? 'location' : undefined" @click="jumpTo(section.id)">{{ section.label }}</button>
      </nav>

      <div class="catalog-view__doc-body">
        <section v-if="hasExamples" class="catalog-view__chapter" aria-labelledby="catalog-examples">
          <h2 id="catalog-examples" tabindex="-1">常用示例</h2>
          <ComponentExamples :key="active.name" :name="active.name" />
        </section>

        <section class="catalog-view__chapter" aria-labelledby="catalog-story">
          <h2 id="catalog-story" tabindex="-1">更多示例</h2>
          <section class="catalog-view__demo" aria-label="组件预览">
            <div class="catalog-view__demo-bar">
              <div class="catalog-view__tabs" role="group" aria-label="示例和文档">
                <button type="button" class="catalog-view__tab-current" @click="jumpTo('catalog-story')">交互示例</button>
                <button type="button" @click="jumpTo('catalog-api')">API 文档</button>
              </div>
              <div v-if="active.stories.length > 1" class="catalog-view__story-choice">
                <label :for="storySelectorId">示例</label>
                <select :id="storySelectorId" v-model="storyId">
                  <option v-for="story in active.stories" :key="story.id" :value="story.id">{{ story.label }}</option>
                </select>
              </div>
              <p v-else class="catalog-view__single-story">{{ active.stories[0]?.label }}</p>
            </div>

            <div ref="stage" class="catalog-view__stage" :data-preview-size="previewSize" :aria-busy="frameState === 'loading'">
              <iframe
                v-if="nearViewport && previewUrl"
                :key="`${previewUrl}#${attempt}`"
                ref="frame"
                :src="previewUrl"
                :title="`${active.label} · 交互示例`"
                :class="{ 'catalog-view__frame--ready': frameState === 'ready' }"
                :aria-hidden="frameState !== 'ready' ? true : undefined"
                :tabindex="frameState !== 'ready' ? -1 : undefined"
                loading="lazy"
                @error="finishPreview('error')"
              />
              <div v-if="frameState !== 'ready'" class="catalog-view__preview-note">
                <p v-if="frameState === 'loading'" role="status">正在载入交互示例…</p>
                <template v-else>
                  <p role="status">预览暂未就绪。</p>
                  <button type="button" @click="attempt += 1">重新载入</button>
                </template>
              </div>
            </div>
            <div class="catalog-view__demo-footer">
              <span>STORYBOOK / 组件工作台</span>
              <a :href="previewUrl" target="_blank" rel="noopener noreferrer">在新窗口打开 <span aria-hidden="true">↗</span></a>
            </div>
          </section>
        </section>

        <section class="catalog-view__chapter catalog-view__api" aria-labelledby="catalog-api">
          <div class="catalog-view__chapter-head">
            <h2 id="catalog-api" tabindex="-1">API 参考</h2>
            <a v-if="docsUrl" :href="docsUrl" target="_blank" rel="noopener noreferrer">在 Storybook 查看完整文档 <span aria-hidden="true">↗</span></a>
          </div>
          <template v-if="api">
            <h3 id="catalog-api-props">Props</h3>
            <div v-if="api.props.length" class="catalog-view__table-wrap" role="region" aria-label="Props 表格" tabindex="0">
              <table class="catalog-view__table catalog-view__table--props" aria-labelledby="catalog-api-props">
                <thead><tr><th scope="col">属性</th><th scope="col">类型</th><th scope="col">默认值</th><th scope="col">说明</th></tr></thead>
                <tbody>
                  <tr v-for="prop in api.props" :key="prop.name">
                    <th scope="row"><code>{{ prop.name }}</code><small v-if="prop.required">必填</small></th>
                    <td><code :title="prop.expandedType ? prop.type : undefined">{{ prop.expandedType || prop.type }}</code></td>
                    <td><code v-if="prop.defaultValue !== undefined">{{ prop.defaultValue === '' ? "''" : prop.defaultValue }}</code><span v-else>—</span></td>
                    <td>{{ prop.description || '—' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p v-else class="catalog-view__api-empty">没有独立声明的属性。</p>

            <h3 id="catalog-api-events">Events</h3>
            <div v-if="api.events.length" class="catalog-view__table-wrap">
              <table class="catalog-view__table" aria-labelledby="catalog-api-events">
                <thead><tr><th scope="col">事件</th><th scope="col">参数</th></tr></thead>
                <tbody><tr v-for="event in api.events" :key="event.name"><th scope="row"><code>{{ event.name }}</code></th><td><code>{{ event.type }}</code></td></tr></tbody>
              </table>
            </div>
            <p v-else class="catalog-view__api-empty">没有独立声明的事件。</p>

            <h3 id="catalog-api-slots">Slots</h3>
            <div v-if="api.slots.length" class="catalog-view__table-wrap">
              <table class="catalog-view__table" aria-labelledby="catalog-api-slots">
                <thead><tr><th scope="col">插槽</th></tr></thead>
                <tbody><tr v-for="slot in api.slots" :key="slot.name"><th scope="row"><code>{{ slot.name }}</code></th></tr></tbody>
              </table>
            </div>
            <p v-else class="catalog-view__api-empty">没有独立声明的插槽。</p>
          </template>
          <p v-else class="catalog-view__api-empty">当前没有可展示的 API 声明。</p>
        </section>

        <section class="catalog-view__chapter" aria-labelledby="catalog-related">
          <h2 id="catalog-related" tabindex="-1">相关组件</h2>
          <ul class="catalog-view__related">
            <li v-for="item in relatedComponents" :key="item.name">
              <a :href="href(item.name)"><strong>{{ item.label }}</strong><code>{{ item.name }}</code><span aria-hidden="true">↗</span></a>
            </li>
          </ul>
          <nav class="catalog-view__pagination" aria-label="前后组件">
            <a v-if="previousComponent" :href="href(previousComponent.name)"><span>← 上一组件</span><strong>{{ previousComponent.label }}</strong></a>
            <a v-if="nextComponent" class="catalog-view__next" :href="href(nextComponent.name)"><span>下一组件 →</span><strong>{{ nextComponent.label }}</strong></a>
          </nav>
        </section>
      </div>
    </article>

    <div v-else class="catalog-view__main">
      <header class="catalog-view__header">
        <p class="catalog-view__eyebrow">MA·LANG UI / COMPONENTS</p>
        <h1 id="component-page-heading" ref="heading" tabindex="-1">{{ componentName ? '找不到该组件' : '组件目录' }}</h1>
        <p class="catalog-view__description">
          {{ componentName ? `目录中没有 ${componentName}，可以按名称或用途查找。` : '从基础操作到完整业务流程。打开任意组件，查看使用场景和可操作的状态。' }}
        </p>
      </header>
      <p class="catalog-view__count" role="status">{{ matches.length }} / {{ componentCatalog.length }} 个组件</p>
      <div v-if="!sections.length" class="catalog-view__empty">
        <p>没有匹配的组件。</p>
        <button type="button" @click="query = ''; category = ''">清空筛选</button>
      </div>
      <section v-for="group in sections" :key="group.name" class="catalog-view__group" :aria-label="group.name">
        <h2>{{ group.name }} <span>{{ group.items.length }}</span></h2>
        <ul class="catalog-view__items">
          <li v-for="item in group.items" :key="item.name">
            <a :href="href(item.name)">
              <span class="catalog-view__item-heading"><strong>{{ item.label }}</strong><code>{{ item.name }}</code></span>
              <span class="catalog-view__item-description">{{ item.description }}</span>
              <span class="catalog-view__item-arrow" aria-hidden="true">↗</span>
            </a>
          </li>
        </ul>
      </section>
    </div>
  </section>
</template>
