<script setup lang="ts">
import { ref } from 'vue';
import { MGrid, MGridItem, MFlex, MLayout, MSplitter, MMasonry, MAnchor, MAffix, MPageHeader, MFloatButton, MFloatButtonGroup, MCarousel, MTour, MWatermark, MBorderBeam } from 'malang-ui';
import type { MGridProps, MGridItemProps, MFlexProps, MLayoutProps, MSplitterProps, MMasonryProps, MAnchorProps, MAffixProps, MPageHeaderProps, MFloatButtonProps, MFloatButtonGroupProps, MCarouselProps, MTourProps, MWatermarkProps, MBorderBeamProps, MLayoutResponsive, MTourStep } from 'malang-ui';
interface ArchiveTile { id: string; title: string; height: number }
const tile: ArchiveTile = { id: 'one', title: '原创构形', height: 120 }, items = [tile];
const responsiveColumns: MLayoutResponsive<number> = { xs: 1, md: 6 };
const grid: MGridProps = { columns: responsiveColumns, gap: { xs: 8, md: 20 } }, cell: MGridItemProps = { span: { xs: 1, md: 3 } };
const flex: MFlexProps = { direction: { xs: 'column', md: 'row' }, gap: 12, wrap: true };
const layout: MLayoutProps = { asideWidth: { xs: 160, lg: 240 }, label: '消费者布局' };
const split: MSplitterProps = { min: 20, max: 80, collapsible: true }, percent = ref(40);
const masonry: MMasonryProps<ArchiveTile> = { items, itemKey: item => item.id, columns: 2 };
const scroll = ref<HTMLElement>(), anchor: MAnchorProps = { items: [{ href: '#consumer-layout-detail', label: '资料正文' }], target: () => scroll.value ?? null };
const affix: MAffixProps = { target: () => scroll.value ?? null, offset: 8 };
const heading: MPageHeaderProps = { title: '页面资料', back: true }, float: MFloatButtonProps = { label: '保存', badge: 2 }, floats: MFloatButtonGroupProps = { label: '消费者操作' };
const carousel: MCarouselProps = { items: [{ key: 'one', label: '第一卷' }], autoplay: false }, page = ref(0);
const steps: readonly MTourStep[] = [{ key: 'detail', title: '阅读资料', target: '#consumer-layout-detail' }];
const tour: Omit<MTourProps,'modelValue'> = { steps }, open = ref(false), step = ref(0), expanded = ref(false);
const watermark: MWatermarkProps = { content: ['MaLang', '消费者'], gap: [80, 60] }, beam: MBorderBeamProps = { count: 3, duration: 4 };
</script>
<template>
  <MLayout v-bind="layout"><template #header><MPageHeader v-bind="heading" @back="open=false"/></template><template #aside><MAnchor v-bind="anchor"/></template>
    <div ref="scroll"><MAffix v-bind="affix"><p>独立滚动工具</p></MAffix><MGrid v-bind="grid"><MGridItem v-bind="cell"><MFlex v-bind="flex"><span>{{ tile.title }}</span></MFlex></MGridItem></MGrid>
      <MSplitter v-bind="split" v-model="percent"><template #first><MCarousel v-bind="carousel" v-model="page"><template #one><p>可读页面</p></template></MCarousel></template><template #second><MMasonry v-bind="masonry"><template #item="{item,index}"><article :style="{height:item.height+'px'}">{{item.title}} / {{index}}</article></template></MMasonry></template></MSplitter>
      <MWatermark v-bind="watermark"><MBorderBeam v-bind="beam"><p id="consumer-layout-detail">原始资料</p></MBorderBeam></MWatermark></div>
    <MFloatButtonGroup v-bind="floats" v-model="expanded"><MFloatButton v-bind="float" @click="open=true"/></MFloatButtonGroup><MTour v-bind="tour" v-model="open" v-model:step="step"/>
  </MLayout>
</template>
