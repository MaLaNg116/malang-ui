import type { CSSProperties } from 'vue';

export type MLayoutBreakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type MLayoutResponsive<T> = T | Partial<Record<MLayoutBreakpoint, T>>;
export type MLayoutGap = number | string;
export type MLayoutTarget = string | HTMLElement | Window | (() => HTMLElement | Window | null);
export interface MGridProps { columns?: MLayoutResponsive<number>; gap?: MLayoutResponsive<MLayoutGap>; rowGap?: MLayoutResponsive<MLayoutGap>; align?: CSSProperties['alignItems']; }
export interface MGridItemProps { span?: MLayoutResponsive<number>; offset?: MLayoutResponsive<number>; }
export interface MFlexProps { direction?: MLayoutResponsive<'row' | 'column' | 'row-reverse' | 'column-reverse'>; gap?: MLayoutResponsive<MLayoutGap>; align?: CSSProperties['alignItems']; justify?: CSSProperties['justifyContent']; wrap?: boolean; inline?: boolean; }
export interface MLayoutProps { asideWidth?: MLayoutResponsive<MLayoutGap>; gap?: MLayoutGap; label?: string; }
export interface MSplitterProps { modelValue?: number; min?: number; max?: number; orientation?: 'horizontal' | 'vertical'; collapsible?: boolean; disabled?: boolean; label?: string; }
export interface MMasonryProps<Item extends object = object> { items: readonly Item[]; columns?: MLayoutResponsive<number>; gap?: MLayoutGap; itemKey?: string | ((item: Item, index: number) => string | number); label?: string; }
export interface MAnchorItem { href: string; label: string; children?: readonly MAnchorItem[]; }
export interface MAnchorProps { items: readonly MAnchorItem[]; target?: MLayoutTarget; offset?: number; label?: string; }
export interface MAffixProps { target?: MLayoutTarget; offset?: number; position?: 'top' | 'bottom'; }
export interface MPageHeaderProps { title: string; subtitle?: string; back?: boolean; backLabel?: string; }
export interface MFloatButtonProps { label: string; description?: string; badge?: string | number; disabled?: boolean; href?: string; }
export interface MFloatButtonGroupProps { modelValue?: boolean; label?: string; expandable?: boolean; }
export interface MCarouselItem { key: string; label: string; }
export interface MCarouselProps { items: readonly MCarouselItem[]; modelValue?: number; autoplay?: boolean; interval?: number; loop?: boolean; label?: string; }
export type MTourTarget = string | HTMLElement | (() => HTMLElement | null);
export interface MTourStep { key: string; title: string; description?: string; target?: MTourTarget; }
export interface MTourProps { modelValue: boolean; steps: readonly MTourStep[]; step?: number; label?: string; }
export interface MWatermarkProps { content?: string | readonly string[]; image?: string; gap?: readonly [number, number]; rotate?: number; opacity?: number; fontSize?: number; color?: string; }
export interface MBorderBeamProps { count?: number; duration?: number; color?: string; width?: number; }
