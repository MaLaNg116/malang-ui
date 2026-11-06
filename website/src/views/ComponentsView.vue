<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue';
import CodeBlock from '../components/CodeBlock.vue';
import DocDemo from '../components/DocDemo.vue';
import { componentApi } from '../data/api';
import { componentCatalog, componentCategories } from '../data/catalog';
import { getComponentExamples } from '../data/examples';
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
const navigationOpen = ref(false);
const navigation = ref<HTMLElement | null>(null);
const navigationToggle = ref<HTMLButtonElement | null>(null);
const toc = ref<HTMLElement | null>(null);
const searchId = useId();
const navigationId = useId();
const active = computed(() => componentCatalog.find((item) => item.name === props.componentName));
const normalize = (value: string) => value.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
const searchIndex = componentCatalog.map((item) => ({
  item,
  terms: [item.name, item.label, item.category, item.description, ...item.keywords].map(normalize),
}));
const searchTerms = computed(() => query.value.trim().split(/\s+/).map(normalize).filter(Boolean));
const matches = computed(() => searchIndex.filter(({ terms }) => searchTerms.value.every(
  (term) => terms.some((word) => word.includes(term)),
)).map(({ item }) => item));
const groups = computed(() => componentCategories.map((name) => ({
  name,
  items: matches.value.filter((item) => item.category === name),
})).filter((section) => section.items.length));
const overviewGroups = computed(() => groups.value.filter((group) => !category.value || group.name === category.value));
const overviewCount = computed(() => overviewGroups.value.reduce((count, group) => count + group.items.length, 0));

const href = (name: string) => `#/components/${name}`;
const sourceUrl = computed(() => active.value ? `https://github.com/MaLaNg116/malang-ui/blob/main/${active.value.source}` : '');
const workbenchUrl = computed(() => {
  if (!active.value) return '';
  const { docsId, storyId } = active.value;
  const base = import.meta.env.DEV ? 'http://127.0.0.1:6006/' : './workbench/';
  const params = new URLSearchParams({
    path: docsId ? `/docs/${docsId}` : `/story/${storyId}`,
    globals: `theme:${props.theme};palette:${props.palette};motion:${props.motion}`,
  });
  return `${base}?${params}`;
});
const api = computed(() => active.value && componentApi[active.value.name]);
const examples = computed(() => active.value ? getComponentExamples(active.value.name) : []);
const demoHeading = (id: string) => `catalog-demo-${id}`;
const docSections = computed(() => [
  { id: 'catalog-examples', label: '示例', nested: false },
  ...examples.value.map(({ id, title }) => ({ id: demoHeading(id), label: title, nested: true })),
  { id: 'catalog-api', label: 'API 参考', nested: false },
  ...(api.value?.types?.length ? [{ id: 'catalog-api-types', label: '关联类型', nested: true }] : []),
  { id: 'catalog-related', label: '相关组件', nested: false },
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
  MMenu: ['MTabs', 'MAnchor', 'MDropdownMenu'],
};
const relatedComponents = computed(() => {
  if (!active.value) return [];
  const names = relatedNames[active.value.name];
  if (names) return names.flatMap((name) => componentCatalog.filter((item) => item.name === name));
  return componentCatalog.filter((item) => item.category === active.value?.category && item !== active.value).slice(0, 3);
});

function keepActiveNavigationVisible() {
  const list = navigation.value;
  const link = list?.querySelector('[aria-current="page"]');
  if (!list || !link || !list.clientHeight) return;
  const bounds = list.getBoundingClientRect();
  const item = link.getBoundingClientRect();
  if (item.top < bounds.top || item.bottom > bounds.bottom) {
    list.scrollTop += item.top + item.height / 2 - bounds.top - bounds.height / 2;
  }
}

function closeNavigation(restoreFocus = false) {
  navigationOpen.value = false;
  if (restoreFocus) navigationToggle.value?.focus({ preventScroll: true });
}

function navigate(event: MouseEvent, name: string) {
  if (!navigationOpen.value || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
  closeNavigation(active.value?.name === name);
}

function dismissNavigation(event: KeyboardEvent) {
  if (!navigationOpen.value) return;
  event.preventDefault();
  event.stopPropagation();
  closeNavigation(true);
}

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

function handleResize() {
  keepActiveNavigationVisible();
  scheduleSectionUpdate();
}

watch(() => props.componentName, async () => {
  closeNavigation();
  jumpPosition = undefined;
  currentSection.value = docSections.value[0]?.id;
  await nextTick();
  heading.value?.focus();
  scheduleSectionUpdate();
});

watch([active, matches, navigationOpen], keepActiveNavigationVisible, { flush: 'post' });

watch(currentSection, () => {
  const list = toc.value;
  const item = list?.querySelector('[aria-current="location"]');
  if (!list || !item || list.scrollWidth <= list.clientWidth) return;
  const bounds = list.getBoundingClientRect();
  const selected = item.getBoundingClientRect();
  if (selected.left < bounds.left) list.scrollLeft += selected.left - bounds.left;
  else if (selected.right > bounds.right) list.scrollLeft += selected.right - bounds.right;
}, { flush: 'post' });

onMounted(() => {
  keepActiveNavigationVisible();
  window.addEventListener('scroll', scheduleSectionUpdate, { passive: true });
  window.addEventListener('resize', handleResize);
  scheduleSectionUpdate();
});
onBeforeUnmount(() => {
  if (sectionFrame !== undefined) cancelAnimationFrame(sectionFrame);
  window.removeEventListener('scroll', scheduleSectionUpdate);
  window.removeEventListener('resize', handleResize);
});
</script>

<template>
  <section class="catalog-view" aria-labelledby="component-page-heading">
    <aside class="catalog-view__sidebar" :class="{ 'catalog-view__sidebar--open': navigationOpen }" aria-label="组件目录侧栏" @keydown.esc="dismissNavigation">
      <button
        ref="navigationToggle"
        type="button"
        class="catalog-view__navigation-toggle"
        :aria-expanded="navigationOpen"
        :aria-controls="navigationId"
        @click="navigationOpen = !navigationOpen"
      >
        {{ navigationOpen ? '关闭组件导航' : '打开组件导航' }}
        <span aria-hidden="true">{{ navigationOpen ? '−' : '+' }}</span>
      </button>
      <div :id="navigationId" class="catalog-view__side-content">
        <div class="catalog-view__side-header">
          <p class="catalog-view__eyebrow">COMPONENTS <span>{{ componentCatalog.length }}</span></p>
          <label :for="searchId" class="catalog-view__search-label">搜索组件</label>
          <div class="catalog-view__search">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" aria-hidden="true">
              <circle cx="6.5" cy="6.5" r="4" /><path d="m9.5 9.5 4 4" />
            </svg>
            <input :id="searchId" v-model="query" type="search" placeholder="名称、分类或用途" autocomplete="off" />
          </div>
          <p v-if="active && searchTerms.length" class="catalog-view__search-count" role="status">{{ matches.length }} 个匹配</p>
        </div>
        <nav ref="navigation" class="catalog-view__navigation" aria-label="组件导航">
          <p v-if="!groups.length" class="catalog-view__empty-side">没有匹配的组件。</p>
          <div v-for="group in groups" :key="group.name" class="catalog-view__nav-group">
            <p>{{ group.name }}</p>
            <ul>
              <li v-for="item in group.items" :key="item.name">
                <a :href="href(item.name)" :aria-current="item.name === active?.name ? 'page' : undefined" @click="navigate($event, item.name)">
                  <span>{{ item.label }}</span><code>{{ item.name.slice(1) }}</code>
                </a>
              </li>
            </ul>
          </div>
        </nav>
      </div>
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
          <span>VUE 3</span>
          <a class="catalog-view__source" :href="sourceUrl" target="_blank" rel="noopener noreferrer">查看源码 <span aria-hidden="true">↗</span></a>
          <a class="catalog-view__source" :href="workbenchUrl" target="_blank" rel="noopener noreferrer">在 Storybook 查看 <span aria-hidden="true">↗</span></a>
        </div>
        <CodeBlock :key="active.name" :code="`import { ${active.name} } from 'malang-ui';`" language="typescript" filename="导入组件" />
        <p class="catalog-view__style-note">在应用入口导入 <code>malang-ui/style.css</code>，加载组件样式和主题变量。</p>
      </header>

      <nav ref="toc" class="catalog-view__toc" aria-label="本页目录">
        <p>本页目录</p>
        <button v-for="section in docSections" :key="section.id" type="button" :class="{ 'catalog-view__toc-subitem': section.nested }" :aria-controls="section.id" :aria-current="currentSection === section.id ? 'location' : undefined" @click="jumpTo(section.id)">{{ section.label }}</button>
      </nav>

      <div class="catalog-view__doc-body">
        <section class="catalog-view__chapter" aria-labelledby="catalog-examples">
          <h2 id="catalog-examples" tabindex="-1">示例</h2>
          <DocDemo
            v-for="example in examples"
            :key="`${active.name}-${example.id}`"
            :heading-id="demoHeading(example.id)"
            :example="example"
          />
        </section>

        <section class="catalog-view__chapter catalog-view__api" aria-labelledby="catalog-api">
          <h2 id="catalog-api" tabindex="-1">API 参考</h2>
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

            <template v-if="api.types?.length">
              <h3 id="catalog-api-types" tabindex="-1">关联类型</h3>
              <details v-for="type in api.types" :key="type.name" class="catalog-view__related-type">
                <summary><code>{{ type.name }}</code></summary>
                <CodeBlock :code="type.source" :filename="`${type.name}.ts`" language="typescript" />
              </details>
            </template>
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
      <nav class="catalog-view__categories" aria-label="组件分类">
        <button type="button" :aria-pressed="!category" @click="category = ''">全部组件</button>
        <button v-for="name in componentCategories" :key="name" type="button" :aria-pressed="category === name" @click="category = name">{{ name }}</button>
      </nav>
      <p class="catalog-view__count" role="status">{{ overviewCount }} / {{ componentCatalog.length }} 个组件</p>
      <div v-if="!overviewGroups.length" class="catalog-view__empty">
        <p>没有匹配的组件。</p>
        <button type="button" @click="query = ''; category = ''">清空筛选</button>
      </div>
      <section v-for="group in overviewGroups" :key="group.name" class="catalog-view__group" :aria-label="group.name">
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
