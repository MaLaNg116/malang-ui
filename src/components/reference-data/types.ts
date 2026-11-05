import type { MChoiceOption, MTableColumn, MTreeNode } from '../types';

export type MDataKey = string | number;
export type MVirtualAlign = 'auto' | 'start' | 'center' | 'end';
export interface MListProps<Item = unknown> {
  items: readonly Item[];
  label: string;
  itemKey?: string | ((item: Item, index: number) => MDataKey);
  loading?: boolean;
  emptyText?: string;
}
export interface MVirtualListProps<Item = unknown> extends MListProps<Item> {
  height?: number;
  itemHeight?: number;
  overscan?: number;
  selectable?: boolean;
  modelValue?: MDataKey | null;
  disabled?: boolean;
}
export interface MListyProps<Item = unknown> extends MVirtualListProps<Item> {
  /** Visible row numbers remain absolute when the window moves. */
  numbered?: boolean;
}
export interface MVirtualTableProps<Row extends object = Record<string, unknown>> {
  rows: readonly Row[];
  columns: readonly MTableColumn[];
  caption: string;
  rowKey?: string | ((row: Row, index: number) => MDataKey);
  height?: number;
  itemHeight?: number;
  overscan?: number;
  sort?: { key: string; order: 'asc' | 'desc' } | null;
  selectable?: boolean;
  selectedKeys?: readonly MDataKey[];
  loading?: boolean;
}
export interface MVirtualTreeProps {
  items: readonly MTreeNode[];
  label: string;
  modelValue: string | null;
  expandedValues: readonly string[];
  height?: number;
  itemHeight?: number;
  overscan?: number;
  disabled?: boolean;
}
export type MVirtualSelectValue<Multiple extends boolean = false> = Multiple extends true ? readonly string[] : string;
export interface MVirtualSelectProps<Multiple extends boolean = false> {
  modelValue: MVirtualSelectValue<Multiple>;
  options: readonly MChoiceOption[];
  label: string;
  id?: string;
  multiple?: Multiple & boolean;
  placeholder?: string;
  disabled?: boolean;
  readonly?: boolean;
  required?: boolean;
  name?: string;
  form?: string;
  hint?: string;
  error?: string;
  height?: number;
  itemHeight?: number;
  overscan?: number;
}
export interface MScrollbarProps {
  height?: string | number;
  maxHeight?: string | number;
  viewportClass?: string;
  label?: string;
}
export interface MInfiniteScrollProps {
  loading?: boolean;
  disabled?: boolean;
  finished?: boolean;
  error?: string;
  distance?: number;
  height?: string | number;
  label?: string;
}
export interface MAutoCompleteProps {
  modelValue: string;
  options: readonly MChoiceOption[];
  label: string;
  id?: string;
  placeholder?: string;
  hint?: string;
  error?: string;
  name?: string;
  form?: string;
  required?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  loading?: boolean;
  clearable?: boolean;
  /** Disable local matching when options are already filtered by the application. */
  filter?: boolean;
}
export interface MVirtualScrollHandle {
  scrollToIndex(index: number, align?: MVirtualAlign): void;
  scrollTo(options: ScrollToOptions): void;
}
