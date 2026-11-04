import { defineComponent, ref } from 'vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { MBadge, MButton, MCard, MDivider, MInput, MProgress, MSwitch, MTooltip } from '../src';
import contract from '../design/quality-contract.json';
import './DesignLanguage.css';
const DesignLanguage = defineComponent({
  components: { MBadge, MButton, MCard, MDivider, MInput, MProgress, MSwitch, MTooltip },
  setup() { return { contract, name: ref('观山 · 设计档案'), enabled: ref(true), amount: ref(42), colors: [{ name: '墨', token: '--ui-color-text' }, { name: '纸', token: '--ui-color-surface' }, { name: '朱砂', token: '--ui-color-accent' }, { name: '青玉', token: '--ui-color-secondary-accent' }, { name: '冷金属', token: '--ui-color-metal' }] }; },
  template: `<main class="design-language"><header><p class="design-language__eyebrow">MALANG / DESIGN LANGUAGE</p><h1>笔有骨，器有锋。</h1><p class="design-language__intro">功夫朋克的识别度，来自墨色、刻印和机械秩序；舒适与顺手，来自稳定的文字、留白和操作反馈。</p><div class="design-language__materials"><MBadge v-for="material in contract.materials" :key="material">{{ material }}</MBadge></div></header>
    <section class="design-language__specimen" aria-label="组件语言样本"><div class="design-language__specimen-title"><span aria-hidden="true">M</span><div><h2>落笔与归位</h2><p>MInput / m-input · MButton / m-button</p></div></div><div class="design-language__controls"><m-input v-model="name" label="档案名称" hint="墨线焦点与折锋边角，文字保留呼吸。" /><div class="design-language__actions"><MButton @click="amount = Math.min(100, amount + 29)">推进校准 <span aria-hidden="true">↗</span></MButton><MButton variant="secondary" @click="amount = 0">重新落笔</MButton><MTooltip label="铭牌说明" text="对角切口、朱砂刻印与短促归位，共同构成提示语言。">说明</MTooltip></div><MProgress label="校准进度" :value="amount" :status="amount === 100 ? 'success' : 'default'" /><MSwitch v-model="enabled" label="归位反馈" hint="这是独立开关样本，主题和动态偏好由顶部工具栏调整。" /></div></section>
    <section aria-labelledby="language-colors"><h2 id="language-colors">五色，各司其职。</h2><div class="design-language__palette"><div v-for="color in colors" :key="color.name"><span :style="{ background: 'var(' + color.token + ')' }" aria-hidden="true"></span><p>{{ color.name }}</p><code>{{ color.token }}</code></div></div></section>
    <MDivider label="七项品质，共同成立" /><section class="design-language__qualities" aria-label="设计品质约定"><MCard v-for="(quality, index) in contract.qualities" :key="quality.name" :title="quality.name" heading-tag="h2"><p>{{ quality.practice }}</p><template #footer><span class="design-language__quality-index" aria-hidden="true">{{ String(index + 1).padStart(2, '0') }}</span><p>{{ quality.evidence }}</p></template></MCard></section>
    <footer><p>{{ contract.motion.principle }}</p><div><code>100ms 反馈</code><code>190ms 归位</code><code>340ms 展开</code></div></footer></main>`,
});
const meta = { title: '开始/功夫朋克规范', component: DesignLanguage, parameters: { layout: 'fullscreen', controls: { disable: true } } } satisfies Meta<typeof DesignLanguage>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = { name: '骨力 · 刻印 · 机关' };
